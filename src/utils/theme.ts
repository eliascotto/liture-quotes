const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_NAME = 'default';

export function applyTheme() {
  document.body.classList.remove(
    `${THEME_NAME}-light`,
    `${THEME_NAME}-dark`,
    `theme-${THEME_NAME}`,
    `theme-${THEME_NAME}-dark`
  );

  const mode = prefersDark.matches ? 'dark' : 'light';
  document.body.classList.add(`theme-${THEME_NAME}${mode === 'dark' ? '-dark' : ''}`);
}

// Update when system theme changes
prefersDark.addEventListener('change', applyTheme);
