/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'profound': {
                    black: '#000000',
                    surface: '#0A0A0A',
                    card: '#111111',
                    border: '#1C1C1C',
                    'border-light': '#2C2C2C',
                    muted: '#6B6B6B',
                    'muted-light': '#A0A0A0',
                },
            },
            fontFamily: {
                sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
            },
            letterSpacing: {
                'tight-profound': '-0.03em',
                'tighter-profound': '-0.05em',
            },
            borderRadius: {
                'pill': '9999px',
                'bento': '16px',
            },
        },
    },
    plugins: [],
}
