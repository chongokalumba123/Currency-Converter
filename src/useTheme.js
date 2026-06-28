import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'kwacha-rates-theme';

function getInitialTheme() {
  try {
    const saved = window.localStorage?.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage unavailable, fall through to system preference
  }
  // Respect system preference if no saved choice yet
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage?.setItem(THEME_KEY, theme);
    } catch {
      // ignore persistence failure, theme still applies for this session
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
