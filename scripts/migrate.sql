-- Track C: uploads table
-- Run once against your PostgreSQL database before using POST /upload.

CREATE TABLE IF NOT EXISTS uploads (
  doc_id        TEXT        PRIMARY KEY,
  empresa_id    TEXT        NOT NULL,
  original_name TEXT        NOT NULL,
  stored_path   TEXT        NOT NULL,
  mimetype      TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_empresa_id
  ON uploads (empresa_id);

CREATE INDEX IF NOT EXISTS idx_uploads_created_at
  ON uploads (created_at DESC);