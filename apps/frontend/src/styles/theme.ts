export type ThemeMode = 'light' | 'dark' | 'system';

export const lightTheme = {
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#10b981',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  background: {
    main: '#ffffff',
    paper: '#f7fafd',
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
  },
  border: '#e0e0e0',
};

export const darkTheme = {
  colors: {
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    secondary: '#34d399',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
  },
  background: {
    main: '#111827',
    paper: '#1f2937',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
  },
  border: '#374151',
};

export type Theme = typeof lightTheme;
