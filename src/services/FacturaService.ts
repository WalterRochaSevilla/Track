import { Factura } from "../database/entities/Factura.js";
import { ExportarLCV } from "../use_cases/ExportarLCV.js";
import { GenerarResumenIVA } from "../use_cases/GenerarResumenIVA.js";
import { ListarFacturas } from "../use_cases/listar_facturas.js";
import { RegistrarFactura } from "../use_cases/registrarFactura.js";
import type { RegistrarFacturaInput } from "../schemas/registrarFactura.schema.js";
import { createHash } from "node:crypto";
import { ListarFacturasInput } from "../schemas/listarFacturas.schema.js";
import { GenerarResumenIVAInput } from "../schemas/generarResumenIVA.schema.js";
import { ExportarLCVInput } from "../schemas/exportarLCV.schema.js";
import { db } from "../database/db.js";
import { DrizzleFacturaRepository } from "../database/repositories/infraestructure/DrizzleFacturaRepository.js";

export class FacturaService {
  constructor(
    private readonly registrarFacturaUseCase: RegistrarFactura,
    private readonly listarFacturasUseCase: ListarFacturas,
    private readonly generarResumenIVAUseCase: GenerarResumenIVA,
    private readonly exportarLCVUseCase: ExportarLCV,
  ) {}

  private generateHash(factura: RegistrarFacturaInput) {
    const payload = [
      factura.nitEmisor,
      factura.numeroFactura,
      factura.fechaEmision,
      factura.importeTotal,
    ].join("|");
    return createHash("sha256").update(payload).digest("hex");
  }

  registrar(input: RegistrarFacturaInput) {
    const factura = Factura.create(input, this.generateHash(input));
    return this.registrarFacturaUseCase.execute(factura);
  }

  listar(input: ListarFacturasInput) {
    return this.listarFacturasUseCase.execute(
      input.empresaId,
      input.fechaInicio ? new Date(input.fechaInicio) : undefined,
      input.fechaFin ? new Date(input.fechaFin) : undefined,
    );
  }

  resumenIVA(input: GenerarResumenIVAInput) {
    return this.generarResumenIVAUseCase.execute(
      input.empresaId,
      new Date(input.fechaInicio),
      new Date(input.fechaFin),
    );
  }

  exportarLCV(input: ExportarLCVInput) {
    return this.exportarLCVUseCase.execute(
      input.empresaId,
      new Date(input.fechaInicio),
      new Date(input.fechaFin),
    );
  }
  
  async delete(input: { empresaId: string; id: string }) {
    // Use repository directly to perform deleteById
    const repo = new DrizzleFacturaRepository(db);
    await repo.deleteById(input.empresaId, input.id);
    return { success: true };
  }
}
