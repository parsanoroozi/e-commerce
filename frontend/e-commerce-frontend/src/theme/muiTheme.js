import { createTheme, alpha } from '@mui/material/styles';

export function createAppTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  const primary = isDark
    ? { main: '#ff4d00', light: '#ff8a3d', dark: '#c73500', contrastText: '#fff7ed' }
    : { main: '#f03a00', light: '#ff6933', dark: '#b82a00', contrastText: '#fff7ed' };

  const secondary = isDark
    ? { main: '#00e0ff', light: '#75f0ff', dark: '#0096b8', contrastText: '#06121f' }
    : { main: '#004cff', light: '#2f78ff', dark: '#0030a3', contrastText: '#eef7ff' };

  const brand = {
    ink: isDark ? '#f8fbff' : '#101426',
    muted: isDark ? '#b9c7d9' : '#445166',
    canvas: isDark ? '#07111f' : '#edf3ff',
    surface: isDark ? '#0e1a2d' : '#f1e9ff',
    surfaceAlt: isDark ? '#142742' : '#dbe8ff',
    line: isDark ? alpha('#75f0ff', 0.24) : alpha('#004cff', 0.2),
    accent: isDark ? '#7cff00' : '#008c3a',
    appBar: isDark ? '#0a1728' : '#e5eeff',
  };

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary,
      secondary,
      background: isDark
        ? { default: brand.canvas, paper: brand.surface }
        : { default: brand.canvas, paper: brand.surface },
      text: isDark
        ? { primary: brand.ink, secondary: brand.muted }
        : { primary: brand.ink, secondary: brand.muted },
      divider: brand.line,
      success: { main: brand.accent },
      error: { main: isDark ? '#ff2d55' : '#d6002f' },
      warning: { main: isDark ? '#ffd000' : '#c87800' },
      info: { main: secondary.main },
      action: {
        hover: isDark ? alpha(secondary.main, 0.14) : alpha(secondary.main, 0.1),
        selected: isDark ? alpha(primary.main, 0.22) : alpha(primary.main, 0.16),
        focus: isDark ? alpha(secondary.main, 0.24) : alpha(secondary.main, 0.18),
      },
    },
    typography: {
      fontFamily: '"DM Sans", system-ui, sans-serif',
      h1: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 500, letterSpacing: 0 },
      h2: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 500, letterSpacing: 0 },
      h3: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 500, letterSpacing: 0 },
      h4: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 500, letterSpacing: 0 },
      button: { fontWeight: 700, letterSpacing: 0 },
    },
    shape: { borderRadius: 8 },
    shadows: isDark
      ? createTheme({ palette: { mode: 'dark' } }).shadows
      : createTheme({ palette: { mode: 'light' } }).shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: brand.canvas,
            backgroundImage: isDark
              ? `linear-gradient(135deg, ${alpha(secondary.dark, 0.28)} 0%, transparent 34%),
                 linear-gradient(180deg, ${alpha(primary.main, 0.12)} 0%, transparent 360px)`
              : `linear-gradient(135deg, ${alpha(secondary.light, 0.28)} 0%, transparent 36%),
                 linear-gradient(180deg, ${alpha(primary.light, 0.16)} 0%, transparent 360px)`,
            minHeight: '100vh',
          },
          '::selection': {
            backgroundColor: primary.main,
            color: primary.contrastText,
          },
          a: { textDecoration: 'none' },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: brand.surface,
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha(secondary.main, 0.08)}, ${alpha(primary.main, 0.04)})`
              : `linear-gradient(180deg, ${alpha('#ffffff', 0.32)}, ${alpha(secondary.light, 0.16)})`,
            borderColor: brand.line,
          },
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
            boxShadow: `0 0 0 2px ${alpha(primary.main, 0.35)}`,
            backgroundColor: primary.main,
            color: primary.contrastText,
            '&:hover': {
              backgroundColor: primary.dark,
            },
          },
          containedSecondary: {
            backgroundColor: secondary.main,
            color: secondary.contrastText,
            '&:hover': {
              backgroundColor: secondary.dark,
            },
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
            borderColor: brand.line,
            backgroundColor: brand.surface,
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha(secondary.main, 0.08)} 0%, transparent 100%)`
              : `linear-gradient(180deg, ${alpha('#ffffff', 0.5)} 0%, ${alpha(primary.light, 0.06)} 100%)`,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { color: 'transparent' },
        styleOverrides: {
          root: {
            borderBottom: '2px solid',
            borderColor: isDark ? alpha(primary.main, 0.7) : alpha(primary.main, 0.42),
            backdropFilter: 'blur(12px)',
            backgroundColor: alpha(brand.appBar, 0.94),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: brand.surface,
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha(secondary.main, 0.12)}, transparent 42%)`
              : `linear-gradient(180deg, ${alpha(secondary.light, 0.26)}, ${alpha(primary.light, 0.08)})`,
            borderRight: `2px solid ${brand.line}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 6,
            borderColor: brand.line,
            backgroundColor: isDark ? alpha(secondary.main, 0.12) : alpha(secondary.light, 0.18),
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderColor: brand.line,
                borderWidth: 2,
              },
              backgroundColor: isDark ? alpha(brand.surfaceAlt, 0.72) : alpha('#ffffff', 0.68),
              '&:hover fieldset': {
                borderColor: secondary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: primary.main,
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            backgroundColor: isDark ? alpha(brand.surfaceAlt, 0.72) : alpha(brand.surfaceAlt, 0.72),
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `2px solid ${brand.line}`,
            backgroundColor: brand.surface,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha(primary.main, 0.22) : alpha(primary.main, 0.16),
            },
            '&.Mui-selected:hover, &:hover': {
              backgroundColor: isDark ? alpha(secondary.main, 0.18) : alpha(secondary.main, 0.12),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            color: secondary.contrastText,
            backgroundColor: isDark ? alpha(secondary.main, 0.22) : secondary.main,
            fontWeight: 800,
            borderBottom: `2px solid ${brand.line}`,
          },
          body: {
            borderBottom: `1px solid ${brand.line}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? alpha(secondary.main, 0.08) : alpha(secondary.light, 0.18),
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: brand.line,
            '&.Mui-selected': {
              color: primary.contrastText,
              backgroundColor: primary.main,
              '&:hover': {
                backgroundColor: primary.dark,
              },
            },
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            borderColor: brand.line,
            '&.Mui-selected': {
              color: primary.contrastText,
              backgroundColor: primary.main,
              '&:hover': {
                backgroundColor: primary.dark,
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              color: secondary.main,
              backgroundColor: isDark ? alpha(secondary.main, 0.14) : alpha(secondary.main, 0.1),
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: secondary.main,
            fontWeight: 700,
            '&:hover': {
              color: primary.main,
            },
          },
        },
      },
    },
  });
}
