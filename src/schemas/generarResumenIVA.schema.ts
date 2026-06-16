import { z } from "zod";

export const generarResumenIVASchema = {
  empresaId: z.uuid().describe("Id unico de la empresa"),
  fechaInicio: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha minima de la cual se calcula el iva"),
  fechaFin: z.iso
    .datetime({ offset: true, local: true })
    .describe("Fecha limite para las el calculo del iva"),
};

export type GenerarResumenIVAInput = z.infer<
  z.ZodObject<typeof generarResumenIVASchema>
>;
