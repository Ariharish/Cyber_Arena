const SEVERITY_STYLES = {
    CRITICAL: { bg: 'badge-critical', dot: '#ff4757' },
    HIGH: { bg: 'badge-high', dot: '#ff9f43' },
    MEDIUM: { bg: 'badge-medium', dot: '#ffd32a' },
    LOW: { bg: 'badge-low', dot: '#00ff88' },
}

const TYPE_STYLES = {
    'SQL Injection': 'type-sqli',
    'Cross-Site Scripting (XSS)': 'type-xss',
    'Brute Force Login': 'type-brute',
    'Command Injection': 'type-cmdinj',
}

function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export default function AttackCard({ attack, compact = false }) {
    if (!attack) return null

    const sev = SEVERITY_STYLES[attack.severity] || SEVERITY_STYLES.LOW
    const typeClass = TYPE_STYLES[attack.attack_type] || 'type-sqli'
    const intel = attack.ai_analysis || {}
    const replay = attack.replay_results || {}

    return (
        <div className="glass-card animate-fade-in" style={{ padding: compact ? '14px 16px' : '18px 20px' }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Attack type badge */}
                    <span
                        className={`${typeClass} text-xs font-bold px-2 py-1 rounded-md`}
                    >
                        {attack.attack_type}
                    </span>
                    {/* Severity */}
                    <span className={`${sev.bg} text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1`}>
                        <span
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: sev.dot,
                                display: 'inline-block',
                            }}
                        />
                        {attack.severity}
                    </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#475569', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>
                    {timeAgo(attack.timestamp)}
                </span>
            </div>

            {/* Target & IP */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>TARGET:</span>
                    <code style={{ fontSize: '0.72rem', color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>
                        {attack.target_endpoint}
                    </code>
                </div>
                {attack.attacker_ip && (
                    <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: '0.7rem', color: '#475569' }}>FROM:</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {attack.attacker_ip}
                            {attack.attacker_location?.country ? ` · ${attack.attacker_location.country}` : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Payload */}
            <div className="mb-3">
                <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: 4, fontWeight: 600 }}>
                    PAYLOAD
                </div>
                <div className="payload-display" style={{ maxHeight: compact ? 48 : 72, overflow: 'hidden' }}>
                    {attack.payload}
                </div>
            </div>

            {/* AI Analysis */}
            {!compact && intel.explanation && (
                <div
                    className="rounded-lg p-3 mb-3"
                    style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid #1e2d4a' }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: '0.75rem', color: '#00d4ff', fontWeight: 700 }}>🤖 AI ANALYSIS</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                        {intel.explanation}
                    </p>
                </div>
            )}

            {/* Replay results */}
            {!compact && replay.attempts && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {replay.attempts.map((r) => (
                        <div
                            key={r.attempt}
                            className="flex items-center gap-1.5 rounded px-2 py-1"
                            style={{
                                background: r.status === 'SUCCESS' ? '#00ff8811' : r.status === 'BLOCKED' ? '#ff475711' : '#ffffff08',
                                border: `1px solid ${r.status === 'SUCCESS' ? '#00ff8833' : r.status === 'BLOCKED' ? '#ff475733' : '#1e2d4a'}`,
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: r.status === 'SUCCESS' ? '#00ff88' : r.status === 'BLOCKED' ? '#ff4757' : '#475569',
                                }}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                                Replay {r.attempt}: {r.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #111827' }}>
                <span style={{ fontSize: '0.7rem', color: '#334155' }}>
                    🌐 {attack.browser || 'Unknown Browser'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#334155' }}>
                    💻 {attack.operating_system || 'Unknown OS'}
                </span>
            </div>
        </div>
    )
}
