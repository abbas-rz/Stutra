# Components Guide

This document provides detailed information about all React components in the Stutra application.

## Table of Contents
- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
- [Dialog Components](#dialog-components)
- [Authentication Components](#authentication-components)
- [Utility Components](#utility-components)
- [Styling Guidelines](#styling-guidelines)

## Component Architecture

The Stutra application follows a hierarchical component structure with clear separation of concerns:

```
App (Main Container)
├── StudentCard (Reusable)
├── ActivityDialog (Modal) 
├── NotesDialog (Modal)
├── SimpleAttendanceDialog (Modal)
└── ProtectedRoute (HOC)
    └── Auth Components
```

## Core Components

### App Component

**Location:** `src/components/App/App.tsx`

The main application component that orchestrates the entire student tracking interface.

#### Props
This component doesn't accept props as it's the root component.

#### State Management
Uses custom hooks for state management:
- `useStudents()` - Manages student data and operations
- `useStudentFilters()` - Handles search and filtering logic

#### Key Features
- Responsive grid layout for student cards
- Real-time data updates
- Section-based filtering
- Export functionality
- Mobile-first design

#### Usage Example
```tsx
import { App } from './components/App';

// Used in main.tsx as the primary route
<Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
```

#### Dependencies
- Material-UI components for UI
- Custom hooks for business logic
- Firebase service for data persistence

---

### StudentCard Component

**Location:** `src/components/StudentCard/StudentCard.tsx`

Displays individual student information with interactive status controls.

#### Props Interface
```typescript
interface StudentCardProps {
  student: Student;
  onStatusChange: (
    studentId: number, 
    status: Student['status'], 
    activity?: string, 
    timerEnd?: number | null
  ) => void;
  onActivitySelect: (studentId: number) => void;
  onNotesOpen: (studentId: number) => void;
  onResetStudent: (studentId: number) => void;
  isMobile: boolean;
}
```

#### Key Features
- **Status Indicators**: Color-coded chips showing current status
- **Timer Display**: Real-time countdown for washroom permissions
- **Action Buttons**: Quick access to status changes
- **Notes Access**: View and manage student notes
- **Mobile Optimization**: Responsive layout for mobile devices

#### Status Configuration
```typescript
const STATUS_CONFIG = {
  present: { icon: CheckCircle, color: '#30D158', label: 'Present' },
  absent: { icon: Cancel, color: '#FF453A', label: 'Absent' },
  washroom: { icon: Wc, color: '#64D2FF', label: 'Washroom' },
  activity: { icon: Assignment, color: '#007AFF', label: 'Activity' },
  bunking: { icon: DirectionsRun, color: '#FF453A', label: 'Bunking' }
};
```

#### Usage Example
```tsx
<StudentCard
  student={student}
  onStatusChange={handleStatusChange}
  onActivitySelect={handleActivitySelect}
  onNotesOpen={handleNotesOpen}
  onResetStudent={resetStudent}
  isMobile={isMobile}
/>
```

## Dialog Components

### ActivityDialog Component

**Location:** `src/components/ActivityDialog/ActivityDialog.tsx`

Modal dialog for selecting student activities when marking them as engaged in specific tasks.

#### Props Interface
```typescript
interface ActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (activity: string) => void;
}
```

#### Features
- Pre-defined activity options (Library, Nurse/Medical, Counselor, ATL, Other)
- Clean list interface with click-to-select
- Auto-close on selection

#### Usage Example
```tsx
<ActivityDialog
  open={activityDialogOpen}
  onClose={() => setActivityDialogOpen(false)}
  onSelect={handleActivityConfirm}
/>
```

---

### NotesDialog Component

**Location:** `src/components/NotesDialog.tsx`

Modal dialog for managing student notes and observations.

#### Props Interface
```typescript
interface NotesDialogProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  notes: string[];
  onAddNote: (note: string) => void;
  onDeleteNote: (noteIndex: number) => void;
}
```

#### Features
- **Add Notes**: Text input with add button
- **View Notes**: Chronological list of all notes
- **Delete Notes**: Remove specific notes with confirmation
- **Student Context**: Shows student name in dialog title

#### Usage Example
```tsx
<NotesDialog
  open={notesDialogOpen}
  onClose={() => setNotesDialogOpen(false)}
  studentName={selectedStudent?.name || ''}
  notes={selectedStudent?.notes || []}
  onAddNote={handleAddNote}
  onDeleteNote={handleDeleteNote}
/>
```

---

### SimpleAttendanceDialog Component

**Location:** `src/components/SimpleAttendanceDialog.tsx`

Modal dialog for exporting attendance data to CSV format.

#### Props Interface
```typescript
interface SimpleAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sections: string[];
  selectedSection: string;
  students: Student[];
}
```

#### Features
- **Section Selection**: Choose specific section or all sections
- **CSV Export**: Generate downloadable CSV file
- **Data Preview**: Show export summary before download

#### Usage Example
```tsx
<SimpleAttendanceDialog
  open={attendanceDialogOpen}
  onClose={() => setAttendanceDialogOpen(false)}
  sections={sections}
  selectedSection={selectedSection}
  students={students}
/>
```

## Authentication Components

### LoginPage Component

**Location:** `src/components/auth/LoginPage.tsx`

Full-page login form for teacher authentication.

#### Features
- **Email/Password Form**: Standard login fields
- **Error Handling**: Display authentication errors
- **Navigation**: Link to registration page
- **Responsive Design**: Works on all screen sizes

#### State Management
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
```

#### Usage Example
```tsx
<Route path="/login" element={<LoginPage />} />
```

---

### RegisterPage Component

**Location:** `src/components/auth/RegisterPage.tsx`

Full-page registration form for creating new teacher accounts.

#### Features
- **Teacher Information**: Name, email, password fields
- **Section Assignment**: Multi-select for teacher sections
- **Admin Privileges**: Checkbox for admin access
- **Validation**: Form validation and error display

#### Usage Example
```tsx
<Route path="/register" element={<RegisterPage />} />
```

## Utility Components

### ProtectedRoute Component

**Location:** `src/components/ProtectedRoute/ProtectedRoute.tsx`

Higher-Order Component (HOC) that protects routes requiring authentication.

#### Props Interface
```typescript
interface ProtectedRouteProps {
  children: React.ReactElement;
}
```

#### Logic
```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" replace />;
}
```

#### Usage Example
```tsx
<Route 
  path="/" 
  element={
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  } 
/>
```

## Styling Guidelines

### Theme Configuration

The application uses a custom Material-UI theme with Apple-inspired design:

```typescript
const appleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#007AFF' },
    secondary: { main: '#5AC8FA' },
    success: { main: '#30D158' },
    error: { main: '#FF453A' },
    warning: { main: '#FF9F0A' }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
});
```

### Component Styling Patterns

#### 1. Consistent Spacing
```typescript
// Use theme spacing units
sx={{ p: 3, m: 2, gap: 1 }}
```

#### 2. Responsive Design
```typescript
// Mobile-first approach
sx={{
  fontSize: isMobile ? '0.8rem' : '1rem',
  padding: isMobile ? 1 : 2
}}
```

#### 3. Color Usage
```typescript
// Use theme colors or STATUS_CONFIG
sx={{ 
  color: STATUS_CONFIG[status].color,
  bgcolor: 'background.paper'
}}
```

### Animation Guidelines

#### Hover Effects
```typescript
sx={{
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: 3
  }
}}
```

#### Loading States
```typescript
<Fade in={true} timeout={800}>
  <Box>{content}</Box>
</Fade>
```

## Component Testing

### Testing Patterns

#### 1. Component Rendering
```typescript
import { render, screen } from '@testing-library/react';
import { StudentCard } from '../StudentCard';

test('renders student name', () => {
  render(<StudentCard student={mockStudent} {...mockProps} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

#### 2. User Interactions
```typescript
import userEvent from '@testing-library/user-event';

test('calls onStatusChange when status button clicked', async () => {
  const mockOnStatusChange = vi.fn();
  render(<StudentCard onStatusChange={mockOnStatusChange} {...props} />);
  
  await userEvent.click(screen.getByRole('button', { name: /present/i }));
  expect(mockOnStatusChange).toHaveBeenCalled();
});
```

#### 3. Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useStudents } from '../hooks/useStudents';

test('useStudents hook loads students', async () => {
  const { result } = renderHook(() => useStudents());
  
  await act(async () => {
    await result.current.refreshStudents();
  });
  
  expect(result.current.students).toHaveLength(12);
});
```

## Performance Considerations

### Optimization Techniques

#### 1. Memoization
```typescript
const MemoizedStudentCard = React.memo(StudentCard);
```

#### 2. Callback Optimization
```typescript
const handleStatusChange = useCallback((id, status) => {
  updateStudentStatus(id, status);
}, [updateStudentStatus]);
```

#### 3. Virtual Scrolling
For large student lists, consider implementing virtual scrolling:
```typescript
import { FixedSizeList as List } from 'react-window';
```

## Accessibility Guidelines

### ARIA Labels
```typescript
<IconButton 
  aria-label={`Mark ${student.name} as present`}
  onClick={() => onStatusChange(student.id, 'present')}
>
  <CheckCircle />
</IconButton>
```

### Keyboard Navigation
```typescript
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action
</Button>
```

### Screen Reader Support
```typescript
<Box role="status" aria-live="polite">
  {loading ? 'Loading students...' : `${students.length} students loaded`}
</Box>
```

## Best Practices

1. **Component Composition**: Break down complex components into smaller, reusable pieces
2. **Props Validation**: Use TypeScript interfaces for all props
3. **Error Boundaries**: Implement error boundaries for graceful error handling
4. **Loading States**: Always provide loading feedback for async operations
5. **Mobile-First**: Design for mobile, then enhance for desktop
6. **Consistent Naming**: Use clear, descriptive component and prop names
7. **Documentation**: Include JSDoc comments for complex components
