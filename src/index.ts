import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
    name: "Cochatech-Server",
    version: "1.0.0"
});

// 🚀 LA MAGIA: Función que lee la carpeta y auto-registra las tools
async function loadTools() {
    const toolsPath = path.join(__dirname, "tools");
    
    try {
        const files = await fs.readdir(toolsPath);
        
        for (const file of files) {
        // Solo importamos archivos JS (que son los TS ya compilados)
        if (file.endsWith(".js")) {
            const toolModule = await import(`./tools/${file}`);
            
            // Buscamos la exportación dentro del archivo
            for (const key in toolModule) {
            const tool = toolModule[key];
            
            // Verificamos que tenga la estructura de una Tool válida
            if (tool && tool.name && tool.handler && tool.schema) {
                server.tool(tool.name, tool.description, tool.schema, tool.handler);
                console.error(`[Loader] ✅ Herramienta auto-registrada: ${tool.name}`);
            }
            }
        }
        }
    } catch (error) {
        console.error("[Loader] ⚠️ No se pudieron cargar las herramientas o la carpeta está vacía.", error);
    }
}

// Inicialización del servidor
async function main() {
    await loadTools(); // Cargamos las tools antes de abrir el puerto
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 Servidor base iniciado. Entorno listo para trabajar.");
}

main();