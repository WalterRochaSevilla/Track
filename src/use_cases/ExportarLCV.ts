import { json2csv } from "json-2-csv";
import { Factura } from "../database/entities/Factura.js";
import { IFacturaRepository } from "../database/repositories/interfaces/IFacturaRepository.js";

export class ExportarLCV {
  constructor(private readonly repository: IFacturaRepository) {}

  generarCSV(facturas: Factura[]) {
    return json2csv(facturas);
  }
  async execute(empresaId: string, fechaInicio: Date, fechaFin: Date) {
    const facturas = await this.repository.findByPeriodo(
      empresaId,
      fechaInicio,
      fechaFin,
    );

    return {
      csv: this.generarCSV(facturas),
    };
  }
}
