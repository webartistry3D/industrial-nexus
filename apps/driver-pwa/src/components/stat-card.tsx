import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'dark:bg-blue-900',
    iconBg: 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black',
    iconText: '',
    border: 'border-gray-200 dark:border-slate-700',
    glow: '',
  },
  green: {
    bg: 'dark:bg-blue-900',
    iconBg: 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black',
    iconText: '',
    border: 'border-gray-200 dark:border-slate-700',
    glow: '',
  },
  yellow: {
    bg: 'dark:bg-blue-900',
    iconBg: 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black',
    iconText: '',
    border: 'border-gray-200 dark:border-slate-700',
    glow: '',
  },
  red: {
    bg: 'dark:bg-blue-900',
    iconBg: 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black',
    iconText: '',
    border: 'border-gray-200 dark:border-slate-700',
    glow: '',
  },
  purple: {
    bg: 'dark:bg-blue-900',
    iconBg: 'bg-blue-600 text-white dark:bg-lime-500 dark:text-black',
    iconText: '',
    border: 'border-gray-200 dark:border-slate-700',
    glow: '',
  },
};

export function StatCard({ icon: Icon, label, value, trend, color, onClick }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-900 backdrop-blur-sm rounded-xl border ${colors.border} p-4 shadow-lg ${colors.glow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.iconText} shadow-md`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full ml-2">{trend}</span>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{value}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
