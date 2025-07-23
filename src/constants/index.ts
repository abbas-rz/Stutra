import { CheckCircle, Cancel, Wc, Assignment, DirectionsRun } from '@mui/icons-material';

// Application Constants
export const APP_CONFIG = {
  APP_NAME: 'Stutra',
  APP_DESCRIPTION: 'Student Tracker',
  REFRESH_INTERVAL: 10000, // 10 seconds
  WASHROOM_TIMER_MINUTES: 12,
} as const;

// Student Status Configuration
export const STUDENT_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  WASHROOM: 'washroom',
  ACTIVITY: 'activity',
  BUNKING: 'bunking',
} as const;

export type StudentStatus = typeof STUDENT_STATUS[keyof typeof STUDENT_STATUS];

// Activity Options
export const ACTIVITY_OPTIONS = [
  'Library',
  'Nurse/Medical',
  'Counselor', 
  'ATL',
  'Other'
] as const;

// Status Colors and Icons Configuration
export const STATUS_CONFIG = {
  [STUDENT_STATUS.PRESENT]: {
    icon: CheckCircle,
    color: '#30D158',
    label: 'Present',
  },
  [STUDENT_STATUS.ABSENT]: {
    icon: Cancel,
    color: '#FF453A',
    label: 'Absent',
  },
  [STUDENT_STATUS.WASHROOM]: {
    icon: Wc,
    color: '#64D2FF',
    label: 'Washroom',
  },
  [STUDENT_STATUS.ACTIVITY]: {
    icon: Assignment,
    color: '#007AFF',
    label: 'Activity',
  },
  [STUDENT_STATUS.BUNKING]: {
    icon: DirectionsRun,
    color: '#FF453A',
    label: 'Bunking',
  },
} as const;

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 600,
  TABLET: 900,
  DESKTOP: 1200,
} as const;

// Default Values
export const DEFAULTS = {
  SECTION: 'All',
  STATUS: STUDENT_STATUS.ABSENT,
} as const;

// UI Color Palette (Blue-themed)
export const COLORS = {
  PRIMARY_BLUE: '#007AFF',
  LIGHT_BLUE: '#5AC8FA',
  DARK_BLUE: '#0051D5',
  INFO_BLUE: '#64D2FF',
  SUCCESS_GREEN: '#30D158',
  ERROR_RED: '#FF453A',
  WARNING_ORANGE: '#FF9F0A', // Keep orange for actual warnings
  BACKGROUND_DARK: '#000000',
  SURFACE_DARK: '#1C1C1E',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#8E8E93',
} as const;
