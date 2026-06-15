import { facturaService } from "../bootstrap/factura.js";
import {
  exportarLCVSchema,
  ExportarLCVInput,
} from "../schemas/exportarLCV.schema.js";

const exportarLCVTool = {
  name: "Exportar_LCV",
  description: "Exportar las facturas de un periodo determinado en un csv",
  schema: exportarLCVSchema,
  handler: async (input: ExportarLCVInput) => {
    try {
      const resultado = await facturaService.exportarLCV(input);

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

export default exportarLCVTool;
