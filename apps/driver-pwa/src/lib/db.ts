// Offline First IndexedDB Database
const DB_NAME = 'industrial-nexus-driver';
const DB_VERSION = 1;

interface OfflineAction {
  id?: number;
  type: 'LOCATION_UPDATE' | 'POD_SUBMISSION' | 'CHECKLIST';
  tripId: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for offline actions queue
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionsStore.createIndex('synced', 'synced', { unique: false });
          actionsStore.createIndex('type', 'type', { unique: false });
        }

        // Store for cached trips data
        if (!db.objectStoreNames.contains('trips')) {
          db.createObjectStore('trips', { keyPath: 'id' });
        }

        // Store for POD data
        if (!db.objectStoreNames.contains('pod')) {
          db.createObjectStore('pod', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      
      const request = store.add({
        ...action,
        timestamp: Date.now(),
        synced: false,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const index = store.index('synced');
      const range = IDBKeyRange.only(0); // 0 = false for synced flag
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markActionSynced(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        data.synced = true;
        store.put(data);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSyncedActions(): Promise<void> {
    if (!this.db) await this.init();
    
    const pending = await this.getPendingActions();
    const synced = await this.getAllActions();
    
    const syncedActions = synced.filter(a => a.synced);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      
      syncedActions.forEach(action => {
        if (action.id) store.delete(action.id);
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheTrip(trip: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['trips'], 'readwrite');
      const store = transaction.objectStore('trips');
      const request = store.put(trip);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedTrip(id: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['trips'], 'readonly');
      const store = transaction.objectStore('trips');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePOD(tripId: string, podData: any): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pod'], 'readwrite');
      const store = transaction.objectStore('pod');
      const request = store.add({
        tripId,
        ...podData,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDatabase();
