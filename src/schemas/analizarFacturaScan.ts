import { z } from "zod";

export const analizarFacturaScanSchema = {
  empresaId: z.string().describe("ID de la empresa (tenant) dueña de la factura"),
  tipo: z.enum(["compra", "venta"]).describe("compra = recibida, venta = emitida"),
  imagenUrl: z.string().url().optional().describe("URL pública de la imagen de la factura"),
  imagenBase64: z.string().optional().describe("Imagen en base64 (alternativa a imagenUrl)"),
  mimeType: z.string().optional().describe("Tipo MIME de la imagen, ej. image/jpeg"),
};