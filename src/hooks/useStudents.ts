import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { googleSheetsService } from '../services/googleSheets';
import { APP_CONFIG } from '../constants/index';

export interface UseStudentsResult {
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
  resetStudent: (studentId: number) => Promise<void>;
  addStudentNote: (studentId: number, note: string) => Promise<void>;
  deleteStudentNote: (studentId: number, noteIndex: number) => Promise<void>;
  markAllPresent: (section?: string) => Promise<void>;
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStudents = useCallback(async () => {
    try {
      setError(null);
      await googleSheetsService.initialize();
      const studentsData = await googleSheetsService.getStudents();
      setStudents(studentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudentStatus = useCallback(async (
    studentId: number,
    status: Student['status'],
    activity = '',
    timerEnd: number | null = null
  ) => {
    // Get previous status for logging
    const currentStudent = students.find(s => s.id === studentId);
    const previousStatus = currentStudent?.status;

    // Update local state immediately for instant feedback
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status, activity, timer_end: timerEnd }
        : student
    ));

    try {
      // Don't rely on the old students array - create the updated student object directly
      const currentStudent = students.find(s => s.id === studentId);
      if (currentStudent) {
        const studentToUpdate = { ...currentStudent, status, activity, timer_end: timerEnd };
        await googleSheetsService.updateStudentWithLog(studentToUpdate, previousStatus);
      }
    } catch (err) {
      console.error('Failed to update student in database:', err);
      // Revert local state on error
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const resetStudent = useCallback(async (studentId: number) => {
    try {
      // Update local state immediately
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, status: 'present' as const, activity: '', timer_end: null, notes: [] }
          : student
      ));
      
      // Use existing updateStudent method to reset the student
      const studentToReset = students.find(s => s.id === studentId);
      if (studentToReset) {
        const resetStudentData = { 
          ...studentToReset, 
          status: 'present' as const, 
          activity: '', 
          timer_end: null, 
          notes: [] 
        };
        await googleSheetsService.updateStudent(resetStudentData);
      }
    } catch (err) {
      console.error('Failed to reset student:', err);
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const addStudentNote = useCallback(async (studentId: number, note: string) => {
    // Update local state immediately
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, notes: [...(student.notes || []), note] }
        : student
    ));
    
    try {
      const updatedStudent = students.find(s => s.id === studentId);
      if (updatedStudent) {
        const studentToUpdate = { ...updatedStudent, notes: [...(updatedStudent.notes || []), note] };
        await googleSheetsService.updateStudent(studentToUpdate);
      }
    } catch (err) {
      console.error('Failed to update student notes:', err);
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const deleteStudentNote = useCallback(async (studentId: number, noteIndex: number) => {
    // Update local state immediately
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { 
            ...student, 
            notes: student.notes?.filter((_, index) => index !== noteIndex) || []
          }
        : student
    ));
    
    try {
      const updatedStudent = students.find(s => s.id === studentId);
      if (updatedStudent) {
        const studentToUpdate = { 
          ...updatedStudent, 
          notes: updatedStudent.notes?.filter((_, index) => index !== noteIndex) || []
        };
        await googleSheetsService.updateStudent(studentToUpdate);
      }
    } catch (err) {
      console.error('Failed to update student notes:', err);
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const markAllPresent = useCallback(async (section?: string) => {
    const studentsToUpdate = section && section !== 'All' 
      ? students.filter(student => student.section === section)
      : students;
      
    // Update local state immediately
    const updated = students.map(student => 
      studentsToUpdate.some(s => s.id === student.id)
        ? { ...student, status: 'present' as const, activity: '', timer_end: null }
        : student
    );
    
    setStudents(updated);
    
    try {
      const promises = studentsToUpdate.map(student => {
        const updatedStudent = { ...student, status: 'present' as const, activity: '', timer_end: null };
        return googleSheetsService.updateStudent(updatedStudent);
      });
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to update students:', err);
      await refreshStudents();
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
        const studentsData = await googleSheetsService.getStudents();
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
    resetStudent,
    addStudentNote,
    deleteStudentNote,
    markAllPresent,
  };
}
