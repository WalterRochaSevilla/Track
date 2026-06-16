import { db } from "../database/db.js";
import { uploadsSchema } from "../database/schemas/uploads.js";
import { eq } from "drizzle-orm";
import { VisionExtractor } from "../services/visionExtractor.js";
import { analizarFacturaScanSchema } from "../schemas/analizarFacturaScan.schema.js";
import type { AnalizarFacturaScanInput } from "../schemas/analizarFacturaScan.schema.js";
import path from "path";

const visionExtractor = new VisionExtractor();

const analizarFacturaScanTool = {
  name: "analizarFacturaScan",
  description: "Analiza la imagen de una factura escaneada utilizando visión artificial para extraer sus datos contables y evaluar el nivel de confianza por campo.",
  schema: analizarFacturaScanSchema,
  handler: async (input: AnalizarFacturaScanInput) => {
    try {
      let finalFilePath = "";
      let finalMimeType = "image/jpeg"; // Default fallback

      if (input.docId) {
        // Query Drizzle for the metadata
        const records = await db
          .select()
          .from(uploadsSchema)
          .where(eq(uploadsSchema.docId, input.docId))
          .limit(1);

        if (!records || records.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: No se encontró ningún registro de carga con el docId '${input.docId}'.`,
              },
            ],
            isError: true,
          };
        }

        finalFilePath = records[0].storedPath;
        finalMimeType = records[0].mimetype;
      } else if (input.filePath) {
        finalFilePath = input.filePath;
        // Infer mimetype from extension
        const ext = path.extname(finalFilePath).toLowerCase();
        if (ext === ".png") {
          finalMimeType = "image/png";
        } else if (ext === ".webp") {
          finalMimeType = "image/webp";
        } else if (ext === ".heic" || ext === ".heif") {
          finalMimeType = "image/heic";
        }
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Debe proporcionar al menos un 'docId' o un 'filePath' para realizar el análisis.",
            },
          ],
          isError: true,
        };
      }

      // Perform extraction
      const resultado = await visionExtractor.extract(finalFilePath, finalMimeType);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(resultado, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error("❌ [Error en analizarFacturaScan]:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error al analizar la factura: ${error.message || error}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default analizarFacturaScanTool;
