import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme } from '../theme/muiTheme';

const STORAGE_KEY = 'shopverse-color-mode';

const ColorModeContext = createContext({
  mode: 'dark',
  toggleColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
