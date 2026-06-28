'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SLA_WINDOW_HOURS = 12;

export type SlaStatus = 'green' | 'yellow' | 'red' | 'breached';

export function computeSlaStatus(startedAt: string | Date): SlaStatus {
  const started = new Date(startedAt).getTime();
  const elapsed = (Date.now() - started) / (1000 * 60 * 60);
  if (elapsed >= SLA_WINDOW_HOURS) return 'breached';
  if (elapsed >= SLA_WINDOW_HOURS * 0.85) return 'red';
  if (elapsed >= SLA_WINDOW_HOURS * 0.65) return 'yellow';
  return 'green';
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface SlaIndicatorProps {
  startedAt: string | Date;
  compact?: boolean;
}

export function SlaIndicator({ startedAt, compact = false }: SlaIndicatorProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const started = new Date(startedAt).getTime();
  const elapsedMs = now - started;
  const remainingMs = SLA_WINDOW_HOURS * 60 * 60 * 1000 - elapsedMs;
  const status = computeSlaStatus(startedAt);

  const config = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-700',
      dot: 'bg-green-500',
      icon: CheckCircle,
      label: 'On Track',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-700',
      dot: 'bg-yellow-500',
      icon: AlertTriangle,
      label: 'Late Risk',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-300 dark:border-red-700',
      dot: 'bg-red-500',
      icon: AlertTriangle,
      label: 'Urgent',
    },
    breached: {
      bg: 'bg-red-200 dark:bg-red-900/50',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-400 dark:border-red-600',
      dot: 'bg-red-600',
      icon: XCircle,
      label: 'SLA Breached',
    },
  }[status];

  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
        title={`SLA: ${status === 'breached' ? 'Exceeded by ' + formatDuration(-remainingMs) : formatDuration(remainingMs) + ' remaining'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  const progressPct = Math.min(100, (elapsedMs / (SLA_WINDOW_HOURS * 60 * 60 * 1000)) * 100);

  return (
    <div className={`rounded-xl border p-3 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${config.text}`}>
          <Icon className="w-4 h-4" />
          SLA: {config.label}
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono ${config.text}`}>
          <Clock className="w-3.5 h-3.5" />
          {status === 'breached'
            ? `+${formatDuration(-remainingMs)} over`
            : `${formatDuration(remainingMs)} left`}
        </div>
      </div>
      <div className="h-1.5 bg-white/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            status === 'green' ? 'bg-green-500' :
            status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 opacity-60">
        <span className={config.text}>Start</span>
        <span className={config.text}>12h SLA</span>
      </div>
    </div>
  );
}
