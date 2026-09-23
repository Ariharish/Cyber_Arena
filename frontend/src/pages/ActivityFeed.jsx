import { useState, useEffect } from 'react'
import { getAttacks } from '../services/api'
import { getSocket } from '../services/socket'
import AttackCard from '../components/AttackCard'

function FilterPill({ label, active, color, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${active ? color + '55' : '#1e2d4a'}`,
                background: active ? `${color}18` : 'rgba(0,0,0,0.3)',
                color: active ? color : '#475569',
                transition: 'all 0.15s',
            }}
        >
            {label}
        </button>
    )
}

export default function ActivityFeed() {
    const [attacks, setAttacks] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [liveCount, setLiveCount] = useState(0)

    const fetchAttacks = async () => {
        try {
            const res = await getAttacks(100)
            setAttacks(res.data.attacks || [])
        } catch {
            setAttacks([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAttacks()
        const socket = getSocket()
        const handleAlert = (data) => {
            setLiveCount((c) => c + 1)
            fetchAttacks()
        }
        socket.on('attack_alert', handleAlert)
        return () => socket.off('attack_alert', handleAlert)
    }, [])

    const TYPE_MAP = {
        'SQL': 'SQL Injection',
        'XSS': 'Cross-Site Scripting (XSS)',
        'BRUTE': 'Brute Force Login',
        'CMD': 'Command Injection',
    }

    const filtered = filter === 'ALL'
        ? attacks
        : attacks.filter((a) => a.attack_type === TYPE_MAP[filter] || a.severity === filter)

    const FILTERS = [
        { label: 'All', value: 'ALL', color: '#64748b' },
        { label: 'SQLi', value: 'SQL', color: '#a55eea' },
        { label: 'XSS', value: 'XSS', color: '#ffd32a' },
        { label: 'Brute Force', value: 'BRUTE', color: '#00d4ff' },
        { label: 'CMD Inject', value: 'CMD', color: '#ff4757' },
        { label: 'CRITICAL', value: 'CRITICAL', color: '#ff4757' },
        { label: 'HIGH', value: 'HIGH', color: '#ff9f43' },
    ]

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-bold text-xl" style={{ color: '#e2e8f0' }}>Cyber Threat Feed</h2>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        Real-time attack event stream
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {liveCount > 0 && (
                        <button
                            onClick={() => { setLiveCount(0); fetchAttacks() }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757', cursor: 'pointer' }}
                        >
                            <div className="pulse-dot" style={{ background: '#ff4757', width: 6, height: 6 }} />
                            {liveCount} new {liveCount === 1 ? 'attack' : 'attacks'}
                        </button>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                        {filtered.length} events
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTERS.map((f) => (
                    <FilterPill
                        key={f.value}
                        label={f.label}
                        value={f.value}
                        active={filter === f.value}
                        color={f.color}
                        onClick={() => setFilter(f.value)}
                    />
                ))}
            </div>

            {/* Feed */}
            {loading ? (
                <div className="flex flex-col items-center py-16 gap-3">
                    <div className="pulse-dot" style={{ background: '#00d4ff', width: 12, height: 12 }} />
                    <span style={{ color: '#334155' }}>Loading threat feed...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed #1e2d4a' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>📡</div>
                    <div style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>
                        {filter === 'ALL' ? 'No attacks recorded yet' : `No ${filter} attacks found`}
                    </div>
                    <div style={{ color: '#1e2d4a', fontSize: '0.78rem', marginTop: 6 }}>
                        Launch an attack from the Red Team Console to populate this feed
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map((attack) => (
                        <AttackCard key={attack.attack_id || attack._id} attack={attack} />
                    ))}
                </div>
            )}
        </div>
    )
}
