import { getDatabase, ref, set, get, child, type Database } from 'firebase/database';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import type { Student, AttendanceLog } from '../types';
import { authService } from './auth';

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

/**
 * Enhanced Firebase service that supports the new multi-section database structure
 * and teacher access control.
 */
class FirebaseService {
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

  // Convert Firebase student data to frontend format with backward compatibility
  private adaptStudentData(firebaseData: Record<string, unknown>, studentId: string): Student {
    // Handle both old single-section and new multi-section formats
    let sections: string[] = [];
    
    if (Array.isArray(firebaseData.sections)) {
      // New multi-section format
      sections = firebaseData.sections as string[];
    } else if (typeof firebaseData.section === 'string') {
      // Old single-section format
      sections = [firebaseData.section];
    } else {
      // Fallback
      sections = ['Unknown'];
    }

    return {
      id: (() => {
        // Try to parse the studentId as a number
        const parsedId = parseInt(studentId);
        if (!isNaN(parsedId) && parsedId >= 0) {
          return parsedId;
        }
        
        // If studentId is not a valid number, try the id field from data
        if (typeof firebaseData.id === 'number') {
          return firebaseData.id;
        }
        
        if (typeof firebaseData.id === 'string') {
          const parsedDataId = parseInt(firebaseData.id);
          if (!isNaN(parsedDataId) && parsedDataId >= 0) {
            return parsedDataId;
          }
        }
        
        // Generate a consistent hash-based ID for non-numeric keys
        let hash = 0;
        const str = studentId;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
      })(),
      name: (typeof firebaseData.name === 'string' ? firebaseData.name : '') || '',
      admission_number: (typeof firebaseData.admissionNumber === 'string' ? firebaseData.admissionNumber : '') || 
                       (typeof firebaseData.admission_number === 'string' ? firebaseData.admission_number : '') || '',
      photo_url: (typeof firebaseData.photoUrl === 'string' ? firebaseData.photoUrl : '') || 
                 (typeof firebaseData.photo_url === 'string' ? firebaseData.photo_url : '') || '',
      sections: sections,
      section: sections[0], // For backward compatibility
      status: (firebaseData.status as Student['status']) || 'absent',
      activity: (typeof firebaseData.activity === 'string' ? firebaseData.activity : '') || '',
      timer_end: (typeof firebaseData.timer_end === 'number' ? firebaseData.timer_end : null),
      notes: Array.isArray(firebaseData.notes) ? firebaseData.notes as string[] : [],
      lastResetDate: (typeof firebaseData.lastResetDate === 'string' ? firebaseData.lastResetDate : '') || ''
    };
  }

  // Get teacher's accessible sections
  private getTeacherSections(): string[] {
    const teacher = authService.getCurrentTeacher();
    if (!teacher) return [];
    
    // Handle both old and new teacher data formats
    if (teacher.assignedSections && Array.isArray(teacher.assignedSections)) {
      return teacher.assignedSections;
    } else if (teacher.sections && Array.isArray(teacher.sections)) {
      // Legacy format
      return teacher.sections;
    }
    
    return [];
  }

  // Check if teacher can access a student
  private canAccessStudent(student: Student): boolean {
    const teacher = authService.getCurrentTeacher();
    if (!teacher) return false;
    
    // Admins can access all students
    if (teacher.isAdmin) return true;
    
    const teacherSections = this.getTeacherSections();
    if (teacherSections.length === 0) return false;
    
    // Check if student is in any of teacher's sections
    return student.sections.some(section => teacherSections.includes(section));
  }
  
  async initialize() {
    try {
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.database = getDatabase(this.app);
      this.initialized = true;
      
      console.log('Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }

  /**
   * Get all students accessible to the current teacher
   */
  async getStudents(): Promise<Student[]> {
    if (!this.initialized || !this.database) {
      throw new Error('Firebase not initialized');
    }

    try {
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'students'));
      
      if (!snapshot.exists()) {
        return [];
      }

      const studentsData = snapshot.val();
      const students: Student[] = [];

      // Handle both dictionary and array formats from Firebase
      if (Array.isArray(studentsData)) {
        // Array format
        studentsData.forEach((studentData, index) => {
          if (studentData) {
            const student = this.adaptStudentData(studentData, index.toString());
            if (this.canAccessStudent(student)) {
              students.push(this.needsDailyReset(student) ? this.resetStudentForNewDay(student) : student);
            }
          }
        });
      } else {
        // Dictionary format
        Object.entries(studentsData).forEach(([studentId, studentData]) => {
          if (studentData && typeof studentData === 'object') {
            const student = this.adaptStudentData(studentData as Record<string, unknown>, studentId);
            if (this.canAccessStudent(student)) {
              students.push(this.needsDailyReset(student) ? this.resetStudentForNewDay(student) : student);
            }
          }
        });
      }

      // Remove duplicates by ID and admission number, keeping the first occurrence
      const uniqueStudents = students.filter((student, index, self) => {
        return index === self.findIndex(s => s.id === student.id) &&
               index === self.findIndex(s => s.admission_number === student.admission_number);
      });

      return uniqueStudents.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  /**
   * Get all students without access control restrictions (for Guard Page)
   */
  async getAllStudents(): Promise<Student[]> {
    if (!this.initialized || !this.database) {
      throw new Error('Firebase not initialized');
    }

    try {
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'students'));
      
      if (!snapshot.exists()) {
        return [];
      }

      const studentsData = snapshot.val();
      const students: Student[] = [];

      // Handle both dictionary and array formats from Firebase
      if (Array.isArray(studentsData)) {
        // Array format
        studentsData.forEach((studentData, index) => {
          if (studentData) {
            const student = this.adaptStudentData(studentData, index.toString());
            students.push(this.needsDailyReset(student) ? this.resetStudentForNewDay(student) : student);
          }
        });
      } else {
        // Dictionary format
        Object.entries(studentsData).forEach(([studentId, studentData]) => {
          if (studentData && typeof studentData === 'object') {
            const student = this.adaptStudentData(studentData as Record<string, unknown>, studentId);
            students.push(this.needsDailyReset(student) ? this.resetStudentForNewDay(student) : student);
          }
        });
      }

      // Remove duplicates by ID and admission number, keeping the first occurrence
      const uniqueStudents = students.filter((student, index, self) => {
        return index === self.findIndex(s => s.id === student.id) &&
               index === self.findIndex(s => s.admission_number === student.admission_number);
      });

      return uniqueStudents.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  }

  /**
   * Update a student's status and activity
   */
  async updateStudentStatus(
    studentId: number,
    status: Student['status'],
    activity = '',
    timerEnd: number | null = null
  ): Promise<void> {
    if (!this.initialized || !this.database) {
      throw new Error('Firebase not initialized');
    }

    try {
      const studentRef = ref(this.database, `students/${studentId}`);
      const updates = {
        status,
        activity,
        timer_end: timerEnd,
        updatedAt: new Date().toISOString()
      };

      await set(studentRef, updates);
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  }

  /**
   * Update a complete student record
   */
  async updateStudent(student: Student): Promise<void> {
    if (!this.initialized || !this.database) {
      throw new Error('Firebase not initialized');
    }

    // Check if teacher can access this student
    if (!this.canAccessStudent(student)) {
      throw new Error('Access denied: You do not have permission to update this student');
    }

    try {
      const studentRef = ref(this.database, `students/${student.id}`);
      const studentData = {
        name: student.name,
        admissionNumber: student.admission_number,
        sections: student.sections,
        photoUrl: student.photo_url,
        status: student.status,
        activity: student.activity,
        timer_end: student.timer_end,
        notes: student.notes,
        lastResetDate: student.lastResetDate,
        updatedAt: new Date().toISOString()
      };

      await set(studentRef, studentData);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  /**
   * Update a complete student record without access control (for Guard Page)
   */
  async updateStudentWithoutAccessControl(student: Student): Promise<void> {
    if (!this.initialized || !this.database) {
      throw new Error('Firebase not initialized');
    }

    try {
      const studentRef = ref(this.database, `students/${student.id}`);
      const studentData = {
        name: student.name,
        admissionNumber: student.admission_number,
        sections: student.sections,
        photoUrl: student.photo_url,
        status: student.status,
        activity: student.activity,
        timer_end: student.timer_end,
        notes: student.notes,
        lastResetDate: student.lastResetDate,
        updatedAt: new Date().toISOString()
      };

      await set(studentRef, studentData);
    } catch (error) {
      console.error('Error updating student (without access control):', error);
      throw error;
    }
  }

  /**
   * Update student with attendance logging
   */
  async updateStudentWithLog(student: Student, previousStatus?: string): Promise<void> {
    console.log(`🔄 updateStudentWithLog called for ${student.name} (ID: ${student.id})`);
    console.log(`🔄 Previous status: ${previousStatus}, New status: ${student.status}`);
    
    await this.updateStudent(student);
    console.log(`✅ Student updated in database`);
    
    // Log the change if status changed
    if (previousStatus && previousStatus !== student.status) {
      console.log(`📝 Status changed detected - calling logAttendanceChange()`);
      await this.logAttendanceChange(student, previousStatus);
    } else {
      console.log(`⏭️ No status change detected - skipping attendance log`);
      console.log(`⏭️ Previous: "${previousStatus}", Current: "${student.status}"`);
    }
  }

  /**
   * Update student with attendance logging without access control (for Guard Page)
   */
  async updateStudentWithLogWithoutAccessControl(student: Student, previousStatus?: string): Promise<void> {
    console.log(`🔄 updateStudentWithLogWithoutAccessControl called for ${student.name} (ID: ${student.id})`);
    console.log(`🔄 Previous status: ${previousStatus}, New status: ${student.status}`);
    
    await this.updateStudentWithoutAccessControl(student);
    console.log(`✅ Student updated in database (without access control)`);
    
    // Log the change if status changed
    if (previousStatus && previousStatus !== student.status) {
      console.log(`📝 Status changed detected - calling logAttendanceChange()`);
      await this.logAttendanceChange(student, previousStatus);
    } else {
      console.log(`⏭️ No status change detected - skipping attendance log`);
      console.log(`⏭️ Previous: "${previousStatus}", Current: "${student.status}"`);
    }
  }

  /**
   * Log attendance change for audit trail
   */
  async logAttendanceChange(student: Student, previousStatus: string): Promise<void> {
    if (!this.initialized || !this.database) {
      console.warn('🚨 Firebase not initialized - cannot log attendance change');
      return;
    }

    try {
      console.log(`📝 LOGGING ATTENDANCE CHANGE: ${student.name} (ID: ${student.id})`);
      console.log(`📝 Status change: ${previousStatus} → ${student.status}`);
      
      const teacher = authService.getCurrentTeacher();
      const logEntry: AttendanceLog = {
        id: `${student.id}_${Date.now()}`,
        student_id: student.id,
        student_name: student.name,
        admission_number: student.admission_number,
        section: student.sections[0] || 'Unknown',
        date: this.getCurrentDateString(),
        timestamp: Date.now(),
        status: student.status,
        activity: student.activity,
        logged_by: teacher?.email || 'Unknown',
        notes: `Status changed from ${previousStatus} to ${student.status}`
      };

      console.log(`📝 Log entry created:`, {
        id: logEntry.id,
        student: logEntry.student_name,
        date: logEntry.date,
        status: logEntry.status,
        section: logEntry.section
      });

      const logsRef = ref(this.database, `attendance_logs/${logEntry.id}`);
      await set(logsRef, logEntry);
      
      console.log(`✅ Attendance log saved successfully for ${student.name}`);
    } catch (error) {
      console.error('❌ Error logging attendance change:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get attendance logs for specified date range and section
   */
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
      
      // Show sample raw logs for debugging
      if (logs.length > 0) {
        console.log(`📋 Raw log samples:`, logs.slice(0, 5).map(log => ({
          student: log.student_name,
          date: log.date,
          status: log.status,
          section: log.section,
          timestamp: new Date(log.timestamp).toLocaleString()
        })));
        
        // Show all unique dates in logs
        const uniqueDates = [...new Set(logs.map(log => log.date))].sort();
        console.log(`📅 All unique dates in logs:`, uniqueDates);
        
        // Show date being searched for
        console.log(`🔍 Searching for startDate: '${startDate}', endDate: '${endDate}'`);
      }
      
      // Filter by date range
      if (startDate) {
        const beforeFilter = logs.length;
        logs = logs.filter(log => {
          const logDate = log.date;
          const matches = logDate >= startDate;
          if (!matches && logs.length < 10) { // Only log mismatches for first few to avoid spam
            console.log(`❌ Date mismatch: log date '${logDate}' vs startDate '${startDate}' (>=: ${matches})`);
          }
          return matches;
        });
        console.log(`📅 After startDate filter (>= ${startDate}): ${logs.length} (was ${beforeFilter})`);
        if (logs.length > 0) {
          console.log(`📅 Sample matching logs:`, logs.slice(0, 3).map(log => `${log.student_name}: ${log.date}`));
        }
      }
      
      if (endDate) {
        const beforeFilter = logs.length;
        logs = logs.filter(log => {
          const logDate = log.date;
          const matches = logDate <= endDate;
          if (!matches && logs.length < 10) { // Only log mismatches for first few to avoid spam
            console.log(`❌ Date mismatch: log date '${logDate}' vs endDate '${endDate}' (<=: ${matches})`);
          }
          return matches;
        });
        console.log(`📅 After endDate filter (<= ${endDate}): ${logs.length} (was ${beforeFilter})`);
        if (logs.length > 0) {
          console.log(`📅 Sample matching logs after endDate:`, logs.slice(0, 3).map(log => `${log.student_name}: ${log.date}`));
        }
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

  /**
   * Get all sections accessible to current teacher
   */
  async getSections(): Promise<string[]> {
    const teacher = authService.getCurrentTeacher();
    if (!teacher) return [];

    // If admin, get all sections from database
    if (teacher.isAdmin) {
      try {
        if (!this.initialized || !this.database) return [];
        
        const dbRef = ref(this.database);
        const snapshot = await get(child(dbRef, 'sections'));
        
        if (!snapshot.exists()) return [];
        
        const sectionsData = snapshot.val();
        const sections: string[] = [];
        
        Object.entries(sectionsData).forEach(([, sectionData]) => {
          if (sectionData && typeof sectionData === 'object' && 'name' in sectionData && typeof sectionData.name === 'string') {
            sections.push(sectionData.name);
          }
        });
        
        return sections.sort();
      } catch (error) {
        console.error('Error fetching sections:', error);
        return [];
      }
    }

    // For regular teachers, return their assigned sections
    return this.getTeacherSections();
  }

  /**
   * Get all available sections from the database (for registration and admin purposes)
   */
  async getAllSections(): Promise<string[]> {
    try {
      if (!this.initialized || !this.database) return [];
      
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'sections'));
      
      if (!snapshot.exists()) return [];
      
      const sectionsData = snapshot.val();
      const sections: string[] = [];
      
      Object.entries(sectionsData).forEach(([, sectionData]) => {
        if (sectionData && typeof sectionData === 'object' && 'name' in sectionData && typeof sectionData.name === 'string') {
          sections.push(sectionData.name);
        }
      });
      
      return sections.sort();
    } catch (error) {
      console.error('Error fetching all sections:', error);
      return [];
    }
  }

  /**
   * Export attendance data for current teacher's accessible students
   */
  async exportAttendanceCSV(): Promise<string> {
    const students = await this.getStudents();
    
    let csvContent = 'Name,Admission Number,Sections,Status,Activity,Last Updated\n';
    
    students.forEach(student => {
      const sectionsStr = student.sections.join('; ');
      csvContent += `"${student.name}","${student.admission_number}","${sectionsStr}","${student.status}","${student.activity}","${student.lastResetDate || 'N/A'}"\n`;
    });
    
    return csvContent;
  }

  // Force update student data with real data from the database
  async forceUpdateStudentData(): Promise<void> {
    if (!this.initialized || !this.database) return;

    try {
      console.log('Force updating database with real student data...');
      const students = await this.getStudents(); // Fetch real students from the database
      await this.saveAllStudents(students);
      console.log('Real student data updated successfully in the database');
    } catch (error) {
      console.error('Failed to force update students:', error);
    }
  }

  // Placeholder for saveAllStudents (migrated from googleSheets.old.ts)
  private async saveAllStudents(students: Student[]): Promise<void> {
    if (!this.database) return;

    const updates: Record<string, Student> = {};
    students.forEach(student => {
      updates[`students/${student.id}`] = student;
    });

    try {
      const dbRef = ref(this.database);
      await set(dbRef, updates);
    } catch (error) {
      console.error('Failed to save students:', error);
    }
  }
}

export const firebaseService = new FirebaseService();
