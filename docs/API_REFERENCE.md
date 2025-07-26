# API Reference

## Table of Contents
- [Authentication Service](#authentication-service)
- [Google Sheets Service](#google-sheets-service)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Authentication Service

The `AuthService` class handles all authentication-related operations using Firebase Realtime Database.

### Methods

#### `createTeacher(data: CreateTeacherData): Promise<Teacher>`
Creates a new teacher account in the system.

**Parameters:**
```typescript
interface CreateTeacherData {
  email: string;
  name: string;
  password: string;
  sections: string[];
  isAdmin?: boolean;
}
```

**Returns:** `Promise<Teacher>` - The created teacher object (without password)

**Example:**
```typescript
const newTeacher = await authService.createTeacher({
  email: 'teacher@school.com',
  name: 'John Doe',
  password: 'securePassword',
  sections: ['XI-A', 'XI-B'],
  isAdmin: false
});
```

**Throws:**
- `Error` - If email already exists
- `Error` - If required fields are missing

---

#### `login(credentials: LoginCredentials): Promise<Teacher>`
Authenticates a teacher and returns their profile data.

**Parameters:**
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

**Returns:** `Promise<Teacher>` - Authenticated teacher object

**Example:**
```typescript
const teacher = await authService.login({
  email: 'teacher@school.com',
  password: 'password123'
});
```

**Throws:**
- `Error` - If teacher not found
- `Error` - If password is invalid

---

#### `logout(): Promise<void>`
Logs out the current teacher and clears stored session data.

**Example:**
```typescript
await authService.logout();
```

---

#### `getCurrentTeacher(): Teacher | null`
Returns the currently logged-in teacher or null if not authenticated.

**Returns:** `Teacher | null`

**Example:**
```typescript
const currentTeacher = authService.getCurrentTeacher();
if (currentTeacher) {
  console.log(`Logged in as: ${currentTeacher.name}`);
}
```

---

#### `isAuthenticated(): boolean`
Checks if a teacher is currently authenticated.

**Returns:** `boolean`

**Example:**
```typescript
if (authService.isAuthenticated()) {
  // User is logged in
}
```

---

## Google Sheets Service

The `GoogleSheetsService` class manages student data and attendance records using Firebase Realtime Database.

### Methods

#### `initialize(): Promise<void>`
Initializes the Firebase connection and sets up the service.

**Example:**
```typescript
await googleSheetsService.initialize();
```

---

#### `getStudents(): Promise<Student[]>`
Retrieves all students from the database.

**Returns:** `Promise<Student[]>` - Array of student objects

**Example:**
```typescript
const students = await googleSheetsService.getStudents();
```

---

#### `updateStudentStatus(studentId: number, status: string, activity?: string, timerEnd?: number): Promise<void>`
Updates a student's attendance status.

**Parameters:**
- `studentId: number` - The student's unique ID
- `status: string` - The new status ('present', 'absent', 'washroom', 'activity', 'bunking')
- `activity?: string` - Optional activity description for 'activity' status
- `timerEnd?: number` - Optional timestamp for timed statuses

**Example:**
```typescript
// Mark student as present
await googleSheetsService.updateStudentStatus(123, 'present');

// Mark student as in activity
await googleSheetsService.updateStudentStatus(123, 'activity', 'Library');

// Mark student in washroom with timer
const timerEnd = Date.now() + (12 * 60 * 1000); // 12 minutes
await googleSheetsService.updateStudentStatus(123, 'washroom', '', timerEnd);
```

---

#### `resetStudent(studentId: number): Promise<void>`
Resets a student's status to the default state.

**Parameters:**
- `studentId: number` - The student's unique ID

**Example:**
```typescript
await googleSheetsService.resetStudent(123);
```

---

#### `addNote(studentId: number, note: string): Promise<void>`
Adds a note to a student's record.

**Parameters:**
- `studentId: number` - The student's unique ID
- `note: string` - The note content

**Example:**
```typescript
await googleSheetsService.addNote(123, 'Student was late due to medical appointment');
```

---

#### `deleteNote(studentId: number, noteIndex: number): Promise<void>`
Removes a note from a student's record.

**Parameters:**
- `studentId: number` - The student's unique ID
- `noteIndex: number` - The index of the note to delete

**Example:**
```typescript
await googleSheetsService.deleteNote(123, 0); // Delete first note
```

---

#### `exportToCsv(students: Student[], section?: string): string`
Generates a CSV string from student data.

**Parameters:**
- `students: Student[]` - Array of students to export
- `section?: string` - Optional section filter

**Returns:** `string` - CSV formatted data

**Example:**
```typescript
const csvData = googleSheetsService.exportToCsv(students, 'XI-A');
```

---

## Error Handling

All service methods implement consistent error handling patterns:

### Common Error Types

1. **Authentication Errors**
   ```typescript
   try {
     await authService.login(credentials);
   } catch (error) {
     if (error.message === 'Teacher not found') {
       // Handle invalid email
     } else if (error.message === 'Invalid password') {
       // Handle wrong password
     }
   }
   ```

2. **Network Errors**
   ```typescript
   try {
     await googleSheetsService.getStudents();
   } catch (error) {
     if (error.message.includes('network')) {
       // Handle connection issues
     }
   }
   ```

3. **Validation Errors**
   ```typescript
   try {
     await authService.createTeacher(invalidData);
   } catch (error) {
     if (error.message.includes('required')) {
       // Handle missing fields
     }
   }
   ```

### Error Response Format

All services return errors in a consistent format:
```typescript
interface ApiError extends Error {
  message: string;
  code?: string;
  details?: any;
}
```

## Type Definitions

### Core Types

#### Student
```typescript
interface Student {
  id: number;
  name: string;
  admission_number: string;
  photo_url: string;
  section: string;
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity: string;
  timer_end: number | null;
  notes: string[];
  lastResetDate?: string;
}
```

#### Teacher
```typescript
interface Teacher {
  id: string;
  email: string;
  name: string;
  password: string;
  sections: string[];
  isAdmin: boolean;
  createdAt: number;
  lastLogin?: number;
}
```

#### AttendanceLog
```typescript
interface AttendanceLog {
  id: string;
  student_id: number;
  student_name: string;
  admission_number: string;
  section: string;
  date: string;
  timestamp: number;
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity?: string;
  duration_minutes?: number;
  logged_by?: string;
  notes?: string;
}
```

### Configuration Types

#### Firebase Config
```typescript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
```

### Utility Types

#### ApiResponse
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Usage Examples

### Complete Authentication Flow
```typescript
// Initialize services
await googleSheetsService.initialize();

// Login teacher
try {
  const teacher = await authService.login({
    email: 'teacher@school.com',
    password: 'password123'
  });
  
  console.log(`Welcome, ${teacher.name}!`);
  
  // Load students
  const students = await googleSheetsService.getStudents();
  
  // Update student status
  await googleSheetsService.updateStudentStatus(
    students[0].id, 
    'present'
  );
  
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

### Bulk Operations
```typescript
// Mark all students in a section as present
const markSectionPresent = async (students: Student[], section: string) => {
  const sectionStudents = students.filter(s => s.section === section);
  
  const promises = sectionStudents.map(student => 
    googleSheetsService.updateStudentStatus(student.id, 'present')
  );
  
  await Promise.all(promises);
};
```

## Rate Limiting

Firebase Realtime Database has built-in rate limiting. For optimal performance:

1. **Batch Operations**: Group multiple updates when possible
2. **Caching**: Use local state to minimize API calls
3. **Error Handling**: Implement exponential backoff for failed requests

## Security Considerations

1. **Password Hashing**: All passwords are hashed before storage
2. **Session Management**: Authentication tokens are stored securely
3. **Permission Checks**: All operations verify user permissions
4. **Input Validation**: All inputs are validated before processing
