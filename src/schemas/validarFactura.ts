import { z } from "zod";

export const validarFacturaSchema = {
  empresaId: z.string().describe("ID de la empresa (tenant)"),
  tipo: z.enum(["compra", "venta"]).describe("compra = recibida, venta = emitida"),
  nitEmisor: z.string().describe("NIT del emisor"),
  razonSocialEmisor: z.string().describe("Razón social del emisor"),
  numeroFactura: z.string().describe("Número de factura"),
  numeroAutorizacion: z.string().optional().describe("Número de autorización o CUF"),
  fechaEmision: z.string().describe("Fecha de emisión en formato YYYY-MM-DD"),
  nitComprador: z.string().describe("NIT o CI del comprador"),
  importeTotal: z.number().describe("Importe total de la factura"),
  descuentos: z.number().default(0).describe("Descuentos aplicados"),
  importeBaseCreditoFiscal: z.number().describe("Base imponible para el crédito fiscal (13%)"),
  periodo: z.string().optional().describe("Período fiscal YYYY-MM para validar la fecha"),
};