/**
 * Native IndexedDB offline storage layer for EcoSync.
 * Stores pending driver mutations (pickup logs, stop updates) and conflicts.
 * Zero external library dependencies.
 */

export interface PendingPickupLog {
  id?: number;
  idempotencyKey: string;
  pickupId: number;
  payload: {
    weight_kg: number;
    waste_category?: string;
    photo_url?: string;
  };
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

export interface PendingStopUpdate {
  id?: number;
  idempotencyKey: string;
  routeId: number;
  stopId: number;
  payload: {
    status: string;
  };
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

export interface OfflineConflict {
  id?: number;
  type: 'pickup_log' | 'stop_update';
  entityId: number;
  idempotencyKey: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const DB_NAME = 'ecosync_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('pending_pickup_logs')) {
        const pickupStore = db.createObjectStore('pending_pickup_logs', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pickupStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        pickupStore.createIndex('pickupId', 'pickupId', { unique: false });
        pickupStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('pending_stop_updates')) {
        const stopStore = db.createObjectStore('pending_stop_updates', {
          keyPath: 'id',
          autoIncrement: true,
        });
        stopStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        stopStore.createIndex('stopId', 'stopId', { unique: false });
      }

      if (!db.objectStoreNames.contains('offline_conflicts')) {
        db.createObjectStore('offline_conflicts', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ── Pending Pickup Logs ──

export async function savePendingPickupLog(
  item: Omit<PendingPickupLog, 'id'>
): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_pickup_logs', 'readwrite');
    const store = tx.objectStore('pending_pickup_logs');
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingPickupLogs(): Promise<PendingPickupLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_pickup_logs', 'readonly');
    const store = tx.objectStore('pending_pickup_logs');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePendingPickupLog(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_pickup_logs', 'readwrite');
    const store = tx.objectStore('pending_pickup_logs');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Pending Stop Updates ──

export async function savePendingStopUpdate(
  item: Omit<PendingStopUpdate, 'id'>
): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_stop_updates', 'readwrite');
    const store = tx.objectStore('pending_stop_updates');
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingStopUpdates(): Promise<PendingStopUpdate[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_stop_updates', 'readonly');
    const store = tx.objectStore('pending_stop_updates');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePendingStopUpdate(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_stop_updates', 'readwrite');
    const store = tx.objectStore('pending_stop_updates');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Offline Conflicts ──

export async function saveOfflineConflict(
  conflict: Omit<OfflineConflict, 'id'>
): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_conflicts', 'readwrite');
    const store = tx.objectStore('offline_conflicts');
    const req = store.add(conflict);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineConflicts(): Promise<OfflineConflict[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_conflicts', 'readonly');
    const store = tx.objectStore('offline_conflicts');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function dismissConflict(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_conflicts', 'readwrite');
    const store = tx.objectStore('offline_conflicts');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Overall Queue Summary ──

export async function getPendingQueueCount(): Promise<number> {
  try {
    const [pickups, stops] = await Promise.all([
      getPendingPickupLogs(),
      getPendingStopUpdates(),
    ]);
    return pickups.length + stops.length;
  } catch {
    return 0;
  }
}
