import { useState, useCallback, useMemo } from 'react';
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
  IconButton,
  Menu,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  Analytics,
  AccountCircle,
  Logout,
  Person,
  CheckCircle,
  Cancel,
  Brightness7,
  Brightness4,
  Group,
  DirectionsRun,
} from '@mui/icons-material';
import appleTheme from '../../theme';
import { StudentCard } from '../StudentCard/index';
import { ActivityDialog } from '../ActivityDialog/index';
import { NotesDialog } from '../NotesDialog';
import { SimpleAttendanceDialog } from '../SimpleAttendanceDialog';
import { useStudents, useStudentFilters } from '../../hooks';
import { authService } from '../../services';
import { APP_CONFIG, BREAKPOINTS } from '../../constants/index';
import type { Student } from '../../types';

/**
 * Main application component for the Stutra student tracking system.
 * 
 * This component orchestrates the entire student attendance tracking interface,
 * providing functionality for:
 * - Displaying student cards in a responsive grid layout
 * - Managing student status changes (present, absent, washroom, activity, bunking)
 * - Handling search and filtering by section
 * - Managing dialogs for activities, notes, and attendance export
 * - Real-time updates and error handling
 * 
 * Features:
 * - Mobile-first responsive design optimized for phone usage
 * - Real-time Firebase synchronization
 * - Apple-inspired UI with smooth animations and transitions
 * - Context-aware status management with visual feedback
 * - Search and filtering capabilities
 * - CSV export functionality for attendance tracking
 * 
 * The component uses custom hooks for state management:
 * - useStudents: Manages student data and Firebase synchronization
 * - useStudentFilters: Handles search, filtering, and alphabetical sorting
 * 
 * @returns The main application interface
 */
export default function App() {
  // UI State Management
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState<boolean>(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState<boolean>(false);
  const [simpleAttendanceOpen, setSimpleAttendanceOpen] = useState<boolean>(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [countsOpen, setCountsOpen] = useState(false);
  const [bunkingOpen, setBunkingOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Responsive Design
  const isMobile = useMediaQuery(appleTheme.breakpoints.down(BREAKPOINTS.MOBILE));

  // Data Management Hooks
  const { 
    students, 
    loading, 
    error, 
    updateStudentStatus, 
    resetStudent, 
    addStudentNote, 
    deleteStudentNote,
    markAllPresent,
    markAllAbsent,
  } = useStudents();
  const { 
    searchTerm, 
    selectedSection, 
    filteredStudents, 
    sections, 
    setSearchTerm, 
    setSelectedSection 
  } = useStudentFilters(students);

  // Authentication
  const currentTeacher = authService.getCurrentTeacher();

  // Derived counts across all sections
  const presentTotal = useMemo(() => students.filter(s => s.status !== 'absent').length, [students]);
  const totalStudents = students.length;

  const bunkingStudents = useMemo(() => students.filter(s => s.status === 'bunking'), [students]);

  // New: section-wise counts
  const sectionCounts = useMemo(() => {
    const actualSections = sections.filter((s) => s !== 'All');
    return actualSections.map((sec) => {
      const secStudents = students.filter((st) => (st.sections?.includes(sec)) || st.section === sec);
      const present = secStudents.filter((st) => st.status !== 'absent').length;
      return { section: sec, present, total: secStudents.length };
    });
  }, [sections, students]);

  const selectedSectionCounts = useMemo(() => {
    if (selectedSection && selectedSection !== 'All') {
      const found = sectionCounts.find((s) => s.section === selectedSection);
      return found || { section: selectedSection, present: 0, total: 0 };
    }
    return { section: 'All', present: presentTotal, total: totalStudents };
  }, [selectedSection, sectionCounts, presentTotal, totalStudents]);

  // Event Handlers
  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchor(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.logout();
      handleUserMenuClose();
      // Force a hard redirect to login page to ensure authentication state is properly reset
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [handleUserMenuClose]);

  const handleActivitySelect = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
    setActivityDialogOpen(true);
  }, []);

  const handleNotesOpen = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
    setNotesDialogOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (
    studentId: number, 
    status: Student['status'], 
    activity: string, 
    timerEnd: number | null
  ) => {
    try {
      await updateStudentStatus(studentId, status, activity, timerEnd);
    } catch (error) {
      console.error('Error updating student status:', error);
    }
  }, [updateStudentStatus]);

  const handleResetStudent = useCallback(async (studentId: number) => {
    try {
      await resetStudent(studentId);
    } catch (error) {
      console.error('Error resetting student:', error);
    }
  }, [resetStudent]);

  const handleAddNote = useCallback(async (note: string) => {
    if (selectedStudentId) {
      try {
        await addStudentNote(selectedStudentId, note);
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  }, [selectedStudentId, addStudentNote]);

  const handleDeleteNote = useCallback(async (index: number) => {
    if (selectedStudentId) {
      try {
        await deleteStudentNote(selectedStudentId, index);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  }, [selectedStudentId, deleteStudentNote]);

  const handleActivityDialogSelect = useCallback(async (activity: string) => {
    if (selectedStudentId) {
      try {
        await updateStudentStatus(selectedStudentId, 'activity', activity, null);
        setActivityDialogOpen(false);
        setSelectedStudentId(null);
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    }
  }, [selectedStudentId, updateStudentStatus]);

  // Memoized Values
  const selectedStudent = useMemo(() => 
    selectedStudentId ? students.find(s => s.id === selectedStudentId) : null,
    [selectedStudentId, students]
  );

  // Build theme based on mode
  const themed = useMemo(() => {
    // Clone theme and override palette mode and minimal backgrounds
    const t = { ...appleTheme, palette: { ...appleTheme.palette, mode: themeMode, background: { ...appleTheme.palette.background, default: themeMode === 'light' ? '#fafafa' : appleTheme.palette.background.default, paper: themeMode === 'light' ? '#ffffff' : appleTheme.palette.background.paper }, text: { ...appleTheme.palette.text, primary: themeMode === 'light' ? '#1f2937' : appleTheme.palette.text.primary, secondary: themeMode === 'light' ? '#4b5563' : appleTheme.palette.text.secondary } } } as typeof appleTheme;
    return t;
  }, [themeMode]);

  if (loading) {
    return (
      <ThemeProvider theme={themed}>
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
      <ThemeProvider theme={themed}>
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
    <ThemeProvider theme={themed}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', minHeight: '100vh' }}>
        <Box mb={4}>
          {/* Header with Title, Section Selector, and User Menu */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
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
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {/* Theme toggle */}
              <IconButton
                onClick={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
                sx={{
                  bgcolor: 'rgba(0, 122, 255, 0.1)',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(0, 122, 255, 0.2)' },
                }}
                title={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {themeMode === 'light' ? <Brightness4 /> : <Brightness7 />}
              </IconButton>

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

              {/* User Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ 
                  bgcolor: 'rgba(0, 122, 255, 0.1)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(0, 122, 255, 0.2)',
                  },
                }}
              >
                <AccountCircle />
              </IconButton>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiPaper-root': {
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minWidth: 180,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                    {currentTeacher?.name || 'Teacher'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentTeacher?.email || 'No email'}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', py: 1.5 }}>
                  <Logout sx={{ mr: 1, fontSize: 20 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Search and Action Controls */}
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
            
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => markAllPresent(selectedSection === 'All' ? undefined : selectedSection)}
                startIcon={<CheckCircle />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 122, 255, 0.1)',
                  },
                }}
              >
                {isMobile ? '' : `Mark All Present${selectedSection !== 'All' ? ` (${selectedSection})` : ''}`}
              </Button>

              {/* New: Mark All Absent */}
              <Button
                variant="outlined"
                onClick={() => markAllAbsent(selectedSection === 'All' ? undefined : selectedSection)}
                startIcon={<Cancel />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: 'rgba(255, 69, 58, 0.08)',
                  },
                }}
              >
                {isMobile ? '' : `Mark All Absent${selectedSection !== 'All' ? ` (${selectedSection})` : ''}`}
              </Button>
              
              {/* New: View counts across all sections */}
              <Button
                variant="outlined"
                onClick={() => setCountsOpen(true)}
                startIcon={<Group />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 122, 255, 0.1)',
                  },
                }}
              >
                {isMobile ? '' : `${selectedSectionCounts.present}/${selectedSectionCounts.total} (${selectedSectionCounts.section})`}
              </Button>

              {/* New: View all bunking students */}
              <Button
                variant="outlined"
                onClick={() => setBunkingOpen(true)}
                startIcon={<DirectionsRun />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 122, 255, 0.1)',
                  },
                }}
              >
                {isMobile ? '' : 'View Bunking'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setSimpleAttendanceOpen(true)}
                startIcon={<Analytics />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(0, 122, 255, 0.1)',
                  },
                }}
              >
                {isMobile ? '' : 'Export'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Students Grid */}
        <ThemeProvider theme={appleTheme}>
          <Fade in={true} timeout={800}>
            <Box
              display="grid"
              gridTemplateColumns={isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))'}
              gap={2}
              sx={{ pb: 10 }}
            >
              {filteredStudents.map((student) => (
                <StudentCard
                  key={`${student.id}-${student.admission_number}`}
                  student={student}
                  onStatusChange={handleStatusChange}
                  onActivitySelect={handleActivitySelect}
                  onNotesOpen={handleNotesOpen}
                  onResetStudent={handleResetStudent}
                  isMobile={isMobile}
                />
              ))}
            </Box>
          </Fade>
        </ThemeProvider>

        {/* Student Count Badge */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'rgba(28, 28, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 1000,
          }}
        >
          <Person sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Dialogs */}
        <ActivityDialog
          open={activityDialogOpen}
          onClose={() => {
            setActivityDialogOpen(false);
            setSelectedStudentId(null);
          }}
          onSelect={handleActivityDialogSelect}
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
          open={simpleAttendanceOpen}
          onClose={() => setSimpleAttendanceOpen(false)}
          students={students}
          sections={sections}
          selectedSection={selectedSection}
        />

        {/* Counts Dialog */}
        <Dialog open={countsOpen} onClose={() => setCountsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Attendance Summary (Section-wise)</DialogTitle>
          <DialogContent>
            {sectionCounts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No sections available.</Typography>
            ) : (
              <List>
                {sectionCounts.map((s) => (
                  <ListItem key={s.section} divider>
                    <ListItemText
                      primary={s.section}
                      secondary={`${s.present}/${s.total} present`}
                    />
                    <Stack direction="row" spacing={1}>
                      <Chip label={`Present: ${s.present}`} color="success" />
                      <Chip label={`Total: ${s.total}`} />
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCountsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Bunking Students Dialog */}
        <Dialog open={bunkingOpen} onClose={() => setBunkingOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Bunking Students (All Sections)</DialogTitle>
          <DialogContent dividers>
            {bunkingStudents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No bunking students.</Typography>
            ) : (
              <List>
                {bunkingStudents.map((s) => (
                  <ListItem key={s.id} divider>
                    <ListItemText
                      primary={`${s.name} (#${s.admission_number})`}
                      secondary={`Sections: ${s.sections?.join(', ') || s.section || 'Unknown'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBunkingOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
