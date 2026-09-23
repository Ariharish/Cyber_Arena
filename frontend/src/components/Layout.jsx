import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { getSocket } from '../services/socket'

const PAGE_TITLES = {
    '/': 'SOC Dashboard',
    '/red-team': 'Red Team Console',
    '/feed': 'Cyber Threat Feed',
    '/intel': 'Attacker Intelligence',
    '/target': 'Vulnerable Application',
}

export default function Layout() {
    const [alerts, setAlerts] = useState([])
    const location = useLocation()
    const title = PAGE_TITLES[location.pathname] || 'CyberArena'

    useEffect(() => {
        const socket = getSocket()

        const handleAttackAlert = (data) => {
            const newAlert = {
                id: Date.now(),
                ...data,
            }
            setAlerts((prev) => [newAlert, ...prev.slice(0, 4)])

            // Auto-dismiss after 5s
            setTimeout(() => {
                setAlerts((prev) => prev.filter((a) => a.id !== newAlert.id))
            }, 5000)
        }

        socket.on('attack_alert', handleAttackAlert)
        return () => socket.off('attack_alert', handleAttackAlert)
    }, [])

    const severityColor = (s) => {
        if (s === 'CRITICAL') return '#ff4757'
        if (s === 'HIGH') return '#ff9f43'
        if (s === 'MEDIUM') return '#ffd32a'
        return '#00ff88'
    }

    return (
        <div className="flex" style={{ minHeight: '100vh', background: '#080c18' }}>
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1" style={{ marginLeft: 240, display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header
                    className="flex items-center justify-between px-6 py-3 sticky top-0 z-40"
                    style={{
                        background: 'rgba(8,12,24,0.95)',
                        borderBottom: '1px solid #1e2d4a',
                        backdropFilter: 'blur(12px)',
                        minHeight: 56,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <h1 className="font-semibold text-base" style={{ color: '#e2e8f0' }}>
                            {title}
                        </h1>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: '#475569',
                                background: '#0d1325',
                                border: '1px solid #1e2d4a',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontFamily: 'JetBrains Mono, monospace',
                            }}
                        >
                            {new Date().toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live feed indicator */}
                        <div className="flex items-center gap-2">
                            <div className="pulse-dot" style={{ background: '#ff4757' }} />
                            <span style={{ fontSize: '0.7rem', color: '#ff4757', fontWeight: 600 }}>
                                RED TEAM ACTIVE
                            </span>
                        </div>

                        {/* Shield icon */}
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: 'rgba(0,212,255,0.1)',
                                border: '1px solid rgba(0,212,255,0.2)',
                                fontSize: '1rem',
                            }}
                        >
                            🛡️
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6 cyber-grid" style={{ position: 'relative' }}>
                    <Outlet />
                </main>
            </div>

            {/* Realtime Alert Toasts */}
            <div
                style={{
                    position: 'fixed',
                    top: 70,
                    right: 20,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    width: 340,
                }}
            >
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="alert-toast glass-card"
                        style={{ padding: '12px 16px' }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: severityColor(alert.severity),
                                    marginTop: 6,
                                    flexShrink: 0,
                                    boxShadow: `0 0 8px ${severityColor(alert.severity)}`,
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        style={{ fontSize: '0.75rem', fontWeight: 700, color: severityColor(alert.severity) }}
                                    >
                                        ⚡ ATTACK DETECTED
                                    </span>
                                    <span
                                        className="px-2 py-0.5 rounded text-xs font-bold"
                                        style={{
                                            background: `${severityColor(alert.severity)}22`,
                                            color: severityColor(alert.severity),
                                            border: `1px solid ${severityColor(alert.severity)}44`,
                                        }}
                                    >
                                        {alert.severity}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                                    {alert.attack_type}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                                    From: {alert.attacker_ip} ({alert.country})
                                </div>
                            </div>
                            <button
                                onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                                style={{ color: '#334155', fontSize: '0.9rem', cursor: 'pointer', background: 'none', border: 'none' }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
