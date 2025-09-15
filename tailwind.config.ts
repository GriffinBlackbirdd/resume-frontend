import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/UI color system
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        radius: "var(--radius)",

        // Brand color system from design.md
        "vista-white": "#FFFDFA",
        "mine-shaft": "#202020",
        "sunglow": "#FDBA2F",
        "db3b09": "#DB3B09",
        "gradient-start": "#FFD200",
        "gradient-end": "#7A0EEF",
      },
      fontFamily: {
        "bebas": ["Bebas Neue Pro", "SF Pro Display", "sans-serif"],
        "sf": ["SF Pro Display", "sans-serif"],
        "editorial": ["PP Editorial New", "SF Pro Display", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(-45deg, #FFD200, #7A0EEF)",
        "text-gradient": "linear-gradient(135deg, #202020, #FDBA2F)",
      },
    },
  },
  plugins: [],
};
export default config;