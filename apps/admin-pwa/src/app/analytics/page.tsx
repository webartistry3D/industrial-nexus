'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  BarChart2, Users, CheckCircle, AlertTriangle, Clock,
  TrendingUp, ArrowRight, Trophy, Minus, Calendar,
} from 'lucide-react';

interface TrendPoint {
  date: string;
  delivered: number;
  delayed: number;
  cancelled: number;
}

interface DriverStat {
  driverId: string;
  name: string;
  email: string;
  licenseNumber: string;
  availability: string;
  totalTrips: number;
  delivered: number;
  inTransit: number;
  cancelled: number;
  delayed: number;
  onTimeRate: number | null;
  avgDurationMinutes: number | null;
}

function DeliveryTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 600;
  const H = 160;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...data.map(d => d.delivered + d.delayed + d.cancelled), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.max(4, Math.min(18, barGroupW * 0.6));
  const gap = barW * 0.2;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * maxVal));

  const toY = (v: number) => padT + chartH - (v / maxVal) * chartH;

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : Math.ceil(data.length / 7);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: Math.max(280, data.length * 20) }}
        aria-label="Delivery trends chart"
      >
        {/* Y grid lines + labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
              className="text-gray-500"
            />
            <text
              x={padL - 4} y={toY(v) + 4}
              fontSize={9} textAnchor="end"
              className="fill-gray-400 dark:fill-gray-500"
              fill="currentColor"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = padL + i * barGroupW + barGroupW / 2;
          const numBars = 3;
          const totalBarW = numBars * barW + (numBars - 1) * gap;
          const startX = cx - totalBarW / 2;

          const delivH = (d.delivered / maxVal) * chartH;
          const delayH = (d.delayed / maxVal) * chartH;
          const cancH = (d.cancelled / maxVal) * chartH;

          return (
            <g key={d.date}>
              {/* Delivered bar */}
              {delivH > 0 && (
                <rect
                  x={startX} y={toY(d.delivered)} width={barW} height={delivH}
                  rx={2} fill="#22c55e" opacity={0.85}
                />
              )}
              {/* Delayed bar */}
              {delayH > 0 && (
                <rect
                  x={startX + barW + gap} y={toY(d.delayed)} width={barW} height={delayH}
                  rx={2} fill="#f87171" opacity={0.85}
                />
              )}
              {/* Cancelled bar */}
              {cancH > 0 && (
                <rect
                  x={startX + (barW + gap) * 2} y={toY(d.cancelled)} width={barW} height={cancH}
                  rx={2} fill="#94a3b8" opacity={0.7}
                />
              )}
              {/* X label */}
              {i % labelStep === 0 && (
                <text
                  x={cx} y={H - 4}
                  fontSize={9} textAnchor="middle"
                  fill="currentColor"
                  className="fill-gray-400 dark:fill-gray-500"
                >
                  {fmtDate(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {/* X axis base line */}
        <line
          x1={padL} y1={H - padB} x2={W - padR} y2={H - padB}
          stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
          className="text-gray-500"
        />
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof DriverStat>('delivered');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchTrends(trendDays);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchTrends(trendDays);
  }, [trendDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDriverPerformance();
      setDrivers(data);
    } catch (err: any) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (days: number) => {
    try {
      setTrendsLoading(true);
      const data = await api.getDeliveryTrends(days);
      setTrends(data);
    } catch {
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleSort = (col: keyof DriverStat) => {
    if (sortBy === col) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const sorted = [...drivers].sort((a, b) => {
    const av = a[sortBy] ?? -1;
    const bv = b[sortBy] ?? -1;
    if (av < bv) return sortDir === 'desc' ? 1 : -1;
    if (av > bv) return sortDir === 'desc' ? -1 : 1;
    return 0;
  });

  // Aggregate KPIs
  const totalDelivered = drivers.reduce((s, d) => s + d.delivered, 0);
  const totalDelayed = drivers.reduce((s, d) => s + d.delayed, 0);
  const totalTrips = drivers.reduce((s, d) => s + d.totalTrips, 0);
  const avgOnTime = drivers.filter(d => d.onTimeRate !== null).length > 0
    ? Math.round(
        drivers.filter(d => d.onTimeRate !== null).reduce((s, d) => s + (d.onTimeRate ?? 0), 0) /
        drivers.filter(d => d.onTimeRate !== null).length,
      )
    : null;

  const topDriver = sorted.find(d => d.delivered > 0) ?? null;

  const onTimeColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-400';
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const SortIcon = ({ col }: { col: keyof DriverStat }) => {
    if (sortBy !== col) return <Minus className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'desc'
      ? <span className="text-blue-500 text-xs font-bold">↓</span>
      : <span className="text-blue-500 text-xs font-bold">↑</span>;
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950">
      <main className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance & delivery insights</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={fetchData} className="ml-auto text-blue-600 dark:text-blue-400 underline text-xs">Retry</button>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Trips</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
              {loading ? '—' : totalTrips}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {loading ? '—' : totalDelivered}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fleet On-Time</p>
            <p className={`text-2xl font-bold font-mono ${onTimeColor(avgOnTime)}`}>
              {loading ? '—' : avgOnTime !== null ? `${avgOnTime}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delayed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {loading ? '—' : totalDelayed}
            </p>
          </div>
        </div>

        {/* Top performer */}
        {!loading && topDriver && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Top Performer</p>
              <p className="font-bold text-gray-900 dark:text-white truncate">{topDriver.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {topDriver.delivered} deliveries · {topDriver.onTimeRate !== null ? `${topDriver.onTimeRate}% on-time` : 'no rate yet'}
              </p>
            </div>
            <button
              onClick={() => router.push(`/drivers/${topDriver.driverId}`)}
              className="flex-shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 active:opacity-70"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Driver Performance Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Driver Performance</h2>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {loading ? '…' : `${drivers.length} drivers`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active drivers found</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {([
                        ['name', 'Driver'],
                        ['totalTrips', 'Total'],
                        ['delivered', 'Delivered'],
                        ['inTransit', 'Active'],
                        ['delayed', 'Delayed'],
                        ['onTimeRate', 'On-Time %'],
                        ['avgDurationMinutes', 'Avg Duration'],
                      ] as [keyof DriverStat, string][]).map(([col, label]) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="px-4 py-3 text-left cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                        >
                          <span className="flex items-center gap-1">
                            {label} <SortIcon col={col} />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {sorted.map((d, i) => (
                      <tr
                        key={d.driverId}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {d.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{d.licenseNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{d.totalTrips}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 font-mono text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" /> {d.delivered}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">{d.inTransit}</td>
                        <td className="px-4 py-3">
                          {d.delayed > 0
                            ? <span className="flex items-center gap-1 font-mono text-red-600 dark:text-red-400"><AlertTriangle className="w-3.5 h-3.5" />{d.delayed}</span>
                            : <span className="font-mono text-gray-400">0</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {d.onTimeRate !== null
                            ? <span className={`font-bold font-mono ${onTimeColor(d.onTimeRate)}`}>{d.onTimeRate}%</span>
                            : <span className="text-gray-400 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {d.avgDurationMinutes !== null
                            ? <span className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300"><Clock className="w-3.5 h-3.5" />{d.avgDurationMinutes < 60 ? `${d.avgDurationMinutes}m` : `${Math.round(d.avgDurationMinutes / 60)}h ${d.avgDurationMinutes % 60}m`}</span>
                            : <span className="text-gray-400 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/drivers/${d.driverId}`)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
                {sorted.map((d) => (
                  <div
                    key={d.driverId}
                    onClick={() => router.push(`/drivers/${d.driverId}`)}
                    className="p-4 active:bg-gray-50 dark:active:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {d.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{d.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{d.licenseNumber}</p>
                      </div>
                      {d.onTimeRate !== null && (
                        <span className={`text-sm font-bold font-mono ${onTimeColor(d.onTimeRate)}`}>{d.onTimeRate}%</span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2">
                        <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{d.totalTrips}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">{d.delivered}</p>
                        <p className="text-xs text-green-700 dark:text-green-500">Done</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">{d.inTransit}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-500">Active</p>
                      </div>
                      <div className={`rounded-xl p-2 ${d.delayed > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-700/50'}`}>
                        <p className={`text-lg font-bold font-mono ${d.delayed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>{d.delayed}</p>
                        <p className={`text-xs ${d.delayed > 0 ? 'text-red-700 dark:text-red-500' : 'text-gray-400'}`}>Delayed</p>
                      </div>
                    </div>
                    {d.avgDurationMinutes !== null && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Avg delivery: {d.avgDurationMinutes < 60 ? `${d.avgDurationMinutes}m` : `${Math.round(d.avgDurationMinutes / 60)}h ${d.avgDurationMinutes % 60}m`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delivery Trends Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Delivery Trends</h2>
            </div>
            <div className="flex items-center gap-1">
              {([7, 14, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    trendDays === d
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-500"></span> Delivered</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-400"></span> Delayed</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300 dark:bg-slate-600"></span> Cancelled</span>
          </div>

          {trendsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent" />
            </div>
          ) : trends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
              <Calendar className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No delivery data in the last {trendDays} days</p>
            </div>
          ) : (
            <DeliveryTrendChart data={trends} />
          )}
        </div>
      </main>
    </div>
  );
}
