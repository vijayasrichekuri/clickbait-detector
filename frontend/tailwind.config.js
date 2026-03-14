/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#020617",
        "bg-elevated": "#0f172a",
        purple: "#7c3aed",
        cyan: "#06b6d4",
        blue: "#3b82f6",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display": ["2.75rem", { lineHeight: "1.15" }],
        "title": ["1.35rem", { lineHeight: "1.35" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "card": "1rem",
        "input": "0.75rem",
        "btn": "0.75rem",
      },
      boxShadow: {
        "soft": "0 4px 24px -4px rgba(0, 0, 0, 0.25)",
        "glow-purple": "0 0 32px -4px rgba(124, 58, 237, 0.35)",
        "glow-cyan": "0 0 24px -4px rgba(6, 182, 212, 0.3)",
        "inner-subtle": "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 58, 237, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        "250": "250ms",
      },
    },
  },
  plugins: [],
};
