import { IFacturaRepository } from "../database/repositories/interfaces/IFacturaRepository.js";

export class ListarFacturas {
  constructor(private readonly repository: IFacturaRepository) {}

  // Make fechaInicio/fechaFin optional. If omitted, call repository.findByPeriodo
  // with a very wide range (epoch -> now) so the API returns all invoices.
  execute(empresaId: string, fechaInicio?: Date, fechaFin?: Date) {
    const start = fechaInicio ?? new Date(0);
    const end = fechaFin ?? new Date();
    return this.repository.findByPeriodo(empresaId, start, end);
  }
}
