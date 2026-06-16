import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const uploadsSchema = pgTable("uploads", {
  docId: text("doc_id").primaryKey(),
  empresaId: text("empresa_id").notNull(),
  originalName: text("original_name").notNull(),
  storedPath: text("stored_path").notNull(),
  mimetype: text("mimetype").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
