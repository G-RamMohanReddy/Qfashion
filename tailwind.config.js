/**
 * Familiar Indian marketplace palette.
 *
 * Deliberately not a "dashboard" look: off-white canvas, white cards, the pink
 * primary Indian shoppers already associate with fashion checkout, a Blinkit-ish
 * yellow reserved for the speed badge, and the standard green for savings.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f4ee',
        surface: '#ffffff',
        soft: '#eee9df',
        line: '#e5dfd4',
        'line-strong': '#d4cabb',
        ink: '#272c25',
        muted: '#65695e',
        faint: '#74796c',
        primary: { DEFAULT: '#53604b', dark: '#36432f', soft: '#eef0e8' },
        speed: { DEFAULT: '#ffd029', ink: '#4a3b00', soft: '#fff9e0' },
        success: { DEFAULT: '#03a685', soft: '#e6f7f3' },
        danger: { DEFAULT: '#ff5a5f', soft: '#ffeff0' },
        info: { DEFAULT: '#526cd0', soft: '#eef1fc' },
      },
      fontFamily: {
        editorial: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      borderRadius: { xs: '2px', sm: '4px', DEFAULT: '6px', lg: '10px', xl: '14px' },
      boxShadow: {
        card: '0 1px 2px rgba(40,44,63,.06)',
        hover: '0 4px 16px rgba(40,44,63,.12)',
        lift: '0 6px 28px rgba(40,44,63,.16)',
        pop: '0 20px 60px rgba(40,44,63,.24)',
      },
      keyframes: {
        rise: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        ping2: { '0%': { transform: 'scale(1)', opacity: '.6' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(240%)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.3' } },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        rise: 'rise .28s cubic-bezier(.22,1,.36,1) both',
        fade: 'fade .2s ease-out both',
        ping2: 'ping2 1.8s cubic-bezier(0,0,.2,1) infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        blink: 'blink 1.3s ease-in-out infinite',
        'spin-slow': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
