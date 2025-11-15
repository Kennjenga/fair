/**
 * Design system color definitions
 * Based on fairness principles: trust, transparency, balance
 */

export const colors = {
  primary: {
    DEFAULT: '#1e40af',      // Deep blue - Trust, stability, integrity
    dark: '#1e3a8a',
    light: '#3b82f6',
  },
  secondary: {
    DEFAULT: '#0891b2',       // Teal/cyan - Transparency, clarity
    dark: '#0e7490',
    light: '#06b6d4',
  },
  accent: {
    DEFAULT: '#059669',       // Green - Success, fairness
    dark: '#047857',
    light: '#10b981',
  },
  neutral: {
    DEFAULT: '#475569',      // Slate gray - Balance
    light: '#64748b',
    lighter: '#94a3b8',
  },
  warning: '#d97706',        // Amber - Caution
  error: '#dc2626',          // Red - Critical issues
  background: {
    DEFAULT: '#f8fafc',      // Light gray - Clean, open
    white: '#ffffff',
  },
  text: {
    DEFAULT: '#0f172a',      // Dark slate - Readability
    light: '#475569',
    lighter: '#64748b',
  },
} as const;

