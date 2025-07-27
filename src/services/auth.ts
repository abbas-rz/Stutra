import { getDatabase, ref, set, get, child, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import type { Teacher, LoginCredentials, CreateTeacherData } from '../types/auth';

/**
 * Firebase configuration for authentication service
 * Uses environment variables with fallback demo values for development
 */
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
 * Authentication service for managing teacher accounts and sessions.
 * 
 * This service handles:
 * - Teacher account creation and management
 * - Login/logout functionality with session persistence
 * - Password hashing and verification
 * - Permission-based access control
 * - Integration with Firebase Realtime Database
 * 
 * @class AuthService
 * @example
 * ```typescript
 * // Login a teacher
 * const teacher = await authService.login({
 *   email: 'teacher@school.com',
 *   password: 'password123'
 * });
 * 
 * // Check authentication status
 * if (authService.isAuthenticated()) {
 *   const currentTeacher = authService.getCurrentTeacher();
 * }
 * ```
 */
class AuthService {
  /** Firebase app instance for authentication */
  private app;
  
  /** Firebase Realtime Database instance */
  private database;
  
  /** Currently logged-in teacher (cached for performance) */
  private currentTeacher: Teacher | null = null;

  /**
   * Initialize the authentication service with Firebase configuration
   */
  constructor() {
    this.app = initializeApp(firebaseConfig, 'auth-app');
    this.database = getDatabase(this.app);
  }

  /**
   * Hash password using a simple base64 encoding with salt
   * 
   * @private
   * @param password - Plain text password to hash
   * @returns Hashed password string
   * 
   * @note In production, use a proper hashing library like bcrypt
   */
  private hashPassword(password: string): string {
    // This is a very basic hash - use proper hashing in production
    return btoa(password + 'salt_key_stutra');
  }

  /**
   * Verify a plain text password against a hashed password
   * 
   * @private
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns True if passwords match
   */
  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  /**
   * Create a new teacher account in the system
   * 
   * @param data - Teacher creation data including email, name, password, and sections
   * @returns Promise resolving to the created teacher (without password)
   * @throws Error if teacher with email already exists
   * @throws Error if required fields are missing
   * 
   * @example
   * ```typescript
   * const newTeacher = await authService.createTeacher({
   *   email: 'teacher@school.com',
   *   name: 'John Doe',
   *   password: 'securePassword',
   *   sections: ['XI-A', 'XI-B'],
   *   isAdmin: false
   * });
   * ```
   */
  async createTeacher(data: CreateTeacherData): Promise<Teacher> {
    try {
      // Validate required fields
      if (!data.email || !data.name || !data.password) {
        throw new Error('Email, name, and password are required');
      }

      // Check if teacher with email already exists
      const existingTeacher = await this.getTeacherByEmail(data.email);
      if (existingTeacher) {
        throw new Error('Teacher with this email already exists');
      }

      const teacherId = push(child(ref(this.database), 'teachers')).key!;
      const teacher: Teacher = {
        id: teacherId,
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        password: this.hashPassword(data.password),
        sections: data.sections || [], // Legacy field for backward compatibility
        assignedSections: data.assignedSections || data.sections || [], // New field
        isAdmin: data.isAdmin || false,
        createdAt: Date.now(),
      };

      await set(ref(this.database, `teachers/${teacherId}`), teacher);
      
      // Return teacher without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...teacherWithoutPassword } = teacher;
      return { ...teacherWithoutPassword, password: '' } as Teacher;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<Teacher> {
    try {
      const teacher = await this.getTeacherByEmail(credentials.email);
      
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      if (!this.verifyPassword(credentials.password, teacher.password)) {
        throw new Error('Invalid password');
      }

      // Update last login
      await set(ref(this.database, `teachers/${teacher.id}/lastLogin`), Date.now());
      
      this.currentTeacher = teacher;
      
      // Store in localStorage for persistence
      localStorage.setItem('stutra_teacher', JSON.stringify({
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        sections: teacher.sections || [], // Legacy compatibility
        assignedSections: teacher.assignedSections || teacher.sections || [], // New structure
        isAdmin: teacher.isAdmin,
      }));

      // Return teacher without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...teacherWithoutPassword } = teacher;
      return { ...teacherWithoutPassword, password: '' } as Teacher;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.currentTeacher = null;
    localStorage.removeItem('stutra_teacher');
  }

  getCurrentTeacher(): Teacher | null {
    if (this.currentTeacher) {
      return this.currentTeacher;
    }

    // Try to get from localStorage
    const stored = localStorage.getItem('stutra_teacher');
    if (stored) {
      try {
        const teacher = JSON.parse(stored);
        this.currentTeacher = teacher;
        return teacher;
      } catch (error) {
        console.error('Error parsing stored teacher data:', error);
        localStorage.removeItem('stutra_teacher');
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentTeacher() !== null;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | null> {
    try {
      const teachersRef = ref(this.database, 'teachers');
      const snapshot = await get(teachersRef);
      
      if (snapshot.exists()) {
        const teachers = snapshot.val();
        
        for (const teacherId in teachers) {
          const teacher = teachers[teacherId];
          if (teacher.email.toLowerCase() === email.toLowerCase()) {
            return { ...teacher, id: teacherId };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting teacher by email:', error);
      throw error;
    }
  }

  async getTeacherById(teacherId: string): Promise<Teacher | null> {
    try {
      const teacherRef = ref(this.database, `teachers/${teacherId}`);
      const snapshot = await get(teacherRef);
      
      if (snapshot.exists()) {
        const teacher = snapshot.val();
        return { ...teacher, id: teacherId };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting teacher by ID:', error);
      throw error;
    }
  }

  async getAllTeachers(): Promise<Teacher[]> {
    try {
      const teachersRef = ref(this.database, 'teachers');
      const snapshot = await get(teachersRef);
      
      if (snapshot.exists()) {
        const teachers = snapshot.val();
        return Object.entries(teachers).map(([id, teacher]) => ({
          ...(teacher as Teacher),
          id,
          password: '', // Don't return passwords
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting all teachers:', error);
      throw error;
    }
  }

  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<void> {
    try {
      if (updates.password) {
        updates.password = this.hashPassword(updates.password);
      }
      
      await set(ref(this.database, `teachers/${teacherId}`), updates);
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  }

  async deleteTeacher(teacherId: string): Promise<void> {
    try {
      await set(ref(this.database, `teachers/${teacherId}`), null);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  }

  // Create default admin account if no teachers exist
  async initializeDefaultAdmin(): Promise<void> {
    try {
      const teachers = await this.getAllTeachers();
      
      if (teachers.length === 0) {
        console.log('No teachers found, creating default admin...');
        await this.createTeacher({
          email: 'admin@stutra.com',
          name: 'Admin',
          password: 'admin123',
          assignedSections: [], // Admin can access all sections
          isAdmin: true,
        });
        console.log('Default admin created: admin@stutra.com / admin123');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  }

  async getLoggedInTeacherId(): Promise<string> {
    if (this.currentTeacher) {
      return this.currentTeacher.id;
    }
    
    // Try to get from localStorage
    const teacherData = localStorage.getItem('stutra_teacher');
    if (teacherData) {
      const teacher = JSON.parse(teacherData) as Teacher;
      this.currentTeacher = teacher;
      return teacher.id;
    }
    
    throw new Error('No teacher logged in');
  }

  async getSectionsForTeacher(teacherId: string): Promise<string[]> {
    try {
      const teacher = await this.getTeacherById(teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      // If admin, return all available sections
      if (teacher.isAdmin) {
        // Return all sections - in a real implementation, this would come from a sections table
        return ['XI-A', 'XI-B', 'XI-C', 'XI-D', 'XI-E', 'XI-F', 'XI-G', 'XI-H', 'XI-I', 'XI-J'];
      }
      
      return teacher.assignedSections || teacher.sections || [];
    } catch (error) {
      console.error('Error getting sections for teacher:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
