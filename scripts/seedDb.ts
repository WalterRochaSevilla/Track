import postgres from "postgres";
import { ENV } from "../src/config/environments.js";

const sql = postgres(ENV.DATABASE_URL, { ssl: "require" });

async function main() {
  console.log("Conectando a la DB...");

  const empresaId = "f69b7f4a-4b79-44a6-af0f-b8f9a0b7e8df";
  const userId = empresaId;

  console.log("Creando empresa de prueba...");
  await sql`
    INSERT INTO empresa (id, nit, razon_social)
    VALUES (${empresaId}, '1234567015', 'Cochatech SRL')
    ON CONFLICT (id) DO NOTHING;
  `;

  console.log("Insertando factura de prueba...");
  await sql`
    INSERT INTO factura (
      id,
      empresa_id,
      tipo,
      nit_emisor,
      razon_social_emisor,
      numero_factura,
      numero_autorizacion,
      fecha_emision,
      nit_comprador,
      importe_total,
      descuentos,
      base_credito_fiscal,
      hash_dedup
    ) VALUES (
      gen_random_uuid(),
      ${empresaId},
      'venta',
      'Cochatech SRL',
      'Cochatech Servicios',
      'F001-00001234',
      'AUTH-123456',
      now() - interval '30 days',
      '87654321',
      1500.00,
      0.00,
      1500.00,
      'hash-prueba-001'
    ) ON CONFLICT DO NOTHING;
  `;

  console.log("Datos de prueba insertados correctamente.");
  await sql.end({ timeout: 5 });
}

main().catch((error) => {
  console.error("Error al sembrar la DB:", error);
  process.exit(1);
});