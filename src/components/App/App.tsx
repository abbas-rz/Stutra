import { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  TextField,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Fade,
  InputAdornment,
  useMediaQuery,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Refresh,
  Analytics,
} from '@mui/icons-material';
import appleTheme from '../../theme';
import { StudentCard } from '../StudentCard/index';
import { ActivityDialog } from '../ActivityDialog/index';
import { NotesDialog } from '../NotesDialog';
import { SimpleAttendanceDialog } from '../SimpleAttendanceDialog';
import { useStudents, useStudentFilters } from '../../hooks';
import { APP_CONFIG, DEFAULTS, BREAKPOINTS } from '../../constants/index';
import type { Student } from '../../types';

export function App() {
  // Hooks
  const {
    students,
    loading,
    error,
    updateStudentStatus,
    resetStudent,
    addStudentNote,
    deleteStudentNote,
    markAllPresent,
  } = useStudents();

  const {
    searchTerm,
    selectedSection,
    filteredStudents,
    sections,
    setSearchTerm,
    setSelectedSection,
  } = useStudentFilters(students);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const isMobile = useMediaQuery(`(max-width:${BREAKPOINTS.MOBILE}px)`);

  // Handlers
  const handleStatusChange = async (
    studentId: number,
    status: Student['status'],
    activity = '',
    timerEnd: number | null = null
  ) => {
    await updateStudentStatus(studentId, status, activity, timerEnd);
  };

  const handleActivitySelect = (studentId: number) => {
    setSelectedStudentId(studentId);
    setActivityDialogOpen(true);
  };

  const handleNotesOpen = (studentId: number) => {
    setSelectedStudentId(studentId);
    setNotesDialogOpen(true);
  };

  const handleActivityConfirm = async (activity: string) => {
    if (selectedStudentId) {
      await updateStudentStatus(selectedStudentId, 'activity', activity, null);
    }
    setActivityDialogOpen(false);
    setSelectedStudentId(null);
  };

  const handleAddNote = async (note: string) => {
    if (selectedStudentId) {
      await addStudentNote(selectedStudentId, note);
    }
  };

  const handleDeleteNote = async (noteIndex: number) => {
    if (selectedStudentId) {
      await deleteStudentNote(selectedStudentId, noteIndex);
    }
  };

  const handleMarkAllPresent = async () => {
    await markAllPresent(selectedSection);
  };

  const selectedStudent = selectedStudentId 
    ? students.find(s => s.id === selectedStudentId) 
    : null;

  if (loading) {
    return (
      <ThemeProvider theme={appleTheme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading {APP_CONFIG.APP_NAME}...
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={appleTheme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Error Loading Application
            </Typography>
            <Typography>{error}</Typography>
          </Alert>
        </Container>
      </ThemeProvider>
    );
  }

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
              📚 {APP_CONFIG.APP_NAME}
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
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={handleMarkAllPresent}
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
                {selectedSection === DEFAULTS.SECTION ? 'Mark All Present' : `Mark ${selectedSection} Present`}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setAttendanceDialogOpen(true)}
                startIcon={<Analytics />}
                sx={{ 
                  whiteSpace: 'nowrap',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(0, 122, 255, 0.1)',
                  },
                }}
              >
                Export CSV
              </Button>
            </Box>
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
                onResetStudent={resetStudent}
                isMobile={isMobile}
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

        {/* Dialogs */}
        <ActivityDialog
          open={activityDialogOpen}
          onClose={() => {
            setActivityDialogOpen(false);
            setSelectedStudentId(null);
          }}
          onSelect={handleActivityConfirm}
        />

        <NotesDialog
          open={notesDialogOpen}
          onClose={() => {
            setNotesDialogOpen(false);
            setSelectedStudentId(null);
          }}
          studentName={selectedStudent?.name || ''}
          notes={selectedStudent?.notes || []}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />

        <SimpleAttendanceDialog
          open={attendanceDialogOpen}
          onClose={() => setAttendanceDialogOpen(false)}
          sections={sections}
          selectedSection={selectedSection}
        />
      </Container>
    </ThemeProvider>
  );
}
