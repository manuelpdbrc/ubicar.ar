import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MapperDB extends DBSchema {
  visits: {
    key: number;
    value: {
      id?: number;
      uniqueCode: string;
      type: string;
      circuitId?: string | null;
      comment?: string;
      dateTimestamp: string;
      imageBlob?: Blob;
      hasImage: boolean;
    };
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MapperDB>>;

export const initDB = async () => {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<MapperDB>('mapper-offline-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('visits', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'dateTimestamp');
      },
    });
  }
};

export const saveVisitOffline = async (visit: any) => {
  await initDB();
  const db = await dbPromise;
  await db.add('visits', visit);
};

export const getOfflineVisits = async () => {
  await initDB();
  const db = await dbPromise;
  return db.getAll('visits');
};

export const clearOfflineVisits = async () => {
  await initDB();
  const db = await dbPromise;
  await db.clear('visits');
};
