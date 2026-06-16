import fs from "fs";
import path from "path";
import { validarFactura } from "../src/services/validarFactura.js";

interface TestCase {
  id: string;
  description: string;
  mockOcrResult: {
    campos: any;
    confianza: any;
  };
  expectedValidation: {
    valida: boolean;
    erroresCount: number;
    advertenciasCount: number;
  };
}

function runEvals() {
  console.log("==================================================");
  console.log("🧪 INICIANDO EVALUACIONES Y PRUEBAS DE MCPJAM");
  console.log("==================================================");

  const datasetPath = path.resolve("evals/dataset/cases.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ Error: No se encontró el dataset en ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, "utf-8");
  let testCases: TestCase[];

  try {
    testCases = JSON.parse(rawData);
  } catch (err: any) {
    console.error("❌ Error al parsear el archivo cases.json:", err.message);
    process.exit(1);
  }

  let totalCases = testCases.length;
  let passedCases = 0;

  console.log(`📊 Casos cargados: ${totalCases}\n`);

  testCases.forEach((tCase, index) => {
    console.log(`[Caso ${index + 1}/${totalCases}] ID: ${tCase.id}`);
    console.log(`   Descripción: ${tCase.description}`);

    // Run the validation service
    const result = validarFactura(tCase.mockOcrResult.campos, tCase.mockOcrResult.confianza);

    // Assert results
    const isValidaMatch = result.valida === tCase.expectedValidation.valida;
    const isErroresCountMatch = result.errores.length === tCase.expectedValidation.erroresCount;
    const isAdvertenciasCountMatch = result.advertencias.length === tCase.expectedValidation.advertenciasCount;

    const casePassed = isValidaMatch && isErroresCountMatch && isAdvertenciasCountMatch;

    if (casePassed) {
      console.log("   ✅ PASÓ");
      passedCases++;
    } else {
      console.log("   ❌ FALLÓ");
      if (!isValidaMatch) {
        console.log(`      Esperaba valida=${tCase.expectedValidation.valida}, pero obtuvo=${result.valida}`);
      }
      if (!isErroresCountMatch) {
        console.log(`      Esperaba ${tCase.expectedValidation.erroresCount} errores, pero obtuvo=${result.errores.length} (${JSON.stringify(result.errores)})`);
      }
      if (!isAdvertenciasCountMatch) {
        console.log(`      Esperaba ${tCase.expectedValidation.advertenciasCount} advertencias, pero obtuvo=${result.advertencias.length} (${JSON.stringify(result.advertencias)})`);
      }
    }
    console.log("--------------------------------------------------");
  });

  const accuracy = (passedCases / totalCases) * 100;
  console.log("\n========================= RESUMEN =========================");
  console.log(`📈 Casos Ejecutados: ${totalCases}`);
  console.log(`✅ Casos Exitosos:   ${passedCases}`);
  console.log(`❌ Casos Fallidos:   ${totalCases - passedCases}`);
  console.log(`🎯 Precisión (Accuracy): ${accuracy.toFixed(1)}%`);
  console.log("===========================================================");

  if (passedCases === totalCases) {
    console.log("🎉 ¡Todos los evals corrieron y pasaron correctamente!");
    process.exit(0);
  } else {
    console.error("⚠️ Algunos casos de prueba fallaron.");
    process.exit(1);
  }
}

runEvals();
