# 🚀 MCP Server - Track MCPJam (COCHATECH 2026)

Este es el repositorio base del servidor MCP (Model Context Protocol) para nuestro proyecto de hackathon. La arquitectura está diseñada para ser modular, descentralizada y evitar conflictos de código (merge conflicts) entre los desarrolladores.

## 📋 Requisitos Previos

* Node.js (v18 o superior)
* NPM (viene incluido con Node)

## 🛠️ 1. Instalación y Configuración Inicial

Cuando clones este repositorio por primera vez, instala todas las dependencias:

\`\`\`bash
git clone <URL_DEL_REPOSITORIO>
cd mcp-server-cochatech
npm install
\`\`\`


## 🏗️ 2. Arquitectura del Proyecto

Para mantener el orden, usamos una estructura dividida por capas. El archivo `src/index.ts` solo funciona como orquestador; la lógica real vive en carpetas separadas:

* 📂 `src/schemas/`: Define qué parámetros debe pedir la IA (Zod).
* 📂 `src/services/`: Lógica dura del backend (Consultas SQL, llamadas a APIs).
* 📂 `src/tools/`: El puente que une el Schema, el Service y el servidor MCP.

## ⚡ 3. Cómo crear una nueva "Tool" (Flujo de Trabajo)

¡No crees los archivos a mano! Tenemos un generador automático que crea toda la vertical de archivos por ti.

Si necesitas crear un endpoint/tool (por ejemplo, para consultar impuestos), ejecuta en tu terminal:

\`\`\`bash
npm run generate:tool consultarImpuestos
\`\`\`

Esto creará automáticamente tres archivos con plantillas listas para usar:
1.  `src/schemas/consultarImpuestos.ts`
2.  `src/services/consultarImpuestos.ts`
3.  `src/tools/consultarImpuestos.ts`

### ⚠️ Paso Obligatorio: Registrar la Tool
Una vez que hayas programado tu lógica, debes decirle al servidor que tu herramienta existe. Ve al archivo `src/index.ts` y añade tu tool:

\`\`\`typescript
import { consultarImpuestosTool } from "./tools/consultarImpuestos.js";

// Añadir dentro de la inicialización:
server.tool(
  consultarImpuestosTool.name,
  consultarImpuestosTool.description,
  consultarImpuestosTool.schema,
  consultarImpuestosTool.handler
);
\`\`\`

## 🧪 4. Cómo Probar el Servidor (MCPJam)

El servidor se prueba obligatoriamente a través del Inspector oficial de MCPJam. Para compilar tu código de TypeScript y levantar el entorno de pruebas, ejecuta:

\`\`\`bash
npm run dev:inspector
\`\`\`

Esto abrirá una pestaña en tu navegador web. 
1. Ve a la pestaña **Connect** y verifica que el servidor esté en verde.
2. Ve a la pestaña **Playground** y chatea con la IA pidiéndole que ejecute tu herramienta.

## 🔐 5. Manejo de Credenciales (Base de Datos / APIs)

* **NUNCA** subas credenciales, contraseñas o tokens a GitHub.
* Crea un archivo `.env` en la raíz del proyecto para tus variables de entorno locales (este archivo ya está ignorado en el `.gitignore`).
* Utiliza `process.env.MI_VARIABLE` dentro de tus archivos en la carpeta `services/`.