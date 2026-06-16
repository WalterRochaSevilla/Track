import { facturaService } from "../bootstrap/factura.js";
import { registrarFacturaSchema } from "../schemas/registrarFactura.schema.js";
import type { RegistrarFacturaInput } from "../schemas/registrarFactura.schema.js";

const registrarFacturaTool = {
  name: "registrarFactura",
  description: "Registra una factura en el sistema.",
  schema: registrarFacturaSchema,
  handler: async (input: RegistrarFacturaInput) => {
    try {
      const resultado = await facturaService.registrar(input);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(resultado),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ [Error Crítico en DB]:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: `Error interno: ${error.message || error}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default registrarFacturaTool;
