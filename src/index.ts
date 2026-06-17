// src/index.ts  ← REWRITTEN: HTTP entry point replacing StdioServerTransport
import "dotenv/config";
import express from "express";
import cors from "cors";
import { mkdir } from "fs/promises";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { tenantStorage } from "./lib/tenant.js";
import { authMiddleware } from "./middleware/auth.js";
import { uploadRouter } from "./routes/upload.js";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { createMcpServer } from "./server.js";
import { ENV } from "./config/environments.js";

const app = express();
app.use(cors({
  // En producción, solo permitimos nuestra URL oficial. En dev, permitimos todo para pruebas.
  origin: ENV.ENVIRONMENT === "dev" 
    ? "*" 
    : ["https://facturalista.app"] // Cámbialo por tu dominio final si lo tienes
}));
app.use(express.json());

// Ensure upload directory exists on startup
const uploadDir = ENV.UPLOAD_DIR ?? "./uploads";
await mkdir(uploadDir, { recursive: true });

// ── MCP endpoint ─────────────────────────────────────────────────────────────
// Stateless: one McpServer per request. empresaId is isolated per request via
// AsyncLocalStorage so Track B services can read it without signature changes.
app.post("/mcp", authMiddleware, async (req, res) => {
  try {
    await tenantStorage.run({ empresaId: req.empresaId }, async () => {
      const server = await createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
  } catch (err) {
    if (!res.headersSent) {
      const message = err instanceof Error ? err.message : "MCP internal error";
      res.status(500).json({ error: message });
    }
  }
});

import jwt from "jsonwebtoken";

// ── Dev Token Endpoint (SOLO en entorno dev) ─────────────────────────────────
if (ENV.ENVIRONMENT === "dev") {
  app.get("/auth/dev-token", (_req, res) => {
    try {
      const secret = ENV.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: "JWT_SECRET no configurado en el servidor." });
        return;
      }
      const token = jwt.sign({ empresaId: "empresa-test-01" }, secret, { expiresIn: "8h" });
      res.json({ token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ── Auth endpoint for frontend login ───────────────────────────────────────
app.use("/auth", authRouter);

// ── Upload ────────────────────────────────────────────────────────────────────
app.use("/upload", uploadRouter);
app.use("/api/upload", uploadRouter);

// ── REST API for frontend (reuses Track B services) ──────────────────────────
app.use("/api", apiRouter);

// ── Static Files ──────────────────────────────────────────────────────────────
app.use(express.static("public"));

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(ENV.PORT ?? 3000);
app.listen(PORT, () =>
  console.log(`[Cochatech-Server] HTTP MCP server listening on port ${PORT}`),
);
