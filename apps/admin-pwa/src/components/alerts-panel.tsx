'use client';

import { WeightAlert } from '@/types';
import { AlertTriangle, Scale, Clock } from 'lucide-react';

interface AlertsPanelProps {
  alerts: WeightAlert[];
  loading?: boolean;
  onAlertClick?: (tripId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getAlertSeverity(status: string): 'warning' | 'critical' {
  return status === 'OVERLOADED' || status === 'WARNING' ? 'critical' : 'warning';
}

export function AlertsPanel({ alerts, loading = false, onAlertClick }: AlertsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Weight Watch & SLA Alerts</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'WARNING' || a.status === 'OVERLOADED');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-white">Weight Watch & SLA Alerts</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${
          activeAlerts.length > 0 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        }`}>
          {activeAlerts.length} active
        </span>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
          <div
              key={alert.id}
              onClick={() => onAlertClick?.(alert.tripId)}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                getAlertSeverity(alert.status) === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.status === 'OVERLOADED' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <Scale className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {alert.trip?.order?.orderNumber || alert.tripId} • {alert.utilization.toFixed(1)}% capacity
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {alert.status} • {formatTimeAgo(alert.checkedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
