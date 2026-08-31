import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, removeAuthToken } from './api.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PollQuestions from './pages/PollQuestions.jsx';
import PollQuestionForm from './pages/PollQuestionForm.jsx';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default function App() {
  const [authToken, setAuthToken] = useState(isAuthenticated());

  useEffect(() => {
    // Check token on mount
    setAuthToken(isAuthenticated());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setAuthToken(false);
  };

  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={() => setAuthToken(true)} />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout onLogout={handleLogout}>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/polls"
          element={
            <ProtectedRoute>
              <DashboardLayout onLogout={handleLogout}>
                <PollQuestions />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/polls/new"
          element={
            <ProtectedRoute>
              <DashboardLayout onLogout={handleLogout}>
                <PollQuestionForm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/polls/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout onLogout={handleLogout}>
                <PollQuestionForm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
