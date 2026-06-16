import { z } from "zod";

export const analizarFacturaScanSchema = z.object({
  docId: z.string().optional().describe("El ID del archivo de factura retornado por el API de upload (/api/upload)."),
  filePath: z.string().optional().describe("La ruta local absoluta o relativa del archivo de imagen a analizar."),
});

export type AnalizarFacturaScanInput = z.infer<typeof analizarFacturaScanSchema>;
