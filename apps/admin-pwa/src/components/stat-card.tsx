import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

const baseClasses = 'relative overflow-hidden backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300';
const cursorClass = 'cursor-pointer';
const trendClasses = 'text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full ml-2';

export function StatCard({ icon: Icon, label, value, trend, color, onClick }: StatCardProps) {
  if (color === 'blue') {
    return (
      <div onClick={onClick} className={`${baseClasses} bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border border-blue-200/50 dark:border-blue-700/50 shadow-blue-500/10 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
            <Icon className="w-5 h-5" />
          </div>
          {trend && <span className={trendClasses}>{trend}</span>}
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
        </div>
      </div>
    );
  }
  if (color === 'green') {
    return (
      <div onClick={onClick} className={`${baseClasses} bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10 border border-green-200/50 dark:border-green-700/50 shadow-green-500/10 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
            <Icon className="w-5 h-5" />
          </div>
          {trend && <span className={trendClasses}>{trend}</span>}
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
        </div>
      </div>
    );
  }
  if (color === 'yellow') {
    return (
      <div onClick={onClick} className={`${baseClasses} bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 border border-amber-200/50 dark:border-amber-700/50 shadow-amber-500/10 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
            <Icon className="w-5 h-5" />
          </div>
          {trend && <span className={trendClasses}>{trend}</span>}
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
        </div>
      </div>
    );
  }
  if (color === 'red') {
    return (
      <div onClick={onClick} className={`${baseClasses} bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 shadow-red-500/10 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
            <Icon className="w-5 h-5" />
          </div>
          {trend && <span className={trendClasses}>{trend}</span>}
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} className={`${baseClasses} bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 border border-purple-200/50 dark:border-purple-700/50 shadow-purple-500/10 ${onClick ? cursorClass : ''}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
          <Icon className="w-5 h-5" />
        </div>
        {trend && <span className={trendClasses}>{trend}</span>}
      </div>
      <div className="mt-4 relative z-10">
        <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">{value}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
