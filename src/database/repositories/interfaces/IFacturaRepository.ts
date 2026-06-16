import { Factura } from "../../entities/Factura.js";

export interface IFacturaRepository {
  save(factura: Factura): Promise<Factura>;
  findById(id: string): Promise<Factura | null>;
  findByPeriodo(
    empresaId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Factura[]>;
  existsByHash(empresaId: string, hash: string): Promise<boolean>;
}
