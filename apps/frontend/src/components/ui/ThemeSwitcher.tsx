'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslations } from 'next-intl';

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const t = useTranslations('ThemeSwitcher');
  
  return (
    <div className="flex items-center space-x-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
        className="bg-paper border border-border rounded-md py-1 px-2 text-sm text-primary"
        aria-label={t('switchTheme')}
      >
        <option value="light">{t('lightTheme')}</option>
        <option value="dark">{t('darkTheme')}</option>
        <option value="system">{t('systemTheme')}</option>
      </select>
    </div>
  );
}
