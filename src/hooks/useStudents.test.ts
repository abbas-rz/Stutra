import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';
import * as firebaseService from '../services/firebase';
import { mockStudents } from '../test/mocks';

// Mock the firebaseService
vi.mock('../services/firebase', () => ({
  firebaseService: {
    initialize: vi.fn(),
    getStudents: vi.fn(),
    updateStudentStatus: vi.fn(),
    resetStudent: vi.fn(),
    addNote: vi.fn(),
    deleteNote: vi.fn()
  }
}));

describe('useStudents', () => {
  const mockFirebaseService = firebaseService.firebaseService as {
    initialize: ReturnType<typeof vi.fn>;
    getStudents: ReturnType<typeof vi.fn>;
    updateStudentStatus: ReturnType<typeof vi.fn>;
    resetStudent: ReturnType<typeof vi.fn>;
    addNote: ReturnType<typeof vi.fn>;
    deleteNote: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirebaseService.initialize.mockResolvedValue(undefined);
    mockFirebaseService.getStudents.mockResolvedValue(mockStudents);
    mockFirebaseService.updateStudentStatus.mockResolvedValue(undefined);
    mockFirebaseService.resetStudent.mockResolvedValue(undefined);
    mockFirebaseService.addNote.mockResolvedValue(undefined);
    mockFirebaseService.deleteNote.mockResolvedValue(undefined);
  });

  describe('Initial State', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useStudents());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.students).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Loading Students', () => {
    it('loads students successfully on mount', async () => {
      const { result } = renderHook(() => useStudents());
      
      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockFirebaseService.initialize).toHaveBeenCalled();
      expect(mockFirebaseService.getStudents).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.students).toEqual(mockStudents);
      expect(result.current.error).toBe(null);
    });

    it('handles loading errors gracefully', async () => {
      const errorMessage = 'Failed to load students';
      mockFirebaseService.getStudents.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.students).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Student Operations', () => {
    it('updates student status', async () => {
      const { result } = renderHook(() => useStudents());
      
      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.updateStudentStatus(1, 'present');
      });
      
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalledWith(
        1, 'present', '', null
      );
    });

    it('updates student status with activity', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.updateStudentStatus(1, 'activity', 'Library');
      });
      
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalledWith(
        1, 'activity', 'Library', null
      );
    });

    it('updates student status with timer', async () => {
      const { result } = renderHook(() => useStudents());
      const timerEnd = Date.now() + 60000;
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.updateStudentStatus(1, 'washroom', '', timerEnd);
      });
      
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalledWith(
        1, 'washroom', '', timerEnd
      );
    });

    it('resets student status', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.resetStudent(1);
      });
      
      expect(mockFirebaseService.resetStudent).toHaveBeenCalledWith(1);
    });

    it('adds student note', async () => {
      const { result } = renderHook(() => useStudents());
      const note = 'Student was late today';
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.addStudentNote(1, note);
      });
      
      expect(mockFirebaseService.addNote).toHaveBeenCalledWith(1, note);
    });

    it('deletes student note', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.deleteStudentNote(1, 0);
      });
      
      expect(mockFirebaseService.deleteNote).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('Bulk Operations', () => {
    it('marks all students as present', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.markAllPresent();
      });
      
      // Should call updateStudentStatus for each student
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalledTimes(
        mockStudents.length
      );
    });

    it('marks students in specific section as present', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.markAllPresent('XI-A');
      });
      
      // Should only call updateStudentStatus for students in XI-A section
      const xiAStudents = mockStudents.filter(s => s.section === 'XI-A');
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalledTimes(
        xiAStudents.length
      );
    });
  });

  describe('Error Handling', () => {
    it('handles update student status errors', async () => {
      mockFirebaseService.updateStudentStatus.mockRejectedValue(
        new Error('Update failed')
      );
      
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.updateStudentStatus(1, 'present');
      });
      
      // Error should be handled gracefully (implementation specific)
      expect(mockFirebaseService.updateStudentStatus).toHaveBeenCalled();
    });

    it('handles reset student errors', async () => {
      mockFirebaseService.resetStudent.mockRejectedValue(
        new Error('Reset failed')
      );
      
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.resetStudent(1);
      });
      
      expect(mockFirebaseService.resetStudent).toHaveBeenCalled();
    });
  });

  describe('Data Refresh', () => {
    it('refreshes student data', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Clear previous calls
      mockFirebaseService.getStudents.mockClear();
      
      await act(async () => {
        await result.current.refreshStudents();
      });
      
      expect(mockFirebaseService.getStudents).toHaveBeenCalled();
    });
  });
});
