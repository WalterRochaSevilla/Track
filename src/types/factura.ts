export type TipoFactura = "compra" | "venta";

export interface Factura {
  empresaId: string;
  tipo: TipoFactura;
  nitEmisor: string;
  razonSocialEmisor: string;
  numeroFactura: string;
  numeroAutorizacion?: string;
  fechaEmision: string; // YYYY-MM-DD
  nitComprador: string;
  importeTotal: number;
  descuentos: number;
  importeBaseCreditoFiscal: number;
}

export interface FacturaExtraida {
  campos: Partial<Factura>;
  confianza: Partial<Record<keyof Factura, number>>;
}

export interface ResultadoValidacion {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  hashDedup: string;
  creditoFiscal: number;
}