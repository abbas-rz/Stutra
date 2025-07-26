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
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { authService } from '../../services/auth';
import appleTheme from '../../theme';
import { APP_CONFIG, BREAKPOINTS } from '../../constants/index';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appleTheme.breakpoints.down(BREAKPOINTS.MOBILE));

  const availableSections = ['XI Raman', 'XI Satyarthi', 'XI Curie', 'XI Hawking'];

  const handleRegister = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await authService.createTeacher({ email, name, password, sections, isAdmin });
      setSuccess('Account created successfully! You can now log in.');
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section: string) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleRegister();
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
              Create Teacher Account
            </Typography>
          </Box>

          {/* Alerts */}
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
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                width: '100%',
                borderRadius: 2,
                bgcolor: 'rgba(52, 199, 89, 0.1)',
                border: '1px solid rgba(52, 199, 89, 0.2)',
                color: '#34C759',
              }}
            >
              {success}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'text.secondary' }} />
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
                },
              }}
            />

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
                },
              }}
            />

            {/* Sections Selection */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.primary' }}>
                Assign Sections:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {availableSections.map((section) => (
                  <Chip
                    key={section}
                    label={section}
                    onClick={() => handleSectionChange(section)}
                    variant={sections.includes(section) ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: sections.includes(section) ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
                      color: sections.includes(section) ? 'primary.main' : 'text.secondary',
                      borderColor: sections.includes(section) ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: sections.includes(section) ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.1)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Admin Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  disabled={loading}
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-checked': {
                      color: 'primary.main',
                    },
                  }}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AdminPanelSettings sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.primary">
                    Administrator privileges
                  </Typography>
                </Box>
              }
            />

            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={loading || !email || !password || !name}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          {/* Login Link */}
          <Box textAlign="center" pt={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Already have an account?
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
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
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
