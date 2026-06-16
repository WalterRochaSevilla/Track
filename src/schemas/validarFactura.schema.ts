import { z } from "zod";

export const validarFacturaSchema = z.object({
  factura: z.object({
    tipo: z.enum(["compra", "venta"]).optional(),
    nitEmisor: z.string().optional(),
    razonSocialEmisor: z.string().optional(),
    numeroFactura: z.string().optional(),
    numeroAutorizacion: z.string().optional(),
    fechaEmision: z.string().optional(),
    nitComprador: z.string().optional(),
    importeTotal: z.number().optional(),
    descuentos: z.number().optional(),
    importeBaseCreditoFiscal: z.number().optional(),
  }).describe("Los datos extraídos de la factura a validar."),
  confianzas: z.record(z.string(), z.number()).optional().describe("Los niveles de confianza de cada campo extraído (0.0 a 1.0)."),
});

export type ValidarFacturaInput = z.infer<typeof validarFacturaSchema>;
