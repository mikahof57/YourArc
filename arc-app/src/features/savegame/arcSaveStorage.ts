export interface ArcSaveStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
}

const DATABASE_NAME = 'arc-offline-savegame';
const DATABASE_VERSION = 1;
const STORE_NAME = 'arc-key-value';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted'));
  });
}

export class IndexedDbArcSaveStorage implements ArcSaveStorageAdapter {
  private databasePromise: Promise<IDBDatabase> | null = null;

  private database(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Could not open ARC save database'));
      });
    }
    return this.databasePromise;
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    return (await this.database()).transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await requestResult((await this.store('readonly')).get(key));
    return (result as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const transaction = (await this.database()).transaction(STORE_NAME, 'readwrite');
    const completion = transactionComplete(transaction);
    await requestResult(transaction.objectStore(STORE_NAME).put(value, key));
    await completion;
  }

  async remove(key: string): Promise<void> {
    const transaction = (await this.database()).transaction(STORE_NAME, 'readwrite');
    const completion = transactionComplete(transaction);
    await requestResult(transaction.objectStore(STORE_NAME).delete(key));
    await completion;
  }

  async keys(prefix = ''): Promise<string[]> {
    const keys = await requestResult((await this.store('readonly')).getAllKeys());
    return keys.map(String).filter((key) => key.startsWith(prefix));
  }
}

export class MemoryArcSaveStorage implements ArcSaveStorageAdapter {
  private values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> { return (structuredClone(this.values.get(key)) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> { this.values.set(key, structuredClone(value)); }
  async remove(key: string): Promise<void> { this.values.delete(key); }
  async keys(prefix = ''): Promise<string[]> { return [...this.values.keys()].filter((key) => key.startsWith(prefix)); }
}
