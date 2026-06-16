import { analizarFacturaScanSchema } from "../schemas/analizarFacturaScan.js";
import { extraerFacturaDesdeImagen, descargarImagenComoBase64 } from "../services/visionExtractor.js";

export const analizarFacturaScanTool = {
  name: "analizarFacturaScan",
  description:
    "Lee la foto o el scan de una factura boliviana con Gemini y extrae sus campos (NIT, número, fecha, importes) junto con una confianza por campo. Recibe la imagen como URL (imagenUrl) o como base64 (imagenBase64). Es el primer paso, antes de validar y registrar.",
  schema: analizarFacturaScanSchema,
  handler: async (args: any) => {
    let imagenBase64 = args.imagenBase64;
    let mimeType = args.mimeType ?? "image/jpeg";

    if (!imagenBase64 && args.imagenUrl) {
      const descargada = await descargarImagenComoBase64(args.imagenUrl);
      imagenBase64 = descargada.data;
      mimeType = descargada.mimeType;
    }

    if (!imagenBase64) {
      return {
        content: [{ type: "text" as const, text: "Error: debes enviar imagenUrl o imagenBase64." }],
      };
    }

    const extraida = await extraerFacturaDesdeImagen({ imagenBase64, mimeType });
    const resultado = { empresaId: args.empresaId, tipo: args.tipo, ...extraida };
    return { content: [{ type: "text" as const, text: JSON.stringify(resultado, null, 2) }] };
  },
};