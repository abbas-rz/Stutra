import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ThemeProvider,
  CssBaseline,
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert, 
  Container,
  useMediaQuery,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { authService } from '../../services/auth';
import appleTheme from '../../theme';
import { APP_CONFIG, BREAKPOINTS } from '../../constants/index';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appleTheme.breakpoints.down(BREAKPOINTS.MOBILE));

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await authService.login({ email, password });
      navigate('/'); // Redirect to the main page
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

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
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={2}>
            <Typography 
              variant={isMobile ? "h4" : "h3"}
              component="h1" 
              sx={{ 
                background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                mb: 1,
              }}
            >
              📚 {APP_CONFIG.APP_NAME}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Teacher Portal
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%',
                borderRadius: 2,
                bgcolor: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                color: '#FF3B30',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                  '& input': {
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                      borderRadius: '8px',
                    },
                    '&:-webkit-autofill:hover': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                    '&:-webkit-autofill:focus': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                    '&:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                  },
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                  '& input': {
                    '&:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                      borderRadius: '8px',
                    },
                    '&:-webkit-autofill:hover': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                    '&:-webkit-autofill:focus': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                    '&:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important',
                      WebkitTextFillColor: '#ffffff !important',
                    },
                  },
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0056CC, #4A9FE7)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          {/* Register Link */}
          <Box textAlign="center" pt={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Don't have an account?
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/register')}
              disabled={loading}
              sx={{
                color: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(0, 122, 255, 0.1)',
                },
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
