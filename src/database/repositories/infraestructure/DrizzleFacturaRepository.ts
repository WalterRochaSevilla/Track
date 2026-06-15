import { fa } from "zod/v4/locales";
import { db } from "../../db.js";
import { Factura } from "../../entities/Factura.js";
import { facturaSchema } from "../../schemas/factura.js";
import { IFacturaRepository } from "../interfaces/IFacturaRepository.js";
import { and, between, eq } from "drizzle-orm";

type DbClient = typeof db;

export class DrizzleFacturaRepository implements IFacturaRepository {
  constructor(private readonly db: DbClient) {}

  private toModel(row: typeof facturaSchema.$inferSelect): Factura {
    return new Factura(
      row.empresaId,
      row.tipo as "compra" | "venta",
      row.nitEmisor,
      row.razonSocialEmisor,
      row.numeroFactura,
      row.numeroAutorizacion,
      row.fechaEmision,
      row.nitComprador,
      Number(row.importeTotal),
      Number(row.descuentos),
      Number(row.baseCreditoFiscal),
      row.hashDedup,
      row.id,
    );
  }

  private toEntity(factura: Factura) {
    return {
      id: factura.id ?? crypto.randomUUID(),
      empresaId: factura.empresaId,
      tipo: factura.tipo,
      nitEmisor: factura.nitEmisor,
      razonSocialEmisor: factura.razonSocialEmisor,
      numeroFactura: factura.numeroFactura,
      numeroAutorizacion: factura.numeroAutorizacion,
      nitComprador: factura.nitComprador,
      fechaEmision: factura.fechaEmision,
      importeTotal: factura.importeTotal.toString(),
      baseCreditoFiscal: factura.importeBaseCreditoFiscal.toString(),
      descuentos: factura.descuentos.toString(),
      hashDedup: factura.hashDedup,
    };
  }

  async save(factura: Factura): Promise<Factura> {
    let response = await this.db
      .insert(facturaSchema)
      .values(this.toEntity(factura))
      .returning();
    return this.toModel(response[0]);
  }
  async findById(id: string): Promise<Factura | null> {
    let response = await this.db
      .select()
      .from(facturaSchema)
      .where(eq(facturaSchema.id, id));
    return !response.length ? null : this.toModel(response[0]);
  }
  async findByPeriodo(
    empresaId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Factura[]> {
    let response = await this.db
      .select()
      .from(facturaSchema)
      .where(
        and(
          eq(facturaSchema.empresaId, empresaId),
          between(
            facturaSchema.fechaEmision,
            fechaInicio.toString(),
            fechaFin.toString(),
          ),
        ),
      );
    return response.map((row) => this.toModel(row));
  }
  async existsByHash(empresaId: string, hash: string): Promise<boolean> {
    let response = await this.db
      .select()
      .from(facturaSchema)
      .where(
        and(
          eq(facturaSchema.empresaId, empresaId),
          eq(facturaSchema.hashDedup, hash),
        ),
      );
    return response.length > 0;
  }
}
