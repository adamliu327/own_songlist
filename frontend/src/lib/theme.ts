import type { AppConfig } from '@/types';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(theme: AppConfig['theme']) {
  const dark = theme === 'dark' || (theme === 'system' && darkQuery.matches);
  document.documentElement.classList.toggle('dark', dark);
}

/** 主题为「跟随系统」时，系统切换明暗后重新应用 */
export function watchSystemTheme(onChange: () => void) {
  darkQuery.addEventListener('change', onChange);
  return () => darkQuery.removeEventListener('change', onChange);
}
