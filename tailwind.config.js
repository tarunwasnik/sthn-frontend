/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          inset: "var(--color-surface-inset)",
          raised: "var(--color-surface-raised)",
          text: "var(--color-text)",
          muted: "var(--color-text-muted)",
          primary: "var(--color-primary)",
          "primary-text": "var(--color-primary-text)",
          accent: "var(--color-accent)",
          "accent-tint": "var(--color-accent-tint)",
          border: "var(--color-border)",
          "border-strong": "var(--color-border-strong)",
          success: "var(--color-success)",
          "success-tint": "var(--color-success-tint)",
          warning: "var(--color-warning)",
          "warning-tint": "var(--color-warning-tint)",
          danger: "var(--color-danger)",
          "danger-tint": "var(--color-danger-tint)",
          info: "var(--color-info)",
          "info-tint": "var(--color-info-tint)",
        },
      },
    },
  },
  plugins: [],
};
