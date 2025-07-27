# 🔧 Services Guide - Talking to External Systems

## 🎯 What Are Services?

Services are like messengers or translators that help your app communicate with external systems like databases, APIs, and cloud services. They handle all the complex networking and data operations.

### 🟢 Simple Analogy
Think of services like different departments in a company:
- **googleSheets.ts** = **Database Department** (stores and retrieves all data)
- **auth.ts** = **Security Department** (handles login and permissions)

Services take care of the complicated technical stuff so your components can focus on showing information to users.

## 🗄️ GoogleSheets Service - The Database Manager

### 📍 **Location**: `src/services/googleSheets.ts`

### 🟢 What Does It Do?
The GoogleSheets service is like the school's main office - it keeps track of all student information, attendance records, and handles data export for reports.

### 🔧 Main Responsibilities:

1. **Store student data** in Firebase database
2. **Load student information** when app starts
3. **Track attendance changes** over time
4. **Export data** to CSV files for reports
5. **Handle daily resets** for attendance

### 🟢 Key Functions Explained:

#### **Loading Students**
```typescript
// 🟢 Gets all student data from database
async getStudents(): Promise<Student[]> {
  // Like asking the office: "Give me the list of all students"
  const students = await this.loadFromDatabase();
  return students.sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical order
}
```

**What happens:**
1. App asks service: "I need all students"
2. Service contacts Firebase database
3. Database returns student data
4. Service sorts students alphabetically  
5. Service returns organized list to app

#### **Updating Student Status**
```typescript
// 🟢 Changes a student's attendance status
async updateStudent(studentId: number, updates: Partial<Student>): Promise<void> {
  const student = await this.findStudent(studentId);
  const updatedStudent = { ...student, ...updates };
  
  // Save to database
  await this.saveToDatabase(updatedStudent);
  
  // Log the change for reports
  await this.logAttendanceChange(student, updates.status);
}
```

**Real-world example:**
```
Teacher clicks "Absent" for John
    ↓
App calls: updateStudent(123, { status: 'absent' })
    ↓
Service finds John's record (ID: 123)
    ↓
Service updates John's status to 'absent'
    ↓
Service saves change to Firebase
    ↓
Service logs: "John marked absent at 9:15 AM"
    ↓
App shows John's card as red with "A"
```

#### **Attendance Logging**
```typescript
// 🟢 Keeps detailed records of all status changes
async logAttendanceChange(student: Student, newStatus: string): Promise<void> {
  const log: AttendanceLog = {
    student_id: student.id,
    student_name: student.name,
    date: getCurrentDate(),        // Today's date
    timestamp: Date.now(),         // Exact time
    status: newStatus,             // New attendance status
    // ... other details
  };
  
  await this.saveAttendanceLog(log);
}
```

**Why this matters:**
- **Detailed records** - Know exactly when each change happened
- **Report generation** - Can create attendance reports for any date range
- **Accountability** - Track who made changes and when

#### **CSV Export for Reports**
```typescript
// 🟢 Creates Excel files for school records
async exportSimpleAttendanceCSV(targetDate: string, section?: string): Promise<string> {
  // Get all students for the section
  const students = await this.getStudents();
  const filteredStudents = this.filterBySection(students, section);
  
  // Get attendance data for the target date
  const attendanceData = await this.getAttendanceForDate(targetDate);
  
  // Create CSV format
  const csvContent = this.createCSVFromData(filteredStudents, attendanceData);
  
  return csvContent; // Ready to download
}
```

**What gets exported:**
```csv
Roll Number,Student Name,27/07/2025
1,"Alice Johnson","P"
2,"Bob Smith","A"  
3,"Charlie Davis","P"
```

### 🔥 Firebase Integration

### 🟢 What Is Firebase?
Firebase is Google's cloud platform that provides:
- **Realtime Database** - Stores data in the cloud
- **Authentication** - Handles user login
- **Hosting** - Serves the app to users

### 🔧 How Stutra Uses Firebase:

```typescript
// 🟢 Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",              // Identifies your project
  authDomain: "your-app.firebaseapp.com",  // Where users log in
  databaseURL: "https://your-db.firebaseio.com/",  // Where data is stored
  projectId: "your-project-id",        // Project identifier
  // ... other config
};
```

**Database Structure:**
```
Firebase Database
├── students/
│   ├── 1/ { name: "Alice", status: "present", ... }
│   ├── 2/ { name: "Bob", status: "absent", ... }
│   └── 3/ { name: "Charlie", status: "washroom", ... }
├── attendance_logs/
│   ├── 2025-07-27/
│   │   ├── log1/ { student_id: 1, status: "present", timestamp: ... }
│   │   └── log2/ { student_id: 2, status: "absent", timestamp: ... }
│   └── 2025-07-26/ { ... }
└── users/
    └── teacher1/ { email: "teacher@school.com", ... }
```

### 🔄 Real-Time Updates

### 🟢 What Are Real-Time Updates?
When one teacher marks a student absent, all other devices see the change immediately - like magic!

```typescript
// 🟢 Setting up real-time listeners
watchStudentChanges(callback: (students: Student[]) => void): void {
  const studentsRef = ref(this.database, 'students');
  
  // Listen for any changes to student data
  onValue(studentsRef, (snapshot) => {
    const updatedStudents = this.parseStudentData(snapshot.val());
    callback(updatedStudents); // Notify the app about changes
  });
}
```

**How it works:**
1. **Teacher A** marks John as absent on their phone
2. **Firebase** receives the update
3. **Firebase** notifies all connected devices
4. **Teacher B** sees John's status change to absent on their tablet
5. **Principal** sees the update on their computer

All happening in **real-time** (within 1-2 seconds)!

## 🔐 Auth Service - The Security Guard

### 📍 **Location**: `src/services/auth.ts`

### 🟢 What Does It Do?
The Auth service is like a security guard that checks IDs at the door. It makes sure only authorized teachers and staff can access the student data.

### 🔧 Main Functions:

#### **User Login**
```typescript
// 🟢 Logs in a user
async signIn(email: string, password: string): Promise<User> {
  try {
    // Ask Firebase: "Is this email/password combination valid?"
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    
    // If valid, return user information
    return userCredential.user;
  } catch (error) {
    // If invalid, throw error
    throw new Error('Invalid email or password');
  }
}
```

**Login process:**
1. User types email and password
2. Auth service sends credentials to Firebase
3. Firebase checks if they match a registered user
4. If valid: User is logged in and can access the app
5. If invalid: Error message is shown

#### **User Registration**
```typescript
// 🟢 Creates a new user account
async signUp(email: string, password: string, displayName: string): Promise<User> {
  // Create new account in Firebase
  const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
  
  // Add additional profile information
  await updateProfile(userCredential.user, { displayName });
  
  return userCredential.user;
}
```

#### **Session Management**
```typescript
// 🟢 Checks if user is currently logged in
getCurrentUser(): User | null {
  return this.auth.currentUser; // Returns user if logged in, null if not
}

// 🟢 Logs out the current user
async signOut(): Promise<void> {
  await firebaseSignOut(this.auth);
  // User is now logged out and redirected to login page
}
```

### 🛡️ Security Features

**Protected Routes:**
```typescript
// 🟢 Only logged-in users can access certain pages
function ProtectedRoute({ children }) {
  const user = authService.getCurrentUser();
  
  if (user) {
    return children;      // Show the protected content
  } else {
    return <LoginPage />; // Redirect to login
  }
}
```

**Auto-logout on Session Expiry:**
```typescript
// 🟢 Automatically log out users after period of inactivity
authService.onAuthStateChanged((user) => {
  if (!user) {
    // User session expired or was logged out
    redirectToLogin();
  }
});
```

## 🔄 Service Communication Pattern

### 🟢 How Services Work with Components

Services don't directly show anything to users - they work behind the scenes and communicate with components through hooks:

```
Component (StudentCard)
    ↓ (calls function)
Hook (useStudents)  
    ↓ (uses service)
Service (googleSheets)
    ↓ (talks to)
Firebase Database
```

### 🟢 Example Flow: Adding a Note

```
1. Teacher clicks "Add Note" button
   ↓ (StudentCard component)
2. NotesDialog opens with form
   ↓ (User types note)
3. Form calls addNote function
   ↓ (useStudents hook)
4. Hook calls service method
   ↓ (googleSheets.updateStudent)
5. Service updates Firebase
   ↓ (Firebase database)
6. Database change triggers update
   ↓ (Real-time listener)
7. All connected devices see new note
```

## 🔧 Service Methods Reference

### 🟢 GoogleSheets Service Methods

**Student Management:**
- `getStudents()` - Load all students
- `updateStudent(id, changes)` - Update student information
- `addStudent(student)` - Add new student
- `deleteStudent(id)` - Remove student

**Attendance Tracking:**
- `logAttendanceChange()` - Record status change
- `getAttendanceLogs(date)` - Get attendance for specific date
- `resetDailyAttendance()` - Reset all students to present (new day)

**Data Export:**
- `exportSimpleAttendanceCSV()` - Export single date attendance
- `exportMultiDateAttendanceCSV()` - Export date range attendance
- `generateReport()` - Create detailed attendance report

### 🟢 Auth Service Methods

**Authentication:**
- `signIn(email, password)` - Log in user
- `signUp(email, password, name)` - Create new account
- `signOut()` - Log out current user
- `getCurrentUser()` - Get logged-in user info

**Session Management:**
- `onAuthStateChanged(callback)` - Listen for login/logout
- `isAuthenticated()` - Check if user is logged in
- `refreshToken()` - Refresh authentication token

## 🐛 Error Handling in Services

### 🟢 How Services Handle Problems

Services include error handling to deal with network issues, database problems, etc.:

```typescript
// 🟢 Example error handling
async updateStudent(studentId: number, updates: any): Promise<void> {
  try {
    // Attempt to update student
    await this.database.update(studentId, updates);
  } catch (error) {
    // Handle different types of errors
    if (error.code === 'PERMISSION_DENIED') {
      throw new Error('You do not have permission to update this student');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your internet connection');
    } else {
      throw new Error('An unexpected error occurred. Please try again');
    }
  }
}
```

**Common Errors and Solutions:**
- **Network Error** - No internet connection → Show retry button
- **Permission Denied** - User not authorized → Show login prompt
- **Data Not Found** - Student doesn't exist → Show error message
- **Validation Error** - Invalid data format → Show field-specific error

## 🧪 Testing Services

### 🟢 How We Test Services

Services are tested to make sure they work correctly:

```typescript
// 🟢 Example service test
describe('GoogleSheets Service', () => {
  test('should update student status', async () => {
    const student = { id: 1, name: 'John', status: 'present' };
    
    // Test the service method
    await googleSheetsService.updateStudent(1, { status: 'absent' });
    
    // Verify the change was made
    const updatedStudent = await googleSheetsService.getStudent(1);
    expect(updatedStudent.status).toBe('absent');
  });
});
```

**What Tests Check:**
- **Data operations** - Do create/read/update/delete work?
- **Error handling** - Are errors handled gracefully?
- **Authentication** - Do security features work correctly?
- **Real-time updates** - Do changes propagate to all clients?

---

**Next Step**: Learn about [Hooks](./HOOKS.md) to understand how React components manage data and state!
