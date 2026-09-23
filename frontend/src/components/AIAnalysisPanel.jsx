export default function AIAnalysisPanel({ analysis, loading = false }) {
    if (loading) {
        return (
            <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid #1e2d4a' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="pulse-dot"
                        style={{ width: 10, height: 10, background: '#00d4ff' }}
                    />
                    <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: 600 }}>
                        AI Engine analyzing payload...
                    </span>
                </div>
            </div>
        )
    }

    if (!analysis) return null

    const severityColors = {
        CRITICAL: { text: '#ff4757', bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.25)' },
        HIGH: { text: '#ff9f43', bg: 'rgba(255,159,67,0.1)', border: 'rgba(255,159,67,0.25)' },
        MEDIUM: { text: '#ffd32a', bg: 'rgba(255,211,42,0.1)', border: 'rgba(255,211,42,0.25)' },
        LOW: { text: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.25)' },
    }
    const sc = severityColors[analysis.severity] || severityColors.LOW

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #1e2d4a', background: 'rgba(8,12,24,0.6)' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: 'rgba(0,212,255,0.06)', borderBottom: '1px solid #1e2d4a' }}
            >
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.1rem' }}>🤖</span>
                    <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        AI THREAT ANALYSIS
                    </span>
                </div>
                <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                >
                    {analysis.severity} SEVERITY
                </div>
            </div>

            <div className="p-5">
                {/* Attack type + score */}
                <div className="flex items-center gap-3 mb-4">
                    <div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, marginBottom: 2 }}>
                            ATTACK TYPE
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 700 }}>
                            {analysis.attack_type}
                        </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: '#1e2d4a' }} />
                    <div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, marginBottom: 2 }}>
                            SEVERITY SCORE
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: sc.text }}>
                            {analysis.severity_score} / 20
                        </div>
                    </div>
                </div>

                {/* Explanation */}
                <div className="mb-4">
                    <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>
                        EXPLANATION
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7 }}>
                        {analysis.explanation}
                    </p>
                </div>

                {/* Step by step */}
                {analysis.step_by_step && analysis.step_by_step.length > 0 && (
                    <div className="mb-4">
                        <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>
                            ATTACK STEPS
                        </div>
                        <div className="flex flex-col gap-2">
                            {analysis.step_by_step.map((step, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div
                                        className="flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: 'rgba(0,212,255,0.12)',
                                            color: '#00d4ff',
                                            marginTop: 1,
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mitigation */}
                <div
                    className="rounded-lg p-4"
                    style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)' }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span>🛡️</span>
                        <span style={{ fontSize: '0.7rem', color: '#00ff88', fontWeight: 700, letterSpacing: '0.06em' }}>
                            RECOMMENDED MITIGATIONS
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {analysis.mitigation.split('\n').map((m, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
                                {m}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detected patterns */}
                {analysis.patterns_detected && analysis.patterns_detected.length > 0 && (
                    <div className="mt-4">
                        <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>
                            INDICATORS DETECTED
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.patterns_detected.map((p, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{
                                        background: 'rgba(255,71,87,0.08)',
                                        border: '1px solid rgba(255,71,87,0.2)',
                                        color: '#ff4757',
                                    }}
                                >
                                    ⚠ {p}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
