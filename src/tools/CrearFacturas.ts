import { CrearFacturasSchema } from "../schemas/CrearFacturas.js";
import { ejecutarCrearFacturas } from "../services/CrearFacturas.js";

export const CrearFacturasTool = {
    name: "CrearFacturas",
    description: "Descripción detallada de qué hace esta herramienta y cuándo debe usarla la IA.",
    schema: CrearFacturasSchema,
    handler: async (args: any) => {
        // Llamamos al service manteniendo la Tool completamente limpia
        const resultado = await ejecutarCrearFacturas(args.parametroEjemplo);
        
        // Siempre debemos retornar un objeto con el contenido en texto
        return {
        content: [{ type: "text" as const, text: JSON.stringify(resultado) }]
        };
    }
};
