// src/routes/api.ts
import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { RegistrarFacturaInput } from "../schemas/registrarFactura.schema.js";
import { facturaService } from "../bootstrap/factura.js";
import { HttpStatusCode } from "axios";
import { ListarFacturasInput } from "../schemas/listarFacturas.schema.js";
import { GenerarResumenIVAInput } from "../schemas/generarResumenIVA.shema.js";
import { ExportarLCVInput } from "../schemas/exportarLCV.schema.js";

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

