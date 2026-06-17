import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "../config/environments.js";

console.error(
  "🔌 Conectando a DB con URL:",
  ENV.DATABASE_URL ? "URL detectada" : "VACÍA",
);

if (!ENV.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL está vacía en environments.ts");
}

let _db: PostgresJsDatabase | null = null;

export function getDb(): PostgresJsDatabase {
  if (!_db) {
    const client = postgres(ENV.DATABASE_URL, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });
    _db = drizzle(client);
  }
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});