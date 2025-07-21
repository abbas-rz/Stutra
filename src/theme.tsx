import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a base theme instance
let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD600', // A vibrant, dark yellow
      light: '#FFEA00',
      dark: '#FFC400',
      contrastText: '#000000',
    },
    secondary: {
      main: '#69F0AE', // A bright, contrasting green
      light: '#76FF03',
      dark: '#00E676',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#BDBDBD',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Make the typography responsive
theme = responsiveFontSizes(theme);

export default theme;