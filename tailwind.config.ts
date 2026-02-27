import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── NexaVision Color System ── */
      colors: {
        // Base surfaces
        "nv-void": "#050B18",        // deepest background
        "nv-abyss": "#0A1628",       // primary background (dark navy)
        "nv-deep": "#0F1D32",        // card / elevated surface
        "nv-slate": "#162238",       // secondary surface
        "nv-panel": "#1C2D4A",       // tertiary / interactive surface

        // Primary accent — electric teal/cyan
        "nv-teal": {
          DEFAULT: "#00E5CC",
          50: "#E0FFF9",
          100: "#B3FFF0",
          200: "#66FFE1",
          300: "#33FFD8",
          400: "#00F5D4",
          500: "#00E5CC",
          600: "#00C9B7",
          700: "#009E8F",
          800: "#007A6E",
          900: "#005C53",
          950: "#003D37",
        },

        // Secondary accent — violet
        "nv-violet": {
          DEFAULT: "#7B5EA7",
          50: "#F3EEFA",
          100: "#E4D6F2",
          200: "#C9ADE5",
          300: "#AE84D8",
          400: "#935BCB",
          500: "#7B5EA7",
          600: "#634B86",
          700: "#4B3865",
          800: "#332544",
          900: "#1C1323",
        },

        // Ember accent — warm highlight
        "nv-ember": {
          DEFAULT: "#FF6B35",
          300: "#FF9B73",
          400: "#FF8354",
          500: "#FF6B35",
          600: "#E55520",
          700: "#CC4010",
        },

        // Neutrals
        "nv-text": {
          primary: "#F0F4F8",
          secondary: "#8896A6",
          muted: "#5A6A7E",
          inverse: "#0A1628",
        },

        // Semantic
        "nv-success": "#22C55E",
        "nv-warning": "#EAB308",
        "nv-error": "#EF4444",
        "nv-info": "#3B82F6",
      },

      /* ── Typography ── */
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        // Display scale
        "display-2xl": ["4.5rem", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" }],
        "display-sm": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        // Body scale
        "body-xl": ["1.25rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-md": ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        "body-xs": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.02em" }],
        // Label scale
        "label-lg": ["0.875rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1.3", letterSpacing: "0.1em", fontWeight: "600" }],
        "label-sm": ["0.625rem", { lineHeight: "1.3", letterSpacing: "0.12em", fontWeight: "700" }],
      },

      /* ── Spacing System ── */
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "104": "26rem",
        "112": "28rem",
        "128": "32rem",
      },

      /* ── Border Radius ── */
      borderRadius: {
        "nv-sm": "0.375rem",
        "nv-md": "0.625rem",
        "nv-lg": "0.875rem",
        "nv-xl": "1.25rem",
        "nv-2xl": "1.75rem",
      },

      /* ── Shadows (glow effects) ── */
      boxShadow: {
        "nv-glow-sm": "0 0 10px rgba(0, 229, 204, 0.15)",
        "nv-glow": "0 0 20px rgba(0, 229, 204, 0.2), 0 0 40px rgba(0, 229, 204, 0.1)",
        "nv-glow-lg": "0 0 30px rgba(0, 229, 204, 0.25), 0 0 60px rgba(0, 229, 204, 0.15), 0 0 100px rgba(0, 229, 204, 0.05)",
        "nv-glow-violet": "0 0 20px rgba(123, 94, 167, 0.2), 0 0 40px rgba(123, 94, 167, 0.1)",
        "nv-glow-ember": "0 0 20px rgba(255, 107, 53, 0.2), 0 0 40px rgba(255, 107, 53, 0.1)",
        "nv-panel": "0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        "nv-panel-hover": "0 2px 8px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "nv-card": "0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.3)",
        "nv-card-hover": "0 0 0 1px rgba(0, 229, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 229, 204, 0.1)",
      },

      /* ── Backdrop Blur ── */
      backdropBlur: {
        "nv-glass": "16px",
        "nv-glass-heavy": "32px",
      },

      /* ── Animations ── */
      animation: {
        "nv-pulse-glow": "nv-pulse-glow 3s ease-in-out infinite",
        "nv-scan": "nv-scan 4s linear infinite",
        "nv-float": "nv-float 6s ease-in-out infinite",
        "nv-fade-up": "nv-fade-up 0.6s ease-out forwards",
        "nv-fade-in": "nv-fade-in 0.4s ease-out forwards",
        "nv-slide-in-right": "nv-slide-in-right 0.5s ease-out forwards",
        "nv-glow-border": "nv-glow-border 3s ease-in-out infinite",
        "nv-grid-pulse": "nv-grid-pulse 8s ease-in-out infinite",
      },

      keyframes: {
        "nv-pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "nv-scan": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "nv-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "nv-fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "nv-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "nv-slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "nv-glow-border": {
          "0%, 100%": { borderColor: "rgba(0, 229, 204, 0.2)" },
          "50%": { borderColor: "rgba(0, 229, 204, 0.5)" },
        },
        "nv-grid-pulse": {
          "0%, 100%": { opacity: "0.02" },
          "50%": { opacity: "0.06" },
        },
      },

      /* ── Background Images (textures) ── */
      backgroundImage: {
        "nv-grid": "linear-gradient(rgba(0, 229, 204, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 204, 0.03) 1px, transparent 1px)",
        "nv-noise": "url('/images/noise.svg')",
        "nv-gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
        "nv-gradient-hero": "radial-gradient(ellipse at 30% 20%, rgba(0, 229, 204, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(123, 94, 167, 0.06) 0%, transparent 50%)",
      },

      backgroundSize: {
        "nv-grid": "60px 60px",
      },
    },
  },
  plugins: [],
};

export default config;
