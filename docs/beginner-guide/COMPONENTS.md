# 🧩 Components Guide - Building the User Interface

## 🎯 What Are Components?

Components are like LEGO blocks - small, reusable pieces that you combine to build the entire user interface. Each component has a specific job and can be used multiple times throughout the app.

### 🟢 Simple Analogy
Think of building a house:
- **Components** = Pre-made parts (doors, windows, walls)
- **Props** = Customization options (blue door vs red door)
- **State** = Things that can change (door open vs closed)

## 🏗️ Component Architecture in Stutra

```
App (Main Container)
├── LoginPage (Security checkpoint)
├── Dashboard (Main workspace)
│   ├── StudentCard (Individual student) ×30
│   ├── AttendanceDialog (Popup for marking attendance)
│   ├── ActivityDialog (Popup for selecting activities)
│   ├── NotesDialog (Popup for adding notes)
│   └── SimpleAttendanceDialog (Popup for exporting data)
└── ProtectedRoute (Security guard)
```

## 🎴 StudentCard Component - The Heart of Stutra

### 📍 **Location**: `src/components/StudentCard/StudentCard.tsx`

### 🟢 What Does It Do?
StudentCard is like a digital student ID card that shows:
- Student's name and photo
- Current status (Present, Absent, etc.)
- Buttons to change status
- Timer for washroom visits
- Notes indicator

### 🔧 How It Works:

```typescript
// 🟢 Simple version of StudentCard props
interface StudentCardProps {
  student: Student;              // The student's data
  onStatusChange: Function;      // What to do when status changes
  onActivitySelect: Function;    // What to do when activity is selected
  onNotesOpen: Function;         // What to do when notes are opened
  isMobile?: boolean;           // Is this on a mobile device?
}
```

### 🟢 Real-World Example:
```tsx
// When teacher clicks "Absent" button:
<Button 
  onClick={() => onStatusChange(student.id, 'absent', '', null)}
  color="error"
>
  Absent
</Button>
```

**What happens:**
1. Teacher clicks the red "Absent" button
2. `onStatusChange` function is called
3. Student's status changes from "present" to "absent"
4. Card turns red and shows "A" for absent
5. Database is updated with the change

### 🎨 Visual Elements:

**Status Colors:**
- 🟢 **Green** = Present (student is in class)
- 🔴 **Red** = Absent (student is not in school)
- 🔵 **Blue** = Washroom (student is in bathroom)
- 🟠 **Orange** = Activity (student is at library, nurse, etc.)
- 🟣 **Purple** = Bunking (student is skipping class)

**Status Display:**
```tsx
// 🟢 How status is shown on the card
{student.status === 'present' && <Chip label="P" color="success" />}
{student.status === 'absent' && <Chip label="A" color="error" />}
{student.status === 'washroom' && <Chip label="W" color="info" />}
```

## 🚪 Authentication Components

### 📍 **Location**: `src/components/auth/`

### 🔐 LoginPage Component

### 🟢 What Does It Do?
LoginPage is like a security checkpoint - it asks for username and password before letting users into the app.

### 🔧 Key Features:
```tsx
// 🟢 Simple login form structure
<form onSubmit={handleLogin}>
  <TextField 
    label="Email" 
    type="email" 
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <TextField 
    label="Password" 
    type="password" 
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <Button type="submit">Login</Button>
</form>
```

**What happens when you log in:**
1. User types email and password
2. Form data is sent to Firebase authentication
3. Firebase checks if credentials are correct
4. If valid: User enters the app
5. If invalid: Error message is shown

### 🛡️ ProtectedRoute Component

### 🟢 What Does It Do?
ProtectedRoute is like a security guard - it checks if users are logged in before showing them protected content.

```tsx
// 🟢 How ProtectedRoute works
function ProtectedRoute({ children }) {
  const isLoggedIn = checkIfUserIsLoggedIn();
  
  if (isLoggedIn) {
    return children;  // Show the protected content
  } else {
    return <LoginPage />;  // Redirect to login
  }
}
```

## 💬 Dialog Components (Popups)

### 🟢 What Are Dialogs?
Dialogs are popup windows that appear over the main app to collect information or show details.

### 📝 AttendanceDialog Component

### 📍 **Location**: `src/components/AttendanceDialog.tsx`

### 🟢 What Does It Do?
Shows a popup with attendance options when you click on a student card.

```tsx
// 🟢 Attendance options in the dialog
const attendanceOptions = [
  { status: 'present', label: 'Present', color: 'success' },
  { status: 'absent', label: 'Absent', color: 'error' },
  { status: 'washroom', label: 'Washroom', color: 'info' },
  { status: 'activity', label: 'Activity', color: 'warning' },
  { status: 'bunking', label: 'Bunking', color: 'secondary' }
];
```

**User Experience:**
1. Teacher clicks on student card
2. Dialog popup appears with 5 attendance options
3. Teacher selects appropriate status
4. Dialog closes and student card updates

### 🎯 ActivityDialog Component

### 📍 **Location**: `src/components/ActivityDialog.tsx`

### 🟢 What Does It Do?
Shows a popup for selecting specific activities when a student is marked as "Activity".

```tsx
// 🟢 Common activities available
const activities = [
  'Library',
  'Nurse/Medical',
  'Counselor',
  'ATL (Atal Tinkering Lab)',
  'Custom Activity'  // Teacher can type their own
];
```

**User Experience:**
1. Teacher marks student as "Activity"
2. ActivityDialog popup appears
3. Teacher selects from pre-defined activities OR types custom activity
4. Student card shows specific activity ("At Library", etc.)

### 📔 NotesDialog Component

### 📍 **Location**: `src/components/NotesDialog.tsx`

### 🟢 What Does It Do?
Shows a popup for adding and viewing private notes about students.

```tsx
// 🟢 Notes functionality
function NotesDialog({ student, onAddNote, onClose }) {
  const [newNote, setNewNote] = useState('');
  
  const handleAddNote = () => {
    onAddNote(student.id, newNote);  // Save the note
    setNewNote('');  // Clear the input
  };
}
```

**Features:**
- **View existing notes** - See all previous notes about the student
- **Add new notes** - Type new observations or reminders
- **Private notes** - Only teachers can see these notes
- **Date stamps** - Shows when each note was added

### 📊 SimpleAttendanceDialog Component

### 📍 **Location**: `src/components/SimpleAttendanceDialog.tsx`

### 🟢 What Does It Do?
Shows a popup for exporting attendance data to CSV/Excel files for school records.

**Features:**
- **Date range selection** - Choose which dates to export
- **Section filtering** - Export specific classes or all students
- **Format preview** - See how the data will look before exporting
- **CSV download** - Creates Excel-compatible file

## 🎨 Component Styling and Theming

### 🟢 How Components Look Pretty

All components use **Material-UI** with a custom **Apple-inspired theme**:

```tsx
// 🟢 Example of themed styling
<Card sx={{
  backgroundColor: 'background.paper',  // Dark theme background
  borderRadius: 2,                      // Rounded corners
  boxShadow: 3,                        // Subtle shadow
  '&:hover': {                         // Hover effect
    boxShadow: 6,                      // Stronger shadow on hover
  }
}}>
```

**Theme Features:**
- **Dark mode** - Easy on the eyes
- **Consistent spacing** - Everything aligns properly
- **Smooth animations** - Hover effects and transitions
- **Mobile responsive** - Looks great on phones and tablets

## 🔄 Component Communication

### 🟢 How Components Talk to Each Other

Components communicate through **props** (like passing notes) and **callbacks** (like raising your hand):

```tsx
// 🟢 Parent component passes data DOWN to child
<StudentCard 
  student={studentData}           // Passing data down
  onStatusChange={handleChange}   // Passing function down
/>

// 🟢 Child component calls function to send data UP to parent
const handleButtonClick = () => {
  onStatusChange(newStatus);  // Calling parent's function
};
```

### 🟢 Real Example: Marking Student Absent

```
1. StudentCard displays student info
   ↓
2. User clicks "Absent" button
   ↓  
3. StudentCard calls onStatusChange(studentId, 'absent')
   ↓
4. Parent component receives the call
   ↓
5. Parent updates database through useStudents hook
   ↓
6. Database change triggers re-render
   ↓
7. StudentCard displays updated status (red "A")
```

## 📱 Mobile-First Design

### 🟢 How Components Adapt to Different Screens

All components are designed **mobile-first**, meaning they work great on phones and scale up to computers:

```tsx
// 🟢 Example of responsive design
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },  // Stack on mobile, row on desktop
  gap: { xs: 1, md: 2 },                       // Smaller gap on mobile
  padding: { xs: 1, md: 3 },                   // Less padding on mobile
}}>
```

**Responsive Features:**
- **Touch-friendly buttons** - Bigger on mobile
- **Optimized layouts** - Stack vertically on small screens
- **Readable text** - Appropriate sizes for each device
- **Easy navigation** - Thumb-friendly interface

## 🧪 Component Testing

### 🟢 How We Make Sure Components Work

Each component has tests that check if it works correctly:

```typescript
// 🟢 Example test for StudentCard
test('should display student name', () => {
  const student = { name: 'John Doe', status: 'present' };
  render(<StudentCard student={student} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

**What Tests Check:**
- **Rendering** - Does the component appear correctly?
- **User interaction** - Do buttons work when clicked?
- **Data display** - Is information shown properly?
- **Error handling** - What happens when something goes wrong?

## 🔧 Common Component Patterns

### 🟢 Patterns You'll See Throughout Stutra

**1. Controlled Components** - React controls the form inputs
```tsx
<TextField 
  value={inputValue}                    // React controls the value
  onChange={(e) => setInputValue(e.target.value)}  // Update on change
/>
```

**2. Conditional Rendering** - Show different things based on conditions
```tsx
{student.status === 'washroom' ? (
  <Timer />                    // Show timer if in washroom
) : (
  <StatusChip />              // Show regular status otherwise
)}
```

**3. Event Handling** - Respond to user actions
```tsx
const handleClick = (event) => {
  event.preventDefault();      // Prevent default browser behavior
  doSomething();              // Do our custom action
};
```

## 🚀 Adding New Components

### 🟢 How to Create a New Component

1. **Create the file**: `src/components/MyComponent/MyComponent.tsx`
2. **Write the component**:
```tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <button onClick={onClick}>
      {title}
    </button>
  );
}
```
3. **Export it**: Create `src/components/MyComponent/index.ts`
```tsx
export { MyComponent } from './MyComponent';
```
4. **Use it**: Import and use in other components
```tsx
import { MyComponent } from '../MyComponent';

<MyComponent title="Click Me" onClick={handleClick} />
```

---

**Next Step**: Learn about [Services](./SERVICES.md) to understand how the app communicates with databases and external systems!
