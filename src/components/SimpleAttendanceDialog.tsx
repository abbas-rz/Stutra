import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CalendarToday,
  TableChart,
  FileDownload,
} from '@mui/icons-material';
import { firebaseService } from '../services/firebase';
import { formatDateDDMMYYYY, getCurrentDateString } from '../utils';
import type { Student } from '../types';

interface SimpleAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
  students: Student[]; // Add actual students data
}

interface StudentWithRollNumber extends Student {
  sectionRollNumber: number;
}

// Helper functions for cleaner code organization
const filterStudentsBySection = (students: Student[], section?: string): Student[] => {
  if (!section || section === 'All') return students;
  
  return students.filter(student => 
    student.sections?.includes(section) || 
    student.section === section // Legacy compatibility
  );
};

const assignRollNumbers = (students: Student[]): StudentWithRollNumber[] => {
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  return sortedStudents.map((student, index) => ({
    ...student,
    sectionRollNumber: index + 1
  }));
};

const getLatestStudentStatuses = (logs: any[]): Map<number, string> => {
  const statusMap = new Map<number, string>();
  const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
  
  sortedLogs.forEach(log => {
    if (!statusMap.has(log.student_id)) {
      statusMap.set(log.student_id, log.status);
    }
  });
  
  return statusMap;
};

const getAttendanceStatus = (studentId: number, statusMap: Map<number, string>): string => {
  const loggedStatus = statusMap.get(studentId);
  return loggedStatus && loggedStatus !== 'absent' ? 'P' : 'A';
};

export function SimpleAttendanceDialog({ 
  open, 
  onClose, 
  sections, 
  selectedSection,
  students
}: SimpleAttendanceDialogProps) {
  const [exportType, setExportType] = useState<'single' | 'multiple'>('single');
  const [targetDate, setTargetDate] = useState(getCurrentDateString());
  const [startDate, setStartDate] = useState(getCurrentDateString());
  const [endDate, setEndDate] = useState(getCurrentDateString());
  const [sectionFilter, setSectionFilter] = useState(selectedSection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  /**
   * Export attendance data for a single date as CSV
   * @param targetDate - Date to export in YYYY-MM-DD format
   * @param section - Optional section filter
   * @returns CSV content string
   */
  const exportSingleDateCSV = async (targetDate: string, section?: string): Promise<string> => {
    try {
      console.log(`� Starting CSV export for ${targetDate} (Section: ${section || 'All'})`);
      
      // Initialize service
      await firebaseService.initialize();
      
      // Filter and prepare students
      const studentsToExport = filterStudentsBySection(students, section);
      const studentsWithRollNumbers = assignRollNumbers(studentsToExport);
      
      console.log(`📋 Exporting ${studentsWithRollNumbers.length} students`);
      
      // Get attendance logs for the date
      const logs = await firebaseService.getAttendanceLogs(targetDate, targetDate);
      const studentStatuses = getLatestStudentStatuses(logs);
      
      console.log(`📝 Found ${logs.length} attendance logs for ${targetDate}`);
      
      // Generate CSV content
      const headers = ['Student Name', 'Roll Number', formatDateDDMMYYYY(targetDate)];
      const rows = studentsWithRollNumbers.map((student: StudentWithRollNumber) => {
        const attendance = getAttendanceStatus(student.id, studentStatuses);
        return [student.name, student.sectionRollNumber.toString(), attendance];
      });
      
      const csvContent = [headers, ...rows]
        .map((row: string[]) => row.map((field: string) => `"${field}"`).join(','))
        .join('\n');
      
      console.log('✅ CSV export completed successfully');
      return csvContent;
      
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      throw error;
    }
  };

  /**
   * Export attendance data for multiple dates as CSV
   * @param dateRange - Array of dates in YYYY-MM-DD format
   * @param section - Optional section filter
   * @returns CSV content string
   */
  const exportMultiDateCSV = async (dateRange: string[], section?: string): Promise<string> => {
    try {
      console.log(`� Starting multi-date CSV export for ${dateRange.length} dates (Section: ${section || 'All'})`);
      
      // Initialize service
      await firebaseService.initialize();
      
      // Filter and prepare students
      const studentsToExport = filterStudentsBySection(students, section);
      const studentsWithRollNumbers = assignRollNumbers(studentsToExport);
      
      console.log(`📋 Exporting ${studentsWithRollNumbers.length} students for date range`);
      
      // Create CSV headers
      const headers = ['Student Name', 'Roll Number', ...dateRange.map(formatDateDDMMYYYY)];
      
      // Get attendance data for each date
      const attendanceByDate = new Map<string, Map<number, string>>();
      
      for (const date of dateRange) {
        const logs = await firebaseService.getAttendanceLogs(date, date);
        const studentStatuses = getLatestStudentStatuses(logs);
        attendanceByDate.set(date, studentStatuses);
      }
      
      // Create rows with attendance for each date
      const rows = studentsWithRollNumbers.map((student: StudentWithRollNumber) => {
        const dateColumns = dateRange.map(date => {
          const statusMap = attendanceByDate.get(date);
          return getAttendanceStatus(student.id, statusMap || new Map());
        });
        
        return [student.name, student.sectionRollNumber.toString(), ...dateColumns];
      });
      
      // Generate CSV content
      const csvContent = [headers, ...rows]
        .map((row: string[]) => row.map((field: string) => `"${field}"`).join(','))
        .join('\n');
      
      console.log('✅ Multi-date CSV export completed successfully');
      return csvContent;
      
    } catch (error) {
      console.error('❌ Multi-date CSV export failed:', error);
      throw error;
    }
  };

  const handleSingleDateExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const csvContent = await exportSingleDateCSV(targetDate, sectionFilter);
      
      const filename = `attendance_${targetDate}_${sectionFilter === 'All' ? 'all_sections' : sectionFilter.replace(/\s+/g, '_')}.csv`;
      downloadCSV(csvContent, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleDateExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateRange = generateDateRange(startDate, endDate);
      
      if (dateRange.length > 31) {
        setError('Please select a date range of 31 days or less.');
        setLoading(false);
        return;
      }
      
      const csvContent = await exportMultiDateCSV(dateRange, sectionFilter);
      
      const filename = `attendance_${startDate}_to_${endDate}_${sectionFilter === 'All' ? 'all_sections' : sectionFilter.replace(/\s+/g, '_')}.csv`;
      downloadCSV(csvContent, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'single') {
      handleSingleDateExport();
    } else {
      handleMultipleDateExport();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <TableChart color="primary" />
          <Typography variant="h6" component="span">
            Export Attendance
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Export date-based attendance with proper daily tracking
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Export Type Selection */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Export Type
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label="Single Date"
                  variant={exportType === 'single' ? 'filled' : 'outlined'}
                  color={exportType === 'single' ? 'primary' : 'default'}
                  onClick={() => setExportType('single')}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Date Range"
                  variant={exportType === 'multiple' ? 'filled' : 'outlined'}
                  color={exportType === 'multiple' ? 'primary' : 'default'}
                  onClick={() => setExportType('multiple')}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Section Filter */}
          <FormControl fullWidth>
            <InputLabel>Section</InputLabel>
            <Select
              value={sectionFilter}
              label="Section"
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              {sections.map((section) => (
                <MenuItem key={section} value={section}>
                  {section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Selection */}
          {exportType === 'single' ? (
            <Box>
              <TextField
                fullWidth
                type="date"
                label="Target Date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                helperText="Date input format: Browser default, exported as dd/mm/yyyy"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Date will be displayed as {formatDateDDMMYYYY(targetDate)} in export
              </Typography>
            </Box>
          ) : (
            <Box display="flex" gap={2} flexDirection="column">
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Input format: Browser default"
                />
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                  helperText="Input format: Browser default"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Dates will be displayed as {formatDateDDMMYYYY(startDate)} to {formatDateDDMMYYYY(endDate)} in export
              </Typography>
            </Box>
          )}

          {/* Export Preview */}
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Export Format Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                CSV will contain daily attendance based on actual date changes:
              </Typography>
              <Box component="pre" sx={{ 
                fontSize: '0.75rem', 
                bgcolor: 'rgba(0, 0, 0, 0.1)', 
                p: 1.5, 
                borderRadius: 1,
                overflow: 'auto',
                fontFamily: 'monospace'
              }}>
{exportType === 'single' 
  ? `Student Name,Roll Number,${formatDateDDMMYYYY(targetDate)}\n"Alice Johnson","1","P"\n"Bob Smith","2","A"\n"Charlie Davis","3","P"`
  : `Student Name,Roll Number,${formatDateDDMMYYYY(startDate)},${startDate !== endDate ? '...' : ''},${formatDateDDMMYYYY(endDate)}\n"Alice Johnson","1","P","P","P"\n"Bob Smith","2","A","P","A"\n"Charlie Davis","3","P","P","P"`
}
              </Box>
              <Typography variant="caption" color="text.secondary">
                • Students sorted alphabetically by name<br/>
                • Roll numbers start from 1 within each section<br/>
                • Default status is Absent (A)<br/>
                • Present (P) only if marked present on that specific date<br/>
                • Date-based attendance tracking with audit trail
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <FileDownload />}
          sx={{
            minWidth: 120,
            background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0051D5, #007AFF)',
            },
          }}
        >
          {loading ? 'Exporting...' : 'Export CSV'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
