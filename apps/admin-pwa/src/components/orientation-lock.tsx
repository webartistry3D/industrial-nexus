'use client';

import { useEffect } from 'react';

export function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (typeof window === 'undefined' || !('screen' in window) || !('orientation' in window.screen)) {
        return;
      }

      const orientation = window.screen.orientation as any;
      if (typeof orientation.lock !== 'function') return;

      const tryLock = async (type: string) => {
        try {
          await orientation.lock(type);
          return true;
        } catch {
          return false;
        }
      };

      const types = ['portrait', 'portrait-primary', 'portrait-secondary'];
      for (const type of types) {
        if (await tryLock(type)) return;
      }
    };

    const attemptLock = () => {
      lockOrientation();
      let attempts = 0;
      const retry = setInterval(() => {
        attempts += 1;
        lockOrientation();
        if (attempts >= 3) clearInterval(retry);
      }, 1000);
      return retry;
    };

    const retryInterval = attemptLock();

    const firstInteraction = () => {
      lockOrientation();
      window.removeEventListener('click', firstInteraction);
      window.removeEventListener('touchstart', firstInteraction);
    };

    window.addEventListener('orientationchange', lockOrientation);
    window.addEventListener('resize', lockOrientation);
    window.addEventListener('click', firstInteraction);
    window.addEventListener('touchstart', firstInteraction);

    return () => {
      clearInterval(retryInterval);
      window.removeEventListener('orientationchange', lockOrientation);
      window.removeEventListener('resize', lockOrientation);
      window.removeEventListener('click', firstInteraction);
      window.removeEventListener('touchstart', firstInteraction);
    };
  }, []);

  return null;
}
