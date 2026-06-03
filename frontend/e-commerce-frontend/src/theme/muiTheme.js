import { alpha, createTheme } from '@mui/material/styles';

export function createAppTheme(mode = 'light') {
  const isDark = mode === 'dark';
  const orange = '#ff7a00';
  const orangeSoft = isDark ? '#3a2615' : '#fff3e5';
  const orangeLight = '#ffae5c';
  const background = isDark ? '#171615' : '#e7dccc';
  const paper = isDark ? '#22211f' : '#ffffff';
  const panel = isDark ? '#2a2926' : '#f8f8f8';
  const ink = isDark ? '#f7f3ee' : '#171717';
  const muted = isDark ? '#b8b0a7' : '#777777';
  const line = isDark ? '#393633' : '#eeeeee';
  const tableHead = isDark ? '#282623' : '#fafafa';
  const tableHover = isDark ? '#2f2922' : '#fff8f0';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: orange,
        light: orangeLight,
        dark: '#d86400',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ffad60',
        light: '#ffd4a4',
        dark: '#e98223',
        contrastText: isDark ? '#171717' : '#171717',
      },
      background: {
        default: background,
        paper,
      },
      text: {
        primary: ink,
        secondary: muted,
      },
      divider: line,
      success: { main: '#20bf7a', light: isDark ? '#173828' : '#dff8ed', dark: '#138a58' },
      error: { main: '#ff4b68', light: isDark ? '#44202a' : '#ffe4ea', dark: '#c91236' },
      warning: { main: orange, light: orangeSoft, dark: '#c95f00' },
      info: { main: muted, light: isDark ? '#302f2d' : '#f2f2f2', dark: '#414141' },
      action: {
        hover: alpha(orange, isDark ? 0.12 : 0.08),
        selected: alpha(orange, isDark ? 0.2 : 0.14),
        focus: alpha(orange, isDark ? 0.24 : 0.18),
        disabledBackground: isDark ? '#302f2d' : '#eeeeee',
        disabled: isDark ? '#766f68' : '#a5a5a5',
      },
    },
    typography: {
      fontFamily: '"Inter", "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 800, letterSpacing: 0 },
      h2: { fontWeight: 800, letterSpacing: 0 },
      h3: { fontWeight: 800, letterSpacing: 0 },
      h4: { fontWeight: 800, letterSpacing: 0 },
      h5: { fontWeight: 800, letterSpacing: 0 },
      h6: { fontWeight: 800, letterSpacing: 0 },
      subtitle1: { fontWeight: 700 },
      button: { fontWeight: 700, letterSpacing: 0 },
    },
    shape: { borderRadius: 14 },
    shadows: [
      'none',
      isDark ? '0 10px 30px rgba(0,0,0,0.24)' : '0 10px 30px rgba(24, 24, 24, 0.04)',
      isDark ? '0 12px 38px rgba(0,0,0,0.28)' : '0 12px 38px rgba(24, 24, 24, 0.06)',
      isDark ? '0 18px 50px rgba(0,0,0,0.32)' : '0 18px 50px rgba(24, 24, 24, 0.08)',
      ...Array(21).fill(isDark ? '0 18px 50px rgba(0,0,0,0.36)' : '0 18px 50px rgba(24, 24, 24, 0.10)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minHeight: '100vh',
            background,
            color: ink,
          },
          a: { textDecoration: 'none' },
          '::selection': {
            backgroundColor: orange,
            color: '#ffffff',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderColor: line,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: panel,
            backgroundImage: 'none',
            border: 0,
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 42,
            borderRadius: 10,
            textTransform: 'none',
            transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            backgroundColor: orange,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#eb7100',
            },
          },
          outlined: {
            borderColor: line,
            color: ink,
            '&:hover': {
              borderColor: orange,
              backgroundColor: orangeSoft,
            },
          },
        },
      },
      MuiAppBar: {
        defaultProps: { color: 'transparent' },
        styleOverrides: {
          root: {
            backgroundColor: alpha(paper, isDark ? 0.9 : 0.92),
            backgroundImage: 'none',
            borderBottom: `1px solid ${line}`,
            boxShadow: 'none',
            backdropFilter: 'blur(14px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: paper,
            backgroundImage: 'none',
            borderRight: `1px solid ${line}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 28,
            borderRadius: 8,
            fontWeight: 700,
            backgroundColor: orangeSoft,
            color: isDark ? '#ffd0a0' : orange,
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              minHeight: 44,
              borderRadius: 12,
              backgroundColor: paper,
              '& fieldset': {
                borderColor: line,
                borderWidth: 1,
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#57524c' : '#dddddd',
              },
              '&.Mui-focused fieldset': {
                borderColor: orange,
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            minHeight: 42,
            borderRadius: 10,
            backgroundColor: paper,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${line}`,
            borderRadius: 14,
            backgroundColor: paper,
            boxShadow: isDark ? '0 18px 48px rgba(0,0,0,0.38)' : '0 18px 48px rgba(24, 24, 24, 0.10)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 6px',
            '&.Mui-selected, &.Mui-selected:hover, &:hover': {
              backgroundColor: orangeSoft,
            },
          },
        },
      },
      MuiAccordion: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: panel,
            backgroundImage: 'none',
            border: 0,
            boxShadow: 'none',
            '&::before': { display: 'none' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            color: muted,
            backgroundColor: tableHead,
            fontWeight: 800,
            borderBottom: `1px solid ${line}`,
          },
          body: {
            borderBottom: `1px solid ${line}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: tableHover,
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: line,
            borderRadius: 10,
            '&.Mui-selected': {
              color: '#ffffff',
              backgroundColor: orange,
              '&:hover': {
                backgroundColor: '#eb7100',
              },
            },
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            '&.Mui-selected': {
              color: '#ffffff',
              backgroundColor: orange,
              '&:hover': {
                backgroundColor: '#eb7100',
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            color: muted,
            '&:hover': {
              color: orange,
              backgroundColor: orangeSoft,
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: orange,
            fontWeight: 700,
            '&:hover': {
              color: orangeLight,
            },
          },
        },
      },
    },
  });
}
