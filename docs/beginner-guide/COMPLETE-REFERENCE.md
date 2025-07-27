# 📚 Complete Function and File Reference

## 🎯 What This Document Is

This is your **quick reference guide** to every function and file in Stutra. Think of it as an index or glossary that explains what each piece does in simple terms.

## 📂 Files by Category

### 🧩 **Components (User Interface)**

#### `src/components/App/App.tsx`
**What it does**: The main container that holds the entire application
- Sets up the theme (colors and fonts)
- Handles user authentication
- Shows login page or main dashboard based on login status
- Like the foundation of a house - everything else sits on top of it

#### `src/components/StudentCard/StudentCard.tsx`
**What it does**: Shows information for one student
- Displays student name and photo
- Shows current status with colored buttons (Present/Absent/etc.)
- Has buttons to change attendance status
- Shows timer countdown for washroom visits
- Like a digital student ID card

#### `src/components/auth/LoginPage.tsx`
**What it does**: The login form where users enter credentials
- Input fields for email and password
- Login button that checks credentials with Firebase
- Error messages if login fails
- Apple-inspired design with dark theme
- Like a security checkpoint at a building entrance

#### `src/components/auth/RegisterPage.tsx`
**What it does**: Sign-up form for new users
- Input fields for name, email, and password
- Creates new user accounts in Firebase
- Form validation and error handling
- Consistent design with login page

#### `src/components/auth/ProtectedRoute.tsx`
**What it does**: Security guard for protected pages
- Checks if user is logged in before showing content
- Redirects to login page if not authenticated
- Wraps around components that need protection
- Like a bouncer at a VIP section

#### `src/components/AttendanceDialog.tsx`
**What it does**: Popup for marking student attendance
- Shows when you click on a student card
- 5 attendance options: Present, Absent, Washroom, Activity, Bunking
- Color-coded buttons for easy selection
- Closes after selection and updates student card

#### `src/components/ActivityDialog.tsx`  
**What it does**: Popup for selecting specific activities
- Appears when student is marked as "Activity"
- Pre-defined options: Library, Nurse, Counselor, ATL
- Option to type custom activity
- Updates student card to show specific activity

#### `src/components/NotesDialog.tsx`
**What it does**: Popup for managing student notes
- Shows all existing notes for a student
- Form to add new notes
- Notes are private to teachers
- Date stamps for when notes were added

#### `src/components/SimpleAttendanceDialog.tsx`
**What it does**: Popup for exporting attendance reports
- Date range selection for reports
- Section filtering (specific class or all)
- CSV format preview
- Downloads Excel-compatible files

### 🪝 **Hooks (Data Management)**

#### `src/hooks/useStudents.ts`
**What it does**: Manages all student data and operations
- Loads students from database when app starts
- Provides functions to update student status
- Handles adding notes to students
- Manages "reset all to present" functionality
- Like a student database manager

**Main functions:**
- `students` - Array of all students
- `updateStudentStatus(id, status)` - Change attendance
- `addNote(id, note)` - Add teacher note
- `resetAllStudents()` - Mark everyone present
- `loading` - Is data still loading?
- `error` - Any error messages

#### `src/hooks/useStudentFilters.ts`
**What it does**: Handles searching and filtering students
- Search by name or admission number
- Filter by section (Class A, B, etc.)
- Filter by status (Present, Absent, etc.)
- Always sorts results alphabetically
- Like a smart search assistant

**Main functions:**
- `filteredStudents` - Students after applying filters
- `searchTerm` - Current search query
- `setSearchTerm(term)` - Update search
- `sectionFilter` - Current section filter
- `setSectionFilter(section)` - Change section filter

### 🔧 **Services (External Communication)**

#### `src/services/googleSheets.ts`
**What it does**: Communicates with Firebase database and handles data operations
- Saves student data to cloud database
- Loads student information on app startup
- Tracks all attendance changes with timestamps
- Exports attendance data to CSV files
- Handles real-time data synchronization
- Like the main office that keeps all records

**Main functions:**
- `getStudents()` - Load all students from database
- `updateStudent(id, changes)` - Save student changes
- `logAttendanceChange()` - Record status change for reports
- `exportSimpleAttendanceCSV()` - Create single-date report
- `exportMultiDateAttendanceCSV()` - Create date-range report
- `resetDailyAttendance()` - Reset all students to present

#### `src/services/auth.ts`
**What it does**: Handles user authentication and security
- Login and logout functionality
- Creates new user accounts
- Manages user sessions
- Checks if users are authorized
- Like a security department

**Main functions:**
- `signIn(email, password)` - Log in user
- `signUp(email, password, name)` - Create account
- `signOut()` - Log out current user
- `getCurrentUser()` - Get logged-in user info
- `onAuthStateChanged(callback)` - Listen for login/logout

### 🛠️ **Utils (Helper Functions)**

#### `src/utils/index.ts`
**What it does**: Collection of helper functions used throughout the app

**Date & Time Functions:**
- `formatDateDDMMYYYY(date)` → "27/07/2025"
  - Converts any date to readable dd/mm/yyyy format
  - Handles different input types (Date, string, timestamp)
  - Used in CSV exports and UI displays

- `formatDateTimeDDMMYYYY(date)` → "27/07/2025, 10:30:45"  
  - Shows both date and time in readable format
  - Used for attendance logs and debugging

- `getCurrentDateString()` → "2025-07-27"
  - Gets today's date in database-friendly format
  - Used for storing dates in Firebase

- `createWashroomTimer()` → timestamp
  - Creates timestamp for 12 minutes in the future
  - Used when student goes to washroom

- `formatTimeRemaining(timestamp)` → "5:42"
  - Shows countdown timer in MM:SS format
  - Used for washroom timer display

**Student Functions:**
- `isStudentPresent(student)` → true/false
  - Checks if student is considered present (any status except absent)
  - Used for attendance statistics

- `getLatestNote(notes)` → "Most recent note"
  - Gets the newest note from student's notes array
  - Used to preview notes on student cards

- `hasMultipleNotes(notes)` → true/false
  - Checks if student has more than one note
  - Used to show "View All Notes" button

**File Functions:**
- `generateCsvFilename(type, section, date)` → "simple_A_2025-07-27.csv"
  - Creates descriptive filenames for exports
  - Prevents overwriting files

- `downloadCsv(content, filename)`
  - Downloads CSV content as Excel file
  - Handles browser file download

**Validation Functions:**
- `isValidEmail(email)` → true/false
  - Checks if email format is correct
  - Used in login/register forms

- `capitalizeWords(text)` → "Proper Case Text"
  - Makes first letter of each word uppercase
  - Used for formatting names

### 📊 **Types (Data Structures)**

#### `src/types/index.ts`
**What it does**: Defines the structure of data used throughout the app

**Student Interface:**  
Defines what information we store about each student
```typescript
interface Student {
  id: number;                    // Unique identifier
  name: string;                  // Full name
  admission_number: string;      // School ID
  section: string;               // Class section
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity: string;              // Current activity details
  timer_end: number | null;      // Washroom timer end time
  notes: string[];               // Teacher notes
}
```

**AttendanceLog Interface:**
Defines structure for attendance history records
```typescript
interface AttendanceLog {
  student_id: number;            // Which student
  student_name: string;          // Student name
  date: string;                  // Date of change
  timestamp: number;             // Exact time
  status: string;                // New status
  logged_by: string;             // Who made the change
}
```

#### `src/types/auth.ts`  
**What it does**: Defines user and authentication data structures

**User Interface:**
```typescript
interface User {
  uid: string;                   // Firebase user ID
  email: string;                 // Login email
  displayName: string;           // Full name
  role: 'teacher' | 'admin';     // User permissions
}
```

### 🎨 **Styling and Configuration**

#### `src/theme.tsx`
**What it does**: Defines the visual appearance of the app
- Apple-inspired dark theme
- Colors, fonts, and spacing
- Material-UI theme configuration
- Responsive breakpoints for mobile/desktop
- Like an interior designer's style guide

#### `src/constants/index.ts`
**What it does**: Stores fixed values used throughout the app
- Washroom timer duration (12 minutes)
- Status color mappings
- Configuration settings
- Default values
- Like a settings file

### 🧪 **Testing Files**

#### `src/test/setup.ts`
**What it does**: Configures the testing environment
- Sets up testing utilities
- Configures mock services
- Test database connections

#### `src/utils/index.test.ts`
**What it does**: Tests for utility functions
- Verifies date formatting works correctly
- Tests edge cases and error handling
- Ensures functions return expected results

#### `src/utils/date.test.ts`
**What it does**: Specific tests for date functions
- Tests dd/mm/yyyy formatting
- Verifies different input types work
- Checks invalid date handling

#### `src/hooks/useStudents.test.ts`
**What it does**: Tests for student data management
- Verifies student loading from database
- Tests status update functionality
- Checks error handling

### 🗂️ **Configuration Files**

#### `package.json`
**What it does**: App configuration and dependencies
- Lists all external libraries needed (React, Material-UI, Firebase, etc.)
- Defines scripts to run the app (`npm run dev`, `npm run build`)
- Project metadata (name, version, description)
- Like a recipe that lists all ingredients

#### `vite.config.ts`
**What it does**: Build tool configuration
- Configures how the app is built and served
- Sets up development server
- Optimizes for production builds

#### `tsconfig.json`
**What it does**: TypeScript configuration
- Defines TypeScript compiler settings
- Sets up type checking rules
- Configures module resolution

## 🔄 How Everything Works Together

### 🟢 **Data Flow Example: Marking Student Absent**

1. **User clicks "Absent" button** → `StudentCard.tsx`
2. **Component calls function** → `useStudents.ts` 
3. **Hook updates database** → `googleSheets.ts`
4. **Service saves to Firebase** → Database
5. **UI updates immediately** → Student card shows red "A"

### 🟢 **Search Flow Example: Finding a Student**

1. **User types "john"** → Search input
2. **Filter hook processes** → `useStudentFilters.ts`
3. **Fuzzy search runs** → Finds "John Doe", "Johnny Smith"
4. **Results sorted** → Alphabetical order
5. **UI updates** → Shows matching students only

### 🟢 **Export Flow Example: Creating Report**

1. **User selects date/section** → `SimpleAttendanceDialog.tsx`
2. **Export function called** → `googleSheets.ts`
3. **Data retrieved from database** → Student and attendance data
4. **CSV content generated** → Using date formatting utils
5. **File downloaded** → `downloadCsv()` utility

## 🎯 Quick Function Finder

**Need to...**
- **Display a date?** → `formatDateDDMMYYYY()`
- **Start washroom timer?** → `createWashroomTimer()`
- **Check if student present?** → `isStudentPresent()`
- **Search students?** → `useStudentFilters` hook
- **Update attendance?** → `updateStudentStatus()` from `useStudents`
- **Export report?** → `exportSimpleAttendanceCSV()` from `googleSheets`
- **Validate email?** → `isValidEmail()`
- **Download file?** → `downloadCsv()`
- **Add student note?** → `addNote()` from `useStudents`
- **Format time countdown?** → `formatTimeRemaining()`

## 🚀 For New Developers

**Start by understanding these files in order:**
1. `src/types/index.ts` - Learn the data structures
2. `src/components/App/App.tsx` - See the main app layout  
3. `src/components/StudentCard/StudentCard.tsx` - Understand the core UI component
4. `src/hooks/useStudents.ts` - Learn how data is managed
5. `src/services/googleSheets.ts` - See how database operations work
6. `src/utils/index.ts` - Explore the helper functions

**Then explore:**
- Authentication: `src/services/auth.ts` and `src/components/auth/`
- Filtering: `src/hooks/useStudentFilters.ts`
- Exports: `SimpleAttendanceDialog.tsx` and CSV functions
- Styling: `src/theme.tsx`

**Finally:**
- Tests: Files ending in `.test.ts`
- Configuration: `package.json`, `vite.config.ts`
- Documentation: This guide and README files

---

🎉 **You now have a complete reference to every function and file in Stutra!** Use this guide alongside the other documentation to understand how everything works together.
