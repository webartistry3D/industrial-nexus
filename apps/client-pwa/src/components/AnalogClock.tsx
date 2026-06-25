'use client';

import { useEffect, useState, memo } from 'react';

const AnalogClock = memo(function AnalogClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const [main, period] = time.split(' ');

  return (
    <div className="w-full flex flex-col items-center justify-center gap-1 py-1">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-3xl sm:text-5xl md:text-8xl font-semibold tracking-tight text-gray-900 dark:text-white leading-none"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {main}
        </span>
        <span
          className="text-lg sm:text-4xl md:text-6xl font-medium text-blue-500 dark:text-blue-400 leading-none self-end pb-0.5"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {period}
        </span>
      </div>
      <span
        className="text-sm sm:text-xl md:text-2xl font-medium text-gray-400 dark:text-slate-500 tracking-wide uppercase"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {date}
      </span>
    </div>
  );
});

export default AnalogClock;
