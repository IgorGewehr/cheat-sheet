import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,md,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        page: "var(--page)",
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        nav: "var(--nav)",
      },
    },
  },
  plugins: [],
};

export default config;
