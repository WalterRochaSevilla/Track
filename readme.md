# 🧾 FacturaLista — Auditoría Inteligente para el SIN Bolivia (MCP)

**FacturaLista** es un ecosistema basado en el protocolo MCP que automatiza la extracción, validación fiscal y gestión contable para PYMEs y contadores en Bolivia, bajo la normativa del Servicio de Impuestos Nacionales (SIN).

## 💡 El Problema
Las PYMEs bolivianas pierden miles de bolivianos anualmente por errores manuales en la transcripción de facturas y la aceptación de documentos con datos fiscales inválidos (NITs erróneos, errores aritméticos en IVA). El proceso es lento, propenso a errores y costoso.

## 🚀 Nuestra Solución
Utilizamos **Inteligencia Artificial (Gemini 2.5 Flash)** combinada con **validación determinista** para ofrecer una herramienta que no solo "lee" facturas, sino que garantiza su validez legal.

### Flujo de Valor
1. **Visión:** Extracción precisa de 10+ campos (CUF, NIT, Importes) de facturas físicas o digitales.
2. **Validación:** Comprobación de integridad mediante algoritmo **Módulo 11** y reglas de la RND 102100000011.
3. **Deduplicación:** Sistema de Hash SHA-256 para evitar registros duplicados.
4. **Contabilidad:** Generación automática de resumen de IVA (Débito/Crédito) y exportación a formato LCV (Libro de Compras y Ventas).

---

## 🛠️ Decisiones de Ingeniería

Para cumplir con los estándares de **COCHATECH 2026**, hemos implementado una arquitectura robusta:

*   **Multi-tenancy Seguro:** Uso de `AsyncLocalStorage` y JWT para aislar los datos por `empresaId`.
*   **Resiliencia de API:** Implementación de *Exponential Backoff* para manejar los límites de cuota (429) de Google Gemini.
*   **Validación Híbrida:** La IA extrae, pero el código valida. El cálculo de IVA y el Módulo 11 del NIT no se delegan a la IA para asegurar precisión contable del 100%.
*   **Transporte Dual:** Soporta `stdio` para integración con Claude Desktop y `HTTP` para nuestra interfaz web Glassmorphism.

## 📦 Stack Tecnológico
*   **Lenguaje:** TypeScript / Node.js
*   **IA:** Gemini 2.5 Flash (Visión & JSON Estructurado)
*   **ORM:** Drizzle ORM con PostgreSQL
*   **Protocolo:** Model Context Protocol (MCP) SDK

---

## 🚀 Instalación y Uso

1. **Clonar e Instalar:**
   ```bash
   git clone https://github.com/WalterRochaSevilla/Track.git
   npm install
   ```
2. **Configurar Entorno:**
   Crea un archivo `.env` basado en `.env.example` con tu `GEMINI_API_KEY` y `DATABASE_URL`.
3. **Iniciar Servidor:**
   ```bash
   npm run dev
   ```

## 🧪 Evaluación y Calidad (Evals)
Contamos con una suite de pruebas para garantizar la precisión:
*   **Dataset Sintético:** `npm run evals` (6 casos críticos).
*   **Dataset Real:** `npm run evals:real` (12 facturas reales del SIN).

## 🔍 Evidencia MCPJam
El servidor está optimizado para el **MCP Inspector**. Para probar las herramientas:

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