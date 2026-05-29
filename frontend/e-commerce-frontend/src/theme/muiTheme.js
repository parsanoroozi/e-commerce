import { createTheme } from '@mui/material/styles';

const brand = {
  primary: { main: '#5b6cff', light: '#8b97ff', dark: '#3d4de6', contrastText: '#fff' },
  secondary: { main: '#c9a227', light: '#e4c04a', dark: '#9a7b15', contrastText: '#1a1a1a' },
};

export function createAppTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      ...brand,
      background: isDark
        ? { default: '#0a0c10', paper: '#181c26' }
        : { default: '#f4f6fb', paper: '#ffffff' },
      text: isDark
        ? { primary: '#f4f6fb', secondary: '#9aa3b5' }
        : { primary: '#1a1f2e', secondary: '#5c6578' },
      divider: isDark ? '#2a3142' : '#e2e6ef',
      success: { main: '#3ecf8e' },
      error: { main: '#f07178' },
    },
    typography: {
      fontFamily: '"DM Sans", system-ui, sans-serif',
      h1: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
      h2: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
      h3: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
      h4: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 108, 255, 0.12), transparent)'
              : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 108, 255, 0.08), transparent)',
            minHeight: '100vh',
          },
          a: { textDecoration: 'none' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: '1px solid',
            borderColor: isDark ? '#2a3142' : '#e2e6ef',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid',
            borderColor: isDark ? '#2a3142' : '#e2e6ef',
          },
        },
      },
    },
  });
}
