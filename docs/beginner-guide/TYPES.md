# 📊 Types Guide - Understanding Data Structures

## 🎯 What Are Types?

Types are like **blueprints** or **instruction manuals** that tell TypeScript exactly what kind of data to expect. They help prevent bugs by catching mistakes before the code even runs.

### 🟢 Simple Analogy
Think of types like forms you fill out:
- **Student Type** = **Student Registration Form** (requires name, ID, section, etc.)
- **AttendanceLog Type** = **Attendance Record Form** (requires date, student, status, etc.)
- **User Type** = **Employee Badge Application** (requires email, name, role, etc.)

If you try to put a number where a name should go, TypeScript says "Hey, that doesn't match the blueprint!"

## 📍 Location and Structure

```
src/types/
├── 📄 index.ts    → Main data structures (Student, AttendanceLog, etc.)
└── 📄 auth.ts     → User and authentication data structures
```

## 👥 Student Type - The Core Data Structure

### 📍 **Location**: `src/types/index.ts`

### 🟢 What Is the Student Type?

The Student interface is like a digital student ID card that defines exactly what information we store about each student.

```typescript
// 🟢 Complete Student interface
export interface Student {
  id: number;                    // Unique student identifier
  name: string;                  // Full name
  admission_number: string;      // School ID number
  photo_url: string;             // Link to student photo
  section: string;               // Class section (A, B, C, etc.)
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity: string;              // Current activity (if status is 'activity')
  timer_end: number | null;      // Washroom timer end time (timestamp)
  notes: string[];               // Array of teacher notes
  lastResetDate?: string;        // Last daily reset date (optional)
}
```

### 🟢 Field-by-Field Explanation:

#### **id: number**
```typescript
// 🟢 Examples
const student1: Student = { id: 1, ... };
const student2: Student = { id: 2, ... };
```
- **Purpose**: Uniquely identifies each student
- **Why number**: Easy to use as database key, fast lookups
- **Usage**: `students.find(s => s.id === 123)`

#### **name: string**
```typescript
// 🟢 Examples
name: "John Doe"
name: "Mary Jane Smith"
name: "李小明"  // Unicode names supported
```
- **Purpose**: Display name in UI
- **Why string**: Names can contain letters, spaces, unicode
- **Usage**: `<h3>{student.name}</h3>`

#### **admission_number: string**
```typescript
// 🟢 Examples
admission_number: "2024001"
admission_number: "ST-2025-A-042"
admission_number: "CLASS5-ROLL15"
```
- **Purpose**: Official school ID for records
- **Why string**: Can contain letters, numbers, dashes
- **Usage**: Search by admission number, export to reports

#### **section: string**
```typescript
// 🟢 Examples
section: "A"
section: "10-B"  
section: "Kindergarten"
```
- **Purpose**: Group students by class/grade
- **Why string**: Flexible for different school systems
- **Usage**: Filter students by section, generate section reports

#### **status: Union Type**
```typescript
// 🟢 Only these 5 values are allowed
status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking'

// ✅ Valid
student.status = 'present';
student.status = 'washroom';

// ❌ Invalid - TypeScript will show error
student.status = 'sleeping';  // Not one of the allowed values
student.status = 123;         // Wrong type (number instead of string)
```
- **Purpose**: Track current attendance status
- **Why union type**: Prevents typos, ensures consistency
- **Usage**: Color-code student cards, generate reports

#### **activity: string**
```typescript
// 🟢 Examples
activity: ""                    // No specific activity
activity: "Library"
activity: "Nurse/Medical"
activity: "ATL Lab"
activity: "Meeting with Principal"
```
- **Purpose**: Specify what student is doing when status is 'activity'
- **Why string**: Flexible for various activities
- **Usage**: Show detailed status ("At Library" instead of just "Activity")

#### **timer_end: number | null**
```typescript
// 🟢 Examples
timer_end: null                 // No timer active
timer_end: 1722096720000       // Timestamp: 12 minutes from now
```
- **Purpose**: Track washroom timer (12-minute limit)
- **Why number**: Timestamp in milliseconds for precise timing
- **Why nullable**: Most of the time, no timer is running
- **Usage**: `const timeLeft = timer_end - Date.now()`

#### **notes: string[]**
```typescript
// 🟢 Examples
notes: []                              // No notes yet
notes: ["Needs extra help with math"]  // One note
notes: [
  "Excellent participation today",
  "Improved behavior this week",
  "Absent yesterday due to illness"
]
```
- **Purpose**: Private teacher notes about student
- **Why array**: Can have multiple notes over time
- **Usage**: Show latest note, view all notes in dialog

#### **lastResetDate?: string (Optional)**
```typescript
// 🟢 Examples
lastResetDate: "2025-07-27"     // Reset today
lastResetDate: undefined        // Never reset (optional field)
```
- **Purpose**: Track when student was last reset to "present"
- **Why optional**: Added later, older records might not have this
- **Usage**: Prevent multiple resets on same day

## 📋 AttendanceLog Type - The Record Keeper

### 🟢 What Is the AttendanceLog Type?

AttendanceLog is like a detailed diary entry that records every time a student's status changes.

```typescript
// 🟢 Complete AttendanceLog interface
export interface AttendanceLog {
  id: string;                    // Unique log identifier
  student_id: number;            // Which student (links to Student.id)
  student_name: string;          // Student name (for easy reference)
  admission_number: string;      // Student's admission number
  section: string;               // Student's section
  date: string;                  // Date in YYYY-MM-DD format
  timestamp: number;             // Exact time of change (milliseconds)
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity?: string;             // Activity details (optional)
  duration_minutes?: number;     // How long in previous status (optional)
  logged_by?: string;            // Who made the change (optional)
  notes?: string;                // Additional notes (optional)
}
```

### 🟢 Why Do We Need Attendance Logs?

**Student Type** = Current snapshot ("John is currently absent")
**AttendanceLog Type** = Historical record ("John was marked absent at 9:15 AM by Teacher Smith")

### 🟢 Field Examples:

```typescript
// 🟢 Example attendance log entry
const log: AttendanceLog = {
  id: "log_20250727_091530_001",
  student_id: 123,
  student_name: "John Doe",
  admission_number: "2024001", 
  section: "A",
  date: "2025-07-27",
  timestamp: 1722096930000,      // July 27, 2025 09:15:30 AM
  status: "absent",
  logged_by: "teacher@school.com",
  notes: "Parent called to report illness"
};
```

### 🟢 How Logs Are Used:

**Daily Reports:**
```typescript
// Get all students marked absent today
const todayAbsent = logs.filter(log => 
  log.date === '2025-07-27' && log.status === 'absent'
);
```

**Student History:**
```typescript
// Get John's attendance history for the week
const johnLogs = logs.filter(log => 
  log.student_id === 123 && 
  log.date >= '2025-07-21' && 
  log.date <= '2025-07-27'
);
```

**CSV Export:**
```csv
Date,Student Name,Status,Time,Notes
27/07/2025,John Doe,Absent,09:15:30,Parent called to report illness
27/07/2025,Mary Smith,Present,09:00:00,
```

## 🔐 Authentication Types

### 📍 **Location**: `src/types/auth.ts`

### 🟢 User Type

```typescript
// 🟢 User interface for authentication
export interface User {
  uid: string;                   // Firebase user ID
  email: string;                 // Login email
  displayName: string | null;    // User's full name
  photoURL: string | null;       // Profile picture URL
  role?: 'teacher' | 'admin';    // User permissions (optional)
  school?: string;               // Which school (optional)
  createdAt?: string;            // Account creation date (optional)
  lastLoginAt?: string;          // Last login timestamp (optional)
}
```

### 🟢 Auth State Type

```typescript
// 🟢 Authentication state management
export interface AuthState {
  user: User | null;             // Current logged-in user
  loading: boolean;              // Is authentication still loading?
  error: string | null;          // Any authentication error
}
```

## 🔧 Component Prop Types

### 🟢 StudentCard Props

```typescript
// 🟢 Props that StudentCard component expects
export interface StudentCardProps {
  student: Student;              // The student data to display
  onStatusChange: (              // Function to call when status changes
    studentId: number,
    status: Student['status'],   // One of the valid status values
    activity: string,
    timerEnd: number | null
  ) => void;
  onActivitySelect: (studentId: number) => void;
  onNotesOpen: (studentId: number) => void;
  onResetStudent: (studentId: number) => void;
  isMobile?: boolean;            // Optional: is this on mobile device?
}
```

### 🟢 Dialog Props

```typescript
// 🟢 Props for attendance dialog
export interface AttendanceDialogProps {
  open: boolean;                 // Is dialog currently open?
  student: Student | null;       // Which student (null if none selected)
  onClose: () => void;           // Function to close dialog
  onStatusChange: (              // Function to update student status
    studentId: number,
    status: Student['status'],
    activity?: string
  ) => void;
}
```

## 🎯 Union Types - Limited Choices

### 🟢 What Are Union Types?

Union types use the `|` symbol to say "this field can be one of these specific values, but nothing else."

```typescript
// 🟢 Status can only be one of these 5 values
type StudentStatus = 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';

// ✅ Valid assignments
const status1: StudentStatus = 'present';
const status2: StudentStatus = 'washroom';

// ❌ Invalid assignments (TypeScript error)
const status3: StudentStatus = 'sleeping';  // Not in the union
const status4: StudentStatus = 123;         // Wrong type
```

### 🟢 Benefits of Union Types:

1. **Prevent typos**: Can't accidentally type 'presen' instead of 'present'
2. **Autocomplete**: IDE shows you the valid options
3. **Refactoring safety**: If you change the options, TypeScript finds all places that need updating
4. **Documentation**: Clearly shows what values are expected

## 🔄 Optional vs Required Fields

### 🟢 Required Fields (must always have a value)

```typescript
interface Student {
  id: number;        // ✅ Required - every student must have an ID
  name: string;      // ✅ Required - every student must have a name
  status: string;    // ✅ Required - every student must have a status
}
```

### 🟢 Optional Fields (can be undefined)

```typescript
interface Student {
  notes?: string[];           // ❓ Optional - new students might not have notes yet
  lastResetDate?: string;     // ❓ Optional - added later, old records don't have this
  activity?: string;          // ❓ Optional - only needed when status is 'activity'
}

// 🟢 Valid student objects
const student1: Student = {
  id: 1,
  name: "John",
  status: "present"
  // notes is undefined - that's okay!
};

const student2: Student = {
  id: 2, 
  name: "Mary",
  status: "present",
  notes: ["Excellent student"]  // notes provided - also okay!
};
```

## 🧠 Generic Types - Reusable Patterns

### 🟢 What Are Generic Types?

Generics are like templates that work with different types of data:

```typescript
// 🟢 Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data: T;                     // T can be any type
  error?: string;
}

// 🟢 Usage with different data types
type StudentResponse = ApiResponse<Student[]>;      // data is Student[]
type LogResponse = ApiResponse<AttendanceLog[]>;    // data is AttendanceLog[]
type UserResponse = ApiResponse<User>;              // data is User

// 🟢 Examples
const studentData: StudentResponse = {
  success: true,
  data: [student1, student2, student3]  // Array of students
};

const userData: UserResponse = {
  success: true,  
  data: { uid: "123", email: "teacher@school.com" }  // Single user
};
```

## 🔍 Type Guards - Runtime Type Checking

### 🟢 What Are Type Guards?

Type guards are functions that check if data matches a specific type at runtime:

```typescript
// 🟢 Type guard for Student
export function isStudent(obj: any): obj is Student {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.status === 'string' &&
    ['present', 'absent', 'washroom', 'activity', 'bunking'].includes(obj.status)
  );
}

// 🟢 Usage
function processStudentData(data: unknown) {
  if (isStudent(data)) {
    // TypeScript now knows 'data' is a Student
    console.log(data.name);        // ✅ Safe to access name
    console.log(data.status);      // ✅ Safe to access status
  } else {
    console.log('Invalid student data');
  }
}
```

## 🧪 Testing with Types

### 🟢 Mock Data for Testing

Types help create consistent test data:

```typescript
// 🟢 Mock student factory
export function createMockStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 1,
    name: "Test Student",
    admission_number: "TEST001",
    photo_url: "",
    section: "A", 
    status: "present",
    activity: "",
    timer_end: null,
    notes: [],
    ...overrides  // Override any fields for specific tests
  };
}

// 🟢 Usage in tests
const absentStudent = createMockStudent({ status: 'absent' });
const washroomStudent = createMockStudent({ 
  status: 'washroom', 
  timer_end: Date.now() + 12 * 60 * 1000 
});
```

## 🚀 Advanced Type Patterns

### 🟢 Utility Types

TypeScript provides built-in utility types:

```typescript
// 🟢 Pick - Select specific fields
type StudentSummary = Pick<Student, 'id' | 'name' | 'status'>;
// Result: { id: number; name: string; status: string; }

// 🟢 Partial - Make all fields optional
type StudentUpdate = Partial<Student>;
// Result: { id?: number; name?: string; status?: string; ... }

// 🟢 Omit - Exclude specific fields  
type NewStudent = Omit<Student, 'id'>;
// Result: Student interface without the 'id' field
```

### 🟢 Real-world Usage:

```typescript
// 🟢 Function that accepts partial student updates
async function updateStudent(id: number, updates: Partial<Student>) {
  // Can update any combination of fields
  await database.update(id, updates);
}

// 🟢 Usage
updateStudent(123, { status: 'absent' });                    // Update just status
updateStudent(456, { status: 'activity', activity: 'Library' }); // Update multiple fields
```

## 📚 Type Reference Quick Guide

### 👥 **Core Types**
- `Student` - Individual student data
- `AttendanceLog` - Attendance change record
- `User` - Authentication user data

### 🎭 **Component Props**
- `StudentCardProps` - Props for student card component
- `AttendanceDialogProps` - Props for attendance dialog
- `NotesDialogProps` - Props for notes dialog

### 🔧 **Utility Types**
- `Partial<T>` - Make all fields optional
- `Pick<T, K>` - Select specific fields
- `Omit<T, K>` - Exclude specific fields

### 🎯 **Union Types**
- `Student['status']` - Valid attendance statuses
- `'present' | 'absent' | 'washroom' | 'activity' | 'bunking'`

### 🔍 **Type Guards**
- `isStudent(obj)` - Check if object is valid Student
- `isAttendanceLog(obj)` - Check if object is valid AttendanceLog

---

**Next Step**: Learn about [State Management](./STATE-MANAGEMENT.md) to understand how the app remembers and manages information!
