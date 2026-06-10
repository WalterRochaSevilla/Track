# 🚀 MCP Server - Track MCPJam (COCHATECH 2026)

Este es el repositorio base del servidor MCP (Model Context Protocol) para nuestro proyecto de hackathon. La arquitectura está diseñada para ser modular, descentralizada y evitar conflictos de código (merge conflicts) entre los desarrolladores.

## 📋 Requisitos Previos

* Node.js (v18 o superior)
* NPM (viene incluido con Node)

## 🛠️ 1. Instalación y Configuración Inicial

Cuando clones este repositorio por primera vez, instala todas las dependencias:

```bash
git clone https://github.com/WalterRochaSevilla/Track.git
cd Track
npm install
```


## 🏗️ 2. Arquitectura del Proyecto (Capas)

Para mantener el código limpio y escalable, no programamos todo en un solo archivo. Dividimos cada funcionalidad (Tool) en tres partes. El archivo `src/index.ts` solo funciona como un orquestador que levanta el servidor.

La lógica real de cada herramienta que construyan debe vivir en estas tres carpetas:

### 📂 `src/schemas/` (¿Qué datos necesitamos?)
Aquí usamos la librería **Zod** para definir estrictamente **qué parámetros debe pedirle la Inteligencia Artificial al usuario**.
* *Ejemplo:* Si haces un buscador de farmacias, el schema define que la IA debe pedir obligatoriamente un texto llamado `zona` (ej. "Quillacollo" o "Centro"). Si la IA no tiene ese dato en la conversación, se lo preguntará al usuario antes de ejecutar tu código.

### 📂 `src/services/` (El Backend Puro)
Aquí va la **lógica de negocio dura**. Este archivo no sabe nada de Inteligencia Artificial ni de MCP. 
* Es el lugar exclusivo para hacer las consultas SQL (con `pg`), llamadas a APIs externas (con `axios`), cálculos matemáticos o reglas de validación. 
* Recibe los datos limpios del Schema, hace el trabajo pesado y devuelve un resultado (un string, un objeto o un JSON).

### 📂 `src/tools/` (El Puente)
Este es el archivo que une todo. Es la interfaz que lee la IA.
* Define el **Nombre** de la herramienta y una **Descripción** detallada (vital para que la IA entienda *cuándo* debe usarla).
* Importa el Schema para validar los datos.
* Ejecuta la función del Service.
* Retorna el resultado a la IA siempre dentro de un bloque de texto formateado como `[{ type: "text" as const, text: resultado }]`.

---

## ⚡ 3. Cómo crear una nueva "Tool" (Flujo de Trabajo)

¡No crees los archivos a mano! Tenemos un generador automático que crea toda la vertical de archivos por ti y te deja plantillas con código de ejemplo.

Si necesitas crear una funcionalidad (por ejemplo, para buscar farmacias), ejecuta en tu terminal:

```bash
npm run generate:tool buscarFarmacia
```

Esto creará automáticamente tres archivos listos para programar:
1.  `src/schemas/buscarFarmacia.ts`
2.  `src/services/buscarFarmacia.ts`
3.  `src/tools/buscarFarmacia.ts`

### ⚠️ Paso Obligatorio: Registrar la Tool
Una vez que hayas programado tu lógica, debes decirle al servidor que tu herramienta existe. Ve al archivo `src/index.ts`, importa tu herramienta y añádela al servidor:

```typescript
import { buscarFarmaciaTool } from "./tools/buscarFarmacia.js";

// Añadir debajo de las otras herramientas:
server.tool(
  buscarFarmaciaTool.name,
  buscarFarmaciaTool.description,
  buscarFarmaciaTool.schema,
  buscarFarmaciaTool.handler
);
```

---

## 🧪 4. Cómo Probar el Servidor localmente (MCPJam)

El servidor se prueba obligatoriamente a través del Inspector oficial de MCPJam. Para compilar tu código de TypeScript y levantar el entorno de pruebas, ejecuta:

```bash
npm run dev:inspector
```

Esto abrirá una pestaña en tu navegador web. 
1. Ve a la pestaña **Connect** en la barra lateral.
2. Verifica que tu servidor (**CLI Server**) tenga el indicador en verde (*Connected*).
3. Ve a la pestaña **Playground** y chatea con la IA (ej. *"Ejecuta la búsqueda de farmacias en la zona norte"*). Observa cómo la IA detecta tu herramienta y ejecuta tu código.

---

## 🔐 5. Manejo de Credenciales (Base de Datos / APIs)

* **NUNCA** subas credenciales, contraseñas, URLs de bases de datos o tokens a GitHub.
* Crea un archivo `.env` en la raíz del proyecto para tus variables de entorno locales (este archivo ya está configurado para ser ignorado por Git en el `.gitignore`).
* Utiliza `process.env.MI_VARIABLE_SECRETA` dentro de tus archivos en la carpeta `services/`.