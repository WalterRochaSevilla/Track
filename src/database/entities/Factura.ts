import type { RegistrarFacturaInput } from "../../schemas/registrarFactura.schema.js";

export type TipoFactura = "compra" | "venta";

export class Factura {
  constructor(
    public readonly empresaId: string,
    public readonly tipo: TipoFactura,
    public readonly nitEmisor: string,
    public readonly razonSocialEmisor: string,
    public readonly numeroFactura: string,
    public readonly numeroAutorizacion: string | null,
    public readonly fechaEmision: string,
    public readonly nitComprador: string | null,
    public readonly importeTotal: number,
    public readonly descuentos: number,
    public readonly importeBaseCreditoFiscal: number,
    public readonly hashDedup: string,
    public readonly id?: string,
  ) {}
  static create(data: RegistrarFacturaInput, hashDedup: string) {
    return new Factura(
      data.empresaId,
      data.tipo,
      data.nitEmisor,
      data.razonSocialEmisor,
      data.numeroFactura,
      data.numeroAutorizacion,
      data.fechaEmision,
      data.nitComprador,
      data.importeTotal,
      data.descuentos,
      data.importeBaseCreditoFiscal,
      hashDedup,
    );
  }
}
