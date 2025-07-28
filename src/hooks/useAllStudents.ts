import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { firebaseService } from '../services/firebase';
import { APP_CONFIG } from '../constants/index';

export interface UseAllStudentsResult {
  students: Student[];
  loading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
  updateStudentStatus: (
    studentId: number,
    status: Student['status'],
    activity?: string,
    timerEnd?: number | null
  ) => Promise<void>;
}

/**
 * Hook specifically for Guard Page - fetches all students without access control restrictions
 */
export function useAllStudents(): UseAllStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStudents = useCallback(async () => {
    try {
      setError(null);
      await firebaseService.initialize();
      const studentsData = await firebaseService.getAllStudents();
      setStudents(studentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update student status with special handling for guard page
  const updateStudentStatus = useCallback(async (
    studentId: number,
    status: Student['status'],
    activity = '',
    timerEnd: number | null = null
  ) => {
    // Get previous status for logging
    const currentStudent = students.find(s => s.id === studentId);
    const previousStatus = currentStudent?.status;
    
    console.log(`🎯 Guard updateStudentStatus called - Student ID: ${studentId}, Status: ${previousStatus} → ${status}`);

    // Update local state immediately for instant feedback
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status, activity, timer_end: timerEnd }
        : student
    ));

    try {
      // Create updated student object directly for the API call
      if (currentStudent) {
        const studentToUpdate = { ...currentStudent, status, activity, timer_end: timerEnd };
        console.log(`🔄 Calling firebaseService.updateStudentWithLogWithoutAccessControl for ${currentStudent.name} (Guard Page)`);
        await firebaseService.updateStudentWithLogWithoutAccessControl(studentToUpdate, previousStatus);
        console.log(`✅ updateStudentWithLogWithoutAccessControl completed for ${currentStudent.name} (Guard Page)`);
      }
    } catch (err) {
      console.error('Failed to update student in database:', err);
      // Revert local state on error
      await refreshStudents();
      throw err; // Re-throw to allow error handling in the component
    }
  }, [students, refreshStudents]);

  // Initial load
  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const studentsData = await firebaseService.getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        console.error('Failed to refresh students data:', err);
      }
    }, APP_CONFIG.REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    students,
    loading,
    error,
    refreshStudents,
    updateStudentStatus,
  };
}
