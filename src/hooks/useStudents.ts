import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types';
import { firebaseService } from '../services/firebase';
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
  markAllAbsent: (section?: string) => Promise<void>;
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStudents = useCallback(async () => {
    try {
      setError(null);
      await firebaseService.initialize();
      const studentsData = await firebaseService.getStudents();
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
    
    console.log(`🎯 updateStudentStatus called - Student ID: ${studentId}, Status: ${previousStatus} → ${status}`);

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
        console.log(`🔄 Calling firebaseService.updateStudentWithLog for ${currentStudent.name}`);
        await firebaseService.updateStudentWithLog(studentToUpdate, previousStatus);
        console.log(`✅ updateStudentWithLog completed for ${currentStudent.name}`);
      }
    } catch (err) {
      console.error('Failed to update student in database:', err);
      // Revert local state on error
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const resetStudent = useCallback(async (studentId: number) => {
    // Get previous status for logging
    const currentStudent = students.find(s => s.id === studentId);
    const previousStatus = currentStudent?.status;
    
    console.log(`🎯 resetStudent called - Student ID: ${studentId}, Previous status: ${previousStatus}`);

    try {
      // Update local state immediately
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, status: 'present' as const, activity: '', timer_end: null, notes: [] }
          : student
      ));
      
      // Use existing updateStudent method to reset the student with logging
      const studentToReset = students.find(s => s.id === studentId);
      if (studentToReset) {
        const resetStudentData = { 
          ...studentToReset, 
          status: 'present' as const, 
          activity: '', 
          timer_end: null, 
          notes: [] 
        };
        console.log(`🔄 Calling updateStudentWithLog for reset: ${studentToReset.name}`);
        // Use updateStudentWithLog to ensure the reset is logged for attendance export
        await firebaseService.updateStudentWithLog(resetStudentData, previousStatus);
        console.log(`✅ Reset completed for ${studentToReset.name}`);
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
        await firebaseService.updateStudent(studentToUpdate);
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
        await firebaseService.updateStudent(studentToUpdate);
      }
    } catch (err) {
      console.error('Failed to update student notes:', err);
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const markAllPresent = useCallback(async (section?: string) => {
    console.log(`🎯 markAllPresent called - Section: ${section || 'All'}`);
    
    const studentsToUpdate = section && section !== 'All' 
      ? students.filter(student => 
          student.sections.includes(section) || 
          student.section === section  // Legacy field compatibility
        )
      : students;
      
    console.log(`🎯 Students to mark present: ${studentsToUpdate.length}`);
    console.log(`🎯 Students:`, studentsToUpdate.map(s => `${s.name} (${s.status})`));
    
    // Capture previous statuses BEFORE updating local state
    const studentUpdates = studentsToUpdate.map(student => ({
      student,
      previousStatus: student.status,
      updatedStudent: { 
        ...student, 
        status: 'present' as const, 
        activity: '', 
        timer_end: null 
      }
    }));
      
    // Update local state immediately
    const updated = students.map(student => {
      const updateInfo = studentUpdates.find(u => u.student.id === student.id);
      return updateInfo ? updateInfo.updatedStudent : student;
    });
    
    setStudents(updated);
    
    try {
      // Use updateStudentWithLog for each student to ensure attendance logging
      console.log(`🔄 Starting updateStudentWithLog for ${studentsToUpdate.length} students`);
      const promises = studentUpdates.map(({ student, previousStatus, updatedStudent }) => {
        console.log(`🔄 Marking ${student.name} present (was ${previousStatus})`);
        
        // For "Mark All Present", we want to force logging even if status hasn't changed
        // This ensures teacher's explicit action is always recorded
        console.log(`🔄 Force logging for Mark All Present: ${student.name}`);
        return firebaseService.updateStudent(updatedStudent).then(async () => {
          // Always log the "Mark All Present" action regardless of previous status
          await firebaseService.logAttendanceChange(updatedStudent, previousStatus || 'unknown');
          console.log(`✅ Forced attendance log for ${student.name} in Mark All Present`);
        });
      });
      await Promise.all(promises);
      console.log(`✅ Mark all present completed for ${studentsToUpdate.length} students`);
    } catch (err) {
      console.error('Failed to update students:', err);
      await refreshStudents();
    }
  }, [students, refreshStudents]);

  const markAllAbsent = useCallback(async (section?: string) => {
    console.log(`🎯 markAllAbsent called - Section: ${section || 'All'}`);

    const studentsToUpdate = section && section !== 'All'
      ? students.filter(student =>
          student.sections.includes(section) ||
          student.section === section // Legacy field compatibility
        )
      : students;

    console.log(`🎯 Students to mark absent: ${studentsToUpdate.length}`);

    // Capture previous statuses BEFORE updating local state
    const studentUpdates = studentsToUpdate.map(student => ({
      student,
      previousStatus: student.status,
      updatedStudent: {
        ...student,
        status: 'absent' as const,
        activity: '',
        timer_end: null,
      }
    }));

    // Update local state immediately
    const updated = students.map(student => {
      const updateInfo = studentUpdates.find(u => u.student.id === student.id);
      return updateInfo ? updateInfo.updatedStudent : student;
    });
    setStudents(updated);

    try {
      console.log(`🔄 Starting updateStudentWithLog for ${studentsToUpdate.length} students (Absent)`);
      const promises = studentUpdates.map(({ student, previousStatus, updatedStudent }) => {
        console.log(`🔄 Marking ${student.name} absent (was ${previousStatus})`);
        // Force logging regardless of previous status similar to markAllPresent
        return firebaseService.updateStudent(updatedStudent).then(async () => {
          await firebaseService.logAttendanceChange(updatedStudent, previousStatus || 'unknown');
          console.log(`✅ Forced attendance log for ${student.name} in Mark All Absent`);
        });
      });

      await Promise.all(promises);
      console.log(`✅ Mark all absent completed for ${studentsToUpdate.length} students`);
    } catch (err) {
      console.error('Failed to update students (absent):', err);
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
        const studentsData = await firebaseService.getStudents();
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
    markAllAbsent,
  };
}
