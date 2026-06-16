import { validarFactura } from "../services/validarFactura.js";
import { validarFacturaSchema } from "../schemas/validarFactura.schema.js";
import type { ValidarFacturaInput } from "../schemas/validarFactura.schema.js";

const validarFacturaTool = {
  name: "validarFactura",
  description: "Valida los datos de una factura contra las reglas fiscales bolivianas (formato del NIT, Módulo 11 del emisor, aritmética de IVA total vs base, y alertas de baja confianza en visión).",
  schema: validarFacturaSchema,
  handler: async (input: ValidarFacturaInput) => {
    try {
      const resultado = validarFactura(input.factura, input.confianzas);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(resultado, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ [Error en validarFactura]:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error al validar la factura: ${error.message || error}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default validarFacturaTool;
