import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { extraerFacturaDesdeImagen } from "../services/visionExtractor.js";

const DATASET = path.join(process.cwd(), "evals", "dataset");
const CAMPOS = ["nitEmisor", "numeroFactura", "fechaEmision", "importeTotal", "importeBaseCreditoFiscal"];

function mimePorExtension(archivo: string): string {
  return archivo.endsWith(".png") ? "image/png" : "image/jpeg";
}

async function main() {
  const archivos = fs.readdirSync(DATASET).filter((f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png"));
  const aciertos: Record<string, number> = Object.fromEntries(CAMPOS.map((c) => [c, 0]));
  let total = 0;

  for (const img of archivos) {
    const esperadoPath = path.join(DATASET, img.replace(/\.(jpg|jpeg|png)$/, ".expected.json"));
    if (!fs.existsSync(esperadoPath)) continue;
    const esperado = JSON.parse(fs.readFileSync(esperadoPath, "utf-8"));
    const base64 = fs.readFileSync(path.join(DATASET, img)).toString("base64");

    const { campos } = await extraerFacturaDesdeImagen({ imagenBase64: base64, mimeType: mimePorExtension(img) });
    total++;

    for (const campo of CAMPOS) {
      if (esperado[campo] === undefined) continue;
      const ok = String((campos as any)[campo]) === String(esperado[campo]);
      if (ok) aciertos[campo]++;
      else console.error(`[${img}] ${campo}: esperaba "${esperado[campo]}", obtuve "${(campos as any)[campo]}"`);
    }
  }

  console.log(`\nPrecisión por campo (sobre ${total} facturas):`);
  for (const campo of CAMPOS) {
    const pct = total ? ((aciertos[campo] / total) * 100).toFixed(1) : "0";
    console.log(`  ${campo.padEnd(28)} ${pct}%`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});