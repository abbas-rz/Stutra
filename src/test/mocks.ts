import { vi } from 'vitest';
import type { Student } from '../types';
import type { Teacher } from '../types/auth';

// Mock Student Data
export const mockStudent: Student = {
  id: 1,
  name: 'John Doe',
  admission_number: 'ST001',
  photo_url: 'https://example.com/photo.jpg',
  section: 'XI-A',
  status: 'present',
  activity: '',
  timer_end: null,
  notes: ['Good student', 'Participates well'],
  lastResetDate: '2024-01-15'
};

export const mockStudentAbsent: Student = {
  ...mockStudent,
  id: 2,
  name: 'Jane Smith',
  admission_number: 'ST002',
  status: 'absent'
};

export const mockStudentWashroom: Student = {
  ...mockStudent,
  id: 3,
  name: 'Bob Johnson',
  admission_number: 'ST003',
  status: 'washroom',
  timer_end: Date.now() + 60000 // 1 minute from now
};

export const mockStudentActivity: Student = {
  ...mockStudent,
  id: 4,
  name: 'Alice Brown',
  admission_number: 'ST004',
  status: 'activity',
  activity: 'Library'
};

export const mockStudents: Student[] = [
  mockStudent,
  mockStudentAbsent,
  mockStudentWashroom,
  mockStudentActivity,
  {
    ...mockStudent,
    id: 5,
    name: 'Charlie Wilson',
    admission_number: 'ST005',
    section: 'XI-B',
    status: 'bunking'
  }
];

// Mock Teacher Data
export const mockTeacher: Teacher = {
  id: 'teacher1',
  email: 'teacher@school.com',
  name: 'John Teacher',
  password: '',
  sections: ['XI-A', 'XI-B'],
  isAdmin: false,
  createdAt: Date.now()
};

export const mockAdminTeacher: Teacher = {
  ...mockTeacher,
  id: 'admin1',
  email: 'admin@school.com',
  name: 'Admin User',
  isAdmin: true,
  sections: []
};

// Mock Service Functions
export const mockGoogleSheetsService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  updateStudentStatus: vi.fn().mockResolvedValue(undefined),
  resetStudent: vi.fn().mockResolvedValue(undefined),
  addNote: vi.fn().mockResolvedValue(undefined),
  deleteNote: vi.fn().mockResolvedValue(undefined),
  exportToCsv: vi.fn().mockReturnValue('Name,Admission,Section,Status\nJohn Doe,ST001,XI-A,present')
};

export const mockAuthService = {
  login: vi.fn().mockResolvedValue(mockTeacher),
  logout: vi.fn().mockResolvedValue(undefined),
  getCurrentTeacher: vi.fn().mockReturnValue(mockTeacher),
  isAuthenticated: vi.fn().mockReturnValue(true),
  createTeacher: vi.fn().mockResolvedValue(mockTeacher),
  getTeacherByEmail: vi.fn().mockResolvedValue(mockTeacher),
  getAllTeachers: vi.fn().mockResolvedValue([mockTeacher]),
  updateTeacher: vi.fn().mockResolvedValue(undefined),
  deleteTeacher: vi.fn().mockResolvedValue(undefined),
  initializeDefaultAdmin: vi.fn().mockResolvedValue(undefined),
  getLoggedInTeacherId: vi.fn().mockResolvedValue('teacher1'),
  getSectionsForTeacher: vi.fn().mockResolvedValue(['XI-A', 'XI-B'])
};

// Mock Hook Return Values
export const mockUseStudentsReturn = {
  students: mockStudents,
  loading: false,
  error: null,
  refreshStudents: vi.fn().mockResolvedValue(undefined),
  updateStudentStatus: vi.fn().mockResolvedValue(undefined),
  resetStudent: vi.fn().mockResolvedValue(undefined),
  addStudentNote: vi.fn().mockResolvedValue(undefined),
  deleteStudentNote: vi.fn().mockResolvedValue(undefined),
  markAllPresent: vi.fn().mockResolvedValue(undefined)
};

export const mockUseStudentFiltersReturn = {
  searchTerm: '',
  selectedSection: 'All',
  filteredStudents: mockStudents,
  sections: ['All', 'XI-A', 'XI-B', 'XI-C'],
  setSearchTerm: vi.fn(),
  setSelectedSection: vi.fn()
};

// Utility Functions for Tests
export const createMockStudent = (overrides: Partial<Student> = {}): Student => ({
  ...mockStudent,
  ...overrides
});

export const createMockTeacher = (overrides: Partial<Teacher> = {}): Teacher => ({
  ...mockTeacher,
  ...overrides
});

// Test Helpers
export const waitForAsyncUpdates = () => new Promise(resolve => setTimeout(resolve, 0));

export const createMockEvent = <T = HTMLElement>(overrides: Partial<React.ChangeEvent<T>> = {}) => ({
  target: { value: 'test' },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides
} as React.ChangeEvent<T>);

// Mock localStorage for tests
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock Material-UI theme for tests
export const mockTheme = {
  palette: {
    mode: 'dark',
    primary: { main: '#007AFF' },
    secondary: { main: '#5AC8FA' },
    success: { main: '#30D158' },
    error: { main: '#FF453A' },
    warning: { main: '#FF9F0A' }
  },
  spacing: (factor: number) => `${factor * 8}px`,
  breakpoints: {
    up: vi.fn(() => '@media (min-width: 600px)'),
    down: vi.fn(() => '@media (max-width: 599px)')
  }
};
