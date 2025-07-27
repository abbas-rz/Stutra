# 📁 File Structure Guide - Where Everything Lives

## 🎯 What is File Structure?

File structure is like organizing your house - everything has a specific room and purpose. In Stutra, each file and folder has a job to do.

## 🏠 The Big Picture

```
Stutra/
├── 📁 public/          → Static files (images, icons)
├── 📁 src/             → All the application code
├── 📁 docs/            → Documentation (this guide!)
├── 📁 scripts/         → Helper scripts
├── 📄 package.json     → App configuration and dependencies
├── 📄 README.md        → Project introduction
└── 📄 vite.config.ts   → Build tool configuration
```

### 🟢 Simple Analogy
Think of Stutra like a school building:
- `public/` = **Reception area** (first things visitors see)
- `src/` = **Classrooms** (where the main work happens)  
- `docs/` = **Library** (documentation and guides)
- `scripts/` = **Maintenance room** (tools and utilities)
- `package.json` = **School handbook** (rules and requirements)

## 📂 Inside the `src/` Folder (The Heart of the App)

```
src/
├── 📁 components/      → User interface pieces
├── 📁 hooks/          → Special React functions
├── 📁 services/       → Communication with external systems
├── 📁 types/          → Data structure definitions
├── 📁 utils/          → Helper functions
├── 📁 constants/      → Fixed values used throughout app
├── 📁 pages/          → Full page components
├── 📁 assets/         → Images and icons
├── 📁 test/           → Test files to check if code works
├── 📄 main.tsx        → App starting point
├── 📄 App.tsx         → Main app container
└── 📄 theme.tsx       → Colors and styling definitions
```

## 🧩 Components Folder (`src/components/`)

### 🟢 What Are Components?
Components are like LEGO blocks - small, reusable pieces that build the user interface.

```
components/
├── 📁 App/                    → Main application wrapper
│   ├── App.tsx               → The main app component
│   └── index.ts              → Exports the component
├── 📁 StudentCard/           → Individual student display
│   ├── StudentCard.tsx       → Shows one student's info
│   └── index.ts              → Exports the component
├── 📁 auth/                  → Login and security
│   ├── LoginPage.tsx         → Login form
│   ├── RegisterPage.tsx      → Sign-up form
│   └── ProtectedRoute.tsx    → Security guard for pages
├── 📄 AttendanceDialog.tsx   → Popup for attendance options
├── 📄 ActivityDialog.tsx     → Popup for selecting activities  
├── 📄 NotesDialog.tsx        → Popup for adding student notes
└── 📄 SimpleAttendanceDialog.tsx → Popup for exporting attendance
```

### 🟢 Real-World Examples:

**StudentCard.tsx** = Like a student ID card
- Shows student's name and photo
- Has buttons for Present/Absent/Washroom
- Displays current status with colors

**LoginPage.tsx** = Like a security checkpoint
- Asks for username and password
- Checks if credentials are correct
- Lets you into the app if valid

**NotesDialog.tsx** = Like a teacher's notepad
- Popup window for writing notes about students
- Saves notes privately for teacher reference
- Shows history of previous notes

## 🪝 Hooks Folder (`src/hooks/`)

### 🟢 What Are Hooks?
Hooks are like special assistants that help manage data and state in React components.

```
hooks/
├── 📄 useStudents.ts         → Manages student data
├── 📄 useStudentFilters.ts   → Handles searching and filtering
├── 📄 index.ts               → Exports all hooks
└── 📄 useStudents.test.ts    → Tests for student data hook
```

### 🟢 What Each Hook Does:

**useStudents.ts** = Student Database Manager
```typescript
// 🟢 Simple explanation: Keeps track of all students
const { students, updateStudent, addStudent } = useStudents();
```
- Loads student data from database
- Updates student information
- Handles adding new students

**useStudentFilters.ts** = Search and Sort Assistant
```typescript
// 🟢 Simple explanation: Helps find and organize students
const { filteredStudents, searchTerm, setSearchTerm } = useStudentFilters(students);
```
- Searches students by name
- Filters by section or status
- Sorts students alphabetically

## 🔧 Services Folder (`src/services/`)

### 🟢 What Are Services?
Services are like messengers that talk to external systems (databases, APIs, etc.).

```
services/
├── 📄 googleSheets.ts    → Talks to Google Sheets and Firebase
├── 📄 auth.ts            → Handles login and security
└── 📄 index.ts           → Exports all services
```

### 🟢 What Each Service Does:

**googleSheets.ts** = Database Communication Manager
- Saves student data to Firebase
- Exports attendance to CSV files
- Loads student information on app startup
- Tracks attendance changes over time

**auth.ts** = Security Guard
- Handles user login and logout
- Checks if users are authorized
- Manages user sessions
- Protects sensitive data

## 📝 Types Folder (`src/types/`)

### 🟢 What Are Types?
Types are like instruction manuals that tell TypeScript what kind of data to expect.

```
types/
├── 📄 index.ts    → Main data structures (Student, AttendanceLog, etc.)
└── 📄 auth.ts     → User and authentication data structures
```

### 🟢 Example Types:

**Student Type** = Blueprint for Student Data
```typescript
interface Student {
  id: number;           // Student's unique number
  name: string;         // Student's full name
  admission_number: string;  // School ID number
  status: string;       // Present, Absent, Washroom, etc.
  photo_url: string;    // Link to student's photo
  notes: string[];      // Array of teacher notes
}
```

**AttendanceLog Type** = Blueprint for Attendance Records
```typescript
interface AttendanceLog {
  student_id: number;   // Which student
  status: string;       // What status was recorded
  timestamp: number;    // When it happened
  date: string;         // Which date
}
```

## 🛠️ Utils Folder (`src/utils/`)

### 🟢 What Are Utils?
Utils (utilities) are like a toolbox - helper functions that do common tasks throughout the app.

```
utils/
├── 📄 index.ts           → All utility functions
├── 📄 index.test.ts      → Tests for utilities
└── 📄 date.test.ts       → Tests for date functions
```

### 🟢 Example Utility Functions:

**Date Formatting** = Date Helper
```typescript
// 🟢 Converts dates to readable format
formatDateDDMMYYYY(new Date()) // Returns: "27/07/2025"
```

**Timer Functions** = Washroom Timer Helper
```typescript
// 🟢 Creates 12-minute timer for washroom visits
createWashroomTimer() // Returns timestamp 12 minutes from now
```

**CSV Export** = Report Generator
```typescript
// 🟢 Downloads attendance data as Excel file
downloadCsv(attendanceData, "attendance_report.csv")
```

## 📄 Root Files (Important Individual Files)

### **main.tsx** = App Starter
🟢 **What it does**: Like turning on the lights in your house
- Starts the React application
- Connects to the HTML page
- Loads the main App component

### **App.tsx** = App Container
🟢 **What it does**: Like the main living room where everything happens
- Contains the overall app layout
- Handles routing (which page to show)
- Manages global state and theme

### **theme.tsx** = Style Designer
🟢 **What it does**: Like an interior decorator
- Defines colors, fonts, and spacing
- Creates the Apple-inspired dark theme
- Ensures consistent look throughout app

### **package.json** = App Recipe Book
🟢 **What it does**: Like a recipe that lists all ingredients
- Lists all external libraries needed
- Defines scripts (commands) to run the app
- Contains app metadata (name, version, etc.)

## 🗂️ How Files Work Together

### 🟢 Example: Marking a Student Absent

1. **User clicks "Absent" button** → `StudentCard.tsx`
2. **Component calls update function** → `useStudents.ts` hook
3. **Hook sends data to database** → `googleSheets.ts` service
4. **Database saves the change** → Firebase
5. **UI updates to show red "A"** → Back to `StudentCard.tsx`

### 🟢 Data Flow Diagram:
```
User Action (Click Button)
    ↓
Component (StudentCard.tsx)
    ↓  
Hook (useStudents.ts)
    ↓
Service (googleSheets.ts)
    ↓
Database (Firebase)
    ↓
Back to UI (Updated display)
```

## 📋 File Naming Conventions

### 🟢 Understanding File Names:

**Component Files**:
- `StudentCard.tsx` = React component with UI
- `StudentCard.test.ts` = Tests for StudentCard
- `index.ts` = Exports the component (like a table of contents)

**Hook Files**:
- `useStudents.ts` = Custom React hook (always starts with "use")
- `useStudents.test.ts` = Tests for the hook

**Service Files**:
- `googleSheets.ts` = Service that talks to external APIs
- `auth.ts` = Service that handles authentication

## 🔍 Finding Specific Functionality

### 🟢 "I want to change..."

**Student display** → `src/components/StudentCard/StudentCard.tsx`
**Login page** → `src/components/auth/LoginPage.tsx`
**Attendance tracking** → `src/hooks/useStudents.ts`
**Database saving** → `src/services/googleSheets.ts`
**Colors and styling** → `src/theme.tsx`
**Date formatting** → `src/utils/index.ts`
**Data types** → `src/types/index.ts`

## 🚨 Important Files to Understand First

For beginners, focus on these files in this order:

1. **`src/types/index.ts`** - Understand the data structures
2. **`src/components/App/App.tsx`** - See the main app layout
3. **`src/components/StudentCard/StudentCard.tsx`** - Learn how student cards work
4. **`src/hooks/useStudents.ts`** - Understand data management
5. **`src/services/googleSheets.ts`** - See database operations

---

**Next Step**: Learn about [Components](./COMPONENTS.md) to understand how the user interface works!
