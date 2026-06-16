import { IFacturaRepository } from "../database/repositories/interfaces/IFacturaRepository.js";

export class GenerarResumenIVA {
  constructor(private readonly repository: IFacturaRepository) {}

  async execute(empresaId: string, fechaInicio: Date, fechaFin: Date) {
    const facturas = await this.repository.findByPeriodo(
      empresaId,
      fechaInicio,
      fechaFin,
    );
    let debito = 0;
    let credito = 0;
    facturas.forEach((factura) => {
      let iva = factura.importeBaseCreditoFiscal * 0.13;
      switch (factura.tipo) {
        case "compra":
          credito += iva;
          break;
        case "venta":
          debito += iva;
          break;
        default:
          throw new Error("Tipo de factura invalida");
      }
    });
    return {
      debito,
      credito,
      saldo: debito - credito,
    };
  }
}
