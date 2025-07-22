import { useState, useEffect } from 'react';
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
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  useMediaQuery,
  Collapse
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
  Note,
  RestartAlt,
  ExpandMore,
  ExpandLess
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
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.8px',
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
    body2: {
      '@media (max-width:600px)': {
        fontSize: '0.85rem',
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: 12,
            paddingRight: 12,
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
          '@media (max-width:600px)': {
            borderRadius: 16,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          minHeight: 44,
          '@media (max-width:600px)': {
            minHeight: 48,
            fontSize: '1rem',
          },
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
            borderRadius: 14,
            backgroundColor: 'rgba(118, 118, 128, 0.12)',
            minHeight: 48,
            '@media (max-width:600px)': {
              minHeight: 52,
            },
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
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: 'rgba(118, 118, 128, 0.12)',
          minHeight: 48,
          '@media (max-width:600px)': {
            minHeight: 52,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          height: 32,
          '@media (max-width:600px)': {
            height: 36,
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 51,
          height: 31,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#30D158',
                opacity: 1,
                border: 0,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color: '#30D158',
              border: '6px solid #fff',
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 27,
            height: 27,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 31 / 2,
            backgroundColor: '#FF453A',
            opacity: 1,
            transition: 'background-color 300ms',
          },
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
  onResetStudent: (studentId: number) => void;
}

function StudentCard({ student, onStatusChange, onActivitySelect, onNotesOpen, onResetStudent }: StudentCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const statusInfo = statusConfig[student.status];
  const StatusIcon = statusInfo.icon;
  const isPresent = student.status !== 'absent';

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
    if (!isPresent && status !== 'present') return; // Prevent status changes when absent
    
    if (status === 'washroom') {
      const timerEnd = new Date().getTime() + (12 * 60 * 1000); // 12 minutes
      onStatusChange(student.id, status, '', timerEnd);
    } else if (status === 'activity') {
      onActivitySelect(student.id);
    } else {
      onStatusChange(student.id, status, '', null);
    }
  };

  const handlePresentToggle = (checked: boolean) => {
    if (checked) {
      onStatusChange(student.id, 'present', '', null);
    } else {
      onStatusChange(student.id, 'absent', '', null);
    }
  };

  const latestNote = student.notes && student.notes.length > 0 ? student.notes[student.notes.length - 1] : null;
  const hasMultipleNotes = student.notes && student.notes.length > 1;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        opacity: isPresent ? 1 : 0.7,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Header with Avatar, Student Info, and Present/Absent Toggle */}
        <Box display="flex" alignItems="center" mb={1.5}>
          <Avatar 
            sx={{ 
              width: 44, 
              height: 44, 
              mr: 1.5, 
              bgcolor: isPresent ? 'primary.main' : 'rgba(255, 255, 255, 0.3)',
              boxShadow: isPresent ? '0 2px 10px rgba(0, 122, 255, 0.3)' : 'none',
            }}
          >
            <Person />
          </Avatar>
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                {student.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onResetStudent(student.id)}
                sx={{
                  bgcolor: 'rgba(118, 118, 128, 0.12)',
                  color: 'text.secondary',
                  width: 24,
                  height: 24,
                  ml: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'text.primary',
                  },
                }}
              >
                <RestartAlt sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {student.admission_number}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
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
            <Box display="flex" flexDirection="column" alignItems="center">
              <Switch
                checked={isPresent}
                onChange={(e) => handlePresentToggle(e.target.checked)}
                size="small"
                sx={{
                  transform: 'scale(0.8)',
                }}
              />
              <Typography 
                variant="caption" 
                color={isPresent ? 'success.main' : 'error.main'}
                sx={{ fontSize: '0.65rem', fontWeight: 600, mt: -0.5 }}
              >
                {isPresent ? 'Present' : 'Absent'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status Chip and Timer */}
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
              opacity: isPresent ? 1 : 0.5,
            }}
          />
          {timeRemaining && isPresent && (
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

        {/* Activity and Notes Info */}
        {student.activity && isPresent && (
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

        {/* Notes Section - Show latest note visibly */}
        {latestNote && (
          <Box mb={1.5}>
            <Box
              onClick={() => hasMultipleNotes && setNotesExpanded(!notesExpanded)}
              sx={{ 
                bgcolor: 'rgba(100, 210, 255, 0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                cursor: hasMultipleNotes ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography 
                variant="caption" 
                color="info.main"
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: notesExpanded ? 'normal' : 'nowrap',
                }}
              >
                📝 {latestNote}
              </Typography>
              {hasMultipleNotes && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Typography 
                    variant="caption" 
                    color="info.main"
                    sx={{ fontSize: '0.65rem', mr: 0.5 }}
                  >
                    +{student.notes.length - 1}
                  </Typography>
                  {notesExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </Box>
              )}
            </Box>
            
            {/* Expanded notes */}
            <Collapse in={notesExpanded}>
              <Box mt={1}>
                {student.notes.slice(0, -1).map((note, index) => (
                  <Typography 
                    key={index}
                    variant="caption" 
                    color="info.main"
                    display="block"
                    sx={{ 
                      bgcolor: 'rgba(100, 210, 255, 0.05)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      mb: 0.5,
                    }}
                  >
                    📝 {note}
                  </Typography>
                ))}
                <Button
                  size="small"
                  onClick={() => onNotesOpen(student.id)}
                  sx={{ 
                    mt: 0.5,
                    fontSize: '0.65rem',
                    textTransform: 'none',
                  }}
                >
                  Manage Notes
                </Button>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={0.5} flexWrap="wrap">
          {Object.entries(statusConfig)
            .filter(([status]) => status !== 'present' && status !== 'absent') // Remove present/absent buttons
            .map(([status, config]) => {
            const Icon = config.icon;
            const isDisabled = !isPresent;
            return (
              <IconButton
                key={status}
                size="small"
                onClick={() => handleStatusClick(status as Student['status'])}
                disabled={isDisabled}
                sx={{
                  bgcolor: student.status === status ? config.color : 'rgba(118, 118, 128, 0.12)',
                  color: student.status === status ? 'white' : config.color,
                  border: student.status === status ? 'none' : `1px solid ${config.color}40`,
                  opacity: isDisabled ? 0.3 : 1,
                  '&:hover': !isDisabled ? {
                    bgcolor: config.color,
                    color: 'white',
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 12px ${config.color}40`,
                  } : {},
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(118, 118, 128, 0.06)',
                    color: 'rgba(118, 118, 128, 0.3)',
                    border: '1px solid rgba(118, 118, 128, 0.1)',
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
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Load students from Google Sheets on component mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        await googleSheetsService.initialize();
        const studentsData = await googleSheetsService.getStudents();
        setStudents(studentsData);
        
        // Get available sections
        const availableSections = await googleSheetsService.getSections();
        setSections(['All', ...availableSections]);
        if (availableSections.length > 0 && selectedSection === 'All') {
          setSelectedSection('All');
        }
      } catch (error) {
        console.error('Failed to load students:', error);
        // Fallback to mock data
        const mockStudents = await googleSheetsService.getStudents();
        setStudents(mockStudents);
        const availableSections = await googleSheetsService.getSections();
        setSections(['All', ...availableSections]);
      }
    };

    loadStudents();
  }, [selectedSection]);

  // Live updates every 10 seconds (more frequent for instant feel)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const studentsData = await googleSheetsService.getStudents();
        setStudents(studentsData);
      } catch (error) {
        console.error('Failed to refresh students data:', error);
      }
    }, 10000); // 10 seconds for faster updates

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let studentsToFilter = students;
    
    // Filter by section first
    if (selectedSection && selectedSection !== 'All') {
      studentsToFilter = students.filter(student => student.section === selectedSection);
    }
    
    // Then apply search filter
    if (searchTerm) {
      const fuse = new Fuse(studentsToFilter, {
        keys: ['name', 'admission_number'],
        threshold: 0.3,
      });
      const results = fuse.search(searchTerm);
      setFilteredStudents(results.map(result => result.item));
    } else {
      setFilteredStudents(studentsToFilter);
    }
  }, [searchTerm, students, selectedSection]);

  const handleStatusChange = async (studentId: number, status: Student['status'], activity: string, timerEnd: number | null) => {
    // Update local state immediately for instant feedback
    setStudents(prev => {
      const updated = prev.map(student => 
        student.id === studentId 
          ? { ...student, status, activity, timer_end: timerEnd }
          : student
      );
      return updated;
    });

    // Update in Firebase asynchronously
    try {
      const updatedStudent = students.find(s => s.id === studentId);
      if (updatedStudent) {
        const studentToUpdate = { ...updatedStudent, status, activity, timer_end: timerEnd };
        await googleSheetsService.updateStudent(studentToUpdate);
      }
    } catch (error) {
      console.error('Failed to update student in database:', error);
    }
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

  const handleAddNote = async (note: string) => {
    if (selectedStudentId) {
      // Update local state immediately
      setStudents(prev => {
        const updated = prev.map(student => 
          student.id === selectedStudentId 
            ? { ...student, notes: [...(student.notes || []), note] }
            : student
        );
        return updated;
      });
      
      // Update in Firebase asynchronously
      try {
        const updatedStudent = students.find(s => s.id === selectedStudentId);
        if (updatedStudent) {
          const studentToUpdate = { ...updatedStudent, notes: [...(updatedStudent.notes || []), note] };
          await googleSheetsService.updateStudent(studentToUpdate);
        }
      } catch (error) {
        console.error('Failed to update student notes in database:', error);
      }
    }
  };

  const handleDeleteNote = async (noteIndex: number) => {
    if (selectedStudentId) {
      // Update local state immediately
      setStudents(prev => {
        const updated = prev.map(student => 
          student.id === selectedStudentId 
            ? { 
                ...student, 
                notes: student.notes?.filter((_, index) => index !== noteIndex) || []
              }
            : student
        );
        return updated;
      });
      
      // Update in Firebase asynchronously
      try {
        const updatedStudent = students.find(s => s.id === selectedStudentId);
        if (updatedStudent) {
          const studentToUpdate = { 
            ...updatedStudent, 
            notes: updatedStudent.notes?.filter((_, index) => index !== noteIndex) || []
          };
          await googleSheetsService.updateStudent(studentToUpdate);
        }
      } catch (error) {
        console.error('Failed to update student notes in database:', error);
      }
    }
  };

  const markAllPresent = async () => {
    const studentsToUpdate = selectedSection === 'All' 
      ? students 
      : students.filter(student => student.section === selectedSection);
      
    // Update local state immediately
    const updated = students.map(student => 
      studentsToUpdate.some(s => s.id === student.id)
        ? { ...student, status: 'present' as const, activity: '', timer_end: null }
        : student
    );
    
    setStudents(updated);
    
    // Update all affected students in Firebase asynchronously
    try {
      const promises = studentsToUpdate.map(student => {
        const updatedStudent = { ...student, status: 'present' as const, activity: '', timer_end: null };
        return googleSheetsService.updateStudent(updatedStudent);
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to update students in database:', error);
    }
  };

  const handleResetStudent = async (studentId: number) => {
    try {
      // Update local state immediately
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, status: 'present' as const, activity: '', timer_end: null, notes: [] }
          : student
      ));
      
      // Update in Firebase asynchronously
      await googleSheetsService.resetIndividualStudent(studentId);
    } catch (error) {
      console.error('Failed to reset student:', error);
    }
  };

  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;

  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', minHeight: '100vh' }}>
        <Box mb={4}>
          {/* Header with Title and Section Selector */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
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
              📚 Stutra
            </Typography>
            
            {/* Section Dropdown */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Section</InputLabel>
              <Select
                value={selectedSection}
                label="Section"
                onChange={(e) => setSelectedSection(e.target.value)}
                sx={{
                  color: 'text.primary',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {sections.map((section) => (
                  <MenuItem key={section} value={section}>
                    {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Search and Controls */}
          <Box display="flex" gap={2} flexDirection={isMobile ? 'column' : 'row'}>
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
                minWidth: isMobile ? 'auto' : 140,
                background: 'linear-gradient(45deg, #30D158, #32D74B)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #28B946, #30D158)',
                },
              }}
            >
              {selectedSection === 'All' ? 'All Present' : `${selectedSection} Present`}
            </Button>
          </Box>
        </Box>

        {/* Students Grid */}
        <Fade in={true} timeout={800}>
          <Box 
            display="grid" 
            gridTemplateColumns={isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'} 
            gap={isMobile ? 2 : 3}
          >
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onStatusChange={handleStatusChange}
                onActivitySelect={handleActivitySelect}
                onNotesOpen={handleNotesOpen}
                onResetStudent={handleResetStudent}
              />
            ))}
          </Box>
        </Fade>

        {/* Watermark */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'rgba(28, 28, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            px: 2,
            py: 1,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 1000,
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: '0.7rem',
            }}
          >
            Made by Abbas with ❤️
          </Typography>
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
