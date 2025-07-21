import { getDatabase, ref, set, get, child, type Database } from 'firebase/database';
import { initializeApp, type FirebaseApp } from 'firebase/app';

export interface Student {
  id: number;
  name: string;
  admission_number: string;
  photo_url: string;
  status: 'present' | 'absent' | 'washroom' | 'activity' | 'bunking';
  activity: string;
  timer_end: number | null;
  notes: string[];
}

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

  async getStudents(): Promise<Student[]> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, using mock data');
      return this.getMockStudents();
    }

    try {
      const dbRef = ref(this.database);
      const snapshot = await get(child(dbRef, 'students'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data) as Student[];
      } else {
        console.log('No students data found, using mock data');
        // Initialize with mock data
        const mockStudents = this.getMockStudents();
        await this.saveAllStudents(mockStudents);
        return mockStudents;
      }
    } catch (error) {
      console.error('Failed to fetch students from Firebase:', error);
      return this.getMockStudents();
    }
  }

  async updateStudent(student: Student): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const studentRef = ref(this.database, `students/${student.id}`);
      await set(studentRef, student);
      console.log(`Student ${student.name} updated successfully`);
      return true;
    } catch (error) {
      console.error('Failed to update student in Firebase:', error);
      return false;
    }
  }

  async saveAllStudents(students: Student[]): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const studentsRef = ref(this.database, 'students');
      const studentsData: { [key: number]: Student } = {};
      
      students.forEach(student => {
        studentsData[student.id] = student;
      });
      
      await set(studentsRef, studentsData);
      console.log('All students saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save students to Firebase:', error);
      return false;
    }
  }

  async addNoteToStudent(studentId: number, note: string): Promise<boolean> {
    console.log(`Adding note to student ${studentId}: ${note}`);
    return true;
  }

  private getMockStudents(): Student[] {
    return [
      { id: 1, name: "Aarav Sharma", admission_number: "2023001", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 2, name: "Diya Patel", admission_number: "2023002", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 3, name: "Arjun Singh", admission_number: "2023003", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 4, name: "Kavya Reddy", admission_number: "2023004", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 5, name: "Rohan Kumar", admission_number: "2023005", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 6, name: "Ananya Gupta", admission_number: "2023006", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 7, name: "Vihaan Joshi", admission_number: "2023007", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 8, name: "Ishaan Mehta", admission_number: "2023008", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 9, name: "Saanvi Agarwal", admission_number: "2023009", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 10, name: "Advik Bansal", admission_number: "2023010", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 11, name: "Myra Kapoor", admission_number: "2023011", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 12, name: "Kabir Malhotra", admission_number: "2023012", photo_url: "", status: "present", activity: "", timer_end: null, notes: [] },
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();
