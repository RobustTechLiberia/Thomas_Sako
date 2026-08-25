import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, setAuthToken } from '../api.js';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await auth.login(email, password);
      setAuthToken(response.token);
      onLoginSuccess();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.requestPasswordReset(resetEmail);
      setResetSent(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">Liberty</h1>
          <p className="text-center text-gray-600 mt-2">CMS Admin Dashboard</p>
        </div>

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="error-message text-center">{error}</p>}

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-700 text-sm mt-4 w-full text-center"
            >
              Forgot password?
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Enter your email to receive a password reset link.
              </p>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="error-message text-center">{error}</p>}
              {resetSent && (
                <p className="success-message text-center">Reset link sent! Check your email.</p>
              )}

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setResetEmail('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm mt-4 w-full text-center"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
