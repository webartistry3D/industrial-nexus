'use client';

import { useEffect, useState } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondStyle = {
    transform: `rotate(${seconds * 6}deg)`,
  };

  const minuteStyle = {
    transform: `rotate(${minutes * 6 + seconds * 0.1}deg)`,
  };

  const hourStyle = {
    transform: `rotate(${hours * 30 + minutes * 0.5}deg)`,
  };

  return (
    <div className="relative w-32 h-32">
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
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="30"
          stroke="#1e293b"
          className="dark:stroke-gray-200"
          strokeWidth="3"
          strokeLinecap="round"
          style={hourStyle}
          transformOrigin="50 50"
        />

        {/* Minute hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="#64748b"
          className="dark:stroke-slate-400"
          strokeWidth="2"
          strokeLinecap="round"
          style={minuteStyle}
          transformOrigin="50 50"
        />

        {/* Second hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="#ef4444"
          strokeWidth="1"
          strokeLinecap="round"
          style={secondStyle}
          transformOrigin="50 50"
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="#ef4444" />
      </svg>
    </div>
  );
}
