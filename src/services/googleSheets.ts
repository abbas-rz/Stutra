import { getDatabase, ref, set, get, child, type Database } from 'firebase/database';
import { initializeApp, type FirebaseApp } from 'firebase/app';

export interface Student {
  id: number;
  name: string;
  admission_number: string;
  photo_url: string;
  section: string;
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
        return Object.values(data) as Student[];
      } else {
        console.log('No students data found, initializing with XI Raman students');
        const students = this.getXIRamanStudents();
        await this.saveAllStudents(students);
        return students;
      }
    } catch (error) {
      console.error('Failed to fetch students from Firebase:', error);
      return this.getXIRamanStudents();
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

  async getStudentsBySection(section: string): Promise<Student[]> {
    const allStudents = await this.getStudents();
    return allStudents.filter(student => student.section === section);
  }

  async getSections(): Promise<string[]> {
    const allStudents = await this.getStudents();
    const sections = [...new Set(allStudents.map(student => student.section))];
    return sections.sort();
  }

  async resetAllStudents(): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const allStudents = await this.getStudents();
      const resetStudents = allStudents.map(student => ({
        ...student,
        status: 'present' as const,
        activity: '',
        timer_end: null,
        notes: []
      }));
      
      await this.saveAllStudents(resetStudents);
      console.log('All students reset successfully');
      return true;
    } catch (error) {
      console.error('Failed to reset students:', error);
      return false;
    }
  }

  async resetStudentsBySection(section: string): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const allStudents = await this.getStudents();
      const updatedStudents = allStudents.map(student => 
        student.section === section || section === 'All'
          ? { ...student, status: 'present' as const, activity: '', timer_end: null, notes: [] }
          : student
      );
      
      await this.saveAllStudents(updatedStudents);
      console.log(`Students in section ${section} reset successfully`);
      return true;
    } catch (error) {
      console.error('Failed to reset students by section:', error);
      return false;
    }
  }

  async resetIndividualStudent(studentId: number): Promise<boolean> {
    if (!this.initialized || !this.database) {
      console.warn('Firebase not initialized, changes not saved');
      return false;
    }

    try {
      const allStudents = await this.getStudents();
      const studentToReset = allStudents.find(s => s.id === studentId);
      
      if (studentToReset) {
        const resetStudent = {
          ...studentToReset,
          status: 'present' as const,
          activity: '',
          timer_end: null,
          notes: []
        };
        
        await this.updateStudent(resetStudent);
        console.log(`Student ${studentToReset.name} reset successfully`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reset individual student:', error);
      return false;
    }
  }

  private getXIRamanStudents(): Student[] {
    return [
      { id: 1, name: "Aadit Kumar", admission_number: "3924", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 2, name: "Abbas Raza", admission_number: "4382", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 3, name: "Abhi Chandhok", admission_number: "7919", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 4, name: "Abhiraj Kaushik", admission_number: "4698", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 5, name: "Aditya Arora", admission_number: "6337", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 6, name: "Amna Anwar", admission_number: "4319", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 7, name: "Anika Dhar", admission_number: "4459", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 8, name: "Anika Kumar", admission_number: "5883", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 9, name: "Chaitanya Chhajer", admission_number: "9543", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 10, name: "Elisha Arya", admission_number: "10478", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 11, name: "Hari Lal Vadhvani", admission_number: "4412", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 12, name: "Jay Joshi", admission_number: "4701", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 13, name: "Jinanssh Jain", admission_number: "4307", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 14, name: "Kavya Sharma", admission_number: "4408", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 15, name: "Maanvardhan Sharma", admission_number: "4425", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 16, name: "Moksh Bisht", admission_number: "4447", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 17, name: "Myra Trivedi", admission_number: "5967", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 18, name: "Naman Goyal", admission_number: "11565", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 19, name: "Nia Narang", admission_number: "4455", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 20, name: "Ojjas Ajay Purushottam", admission_number: "7973", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 21, name: "Prateek Singh Sandhu", admission_number: "10176", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 22, name: "Raghav Srivastava", admission_number: "6313", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 23, name: "Sara Agarwal", admission_number: "3869", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 24, name: "Seerat Kaurdara", admission_number: "4376", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 25, name: "Shirin Kaur Chahal", admission_number: "4445", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 26, name: "Swarit Acharya", admission_number: "10321", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 27, name: "Tanisha Garg", admission_number: "4352", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 28, name: "Twisha Bansal", admission_number: "4397", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 29, name: "Vanshika Himanshu Dhapola", admission_number: "9623", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 30, name: "Vidhi Sharma", admission_number: "11566", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
      { id: 31, name: "Vihaan Verma", admission_number: "4491", photo_url: "", section: "XI Raman", status: "present", activity: "", timer_end: null, notes: [] },
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();
