import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a base theme instance with blue accent colors
let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#007AFF', // Apple-style blue
      light: '#5AC8FA',
      dark: '#0051D5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#30D158', // Apple-style green for success states
      light: '#32D74B',
      dark: '#28B946',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#000000',
      paper: '#1C1C1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
    },
    info: {
      main: '#64D2FF', // Light blue for info
    },
    warning: {
      main: '#007AFF', // Use blue instead of yellow/orange
      light: '#5AC8FA',
      dark: '#0051D5',
    },
    error: {
      main: '#FF453A',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.8px',
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
      fontSize: '1.5rem',
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1C1C1E',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 122, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: 'rgba(118, 118, 128, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(118, 118, 128, 0.16)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(118, 118, 128, 0.16)',
            },
          },
        },
      },
    },
  },
});

// Make the typography responsive
theme = responsiveFontSizes(theme);

export default theme;