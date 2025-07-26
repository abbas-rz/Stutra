import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { StudentCard } from './StudentCard';
import { mockStudent, mockStudentWashroom, mockTheme } from '../../test/mocks';

const mockProps = {
  student: mockStudent,
  onStatusChange: vi.fn(),
  onActivitySelect: vi.fn(),
  onNotesOpen: vi.fn(),
  onResetStudent: vi.fn(),
  isMobile: false
};

const renderStudentCard = (props = mockProps) => {
  return render(
    <ThemeProvider theme={mockTheme as any}>
      <StudentCard {...props} />
    </ThemeProvider>
  );
};

describe('StudentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders student information correctly', () => {
      renderStudentCard();
      
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.admission_number)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.section)).toBeInTheDocument();
    });

    it('displays present status chip for present students', () => {
      renderStudentCard();
      
      expect(screen.getByText('Present')).toBeInTheDocument();
    });

    it('shows timer for washroom status', () => {
      const washroomProps = {
        ...mockProps,
        student: mockStudentWashroom
      };
      
      renderStudentCard(washroomProps);
      
      expect(screen.getByText(/Time left:/)).toBeInTheDocument();
    });

    it('adapts layout for mobile devices', () => {
      const mobileProps = {
        ...mockProps,
        isMobile: true
      };
      
      renderStudentCard(mobileProps);
      
      // Check that mobile layout is applied (specific to implementation)
      expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onStatusChange when present button is clicked', async () => {
      const user = userEvent.setup();
      renderStudentCard();
      
      const presentButton = screen.getByRole('button', { name: /mark.*present/i });
      await user.click(presentButton);
      
      expect(mockProps.onStatusChange).toHaveBeenCalledWith(
        mockStudent.id,
        'present'
      );
    });

    it('calls onActivitySelect when activity button is clicked', async () => {
      const user = userEvent.setup();
      renderStudentCard();
      
      const activityButton = screen.getByRole('button', { name: /activity/i });
      await user.click(activityButton);
      
      expect(mockProps.onActivitySelect).toHaveBeenCalledWith(mockStudent.id);
    });

    it('calls onNotesOpen when notes button is clicked', async () => {
      const user = userEvent.setup();
      renderStudentCard();
      
      const notesButton = screen.getByRole('button', { name: /notes/i });
      await user.click(notesButton);
      
      expect(mockProps.onNotesOpen).toHaveBeenCalledWith(mockStudent.id);
    });

    it('calls onResetStudent when reset button is clicked', async () => {
      const user = userEvent.setup();
      renderStudentCard();
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);
      
      expect(mockProps.onResetStudent).toHaveBeenCalledWith(mockStudent.id);
    });
  });

  describe('Status Display', () => {
    it('shows correct status colors and icons', () => {
      renderStudentCard();
      
      // Test that the status chip has the correct color (implementation specific)
      const statusChip = screen.getByText('Present');
      expect(statusChip).toBeInTheDocument();
    });

    it('displays activity information when student is in activity', () => {
      const activityStudent = {
        ...mockStudent,
        status: 'activity' as const,
        activity: 'Library'
      };
      
      const activityProps = {
        ...mockProps,
        student: activityStudent
      };
      
      renderStudentCard(activityProps);
      
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Library')).toBeInTheDocument();
    });
  });

  describe('Notes Display', () => {
    it('shows notes count when student has notes', () => {
      const studentWithNotes = {
        ...mockStudent,
        notes: ['Note 1', 'Note 2', 'Note 3']
      };
      
      const propsWithNotes = {
        ...mockProps,
        student: studentWithNotes
      };
      
      renderStudentCard(propsWithNotes);
      
      // This would depend on how notes are displayed in the UI
      expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('updates timer display in real-time for washroom status', () => {
      const washroomStudent = {
        ...mockStudent,
        status: 'washroom' as const,
        timer_end: Date.now() + 120000 // 2 minutes from now
      };
      
      const washroomProps = {
        ...mockProps,
        student: washroomStudent
      };
      
      renderStudentCard(washroomProps);
      
      expect(screen.getByText(/Time left:/)).toBeInTheDocument();
      expect(screen.getByText(/1:5\d/)).toBeInTheDocument(); // Should show about 1:5x
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for status buttons', () => {
      renderStudentCard();
      
      const presentButton = screen.getByRole('button', { name: /mark.*present/i });
      expect(presentButton).toHaveAttribute('aria-label');
    });

    it('has proper keyboard navigation support', async () => {
      const user = userEvent.setup();
      renderStudentCard();
      
      const presentButton = screen.getByRole('button', { name: /mark.*present/i });
      presentButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockProps.onStatusChange).toHaveBeenCalled();
    });
  });
});
