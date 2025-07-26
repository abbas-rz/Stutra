import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ val: () => null })),
  child: vi.fn(() => ({})),
  push: vi.fn(() => ({ key: 'mock-key' }))
}));

// Mock Material-UI useMediaQuery
vi.mock('@mui/material/useMediaQuery', () => ({
  default: vi.fn(() => false)
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Navigate: vi.fn(({ to }: { to: string }) => `Navigate to ${to}`)
  };
});

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// Global cleanup
afterEach(() => {
  vi.restoreAllMocks();
});
