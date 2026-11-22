/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/views/**/*.blade.php', './resources/js/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                ink: { DEFAULT: '#1B1340', 800: '#261C57', 700: '#352A6E', 500: '#6A6190', 300: '#B7B1D3', 100: '#E6E3F5' },
                violet: { DEFAULT: '#6B4CFF', 600: '#5738EB', 100: '#E9E4FF' },
                coral: { DEFAULT: '#FF6B57', 100: '#FFE6E1' },
                mint: { DEFAULT: '#14C99A', 100: '#D8F7EE' },
                sun: { DEFAULT: '#FFC247', 100: '#FFF1CF' },
                paper: '#F4F2FF',
            },
            fontFamily: {
                display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
                sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
            },
            keyframes: {
                float: { '0%,100%': { transform: 'translateY(0) rotate(var(--r,0deg))' }, '50%': { transform: 'translateY(-14px) rotate(var(--r,0deg))' } },
                blob: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(40px,-30px) scale(1.1)' }, '66%': { transform: 'translate(-30px,30px) scale(.92)' } },
                marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
                caret: { '0%,49%': { opacity: 1 }, '50%,100%': { opacity: 0 } },
                feedIn: { from: { opacity: 0, transform: 'translateY(-18px) scale(.97)' }, to: { opacity: 1, transform: 'none' } },
                pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '60%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
                ring: { '0%': { boxShadow: '0 0 0 0 rgba(20,201,154,.5)' }, '100%': { boxShadow: '0 0 0 14px rgba(20,201,154,0)' } },
                shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
                rise: { from: { opacity: 0, transform: 'translateY(22px)' }, to: { opacity: 1, transform: 'none' } },
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                blob: 'blob 16s ease-in-out infinite',
                marquee: 'marquee 38s linear infinite',
                caret: 'caret 1s steps(1) infinite',
                feedIn: 'feedIn .55s cubic-bezier(.2,.8,.2,1) both',
                pop: 'pop .4s ease-out both',
                ring: 'ring 1.8s ease-out infinite',
                shimmer: 'shimmer 3s linear infinite',
                rise: 'rise .7s cubic-bezier(.2,.8,.2,1) both',
            },
        },
    },
    plugins: [],
};
