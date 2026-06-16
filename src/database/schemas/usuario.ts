import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const usuarioSchema = pgTable("usuario", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  token: text("token").notNull(),
});
