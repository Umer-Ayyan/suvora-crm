/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #7c3aed, #4f46e5)",
        "gradient-glow": "radial-gradient(ellipse at top, rgba(124,58,237,0.15), transparent 60%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease",
        "slide-up": "slideUp 0.4s ease",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
