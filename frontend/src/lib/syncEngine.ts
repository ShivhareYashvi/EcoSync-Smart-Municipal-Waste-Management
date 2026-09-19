import { api } from './api';
import {
  deletePendingPickupLog,
  deletePendingStopUpdate,
  getPendingPickupLogs,
  getPendingQueueCount,
  getPendingStopUpdates,
  saveOfflineConflict,
  type OfflineConflict,
} from './offlineStore';

export type SyncStatusListener = (queueCount: number, isSyncing: boolean) => void;
export type ConflictListener = (conflict: OfflineConflict) => void;

const statusListeners = new Set<SyncStatusListener>();
const conflictListeners = new Set<ConflictListener>();

let isCurrentlySyncing = false;

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'key-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
}

export function subscribeToSyncStatus(listener: SyncStatusListener): () => void {
  statusListeners.add(listener);
  void getPendingQueueCount().then((count) => listener(count, isCurrentlySyncing));
  return () => statusListeners.delete(listener);
}

export function subscribeToConflicts(listener: ConflictListener): () => void {
  conflictListeners.add(listener);
  return () => conflictListeners.delete(listener);
}

function notifyStatus(count: number, syncing: boolean): void {
  statusListeners.forEach((fn) => fn(count, syncing));
}

/**
 * Replays all queued mutations against the server with their recorded Idempotency-Keys.
 */
export async function syncPendingMutations(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  if (isCurrentlySyncing) {
    return { synced: 0, failed: 0 };
  }

  isCurrentlySyncing = true;
  let initialCount = await getPendingQueueCount();
  notifyStatus(initialCount, true);

  let synced = 0;
  let failed = 0;

  try {
    // 1. Sync pending pickup logs
    const pendingPickups = await getPendingPickupLogs();
    for (const item of pendingPickups) {
      if (!item.id) continue;
      try {
        await api.post(`/pickups/${item.pickupId}/log`, item.payload, {
          headers: {
            'Idempotency-Key': item.idempotencyKey,
          },
        });
        await deletePendingPickupLog(item.id);
        synced++;
      } catch (err: any) {
        if (err.response && err.response.status === 409) {
          // Conflict: Server state diverged from offline client log
          const conflictData: Omit<OfflineConflict, 'id'> = {
            type: 'pickup_log',
            entityId: item.pickupId,
            idempotencyKey: item.idempotencyKey,
            message: `Conflict on Pickup #${item.pickupId}: Log was previously submitted with a conflicting payload.`,
            timestamp: new Date().toISOString(),
            resolved: false,
          };
          const conflictId = await saveOfflineConflict(conflictData);
          await deletePendingPickupLog(item.id);
          conflictListeners.forEach((fn) => fn({ ...conflictData, id: conflictId }));
          failed++;
        } else {
          // Network or server error — keep in queue
          failed++;
        }
      }
    }

    // 2. Sync pending stop updates
    const pendingStops = await getPendingStopUpdates();
    for (const item of pendingStops) {
      if (!item.id) continue;
      try {
        await api.patch(
          `/routes/${item.routeId}/stops/${item.stopId}/status`,
          item.payload,
          {
            headers: {
              'Idempotency-Key': item.idempotencyKey,
            },
          }
        );
        await deletePendingStopUpdate(item.id);
        synced++;
      } catch (err: any) {
        if (err.response && err.response.status === 409) {
          const conflictData: Omit<OfflineConflict, 'id'> = {
            type: 'stop_update',
            entityId: item.stopId,
            idempotencyKey: item.idempotencyKey,
            message: `Conflict on Stop #${item.stopId}: Status change conflict detected on server.`,
            timestamp: new Date().toISOString(),
            resolved: false,
          };
          const conflictId = await saveOfflineConflict(conflictData);
          await deletePendingStopUpdate(item.id);
          conflictListeners.forEach((fn) => fn({ ...conflictData, id: conflictId }));
          failed++;
        } else {
          failed++;
        }
      }
    }
  } finally {
    isCurrentlySyncing = false;
    const finalCount = await getPendingQueueCount();
    notifyStatus(finalCount, false);
  }

  return { synced, failed };
}

// Automatically trigger sync when browser reconnects
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[EcoSync PWA] Network online detected. Triggering offline sync...');
    void syncPendingMutations();
  });
}
