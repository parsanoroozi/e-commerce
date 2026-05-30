import { createTheme, alpha } from '@mui/material/styles';

export function createAppTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  const primary = isDark
    ? { main: '#4f5dff', light: '#7b88ff', dark: '#2f3fe6', contrastText: '#ffffff' }
    : { main: '#2f3fe6', light: '#5b6cff', dark: '#1e2bb8', contrastText: '#ffffff' };

  const secondary = isDark
    ? { main: '#e4b429', light: '#f0cc55', dark: '#b8890f', contrastText: '#0a0c10' }
    : { main: '#c9920a', light: '#e4b429', dark: '#8a6506', contrastText: '#ffffff' };

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary,
      secondary,
      background: isDark
        ? { default: '#06080d', paper: '#121722' }
        : { default: '#eef1f8', paper: '#ffffff' },
      text: isDark
        ? { primary: '#f8faff', secondary: '#a8b0c4' }
        : { primary: '#0f1524', secondary: '#4a5568' },
      divider: isDark ? alpha('#ffffff', 0.12) : alpha('#0f1524', 0.1),
      success: { main: isDark ? '#2ecc71' : '#16a34a' },
      error: { main: isDark ? '#ff6b7a' : '#dc2626' },
      warning: { main: isDark ? '#f5b942' : '#d97706' },
    },
    typography: {
      fontFamily: '"DM Sans", system-ui, sans-serif',
      h1: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' },
      h4: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
      button: { fontWeight: 700, letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 8 },
    shadows: isDark
      ? createTheme({ palette: { mode: 'dark' } }).shadows
      : createTheme({ palette: { mode: 'light' } }).shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#06080d' : '#eef1f8',
            backgroundImage: isDark
              ? `radial-gradient(ellipse 90% 60% at 50% -30%, ${alpha(primary.main, 0.22)}, transparent 60%)`
              : `radial-gradient(ellipse 90% 60% at 50% -30%, ${alpha(primary.main, 0.14)}, transparent 60%)`,
            minHeight: '100vh',
          },
          a: { textDecoration: 'none' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 8,
            border: '1px solid transparent',
          },
          containedPrimary: {
            boxShadow: `0 0 0 1px ${alpha(primary.main, 0.4)}`,
          },
          outlined: {
            borderWidth: 2,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: '2px solid',
            borderColor: isDark ? alpha('#ffffff', 0.1) : alpha('#0f1524', 0.08),
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha('#ffffff', 0.03)} 0%, transparent 100%)`
              : 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: '2px solid',
            borderColor: isDark ? alpha(primary.main, 0.35) : alpha(primary.main, 0.2),
            backdropFilter: 'blur(12px)',
            backgroundColor: isDark ? alpha('#121722', 0.92) : alpha('#ffffff', 0.92),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 6 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });
}
