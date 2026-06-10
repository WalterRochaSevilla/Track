import { z } from "zod";

export const buscarFarmaciaSchema = {
    parametroEjemplo: z.string().describe("Descripción clara para que la IA sepa qué extraer"),
};
