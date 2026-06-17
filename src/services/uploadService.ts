// src/services/uploadService.ts
import { v4 as uuidv4 } from 'uuid';
import { db } from "../database/db.js";
import { uploadsSchema } from "../database/schemas/uploads.js";

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

  await db.insert(uploadsSchema).values({
    docId,
    empresaId: record.empresaId,
    originalName: record.originalName,
    storedPath: record.storedPath,
    mimetype: record.mimetype,
    createdAt: new Date(),
  });

  return docId;
}