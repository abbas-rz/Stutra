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

interface SimpleAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
}

export function SimpleAttendanceDialog({ 
  open, 
  onClose, 
  sections, 
  selectedSection 
}: SimpleAttendanceDialogProps) {
  const [exportType, setExportType] = useState<'single' | 'multiple'>('single');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
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

  const handleSingleDateExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const csvContent = await googleSheetsService.exportSimpleAttendanceCSV(
        targetDate, 
        sectionFilter
      );
      
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
      
      const csvContent = await googleSheetsService.exportMultiDateAttendanceCSV(
        dateRange, 
        sectionFilter
      );
      
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
          ) : (
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
  ? `Student Name,Roll Number,Admission Number,${targetDate}\n"Alice Johnson","1","2024001","P"\n"Bob Smith","2","2024002","A"\n"Charlie Davis","3","2024003","P"`
  : `Student Name,Roll Number,Admission Number,${startDate},${startDate !== endDate ? '...' : ''},${endDate}\n"Alice Johnson","1","2024001","P","P","P"\n"Bob Smith","2","2024002","A","P","A"\n"Charlie Davis","3","2024003","P","P","P"`
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
