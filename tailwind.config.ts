import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f1ebdc",
          deep: "#e8dfc8",
          card: "#fbf6e8",
          edge: "#d8cfb8",
        },
        ink: {
          DEFAULT: "#16140e",
          muted: "#5b554a",
          subtle: "#8a8270",
          faint: "#b3a98f",
        },
        rule: {
          DEFAULT: "rgba(22,20,14,0.18)",
          strong: "rgba(22,20,14,0.45)",
          subtle: "rgba(22,20,14,0.08)",
        },
        accent: {
          DEFAULT: "#c4341a",
          hover: "#a52b13",
          ink: "#7a1f0c",
          subtle: "rgba(196,52,26,0.12)",
        },
        // semantic aliases (used throughout existing components)
        bg: {
          DEFAULT: "#f1ebdc",
          subtle: "#ece4cf",
          card: "#fbf6e8",
          hover: "#ece4cf",
        },
        border: {
          DEFAULT: "rgba(22,20,14,0.18)",
          subtle: "rgba(22,20,14,0.08)",
        },
        fg: {
          DEFAULT: "#16140e",
          muted: "#5b554a",
          subtle: "#8a8270",
        },
        status: {
          saved: "#3b3a32",
          applied: "#1f3a66",
          interview: "#c4341a",
          offer: "#1f4d3a",
          rejected: "#7a3a2a",
          ghosted: "#8a6a3a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        xs: "2px",
        sm: "3px",
        DEFAULT: "3px",
        md: "4px",
        lg: "5px",
        xl: "6px",
        "2xl": "8px",
      },
      letterSpacing: {
        eyebrow: "0.22em",
        tightish: "-0.01em",
        tighter2: "-0.025em",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(22,20,14,0.06), 0 12px 24px -18px rgba(22,20,14,0.20)",
        glow: "0 0 0 1px rgba(196,52,26,0.5), 0 12px 32px -10px rgba(196,52,26,0.30)",
        page:
          "0 1px 0 rgba(22,20,14,0.06), 0 18px 38px -22px rgba(22,20,14,0.30), 0 0 0 1px rgba(22,20,14,0.10)",
        ink: "0 1px 0 rgba(22,20,14,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
