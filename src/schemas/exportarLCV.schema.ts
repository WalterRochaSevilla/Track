import { z } from "zod";

export const exportarLCVSchema = {
  empresaId: z.uuid().describe("Id unico de la empresa"),
  fechaInicio: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha minima de la cual se tendran las facturas para el LCV"),
  fechaFin: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha limite para las facturas a incluir en el LCV"),
};

export type ExportarLCVInput = z.infer<z.ZodObject<typeof exportarLCVSchema>>;
