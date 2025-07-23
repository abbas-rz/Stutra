import type { Student } from '../types';
import { APP_CONFIG } from '../constants/index';

/**
 * Format time remaining for timer display
 */
export function formatTimeRemaining(timerEnd: number): string {
  const now = new Date().getTime();
  const distance = timerEnd - now;
  
  if (distance <= 0) return '';
  
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Create washroom timer end time
 */
export function createWashroomTimer(): number {
  return new Date().getTime() + (APP_CONFIG.WASHROOM_TIMER_MINUTES * 60 * 1000);
}

/**
 * Check if student is considered present (any status except absent)
 */
export function isStudentPresent(student: Student): boolean {
  return student.status !== 'absent';
}

/**
 * Generate filename for CSV export
 */
export function generateCsvFilename(
  type: string,
  section: string,
  startDate: string,
  endDate?: string
): string {
  const dateRange = endDate && endDate !== startDate 
    ? `${startDate}_to_${endDate}`
    : startDate;
  
  return `${type}_${section}_${dateRange}.csv`;
}

/**
 * Download CSV content as file
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get latest note from student notes array
 */
export function getLatestNote(notes: string[] | undefined): string | null {
  if (!notes || notes.length === 0) return null;
  return notes[notes.length - 1];
}

/**
 * Check if student has multiple notes
 */
export function hasMultipleNotes(notes: string[] | undefined): boolean {
  return !!(notes && notes.length > 1);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}
