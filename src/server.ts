// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── paste/adapt your existing loadTools logic from src/index.ts here ─────────
async function loadTools(server: McpServer): Promise<void> {
    const toolsPath = join(__dirname, 'tools');
    
    try {
        const files = await readdir(toolsPath);
        
        for (const file of files) {
        // Solo importamos archivos JS (que son los TS ya compilados)
        if (file.endsWith('.js')) {
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
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and returns a fully-initialised McpServer with all tools registered.
 * Call once per HTTP request (stateless mode) or once for stdio (singleton mode).
 */
export async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer({
    name: 'Cochatech-Server',
    version: '1.0.0',
  });
  await loadTools(server);
  return server;
}