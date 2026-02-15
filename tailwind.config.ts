// This is a copy of the tailwind.config.ts file in the src/ui directory
// TODO: maintain a single source of truth for tailwind config

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        main: ['Satoshi', 'sans-serif'],
        cta: ['Goldman', 'sans-serif'],
        knewave: ['Knewave', 'cursive'],
        bia: ['Bia', 'cursive'],
        uni: ['UnifrakturCook', 'cursive'],
        monobit: ['Monobit', 'sans-serif'],
        pixel: ['Pixel', 'sans-serif'],
        pixelTools: ['PixelTools', 'sans-serif'],
      },
      zIndex: {
        base: '1',
        content: '10',
        sidebar: '20',
        modal: '30',
        tooltip: '40',
        'ui-primary': '50',
        'ui-secondary': '40',
        'capture-overlay': '35',
        'selection-overlay': '30',
        'element-overlay': '25',
        max: '999999',
      },
      colors: {
        primary: {
          DEFAULT: '#FF3300',
          hover: '#CC2900',
          border: '#ff6b35',
          foreground: 'hsl(var(--primary-foreground))',
        },
        yellow: {
          DEFAULT: '#FFC857',
          border: '#FFB400',
        },
        green: {
          DEFAULT: '#1F2015',
          border: '#5A612C',
          hover: '#14150D',
        },
        main: {
          DEFAULT: 'white',
          input: '#1f2937',
        },
        content: {
          DEFAULT: '#ffffff',
          muted: '#d1d5db',
          subtle: '#9ca3af',
        },
        divider: {
          DEFAULT: '#4b5563',
          muted: '#374151',
        },
        accent: {
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
    require('tailwindcss-animate'),
  ],
};
