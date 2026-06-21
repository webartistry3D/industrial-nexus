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
    bg: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    iconText: 'text-white',
    border: 'border-blue-200/50 dark:border-blue-700/50',
    glow: 'shadow-blue-500/10 dark:shadow-blue-500/20',
  },
  green: {
    bg: 'from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10',
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    iconText: 'text-white',
    border: 'border-green-200/50 dark:border-green-700/50',
    glow: 'shadow-green-500/10 dark:shadow-green-500/20',
  },
  yellow: {
    bg: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    iconText: 'text-white',
    border: 'border-amber-200/50 dark:border-amber-700/50',
    glow: 'shadow-amber-500/10 dark:shadow-amber-500/20',
  },
  red: {
    bg: 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    iconText: 'text-white',
    border: 'border-red-200/50 dark:border-red-700/50',
    glow: 'shadow-red-500/10 dark:shadow-red-500/20',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    iconText: 'text-white',
    border: 'border-purple-200/50 dark:border-purple-700/50',
    glow: 'shadow-purple-500/10 dark:shadow-purple-500/20',
  },
};

export function StatCard({ icon: Icon, label, value, trend, color, onClick }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border ${colors.border} p-4 shadow-lg ${colors.glow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.iconText} shadow-md`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{trend}</span>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{value}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
