import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#64748b',
                font: { family: 'Inter', size: 11 },
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
            },
        },
        tooltip: {
            backgroundColor: '#0d1325',
            borderColor: '#1e2d4a',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            padding: 10,
        },
    },
}

const ATTACK_COLORS = {
    'SQL Injection': '#a55eea',
    'Cross-Site Scripting (XSS)': '#ffd32a',
    'Brute Force Login': '#00d4ff',
    'Command Injection': '#ff4757',
}

export function AttackTypeChart({ data }) {
    const labels = Object.keys(data || {})
    const values = Object.values(data || {})
    const colors = labels.map((l) => ATTACK_COLORS[l] || '#64748b')

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Attacks',
                data: values,
                backgroundColor: colors.map((c) => `${c}44`),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    }

    return (
        <Bar
            data={chartData}
            options={{
                ...CHART_DEFAULTS,
                scales: {
                    x: {
                        grid: { color: '#1e2d4a44' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                    },
                    y: {
                        grid: { color: '#1e2d4a44' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        beginAtZero: true,
                    },
                },
            }}
        />
    )
}

export function SeverityDoughnut({ data }) {
    const labels = ['Critical', 'High', 'Medium', 'Low']
    const severityMap = {
        Critical: data?.CRITICAL || 0,
        High: data?.HIGH || 0,
        Medium: data?.MEDIUM || 0,
        Low: data?.LOW || 0,
    }

    const chartData = {
        labels,
        datasets: [
            {
                data: labels.map((l) => severityMap[l]),
                backgroundColor: ['#ff475733', '#ff9f4333', '#ffd32a33', '#00ff8833'],
                borderColor: ['#ff4757', '#ff9f43', '#ffd32a', '#00ff88'],
                borderWidth: 2,
                hoverOffset: 6,
            },
        ],
    }

    return (
        <Doughnut
            data={chartData}
            options={{
                ...CHART_DEFAULTS,
                cutout: '65%',
            }}
        />
    )
}

export function AttackFrequencyLine({ attacks = [] }) {
    // Group attacks by hour (last 12 hours)
    const now = new Date()
    const hours = Array.from({ length: 12 }, (_, i) => {
        const h = new Date(now)
        h.setHours(h.getHours() - (11 - i))
        return h
    })

    const labels = hours.map((h) =>
        h.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
    )

    const counts = hours.map((h) => {
        return attacks.filter((a) => {
            const t = new Date(a.timestamp)
            return (
                t.getFullYear() === h.getFullYear() &&
                t.getMonth() === h.getMonth() &&
                t.getDate() === h.getDate() &&
                t.getHours() === h.getHours()
            )
        }).length
    })

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Attacks',
                data: counts,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.08)',
                borderWidth: 2,
                pointBackgroundColor: '#00d4ff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4,
            },
        ],
    }

    return (
        <Line
            data={chartData}
            options={{
                ...CHART_DEFAULTS,
                scales: {
                    x: {
                        grid: { color: '#1e2d4a22' },
                        ticks: { color: '#475569', font: { size: 9 } },
                    },
                    y: {
                        grid: { color: '#1e2d4a33' },
                        ticks: { color: '#475569', font: { size: 10 }, stepSize: 1 },
                        beginAtZero: true,
                    },
                },
            }}
        />
    )
}

export default AttackTypeChart
