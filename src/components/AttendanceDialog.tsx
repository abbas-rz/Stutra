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
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download,
  Analytics,
  CalendarToday,
  TrendingUp,
  Group,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { googleSheetsService } from '../services/googleSheets';

interface AttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
}

interface DailySummary {
  total: number;
  present: number;
  absent: number;
  washroom: number;
  activity: number;
  bunking: number;
}

export function AttendanceDialog({ open, onClose, sections, selectedSection }: AttendanceDialogProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [section, setSection] = useState(selectedSection);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleExportCSV = async () => {
    setLoading(true);
    setError('');
    
    try {
      const csvContent = await googleSheetsService.exportAttendanceToCSV(
        startDate,
        endDate,
        section === 'All' ? undefined : section
      );
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${section}_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setError(error instanceof Error ? error.message : 'Failed to export attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    setLoading(true);
    setError('');
    
    try {
      const summaryData = await googleSheetsService.getDailySummary(
        startDate,
        section === 'All' ? undefined : section
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to get summary:', error);
      setError('Failed to get attendance summary');
    } finally {
      setLoading(false);
    }
  };

  const getSummaryColor = (status: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'washroom': return 'info';
      case 'activity': return 'warning';
      case 'bunking': return 'error';
      default: return 'default';
    }
  };

  const getSummaryIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'washroom': return <CalendarToday />;
      case 'activity': return <Analytics />;
      case 'bunking': return <TrendingUp />;
      default: return <Group />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 700,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        📊 Attendance Management & Reports
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {/* Date and Section Selection */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Report Parameters
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Section</InputLabel>
              <Select
                value={section}
                label="Section"
                onChange={(e) => setSection(e.target.value)}
              >
                {sections.map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleGetSummary}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Analytics />}
              sx={{ height: '40px' }}
            >
              Get Summary
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Display */}
        {summary && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Daily Summary - {startDate}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Card sx={{ bgcolor: 'rgba(0, 122, 255, 0.1)', border: '1px solid rgba(0, 122, 255, 0.3)', minWidth: 150 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Group color="primary" />
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {summary.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Students
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              {Object.entries(summary)
                .filter(([key]) => key !== 'total')
                .map(([status, count]) => (
                <Card key={status} sx={{ minWidth: 120 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getSummaryIcon(status)}
                      <Box>
                        <Typography variant="h5" fontWeight={700}>
                          {count as number}
                        </Typography>
                        <Chip
                          label={status.charAt(0).toUpperCase() + status.slice(1)}
                          size="small"
                          color={getSummaryColor(status)}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Export Section */}
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Export Options
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export detailed attendance logs including timestamps, status changes, and activity durations.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleExportCSV}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Download />}
            sx={{
              background: 'linear-gradient(45deg, #30D158, #32D74B)',
              '&:hover': {
                background: 'linear-gradient(45deg, #28B946, #30D158)',
              },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            {loading ? 'Exporting...' : 'Export to CSV'}
          </Button>
        </Box>

        {/* Info Box */}
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.2rem'
            }
          }}
        >
          <Typography variant="body2">
            <strong>CSV Export includes:</strong> Date, Time, Student Name, Admission Number, Section, 
            Status, Activity, Duration, Notes, and who logged the change. Perfect for record-keeping 
            and analysis.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
