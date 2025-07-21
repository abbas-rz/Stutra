import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  TextField,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Search,
  Person,
  CheckCircle,
  Cancel,
  Wc,
  Assignment,
  DirectionsRun,
  Refresh,
  Note
} from '@mui/icons-material';
import Fuse from 'fuse.js';
import { NotesDialog } from './components/NotesDialog';
import { googleSheetsService, type Student } from './services/googleSheets';

// Apple-inspired theme with rounded corners and soft shadows
const appleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#007AFF',
      light: '#5AC8FA',
      dark: '#0051D5',
    },
    secondary: {
      main: '#FF9500',
      light: '#FFCC02',
      dark: '#FF6B00',
    },
    background: {
      default: '#000000',
      paper: '#1C1C1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
    },
    success: {
      main: '#30D158',
    },
    error: {
      main: '#FF453A',
    },
    warning: {
      main: '#FF9F0A',
    },
    info: {
      main: '#64D2FF',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(28, 28, 30, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 122, 255, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

const statusConfig = {
  present: { icon: CheckCircle, color: '#30D158', label: 'Present' },
  absent: { icon: Cancel, color: '#FF453A', label: 'Absent' },
  washroom: { icon: Wc, color: '#64D2FF', label: 'Washroom' },
  activity: { icon: Assignment, color: '#FF9F0A', label: 'Activity' },
  bunking: { icon: DirectionsRun, color: '#FF453A', label: 'Bunking' },
} as const;

const activityOptions = ['Library', 'Nurse/Medical', 'Counselor', 'ATL', 'Other'];

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: number, status: Student['status'], activity: string, timerEnd: number | null) => void;
  onActivitySelect: (studentId: number) => void;
  onNotesOpen: (studentId: number) => void;
}

function StudentCard({ student, onStatusChange, onActivitySelect, onNotesOpen }: StudentCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const statusInfo = statusConfig[student.status];
  const StatusIcon = statusInfo.icon;

  useEffect(() => {
    if (student.timer_end) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = student.timer_end! - now;
        
        if (distance > 0) {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('');
          onStatusChange(student.id, 'present', '', null);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [student.timer_end, student.id, onStatusChange]);

  const handleStatusClick = (status: Student['status']) => {
    if (status === 'washroom') {
      const timerEnd = new Date().getTime() + (12 * 60 * 1000); // 12 minutes
      onStatusChange(student.id, status, '', timerEnd);
    } else if (status === 'activity') {
      onActivitySelect(student.id);
    } else {
      onStatusChange(student.id, status, '', null);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" alignItems="center" mb={1.5}>
          <Avatar 
            sx={{ 
              width: 44, 
              height: 44, 
              mr: 1.5, 
              bgcolor: 'primary.main',
              boxShadow: '0 2px 10px rgba(0, 122, 255, 0.3)',
            }}
          >
            <Person />
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              {student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {student.admission_number}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => onNotesOpen(student.id)}
            sx={{
              bgcolor: student.notes && student.notes.length > 0 ? 'warning.main' : 'transparent',
              color: student.notes && student.notes.length > 0 ? 'black' : 'text.secondary',
              '&:hover': {
                bgcolor: 'warning.main',
                color: 'black',
              },
              width: 32,
              height: 32,
            }}
          >
            <Note fontSize="small" />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Chip
            icon={<StatusIcon />}
            label={statusInfo.label}
            size="small"
            sx={{ 
              bgcolor: statusInfo.color,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: `0 2px 8px ${statusInfo.color}40`,
            }}
          />
          {timeRemaining && (
            <Typography 
              variant="caption" 
              color="primary"
              sx={{ 
                bgcolor: 'rgba(0, 122, 255, 0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              {timeRemaining}
            </Typography>
          )}
        </Box>

        {student.activity && (
          <Typography 
            variant="caption" 
            color="warning.main" 
            display="block" 
            mb={1.5}
            sx={{ 
              bgcolor: 'rgba(255, 159, 10, 0.1)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 500,
            }}
          >
            📋 {student.activity}
          </Typography>
        )}

        {student.notes && student.notes.length > 0 && (
          <Typography 
            variant="caption" 
            color="info.main" 
            display="block" 
            mb={1.5}
            sx={{ 
              bgcolor: 'rgba(100, 210, 255, 0.1)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 500,
            }}
          >
            📝 {student.notes.length} note{student.notes.length !== 1 ? 's' : ''}
          </Typography>
        )}

        <Box display="flex" gap={0.5} flexWrap="wrap">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <IconButton
                key={status}
                size="small"
                onClick={() => handleStatusClick(status as Student['status'])}
                sx={{
                  bgcolor: student.status === status ? config.color : 'rgba(118, 118, 128, 0.12)',
                  color: student.status === status ? 'white' : config.color,
                  border: student.status === status ? 'none' : `1px solid ${config.color}40`,
                  '&:hover': {
                    bgcolor: config.color,
                    color: 'white',
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 12px ${config.color}40`,
                  },
                  minWidth: 0,
                  width: 36,
                  height: 36,
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

interface ActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (activity: string) => void;
}

function ActivityDialog({ open, onClose, onSelect }: ActivityDialogProps) {
  const [customActivity, setCustomActivity] = useState('');

  const handleSelect = (activity: string) => {
    onSelect(activity);
    setCustomActivity('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Select Activity</DialogTitle>
      <List>
        {activityOptions.map((activity) => (
          <ListItem 
            key={activity} 
            onClick={() => handleSelect(activity)}
            sx={{ 
              py: 1,
              cursor: 'pointer',
              borderRadius: 2,
              mx: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 122, 255, 0.1)',
              },
            }}
          >
            <ListItemText primary={activity} />
          </ListItem>
        ))}
        <ListItem sx={{ pt: 2, px: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom activity"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && customActivity.trim()) {
                handleSelect(customActivity.trim());
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              endAdornment: customActivity.trim() && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => handleSelect(customActivity.trim())}
                    sx={{ color: 'primary.main' }}
                  >
                    <CheckCircle />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </ListItem>
      </List>
    </Dialog>
  );
}

export default function Stutra() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Load students from Google Sheets on component mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        await googleSheetsService.initialize();
        const studentsData = await googleSheetsService.getStudents();
        setStudents(studentsData);
      } catch (error) {
        console.error('Failed to load students:', error);
        // Fallback to mock data
        const mockStudents = await googleSheetsService.getStudents();
        setStudents(mockStudents);
      }
    };

    loadStudents();
  }, []);

  // Fuzzy search setup
  const fuse = React.useMemo(() => new Fuse(students, {
    keys: ['name', 'admission_number'],
    threshold: 0.3,
  }), [students]);

  useEffect(() => {
    if (searchTerm) {
      const results = fuse.search(searchTerm);
      setFilteredStudents(results.map(result => result.item));
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students, fuse]);

  const handleStatusChange = (studentId: number, status: Student['status'], activity: string, timerEnd: number | null) => {
    setStudents(prev => {
      const updated = prev.map(student => 
        student.id === studentId 
          ? { ...student, status, activity, timer_end: timerEnd }
          : student
      );
      
      // Update in Google Sheets
      const updatedStudent = updated.find(s => s.id === studentId);
      if (updatedStudent) {
        googleSheetsService.updateStudent(updatedStudent);
      }
      
      return updated;
    });
  };

  const handleActivitySelect = (studentId: number) => {
    setSelectedStudentId(studentId);
    setActivityDialogOpen(true);
  };

  const handleNotesOpen = (studentId: number) => {
    setSelectedStudentId(studentId);
    setNotesDialogOpen(true);
  };

  const handleActivityConfirm = (activity: string) => {
    if (selectedStudentId) {
      handleStatusChange(selectedStudentId, 'activity', activity, null);
    }
  };

  const handleAddNote = (note: string) => {
    if (selectedStudentId) {
      setStudents(prev => {
        const updated = prev.map(student => 
          student.id === selectedStudentId 
            ? { ...student, notes: [...(student.notes || []), note] }
            : student
        );
        
        // Update in Google Sheets
        const updatedStudent = updated.find(s => s.id === selectedStudentId);
        if (updatedStudent) {
          googleSheetsService.updateStudent(updatedStudent);
        }
        
        return updated;
      });
    }
  };

  const handleDeleteNote = (noteIndex: number) => {
    if (selectedStudentId) {
      setStudents(prev => {
        const updated = prev.map(student => 
          student.id === selectedStudentId 
            ? { 
                ...student, 
                notes: student.notes?.filter((_, index) => index !== noteIndex) || []
              }
            : student
        );
        
        // Update in Google Sheets
        const updatedStudent = updated.find(s => s.id === selectedStudentId);
        if (updatedStudent) {
          googleSheetsService.updateStudent(updatedStudent);
        }
        
        return updated;
      });
    }
  };

  const markAllPresent = () => {
    const updated = students.map(student => ({
      ...student,
      status: 'present' as const,
      activity: '',
      timer_end: null
    }));
    
    setStudents(updated);
    
    // Update all students in Google Sheets
    updated.forEach(student => {
      googleSheetsService.updateStudent(student);
    });
  };

  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;

  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box mb={4}>
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom 
            sx={{ 
              background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            📚 Stutra - Student Tracker
          </Typography>
          
          <Box display="flex" gap={2} mt={3}>
            <TextField
              fullWidth
              placeholder="Search students by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
            <Button
              variant="contained"
              onClick={markAllPresent}
              startIcon={<Refresh />}
              sx={{ 
                whiteSpace: 'nowrap',
                minWidth: 140,
                background: 'linear-gradient(45deg, #30D158, #32D74B)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #28B946, #30D158)',
                },
              }}
            >
              All Present
            </Button>
          </Box>
        </Box>

        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" 
          gap={3}
        >
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onStatusChange={handleStatusChange}
              onActivitySelect={handleActivitySelect}
              onNotesOpen={handleNotesOpen}
            />
          ))}
        </Box>

        <ActivityDialog
          open={activityDialogOpen}
          onClose={() => setActivityDialogOpen(false)}
          onSelect={handleActivityConfirm}
        />

        <NotesDialog
          open={notesDialogOpen}
          onClose={() => setNotesDialogOpen(false)}
          studentName={selectedStudent?.name || ''}
          notes={selectedStudent?.notes || []}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />
      </Container>
    </ThemeProvider>
  );
}
