import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';
import * as googleSheetsService from '../services/googleSheets';
import { mockStudents } from '../test/mocks';

// Mock the googleSheetsService
vi.mock('../services/googleSheets', () => ({
  googleSheetsService: {
    initialize: vi.fn(),
    getStudents: vi.fn(),
    updateStudentStatus: vi.fn(),
    resetStudent: vi.fn(),
    addNote: vi.fn(),
    deleteNote: vi.fn()
  }
}));

describe('useStudents', () => {
  const mockGoogleSheetsService = googleSheetsService.googleSheetsService as {
    initialize: ReturnType<typeof vi.fn>;
    getStudents: ReturnType<typeof vi.fn>;
    updateStudentStatus: ReturnType<typeof vi.fn>;
    resetStudent: ReturnType<typeof vi.fn>;
    addNote: ReturnType<typeof vi.fn>;
    deleteNote: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGoogleSheetsService.initialize.mockResolvedValue(undefined);
    mockGoogleSheetsService.getStudents.mockResolvedValue(mockStudents);
    mockGoogleSheetsService.updateStudentStatus.mockResolvedValue(undefined);
    mockGoogleSheetsService.resetStudent.mockResolvedValue(undefined);
    mockGoogleSheetsService.addNote.mockResolvedValue(undefined);
    mockGoogleSheetsService.deleteNote.mockResolvedValue(undefined);
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
      
      expect(mockGoogleSheetsService.initialize).toHaveBeenCalled();
      expect(mockGoogleSheetsService.getStudents).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.students).toEqual(mockStudents);
      expect(result.current.error).toBe(null);
    });

    it('handles loading errors gracefully', async () => {
      const errorMessage = 'Failed to load students';
      mockGoogleSheetsService.getStudents.mockRejectedValue(new Error(errorMessage));
      
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
      
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalledWith(
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
      
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalledWith(
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
      
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalledWith(
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
      
      expect(mockGoogleSheetsService.resetStudent).toHaveBeenCalledWith(1);
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
      
      expect(mockGoogleSheetsService.addNote).toHaveBeenCalledWith(1, note);
    });

    it('deletes student note', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.deleteStudentNote(1, 0);
      });
      
      expect(mockGoogleSheetsService.deleteNote).toHaveBeenCalledWith(1, 0);
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
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalledTimes(
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
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalledTimes(
        xiAStudents.length
      );
    });
  });

  describe('Error Handling', () => {
    it('handles update student status errors', async () => {
      mockGoogleSheetsService.updateStudentStatus.mockRejectedValue(
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
      expect(mockGoogleSheetsService.updateStudentStatus).toHaveBeenCalled();
    });

    it('handles reset student errors', async () => {
      mockGoogleSheetsService.resetStudent.mockRejectedValue(
        new Error('Reset failed')
      );
      
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      await act(async () => {
        await result.current.resetStudent(1);
      });
      
      expect(mockGoogleSheetsService.resetStudent).toHaveBeenCalled();
    });
  });

  describe('Data Refresh', () => {
    it('refreshes student data', async () => {
      const { result } = renderHook(() => useStudents());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Clear previous calls
      mockGoogleSheetsService.getStudents.mockClear();
      
      await act(async () => {
        await result.current.refreshStudents();
      });
      
      expect(mockGoogleSheetsService.getStudents).toHaveBeenCalled();
    });
  });
});
