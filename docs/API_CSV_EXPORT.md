# 🔧 CSV Export API Reference

## Service Methods

### GoogleSheetsService

#### `initialize(): Promise<void>`
Initializes the GoogleSheets service and underlying Firebase connection.

```typescript
await googleSheetsService.initialize();
```

**Returns**: Promise that resolves when service is ready
**Throws**: ServiceInitializationError if Firebase connection fails

#### `getAttendanceLogs(startDate?: string, endDate?: string, section?: string): Promise<AttendanceLog[]>`
Retrieves attendance logs with optional filtering.

```typescript
const logs = await googleSheetsService.getAttendanceLogs('2025-07-27', '2025-07-27');
```

**Parameters**:
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format  
- `section` (optional): Section filter (currently unused - filtering done at student level)

**Returns**: Array of AttendanceLog objects
**Throws**: FirebaseError if query fails

### FirebaseService

#### `getAttendanceLogs(startDate?: string, endDate?: string, section?: string): Promise<AttendanceLog[]>`
Core method for retrieving attendance logs from Firebase.

```typescript
const logs = await firebaseService.getAttendanceLogs('2025-07-27', '2025-07-27');
```

**Implementation Details**:
- Queries `attendance_logs` collection
- Filters by date range if provided
- Sorts by timestamp (newest first)
- Returns typed AttendanceLog objects

## Data Types

### AttendanceLog
```typescript
interface AttendanceLog {
  id: string;              // Unique log identifier
  student_id: number;      // Student's unique ID
  student_name: string;    // Student's display name
  status: string;          // 'present' | 'absent'
  date: string;           // Date in YYYY-MM-DD format
  timestamp: number;       // Unix timestamp
  section?: string;        // Optional section identifier
  teacher_id?: string;     // Optional teacher identifier
}
```

### Student (Extended for CSV)
```typescript
interface StudentWithRollNumber extends Student {
  sectionRollNumber: number;  // Generated roll number for CSV
}
```

## Helper Functions

### `filterStudentsBySection(students: Student[], section?: string): Student[]`
Filters student array by section with legacy compatibility.

```typescript
const filtered = filterStudentsBySection(students, 'Section A');
```

**Logic**:
- Returns all students if section is undefined or 'All'
- Checks both `student.sections[]` array and legacy `student.section` field
- Provides backward compatibility with old data structure

### `assignRollNumbers(students: Student[]): StudentWithRollNumber[]`
Sorts students alphabetically and assigns sequential roll numbers.

```typescript
const withRollNumbers = assignRollNumbers(students);
```

**Process**:
1. Sorts students by name (case-insensitive)
2. Assigns roll numbers starting from 1
3. Returns extended objects with `sectionRollNumber` property

### `getLatestStudentStatuses(logs: AttendanceLog[]): Map<number, string>`
Extracts the most recent status for each student from logs.

```typescript
const statusMap = getLatestStudentStatuses(logs);
```

**Algorithm**:
1. Sorts logs by timestamp (newest first)
2. Creates Map<student_id, status>
3. Only keeps first occurrence (latest) per student
4. Returns Map for O(1) status lookups

### `getAttendanceStatus(studentId: number, statusMap: Map<number, string>): string`
Converts internal status to CSV format (P/A).

```typescript
const csvStatus = getAttendanceStatus(studentId, statusMap);
```

**Logic**:
- Returns 'P' if logged status exists and is not 'absent'
- Returns 'A' for 'absent' status or no log entry
- Default behavior: absent if no attendance recorded

## CSV Export Workflow

### Single Date Export

```typescript
const exportSingleDateCSV = async (targetDate: string, section?: string): Promise<string>
```

**Process Flow**:
1. **Service Initialization**
   ```typescript
   await googleSheetsService.initialize();
   ```

2. **Student Filtering**
   ```typescript
   const studentsToExport = filterStudentsBySection(students, section);
   const studentsWithRollNumbers = assignRollNumbers(studentsToExport);
   ```

3. **Attendance Data Retrieval**
   ```typescript
   const logs = await googleSheetsService.getAttendanceLogs(targetDate, targetDate);
   const studentStatuses = getLatestStudentStatuses(logs);
   ```

4. **CSV Generation**
   ```typescript
   const headers = ['Student Name', 'Roll Number', formatDateDDMMYYYY(targetDate)];
   const rows = studentsWithRollNumbers.map(student => {
     const attendance = getAttendanceStatus(student.id, studentStatuses);
     return [student.name, student.sectionRollNumber.toString(), attendance];
   });
   ```

5. **CSV Formatting**
   ```typescript
   const csvContent = [headers, ...rows]
     .map(row => row.map(field => `"${field}"`).join(','))
     .join('\n');
   ```

### Multi-Date Export

```typescript
const exportMultiDateCSV = async (dateRange: string[], section?: string): Promise<string>
```

**Process Flow**:
1. **Service Initialization & Student Processing** (same as single date)

2. **Multi-Date Data Collection**
   ```typescript
   const attendanceByDate = new Map<string, Map<number, string>>();
   
   for (const date of dateRange) {
     const logs = await googleSheetsService.getAttendanceLogs(date, date);
     const studentStatuses = getLatestStudentStatuses(logs);
     attendanceByDate.set(date, studentStatuses);
   }
   ```

3. **Multi-Column CSV Generation**
   ```typescript
   const headers = ['Student Name', 'Roll Number', ...dateRange.map(formatDateDDMMYYYY)];
   const rows = studentsWithRollNumbers.map(student => {
     const dateColumns = dateRange.map(date => {
       const statusMap = attendanceByDate.get(date);
       return getAttendanceStatus(student.id, statusMap || new Map());
     });
     return [student.name, student.sectionRollNumber.toString(), ...dateColumns];
   });
   ```

## Error Handling

### Service Errors
```typescript
try {
  await googleSheetsService.initialize();
} catch (error) {
  console.error('Service initialization failed:', error);
  throw new Error('Failed to connect to database');
}
```

### Data Processing Errors
```typescript
try {
  const logs = await googleSheetsService.getAttendanceLogs(date, date);
  if (logs.length === 0) {
    console.warn('No attendance logs found for date:', date);
  }
} catch (error) {
  console.error('Failed to retrieve attendance logs:', error);
  throw error;
}
```

### CSV Generation Errors
```typescript
try {
  const csvContent = generateCSVContent(data);
  return csvContent;
} catch (error) {
  console.error('CSV generation failed:', error);
  throw new Error('Failed to generate CSV file');
}
```

## Debugging Features

### Console Logging Levels

#### Info Level
```typescript
console.log(`📊 Starting CSV export for ${targetDate} (Section: ${section || 'All'})`);
console.log(`📋 Exporting ${studentsWithRollNumbers.length} students`);
```

#### Success Level
```typescript
console.log('✅ CSV export completed successfully');
console.log(`📝 Found ${logs.length} attendance logs for ${targetDate}`);
```

#### Warning Level
```typescript
console.warn('⚠️ No attendance logs found in Firebase database');
```

#### Error Level
```typescript
console.error('❌ CSV export failed:', error);
```

## Performance Considerations

### Database Queries
- **Indexed Queries**: Date-based queries use indexed fields
- **Batch Processing**: Multiple dates processed sequentially to avoid rate limits
- **Memory Management**: Large result sets processed in chunks

### Data Processing
- **Map Lookups**: O(1) status lookups using Map data structure
- **Single Pass Filtering**: Students filtered once before processing
- **Minimal Object Creation**: Reuse objects where possible

### Network Optimization
- **Connection Reuse**: Firebase connection maintained across requests
- **Parallel Processing**: Independent date queries could be parallelized
- **Caching**: Service initialization cached until needed

## Rate Limiting

### Firebase Quotas
- **Read Operations**: Subject to Firebase read quotas
- **Concurrent Requests**: Limited concurrent connections
- **Batch Size**: Process large date ranges in smaller batches

### Mitigation Strategies
- **Request Throttling**: Add delays between requests if needed
- **Retry Logic**: Exponential backoff for failed requests
- **Progress Feedback**: User feedback during long operations

---

*API Reference last updated: July 27, 2025*
*Compatible with Firebase v9+ and React 18+*
