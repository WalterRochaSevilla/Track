import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { ENV } from "./src/config/environments.ts";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "postgresql",

  schema: "./src/database/schemas/*",

  out: "./src/database/migrations",

  dbCredentials: {
    url: ENV.DATABASE_URL || "",
  },
});
