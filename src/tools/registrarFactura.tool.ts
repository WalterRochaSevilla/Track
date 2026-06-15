import { facturaService } from "../bootstrap/factura.js";
import { Factura } from "../database/entities/Factura.js";
import { registrarFacturaSchema } from "../schemas/registrarFactura.schema.js";
import type { RegistrarFacturaInput } from "../schemas/registrarFactura.schema.js";

const registrarFacturaTool = {
  name: "registrarFactura",
  description: "Registra una factura en el sistema.",
  schema: registrarFacturaSchema,
  handler: async (input: RegistrarFacturaInput) => {
    try {
      // Intentamos ejecutar el servicio normal
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
      // 🌟 ESTO ES LO QUE NOS VA A SALVAR:
      // Imprimimos el error interno de PostgreSQL completo en la consola donde corres el npx
      console.error("❌ [Error Crítico en DB]:", error);

      // Devolvemos el detalle al inspector para que lo veas en la interfaz web
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
