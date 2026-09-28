import { createTheme } from '@mui/material/styles';

// Sistema de diseño Apple: un solo acento (azul iOS), superficies sobre canvas,
// esquinas continuas y separadores hairline. Los colores vivos en los archivos CSS
// provienen de variables que ya cambian con el tema; aquí solo vive la paleta MUI.
export const makeTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#0A84FF' : '#007AFF',
        dark: mode === 'dark' ? '#409CFF' : '#0071E3',
        contrastText: '#FFFFFF',
      },
      error: { main: mode === 'dark' ? '#FF453A' : '#FF3B30' },
      success: { main: mode === 'dark' ? '#30D158' : '#34C759' },
      warning: { main: mode === 'dark' ? '#FF9F0A' : '#FF9500' },
      background: {
        default: mode === 'dark' ? '#000000' : '#F5F5F7',
        paper: mode === 'dark' ? '#1C1C1E' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#F5F5F7' : '#1D1D1F',
        secondary: mode === 'dark' ? '#98989F' : '#86868B',
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      h1: { fontSize: '2.125rem', fontWeight: 700, letterSpacing: '-0.022em', lineHeight: 1.12 }, // Large Title 34
      h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.014em', lineHeight: 1.2 },    // Title1 24
      h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },   // Title2 20
      h4: { fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.3 },  // Title3 17
      subtitle1: { fontSize: '0.9375rem', fontWeight: 590, lineHeight: 1.35 },                     // 15
      body1: { fontSize: '1.0625rem', fontWeight: 400, lineHeight: 1.47 },                         // Body 17
      body2: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.4 },                          // 15
      caption: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.35 },                       // Footnote 13
      overline: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3 },                         // Caption 12
      button: { textTransform: 'none', fontWeight: 590, letterSpacing: 0 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 980,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          sizeLarge: { padding: '10px 24px', fontSize: '1.0625rem' },
          sizeMedium: { padding: '7px 18px', fontSize: '0.9375rem' },
          sizeSmall: { padding: '4px 14px', fontSize: '0.8125rem' },
          containedPrimary: {
            '&:hover': { backgroundColor: 'var(--azure-hover)' },
            '&:active': { backgroundColor: 'var(--azure)' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: 'var(--fill)',
            '& fieldset': { borderColor: 'var(--card-border)' },
            '&:hover fieldset': { borderColor: 'var(--hairline-strong)' },
            '&.Mui-focused fieldset': { borderWidth: 2, borderColor: 'var(--azure)' },
          },
          input: { padding: '14px 16px' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-card)',
            backgroundImage: 'none',
            background: 'var(--surface)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: 'rgba(29, 29, 31, 0.92)',
            backdropFilter: 'saturate(180%) blur(20px)',
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: 8,
            padding: '5px 10px',
          },
        },
      },
    },
  });

export const lightTheme = makeTheme('light');
export const darkTheme = makeTheme('dark');
