'use client';

import { useEffect, useState, memo } from 'react';

const AnalogClock = memo(function AnalogClock() {
  const [angles, setAngles] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours();
      setAngles({
        h: h * 30 + m * 0.5,
        m: m * 6 + s * 0.1,
        s: s * 6,
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Clock face */}
        <circle cx="50" cy="50" r="48" fill="#f8fafc" className="dark:fill-slate-800" stroke="#3b82f6" strokeWidth="2" />

        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = Math.round(50 + 40 * Math.cos(angle));
          const y1 = Math.round(50 + 40 * Math.sin(angle));
          const x2 = Math.round(50 + 45 * Math.cos(angle));
          const y2 = Math.round(50 + 45 * Math.sin(angle));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#94a3b8"
              strokeWidth={i % 3 === 0 ? 2 : 1}
              className="dark:stroke-slate-500"
            />
          );
        })}

        {/* Hour hand */}
        <g transform={`rotate(${angles.h}, 50, 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="30"
            stroke="#1e293b"
            className="dark:stroke-gray-200"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Minute hand */}
        <g transform={`rotate(${angles.m}, 50, 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke="#64748b"
            className="dark:stroke-slate-400"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Second hand */}
        <g transform={`rotate(${angles.s}, 50, 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#ef4444"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>

        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="#ef4444" />
      </svg>
    </div>
  );
});

export default AnalogClock;
