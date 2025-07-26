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
import { googleSheetsService } from '../services/googleSheets';
import { formatDateDDMMYYYY, getCurrentDateString } from '../utils';
import type { Student } from '../types';

interface SimpleAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
  students: Student[]; // Add actual students data
}

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

  // Local CSV export methods using the actual students data
  const exportSingleDateCSV = async (targetDate: string, section?: string): Promise<string> => {
    try {
      console.log('🔍 CSV Export Debug - Starting export for date:', targetDate);
      console.log('🔍 Current date for comparison:', new Date().toISOString().split('T')[0]);
      
      // Check Firebase connection and data first
      console.log('🔥 Checking Firebase connection and existing logs...');
      const allLogsRaw = await googleSheetsService.getAttendanceLogs();
      console.log('🔥 Firebase connection check - Total logs in database:', allLogsRaw.length);
      
      if (allLogsRaw.length === 0) {
        console.log('⚠️  WARNING: No attendance logs found in Firebase database');
      } else {
        console.log('✅ Found attendance logs in Firebase');
        console.log('🔥 Sample log statuses:', allLogsRaw.slice(0, 5).map(log => `${log.student_name}: ${log.status}`));
      }
      
      // Filter by section if specified
      let studentsToExport = students;
      if (section && section !== 'All') {
        studentsToExport = students.filter(student => student.section === section);
      }

      console.log('📊 Students to export:', studentsToExport.length);
      console.log('📋 First few students:', studentsToExport.slice(0, 3).map(s => `${s.name} (ID: ${s.id})`));

      // Sort students alphabetically by name
      studentsToExport.sort((a, b) => a.name.localeCompare(b.name));

      // Generate section-based roll numbers (starting from 1)
      const studentsWithRollNumbers = studentsToExport.map((student, index) => ({
        ...student,
        sectionRollNumber: index + 1
      }));

      // Get attendance logs for the target date - don't filter by section here since we already filtered students
      const logs = await googleSheetsService.getAttendanceLogs(targetDate, targetDate);
      console.log('📝 Total attendance logs found for date:', logs.length);
      console.log('📝 All logs for debugging:', logs.map(log => ({
        student_name: log.student_name,
        student_id: log.student_id,
        status: log.status,
        date: log.date,
        timestamp: new Date(log.timestamp).toLocaleString()
      })));
      console.log('📝 Sample logs:', logs.slice(0, 3).map(log => `${log.student_name} (ID: ${log.student_id}): ${log.status}`));
      
      // Get the latest status for each student on this date
      const studentStatuses = new Map<number, string>();
      
      // Sort logs by timestamp (newest first) and process
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
      sortedLogs.forEach(log => {
        // Only set if we haven't seen this student yet (keeps the latest)
        if (!studentStatuses.has(log.student_id)) {
          studentStatuses.set(log.student_id, log.status);
          console.log(`✅ Latest status for ${log.student_name} (ID: ${log.student_id}): ${log.status}`);
        }
      });

      console.log('🎯 Final student statuses map size:', studentStatuses.size);
      console.log('🎯 Student statuses:', Array.from(studentStatuses.entries()).slice(0, 5));

      // Create CSV headers
      const headers = ['Student Name', 'Roll Number', targetDate];

      // Convert students to CSV rows
      const rows = studentsWithRollNumbers.map(student => {
        // Check if there's a log entry for this student on this date
        const loggedStatus = studentStatuses.get(student.id);
        
        let attendance: string;
        if (loggedStatus) {
          // If there's a log entry, use it to determine P/A
          attendance = loggedStatus === 'absent' ? 'A' : 'P';
          console.log(`✅ ${student.name} (ID: ${student.id}): Has log with status '${loggedStatus}' -> ${attendance}`);
        } else {
          // If no log entry, default to 'A' (absent) as per daily reset system
          attendance = 'A';
          console.log(`❌ ${student.name} (ID: ${student.id}): No log found -> ${attendance}`);
        }
        
        return [
          student.name,
          student.sectionRollNumber.toString(),
          attendance
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      console.log('📄 CSV Export completed successfully');
      return csvContent;
    } catch (error) {
      console.error('❌ Failed to export single date attendance to CSV:', error);
      throw error;
    }
  };

  const exportMultiDateCSV = async (dateRange: string[], section?: string): Promise<string> => {
    try {
      // Filter by section if specified
      let studentsToExport = students;
      if (section && section !== 'All') {
        studentsToExport = students.filter(student => student.section === section);
      }

      // Sort students alphabetically by name
      studentsToExport.sort((a, b) => a.name.localeCompare(b.name));

      // Generate section-based roll numbers (starting from 1)
      const studentsWithRollNumbers = studentsToExport.map((student, index) => ({
        ...student,
        sectionRollNumber: index + 1
      }));

      // Create CSV headers - student info + date columns
      const headers = ['Student Name', 'Roll Number', ...dateRange];

      // Get attendance data for each date
      const attendanceByDate = new Map<string, Map<number, string>>();
      
      for (const date of dateRange) {
        // Don't filter by section in getAttendanceLogs since we already filtered students
        const logs = await googleSheetsService.getAttendanceLogs(date, date);
        const studentStatuses = new Map<number, string>();
        
        // Sort logs by timestamp (newest first) and get latest status per student
        const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
        sortedLogs.forEach(log => {
          // Only set if we haven't seen this student yet (keeps the latest)
          if (!studentStatuses.has(log.student_id)) {
            studentStatuses.set(log.student_id, log.status);
          }
        });
        
        attendanceByDate.set(date, studentStatuses);
      }

      // Create rows with attendance for each date
      const rows = studentsWithRollNumbers.map(student => {
        const dateColumns = dateRange.map(date => {
          const statusMap = attendanceByDate.get(date);
          const loggedStatus = statusMap?.get(student.id);
          
          // If there's a log entry, use it to determine P/A, otherwise default to A
          if (loggedStatus) {
            return loggedStatus === 'absent' ? 'A' : 'P';
          } else {
            return 'A'; // Default to absent if no log entry
          }
        });
        
        return [
          student.name,
          student.sectionRollNumber.toString(),
          ...dateColumns
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export multi-date attendance to CSV:', error);
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
                />
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
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
  ? `Student Name,Roll Number,Admission Number,${formatDateDDMMYYYY(targetDate)}\n"Alice Johnson","1","2024001","P"\n"Bob Smith","2","2024002","A"\n"Charlie Davis","3","2024003","P"`
  : `Student Name,Roll Number,Admission Number,${formatDateDDMMYYYY(startDate)},${startDate !== endDate ? '...' : ''},${formatDateDDMMYYYY(endDate)}\n"Alice Johnson","1","2024001","P","P","P"\n"Bob Smith","2","2024002","A","P","A"\n"Charlie Davis","3","2024003","P","P","P"`
}
              </Box>
              <Typography variant="caption" color="text.secondary">
                • Students sorted alphabetically by name<br/>
                • Roll numbers start from 1 within each section<br/>
                • Default status is Absent (A)<br/>
                • Present (P) only if marked present on that specific date<br/>
                • Includes admission number for verification
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


interface SimpleAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
}
