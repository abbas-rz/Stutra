export interface Student {
  id: number;
  name: string;
  admission_number: string;
  photo_url: string;
  section?: string; // Legacy field for backward compatibility
  sections: string[]; // New multi-section support
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity: string;
  timer_end: number | null;
  notes: string[];
  lastResetDate?: string; // YYYY-MM-DD format to track daily resets
}

export interface AttendanceLog {
  id: string;
  student_id: number;
  student_name: string;
  admission_number: string;
  section: string;
  date: string; // YYYY-MM-DD format
  timestamp: number;
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity?: string;
  duration_minutes?: number; // For washroom/activity tracking
  logged_by?: string; // User who made the change
  notes?: string;
}

export interface DailySummary {
  total: number;
  present: number;
  absent: number;
  washroom: number;
  activity: number;
  bunking: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form types
export interface StudentFormData {
  name: string;
  admission_number: string;
  section: string;
  photo_url?: string;
}

// Export types
export interface ExportOptions {
  startDate: string;
  endDate: string;
  section?: string;
  format: 'single' | 'multiple';
}
