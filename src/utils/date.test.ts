import { describe, it, expect } from 'vitest';
import { formatDateDDMMYYYY, convertDateFormat, getCurrentDateDDMMYYYY } from './index';

describe('Date Formatting Functions', () => {
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
