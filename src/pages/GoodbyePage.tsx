import {
  ThemeProvider,
  CssBaseline,
  Typography,
  Box,
  Container,
  useMediaQuery,
} from '@mui/material';
import appleTheme from '../theme';
import { APP_CONFIG, BREAKPOINTS } from '../constants/index';

export default function GoodbyePage() {
  const isMobile = useMediaQuery(appleTheme.breakpoints.down(BREAKPOINTS.MOBILE));

  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 3 }}>
        <Box
          sx={{
            width: '100%',
            bgcolor: 'rgba(28, 28, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h1"
            sx={{
              background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            📚 {APP_CONFIG.APP_NAME}
          </Typography>

          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600, letterSpacing: '-0.3px' }}>
            Thank You for Using Stutra
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 420 }}>
            {APP_CONFIG.APP_NAME} is no longer being hosted by Abbas Raza. We are grateful for
            everyone who used this app to track and manage their students.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 420 }}>
            It has been a pleasure building and maintaining this tool for teachers.
            Wishing you all the best in your continued work. 👋
          </Typography>

          <Box
            sx={{
              mt: 1,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              border: '1px solid rgba(0, 122, 255, 0.3)',
              bgcolor: 'rgba(0, 122, 255, 0.08)',
            }}
          >
            <Typography variant="body2" color="primary.light" sx={{ fontWeight: 500 }}>
              — Abbas Raza
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
