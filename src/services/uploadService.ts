// src/services/uploadService.ts
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Singleton pool for this service. Uses DATABASE_URL from environment.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface UploadRecord {
  empresaId: string;
  originalName: string;
  storedPath: string;
  mimetype: string;
}

/**
 * Persists upload metadata and returns the generated docId (UUID v4).
 * The caller is responsible for ensuring the uploads table exists (see migrate.sql).
 */
export async function saveUpload(record: UploadRecord): Promise<string> {
  const docId = uuidv4();

  await pool.query(
    `INSERT INTO uploads (doc_id, empresa_id, original_name, stored_path, mimetype, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [docId, record.empresaId, record.originalName, record.storedPath, record.mimetype]
  );

  return docId;
}