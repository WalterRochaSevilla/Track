import { db } from "../database/db.js";
import { DrizzleFacturaRepository } from "../database/repositories/infraestructure/DrizzleFacturaRepository.js";
import { FacturaService } from "../services/FacturaService.js";
import { ExportarLCV } from "../use_cases/ExportarLCV.js";
import { GenerarResumenIVA } from "../use_cases/GenerarResumenIVA.js";
import { ListarFacturas } from "../use_cases/listar_facturas.js";
import { RegistrarFactura } from "../use_cases/registrarFactura.js";

const repository = new DrizzleFacturaRepository(db);

export const facturaService = new FacturaService(
  new RegistrarFactura(repository),
  new ListarFacturas(repository),
  new GenerarResumenIVA(repository),
  new ExportarLCV(repository),
);
