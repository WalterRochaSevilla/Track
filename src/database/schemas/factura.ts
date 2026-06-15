import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { empresaSchema } from "./empresa.js";

export const facturaSchema = pgTable(
  "factura",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresaSchema.id),

    tipo: text("tipo").notNull(),

    nitEmisor: text("nit_emisor").notNull(),

    razonSocialEmisor: text("razon_social_emisor").notNull(),

    numeroFactura: text("numero_factura").notNull(),

    numeroAutorizacion: text("numero_autorizacion"),

    fechaEmision: date("fecha_emision").notNull(),

    nitComprador: text("nit_comprador"),

    importeTotal: numeric("importe_total", {
      precision: 12,
      scale: 2,
    }).notNull(),

    descuentos: numeric("descuentos", {
      precision: 12,
      scale: 2,
    }).default("0"),

    baseCreditoFiscal: numeric("base_credito_fiscal", {
      precision: 12,
      scale: 2,
    }).notNull(),

    hashDedup: text("hash_dedup").notNull(),
  },
  (table) => [
    uniqueIndex("factura_empresa_hash_unique").on(
      table.empresaId,
      table.hashDedup,
    ),
  ],
);
