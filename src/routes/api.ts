// src/routes/api.ts
import { Router, type Request, type Response } from "express";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import { RegistrarFacturaInput } from "../schemas/registrarFactura.schema.js";
import { facturaService } from "../bootstrap/factura.js";
import { HttpStatusCode } from "axios";
import { ListarFacturasInput } from "../schemas/listarFacturas.schema.js";
import { GenerarResumenIVAInput } from "../schemas/generarResumenIVA.schema.js";
import { ExportarLCVInput } from "../schemas/exportarLCV.schema.js";
import { VisionExtractor } from "../services/visionExtractor.js";
import { validarFactura } from "../services/validarFactura.js";
import { db } from "../database/db.js";
import { uploadsSchema } from "../database/schemas/uploads.js";
import { eq, and } from "drizzle-orm";

const visionExtractor = new VisionExtractor();

export const apiRouter = Router();

// All /api routes require a valid JWT with empresaId
apiRouter.use(authMiddleware);

/** Health check — useful for frontend integration debugging */
apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

apiRouter.post("/registrar", async (req: Request, res: Response) => {
  const dto = req.body as RegistrarFacturaInput;
  try {
    const response = await facturaService.registrar(dto);
    res.status(HttpStatusCode.Created).json(response);
  } catch (error: any) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: error.message || String(error),
    });
  }
});

apiRouter.get("/facturas", async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;
  if (!fechaInicio || !fechaFin) {
    res.status(HttpStatusCode.BadRequest).json({
      error: "Missing required query parameters: fechaInicio and fechaFin",
    });
    return;
  }
  try {
    const dto = {
      empresaId: req.empresaId,
      fechaInicio: String(fechaInicio),
      fechaFin: String(fechaFin),
    } as ListarFacturasInput;
    const response = await facturaService.listar(dto);
    res.status(HttpStatusCode.Ok).json(response);
  } catch (error: any) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: error.message || String(error),
    });
  }
});

apiRouter.get("/resumen", async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;
  if (!fechaInicio || !fechaFin) {
    res.status(HttpStatusCode.BadRequest).json({
      error: "Missing required query parameters: fechaInicio and fechaFin",
    });
    return;
  }
  try {
    const dto = {
      empresaId: req.empresaId,
      fechaInicio: String(fechaInicio),
      fechaFin: String(fechaFin),
    } as GenerarResumenIVAInput;
    const response = await facturaService.resumenIVA(dto);
    res.status(HttpStatusCode.Ok).json(response);
  } catch (error: any) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: error.message || String(error),
    });
  }
});

apiRouter.get("/exportar", async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;
  if (!fechaInicio || !fechaFin) {
    res.status(HttpStatusCode.BadRequest).json({
      error: "Missing required query parameters: fechaInicio and fechaFin",
    });
    return;
  }
  try {
    const dto = {
      empresaId: req.empresaId,
      fechaInicio: String(fechaInicio),
      fechaFin: String(fechaFin),
    } as ExportarLCVInput;
    const response = await facturaService.exportarLCV(dto);
    res.status(HttpStatusCode.Ok).json(response);
  } catch (error: any) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: error.message || String(error),
    });
  }
});

apiRouter.post("/analizar-scan", async (req: Request, res: Response) => {
  const { docId, filePath } = req.body;

  if (!docId && !filePath) {
    res.status(HttpStatusCode.BadRequest).json({ error: "Missing docId or filePath in request body" });
    return;
  }

  try {
    let finalPath: string;
    let finalMime: string;

    if (docId) {
      // Resolve from database upload record
      // Seguridad: Filtramos por docId Y empresaId para evitar acceso no autorizado
      const records = await db
        .select()
        .from(uploadsSchema)
        .where(
          and(
            eq(uploadsSchema.docId, String(docId)),
            eq(uploadsSchema.empresaId, req.empresaId!)
          )
        )
        .limit(1);

      if (!records || records.length === 0) {
        res.status(HttpStatusCode.NotFound).json({ error: `No upload record found for docId: ${docId}` });
        return;
      }

      finalPath = records[0].storedPath;
      finalMime = records[0].mimetype;
    } else {
      // Use provided file path directly (for dataset testing)
      const rawPath = String(filePath);
      const safePath = path.resolve(rawPath);

      // Security: restrict to uploads and evals directories only
      const allowedRoots = [
        path.resolve(process.cwd(), "uploads"),
        path.resolve(process.cwd(), "evals"),
      ];
      const isAllowed = allowedRoots.some((root) => safePath.startsWith(root));
      if (!isAllowed) {
        res.status(403).json({ error: "Acceso denegado: la ruta está fuera del directorio permitido." });
        return;
      }

      finalPath = safePath;
      const ext = finalPath.split(".").pop()?.toLowerCase() || "jpg";
      const mimeMap: Record<string, string> = {
        png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        webp: "image/webp", heic: "image/heic"
      };
      finalMime = mimeMap[ext] || "image/jpeg";
    }

    const extracted = await visionExtractor.extract(finalPath, finalMime);
    const validation = validarFactura(extracted.campos, extracted.confianza);

    res.status(HttpStatusCode.Ok).json({
      extracted,
      validation
    });
  } catch (error: any) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: error.message || String(error)
    });
  }
});
