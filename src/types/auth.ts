export interface Teacher {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  sections: string[]; // Array of section names the teacher can access
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
  sections: string[];
  isAdmin?: boolean;
}
