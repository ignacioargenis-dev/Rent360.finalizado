import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: false,
  },
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#141414',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#141414',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#141414',
        },
        primary: {
          DEFAULT: '#059669',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f5f5f5',
          foreground: '#141414',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#6b7280',
        },
        accent: {
          DEFAULT: '#f0fdfa',
          foreground: '#141414',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#e5e7eb',
        input: '#ffffff',
        ring: '#059669',
        chart: {
          '1': '#059669',
          '2': '#3b82f6',
          '3': '#a855f7',
          '4': '#f59e0b',
          '5': '#ef4444',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
  corePlugins: {
    // Deshabilitar plugins no utilizados para reducir el bundle
    fontVariantNumeric: false,
    touchAction: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    scrollSnapType: false,
    scrollSnapAlign: false,
    borderOpacity: false,
    divideOpacity: false,
    backgroundOpacity: false,
    textOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
  },
};
export default config;
