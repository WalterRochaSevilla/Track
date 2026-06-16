import { buscarFarmaciaSchema } from "../schemas/buscarFarmacia.js";
import { ejecutarBuscarFarmacia } from "../services/buscarFarmacia.js";

export const buscarFarmaciaTool = {
    name: "buscarFarmacia",
    description: "Busca una farmacia por parámetro.",
    schema: buscarFarmaciaSchema,
    handler: async (args: any) => {
        const resultado = await ejecutarBuscarFarmacia(args.parametroEjemplo);
        return {
        content: [{ type: "text" as const, text: JSON.stringify(resultado) }]
        };
    }
};
