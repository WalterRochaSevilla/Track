import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 1. Importas la nueva tool que el script acaba de generar
import { buscarFarmaciaTool } from "./tools/buscarFarmacia.js";

const server = new McpServer({
    name: "Servidor-Base-Prueba",
    version: "1.0.0"
});

// 2. Registras la tool
server.tool(
    buscarFarmaciaTool.name,
    buscarFarmaciaTool.description,
    buscarFarmaciaTool.schema,
    buscarFarmaciaTool.handler
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Servidor base iniciado. Entorno listo para trabajar.");
}

main();