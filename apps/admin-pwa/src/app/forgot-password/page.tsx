'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-slate-700">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              If an account exists for <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>, a password reset link has been sent.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm"
            >
              Return to login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Mail className="w-6 h-6 text-blue-900 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
