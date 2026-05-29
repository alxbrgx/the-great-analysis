/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── New palette: slate-based, lighter, better contrast ────────────────
        // Inspired by GitHub dark + Linear + Notion. Dark but not pure black.
        background: '#0f1419',     // very dark slate-blue (was #0a0a0a pure black)
        surface: '#161c25',        // 1 step lighter
        card: '#1c2330',           // 2 steps lighter — used for cards
        'surface-2': '#222a38',    // 3 steps lighter — for inputs / hover
        border: '#2c3545',         // visible but soft (was #242424 too dim)
        'border-strong': '#3a4558',
        accent: '#10b981',
        'accent-dim': '#059669',
        'accent-muted': 'rgba(16,185,129,0.12)',
        danger: '#f43f5e',         // rose-500 (was #ef4444 too red)
        warning: '#f59e0b',
        muted: '#94a3b8',          // slate-400 (was #6b7280 too dim)
        subtle: '#475569',         // slate-600
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'accent': '0 0 0 1px rgba(16,185,129,0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.4)',
        'soft': '0 2px 8px rgba(0,0,0,0.25)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
