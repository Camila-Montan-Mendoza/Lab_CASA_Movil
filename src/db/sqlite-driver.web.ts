// En web no se importa expo-sqlite (evita el error de wa-sqlite.wasm);
// offline-db usa su almacenamiento en memoria como respaldo.
export interface SqliteLikeDatabase {
  execSync(source: string): void;
  runSync(source: string, params?: unknown[]): unknown;
  getAllSync<T>(source: string, params?: unknown[]): T[];
  getFirstSync<T>(source: string, params?: unknown[]): T | null;
  withTransactionSync(task: () => void): void;
}

export function openNativeDatabase(_name: string): SqliteLikeDatabase | null {
  return null;
}

