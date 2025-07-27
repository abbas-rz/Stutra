import { formatDateDDMMYYYY } from '../utils';
import type { Student, AttendanceLog } from '../types';
import { firebaseService } from './firebase';

// Firebase configuration (replace with your own)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

class GoogleSheetsService {
  private app: FirebaseApp | null = null;
  private database: Database | null = null;
  private initialized = false;
  
  // Helper method to get current date in YYYY-MM-DD format
  private getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  
  // Check if a student needs daily reset
  private needsDailyReset(student: Student): boolean {
    const today = this.getCurrentDateString();
    return !student.lastResetDate || student.lastResetDate !== today;
  }
  
  // Reset a student to default daily state
  private resetStudentForNewDay(student: Student): Student {
    const today = this.getCurrentDateString();
    return {
      ...student,
      status: 'absent', // Default to absent at start of day
      activity: '',
      timer_end: null,
      notes: [], // Clear notes for new day
      lastResetDate: today,
    };
  }
  
  async initialize() {
    try {
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.database = getDatabase(this.app);
      this.initialized = true;
      
      console.log('Firebase initialized successfully');
      
      // Force update with new student data
      // await this.forceUpdateStudentData();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }

  async forceUpdateStudentData() {
    if (!this.initialized || !this.database) return;
    
    try {
      console.log('Force updating database with XI Raman students...');
      const students = this.getXIRamanStudents();
      await this.saveAllStudents(students);
      console.log('XI Raman students updated successfully in database');
    } catch (error) {
      console.error('Failed to force update students:', error);
    }
  }

  async getStudents(): Promise<Student[]> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, using fallback data');
      return this.getXIRamanStudents();
    }

    try {
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'students'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let students = Object.values(data) as Student[];
        
        // Check if any students need daily reset
        const studentsNeedingReset = students.filter(student => this.needsDailyReset(student));
        
        if (studentsNeedingReset.length > 0) {
          // Reset students for new day
          students = students.map(student => {
            if (this.needsDailyReset(student)) {
              return this.resetStudentForNewDay(student);
            }
            return student;
          });
          
          // Save the reset students back to database
          await this.saveAllStudents(students);
          
          // Log the daily reset
          await this.logDailyReset(studentsNeedingReset.length);
        }
        
        return students;
      } else {
        const students = this.getXIRamanStudents().map(student => this.resetStudentForNewDay(student));
        await this.saveAllStudents(students);
        return students;
      }
    } catch (error) {
      console.error('Failed to fetch students from Firebase:', error);
      return this.getXIRamanStudents();
    }
  }

  async updateStudentWithLog(student: Student, previousStatus?: string, loggedBy?: string): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('❌ Firebase not initialized, changes not saved');
      console.log('🔍 Firebase state:', { initialized: this.initialized, database: !!this.database });
      return false;
    }

    try {
      console.log(`🔄 Updating student ${student.name} (ID: ${student.id}): ${previousStatus} -> ${student.status}`);
      
      const studentRef = ref(this.database, `students/${student.id}`);
      await set(studentRef, student);
      
      // Log the attendance change
      const logResult = await this.logAttendance(student, previousStatus, loggedBy);
      console.log(`📝 Attendance log result for ${student.name}: ${logResult ? 'SUCCESS' : 'FAILED'}`);
      
      console.log(`✅ Student ${student.name} updated successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update student in Firebase:', error);
      return false;
    }
  }

  async updateStudent(student: Student): Promise<boolean> {
    return this.updateStudentWithLog(student);
  }

  async logAttendance(student: Student, previousStatus?: string, loggedBy?: string): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('❌ Firebase not initialized, attendance not logged');
      console.log('🔍 Log attendance - Firebase state:', { initialized: this.initialized, database: !!this.database });
      return false;
    }

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timestamp = now.getTime();
      
      const logId = `${student.id}_${timestamp}`;
      
      console.log(`📝 Creating attendance log - ID: ${logId}, Student: ${student.name} (${student.id}), Status: ${student.status}, Date: ${dateStr}`);
      
      // Create attendance log with proper null/undefined handling
      const attendanceLog: AttendanceLog = {
        id: logId,
        student_id: student.id,
        student_name: student.name,
        admission_number: student.admission_number,
        section: student.section || (student.sections && student.sections[0]) || 'Unknown',
        date: dateStr,
        timestamp: timestamp,
        status: student.status,
        logged_by: loggedBy || 'system'
      };

      // Only add activity if it exists and is not empty
      if (student.activity && student.activity.trim() !== '') {
        attendanceLog.activity = student.activity;
      }

      // Only add notes if they exist
      if (student.notes && student.notes.length > 0 && student.notes[student.notes.length - 1]) {
        attendanceLog.notes = student.notes[student.notes.length - 1];
      }

      // Calculate duration for washroom/activity if returning to present
      if (previousStatus && (previousStatus === 'washroom' || previousStatus === 'activity') && student.status === 'present') {
        try {
          // Try to find the last log entry for this student with the previous status
          const logsRef = ref(this.database, 'attendance_logs');
          const snapshot = await get(logsRef);
          if (snapshot.exists()) {
            const logs = Object.values(snapshot.val()) as AttendanceLog[];
            const lastLog = logs
              .filter(log => log.student_id === student.id && log.status === previousStatus)
              .sort((a, b) => b.timestamp - a.timestamp)[0];
            
            if (lastLog) {
              const durationMinutes = Math.round((timestamp - lastLog.timestamp) / (1000 * 60));
              if (durationMinutes > 0) {
                attendanceLog.duration_minutes = durationMinutes;
              }
            }
          }
        } catch (durationError) {
          console.warn('Could not calculate duration:', durationError);
          // Continue without duration - don't let this break the logging
        }
      }

      const attendanceRef = ref(this.database, `attendance_logs/${logId}`);
      await set(attendanceRef, attendanceLog);
      
      console.log(`✅ Attendance logged successfully - ${student.name}: ${student.status} (Log ID: ${logId})`);
      console.log(`📊 Log data:`, attendanceLog);
      console.log(`🔍 Log saved to path: attendance_logs/${logId}`);
      console.log(`🗓️ Log date: ${attendanceLog.date}, Status: ${attendanceLog.status}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log attendance:', error);
      return false;
    }
  }

  async logDailyReset(studentCount: number): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, daily reset not logged');
      return false;
    }

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timestamp = now.getTime();
      
      const logId = `daily_reset_${dateStr}`;
      
      const resetLog = {
        id: logId,
        date: dateStr,
        timestamp: timestamp,
        type: 'daily_reset',
        students_affected: studentCount,
        logged_by: 'system',
        notes: `Daily reset: ${studentCount} students set to absent for new day`
      };

      const resetRef = ref(this.database, `system_logs/${logId}`);
      await set(resetRef, resetLog);
      
      console.log(`✅ Daily reset logged: ${studentCount} students reset for ${dateStr}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log daily reset:', error);
      return false;
    }
  }

  async getAttendanceLogs(startDate?: string, endDate?: string, section?: string): Promise<AttendanceLog[]> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized');
      return [];
    }

    try {
      console.log(`🔍 Fetching attendance logs - startDate: ${startDate}, endDate: ${endDate}, section: ${section}`);
      
      const logsRef = ref(this.database, 'attendance_logs');
      const snapshot = await get(logsRef);
      
      if (!snapshot.exists()) {
        console.log('❌ No attendance logs found in Firebase');
        return [];
      }

      let logs = Object.values(snapshot.val()) as AttendanceLog[];
      console.log(`📊 Total logs in Firebase: ${logs.length}`);
      
      // Filter by date range
      if (startDate) {
        const beforeFilter = logs.length;
        logs = logs.filter(log => {
          const logDate = log.date;
          const matchesDate = logDate >= startDate;
          return matchesDate;
        });
        console.log(`📅 After startDate filter (>= ${startDate}): ${logs.length} (was ${beforeFilter})`);
      }
      if (endDate) {
        const beforeFilter = logs.length;
        logs = logs.filter(log => {
          const logDate = log.date;
          const matchesDate = logDate <= endDate;
          return matchesDate;
        });
        console.log(`📅 After endDate filter (<= ${endDate}): ${logs.length} (was ${beforeFilter})`);
      }
      
      // Filter by section
      if (section && section !== 'All') {
        const beforeFilter = logs.length;
        logs = logs.filter(log => log.section === section);
        console.log(`🏫 After section filter (${section}): ${logs.length} (was ${beforeFilter})`);
      }
      
      // Sort by timestamp (newest first)
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
      console.log(`✅ Returning ${sortedLogs.length} filtered and sorted logs`);
      return sortedLogs;
    } catch (error) {
      console.error('Failed to get attendance logs:', error);
      return [];
    }
  }

  async exportAttendanceToCSV(startDate?: string, endDate?: string, section?: string): Promise<string> {
    try {
      const logs = await this.getAttendanceLogs(startDate, endDate, section);
      
      if (logs.length === 0) {
        throw new Error('No attendance data found for the specified criteria');
      }

      // CSV headers - Customize these columns as needed
      const headers = [
        'Date',
        'Time',
        'Student Name',
        'Admission Number',
        'Section',
        'Status',
        'Activity',
        'Duration (minutes)',
        'Notes',
        'Logged By'
      ];

      // Convert logs to CSV rows
      const rows = logs.map(log => {
        const date = new Date(log.timestamp);
        return [
          log.date,
          date.toLocaleTimeString(),
          log.student_name,
          log.admission_number,
          log.section,
          log.status,
          log.activity || '',
          log.duration_minutes || '',
          log.notes || '',
          log.logged_by || 'system'
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export attendance to CSV:', error);
      throw error;
    }
  }


  // Simple daily attendance export with P/A format
  async exportSimpleAttendanceCSV(targetDate?: string, section?: string): Promise<string> {
    try {
      const students = await this.getStudents();
      const date = targetDate || new Date().toISOString().split('T')[0];
      
      // Filter by section if specified
      let studentsToExport = students;
      if (section && section !== 'All') {
        studentsToExport = students.filter(student => student.section === section);
      }

      // Sort students alphabetically by name
      studentsToExport.sort((a, b) => a.name.localeCompare(b.name));

      // Generate section-based roll numbers (starting from 1)
      const studentsWithRollNumbers = studentsToExport.map((student, index) => ({
        ...student,
        sectionRollNumber: index + 1
      }));

      // Get attendance logs for the target date
      const logs = await this.getAttendanceLogs(date, date, section);
      
      // Get the latest status for each student on this date
      const studentStatuses = new Map<number, string>();
      
      // Sort logs by timestamp (newest first) and process
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
      sortedLogs.forEach(log => {
        // Only set if we haven't seen this student yet (keeps the latest)
        if (!studentStatuses.has(log.student_id)) {
          studentStatuses.set(log.student_id, log.status);
        }
      });

      // Create CSV headers - customize column order here
      const headers = ['Roll Number', 'Student Name', formatDateDDMMYYYY(date)];

      // Convert students to CSV rows
      const rows = studentsWithRollNumbers.map(student => {
        // Get attendance from logs for this date, default to 'absent' if no log found (daily reset system)
        const loggedStatus = studentStatuses.get(student.id) || 'absent';
        const attendance = loggedStatus === 'absent' ? 'A' : 'P';
        
        return [
          student.sectionRollNumber.toString(),
          student.name,
          attendance
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export simple attendance to CSV:', error);
      throw error;
    }
  }

  // Export attendance for multiple dates
  async exportMultiDateAttendanceCSV(dateRange: string[], section?: string): Promise<string> {
    try {
      const students = await this.getStudents();
      
      // Filter by section if specified
      let studentsToExport = students;
      if (section && section !== 'All') {
        studentsToExport = students.filter(student => student.section === section);
      }

      // Sort students alphabetically by name
      studentsToExport.sort((a, b) => a.name.localeCompare(b.name));

      // Generate section-based roll numbers (starting from 1)
      const studentsWithRollNumbers = studentsToExport.map((student, index) => ({
        ...student,
        sectionRollNumber: index + 1
      }));

      // Create CSV headers - student info + date columns  
      const headers = ['Roll Number','Student Name',  ...dateRange.map(date => formatDateDDMMYYYY(date))];

      // Get attendance data for each date
      const attendanceByDate = new Map<string, Map<number, string>>();
      
      for (const date of dateRange) {
        const logs = await this.getAttendanceLogs(date, date, section);
        const studentStatuses = new Map<number, string>();
        
        // Sort logs by timestamp (newest first) and get latest status per student
        const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
        sortedLogs.forEach(log => {
          // Only set if we haven't seen this student yet (keeps the latest)
          if (!studentStatuses.has(log.student_id)) {
            studentStatuses.set(log.student_id, log.status);
          }
        });
        
        attendanceByDate.set(date, studentStatuses);
      }

      // Create rows with attendance for each date
      const rows = studentsWithRollNumbers.map(student => {
        const dateColumns = dateRange.map(date => {
          const statusMap = attendanceByDate.get(date);
          const loggedStatus = statusMap?.get(student.id) || 'absent'; // Default to absent with daily reset system
          return loggedStatus === 'absent' ? 'A' : 'P';
        });
        
        return [
          student.sectionRollNumber.toString(),
          student.name,
          ...dateColumns
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export multi-date attendance to CSV:', error);
      throw error;
    }
  }

  async getDailySummary(date: string, section?: string): Promise<{
    total: number;
    present: number;
    absent: number;
    washroom: number;
    activity: number;
    bunking: number;
  }> {
    try {
      // Get all students for the section
      const students = await this.getStudents();
      let studentsInSection = students;
      if (section && section !== 'All') {
        studentsInSection = students.filter(student => student.section === section);
      }

      // Get attendance logs for the target date
      const logs = await this.getAttendanceLogs(date, date, section);
      
      // Get the latest status for each student on this date
      const studentStatuses = new Map<number, string>();
      
      // Sort logs by timestamp (newest first) and process
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
      sortedLogs.forEach(log => {
        // Only set if we haven't seen this student yet (keeps the latest)
        if (!studentStatuses.has(log.student_id)) {
          studentStatuses.set(log.student_id, log.status);
        }
      });

      const statusCounts = {
        total: studentsInSection.length,
        present: 0,
        absent: 0,
        washroom: 0,
        activity: 0,
        bunking: 0
      };

      // Count statuses for all students in section
      studentsInSection.forEach(student => {
        const status = studentStatuses.get(student.id) || 'absent'; // Default to absent with daily reset system
        statusCounts[status as keyof typeof statusCounts]++;
      });

      return statusCounts;
    } catch (error) {
      console.error('Failed to get daily summary:', error);
      return { total: 0, present: 0, absent: 0, washroom: 0, activity: 0, bunking: 0 };
    }
  }

  private getXIRamanStudents(): Student[] {
    return [
      { id: 1, name: 'Student A', admission_number: 'A001', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 2, name: 'Student B', admission_number: 'A002', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 3, name: 'Student C', admission_number: 'A003', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 4, name: 'Student D', admission_number: 'A004', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 5, name: 'Student E', admission_number: 'A005', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 6, name: 'Student F', admission_number: 'A006', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 7, name: 'Student G', admission_number: 'A007', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 8, name: 'Student H', admission_number: 'A008', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 9, name: 'Student I', admission_number: 'A009', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] },
      { id: 10, name: 'Student J', admission_number: 'A010', photo_url: '', sections: ['XI Raman'], section: 'XI Raman', status: 'present', activity: '', timer_end: null, notes: [] }
    ];
  }

  async saveAllStudents(students: Student[]): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      // Fix: Ensure IDs are strings for sorting
      students.sort((a, b) => a.id.toString().localeCompare(b.id.toString()));

      // Fix: Use object type for sectionsData
      const sectionsData: { [key: string]: { [key: string]: Student } } = {};
      students.forEach(student => {
        const primarySection = student.section || (student.sections && student.sections[0]) || 'Unknown';
        if (!sectionsData[primarySection]) {
          sectionsData[primarySection] = {};
        }
        sectionsData[primarySection][student.id.toString()] = student;
      });

      const sectionsRef = ref(this.database, 'sections');
      await set(sectionsRef, sectionsData);

      console.log('All students saved successfully, organized by sections');
      return true;
    } catch (error) {
      console.error('Failed to save students to Firebase:', error);
      return false;
    }
  }

  async initializeSections(sections: string[]): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const sectionsRef = ref(this.database, 'sections');
      const sectionsData: { [key: string]: object } = {};
      sections.forEach(section => {
        sectionsData[section] = {}; // Initialize empty section
      });

      await set(sectionsRef, sectionsData);
      console.log('Sections initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize sections in Firebase:', error);
      return false;
    }
  }

  async getSections(): Promise<string[]> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, using fallback data');
      return [];
    }

    try {
      const dbRef = ref(this.database, 'sections');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        return Object.keys(snapshot.val());
      } else {
        console.log('No sections data found');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch sections from Firebase:', error);
      return [];
    }
  }

  async resetIndividualStudent(studentId: number): Promise<void> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized');
      return;
    }

    try {
      const studentRef = ref(this.database, `students/${studentId}`);
      const snapshot = await get(studentRef);
      
      if (snapshot.exists()) {
        const student = snapshot.val() as Student;
        const resetStudent: Student = {
          ...student,
          status: 'present',
          activity: '',
          timer_end: null,
          notes: [],
          // Preserve lastResetDate during individual reset
          lastResetDate: student.lastResetDate || this.getCurrentDateString()
        };
        
        await set(studentRef, resetStudent);
        console.log(`Student ${studentId} reset successfully`);
      }
    } catch (error) {
      console.error('Failed to reset student:', error);
      throw error;
    }
  }

  async performManualDailyReset(): Promise<void> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized');
      return;
    }

    try {
      console.log('Performing manual daily reset for all students...');
      
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'students'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const students = Object.values(data) as Student[];
        
        // Reset all students for new day regardless of their lastResetDate
        const resetStudents = students.map(student => this.resetStudentForNewDay(student));
        
        // Save the reset students back to database
        await this.saveAllStudents(resetStudents);
        
        // Log the manual reset
        await this.logDailyReset(students.length);
        
        console.log(`Manual daily reset completed for ${students.length} students`);
      }
    } catch (error) {
      console.error('Failed to perform manual daily reset:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
