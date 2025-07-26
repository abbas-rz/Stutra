# Stutra - Student Tracker System

## 📚 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Components Guide](#components-guide)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

Stutra (Student Tracker) is a modern React-based web application designed to help teachers and school administrators efficiently track student attendance and activities in real-time. Built with TypeScript, Material-UI, and Firebase, it provides a clean, intuitive interface for managing classroom attendance.

### Key Features
- 📝 **Real-time Attendance Tracking**: Mark students as present, absent, or engaged in specific activities
- 🚽 **Washroom Management**: Time-limited washroom permissions with automatic tracking
- 📋 **Activity Monitoring**: Track students in library, medical, counseling, and other activities
- 📊 **Export Capabilities**: Generate CSV reports for attendance data
- 🔐 **Role-based Authentication**: Separate access levels for teachers, guards, and administrators
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Apple-inspired UI**: Modern, clean interface with smooth animations

## Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript
- **UI Framework**: Material-UI (MUI) v7
- **Routing**: React Router DOM v7
- **State Management**: React Hooks (useState, useEffect, custom hooks)
- **Backend**: Firebase Realtime Database
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── App/             # Main application component
│   ├── StudentCard/     # Individual student card
│   ├── ActivityDialog/  # Activity selection dialog
│   ├── NotesDialog/     # Student notes management
│   ├── auth/           # Authentication components
│   └── ProtectedRoute/ # Route protection
├── hooks/              # Custom React hooks
│   ├── useStudents.ts  # Student data management
│   └── useStudentFilters.ts # Search and filtering
├── services/           # External API services
│   ├── googleSheets.ts # Firebase integration
│   └── auth.ts        # Authentication service
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── utils/              # Utility functions
└── theme.tsx          # MUI theme configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Realtime Database enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd stutra
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:5173`

### First Time Setup

1. **Create Admin Account**: The system will automatically create a default admin account:
   - Email: `admin@stutra.com`
   - Password: `admin123`

2. **Add Teachers**: Use the register page to create teacher accounts with specific section access.

3. **Import Students**: Use the provided Python script in `/scripts` to bulk import student data.

## API Documentation

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed API documentation including:
- Firebase service methods
- Authentication endpoints
- Student data operations
- Error handling

## Components Guide

See [COMPONENTS.md](./COMPONENTS.md) for detailed component documentation including:
- Component hierarchy
- Props interfaces
- Usage examples
- Styling guidelines

## Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: End-to-end user workflow testing

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

## Contributing

### Development Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes:**
   - Write code following TypeScript best practices
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Changes:**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

4. **Submit Pull Request:**
   - Ensure all tests pass
   - Include description of changes
   - Reference any related issues

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code style
- **Prettier**: Code formatting
- **Testing**: Required for new features

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify environment variables are correct
   - Check Firebase project permissions
   - Ensure Realtime Database is enabled

2. **Authentication Problems**
   - Clear browser localStorage
   - Check teacher account exists in database
   - Verify password hashing consistency

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all imports are correct

### Support

For additional support, please:
1. Check existing issues in the repository
2. Create a new issue with detailed problem description
3. Include error messages and browser console logs

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
