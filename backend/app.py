"""
CyberArena — Flask Backend Entry Point
"""

import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

from config import MONGO_URI, SECRET_KEY, CORS_ORIGIN, DB_NAME
from routes.attacks import attacks_bp, init_attacks
from routes.targets import targets_bp
from sockets.events import register_events

# ── App Setup ──────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY

CORS(app, origins=CORS_ORIGIN, supports_credentials=True)

socketio = SocketIO(
    app,
    cors_allowed_origins=CORS_ORIGIN,
    async_mode="eventlet",
    logger=False,
    engineio_logger=False,
)

# ── MongoDB Connection ─────────────────────────────────────────
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.admin.command("ping")
    db = client[DB_NAME]
    print(f"✅ MongoDB connected: {MONGO_URI}")
except ConnectionFailure:
    print("⚠️  MongoDB not available. Using in-memory fallback.")

    class InMemoryDB:
        """Lightweight in-memory database fallback when MongoDB is unavailable."""

        def __init__(self):
            self._collections = {}

        def __getattr__(self, name):
            if name not in self._collections:
                self._collections[name] = InMemoryCollection()
            return self._collections[name]

    class InMemoryCollection:
        def __init__(self):
            self._docs = []
            self._counter = 0

        def insert_one(self, doc):
            self._counter += 1
            doc["_id"] = str(self._counter)
            self._docs.append(dict(doc))

            class InsertResult:
                inserted_id = str(self._counter)

            return InsertResult()

        def find(self, filter=None):
            return InMemoryCursor(list(self._docs))

        def find_one(self, filter):
            for doc in self._docs:
                if all(doc.get(k) == v for k, v in filter.items()):
                    return dict(doc)
            return None

        def count_documents(self, filter=None):
            if not filter:
                return len(self._docs)
            count = 0
            for doc in self._docs:
                if all(str(doc.get(k, "")).startswith(v.get("$regex", "").lstrip("^"))
                       if isinstance(v, dict) else doc.get(k) == v
                       for k, v in filter.items()):
                    count += 1
            return count

        def update_one(self, filter, update):
            for doc in self._docs:
                if all(doc.get(k) == v for k, v in filter.items()):
                    if "$set" in update:
                        doc.update(update["$set"])
                    break

        def aggregate(self, pipeline):
            # Simple group-by aggregation
            results = {}
            for doc in self._docs:
                for stage in pipeline:
                    if "$group" in stage:
                        group_field = stage["$group"]["_id"].lstrip("$")
                        key = doc.get(group_field, "Unknown")
                        results[key] = results.get(key, 0) + 1
            return [{"_id": k, "count": v} for k, v in results.items()]

    class InMemoryCursor:
        def __init__(self, docs):
            self._docs = docs
            self._sorted = False

        def sort(self, field, direction):
            reverse = direction == -1
            self._docs.sort(key=lambda d: d.get(field, ""), reverse=reverse)
            return self

        def skip(self, n):
            self._docs = self._docs[n:]
            return self

        def limit(self, n):
            self._docs = self._docs[:n]
            return self

        def __iter__(self):
            return iter(self._docs)

    db = InMemoryDB()

# ── Register Routes & Sockets ──────────────────────────────────
init_attacks(db, socketio)
app.register_blueprint(attacks_bp)
app.register_blueprint(targets_bp)
register_events(socketio)


@app.route("/api/health")
def health():
    return {"status": "ok", "service": "CyberArena Backend", "version": "1.0.0"}


# ── Run ────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 CyberArena backend starting on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
