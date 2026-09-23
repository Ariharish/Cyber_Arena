import { useState } from 'react'
import { launchAttack } from '../services/api'
import AIAnalysisPanel from '../components/AIAnalysisPanel'

const ATTACK_TYPES = [
    { value: 'SQL Injection', label: 'SQL Injection', icon: '💉', color: '#a55eea' },
    { value: 'Cross-Site Scripting (XSS)', label: 'Cross-Site Scripting (XSS)', icon: '🖥️', color: '#ffd32a' },
    { value: 'Brute Force Login', label: 'Brute Force Login', icon: '🔐', color: '#00d4ff' },
    { value: 'Command Injection', label: 'Command Injection', icon: '⚙️', color: '#ff4757' },
]

const TARGET_ENDPOINTS = [
    '/api/target/login',
    '/api/target/comment',
    '/api/target/admin',
    '/api/target/search',
]

const EXAMPLE_PAYLOADS = {
    'SQL Injection': ["' OR 1=1 --", "' UNION SELECT * FROM users --", "admin'--", "' OR '1'='1"],
    'Cross-Site Scripting (XSS)': ['<script>alert(document.cookie)</script>', '<img src=x onerror=alert(1)>', "<svg onload=alert('xss')>", 'javascript:alert("XSS")'],
    'Brute Force Login': ['admin / password', 'root / 123456', 'admin / admin123', 'administrator / qwerty'],
    'Command Injection': ['; whoami', '| cat /etc/passwd', '&& ls -la', '`id`'],
}

export default function RedTeamConsole() {
    const [attackType, setAttackType] = useState('SQL Injection')
    const [payload, setPayload] = useState('')
    const [targetEndpoint, setTargetEndpoint] = useState('/api/target/login')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [launched, setLaunched] = useState(false)

    const selectedType = ATTACK_TYPES.find((t) => t.value === attackType)

    const handleLaunch = async () => {
        if (!payload.trim()) { setError('Payload is required'); return }
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const res = await launchAttack(attackType, payload, targetEndpoint)
            setResult(res.data)
            setLaunched(true)
        } catch (e) {
            setError(e.response?.data?.error || e.message || 'Failed to connect to backend. Is Flask running?')
        } finally {
            setLoading(false)
        }
    }

    const selectExample = (example) => setPayload(example)

    return (
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
            {/* Left: Attack config */}
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div
                    className="glass-card p-5 scan-overlay"
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="flex items-center justify-center rounded-lg text-lg"
                            style={{ width: 40, height: 40, background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)' }}
                        >
                            ⚡
                        </div>
                        <div>
                            <h2 className="font-bold text-lg" style={{ color: '#ff4757' }}>Red Team Console</h2>
                            <p style={{ fontSize: '0.75rem', color: '#475569' }}>Simulated attack launch environment</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="pulse-dot" style={{ background: '#ff4757' }} />
                            <span style={{ fontSize: '0.68rem', color: '#ff4757', fontWeight: 700 }}>ARMED</span>
                        </div>
                    </div>
                </div>

                {/* Attack Type Selector */}
                <div className="glass-card p-5">
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                        SELECT ATTACK TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {ATTACK_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => { setAttackType(type.value); setPayload('') }}
                                className="flex items-center gap-2 rounded-lg p-3 text-left transition-all"
                                style={{
                                    background: attackType === type.value ? `${type.color}18` : 'rgba(0,0,0,0.3)',
                                    border: `1px solid ${attackType === type.value ? `${type.color}55` : '#1e2d4a'}`,
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: attackType === type.value ? type.color : '#94a3b8' }}>
                                        {type.label}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Endpoint */}
                <div className="glass-card p-5">
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>
                        TARGET ENDPOINT
                    </label>
                    <select
                        className="cyber-select"
                        value={targetEndpoint}
                        onChange={(e) => setTargetEndpoint(e.target.value)}
                    >
                        {TARGET_ENDPOINTS.map((ep) => (
                            <option key={ep} value={ep}>{ep}</option>
                        ))}
                    </select>
                </div>

                {/* Payload Input */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>
                            PAYLOAD
                        </label>
                        <span style={{ fontSize: '0.68rem', color: '#334155' }}>
                            Try an example:
                        </span>
                    </div>

                    {/* Example payloads */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {EXAMPLE_PAYLOADS[attackType]?.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => selectExample(ex)}
                                className="px-2 py-1 rounded text-xs font-mono transition-all"
                                style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid #1e2d4a',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    maxWidth: 180,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="cyber-input cyber-textarea"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        placeholder={`Enter ${attackType} payload...`}
                        rows={4}
                    />

                    {error && (
                        <div
                            className="rounded-lg p-3 mt-3 text-sm"
                            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: '#ff4757' }}
                        >
                            ⚠ {error}
                        </div>
                    )}

                    {/* Launch button */}
                    <button
                        className="btn-cyber btn-danger w-full mt-4 justify-center"
                        onClick={handleLaunch}
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? (
                            <>
                                <span className="pulse-dot" style={{ background: 'white', width: 8, height: 8 }} />
                                Launching Attack...
                            </>
                        ) : (
                            <>⚡ LAUNCH ATTACK</>
                        )}
                    </button>
                </div>

                {/* Replay Results */}
                {result?.replay_results && (
                    <div className="glass-card p-5">
                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                            REPLAY RESULTS
                        </div>
                        <div className="flex flex-col gap-2 mb-3">
                            {result.replay_results.attempts?.map((r) => (
                                <div
                                    key={r.attempt}
                                    className="flex items-start gap-3 rounded-lg p-3"
                                    style={{
                                        background: r.status === 'SUCCESS' ? 'rgba(0,255,136,0.05)' : r.status === 'BLOCKED' ? 'rgba(255,71,87,0.05)' : 'rgba(0,0,0,0.3)',
                                        border: `1px solid ${r.status === 'SUCCESS' ? 'rgba(0,255,136,0.15)' : r.status === 'BLOCKED' ? 'rgba(255,71,87,0.15)' : '#1e2d4a'}`,
                                    }}
                                >
                                    <span
                                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                                        style={{
                                            color: r.status === 'SUCCESS' ? '#00ff88' : r.status === 'BLOCKED' ? '#ff4757' : '#64748b',
                                            background: r.status === 'SUCCESS' ? 'rgba(0,255,136,0.12)' : r.status === 'BLOCKED' ? 'rgba(255,71,87,0.12)' : '#ffffff0a',
                                        }}
                                    >
                                        #{r.attempt}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: r.status === 'SUCCESS' ? '#00ff88' : r.status === 'BLOCKED' ? '#ff4757' : '#64748b' }}>
                                            {r.status}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{r.response}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div
                            className="rounded-lg p-3 text-sm font-semibold"
                            style={{
                                background: result.replay_results.successes > 0 ? 'rgba(255,71,87,0.08)' : 'rgba(0,255,136,0.08)',
                                border: `1px solid ${result.replay_results.successes > 0 ? 'rgba(255,71,87,0.2)' : 'rgba(0,255,136,0.2)'}`,
                                color: result.replay_results.successes > 0 ? '#ff4757' : '#00ff88',
                            }}
                        >
                            {result.replay_results.conclusion}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: AI Analysis */}
            <div className="flex flex-col gap-4">
                {/* AI guidance for attack type */}
                <div className="glass-card p-5">
                    <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                        ATTACK INFORMATION
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <span style={{ fontSize: '2rem' }}>{selectedType?.icon}</span>
                        <div>
                            <div style={{ fontWeight: 700, color: selectedType?.color, fontSize: '1rem' }}>
                                {attackType}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                {attackType === 'SQL Injection' && 'Manipulates database query logic'}
                                {attackType === 'Cross-Site Scripting (XSS)' && 'Injects client-side scripts into web pages'}
                                {attackType === 'Brute Force Login' && 'Systematically guesses credentials'}
                                {attackType === 'Command Injection' && 'Executes OS commands via vulnerable input'}
                            </div>
                        </div>
                    </div>
                </div>

                <AIAnalysisPanel
                    analysis={result?.ai_analysis}
                    loading={loading}
                />

                {/* Attacker intel */}
                {result?.attacker_intel && (
                    <div className="glass-card p-5">
                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                            ATTACKER INTELLIGENCE CAPTURED
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'IP Address', value: result.attacker_intel.ip },
                                { label: 'Country', value: result.attacker_intel.country },
                                { label: 'City', value: result.attacker_intel.city },
                                { label: 'ISP', value: result.attacker_intel.isp },
                                { label: 'Browser', value: result.attacker_intel.browser },
                                { label: 'OS', value: result.attacker_intel.operating_system },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <div style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{value || 'N/A'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
