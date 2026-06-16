import { facturaService } from "../bootstrap/factura.js";
import {
  GenerarResumenIVAInput,
  generarResumenIVASchema,
} from "../schemas/generarResumenIVA.shema.js";

const generarResumenIVATool = {
  name: "generarResumenIVA",
  description: "Generar un Resumen del IVA atravez de un periodo de tiempo",
  schema: generarResumenIVASchema,
  handler: async (input: GenerarResumenIVAInput) => {
    try {
      const resultado = await facturaService.resumenIVA(input);
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

export default generarResumenIVATool;
