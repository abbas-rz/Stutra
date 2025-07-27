# 📋 Data Flow Guide - How Information Moves Through Stutra

## 🎯 What is Data Flow?

Data flow is like the nervous system of an app - it describes how information travels from one part to another. Understanding data flow helps you see the big picture of how Stutra works.

### 🟢 Simple Analogy
Think of data flow like a restaurant:
- **User Interface** = **Dining Room** (where customers place orders)
- **Components** = **Waiters** (take orders and deliver food)
- **Hooks** = **Kitchen Staff** (prepare and manage orders)
- **Services** = **Food Suppliers** (provide ingredients)
- **Database** = **Storage Room** (where ingredients are kept)

## 🔄 Complete Data Flow Example: Marking a Student Absent

Let's follow what happens when a teacher clicks the "Absent" button:

### Step 1: User Action (Frontend)
```
Teacher sees student card for "John Doe"
    ↓
Teacher clicks red "Absent" button
    ↓
Button's onClick event fires
```

### Step 2: Component Event (StudentCard.tsx)
```typescript
// 🟢 StudentCard component
<Button 
  onClick={() => onStatusChange(student.id, 'absent', '', null)}
  color="error"
>
  Absent
</Button>
```

**What happens:**
- `onClick` calls the `onStatusChange` function
- Passes student ID (123), new status ('absent'), no activity (''), no timer (null)

### Step 3: Parent Component Receives Event (Dashboard)
```typescript
// 🟢 Dashboard component
<StudentCard
  student={student}
  onStatusChange={updateStudentStatus}  // This function gets called
/>
```

### Step 4: Hook Processes the Change (useStudents)
```typescript
// 🟢 useStudents hook
const updateStudentStatus = async (studentId: number, status: string) => {
  try {
    // Step 4a: Optimistic update (change UI immediately)
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, status: 'absent' }
          : student
      )
    );
    
    // Step 4b: Save to database
    await googleSheetsService.updateStudent(studentId, { status: 'absent' });
    
  } catch (error) {
    // Step 4c: If database save fails, revert the UI change
    setError('Failed to update student');
    // Revert optimistic update...
  }
};
```

### Step 5: Service Communicates with Database (googleSheets.ts)
```typescript
// 🟢 GoogleSheets service
async updateStudent(studentId: number, updates: Partial<Student>) {
  // Step 5a: Find the student
  const studentRef = ref(this.database, `students/${studentId}`);
  
  // Step 5b: Update in Firebase
  await update(studentRef, {
    status: 'absent',
    lastModified: Date.now()
  });
  
  // Step 5c: Log the change for reports
  await this.logAttendanceChange(studentId, 'absent');
}
```

### Step 6: Database Stores the Change (Firebase)
```
Firebase Realtime Database
    ↓
students/123/status changed from "present" to "absent"
    ↓
Timestamp: 2025-07-27 10:30:45
    ↓
Change logged to attendance_logs/2025-07-27/
```

### Step 7: Real-time Updates (All Connected Devices)
```
Firebase detects change
    ↓
Sends update to all connected devices
    ↓
Other teachers/principals see John's status change to "absent"
    ↓
Student card updates from green "P" to red "A"
```

## 🎭 Data Flow Patterns in Stutra

### 🟢 Pattern 1: User Action → Component → Hook → Service → Database

This is the most common pattern for data changes:

```
User clicks button
    ↓
Component handles click  
    ↓
Hook processes business logic
    ↓
Service communicates with external systems
    ↓
Database stores the change
```

**Examples:**
- Marking attendance
- Adding notes
- Changing student information
- Exporting reports

### 🟢 Pattern 2: Database → Service → Hook → Component → User Interface

This pattern is for loading and displaying data:

```
Database contains student data
    ↓
Service retrieves data
    ↓
Hook manages state and provides data
    ↓
Component receives data via props
    ↓
User sees formatted information
```

**Examples:**
- Loading students on app startup
- Refreshing attendance data
- Displaying search results
- Showing real-time updates

### 🟢 Pattern 3: User Input → Filter → Display

This pattern is for search and filtering:

```
User types in search box
    ↓
useStudentFilters hook processes input
    ↓
Filter functions run (search, section, status)
    ↓
Filtered results displayed to user
```

## 🔍 Detailed Flow Examples

### 📝 Example 1: Adding a Note to a Student

```
1. User Action:
   Teacher clicks "Add Note" button on John's card
   
2. Component Event:
   StudentCard calls onNotesOpen(studentId)
   
3. Dialog Opens:
   NotesDialog component displays with form
   
4. User Input:
   Teacher types: "Needs extra help with math"
   
5. Form Submission:
   NotesDialog calls onAddNote(studentId, noteText)
   
6. Hook Processing:
   useStudents.addNote() function executes:
   - Gets current notes: ["Previous note"]
   - Adds new note: ["Previous note", "Needs extra help with math"]
   - Updates local state immediately (optimistic update)
   
7. Service Call:
   googleSheetsService.updateStudent(studentId, { notes: updatedNotes })
   
8. Database Update:
   Firebase updates student record with new notes array
   
9. Real-time Sync:
   All devices receive update and show note indicator
   
10. UI Feedback:
    Dialog closes, student card shows note indicator
```

### 📊 Example 2: Exporting Attendance Report

```
1. User Action:
   Teacher clicks "Export Attendance" button
   
2. Dialog Opens:
   SimpleAttendanceDialog displays with options
   
3. User Selects Options:
   - Date: 27/07/2025
   - Section: Class A
   - Type: Single Date
   
4. Export Request:
   Dialog calls exportAttendance(date, section)
   
5. Data Collection:
   googleSheetsService.exportSimpleAttendanceCSV():
   - Gets all students for Section A
   - Gets attendance logs for 27/07/2025
   - Sorts students alphabetically
   - Matches students with attendance data
   
6. CSV Generation:
   Service creates CSV content:
   "Roll Number,Student Name,27/07/2025\n1,Alice Johnson,P\n2,Bob Smith,A\n"
   
7. File Creation:
   downloadCsv() utility function:
   - Creates blob from CSV content
   - Generates filename: "simple_A_2025-07-27.csv"
   - Triggers browser download
   
8. User Receives File:
   Browser downloads Excel file to user's computer
```

### 🔍 Example 3: Real-time Search

```
1. User Input:
   Teacher types "joh" in search box
   
2. Input Processing:
   Search component calls setSearchTerm("joh")
   
3. Filter Hook Activation:
   useStudentFilters detects searchTerm change
   
4. Filter Pipeline:
   useMemo recalculates filteredStudents:
   - Start with all 30 students
   - Apply section filter (if any)
   - Apply status filter (if any)
   - Apply fuzzy search for "joh"
   - Sort results alphabetically
   
5. Fuzzy Search:
   Fuse.js library searches through:
   - Student names: finds "John Doe", "Johnny Smith"
   - Admission numbers: no matches for "joh"
   
6. Results Processing:
   Filter returns 2 matching students, sorted alphabetically
   
7. UI Update:
   Component re-renders showing only matching students
   
8. Real-time Feedback:
   Results update as user continues typing
```

## 🧠 State Management Flow

### 🟢 Local State (useState)

Used for component-specific data that doesn't need to be shared:

```typescript
// 🟢 Example: Dialog open/closed state
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Flow:
User clicks button → setIsDialogOpen(true) → Dialog shows
User closes dialog → setIsDialogOpen(false) → Dialog hides
```

### 🟢 Shared State (Custom Hooks)

Used for data that multiple components need:

```typescript
// 🟢 Example: Student data shared across components
const { students, updateStudentStatus } = useStudents();

// Flow:
Hook loads students → Multiple components receive same student data
One component updates student → All components automatically re-render with new data
```

### 🟢 External State (Firebase Real-time)

Used for data that's synchronized across multiple devices:

```
Device A updates student status
    ↓
Firebase receives update
    ↓
Firebase notifies Device B, Device C, etc.
    ↓
All devices update their UI automatically
```

## 🔄 Error Handling Flow

### 🟢 Optimistic Updates with Rollback

Stutra uses optimistic updates for better user experience:

```
1. User Action:
   Teacher marks John as absent
   
2. Optimistic Update:
   UI immediately shows John as absent (red card)
   
3. Database Save:
   Try to save change to Firebase
   
4a. Success Path:
    Save succeeds → UI stays as-is → User sees immediate response
    
4b. Error Path:
    Save fails → Revert UI change → Show error message → User sees original state
```

**Benefits:**
- **Fast UI response** - User sees change immediately
- **Graceful degradation** - If network fails, UI reverts gracefully
- **Clear feedback** - User knows if action succeeded or failed

### 🟢 Error Propagation

Errors bubble up through the layers:

```
Database Error (Firebase connection lost)
    ↓
Service catches error and throws user-friendly message
    ↓
Hook catches error and sets error state
    ↓
Component displays error message to user
    ↓
User sees: "Failed to update student. Please check your connection."
```

## 📱 Responsive Data Flow

### 🟢 Mobile vs Desktop

Data flow adapts to different devices:

```typescript
// 🟢 Same data, different presentation
const isMobile = useMediaQuery('(max-width: 768px)');

// Mobile flow: Touch-friendly, larger buttons
// Desktop flow: Hover effects, more compact layout
```

**Mobile optimizations:**
- **Larger touch targets** for buttons
- **Simplified navigation** with fewer steps
- **Touch gestures** for common actions
- **Optimized scrolling** for card lists

## 🔐 Authentication Flow

### 🟢 Protected Data Access

Authentication is integrated into the data flow:

```
1. User tries to access app
   ↓
2. ProtectedRoute checks if user is logged in
   ↓
3a. If logged in: Show app content
3b. If not logged in: Redirect to login page
   ↓
4. After login: Firebase provides auth token
   ↓
5. All subsequent API calls include auth token
   ↓
6. Firebase validates token for each request
```

### 🟢 Session Management

```
User logs in → Auth token stored → Token used for API calls
    ↓ (time passes)
Token expires → Auto-logout → Redirect to login
    ↓ (user logs in again)
New token issued → Normal app functionality resumes
```

## 🧪 Testing Data Flow

### 🟢 Unit Tests (Individual Functions)

Test each piece in isolation:

```typescript
// Test utility function
test('formatDateDDMMYYYY formats correctly', () => {
  expect(formatDateDDMMYYYY('2025-07-27')).toBe('27/07/2025');
});

// Test hook behavior
test('useStudents updates student status', async () => {
  const { result } = renderHook(() => useStudents());
  await act(() => result.current.updateStudentStatus(1, 'absent'));
  expect(result.current.students[0].status).toBe('absent');
});
```

### 🟢 Integration Tests (Component + Hook)

Test how pieces work together:

```typescript
// Test component with real hook
test('StudentCard updates when status changes', async () => {
  render(<StudentCard student={mockStudent} onStatusChange={mockUpdate} />);
  
  fireEvent.click(screen.getByText('Absent'));
  
  await waitFor(() => {
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

### 🟢 End-to-End Tests (Full User Flow)

Test complete user journeys:

```typescript
test('Teacher can mark student absent and see in report', async () => {
  // Login as teacher
  await loginAsTeacher();
  
  // Mark student absent
  await clickStudentAbsentButton('John Doe');
  
  // Export attendance report
  await exportAttendanceReport();
  
  // Verify John is marked absent in CSV
  expect(downloadedCSV).toContain('John Doe,A');
});
```

## 🔧 Debugging Data Flow

### 🟢 Using Browser Dev Tools

**React Developer Tools:**
- See component state and props
- Track state changes in real-time
- Identify performance issues

**Network Tab:**
- Monitor API calls to Firebase
- Check request/response data
- Identify slow or failing requests

**Console Logs:**
```typescript
// 🟢 Strategic logging for debugging
console.log('🔍 Student status update:', { studentId, newStatus });
console.log('📝 Saving to database:', updateData);
console.log('✅ Database save successful');
```

### 🟢 Common Issues and Solutions

**Issue: Student card doesn't update**
- Check if hook is calling state setter
- Verify service is saving to database
- Look for JavaScript errors in console

**Issue: Real-time updates not working**
- Check Firebase connection
- Verify real-time listeners are set up
- Check network connectivity

**Issue: Search not working**
- Verify search term is being set
- Check filter logic in useStudentFilters
- Ensure students data is loaded

---

**Next Step**: Check out the specific guides for [Components](./COMPONENTS.md), [Hooks](./HOOKS.md), or [Services](./SERVICES.md) to dive deeper into each part of the data flow!
