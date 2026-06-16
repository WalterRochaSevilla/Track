import { facturaService } from "../bootstrap/factura.js";
import {
  ListarFacturasInput,
  listarFacturasSchema,
} from "../schemas/listarFacturas.schema.js";

const listarFacturasTool = {
  name: "listarFacturas",
  description: "Lista Facturas durante un periodo de tiempo",
  schema: listarFacturasSchema,
  handler: async (input: ListarFacturasInput) => {
    try {
      const resultado = await facturaService.listar(input);

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

export default listarFacturasTool;
