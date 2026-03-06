import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
    {
        path: '/',
        icon: '⬡',
        label: 'SOC Dashboard',
    },
    {
        path: '/red-team',
        icon: '⚡',
        label: 'Red Team Console',
    },
    {
        path: '/feed',
        icon: '📡',
        label: 'Threat Feed',
    },
    {
        path: '/intel',
        icon: '🔍',
        label: 'Attacker Intel',
    },
    {
        path: '/target',
        icon: '🎯',
        label: 'Vulnerable App',
    },
]

export default function Sidebar() {
    return (
        <aside
            className="flex flex-col"
            style={{
                width: 240,
                minWidth: 240,
                background: 'rgba(8,12,24,0.95)',
                borderRight: '1px solid #1e2d4a',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 50,
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Logo */}
            <div className="px-5 py-6" style={{ borderBottom: '1px solid #1e2d4a' }}>
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center text-xl font-black"
                        style={{
                            width: 38,
                            height: 38,
                            background: 'linear-gradient(135deg, #00d4ff, #0099bb)',
                            borderRadius: 10,
                            color: '#080c18',
                        }}
                    >
                        ⬡
                    </div>
                    <div>
                        <div className="font-black text-base" style={{ color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                            Cyber<span style={{ color: '#00d4ff' }}>Arena</span>
                        </div>
                        <div className="text-xs" style={{ color: '#475569', marginTop: 1 }}>
                            Security Platform v1.0
                        </div>
                    </div>
                </div>
            </div>

            {/* Status indicator */}
            <div className="px-5 py-3" style={{ borderBottom: '1px solid #111827' }}>
                <div className="flex items-center gap-2">
                    <div className="pulse-dot" style={{ background: '#00ff88' }} />
                    <span style={{ fontSize: '0.7rem', color: '#00ff88', fontWeight: 600 }}>
                        LIVE MONITORING
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="mb-2 px-2" style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, letterSpacing: '0.1em' }}>
                    MODULES
                </div>
                <div className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Divider */}
                <div className="my-4" style={{ height: 1, background: '#1e2d4a' }} />

                {/* Quick stats */}
                <div className="px-2 mb-2" style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, letterSpacing: '0.1em' }}>
                    SYSTEM STATUS
                </div>
                <div className="px-2 flex flex-col gap-2">
                    {[
                        { label: 'Backend', status: 'Online', color: '#00ff88' },
                        { label: 'Database', status: 'Connected', color: '#00ff88' },
                        { label: 'AI Engine', status: 'Active', color: '#00d4ff' },
                    ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</span>
                            <div className="flex items-center gap-1.5">
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
                                <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>{s.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* User profile footer */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid #1e2d4a' }}>
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center text-sm font-bold"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #a55eea, #7c3aed)',
                            color: 'white',
                        }}
                    >
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>Ari Harish</div>
                        <div style={{ fontSize: '0.7rem', color: '#475569' }}>Security Analyst</div>
                    </div>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: '#00d4ff',
                            background: 'rgba(0,212,255,0.1)',
                            border: '1px solid rgba(0,212,255,0.2)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                        }}
                    >
                        ADMIN
                    </div>
                </div>
            </div>
        </aside>
    )
}
