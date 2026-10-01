import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, quickDemoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await quickDemoLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to enter demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-canvas flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold mx-auto shadow-sm">
            <BookOpen className="w-6 h-6 text-stone-100" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            ResearchDesk
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Professional literature synthesis and academic intelligence workspace.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-6 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance"
                  className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-stone-200 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-stone-200 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-stone-700">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-stone-200 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Workspace' : 'Register & Enter'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="bg-white px-2 text-stone-400">Competition Evaluation</span>
            </div>
          </div>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-md border border-stone-200 bg-stone-50/70 text-stone-800 text-xs font-medium hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-600" />
            <span>1-Click Demo Researcher Access</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="text-center text-[11px] text-stone-400 space-y-1">
          <p>Secure Azure Blob Storage · PostgreSQL Metadata · Verified Page Citations</p>
        </div>
      </div>
    </div>
  );
};
