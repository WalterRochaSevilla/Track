import { z } from "zod";

export const registrarFacturaSchema = {
  empresaId: z.uuid(),
  tipo: z.enum(["compra", "venta"]),
  nitEmisor: z.string(),
  razonSocialEmisor: z.string(),
  numeroFactura: z.string(),
  numeroAutorizacion: z.string().nullable(),
  fechaEmision: z.iso.datetime({ offset: true, local: true }),
  nitComprador: z.string().nullable(),
  importeTotal: z.number(),
  descuentos: z.number(),
  importeBaseCreditoFiscal: z.number(),
};

export type RegistrarFacturaInput = z.infer<
  z.ZodObject<typeof registrarFacturaSchema>
>;
