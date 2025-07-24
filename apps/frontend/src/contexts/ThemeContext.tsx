'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, lightTheme, darkTheme, Theme } from '../styles/theme';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  theme: lightTheme,
});

export const useTheme = () => useContext(ThemeContext);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default to light if matchMedia is not available
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>(lightTheme);
  
  // Функція для встановлення теми
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    // Зберігаємо вибір користувача в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  };
  
  useEffect(() => {
    // Отримуємо збережену тему з localStorage при першому завантаженні
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
      if (savedMode) {
        setModeState(savedMode);
      }
    }
  }, []);
  
  useEffect(() => {
    // Визначаємо, яку тему використовувати
    const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
    
    // Встановлюємо відповідну тему
    setTheme(effectiveTheme === 'dark' ? darkTheme : lightTheme);
    
    // Додаємо/видаляємо клас dark для Tailwind
    if (typeof window !== 'undefined' && document) {
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Слухаємо зміни системної теми, якщо вибрано 'system'
    if (mode === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? darkTheme : lightTheme);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mode]);
  
  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
