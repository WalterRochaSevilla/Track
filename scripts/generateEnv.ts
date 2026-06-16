import * as fs from "fs";
import dotenv from "dotenv";

// 1. Cargamos el .env de la raíz (Node lo busca automáticamente)
dotenv.config();
console.log("📝 [Prebuild] Leyendo configuración base desde .env");

// 2. Si el .env dice que estamos en 'dev', cargamos el .env.local encima
if (process.env.ENVIRONMENT === "dev") {
  dotenv.config({ path: ".env.local", override: true });
  console.log(
    "🔄 [Prebuild] Modo DEV detectado: Sobreescribiendo con .env.local",
  );
} else {
  console.log(
    `🔒 [Prebuild] Modo ${process.env.ENVIRONMENT || "prod"} detectado.`,
  );
}

// 3. Generamos el archivo de entornos en la carpeta de configuración
const envContent = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE POR EL SCRIPT DE PREBUILD
// NO EDITAR DIRECTAMENTE

export const ENV = {
  DATABASE_URL: "${process.env.DATABASE_URL || ""}",
  ENVIRONMENT: "${process.env.ENVIRONMENT || "prod"}",
  JWT_SECRET: "${process.env.JWT_SECRET || ""}",
  UPLOAD_DIR: "${process.env.UPLOAD_DIR || ""}",
  PORT: "${process.env.PORT || 3000}",
  GEMINI_API_KEY: "${process.env.GEMINI_API_KEY || ""}",
  GEMINI_MODEL: "${process.env.GEMINI_MODEL || "gemini-2.0-flash"}"
};
`;

// Aseguramos que exista la carpeta por si acaso
fs.mkdirSync("src/config", { recursive: true });

// Escribimos el archivo directamente usando la ruta relativa
fs.writeFileSync("src/config/environments.ts", envContent, "utf8");
console.log(`✅ [Prebuild] environments.ts guardado.`);
