// File: main.tsx (Entry Point)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // optional styling, reset, etc.
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { authService } from './services/auth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
      </Routes>
    </Router>
  </React.StrictMode>
);
