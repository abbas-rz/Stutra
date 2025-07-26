# Testing Guide

This document outlines the testing strategy, setup, and best practices for the Stutra application.

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Test Setup](#test-setup)
- [Testing Types](#testing-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock Strategies](#mock-strategies)
- [Coverage Guidelines](#coverage-guidelines)

## Testing Philosophy

Our testing approach follows the Testing Trophy methodology:
- **Unit Tests** (70%): Test individual functions and components
- **Integration Tests** (20%): Test component interactions
- **End-to-End Tests** (10%): Test complete user workflows

### Testing Principles
1. **Test Behavior, Not Implementation**: Focus on what users see and do
2. **Write Tests First**: Follow TDD when possible
3. **Keep Tests Simple**: Each test should verify one specific behavior
4. **Use Realistic Test Data**: Mirror production data patterns
5. **Mock External Dependencies**: Isolate the code under test

## Test Setup

### Dependencies
The application uses the following testing stack:
- **Vitest**: Fast test runner with Jest-compatible API
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Custom Jest matchers for DOM elements
- **User Event**: Simulate user interactions

### Configuration Files

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  child: vi.fn(),
  push: vi.fn()
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset console warnings/errors
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

## Testing Types

### 1. Unit Tests

Test individual components and utilities in isolation.

#### Example: Testing a Utility Function
```typescript
// src/utils/formatTime.test.ts
import { describe, it, expect } from 'vitest';
import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('formats seconds correctly', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('handles zero seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('handles large numbers', () => {
    expect(formatTime(3665)).toBe('61:05');
  });
});
```

#### Example: Testing a Component
```typescript
// src/components/StudentCard/StudentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentCard } from './StudentCard';
import { mockStudent } from '../../test/mocks';

const mockProps = {
  student: mockStudent,
  onStatusChange: vi.fn(),
  onActivitySelect: vi.fn(),
  onNotesOpen: vi.fn(),
  onResetStudent: vi.fn(),
  isMobile: false
};

describe('StudentCard', () => {
  it('renders student information', () => {
    render(<StudentCard {...mockProps} />);
    
    expect(screen.getByText(mockStudent.name)).toBeInTheDocument();
    expect(screen.getByText(mockStudent.admission_number)).toBeInTheDocument();
    expect(screen.getByText(mockStudent.section)).toBeInTheDocument();
  });

  it('calls onStatusChange when present button clicked', async () => {
    const user = userEvent.setup();
    render(<StudentCard {...mockProps} />);
    
    const presentButton = screen.getByRole('button', { name: /present/i });
    await user.click(presentButton);
    
    expect(mockProps.onStatusChange).toHaveBeenCalledWith(
      mockStudent.id,
      'present'
    );
  });

  it('shows timer for washroom status', () => {
    const washroomStudent = {
      ...mockStudent,
      status: 'washroom' as const,
      timer_end: Date.now() + 60000 // 1 minute from now
    };
    
    render(<StudentCard {...mockProps} student={washroomStudent} />);
    
    expect(screen.getByText(/Time left:/)).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Test how components work together.

#### Example: Testing App with Student Data
```typescript
// src/components/App/App.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import * as useStudentsHook from '../../hooks/useStudents';
import { mockStudents } from '../../test/mocks';

vi.mock('../../hooks/useStudents');
vi.mock('../../hooks/useStudentFilters');

describe('App Integration', () => {
  it('loads and displays students', async () => {
    vi.mocked(useStudentsHook.useStudents).mockReturnValue({
      students: mockStudents,
      loading: false,
      error: null,
      updateStudentStatus: vi.fn(),
      resetStudent: vi.fn(),
      addStudentNote: vi.fn(),
      deleteStudentNote: vi.fn(),
      markAllPresent: vi.fn(),
      refreshStudents: vi.fn()
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('📚 Stutra')).toBeInTheDocument();
    });
    
    // Should show student cards
    expect(screen.getByText(mockStudents[0].name)).toBeInTheDocument();
  });

  it('filters students by search term', async () => {
    const user = userEvent.setup();
    // Setup mocks and render App
    
    const searchInput = screen.getByPlaceholderText(/search students/i);
    await user.type(searchInput, 'John');
    
    // Verify filtered results
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
```

### 3. Hook Tests

Test custom hooks independently.

#### Example: Testing useStudents Hook
```typescript
// src/hooks/useStudents.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';
import * as googleSheetsService from '../services/googleSheets';

vi.mock('../services/googleSheets');

describe('useStudents', () => {
  it('loads students on mount', async () => {
    vi.mocked(googleSheetsService.googleSheetsService.getStudents)
      .mockResolvedValue(mockStudents);

    const { result } = renderHook(() => useStudents());
    
    // Initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.students).toEqual([]);
    
    // Wait for data to load
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.students).toEqual(mockStudents);
  });

  it('handles update student status', async () => {
    const mockUpdateStatus = vi.fn().mockResolvedValue(undefined);
    vi.mocked(googleSheetsService.googleSheetsService.updateStudentStatus)
      .mockImplementation(mockUpdateStatus);

    const { result } = renderHook(() => useStudents());
    
    await act(async () => {
      await result.current.updateStudentStatus(1, 'present');
    });
    
    expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'present', '', null);
  });
});
```

## Running Tests

### Command Line Interface

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test StudentCard.test.tsx

# Run tests matching pattern
npm run test --t="renders student"
```

### VS Code Integration

Install the Vitest extension for VS Code to:
- Run tests directly from the editor
- See test results inline
- Debug tests with breakpoints
- View coverage highlights

## Writing Tests

### Test Structure

Follow the AAA pattern:
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code under test
- **Assert**: Verify the expected outcome

```typescript
describe('Component/Function Name', () => {
  it('should do something specific', () => {
    // Arrange
    const mockData = createMockData();
    const mockFunction = vi.fn();
    
    // Act
    const result = functionUnderTest(mockData);
    
    // Assert
    expect(result).toBe(expectedValue);
    expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Test Naming Convention

- Use descriptive test names that explain the scenario
- Start with "should" or describe the expected behavior
- Include context when necessary

```typescript
// Good
it('should display error message when login fails')
it('marks student as present when present button is clicked')
it('shows loading spinner while fetching students')

// Bad
it('works correctly')
it('handles errors')
it('test login')
```

### Common Patterns

#### Testing Async Operations
```typescript
it('loads students from API', async () => {
  const mockStudents = [{ id: 1, name: 'John' }];
  vi.mocked(apiService.getStudents).mockResolvedValue(mockStudents);
  
  render(<StudentList />);
  
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

#### Testing User Interactions
```typescript
it('opens dialog when button clicked', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  const button = screen.getByRole('button', { name: /open dialog/i });
  await user.click(button);
  
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

#### Testing Form Submissions
```typescript
it('submits form with correct data', async () => {
  const user = userEvent.setup();
  const mockSubmit = vi.fn();
  
  render(<LoginForm onSubmit={mockSubmit} />);
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /login/i }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

## Mock Strategies

### Service Mocks

Create comprehensive mocks for external services:

```typescript
// src/test/mocks/services.ts
export const mockGoogleSheetsService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getStudents: vi.fn().mockResolvedValue([]),
  updateStudentStatus: vi.fn().mockResolvedValue(undefined),
  resetStudent: vi.fn().mockResolvedValue(undefined),
  addNote: vi.fn().mockResolvedValue(undefined),
  deleteNote: vi.fn().mockResolvedValue(undefined),
  exportToCsv: vi.fn().mockReturnValue('csv,data')
};

export const mockAuthService = {
  login: vi.fn().mockResolvedValue(mockTeacher),
  logout: vi.fn().mockResolvedValue(undefined),
  getCurrentTeacher: vi.fn().mockReturnValue(mockTeacher),
  isAuthenticated: vi.fn().mockReturnValue(true),
  createTeacher: vi.fn().mockResolvedValue(mockTeacher)
};
```

### Data Mocks

Create realistic test data:

```typescript
// src/test/mocks/data.ts
export const mockStudent = {
  id: 1,
  name: 'John Doe',
  admission_number: 'ST001',
  photo_url: 'https://example.com/photo.jpg',
  section: 'XI-A',
  status: 'present' as const,
  activity: '',
  timer_end: null,
  notes: ['Good student', 'Participates well'],
  lastResetDate: '2024-01-15'
};

export const mockStudents = [
  mockStudent,
  { ...mockStudent, id: 2, name: 'Jane Smith', status: 'absent' as const }
];

export const mockTeacher = {
  id: 'teacher1',
  email: 'teacher@school.com',
  name: 'John Teacher',
  password: '',
  sections: ['XI-A', 'XI-B'],
  isAdmin: false,
  createdAt: Date.now()
};
```

### Component Mocks

Mock complex child components:

```typescript
// Mock Material-UI components for simpler testing
vi.mock('@mui/material/Dialog', () => ({
  default: ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null
}));
```

## Coverage Guidelines

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Reports

Generate HTML coverage reports:
```bash
npm run test:coverage
open coverage/index.html
```

### What to Cover

#### High Priority
- Business logic functions
- Component rendering
- User interaction handlers
- Error handling paths
- API integration points

#### Medium Priority
- Edge cases
- Component prop variations
- Responsive behavior
- Form validation

#### Low Priority
- Third-party library wrappers
- Simple utility functions
- Styling-only components

### Excluding from Coverage

Use coverage comments for uncoverable code:
```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

## Best Practices

### Test Organization
1. **Group Related Tests**: Use `describe` blocks to organize tests
2. **One Assertion Per Test**: Keep tests focused and specific
3. **Clean Up**: Reset mocks and clean up after each test
4. **Use beforeEach/afterEach**: Set up common test scenarios

### Performance
1. **Mock Heavy Dependencies**: Don't test external libraries
2. **Use Shallow Rendering**: When deep rendering isn't needed
3. **Optimize Test Data**: Use minimal realistic data
4. **Parallel Execution**: Let Vitest run tests in parallel

### Debugging Tests
1. **Use screen.debug()**: Inspect rendered output
2. **Add console.log**: Temporary debugging (remove before commit)
3. **Use VS Code Debugger**: Set breakpoints in tests
4. **Test in Isolation**: Run single tests to focus debugging

### Common Pitfalls
1. **Testing Implementation Details**: Focus on user behavior
2. **Brittle Selectors**: Use semantic queries over specific classes
3. **Not Waiting for Async**: Always await async operations
4. **Forgetting to Mock**: Mock all external dependencies

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

This ensures all code changes are tested before merging to main branch.
