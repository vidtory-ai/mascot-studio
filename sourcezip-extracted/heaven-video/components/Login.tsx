

import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(username, password);
      onLoginSuccess(loggedInUser);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800 p-8 border border-slate-700 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            <i className="fas fa-film mr-2"></i>
            Welcome Back!
          </h1>
          <p className="text-gray-400 mb-6">Please log in to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g., a)"
                required
                className="w-full bg-slate-700 border border-slate-600 p-3 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (e.g., admin)"
                required
                className="w-full bg-slate-700 border border-slate-600 p-3 text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">Hint: Use `a`/`admin` or `demo-user`/`password123`.</p>
        </div>
      </div>
    </div>
  );
};
