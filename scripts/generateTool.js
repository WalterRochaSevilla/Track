import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtenemos el nombre de la tool desde la consola
const toolName = process.argv[2];

if (!toolName) {
    console.error("❌ Error: Debes proporcionar un nombre para la Tool.");
    console.error("Uso: npm run generate:tool nombreDeLaTool");
    process.exit(1);
}

const template = `import { z } from "zod";

export const ${toolName}Tool = {
    name: "${toolName}",
    description: "Descripción detallada de qué hace esta herramienta y cuándo debe usarla la IA.",
    schema: {
        parametroEjemplo: z.string().describe("Descripción del parámetro para la IA"),
    },
    handler: async ({ parametroEjemplo }: { parametroEjemplo: string }) => {
        // Aquí va la llamada al Service o Base de Datos
        console.error(\`Ejecutando \${"${toolName}"} con parámetro: \${parametroEjemplo}\`);
        
        const resultado = "Datos de prueba genéricos";

        return {
        content: [{ type: "text", text: resultado }]
        };
    }
};
`;

const toolsDir = path.join(__dirname, '..', 'src', 'tools');
const filePath = path.join(toolsDir, `${toolName}.ts`);

// Asegurarse de que la carpeta existe
if (!fs.existsSync(toolsDir)){
    fs.mkdirSync(toolsDir, { recursive: true });
}

// Crear el archivo
if (fs.existsSync(filePath)) {
    console.error(`❌ Error: La herramienta '${toolName}.ts' ya existe.`);
    } else {
    fs.writeFileSync(filePath, template);
    console.log(`✅ ¡Éxito! Herramienta creada en: src/tools/${toolName}.ts`);
    console.log(`⚠️ No olvides importarla y registrarla en src/index.ts`);
}