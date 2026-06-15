import { Factura } from "../database/entities/Factura.js";
import { IFacturaRepository } from "../database/repositories/interfaces/IFacturaRepository.js";

export class RegistrarFactura {
  constructor(private readonly repository: IFacturaRepository) {}
  async execute(factura: Factura) {
    const existe = await this.repository.existsByHash(
      factura.empresaId,
      factura.hashDedup,
    );

    if (existe) {
      return {
        duplicada: true,
      };
    }

    const guardada = await this.repository.save(factura);

    return {
      id: guardada.id,

      duplicada: false,
    };
  }
}
