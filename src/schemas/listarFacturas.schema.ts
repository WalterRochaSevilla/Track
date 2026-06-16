import { z } from "zod";

export const listarFacturasSchema = {
  empresaId: z.uuid().describe("Id unico de la empresa"),
  fechaInicio: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha minima de la cual se tendran las facturas"),
  fechaFin: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha limite para las facturas a listar"),
};

export type ListarFacturasInput = z.infer<
  z.ZodObject<typeof listarFacturasSchema>
>;
