import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtenemos el nombre del feature desde la consola
const featureName = process.argv[2];

if (!featureName) {
    console.error("❌ Error: Debes proporcionar un nombre base.");
    console.error("Uso: npm run generate:tool buscarHospitales");
    process.exit(1);
}

const schemaName = `${featureName}Schema`;
const serviceName = `ejecutar${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`;
const toolExportName = `${featureName}Tool`;

// 1. Template del Schema (Validación)
const schemaTemplate = `import { z } from "zod";

export const ${schemaName} = {
    parametroEjemplo: z.string().describe("Descripción clara para que la IA sepa qué extraer"),
};
`;

// 2. Template del Service (Lógica de Backend/Base de Datos)
const serviceTemplate = `// Importaciones sugeridas para cuando implementen la lógica real:
// import { Pool } from "pg";
// import axios from "axios";

// const pool = new Pool(); // Se autoconfigura si existe un archivo .env con las credenciales

export async function ${serviceName}(parametroEjemplo: string): Promise<any> {
    console.error(\`[Service] Ejecutando lógica para: \${parametroEjemplo}\`);
    
    // Acá define algo como una consulta a la base de datos o a una API externa.
    
    // ==========================================
    // EJEMPLO 1: Consulta SQL con PostgreSQL
    // ==========================================
    /*
    try {
        const query = "SELECT * FROM tabla_ejemplo WHERE columna = $1";
        const result = await pool.query(query, [parametroEjemplo]);
        return result.rows; 
    } catch (error) {
        console.error("Error consultando la base de datos:", error);
        throw new Error("Fallo interno al consultar los datos");
    }
    */

    // ==========================================
    // EJEMPLO 2: Llamada a una API externa (REST)
    // ==========================================
    /*
    try {
        const url = \`https://api.miproyecto.com/datos/\${parametroEjemplo}\`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error consumiendo la API:", error);
        throw new Error("Fallo al contactar el servicio externo");
    }
    */

    // Respuesta por defecto simulada (Borrar cuando se implemente la lógica real)
    return \`Datos obtenidos exitosamente para el parámetro: \${parametroEjemplo}\`;
}
`;

// 3. Template de la Tool (El puente entre la IA y el Service)
const toolTemplate = `import { ${schemaName} } from "../schemas/${featureName}.js";
import { ${serviceName} } from "../services/${featureName}.js";

export const ${toolExportName} = {
    name: "${featureName}",
    description: "Descripción detallada de qué hace esta herramienta y cuándo debe usarla la IA.",
    schema: ${schemaName},
    handler: async (args: any) => {
        // Llamamos al service manteniendo la Tool completamente limpia
        const resultado = await ${serviceName}(args.parametroEjemplo);
        
        // Siempre debemos retornar un objeto con el contenido en texto
        return {
        content: [{ type: "text", text: JSON.stringify(resultado) }]
        };
    }
};
`;

// Directorios base
const baseSrc = path.join(__dirname, '..', 'src');
const dirs = ['schemas', 'services', 'tools'];

// Asegurarse de que las carpetas existen
dirs.forEach(dir => {
    const fullPath = path.join(baseSrc, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Rutas de los archivos
const schemaPath = path.join(baseSrc, 'schemas', `${featureName}.ts`);
const servicePath = path.join(baseSrc, 'services', `${featureName}.ts`);
const toolPath = path.join(baseSrc, 'tools', `${featureName}.ts`);

// Verificar si ya existe para no sobreescribir el trabajo de alguien
if (fs.existsSync(toolPath)) {
    console.error(`❌ Error: La herramienta '${featureName}' ya existe.`);
    process.exit(1);
}

// Crear los archivos físicos
fs.writeFileSync(schemaPath, schemaTemplate);
fs.writeFileSync(servicePath, serviceTemplate);
fs.writeFileSync(toolPath, toolTemplate);

console.log(`✅ ¡Infraestructura vertical para '${featureName}' creada con éxito!`);
console.log(`📂 Archivos generados:`);
console.log(`  - src/schemas/${featureName}.ts`);
console.log(`  - src/services/${featureName}.ts`);
console.log(`  - src/tools/${featureName}.ts`);
console.log(`\n⚠️  Último paso: Recuerda registrar ${toolExportName} en src/index.ts`);