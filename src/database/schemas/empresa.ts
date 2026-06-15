import { pgTable, uuid, text, uniqueIndex } from "drizzle-orm/pg-core";

export const empresaSchema = pgTable(
  "empresa",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    nit: text("nit").notNull().unique(),

    razonSocial: text("razon_social").notNull(),
  },
  (table) => [uniqueIndex("empresa_nit_unique").on(table.nit)],
);
