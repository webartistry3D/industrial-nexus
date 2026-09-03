'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '@/lib/db';
import { api } from '@/lib/api';

interface SyncStatus {
  pendingCount: number;
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useOfflineQueue() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingCount: 0,
    isSyncing: false,
    lastSync: null,
    error: null,
  });

  // Check pending actions count
  const checkPending = useCallback(async () => {
    const pending = await offlineDB.getPendingActions();
    setSyncStatus(prev => ({ ...prev, pendingCount: pending.length }));
    return pending.length;
  }, []);

  // Sync pending actions
  const sync = useCallback(async () => {
    const pending = await offlineDB.getPendingActions();
    
    if (pending.length === 0) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    let hasErrors = false;
    let lastError: string | null = null;

    try {
      for (const action of pending) {
        if (!action.id) continue;

        try {
          switch (action.type) {
            case 'LOCATION_UPDATE':
              await api.updateLocation(
                action.tripId,
                action.data.lat,
                action.data.lng,
                action.data.accuracy
              );
              break;

            case 'POD_SUBMISSION':
              await api.submitPOD(action.tripId, action.data);
              break;

            case 'CHECKLIST':
              await api.submitChecklist(action.tripId, action.data);
              break;
          }

          // Mark as synced
          await offlineDB.markActionSynced(action.id);
        } catch (error) {
          hasErrors = true;
          lastError = error instanceof Error ? error.message : 'Sync failed';
          console.error(`Failed to sync action ${action.id}:`, error);
          // Continue with next action
        }
      }

      // Clean up synced actions
      await offlineDB.deleteSyncedActions();
      
      setSyncStatus({
        pendingCount: 0,
        isSyncing: false,
        lastSync: new Date(),
        error: hasErrors ? lastError : null,
      });
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, []);

  // Queue an action for later sync
  const queueAction = useCallback(async (action: {
    type: 'LOCATION_UPDATE' | 'POD_SUBMISSION' | 'CHECKLIST';
    tripId: string;
    data: any;
  }) => {
    await offlineDB.queueAction(action);
    await checkPending();
  }, [checkPending]);

  // Check online status and auto-sync
  useEffect(() => {
    const handleOnline = () => {
      sync();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial check
    checkPending();
    
    // Sync if online on mount
    if (navigator.onLine) {
      sync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [sync, checkPending]);

  return {
    ...syncStatus,
    sync,
    queueAction,
    checkPending,
    isOnline: navigator.onLine,
  };
}
