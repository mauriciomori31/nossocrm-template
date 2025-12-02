/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500',
        'border-blue-500', 'border-yellow-500', 'border-purple-500', 'border-orange-500', 'border-green-500',
        'text-blue-500', 'text-yellow-500', 'text-purple-500', 'text-orange-500', 'text-green-500',
        'hover:bg-slate-100', 'dark:hover:bg-white/10'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
                serif: ['Cinzel', 'serif'],
            },
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                dark: {
                    bg: '#020617', // Deep Slate 950
                    card: '#0f172a', // Slate 900
                    border: '#1e293b', // Slate 800
                    hover: '#334155',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
