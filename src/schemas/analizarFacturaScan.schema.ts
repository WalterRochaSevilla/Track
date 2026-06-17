import { z } from "zod";

export const analizarFacturaScanSchema = z.object({
  docId: z.string().optional().describe("El ID del archivo de factura retornado por el API de upload (/api/upload)."),
  filePath: z.string().optional().describe("La ruta local absoluta o relativa del archivo de imagen a analizar."),
  imagenUrl: z.string().url().optional().describe("URL pública de la imagen de la factura a analizar."),
  imagenBase64: z.string().optional().describe("Contenido de la imagen codificado en base64."),
  mimeType: z.string().optional().describe("Tipo MIME de la imagen (ej: image/jpeg, image/png)."),
  empresaId: z.string().optional().describe("ID de la empresa (tenant) dueña de la factura."),
  tipo: z.enum(["compra", "venta"]).optional().describe("Tipo de factura: 'compra' o 'venta'."),
});

export type AnalizarFacturaScanInput = z.infer<typeof analizarFacturaScanSchema>;
