import { db } from "../database/db.js";
import { uploadsSchema } from "../database/schemas/uploads.js";
import { eq } from "drizzle-orm";
import { VisionExtractor, FacturaExtraida } from "../services/visionExtractor.js";
import { validarFactura, FacturaValidationResult } from "../services/validarFactura.js";
import { analizarFacturaScanSchema } from "../schemas/analizarFacturaScan.schema.js";
import type { AnalizarFacturaScanInput } from "../schemas/analizarFacturaScan.schema.js";
import path from "path";

const visionExtractor = new VisionExtractor();

/**
 * Builds a professional, structured analysis report from the extraction and validation results.
 */
function buildReport(
  extracted: FacturaExtraida,
  validation: FacturaValidationResult,
  sourceInfo: string
): string {
  const { campos, confianza, metadatos } = extracted;
  const iva13 = (Number(campos.importeBaseCreditoFiscal) || 0) * 0.13;

  // Confidence bar generator
  const bar = (v: number): string => {
    const pct = Math.round(v * 100);
    const filled = Math.round(v * 10);
    const empty = 10 - filled;
    const emoji = pct >= 90 ? "🟢" : pct >= 70 ? "🟡" : "🔴";
    return `${emoji} ${"█".repeat(filled)}${"░".repeat(empty)} ${pct}%`;
  };

  // Average confidence
  const confValues = Object.values(confianza);
  const avgConf = confValues.length > 0
    ? confValues.reduce((a, b) => a + b, 0) / confValues.length
    : 0;

  // Status badge
  const statusBadge = validation.valida
    ? "✅ FACTURA VÁLIDA"
    : "❌ FACTURA CON ERRORES";

  const warningCount = validation.advertencias.length;
  const errorCount = validation.errores.length;

  let report = `═══════════════════════════════════════════════════
📋  INFORME DE ANÁLISIS FISCAL — FacturaLista
═══════════════════════════════════════════════════
📁  Origen: ${sourceInfo}
📅  Análisis: ${new Date().toISOString().slice(0, 19).replace("T", " ")}
🏷️  Estado: ${statusBadge}
📊  Confianza promedio: ${bar(avgConf)}

───────────────────────────────────────────────────
🏢  DATOS DEL EMISOR
───────────────────────────────────────────────────
  NIT Emisor:           ${campos.nitEmisor || "—"}  ${bar(confianza.nitEmisor || 0)}
  Razón Social:         ${campos.razonSocialEmisor || "—"}  ${bar(confianza.razonSocialEmisor || 0)}
  Actividad Económica:  ${metadatos?.actividadEconomica || "No detectada"}
  Lugar de Emisión:     ${metadatos?.lugarEmision || "No detectado"}

───────────────────────────────────────────────────
📄  DATOS DE LA FACTURA
───────────────────────────────────────────────────
  Tipo:                 ${(campos.tipo || "—").toUpperCase()}  ${bar(confianza.tipo || 0)}
  Nro. Factura:         ${campos.numeroFactura || "—"}  ${bar(confianza.numeroFactura || 0)}
  Fecha de Emisión:     ${campos.fechaEmision || "—"}  ${bar(confianza.fechaEmision || 0)}
  Modalidad:            ${metadatos?.modalidadFacturacion || "Desconocida"}
  Nro. Autorización:    ${campos.numeroAutorizacion || "—"}  ${bar(confianza.numeroAutorizacion || 0)}`;

  if (metadatos?.cuf) {
    report += `\n  CUF:                  ${metadatos.cuf}`;
  }
  if (metadatos?.codigoControl) {
    report += `\n  Código de Control:    ${metadatos.codigoControl}`;
  }

  report += `

───────────────────────────────────────────────────
👤  DATOS DEL COMPRADOR
───────────────────────────────────────────────────
  NIT Comprador:        ${campos.nitComprador || "—"}  ${bar(confianza.nitComprador || 0)}

───────────────────────────────────────────────────
💰  DETALLE MONETARIO (Bs)
───────────────────────────────────────────────────
  Importe Total:        Bs. ${formatMoney(campos.importeTotal)}  ${bar(confianza.importeTotal || 0)}
  (-) Descuentos:       Bs. ${formatMoney(campos.descuentos)}  ${bar(confianza.descuentos || 0)}
  ─────────────────────────────────────────────
  Base Crédito Fiscal:  Bs. ${formatMoney(campos.importeBaseCreditoFiscal)}  ${bar(confianza.importeBaseCreditoFiscal || 0)}
  IVA 13% (calculado):  Bs. ${formatMoney(iva13)}`;

  if (metadatos?.literalTotal) {
    report += `\n  Literal:              "${metadatos.literalTotal}"`;
  }

  if (metadatos?.leyenda) {
    report += `\n\n───────────────────────────────────────────────────
📜  LEYENDA FISCAL
───────────────────────────────────────────────────
  "${metadatos.leyenda}"`;
  }

  // Validation results section
  report += `\n
═══════════════════════════════════════════════════
🔍  RESULTADO DE VALIDACIÓN FISCAL
═══════════════════════════════════════════════════`;

  if (errorCount === 0 && warningCount === 0) {
    report += `\n  ✅ Todos los controles pasaron satisfactoriamente.
  ✅ Formato de NIT válido.
  ✅ Aritmética de montos consistente (Total - Descuento = Base).
  ✅ Fecha en formato correcto.
  ✅ Todos los campos con confianza adecuada (≥70%).`;
  } else {
    if (errorCount > 0) {
      report += `\n\n  ❌ ERRORES ENCONTRADOS (${errorCount}):`;
      validation.errores.forEach((e, i) => {
        report += `\n     ${i + 1}. ${e}`;
      });
    }
    if (warningCount > 0) {
      report += `\n\n  ⚠️  ADVERTENCIAS (${warningCount}):`;
      validation.advertencias.forEach((a, i) => {
        report += `\n     ${i + 1}. ${a}`;
      });
    }
  }

  report += `\n
═══════════════════════════════════════════════════
📊  RESUMEN DE CONFIANZA POR CAMPO
═══════════════════════════════════════════════════`;

  const fieldLabels: Record<string, string> = {
    tipo: "Tipo factura",
    nitEmisor: "NIT Emisor",
    razonSocialEmisor: "Razón Social",
    numeroFactura: "Nro. Factura",
    numeroAutorizacion: "Autorización/CUF",
    fechaEmision: "Fecha Emisión",
    nitComprador: "NIT Comprador",
    importeTotal: "Importe Total",
    descuentos: "Descuentos",
    importeBaseCreditoFiscal: "Base Créd. Fiscal",
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    const val = confianza[key] ?? 0;
    report += `\n  ${label.padEnd(22)} ${bar(val)}`;
  }

  report += `\n
═══════════════════════════════════════════════════
  Generado por FacturaLista — Sistema MCP de
  Digitalización Contable para PYMEs Bolivianas
═══════════════════════════════════════════════════`;

  return report;
}

function formatMoney(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0.00";
  return Number(value).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const analizarFacturaScanTool = {
  name: "analizarFacturaScan",
  description:
    "Analiza la imagen de una factura boliviana escaneada utilizando visión artificial (Gemini Flash). Extrae campos contables, metadatos fiscales (CUF, modalidad, leyenda) y ejecuta validación determinista (NIT Módulo 11, aritmética IVA). Retorna un informe profesional completo.",
  schema: analizarFacturaScanSchema,
  handler: async (input: AnalizarFacturaScanInput) => {
    try {
      let finalFilePath = "";
      let finalMimeType = "image/jpeg";
      let sourceInfo = "";

      if (input.docId) {
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
        sourceInfo = `Upload docId: ${input.docId} (${records[0].originalName})`;
      } else if (input.filePath) {
        finalFilePath = input.filePath;
        sourceInfo = `Archivo local: ${path.basename(finalFilePath)}`;
        const ext = path.extname(finalFilePath).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png",
          ".webp": "image/webp",
          ".heic": "image/heic",
          ".heif": "image/heif",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
        };
        finalMimeType = mimeMap[ext] || "image/jpeg";
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

      // Step 1: Extract via Gemini Vision
      const extracted = await visionExtractor.extract(finalFilePath, finalMimeType);

      // Step 2: Run deterministic validation
      const validationResult = validarFactura(extracted.campos, extracted.confianza);

      // Step 3: Build the professional report
      const report = buildReport(extracted, validationResult, sourceInfo);

      // Return both the human-readable report AND the raw JSON for programmatic use
      return {
        content: [
          {
            type: "text" as const,
            text: report,
          },
          {
            type: "text" as const,
            text: `\n--- DATOS ESTRUCTURADOS (JSON) ---\n${JSON.stringify(
              {
                extraccion: extracted,
                validacion: validationResult,
              },
              null,
              2
            )}`,
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
