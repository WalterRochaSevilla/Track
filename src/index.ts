import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 1. Inicializamos el servidor
const server = new McpServer({
    name: "Servidor-Base-Prueba",
    version: "1.0.0"
});

// 2. Herramienta temporal de prueba (Smoke Test)
server.tool(
    "ping",
    "Herramienta básica para verificar si el servidor MCP responde.",
    {}, // Un objeto vacío indica que no requiere parámetros
    async () => {
        console.error("[LOG INTERNO] La IA acaba de hacer un ping al servidor.");
        
        return {
        content: [{ type: "text", text: "¡Pong! El servidor MCP está instalado, compilado y funcionando perfectamente." }]
        };
    }
);

// 3. Levantamos el servidor por la consola
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Servidor base iniciado. Entorno listo para trabajar.");
}

main();