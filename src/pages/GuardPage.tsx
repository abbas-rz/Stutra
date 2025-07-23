import { useState, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  SecurityOutlined,
  AccessTimeOutlined,
  PersonOutline,
} from '@mui/icons-material';
import appleTheme from '../theme';
import { useStudents } from '../hooks';
import type { Student } from '../types';

// Fuzzy search function
function fuzzyMatch(searchTerm: string, text: string): number {
  const pattern = searchTerm.toLowerCase().split('').join('.*');
  const regex = new RegExp(pattern, 'i');
  const match = text.match(regex);
  if (!match) return 0;
  
  // Calculate score based on match position and length
  const matchLength = match[0].length;
  const matchStart = match.index || 0;
  
  // Higher score for shorter matches and matches at the start
  return (1 / matchLength) * (1 / (matchStart + 1)) * 100;
}

interface GuardStudentCardProps {
  student: Student;
}

function GuardStudentCard({ student }: GuardStudentCardProps) {
  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'washroom':
        return 'warning';
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'activity':
        return 'info';
      case 'bunking':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'washroom':
        return 'WASHROOM PERMISSION';
      case 'present':
        return 'PRESENT';
      case 'absent':
        return 'ABSENT';
      case 'activity':
        return 'ACTIVITY';
      case 'bunking':
        return 'BUNKING';
      default:
        return status.toUpperCase();
    }
  };

  const formatTimer = (timerEnd: number | null) => {
    if (!timerEnd) return null;
    
    const now = Date.now();
    const timeLeft = timerEnd - now;
    
    if (timeLeft <= 0) return 'EXPIRED';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}m ${seconds}s left`;
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: student.status === 'washroom' ? 2 : 1,
        borderColor: student.status === 'washroom' ? 'warning.main' : 'grey.300',
        backgroundColor: student.status === 'washroom' ? 'warning.light' : 'background.paper',
        opacity: student.status === 'washroom' ? 1 : 0.8,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={student.photo_url} 
            alt={student.name}
            sx={{ 
              width: 60, 
              height: 60,
              border: student.status === 'washroom' ? 2 : 0,
              borderColor: 'warning.main'
            }}
          >
            <PersonOutline />
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {student.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Admission: {student.admission_number} • Section: {student.section}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getStatusText(student.status)}
                color={getStatusColor(student.status)}
                icon={student.status === 'washroom' ? <SecurityOutlined /> : undefined}
                size="small"
                variant={student.status === 'washroom' ? 'filled' : 'outlined'}
              />
              
              {student.status === 'washroom' && student.timer_end && (
                <Chip
                  label={formatTimer(student.timer_end)}
                  color="warning"
                  icon={<AccessTimeOutlined />}
                  size="small"
                  variant="outlined"
                />
              )}
              
              {student.status === 'activity' && student.activity && (
                <Chip
                  label={student.activity}
                  color="info"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function GuardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { students, loading, error } = useStudents();

  // Fuzzy search implementation
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students.sort((a: Student, b: Student) => {
        // Sort washroom students first
        if (a.status === 'washroom' && b.status !== 'washroom') return -1;
        if (a.status !== 'washroom' && b.status === 'washroom') return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const searchResults = students
      .map((student: Student) => {
        const nameScore = fuzzyMatch(searchTerm, student.name);
        const admissionScore = fuzzyMatch(searchTerm, student.admission_number);
        const sectionScore = fuzzyMatch(searchTerm, student.section);
        
        const maxScore = Math.max(nameScore, admissionScore, sectionScore);
        
        return {
          student,
          score: maxScore
        };
      })
      .filter((result: { student: Student; score: number }) => result.score > 0)
      .sort((a: { student: Student; score: number }, b: { student: Student; score: number }) => {
        // First sort by washroom status (washroom students first)
        if (a.student.status === 'washroom' && b.student.status !== 'washroom') return -1;
        if (a.student.status !== 'washroom' && b.student.status === 'washroom') return 1;
        
        // Then sort by search score
        return b.score - a.score;
      })
      .map((result: { student: Student; score: number }) => result.student);

    return searchResults;
  }, [students, searchTerm]);

  const washroomStudents = filteredStudents.filter((s: Student) => s.status === 'washroom');

  if (loading) {
    return (
      <ThemeProvider theme={appleTheme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <SecurityOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Security Guard Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor student washroom permissions and location status
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search students by name, admission number, or section..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Summary Stats */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'grey.300' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" color="warning.main">
                {washroomStudents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Washroom
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="primary.main">
                {filteredStudents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Shown
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main">
                {filteredStudents.filter((s: Student) => s.status === 'present').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Present
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="error.main">
                {filteredStudents.filter((s: Student) => s.status === 'absent' || s.status === 'bunking').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Absent/Bunking
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Washroom Alert */}
        {washroomStudents.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              ⚠️ Students Currently on Washroom Permission: {washroomStudents.length}
            </Typography>
            <Typography variant="body2">
              These students have been granted washroom permission. Monitor their return time.
            </Typography>
          </Alert>
        )}

        {/* Student List */}
        <Box>
          {filteredStudents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'No students found matching your search.' : 'No students available.'}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Students ({filteredStudents.length})
              </Typography>
              {filteredStudents.map((student) => (
                <GuardStudentCard key={student.id} student={student} />
              ))}
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
