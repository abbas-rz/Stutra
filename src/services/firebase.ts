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
   * Update student with attendance logging
   */
  async updateStudentWithLog(student: Student, previousStatus?: string): Promise<void> {
    await this.updateStudent(student);
    
    // Log the change if status changed
    if (previousStatus && previousStatus !== student.status) {
      await this.logAttendanceChange(student, previousStatus);
    }
  }

  /**
   * Log attendance change for audit trail
   */
  async logAttendanceChange(student: Student, previousStatus: string): Promise<void> {
    if (!this.initialized || !this.database) return;

    try {
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

      const logsRef = ref(this.database, `attendance_logs/${logEntry.id}`);
      await set(logsRef, logEntry);
    } catch (error) {
      console.error('Error logging attendance change:', error);
      // Don't throw error for logging failures
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
}

export const firebaseService = new FirebaseService();
