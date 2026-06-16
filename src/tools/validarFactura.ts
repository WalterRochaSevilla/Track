import { validarFacturaSchema } from "../schemas/validarFactura.js";
import { validarFactura } from "../services/validarFactura.js";
import type { Factura } from "../types/factura.js";

export const validarFacturaTool = {
  name: "validarFactura",
  description:
    "Valida una factura boliviana ya extraída: coherencia de montos, formato de NIT, fecha dentro del período, y calcula el hash para detectar duplicados. No usa IA; es validación determinista. Úsala después de analizarFacturaScan y antes de registrar.",
  schema: validarFacturaSchema,
  handler: async (args: any) => {
    const { periodo, ...factura } = args;
    const resultado = validarFactura(factura as Factura, periodo);
    return { content: [{ type: "text" as const, text: JSON.stringify(resultado, null, 2) }] };
  },
};