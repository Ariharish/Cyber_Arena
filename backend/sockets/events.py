"""
Socket.IO Event Handlers
"""

connected_clients = set()


def register_events(socketio):
    @socketio.on("connect")
    def handle_connect():
        print(f"[SocketIO] Client connected")

    @socketio.on("disconnect")
    def handle_disconnect():
        print(f"[SocketIO] Client disconnected")

    @socketio.on("join_blue_team")
    def handle_join(data):
        print(f"[SocketIO] Blue team client joined")
        socketio.emit("welcome", {"message": "Connected to CyberArena SOC feed"})
