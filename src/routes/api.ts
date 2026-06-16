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

apiRouter.post("/registrar", async (_req: Request, res: Response) => {
  let dto = _req.body as RegistrarFacturaInput;
  try {
    const response = await facturaService.registrar(dto);
    res.json(JSON.stringify(response));
    res.status(HttpStatusCode.Created);
  } catch (error) {}
});

apiRouter.get("/facturas", async (_req: Request, res: Response) => {
  let fechaInicio = _req.query.fechaInicio;
  let fechaFin = _req.query.fechaFin;
  if (fechaFin == null || fechaInicio == null) {
    res.status(HttpStatusCode.BadRequest);
    res.json({
      error: "invalid query parameter",
    });
  }
  try {
    const dto = {
      empresaId: _req.empresaId,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    } as ListarFacturasInput;
    const response = await facturaService.listar(dto);
    res.json(JSON.stringify(response));
    res.status(HttpStatusCode.Ok);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError);
    res.json(JSON.stringify(error));
  }
});

apiRouter.get("/resumen", async (_req: Request, res: Response) => {
  let fechaInicio = _req.query.fechaInicio;
  let fechaFin = _req.query.fechaFin;
  if (fechaFin == null || fechaInicio == null) {
    res.status(HttpStatusCode.BadRequest);
    res.json({
      error: "invalid query parameter",
    });
  }
  try {
    const dto = {
      empresaId: _req.empresaId,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    } as GenerarResumenIVAInput;
    const response = await facturaService.resumenIVA(dto);
    res.json(JSON.stringify(response));
    res.status(HttpStatusCode.Ok);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError);
    res.json(JSON.stringify(error));
  }
});

apiRouter.get("/exportar", async (_req: Request, res: Response) => {
  let fechaInicio = _req.query.fechaInicio;
  let fechaFin = _req.query.fechaFin;
  if (fechaFin == null || fechaInicio == null) {
    res.status(HttpStatusCode.BadRequest);
    res.json({
      error: "invalid query parameter",
    });
  }
  try {
    const dto = {
      empresaId: _req.empresaId,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    } as ExportarLCVInput;
    const response = await facturaService.exportarLCV(dto);
    res.json(JSON.stringify(response));
    res.status(HttpStatusCode.Ok);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError);
    res.json(JSON.stringify(error));
  }
});

