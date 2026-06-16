import fs from "fs";
import path from "path";
import { VisionExtractor } from "../src/services/visionExtractor.js";
import { validarFactura } from "../src/services/validarFactura.js";

/**
 * Script para ejecutar evals con el dataset real de facturas bolivianas.
 * Ejecuta la extracción de visión en cada imagen y luego la validación determinista.
 * Genera un informe de precisión y resultados.
 *
 * Uso: npx tsx scripts/runEvalsReal.ts
 */

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

interface EvalResult {
  filename: string;
  success: boolean;
  tipo: string;
  emisor: string;
  nit: string;
  total: number;
  valida: boolean;
  erroresCount: number;
  advertenciasCount: number;
  confianzaPromedio: number;
  errorMessage?: string;
  durationMs: number;
}

async function runEvalsReal() {
  const datasetDir = path.resolve("evals/dataset_real");

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  🧪 FACTURALISTA — EVALUACIÓN CON DATASET REAL             ║");
  console.log("║  📍 Facturas Bolivianas del Servicio de Impuestos (SIN)    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  if (!fs.existsSync(datasetDir)) {
    console.error(`❌ No se encontró el directorio de dataset real: ${datasetDir}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(datasetDir);
  const imageFiles = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.error("❌ No se encontraron imágenes en el directorio de dataset real.");
    process.exit(1);
  }

  console.log(`📁 Directorio: ${datasetDir}`);
  console.log(`📊 Imágenes encontradas: ${imageFiles.length}`);
  console.log(`📋 Formatos soportados: ${SUPPORTED_EXTENSIONS.join(", ")}`);
  console.log();

  const extractor = new VisionExtractor();
  const results: EvalResult[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const filePath = path.join(datasetDir, file);
    const ext = path.extname(file).toLowerCase();
    const mime = MIME_MAP[ext] || "image/jpeg";

    console.log(`┌─ [${i + 1}/${imageFiles.length}] ${file}`);
    console.log(`│  Formato: ${ext.toUpperCase().slice(1)} | MIME: ${mime}`);

    const startTime = Date.now();

    try {
      // Step 1: Extract via Gemini
      const extracted = await extractor.extract(filePath, mime);
      const durationMs = Date.now() - startTime;

      // Step 2: Validate
      const validation = validarFactura(extracted.campos, extracted.confianza);

      // Calculate average confidence
      const confValues = Object.values(extracted.confianza);
      const avgConf = confValues.length > 0
        ? confValues.reduce((a, b) => a + b, 0) / confValues.length
        : 0;

      const result: EvalResult = {
        filename: file,
        success: true,
        tipo: String(extracted.campos.tipo || "?"),
        emisor: String(extracted.campos.razonSocialEmisor || "Desconocido"),
        nit: String(extracted.campos.nitEmisor || "?"),
        total: Number(extracted.campos.importeTotal || 0),
        valida: validation.valida,
        erroresCount: validation.errores.length,
        advertenciasCount: validation.advertencias.length,
        confianzaPromedio: avgConf,
        durationMs,
      };

      results.push(result);

      const statusIcon = validation.valida ? "✅" : "⚠️";
      const confIcon = avgConf >= 0.9 ? "🟢" : avgConf >= 0.7 ? "🟡" : "🔴";

      console.log(`│  ${statusIcon} Tipo: ${result.tipo.toUpperCase()} | Emisor: ${result.emisor}`);
      console.log(`│  💰 Total: Bs. ${result.total.toFixed(2)} | NIT: ${result.nit}`);
      console.log(`│  ${confIcon} Confianza: ${(avgConf * 100).toFixed(1)}% | ⏱️ ${durationMs}ms`);

      if (validation.errores.length > 0) {
        console.log(`│  ❌ Errores: ${validation.errores.join(" | ")}`);
      }
      if (validation.advertencias.length > 0) {
        console.log(`│  ⚠️  Advertencias: ${validation.advertencias.join(" | ")}`);
      }

      // Show metadata if available
      if (extracted.metadatos) {
        const meta = extracted.metadatos;
        console.log(`│  📋 Modalidad: ${meta.modalidadFacturacion || "?"}`);
        if (meta.cuf) console.log(`│  🔑 CUF: ${meta.cuf.substring(0, 30)}...`);
        if (meta.codigoControl) console.log(`│  🔐 Cód. Control: ${meta.codigoControl}`);
        if (meta.lugarEmision) console.log(`│  📍 Lugar: ${meta.lugarEmision}`);
      }

    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      results.push({
        filename: file,
        success: false,
        tipo: "?",
        emisor: "Error",
        nit: "?",
        total: 0,
        valida: false,
        erroresCount: 0,
        advertenciasCount: 0,
        confianzaPromedio: 0,
        errorMessage: error.message || String(error),
        durationMs,
      });
      console.log(`│  ❌ ERROR: ${error.message || error}`);
    }

    console.log(`└──────────────────────────────────────────────────`);
    console.log();
    // Sleep 4 seconds between images to respect Gemini API rate limits
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  // ============ SUMMARY ============
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const valid = successful.filter((r) => r.valida);
  const avgConfTotal = successful.length > 0
    ? successful.reduce((a, b) => a + b.confianzaPromedio, 0) / successful.length
    : 0;
  const avgDuration = results.length > 0
    ? results.reduce((a, b) => a + b.durationMs, 0) / results.length
    : 0;
  const totalBs = successful.reduce((a, b) => a + b.total, 0);

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                📊 RESUMEN DE EVALUACIÓN                    ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Total imágenes procesadas:       ${String(results.length).padStart(4)}                    ║`);
  console.log(`║  ✅ Extracción exitosa:            ${String(successful.length).padStart(4)}                    ║`);
  console.log(`║  ❌ Extracción fallida:             ${String(failed.length).padStart(4)}                    ║`);
  console.log(`║  ✅ Validación fiscal aprobada:     ${String(valid.length).padStart(4)}                    ║`);
  console.log(`║  🎯 Tasa de extracción:          ${((successful.length / results.length) * 100).toFixed(1).padStart(6)}%                  ║`);
  console.log(`║  🎯 Tasa de validación:           ${((valid.length / Math.max(successful.length, 1)) * 100).toFixed(1).padStart(6)}%                  ║`);
  console.log(`║  📊 Confianza promedio:            ${(avgConfTotal * 100).toFixed(1).padStart(6)}%                  ║`);
  console.log(`║  ⏱️  Tiempo promedio por factura:  ${avgDuration.toFixed(0).padStart(6)}ms                  ║`);
  console.log(`║  💰 Total facturado procesado:   Bs. ${totalBs.toFixed(2).padStart(10)}            ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Write results JSON
  const outputPath = path.resolve("evals/dataset_real/eval_results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n📁 Resultados detallados guardados en: ${outputPath}`);

  if (failed.length > 0) {
    console.log("\n⚠️  Algunas facturas no pudieron ser procesadas.");
    process.exit(1);
  } else {
    console.log("\n🎉 ¡Evaluación completada exitosamente!");
    process.exit(0);
  }
}

runEvalsReal();
