import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 🧪 VERIFICADOR DE PROTOCOLO MCP
 * Este script actúa como un cliente real para probar que las herramientas
 * están correctamente registradas y responden a través del protocolo.
 */

async function runVerification() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const serverPath = path.resolve(__dirname, "../build/server.js");

  console.log("🔍 Iniciando verificación de protocolo MCP...");
  
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client({
    name: "Cochatech-Test-Client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("✅ Conectado al servidor MCP mediante STDIO.");

    // 1. Listar herramientas
    const tools = await client.listTools();
    console.log(`\n📦 Herramientas encontradas (${tools.tools.length}):`);
    tools.tools.forEach(t => console.log(`  - ${t.name.padEnd(20)}: ${t.description}`));

    if (tools.tools.length === 0) {
      throw new Error("No se encontraron herramientas registradas.");
    }

    // 2. Probar una herramienta específica (Validación pura)
    console.log("\n🧪 Probando Tool: 'validarFactura'...");
    const validationResult = await client.callTool({
      name: "validarFactura",
      arguments: {
        nitEmisor: "1234567", // NIT inválido para disparar lógica
        importeTotal: 100,
        descuentos: 0,
        importeBaseCreditoFiscal: 100,
        fechaEmision: "2026-06-16"
      }
    });

    console.log("📥 Respuesta del servidor:");
    console.log(JSON.stringify(validationResult.content, null, 2));

    // 3. Verificar salud de la base de datos a través de MCP
    console.log("\n🧪 Verificando persistencia mediante 'listarFacturas'...");
    const listResult = await client.callTool({
      name: "listarFacturas",
      arguments: {
        fechaInicio: "2026-01-01",
        fechaFin: "2026-12-31"
      }
    });
    console.log("✅ Protocolo verificado exitosamente.");

  } catch (error) {
    console.error("\n❌ Error de verificación:", error);
    process.exit(1);
  } finally {
    await transport.close();
  }
}

runVerification();