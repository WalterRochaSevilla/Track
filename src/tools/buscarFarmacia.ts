import { buscarFarmaciaSchema } from "../schemas/buscarFarmacia.js";
import { ejecutarBuscarFarmacia } from "../services/buscarFarmacia.js";

export const buscarFarmaciaTool = {
    name: "buscarFarmacia",
    description: "Descripción detallada de qué hace esta herramienta y cuándo debe usarla la IA.",
    schema: buscarFarmaciaSchema,
    handler: async (args: any) => {
        // Llamamos al service manteniendo la Tool completamente limpia
        const resultado = await ejecutarBuscarFarmacia(args.parametroEjemplo);
        
        // Siempre debemos retornar un objeto con el contenido en texto
        return {
        content: [{ type: "text" as const, text: JSON.stringify(resultado) }]
        };
    }
};
