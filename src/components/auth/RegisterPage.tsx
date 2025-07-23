import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { TextField, Button, Typography, Box, Alert, Checkbox, FormControlLabel } from '@mui/material';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setError('');
      setSuccess('');
      await authService.createTeacher({ email, name, password, sections, isAdmin });
      setSuccess('Account created successfully! You can now log in.');
    } catch {
      setError('Failed to create account. Please try again.');
    }
  };

  const handleSectionChange = (section: string) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      color="text.primary"
    >
      <Typography variant="h4" gutterBottom>
        Register Teacher
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        Select Sections:
      </Typography>
      {['XI Raman', 'XI Satyarthi', 'XI Curie', 'XI Hawking'].map((section) => (
        <FormControlLabel
          key={section}
          control={
            <Checkbox
              checked={sections.includes(section)}
              onChange={() => handleSectionChange(section)}
            />
          }
          label={section}
        />
      ))}
      <FormControlLabel
        control={
          <Checkbox
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
        }
        label="Admin Account"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleRegister}
        sx={{ mt: 2 }}
      >
        Register
      </Button>
      <Button
        variant="text"
        onClick={() => navigate('/login')}
        sx={{ mt: 1 }}
      >
        Back to Login
      </Button>
    </Box>
  );
}
