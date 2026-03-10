/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'kings-plum': '#AD117E',
                'pastel-magenta': '#D385DF',
                'thistle': '#DEC0E8',
                'snow': '#F5EEF2',
                'soothing-lime': '#D6E574',
            },
        },
    },
    plugins: [],
}
