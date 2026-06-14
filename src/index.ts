// src/index.ts  ← REWRITTEN: HTTP entry point replacing StdioServerTransport
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mkdir } from 'fs/promises';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { tenantStorage } from './lib/tenant.js';
import { authMiddleware } from './middleware/auth.js';
import { uploadRouter } from './routes/upload.js';
import { apiRouter } from './routes/api.js';
import { createMcpServer } from './server.js';

const app = express();
app.use(cors());
app.use(express.json());

// Ensure upload directory exists on startup
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
await mkdir(uploadDir, { recursive: true });

// ── MCP endpoint ─────────────────────────────────────────────────────────────
// Stateless: one McpServer per request. empresaId is isolated per request via
// AsyncLocalStorage so Track B services can read it without signature changes.
app.post('/mcp', authMiddleware, async (req, res) => {
  try {
    await tenantStorage.run({ empresaId: req.empresaId }, async () => {
      const server = await createMcpServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
  } catch (err) {
    if (!res.headersSent) {
      const message = err instanceof Error ? err.message : 'MCP internal error';
      res.status(500).json({ error: message });
    }
  }
});

// ── Upload ────────────────────────────────────────────────────────────────────
app.use('/upload', uploadRouter);

// ── REST API for frontend (reuses Track B services) ──────────────────────────
app.use('/api', apiRouter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () =>
  console.log(`[Cochatech-Server] HTTP MCP server listening on port ${PORT}`)
);