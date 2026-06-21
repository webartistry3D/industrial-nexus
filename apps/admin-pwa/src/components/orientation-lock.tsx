'use client';

import { useEffect } from 'react';

export function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).lock('portrait');
        } catch (err) {
          console.log('Orientation lock not supported or denied:', err);
        }
      }
    };

    lockOrientation();
  }, []);

  return null;
}
