import { useState, useEffect, useCallback } from 'react'
import { getStats, getAttacks } from '../services/api'
import { getSocket } from '../services/socket'
import { AttackTypeChart, SeverityDoughnut, AttackFrequencyLine } from '../components/ThreatChart'
import AttackCard from '../components/AttackCard'

function StatWidget({ label, value, color, icon, sub }) {
    return (
        <div className="glass-card p-5 flex items-start gap-4">
            <div
                className="flex items-center justify-center text-xl rounded-xl shrink-0"
                style={{
                    width: 48, height: 48,
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                }}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, letterSpacing: '0.06em' }}>
                    {label}
                </div>
                <div className="stat-number" style={{ color }}>
                    {value ?? '—'}
                </div>
                {sub && <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    )
}

function LiveFeedRow({ attack }) {
    const sevColor = { CRITICAL: '#ff4757', HIGH: '#ff9f43', MEDIUM: '#ffd32a', LOW: '#00ff88' }
    const color = sevColor[attack.severity] || '#00ff88'
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
            style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #111827' }}
        >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
            <div className="flex-1 min-w-0">
                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{attack.attack_type}</span>
                <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: 8 }}>→ {attack.target_endpoint}</span>
            </div>
            <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ color, background: `${color}18`, border: `1px solid ${color}33`, whiteSpace: 'nowrap' }}
            >
                {attack.severity}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#334155', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                {new Date(attack.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [attacks, setAttacks] = useState([])
    const [loading, setLoading] = useState(true)
    const [liveAlerts, setLiveAlerts] = useState([])

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, attacksRes] = await Promise.all([getStats(), getAttacks(50)])
            setStats(statsRes.data)
            setAttacks(attacksRes.data.attacks || [])
        } catch (e) {
            console.warn('Backend not available, using demo data')
            setStats({
                total: 0, today: 0,
                by_type: {}, by_severity: {}, recent: [],
            })
            setAttacks([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        const socket = getSocket()
        const handleAlert = (data) => {
            setLiveAlerts((prev) => [data, ...prev.slice(0, 19)])
            fetchData()
        }
        socket.on('attack_alert', handleAlert)
        return () => socket.off('attack_alert', handleAlert)
    }, [fetchData])

    const byType = stats?.by_type || {}
    const bySev = stats?.by_severity || {}
    const recent = liveAlerts.length > 0
        ? liveAlerts.slice(0, 8)
        : (attacks.slice(0, 8))

    return (
        <div className="flex flex-col gap-6">
            {/* Stats row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <StatWidget label="TOTAL ATTACKS" value={stats?.total ?? 0} color="#ff4757" icon="⚡" sub="All time" />
                <StatWidget label="TODAY'S ATTACKS" value={stats?.today ?? 0} color="#ff9f43" icon="📅" sub="Last 24 hours" />
                <StatWidget label="CRITICAL THREATS" value={bySev.CRITICAL ?? 0} color="#ff4757" icon="🚨" sub="Needs immediate response" />
                <StatWidget label="HIGH SEVERITY" value={bySev.HIGH ?? 0} color="#ff9f43" icon="⚠️" sub="Priority response" />
            </div>

            {/* Charts row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 320px' }}>
                {/* Attack frequency */}
                <div className="glass-card p-5">
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em' }}>
                        ATTACK FREQUENCY (12H)
                    </div>
                    <div style={{ height: 200 }}>
                        <AttackFrequencyLine attacks={attacks} />
                    </div>
                </div>

                {/* Attack type bar */}
                <div className="glass-card p-5">
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em' }}>
                        ATTACKS BY TYPE
                    </div>
                    <div style={{ height: 200 }}>
                        <AttackTypeChart data={byType} />
                    </div>
                </div>

                {/* Severity doughnut */}
                <div className="glass-card p-5">
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em' }}>
                        SEVERITY DISTRIBUTION
                    </div>
                    <div style={{ height: 200 }}>
                        <SeverityDoughnut data={bySev} />
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Live alert feed */}
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="pulse-dot" style={{ background: '#ff4757' }} />
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>
                            LIVE ALERT FEED
                        </span>
                        {liveAlerts.length > 0 && (
                            <span
                                className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.2)' }}
                            >
                                {liveAlerts.length} NEW
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ color: '#334155', fontSize: '0.82rem', padding: '20px 0', textAlign: 'center' }}>
                            Connecting to feed...
                        </div>
                    ) : recent.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-10 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed #1e2d4a' }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
                            <div style={{ color: '#334155', fontSize: '0.82rem' }}>No attacks recorded yet</div>
                            <div style={{ color: '#1e2d4a', fontSize: '0.72rem', marginTop: 4 }}>
                                Launch an attack from Red Team Console
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {recent.map((a, i) => (
                                <LiveFeedRow key={a.attack_id || i} attack={a} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent attacks detail */}
                <div className="glass-card p-5">
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: 16, letterSpacing: '0.06em' }}>
                        RECENT ATTACK DETAILS
                    </div>
                    {attacks.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-10 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed #1e2d4a' }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                            <div style={{ color: '#334155', fontSize: '0.82rem' }}>Awaiting attack data</div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 380 }}>
                            {attacks.slice(0, 3).map((a) => (
                                <AttackCard key={a.attack_id} attack={a} compact />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
