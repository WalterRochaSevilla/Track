import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "../config/environments.js";

console.error(
  "🔌 Conectando a DB con URL:",
  ENV.DATABASE_URL ? "URL detectada" : "VACÍA",
);

const connectionString = ENV.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL está vacía en environments.ts");
}

const client = postgres(connectionString);

export const db = drizzle(client);
