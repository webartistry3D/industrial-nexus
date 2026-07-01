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
      <div onClick={onClick} className={`${baseClasses} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
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
      <div onClick={onClick} className={`${baseClasses} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
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
      <div onClick={onClick} className={`${baseClasses} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
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
      <div onClick={onClick} className={`${baseClasses} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${onClick ? cursorClass : ''}`}>
        <div className="flex items-start justify-between relative z-10">
          <div className="p-2.5 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
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
    <div onClick={onClick} className={`${baseClasses} bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${onClick ? cursorClass : ''}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="p-2.5 rounded-xl bg-blue-900 text-white dark:bg-lime-500 dark:text-black shadow-md">
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
