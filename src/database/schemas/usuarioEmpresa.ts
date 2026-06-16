import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { usuarioSchema } from "./usuario.js";
import { empresaSchema } from "./empresa.js";

export const usuarioEmpresaSchema = pgTable("usuario_empresa", {
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarioSchema.id),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresaSchema.id),
  rol: text("rol").notNull(),
});
