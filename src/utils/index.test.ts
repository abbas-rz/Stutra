import { describe, it, expect } from 'vitest';
import { formatTimeRemaining, formatDateDDMMYYYY, convertDateFormat, getCurrentDateDDMMYYYY } from './index';

describe('Utility Functions', () => {
  describe('formatTimeRemaining', () => {
    it('formats time correctly for valid timer', () => {
      const futureTime = Date.now() + 65000; // 1 minute 5 seconds from now
      const result = formatTimeRemaining(futureTime);
      expect(result).toMatch(/1:0[45]/); // Should be around 1:04 or 1:05
    });

    it('returns "Expired" for past time', () => {
      const pastTime = Date.now() - 1000; // 1 second ago
      const result = formatTimeRemaining(pastTime);
      expect(result).toBe('Expired');
    });

    it('handles exactly zero time remaining', () => {
      const exactTime = Date.now();
      const result = formatTimeRemaining(exactTime);
      expect(['Expired', '0:00']).toContain(result);
    });
  });

  describe('formatDateDDMMYYYY', () => {
    it('formats date object correctly', () => {
      const date = new Date('2024-03-15');
      const result = formatDateDDMMYYYY(date);
      expect(result).toBe('15/03/2024');
    });

    it('formats date string correctly', () => {
      const result = formatDateDDMMYYYY('2024-12-25');
      expect(result).toBe('25/12/2024');
    });

    it('handles invalid dates', () => {
      const result = formatDateDDMMYYYY('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('convertDateFormat', () => {
    it('converts YYYY-MM-DD to dd/mm/yyyy', () => {
      const result = convertDateFormat('2024-07-26');
      expect(result).toBe('26/07/2024');
    });
  });

  describe('getCurrentDateDDMMYYYY', () => {
    it('returns current date in dd/mm/yyyy format', () => {
      const result = getCurrentDateDDMMYYYY();
      // Check that it matches the pattern dd/mm/yyyy
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });
});
      expect(result).toBe('Expired');
    });

    it('handles very large numbers', () => {
      const largeTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const result = formatTimeRemaining(largeTime);
      expect(result).toMatch(/\d+:\d{2}/);
    });

    it('handles negative time values', () => {
      const negativeTime = -1000;
      const result = formatTimeRemaining(negativeTime);
      expect(result).toBe('Expired');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined values gracefully', () => {
      expect(() => formatTimeRemaining(0)).not.toThrow();
    });
  });
});
