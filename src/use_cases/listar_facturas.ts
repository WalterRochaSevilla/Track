import { IFacturaRepository } from "../database/repositories/interfaces/IFacturaRepository.js";

export class ListarFacturas {
  constructor(private readonly repository: IFacturaRepository) {}

  execute(empresaId: string, fechaInicio: Date, fechaFin: Date) {
    return this.repository.findByPeriodo(empresaId, fechaInicio, fechaFin);
  }
}
