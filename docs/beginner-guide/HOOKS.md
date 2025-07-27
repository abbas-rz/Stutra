# 🪝 Hooks Guide - Managing Data in React

## 🎯 What Are Hooks?

Hooks are special React functions that let components "hook into" React features like state management, data fetching, and side effects. Think of them as power tools that make components smarter and more capable.

### 🟢 Simple Analogy
Hooks are like smart assistants for your components:
- **useState** = **Memory Assistant** (remembers things)
- **useEffect** = **Task Scheduler** (does things at the right time)
- **useStudents** = **Student Database Assistant** (manages all student data)
- **useStudentFilters** = **Search Assistant** (finds and organizes students)

## 🔧 Built-in React Hooks

### 🟢 useState - The Memory Hook

**What it does**: Lets components remember and change information.

```typescript
// 🟢 Simple example
const [count, setCount] = useState(0);

// count = current value (starts at 0)
// setCount = function to change the value

// To change the count:
setCount(5); // Now count equals 5
```

**Real example from Stutra:**
```typescript
// 🟢 Remember if a dialog is open or closed
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Open the dialog
const openDialog = () => setIsDialogOpen(true);

// Close the dialog  
const closeDialog = () => setIsDialogOpen(false);
```

### 🟢 useEffect - The Task Scheduler Hook

**What it does**: Runs code at specific times (when component loads, when data changes, etc.).

```typescript
// 🟢 Simple example
useEffect(() => {
  // This code runs when the component first loads
  console.log('Component loaded!');
}, []); // Empty array means "only run once"

useEffect(() => {
  // This code runs every time 'count' changes
  console.log('Count changed to:', count);
}, [count]); // Array with 'count' means "run when count changes"
```

**Real example from Stutra:**
```typescript
// 🟢 Load students when app starts
useEffect(() => {
  const loadStudents = async () => {
    const students = await googleSheetsService.getStudents();
    setStudents(students);
  };
  
  loadStudents();
}, []); // Load once when component mounts
```

## 🎓 Custom Hooks in Stutra

Custom hooks are like specialized assistants that handle complex tasks. Stutra has two main custom hooks:

## 📚 useStudents Hook

### 📍 **Location**: `src/hooks/useStudents.ts`

### 🟢 What Does It Do?
The useStudents hook is like a **Student Database Manager** that handles all student-related operations. It's the middleman between your components and the database service.

### 🔧 What It Manages:

```typescript
// 🟢 Everything useStudents keeps track of
interface UseStudentsReturn {
  students: Student[];           // List of all students
  loading: boolean;             // Is data still loading?
  error: string | null;         // Any error that occurred
  updateStudentStatus: Function; // Change student's attendance
  addNote: Function;            // Add note to student
  resetAllStudents: Function;   // Mark everyone present
  resetStudent: Function;       // Reset one student to present
}
```

### 🟢 How to Use It:

```typescript
// 🟢 In a component
function Dashboard() {
  const { 
    students, 
    loading, 
    error, 
    updateStudentStatus 
  } = useStudents();

  if (loading) return <div>Loading students...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {students.map(student => (
        <StudentCard 
          key={student.id}
          student={student}
          onStatusChange={updateStudentStatus}
        />
      ))}
    </div>
  );
}
```

### 🔧 Key Functions Explained:

#### **updateStudentStatus**
```typescript
// 🟢 Changes a student's attendance status
const updateStudentStatus = async (
  studentId: number, 
  status: string, 
  activity?: string
) => {
  try {
    setLoading(true);
    
    // Update in database
    await googleSheetsService.updateStudent(studentId, { 
      status, 
      activity,
      timer_end: status === 'washroom' ? Date.now() + 12*60*1000 : null 
    });
    
    // Update local state so UI changes immediately
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, status, activity }
          : student
      )
    );
  } catch (error) {
    setError('Failed to update student status');
  } finally {
    setLoading(false);
  }
};
```

**What happens when called:**
1. **Optimistic update** - UI changes immediately (for good user experience)
2. **Database update** - Save change to Firebase
3. **Error handling** - If database update fails, show error and revert UI
4. **State sync** - Make sure component state matches database

#### **addNote**
```typescript
// 🟢 Adds a private note about a student
const addNote = async (studentId: number, noteText: string) => {
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  const updatedNotes = [...student.notes, noteText];
  
  await googleSheetsService.updateStudent(studentId, { 
    notes: updatedNotes 
  });
  
  // Update local state
  setStudents(prevStudents =>
    prevStudents.map(s =>
      s.id === studentId ? { ...s, notes: updatedNotes } : s
    )
  );
};
```

#### **resetAllStudents**
```typescript
// 🟢 Marks all students as present (used at start of day)
const resetAllStudents = async () => {
  try {
    // Reset everyone to present status
    const resetPromises = students.map(student =>
      googleSheetsService.updateStudent(student.id, {
        status: 'present',
        activity: '',
        timer_end: null
      })
    );
    
    await Promise.all(resetPromises); // Wait for all updates to complete
    
    // Update local state
    setStudents(prevStudents =>
      prevStudents.map(student => ({
        ...student,
        status: 'present',
        activity: '',
        timer_end: null
      }))
    );
  } catch (error) {
    setError('Failed to reset students');
  }
};
```

## 🔍 useStudentFilters Hook

### 📍 **Location**: `src/hooks/useStudentFilters.ts`

### 🟢 What Does It Do?
The useStudentFilters hook is like a **Smart Search Assistant** that helps find, filter, and organize students based on various criteria.

### 🔧 What It Manages:

```typescript
// 🟢 Everything useStudentFilters handles
interface UseStudentFiltersReturn {
  filteredStudents: Student[];    // Students after filtering/searching
  searchTerm: string;            // Current search query
  sectionFilter: string;         // Current section filter
  statusFilter: string;          // Current status filter
  setSearchTerm: Function;       // Update search query
  setSectionFilter: Function;    // Update section filter
  setStatusFilter: Function;     // Update status filter
  clearFilters: Function;        // Reset all filters
}
```

### 🟢 How to Use It:

```typescript
// 🟢 In a component
function StudentList({ students }: { students: Student[] }) {
  const {
    filteredStudents,
    searchTerm,
    setSearchTerm,
    sectionFilter,
    setSectionFilter
  } = useStudentFilters(students);

  return (
    <div>
      {/* Search input */}
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search students..."
      />
      
      {/* Section filter */}
      <select 
        value={sectionFilter} 
        onChange={(e) => setSectionFilter(e.target.value)}
      >
        <option value="All">All Sections</option>
        <option value="A">Section A</option>
        <option value="B">Section B</option>
      </select>

      {/* Display filtered results */}
      {filteredStudents.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

### 🔧 How Filtering Works:

#### **Search by Name or Admission Number**
```typescript
// 🟢 Fuzzy search implementation
const searchStudents = (students: Student[], term: string): Student[] => {
  if (!term.trim()) return students;
  
  const fuse = new Fuse(students, {
    keys: ['name', 'admission_number'], // Search in these fields
    threshold: 0.3, // How fuzzy the search should be (0 = exact, 1 = very fuzzy)
  });
  
  const results = fuse.search(term);
  return results.map(result => result.item);
};
```

**Examples:**
- Search "john" → finds "John Doe", "Johnny Smith"
- Search "2024" → finds students with admission numbers containing "2024"
- Search "joh do" → finds "John Doe" (fuzzy matching)

#### **Filter by Section**
```typescript
// 🟢 Section filtering
const filterBySection = (students: Student[], section: string): Student[] => {
  if (section === 'All') return students;
  return students.filter(student => student.section === section);
};
```

#### **Filter by Status**
```typescript
// 🟢 Status filtering  
const filterByStatus = (students: Student[], status: string): Student[] => {
  if (status === 'All') return students;
  return students.filter(student => student.status === status);
};
```

#### **Alphabetical Sorting**
```typescript
// 🟢 Always sort results alphabetically
const sortStudents = (students: Student[]): Student[] => {
  return students.sort((a, b) => a.name.localeCompare(b.name));
};
```

### 🔄 Complete Filter Pipeline:

```typescript
// 🟢 How filtering works step by step
const filteredStudents = useMemo(() => {
  let result = students;
  
  // Step 1: Filter by section
  result = filterBySection(result, sectionFilter);
  
  // Step 2: Filter by status  
  result = filterByStatus(result, statusFilter);
  
  // Step 3: Search by name/admission number
  result = searchStudents(result, searchTerm);
  
  // Step 4: Sort alphabetically
  result = sortStudents(result);
  
  return result;
}, [students, sectionFilter, statusFilter, searchTerm]);
```

**Real-world example:**
```
Original: 30 students
    ↓ Filter by "Section A"
15 students remain  
    ↓ Filter by "Present" status
12 students remain
    ↓ Search for "john"
2 students remain: "John Doe", "Johnny Smith"
    ↓ Sort alphabetically  
Final result: ["John Doe", "Johnny Smith"]
```

## 🔄 Hook Communication Pattern

### 🟢 How Hooks Work Together

Hooks don't work in isolation - they communicate with each other and with services:

```
Component
    ↓ (uses)
useStudentFilters 
    ↓ (filters data from)
useStudents
    ↓ (gets data from)  
googleSheetsService
    ↓ (communicates with)
Firebase Database
```

### 🟢 Example: Searching for a Student

```
1. User types "john" in search box
   ↓ (Component calls setSearchTerm)
2. useStudentFilters updates searchTerm state
   ↓ (Triggers useMemo recalculation)
3. Filter pipeline runs with new search term
   ↓ (Returns filtered student list)
4. Component re-renders with filtered results
   ↓ (Shows only matching students)
5. StudentCard components display filtered students
```

## 🧠 Hook Best Practices in Stutra

### 🟢 Performance Optimization

**useMemo for Expensive Calculations:**
```typescript
// 🟢 Only recalculate when dependencies change
const filteredStudents = useMemo(() => {
  return expensiveFilteringFunction(students, filters);
}, [students, filters]); // Only recalculate when these change
```

**useCallback for Function Stability:**
```typescript
// 🟢 Prevent unnecessary re-renders
const updateStudentStatus = useCallback((studentId, status) => {
  // Function logic here
}, [students]); // Function only changes when students change
```

### 🟢 Error Handling

**Graceful Error Management:**
```typescript
// 🟢 Hook with built-in error handling
function useStudents() {
  const [error, setError] = useState<string | null>(null);
  
  const updateStudent = async (id: number, updates: any) => {
    try {
      setError(null); // Clear previous errors
      await googleSheetsService.updateStudent(id, updates);
    } catch (err) {
      setError('Failed to update student. Please try again.');
      // Optionally: retry logic, user notification, etc.
    }
  };
  
  return { error, updateStudent };
}
```

### 🟢 Loading States

**User-Friendly Loading Indicators:**
```typescript
// 🟢 Manage loading states
function useStudents() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const students = await googleSheetsService.getStudents();
        setStudents(students);
      } finally {
        setLoading(false); // Always stop loading, even if error occurs
      }
    };
    
    loadData();
  }, []);
  
  return { students, loading };
}
```

## 🧪 Testing Hooks

### 🟢 How We Test Hooks

Hooks are tested to ensure they work correctly:

```typescript
// 🟢 Example hook test
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';

test('should update student status', async () => {
  const { result } = renderHook(() => useStudents());
  
  // Wait for initial load
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  // Test status update
  await act(async () => {
    await result.current.updateStudentStatus(1, 'absent');
  });
  
  // Verify the change
  const updatedStudent = result.current.students.find(s => s.id === 1);
  expect(updatedStudent.status).toBe('absent');
});
```

## 🚀 Creating Custom Hooks

### 🟢 When to Create a Custom Hook

Create a custom hook when you have:
- **Complex state logic** that's used in multiple components
- **Data fetching** that needs to be reused
- **Side effects** that need consistent handling

### 🟢 Example: Creating useTimer Hook

```typescript
// 🟢 Custom hook for washroom timer
function useTimer(initialTime: number) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer); // Cleanup
  }, [isRunning, timeLeft]);
  
  const start = () => setIsRunning(true);
  const stop = () => setIsRunning(false);
  const reset = () => {
    setTimeLeft(initialTime);
    setIsRunning(false);
  };
  
  return { timeLeft, isRunning, start, stop, reset };
}

// 🟢 Usage in component
function WashroomTimer() {
  const { timeLeft, isRunning, start, stop } = useTimer(12 * 60); // 12 minutes
  
  return (
    <div>
      <p>Time left: {Math.floor(timeLeft / 60)}:{timeLeft % 60}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

---

**Next Step**: Learn about [Utils](./UTILS.md) to understand the helper functions that make common tasks easier!
