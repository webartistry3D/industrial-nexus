import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

// Mock the offlineDB
jest.mock('@/lib/db', () => ({
  offlineDB: {
    getPendingActions: jest.fn(),
    queueAction: jest.fn(),
    markActionSynced: jest.fn(),
    deleteSyncedActions: jest.fn(),
  },
}));

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    updateLocation: jest.fn(),
    submitPOD: jest.fn(),
    submitChecklist: jest.fn(),
  },
}));

import { offlineDB } from '@/lib/db';
import { api } from '@/lib/api';

describe('useOfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (offlineDB.getPendingActions as jest.Mock).mockResolvedValue([]);
  });

  it('should initialize with zero pending actions', async () => {
    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });

  it('should queue a location update action', async () => {
    (offlineDB.queueAction as jest.Mock).mockResolvedValue(undefined);
    (offlineDB.getPendingActions as jest.Mock).mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => expect(result.current.pendingCount).toBe(0));

    await act(async () => {
      await result.current.queueAction({
        type: 'LOCATION_UPDATE',
        tripId: 'trip-1',
        data: { lat: 6.5244, lng: 3.3792, accuracy: 10 },
      });
    });

    expect(offlineDB.queueAction).toHaveBeenCalledWith({
      type: 'LOCATION_UPDATE',
      tripId: 'trip-1',
      data: { lat: 6.5244, lng: 3.3792, accuracy: 10 },
    });
  });

  it('should sync pending actions when online', async () => {
    const pendingActions = [
      { id: 1, type: 'LOCATION_UPDATE', tripId: 'trip-1', data: { lat: 6.5, lng: 3.4, accuracy: 10 } },
    ];
    (offlineDB.getPendingActions as jest.Mock).mockResolvedValue(pendingActions);
    (api.updateLocation as jest.Mock).mockResolvedValue({});
    (offlineDB.markActionSynced as jest.Mock).mockResolvedValue(undefined);
    (offlineDB.deleteSyncedActions as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => expect(result.current.pendingCount).toBe(0));

    await act(async () => {
      await result.current.sync();
    });

    expect(api.updateLocation).toHaveBeenCalledWith('trip-1', 6.5, 3.4, 10);
    expect(offlineDB.markActionSynced).toHaveBeenCalledWith(1);
  });

  it('should handle sync errors gracefully', async () => {
    const pendingActions = [
      { id: 1, type: 'LOCATION_UPDATE', tripId: 'trip-1', data: { lat: 6.5, lng: 3.4, accuracy: 10 } },
    ];
    (offlineDB.getPendingActions as jest.Mock).mockResolvedValue(pendingActions);
    (api.updateLocation as jest.Mock).mockRejectedValue(new Error('Network error'));
    (offlineDB.markActionSynced as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => expect(result.current.pendingCount).toBe(0));

    // Trigger sync which should fail
    await act(async () => {
      try {
        await result.current.sync();
      } catch {
        // Expected to fail
      }
    });

    // Wait for state updates
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isSyncing).toBe(false);
  });
});
