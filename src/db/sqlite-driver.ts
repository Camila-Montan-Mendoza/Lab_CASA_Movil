import { Platform } from "react-native";

export interface SqliteLikeDatabase {
  execSync(source: string): void;
  runSync(source: string, params?: unknown[]): unknown;
  getAllSync<T>(source: string, params?: unknown[]): T[];
  getFirstSync<T>(source: string, params?: unknown[]): T | null;
  withTransactionSync(task: () => void): void;
}

export function openNativeDatabase(name: string): SqliteLikeDatabase | null {
  if (Platform.OS === "web") return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require("expo-sqlite") as typeof import("expo-sqlite");
  return SQLite.openDatabaseSync(name) as unknown as SqliteLikeDatabase;
}
