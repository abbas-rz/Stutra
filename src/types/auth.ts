export interface Teacher {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  sections?: string[]; // Legacy field for backward compatibility
  assignedSections: string[]; // New field to match database structure
  isAdmin: boolean;
  createdAt: number;
  lastLogin?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  teacher: Teacher | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateTeacherData {
  email: string;
  name: string;
  password: string;
  sections?: string[]; // Legacy field for backward compatibility
  assignedSections: string[]; // New field to match database structure
  isAdmin?: boolean;
}
