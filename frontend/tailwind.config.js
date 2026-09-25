/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        steel: '#4A5568',
        mist: '#8996A6',
        brass: '#B7862C',
        brassLight: '#D9A94D',
        canvas: '#F5F6F4',
        line: '#D8DCE2',
        pass: '#1F7A4D',
        fail: '#B23A34',
        passBg: '#E7F3EC',
        failBg: '#FBEAE9',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
