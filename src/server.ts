import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdir } from "fs/promises";
import { ENV } from "./config/environments.js"; // 🌟 Tu orquestador de entornos seguro

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 🚀 LA MAGIA: Función que lee de forma dinámica la carpeta 'tools'
 * y auto-registra las herramientas en la instancia pasada del servidor.
 */
async function loadTools(server: McpServer): Promise<void> {
  const toolsPath = join(__dirname, "tools");

  try {
    const files = await readdir(toolsPath);

    for (const file of files) {
      // Solo importamos archivos JS (que son los TS ya compilados en build/)
      if (file.endsWith(".js")) {
        const toolModule = await import(`./tools/${file}`);

        // Buscamos las exportaciones dentro del archivo de la herramienta
        for (const key in toolModule) {
          const tool = toolModule[key];

          // Verificamos que cumpla estrictamente con el contrato del Onboarding
          if (tool && tool.name && tool.handler && tool.schema) {
            server.tool(
              tool.name,
              tool.description || "Sin descripción",
              tool.schema,
              tool.handler,
            );
            console.error(
              `[Loader] ✅ Herramienta auto-registrada: ${tool.name}`,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "[Loader] ⚠️ No se pudieron cargar las herramientas o la carpeta está vacía.",
      error,
    );
  }
}

/**
 * Creates and returns a fully-initialised McpServer with all tools registered.
 * Call once per HTTP request (stateless mode) or once for stdio (singleton mode).
 */
export async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer({
    name: "Cochatech-Server",
    version: "1.0.0",
  });

  // Registramos todas las herramientas de forma dinámica antes de retornar la instancia
  await loadTools(server);
  return server;
}

/**
 * Inicialización predeterminada del servidor por línea de comandos (STDIO).
 * Esto mantendrá la compatibilidad absoluta con mcpjam inspector.
 */
async function main() {
  // Confirmamos que el entorno inyectado esté disponible al arrancar
  if (ENV.ENVIRONMENT === "dev") {
    console.error("🔌 [Server] Modo de desarrollo activo.");
  }

  // Instanciamos el servidor con sus herramientas ya cargadas
  const server = await createMcpServer();

  // Conectamos mediante el transporte por defecto (consola)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Servidor base iniciado. Entorno listo para trabajar.");
}

// Ejecutamos el punto de entrada si este archivo es lanzado directamente por Node
main();

