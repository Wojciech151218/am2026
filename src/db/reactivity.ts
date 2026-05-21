type DbListener = () => void;

let dbVersion = 0;
const listeners = new Set<DbListener>();

export function getDbVersion(): number {
  return dbVersion;
}

export function subscribeDb(listener: DbListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDbChanged(): void {
  dbVersion += 1;
  listeners.forEach(listener => listener());
}
