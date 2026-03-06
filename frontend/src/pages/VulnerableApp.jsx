import { useState } from 'react'
import { targetLogin, targetComment, targetAdmin, targetSearch } from '../services/api'

function VulnBadge({ type }) {
    const styles = {
        SQLi: { bg: 'rgba(165,94,234,0.1)', color: '#a55eea', border: 'rgba(165,94,234,0.25)' },
        XSS: { bg: 'rgba(255,211,42,0.1)', color: '#ffd32a', border: 'rgba(255,211,42,0.25)' },
        'Brute Force': { bg: 'rgba(255,71,87,0.1)', color: '#ff4757', border: 'rgba(255,71,87,0.25)' },
    }
    const s = styles[type] || styles.SQLi
    return (
        <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
            ⚠ {type} VULNERABLE
        </span>
    )
}

function ResponseBox({ response }) {
    if (!response) return null
    const isVuln = response.vulnerable || response.status === 'VULNERABILITY_TRIGGERED'
    return (
        <div
            className="rounded-xl p-4 mt-4"
            style={{
                background: isVuln ? 'rgba(255,71,87,0.05)' : 'rgba(0,255,136,0.05)',
                border: `1px solid ${isVuln ? 'rgba(255,71,87,0.2)' : 'rgba(0,255,136,0.2)'}`,
            }}
        >
            <div
                className="flex items-center gap-2 mb-3 font-bold text-sm"
                style={{ color: isVuln ? '#ff4757' : '#00ff88' }}
            >
                {isVuln ? '⚠️ VULNERABILITY TRIGGERED' : '✅ REQUEST PROCESSED'}
            </div>
            <div className="flex flex-col gap-2">
                {Object.entries(response).map(([k, v]) => {
                    if (k === 'vulnerable' || typeof v === 'object') return null
                    return (
                        <div key={k}>
                            <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>
                                {k.toUpperCase().replace(/_/g, ' ')}:{' '}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{String(v)}</span>
                        </div>
                    )
                })}
                {response.leaked_data && (
                    <pre
                        style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.72rem',
                            color: '#ff4757',
                            background: '#050810',
                            padding: 8,
                            borderRadius: 6,
                            overflow: 'auto',
                            maxHeight: 120,
                        }}
                    >
                        {JSON.stringify(response.leaked_data, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    )
}

function SectionCard({ title, icon, badge, children }) {
    return (
        <div className="glass-card overflow-hidden">
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid #1e2d4a', background: 'rgba(0,0,0,0.2)' }}
            >
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{title}</span>
                </div>
                <VulnBadge type={badge} />
            </div>
            <div className="p-5">{children}</div>
        </div>
    )
}

export default function VulnerableApp() {
    const [loginData, setLoginData] = useState({ username: '', password: '' })
    const [loginRes, setLoginRes] = useState(null)
    const [loginLoading, setLoginLoading] = useState(false)

    const [comment, setComment] = useState('')
    const [commentRes, setCommentRes] = useState(null)
    const [commentLoading, setCommentLoading] = useState(false)

    const [adminData, setAdminData] = useState({ username: '', password: '' })
    const [adminRes, setAdminRes] = useState(null)
    const [adminLoading, setAdminLoading] = useState(false)

    const [searchQ, setSearchQ] = useState('')
    const [searchRes, setSearchRes] = useState(null)
    const [searchLoading, setSearchLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoginLoading(true)
        try {
            const res = await targetLogin(loginData.username, loginData.password)
            setLoginRes(res.data)
        } catch (e) {
            setLoginRes(e.response?.data || { error: 'Request failed' })
        } finally { setLoginLoading(false) }
    }

    const handleComment = async (e) => {
        e.preventDefault()
        setCommentLoading(true)
        try {
            const res = await targetComment(comment, 'Attacker')
            setCommentRes(res.data)
        } catch (e) {
            setCommentRes(e.response?.data || { error: 'Request failed' })
        } finally { setCommentLoading(false) }
    }

    const handleAdmin = async (e) => {
        e.preventDefault()
        setAdminLoading(true)
        try {
            const res = await targetAdmin(adminData.username, adminData.password)
            setAdminRes(res.data)
        } catch (e) {
            setAdminRes(e.response?.data || { error: 'Request failed' })
        } finally { setAdminLoading(false) }
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        setSearchLoading(true)
        try {
            const res = await targetSearch(searchQ)
            setSearchRes(res.data)
        } catch (e) {
            setSearchRes(e.response?.data || { error: 'Request failed' })
        } finally { setSearchLoading(false) }
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Warning banner */}
            <div
                className="flex items-start gap-3 rounded-xl px-5 py-4"
                style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)' }}
            >
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <div>
                    <div className="font-bold" style={{ color: '#ff4757', marginBottom: 4 }}>
                        TRAINING SANDBOX — SIMULATED VULNERABLE APPLICATION
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        These endpoints intentionally simulate classic vulnerabilities for educational purposes.
                        All attacks are contained within this platform — no real systems are affected.
                        Use these forms to test your payloads and observe how vulnerabilities are exploited.
                    </p>
                </div>
            </div>

            {/* Hint bar */}
            <div
                className="flex items-center gap-3 rounded-xl px-5 py-3"
                style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
                <span style={{ color: '#00d4ff' }}>💡</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Try SQLi: <code style={{ color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>{"' OR 1=1 --"}</code> &nbsp;|&nbsp;
                    XSS: <code style={{ color: '#ffd32a', fontFamily: 'JetBrains Mono, monospace' }}>{'<script>alert(1)</script>'}</code> &nbsp;|&nbsp;
                    Brute: <code style={{ color: '#ff4757', fontFamily: 'JetBrains Mono, monospace' }}>admin / admin</code>
                </span>
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Login form — SQLi */}
                <SectionCard title="Login Portal" icon="🔐" badge="SQLi">
                    <form onSubmit={handleLogin} className="flex flex-col gap-3">
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                USERNAME
                            </label>
                            <input
                                className="cyber-input"
                                placeholder="Enter username..."
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                PASSWORD
                            </label>
                            <input
                                className="cyber-input"
                                placeholder="Enter password..."
                                type="text"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            />
                        </div>
                        <button className="btn-cyber btn-secondary justify-center" type="submit" disabled={loginLoading}>
                            {loginLoading ? 'Sending...' : '→ Submit Login'}
                        </button>
                    </form>
                    <ResponseBox response={loginRes} />
                </SectionCard>

                {/* Comment section — XSS */}
                <SectionCard title="Comment Section" icon="💬" badge="XSS">
                    <form onSubmit={handleComment} className="flex flex-col gap-3">
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                COMMENT (XSS TARGET)
                            </label>
                            <textarea
                                className="cyber-input cyber-textarea"
                                placeholder="Leave a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <button className="btn-cyber btn-secondary justify-center" type="submit" disabled={commentLoading}>
                            {commentLoading ? 'Posting...' : '→ Post Comment'}
                        </button>
                    </form>
                    <ResponseBox response={commentRes} />
                </SectionCard>

                {/* Admin login — Brute force */}
                <SectionCard title="Admin Panel Login" icon="🔴" badge="Brute Force">
                    <form onSubmit={handleAdmin} className="flex flex-col gap-3">
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                ADMIN USERNAME
                            </label>
                            <input
                                className="cyber-input"
                                placeholder="admin, root..."
                                value={adminData.username}
                                onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                ADMIN PASSWORD
                            </label>
                            <input
                                className="cyber-input"
                                placeholder="password, 123456..."
                                type="text"
                                value={adminData.password}
                                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                            />
                        </div>
                        <button className="btn-cyber btn-secondary justify-center" type="submit" disabled={adminLoading}>
                            {adminLoading ? 'Authenticating...' : '→ Admin Login'}
                        </button>
                    </form>
                    <ResponseBox response={adminRes} />
                </SectionCard>

                {/* Search box — SQLi + CMDi */}
                <SectionCard title="Product Search" icon="🔍" badge="SQLi">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <div>
                            <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                                SEARCH QUERY (SQLi / CMD TARGET)
                            </label>
                            <input
                                className="cyber-input"
                                placeholder="Search products..."
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                            />
                        </div>
                        <button className="btn-cyber btn-secondary justify-center" type="submit" disabled={searchLoading}>
                            {searchLoading ? 'Searching...' : '→ Search'}
                        </button>
                    </form>
                    <ResponseBox response={searchRes} />
                </SectionCard>
            </div>
        </div>
    )
}
