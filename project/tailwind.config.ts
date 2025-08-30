import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
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
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Medical Record Colors
        medical: {
          'lab-result': {
            DEFAULT: 'hsl(var(--medical-lab-result-bg))',
            foreground: 'hsl(var(--medical-lab-result-fg))',
            border: 'hsl(var(--medical-lab-result-border))',
            hover: 'hsl(var(--medical-lab-result-hover))',
          },
          'imaging': {
            DEFAULT: 'hsl(var(--medical-imaging-bg))',
            foreground: 'hsl(var(--medical-imaging-fg))',
            border: 'hsl(var(--medical-imaging-border))',
            hover: 'hsl(var(--medical-imaging-hover))',
          },
          'prescription': {
            DEFAULT: 'hsl(var(--medical-prescription-bg))',
            foreground: 'hsl(var(--medical-prescription-fg))',
            border: 'hsl(var(--medical-prescription-border))',
            hover: 'hsl(var(--medical-prescription-hover))',
          },
          'consultation': {
            DEFAULT: 'hsl(var(--medical-consultation-bg))',
            foreground: 'hsl(var(--medical-consultation-fg))',
            border: 'hsl(var(--medical-consultation-border))',
            hover: 'hsl(var(--medical-consultation-hover))',
          },
          'vaccination': {
            DEFAULT: 'hsl(var(--medical-vaccination-bg))',
            foreground: 'hsl(var(--medical-vaccination-fg))',
            border: 'hsl(var(--medical-vaccination-border))',
            hover: 'hsl(var(--medical-vaccination-hover))',
          },
          'discharge-summary': {
            DEFAULT: 'hsl(var(--medical-discharge-summary-bg))',
            foreground: 'hsl(var(--medical-discharge-summary-fg))',
            border: 'hsl(var(--medical-discharge-summary-border))',
            hover: 'hsl(var(--medical-discharge-summary-hover))',
          },
          'other': {
            DEFAULT: 'hsl(var(--medical-other-bg))',
            foreground: 'hsl(var(--medical-other-fg))',
            border: 'hsl(var(--medical-other-border))',
            hover: 'hsl(var(--medical-other-hover))',
          },
        },
        // Health Status Colors
        health: {
          'normal': {
            DEFAULT: 'hsl(var(--health-normal-bg))',
            foreground: 'hsl(var(--health-normal-fg))',
            border: 'hsl(var(--health-normal-border))',
          },
          'warning': {
            DEFAULT: 'hsl(var(--health-warning-bg))',
            foreground: 'hsl(var(--health-warning-fg))',
            border: 'hsl(var(--health-warning-border))',
          },
          'critical': {
            DEFAULT: 'hsl(var(--health-critical-bg))',
            foreground: 'hsl(var(--health-critical-fg))',
            border: 'hsl(var(--health-critical-border))',
          },
        },
        // Appointment Status Colors
        appointment: {
          'scheduled': {
            DEFAULT: 'hsl(var(--appointment-scheduled-bg))',
            foreground: 'hsl(var(--appointment-scheduled-fg))',
            border: 'hsl(var(--appointment-scheduled-border))',
          },
          'completed': {
            DEFAULT: 'hsl(var(--appointment-completed-bg))',
            foreground: 'hsl(var(--appointment-completed-fg))',
            border: 'hsl(var(--appointment-completed-border))',
          },
          'cancelled': {
            DEFAULT: 'hsl(var(--appointment-cancelled-bg))',
            foreground: 'hsl(var(--appointment-cancelled-fg))',
            border: 'hsl(var(--appointment-cancelled-border))',
          },
          'missed': {
            DEFAULT: 'hsl(var(--appointment-missed-bg))',
            foreground: 'hsl(var(--appointment-missed-fg))',
            border: 'hsl(var(--appointment-missed-border))',
          },
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
