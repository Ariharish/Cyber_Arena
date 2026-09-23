import { useState, useEffect } from 'react'
import { getAttacks } from '../services/api'
import { getSocket } from '../services/socket'

function IntelRow({ attack }) {
    const loc = attack.attacker_location || {}
    const flag = loc.country_code ? `https://flagcdn.com/16x12/${loc.country_code.toLowerCase()}.png` : null

    return (
        <tr>
            <td>
                <code style={{ color: '#00d4ff', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
                    {attack.attacker_ip || 'N/A'}
                </code>
            </td>
            <td>
                <div className="flex items-center gap-2">
                    {flag && <img src={flag} alt="" style={{ width: 16, height: 12 }} onError={(e) => e.target.style.display = 'none'} />}
                    <span>{loc.country || 'Unknown'}</span>
                </div>
            </td>
            <td>{loc.city || '—'}</td>
            <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loc.isp || '—'}
            </td>
            <td>
                <span
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{
                        background: {
                            'SQL Injection': 'rgba(165,94,234,0.1)', 'Cross-Site Scripting (XSS)': 'rgba(255,211,42,0.1)',
                            'Brute Force Login': 'rgba(0,212,255,0.1)', 'Command Injection': 'rgba(255,71,87,0.1)',
                        }[attack.attack_type] || 'rgba(100,116,139,0.1)',
                        color: {
                            'SQL Injection': '#a55eea', 'Cross-Site Scripting (XSS)': '#ffd32a',
                            'Brute Force Login': '#00d4ff', 'Command Injection': '#ff4757',
                        }[attack.attack_type] || '#64748b',
                    }}
                >
                    {attack.attack_type?.replace('Cross-Site Scripting (XSS)', 'XSS')}
                </span>
            </td>
            <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attack.browser || '—'}
            </td>
            <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attack.operating_system || '—'}
            </td>
            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                {new Date(attack.timestamp).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
            </td>
        </tr>
    )
}

export default function AttackerIntel() {
    const [attacks, setAttacks] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchAttacks = async () => {
        try {
            const res = await getAttacks(200)
            setAttacks(res.data.attacks || [])
        } catch { setAttacks([]) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchAttacks()
        const socket = getSocket()
        socket.on('attack_alert', fetchAttacks)
        return () => socket.off('attack_alert', fetchAttacks)
    }, [])

    const filtered = attacks.filter((a) => {
        const s = search.toLowerCase()
        const loc = a.attacker_location || {}
        return (
            !s ||
            (a.attacker_ip || '').includes(s) ||
            (loc.country || '').toLowerCase().includes(s) ||
            (loc.city || '').toLowerCase().includes(s) ||
            (a.attack_type || '').toLowerCase().includes(s) ||
            (a.browser || '').toLowerCase().includes(s)
        )
    })

    // Aggregate by country
    const byCountry = {}
    attacks.forEach((a) => {
        const country = a.attacker_location?.country || 'Unknown'
        byCountry[country] = (byCountry[country] || 0) + 1
    })
    const topCountries = Object.entries(byCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

    const uniqueIPs = new Set(attacks.map((a) => a.attacker_ip)).size

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h2 className="font-bold text-xl" style={{ color: '#e2e8f0' }}>Attacker Intelligence</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    Metadata captured from all attack sources
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                    { label: 'UNIQUE IPs', value: uniqueIPs, color: '#00d4ff', icon: '🌐' },
                    { label: 'TOTAL EVENTS', value: attacks.length, color: '#ff9f43', icon: '⚡' },
                    { label: 'COUNTRIES', value: Object.keys(byCountry).length, color: '#a55eea', icon: '🗺️' },
                    { label: 'TOP COUNTRY', value: topCountries[0]?.[0] || '—', color: '#00ff88', icon: '🏴' },
                ].map((s) => (
                    <div key={s.label} className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span>{s.icon}</span>
                            <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: s.label === 'TOP COUNTRY' ? '1rem' : '1.6rem', fontWeight: 800, color: s.color }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 220px' }}>
                {/* Main table */}
                <div className="glass-card overflow-hidden">
                    {/* Table header with search */}
                    <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
                        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>
                            ATTACKER RECORDS ({filtered.length})
                        </span>
                        <input
                            className="cyber-input"
                            style={{ width: 220 }}
                            placeholder="Search IP, country, browser..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-2">
                            <div className="pulse-dot" style={{ background: '#00d4ff' }} />
                            <span style={{ color: '#334155' }}>Loading attacker data...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔍</div>
                            <div style={{ color: '#334155', fontSize: '0.85rem' }}>
                                {search ? 'No matching records' : 'No attacker data captured yet'}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="cyber-table">
                                <thead>
                                    <tr>
                                        <th>IP ADDRESS</th>
                                        <th>COUNTRY</th>
                                        <th>CITY</th>
                                        <th>ISP</th>
                                        <th>ATTACK TYPE</th>
                                        <th>BROWSER</th>
                                        <th>OS</th>
                                        <th>TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((a) => <IntelRow key={a.attack_id || a._id} attack={a} />)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Top origins sidebar */}
                <div className="glass-card p-4">
                    <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginBottom: 14, letterSpacing: '0.06em' }}>
                        TOP ORIGIN COUNTRIES
                    </div>
                    {topCountries.length === 0 ? (
                        <div style={{ color: '#334155', fontSize: '0.78rem' }}>No data yet</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {topCountries.map(([country, count], i) => (
                                <div key={country}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {country}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {count}
                                        </span>
                                    </div>
                                    <div
                                        className="rounded-full"
                                        style={{
                                            height: 3,
                                            background: '#1e2d4a',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(count / attacks.length) * 100}%`,
                                                background: 'linear-gradient(90deg, #00d4ff, #0099bb)',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
