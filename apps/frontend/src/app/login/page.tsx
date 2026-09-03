'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, Eye, EyeOff, Shield, Building2, Truck } from 'lucide-react';

type RoleChoice = 'admin' | 'client' | 'driver';

const roleConfig: Record<RoleChoice, {
  label: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
  redirect: string;
  allowedRoles: string[];
}> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'text-blue-900 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
    redirect: '/admin/dashboard',
    allowedRoles: ['SUPER_ADMIN', 'OPERATIONS'],
  },
  client: {
    label: 'Client',
    icon: Building2,
    color: 'text-green-900 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500',
    redirect: '/client/dashboard',
    allowedRoles: ['CLIENT'],
  },
  driver: {
    label: 'Driver',
    icon: Truck,
    color: 'text-amber-900 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-500',
    redirect: '/driver/dashboard',
    allowedRoles: ['DRIVER'],
  },
};

export default function Login() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = savedTheme === 'dark';
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
    setIsDark(prefersDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const [selectedRole, setSelectedRole] = useState<RoleChoice>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      const config = roleConfig[selectedRole];

      if (!config.allowedRoles.includes(user.role)) {
        const correctRole = Object.values(roleConfig).find(r => r.allowedRoles.includes(user.role));
        if (correctRole) {
          router.push(correctRole.redirect);
        } else {
          setError(`Access denied. Role "${user.role}" is not supported.`);
        }
        return;
      }

      router.push(config.redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-slate-700">
        {/* Theme Toggle */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-slate-700"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/icon.png" alt="Industrial Nexus" className="w-16 h-16 rounded-2xl mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Industrial Nexus</h1>
          <p className="text-gray-600 dark:text-gray-400">Logistics Operations Platform</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
            Select your role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(roleConfig) as RoleChoice[]).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setError(''); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? `${config.borderColor} ${config.bgColor} ring-2 ring-blue-500 ring-offset-1`
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? config.color : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className={`text-xs font-semibold ${isSelected ? config.color : 'text-gray-500 dark:text-gray-400'}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : `Sign In as ${roleConfig[selectedRole].label}`}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/forgot-password')}
            className="text-sm text-blue-700 dark:text-blue-400 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}
