import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Editorial dark-blue palette. The semantic token names from the prior
        // light theme (paper / ink / accent / status) stay so existing class
        // usage keeps working — only the values change.
        paper: {
          DEFAULT: "#0a1628",   // base navy
          deep: "#070f1d",      // deeper recess
          card: "#0f1f3a",      // raised surface
          edge: "#1a2c4d",      // panel edge
        },
        ink: {
          DEFAULT: "#f5f7fa",   // primary text — near-white
          muted: "#9aa8c2",     // secondary
          subtle: "#6b7a96",    // tertiary
          faint: "#465369",     // quaternary
        },
        rule: {
          DEFAULT: "rgba(245,247,250,0.14)",
          strong: "rgba(245,247,250,0.45)",
          subtle: "rgba(245,247,250,0.06)",
        },
        accent: {
          DEFAULT: "#5b9dff",   // bright sky-blue accent
          hover: "#7eb2ff",
          ink: "#1f4d8c",
          subtle: "rgba(91,157,255,0.14)",
        },
        // legacy aliases
        bg: {
          DEFAULT: "#0a1628",
          subtle: "#0d1b34",
          card: "#0f1f3a",
          hover: "#13284a",
        },
        border: {
          DEFAULT: "rgba(245,247,250,0.14)",
          subtle: "rgba(245,247,250,0.06)",
        },
        fg: {
          DEFAULT: "#f5f7fa",
          muted: "#9aa8c2",
          subtle: "#6b7a96",
        },
        // status palette retuned to the new background
        status: {
          saved: "#9aa8c2",
          applied: "#5b9dff",
          interview: "#a07cff",
          offer: "#5be6a8",
          rejected: "#ff7770",
          ghosted: "#f0b14a",
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
        soft: "0 1px 0 rgba(0,0,0,0.4), 0 12px 24px -18px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(91,157,255,0.5), 0 12px 32px -10px rgba(91,157,255,0.45)",
        page:
          "0 1px 0 rgba(0,0,0,0.3), 0 18px 38px -22px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,247,250,0.06)",
        ink: "0 1px 0 rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
