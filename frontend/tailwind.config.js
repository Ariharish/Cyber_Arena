/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                cyber: {
                    bg: '#080c18',
                    panel: '#0d1325',
                    card: '#111827',
                    border: '#1e2d4a',
                    cyan: '#00d4ff',
                    'cyan-dim': '#0099bb',
                    red: '#ff4757',
                    'red-dim': '#cc2233',
                    green: '#00ff88',
                    'green-dim': '#00bb66',
                    orange: '#ff9f43',
                    purple: '#a55eea',
                    yellow: '#ffd32a',
                    text: '#e2e8f0',
                    muted: '#64748b',
                    'muted-light': '#94a3b8',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.4s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'scan': 'scan 3s linear infinite',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px #00d4ff33' },
                    '100%': { boxShadow: '0 0 20px #00d4ff66, 0 0 40px #00d4ff22' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
