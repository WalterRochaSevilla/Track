import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in environment or .env');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log('Conectado a la BD, creando tablas si faltan...');

  const sql = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS empresa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nit text NOT NULL,
    razon_social text NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS empresa_nit_unique ON empresa (nit);

  CREATE TABLE IF NOT EXISTS factura (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL,
    tipo text NOT NULL,
    nit_emisor text NOT NULL,
    razon_social_emisor text NOT NULL,
    numero_factura text NOT NULL,
    numero_autorizacion text,
    fecha_emision timestamptz NOT NULL,
    nit_comprador text,
    importe_total numeric(12,2) NOT NULL,
    descuentos numeric(12,2) DEFAULT 0,
    base_credito_fiscal numeric(12,2) NOT NULL,
    hash_dedup text NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS factura_empresa_hash_unique ON factura (empresa_id, hash_dedup);

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'factura_empresa_id_empresa_id_fk'
    ) THEN
      ALTER TABLE factura ADD CONSTRAINT factura_empresa_id_empresa_id_fk FOREIGN KEY (empresa_id) REFERENCES empresa(id);
    END IF;
  END
  $$;
  `;

  await client.query(sql);
  console.log('Tablas creadas/aseguradas OK');
  await client.end();
}

main().catch((err) => {
  console.error('Error creando tablas:', err);
  process.exit(1);
});
