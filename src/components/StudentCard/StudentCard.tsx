import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Box,
  Button,
  IconButton,
  Switch,
  Collapse,
} from '@mui/material';
import {
  Person,
  CheckCircle,
  Note,
  RestartAlt,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import type { Student } from '../../types';
import { STATUS_CONFIG, STUDENT_STATUS } from '../../constants';
import { 
  formatTimeRemaining, 
  isStudentPresent, 
  getLatestNote, 
  hasMultipleNotes 
} from '../../utils';

interface StudentCardProps {
  student: Student;
  onStatusChange: (
    studentId: number, 
    status: Student['status'], 
    activity: string, 
    timerEnd: number | null
  ) => void;
  onActivitySelect: (studentId: number) => void;
  onNotesOpen: (studentId: number) => void;
  onResetStudent: (studentId: number) => void;
  isMobile?: boolean;
}

export function StudentCard({ 
  student, 
  onStatusChange, 
  onActivitySelect, 
  onNotesOpen, 
  onResetStudent, 
  isMobile = false 
}: StudentCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  const statusInfo = STATUS_CONFIG[student.status];
  const StatusIcon = statusInfo.icon || CheckCircle;
  const isPresent = isStudentPresent(student);
  const latestNote = getLatestNote(student.notes);
  const multipleNotes = hasMultipleNotes(student.notes);

  // Timer effect
  useEffect(() => {
    if (student.timer_end) {
      const interval = setInterval(() => {
        const formatted = formatTimeRemaining(student.timer_end!);
        if (formatted) {
          setTimeRemaining(formatted);
        } else {
          setTimeRemaining('');
          onStatusChange(student.id, STUDENT_STATUS.PRESENT, '', null);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [student.timer_end, student.id, onStatusChange]);

  const handleStatusClick = (status: Student['status']) => {
    if (!isPresent && status !== STUDENT_STATUS.PRESENT) return;
    
    if (status === STUDENT_STATUS.WASHROOM) {
      const timerEnd = new Date().getTime() + (12 * 60 * 1000);
      onStatusChange(student.id, status, '', timerEnd);
    } else if (status === STUDENT_STATUS.ACTIVITY) {
      onActivitySelect(student.id);
    } else {
      onStatusChange(student.id, status, '', null);
    }
  };

  const handlePresentToggle = (checked: boolean) => {
    const newStatus = checked ? STUDENT_STATUS.PRESENT : STUDENT_STATUS.ABSENT;
    onStatusChange(student.id, newStatus, '', null);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isPresent ? 1 : 0.6,
        transform: isPresent ? 'none' : 'scale(0.98)',
        '&:hover': {
          transform: isPresent ? 'translateY(-4px) scale(1.02)' : 'translateY(-2px) scale(0.99)',
          boxShadow: isPresent 
            ? '0 12px 40px rgba(0, 122, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)' 
            : '0 8px 24px rgba(0, 0, 0, 0.2)',
        },
        border: '1px solid',
        borderColor: isPresent ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with Avatar, Student Info, and Controls */}
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar 
            sx={{ 
              width: isMobile ? 36 : 48, 
              height: isMobile ? 36 : 48, 
              mr: isMobile ? 1.5 : 2, 
              bgcolor: isPresent ? 'primary.main' : 'rgba(255, 255, 255, 0.3)',
              boxShadow: isPresent ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none',
              border: '1px solid',
              borderColor: isPresent ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Person fontSize={isMobile ? 'small' : 'medium'} />
          </Avatar>
          
          <Box flexGrow={1} mr={1}>
            <Typography 
              variant={isMobile ? 'body2' : 'subtitle2'} 
              fontWeight="bold" 
              noWrap 
              sx={{ mb: 0.2, lineHeight: 1.2 }}
            >
              {student.name}
            </Typography>
            <Typography 
              variant="caption"
              color="text.secondary" 
              sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem', lineHeight: 1 }}
            >
              #{student.admission_number}
            </Typography>
          </Box>

          {/* Right side controls */}
          <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
            <IconButton
              size="small"
              onClick={() => onNotesOpen(student.id)}
              sx={{
                bgcolor: latestNote ? 'warning.main' : 'rgba(118, 118, 128, 0.12)',
                color: latestNote ? 'black' : 'text.secondary',
                '&:hover': {
                  bgcolor: 'warning.main',
                  color: 'black',
                  transform: 'scale(1.05)',
                },
                width: isMobile ? 28 : 32,
                height: isMobile ? 28 : 32,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Note fontSize="small" />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={() => onResetStudent(student.id)}
              sx={{
                bgcolor: 'rgba(255, 69, 58, 0.15)',
                color: 'error.main',
                border: '1px solid rgba(255, 69, 58, 0.3)',
                width: isMobile ? 28 : 32,
                height: isMobile ? 28 : 32,
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(255, 69, 58, 0.4)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <RestartAlt fontSize="small" />
            </IconButton>

            {/* Present/Absent toggle */}
            <Box display="flex" flexDirection="column" alignItems="center" ml={0.5}>
              <Switch
                checked={isPresent}
                onChange={(e) => handlePresentToggle(e.target.checked)}
                size="medium"
                sx={{
                  transform: isMobile ? 'scale(1.0)' : 'scale(0.9)',
                  mb: isMobile ? 0.5 : 0.3,
                  '& .MuiSwitch-thumb': {
                    width: isMobile ? 24 : 20,
                    height: isMobile ? 24 : 20,
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: isMobile ? 12 : 10,
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color={isPresent ? 'success.main' : 'error.main'}
                sx={{ 
                  fontSize: isMobile ? '0.7rem' : '0.65rem', 
                  fontWeight: 600, 
                  lineHeight: 1,
                  textAlign: 'center',
                  minWidth: isMobile ? '40px' : '35px',
                }}
              >
                {isPresent ? 'Present' : 'Absent'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status Chip and Timer */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Chip
            icon={<StatusIcon />}
            label={statusInfo.label}
            size="medium"
            sx={{ 
              bgcolor: statusInfo.color,
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: `0 4px 12px ${statusInfo.color}50`,
              opacity: isPresent ? 1 : 0.5,
              border: '2px solid',
              borderColor: statusInfo.color,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 6px 16px ${statusInfo.color}60`,
              },
              transition: 'all 0.2s ease-in-out',
            }}
          />
          {timeRemaining && isPresent && (
            <Typography 
              variant="caption" 
              color="primary"
              sx={{ 
                bgcolor: 'rgba(0, 122, 255, 0.15)',
                px: 1.5,
                py: 0.8,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.8rem',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              ⏱️ {timeRemaining}
            </Typography>
          )}
        </Box>

        {/* Activity Info */}
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

        {/* Notes Section */}
        {latestNote && (
          <Box mb={1.5}>
            <Box
              onClick={() => multipleNotes && setNotesExpanded(!notesExpanded)}
              sx={{ 
                bgcolor: 'rgba(100, 210, 255, 0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                cursor: multipleNotes ? 'pointer' : 'default',
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
              {multipleNotes && (
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
        <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-start">
          {Object.entries(STATUS_CONFIG)
            .filter(([status]) => status !== STUDENT_STATUS.PRESENT && status !== STUDENT_STATUS.ABSENT)
            .map(([status, config]) => {
            const Icon = config.icon || CheckCircle;
            const isDisabled = !isPresent;
            const isActive = student.status === status;
            return (
              <IconButton
                key={status}
                size="medium"
                onClick={() => handleStatusClick(status as Student['status'])}
                disabled={isDisabled}
                sx={{
                  bgcolor: isActive ? config.color : 'rgba(118, 118, 128, 0.12)',
                  color: isActive ? 'white' : config.color,
                  border: `2px solid ${isActive ? config.color : `${config.color}40`}`,
                  opacity: isDisabled ? 0.3 : 1,
                  '&:hover': !isDisabled ? {
                    bgcolor: config.color,
                    color: 'white',
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: `0 6px 20px ${config.color}50`,
                    borderColor: config.color,
                  } : {},
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(118, 118, 128, 0.06)',
                    color: 'rgba(118, 118, 128, 0.3)',
                    border: '2px solid rgba(118, 118, 128, 0.1)',
                  },
                  minWidth: 0,
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&::after': isActive ? {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: 'background.paper',
                  } : {},
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
