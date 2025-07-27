# 🛠️ Utils Guide - Helper Functions That Make Life Easier

## 🎯 What Are Utils (Utilities)?

Utils are like a **Swiss Army knife** for programmers - a collection of small, helpful functions that solve common problems. Instead of writing the same code over and over, we create utility functions that can be used anywhere in the app.

### 🟢 Simple Analogy
Think of utils like kitchen tools:
- **formatDateDDMMYYYY** = **Date Formatter** (like a calendar that converts dates to readable format)
- **downloadCsv** = **File Saver** (like a filing cabinet that organizes reports)
- **createWashroomTimer** = **Kitchen Timer** (counts down time)
- **isStudentPresent** = **Status Checker** (quick yes/no questions)

## 📍 Location and Structure

```
src/utils/
├── 📄 index.ts           → All utility functions
├── 📄 index.test.ts      → Tests for utilities  
└── 📄 date.test.ts       → Tests for date functions
```

## 📅 Date and Time Utilities

### 🟢 formatDateDDMMYYYY - The Date Beautifier

**What it does**: Converts any date into a readable dd/mm/yyyy format.

```typescript
// 🟢 Function signature
function formatDateDDMMYYYY(date: Date | string | number): string

// 🟢 Examples
formatDateDDMMYYYY(new Date())           // "27/07/2025"
formatDateDDMMYYYY("2025-07-27")         // "27/07/2025"  
formatDateDDMMYYYY(1722096000000)        // "27/07/2025" (timestamp)
formatDateDDMMYYYY("invalid")            // "Invalid Date"
```

**Why it's needed:**
- JavaScript dates are ugly: `Sat Jul 27 2025 10:30:00 GMT+0530`
- Users want readable dates: `27/07/2025`
- Different countries use different formats (dd/mm/yyyy vs mm/dd/yyyy)

**How it works:**
```typescript
// 🟢 Step by step breakdown
export function formatDateDDMMYYYY(date: Date | string | number): string {
  // Step 1: Convert whatever we get into a proper Date object
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date)    // Convert string/number to Date
    : date;             // Already a Date object
  
  // Step 2: Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Step 3: Extract day, month, year
  const day = dateObj.getDate().toString().padStart(2, '0');        // "27"
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // "07" (months are 0-indexed!)
  const year = dateObj.getFullYear();                               // 2025
  
  // Step 4: Combine in dd/mm/yyyy format
  return `${day}/${month}/${year}`;  // "27/07/2025"
}
```

**Real-world usage in Stutra:**
```typescript
// 🟢 In attendance export dialog
<Typography>
  Date will be displayed as {formatDateDDMMYYYY(targetDate)} in export
</Typography>

// 🟢 In CSV headers
const headers = ['Roll Number', 'Student Name', formatDateDDMMYYYY(date)];
```

### 🟢 formatDateTimeDDMMYYYY - The Full DateTime Formatter

**What it does**: Shows both date and time in a readable format.

```typescript
// 🟢 Examples
formatDateTimeDDMMYYYY(new Date())  // "27/07/2025, 10:30:45"
formatDateTimeDDMMYYYY(timestamp)   // "27/07/2025, 14:22:18"
```

**Used for**: 
- Attendance logs ("John marked absent at 27/07/2025, 09:15:30")
- Debug information
- Detailed reports

### 🟢 getCurrentDateString - The Today Helper

**What it does**: Gets today's date in YYYY-MM-DD format (for database storage).

```typescript
// 🟢 Simple implementation
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];  // "2025-07-27"
}
```

**Why YYYY-MM-DD format:**
- **Database friendly** - Easy to sort and query
- **International standard** (ISO 8601)
- **Consistent** - Always the same format regardless of user's location

## ⏰ Timer Utilities

### 🟢 createWashroomTimer - The Bathroom Timer

**What it does**: Creates a timestamp for 12 minutes in the future (when washroom timer should end).

```typescript
// 🟢 Implementation
export function createWashroomTimer(): number {
  const now = new Date().getTime();                          // Current time in milliseconds
  const twelveMinutes = APP_CONFIG.WASHROOM_TIMER_MINUTES * 60 * 1000;  // 12 minutes in milliseconds
  return now + twelveMinutes;                                // Future timestamp
}

// 🟢 Usage example
const student = {
  id: 1,
  name: "John",
  status: "washroom",
  timer_end: createWashroomTimer()  // Will be 12 minutes from now
};
```

**Real-world scenario:**
```
9:00 AM: John goes to washroom
    ↓ Teacher clicks "Washroom" button
createWashroomTimer() returns timestamp for 9:12 AM
    ↓ App shows countdown: "11:45 remaining"
9:12 AM: Timer ends, app shows alert: "John has been in washroom for 12+ minutes"
```

### 🟢 formatTimeRemaining - The Countdown Display

**What it does**: Shows how much time is left on a timer in MM:SS format.

```typescript
// 🟢 Implementation
export function formatTimeRemaining(timerEnd: number): string {
  const now = new Date().getTime();
  const distance = timerEnd - now;  // How many milliseconds left
  
  if (distance <= 0) return '';     // Timer finished
  
  // Convert milliseconds to minutes and seconds
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;  // "5:42"
}

// 🟢 Usage examples
formatTimeRemaining(timerEndTimestamp)  // "5:42" (5 minutes 42 seconds left)
formatTimeRemaining(pastTimestamp)      // "" (timer finished)
```

**User experience:**
- Student card shows live countdown: "Washroom 3:27"
- Updates every second until timer reaches 0:00
- Then shows alert that student has been gone too long

## 📊 Data Processing Utilities

### 🟢 isStudentPresent - The Quick Status Checker

**What it does**: Quickly checks if a student is considered "present" (any status except absent).

```typescript
// 🟢 Simple but important function
export function isStudentPresent(student: Student): boolean {
  return student.status !== 'absent';
}

// 🟢 Usage examples
const john = { name: "John", status: "present" };
const mary = { name: "Mary", status: "washroom" };
const bob = { name: "Bob", status: "absent" };

isStudentPresent(john)  // true (present = present)
isStudentPresent(mary)  // true (washroom = still in school)
isStudentPresent(bob)   // false (absent = not present)
```

**Why this matters:**
- **Attendance reports** - Count how many students are "present" vs "absent"
- **Statistics** - "25 out of 30 students are present today"
- **Parent notifications** - Only send alerts for truly absent students

### 🟢 generateCsvFilename - The File Namer

**What it does**: Creates descriptive filenames for exported attendance reports.

```typescript
// 🟢 Function signature
function generateCsvFilename(
  type: string,      // "simple" or "multi_date" 
  section: string,   // "A", "B", or "All"
  startDate: string, // "2025-07-27"
  endDate?: string   // "2025-07-29" (optional)
): string

// 🟢 Examples
generateCsvFilename("simple", "A", "2025-07-27")
// Returns: "simple_A_2025-07-27.csv"

generateCsvFilename("multi_date", "All", "2025-07-27", "2025-07-29")  
// Returns: "multi_date_All_2025-07-27_to_2025-07-29.csv"
```

**Benefits:**
- **Descriptive names** - Easy to find files later
- **No overwriting** - Each export has unique name
- **Organized** - Sort files by date, section, type

### 🟢 downloadCsv - The File Downloader

**What it does**: Takes CSV text content and downloads it as a file to the user's computer.

```typescript
// 🟢 How it works
export function downloadCsv(content: string, filename: string): void {
  // Step 1: Create a "blob" (binary data) from the CSV text
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  
  // Step 2: Create a temporary download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Step 3: Set up the download
  link.setAttribute('href', url);           // Point to the file data
  link.setAttribute('download', filename);  // Set the filename
  link.style.visibility = 'hidden';         // Hide the link
  
  // Step 4: Trigger the download
  document.body.appendChild(link);  // Add link to page
  link.click();                     // Simulate clicking the link
  document.body.removeChild(link);  // Remove link from page
  
  // Step 5: Clean up
  URL.revokeObjectURL(url);         // Free up memory
}
```

**Real-world example:**
```typescript
// 🟢 Complete CSV export flow
const csvData = `
Roll Number,Student Name,27/07/2025
1,"Alice Johnson","P"
2,"Bob Smith","A"
3,"Charlie Davis","P"
`;

const filename = generateCsvFilename("simple", "A", "2025-07-27");
downloadCsv(csvData, filename);

// Result: User's browser downloads "simple_A_2025-07-27.csv"
```

## 📝 Text and Validation Utilities

### 🟢 getLatestNote - The Note Retriever

**What it does**: Gets the most recent note from a student's notes array.

```typescript
// 🟢 Implementation
export function getLatestNote(notes: string[] | undefined): string | null {
  if (!notes || notes.length === 0) return null;
  return notes[notes.length - 1];  // Last item in array
}

// 🟢 Usage
const student = {
  notes: [
    "Needs extra help with math",
    "Improved behavior this week", 
    "Excellent participation today"
  ]
};

getLatestNote(student.notes);  // "Excellent participation today"
```

### 🟢 hasMultipleNotes - The Note Counter

**What it does**: Checks if a student has more than one note.

```typescript
// 🟢 Simple check
export function hasMultipleNotes(notes: string[] | undefined): boolean {
  return !!(notes && notes.length > 1);
}

// 🟢 Usage in UI
{hasMultipleNotes(student.notes) && (
  <Button>View All Notes ({student.notes.length})</Button>
)}
```

### 🟢 isValidEmail - The Email Validator

**What it does**: Checks if an email address looks valid.

```typescript
// 🟢 Email validation with regex
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🟢 Examples
isValidEmail("teacher@school.com")    // true
isValidEmail("invalid.email")         // false
isValidEmail("user@domain")           // false (no .com/.org/etc)
```

### 🟢 capitalizeWords - The Text Beautifier

**What it does**: Makes the first letter of each word uppercase.

```typescript
// 🟢 Implementation
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

// 🟢 Examples
capitalizeWords("john doe")           // "John Doe"
capitalizeWords("MARY SMITH")         // "MARY SMITH" (already caps)
capitalizeWords("alice in wonderland") // "Alice In Wonderland"
```

## 🔄 How Utils Are Used Throughout Stutra

### 🟢 In Components:
```typescript
// 🟢 StudentCard using multiple utils
function StudentCard({ student }) {
  const timeLeft = formatTimeRemaining(student.timer_end);
  const isPresent = isStudentPresent(student);
  const latestNote = getLatestNote(student.notes);
  
  return (
    <Card>
      <h3>{capitalizeWords(student.name)}</h3>
      {timeLeft && <p>Washroom: {timeLeft}</p>}
      {latestNote && <p>Note: {latestNote}</p>}
    </Card>
  );
}
```

### 🟢 In Services:
```typescript
// 🟢 GoogleSheets service using utils
async exportAttendance(date: string, section: string) {
  const csvContent = this.generateCsvContent(date, section);
  const filename = generateCsvFilename("simple", section, date);
  downloadCsv(csvContent, filename);
}
```

### 🟢 In Hooks:
```typescript
// 🟢 useStudents hook using utils
const updateStudentStatus = (studentId, status) => {
  const updates = {
    status,
    timer_end: status === 'washroom' ? createWashroomTimer() : null
  };
  
  googleSheetsService.updateStudent(studentId, updates);
};
```

## 🧪 Testing Utils

### 🟢 Why Test Utility Functions?

Utils are tested thoroughly because they're used everywhere. If a util function breaks, it can break multiple parts of the app.

```typescript
// 🟢 Example tests
describe('formatDateDDMMYYYY', () => {
  test('formats date correctly', () => {
    const date = new Date('2025-07-27');
    expect(formatDateDDMMYYYY(date)).toBe('27/07/2025');
  });
  
  test('handles invalid dates', () => {
    expect(formatDateDDMMYYYY('invalid')).toBe('Invalid Date');
  });
  
  test('handles different input types', () => {
    expect(formatDateDDMMYYYY('2025-07-27')).toBe('27/07/2025');    // String
    expect(formatDateDDMMYYYY(1722096000000)).toBe('27/07/2025');   // Timestamp
  });
});
```

## 🚀 Creating New Utils

### 🟢 When to Create a Utility Function

Create a util when you find yourself:
- **Writing the same code** in multiple places
- **Doing complex calculations** that could be simplified
- **Formatting data** in a consistent way
- **Validating input** with the same rules

### 🟢 Example: Creating a New Util

```typescript
// 🟢 New utility: Calculate attendance percentage
export function calculateAttendancePercentage(
  presentDays: number, 
  totalDays: number
): string {
  if (totalDays === 0) return '0%';
  
  const percentage = (presentDays / totalDays) * 100;
  return `${percentage.toFixed(1)}%`;  // One decimal place
}

// 🟢 Usage
calculateAttendancePercentage(18, 20);  // "90.0%"
calculateAttendancePercentage(0, 0);    // "0%"
```

### 🟢 Best Practices for Utils

1. **Pure functions** - Same input always gives same output
2. **No side effects** - Don't modify global variables or DOM
3. **Handle edge cases** - What if input is null/undefined/invalid?
4. **Good naming** - Function name clearly describes what it does
5. **Add documentation** - JSDoc comments for complex functions
6. **Write tests** - Especially for functions used frequently

## 📚 Utils Reference Quick Guide

### 📅 **Date & Time**
- `formatDateDDMMYYYY(date)` → "27/07/2025"
- `formatDateTimeDDMMYYYY(date)` → "27/07/2025, 10:30:45"  
- `getCurrentDateString()` → "2025-07-27"
- `createWashroomTimer()` → timestamp 12 minutes from now
- `formatTimeRemaining(timestamp)` → "5:42"

### 👥 **Student Operations**
- `isStudentPresent(student)` → true/false
- `getLatestNote(notes)` → "Most recent note" or null
- `hasMultipleNotes(notes)` → true/false

### 📄 **File Operations**
- `generateCsvFilename(type, section, date)` → "simple_A_2025-07-27.csv"
- `downloadCsv(content, filename)` → Downloads file

### ✅ **Validation**
- `isValidEmail(email)` → true/false
- `capitalizeWords(text)` → "Proper Case Text"

---

**Next Step**: Learn about [Types](./TYPES.md) to understand how TypeScript helps prevent bugs and makes code more reliable!
