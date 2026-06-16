# Plan: Track C — HTTP Transport, JWT Auth, Upload, and REST API

## Baseline findings

- `package.json` is ES module based (`"type": "module"`) and builds with `tsc` from `src/` to `build/`.
- Existing scripts are present and must remain: `build`, `start`, `dev:inspector`, `generate:tool`.
- `tsconfig.json` uses `target: ES2022`, `module: Node16`, `moduleResolution: Node16`, `outDir: ./build`, `rootDir: ./src`, and includes `src/**/*`.
- Current `src/index.ts` creates a single `McpServer`, auto-loads tools from the compiled `tools` directory, then connects a `StdioServerTransport`.
- Existing tools:
  - `src/tools/buscarFarmacia.ts` exports `buscarFarmaciaTool`.
  - `src/tools/CrearFacturas.ts` exports `CrearFacturasTool`.
- Existing services:
  - `src/services/buscarFarmacia.ts` exports `ejecutarBuscarFarmacia(parametroEjemplo: string): Promise<any>`.
  - `src/services/CrearFacturas.ts` exports `ejecutarCrearFacturas(parametroEjemplo: string): Promise<any>`.
  - No existing shared `pg` pool export was found, so `uploadService.ts` should create its own `Pool`.
- Existing schemas:
  - `src/schemas/buscarFarmacia.ts` exports `buscarFarmaciaSchema`.
  - `src/schemas/CrearFacturas.ts` exports `CrearFacturasSchema`.
- `.env.example` does not exist and should be created.
- `scripts/migrate.sql` does not exist and should be created.
- `node_modules` is absent in this checkout, so the installed SDK transport class cannot be discovered until dependencies are installed.
- `package-lock.json` currently resolves `@modelcontextprotocol/sdk` to `1.29.0` because `package.json` allows `^1.0.1`.

## Execution constraints

- Do not modify:
  - `src/schemas/*.ts`
  - existing `src/services/*.ts`
  - existing `src/tools/*.ts`
  - `scripts/generateTool.js`
  - `tsconfig.json`
  - `.gitignore`
- Add new files only where needed, plus `package.json` scripts/dependencies, `.env.example`, and `scripts/migrate.sql`.
- All local imports must keep `.js` extensions in TypeScript source.
- The HTTP transport class and import path must be discovered from the installed SDK after `npm install`, not assumed.

## Implementation steps

1. **Install dependencies**
   - Run:
     ```bash
     npm install express cors jsonwebtoken multer uuid
     npm install --save-dev @types/express @types/cors @types/jsonwebtoken @types/multer @types/uuid
     ```
   - Verify `package.json` includes the new dependencies.
   - If any `@types/*` package fails because it is unavailable or conflicts with bundled types, remove only that failing package.

2. **Inspect the installed SDK HTTP transport**
   - Run the mandatory SDK discovery commands after installation.
   - Read the actual server module directory and `package.json` exports map.
   - Identify the exact exported HTTP transport class and import path.
   - Read the transport source enough to confirm constructor options and request handling signature.
   - Use those exact values in `src/index.ts`.

3. **Create `src/lib/tenant.ts`**
   - Add an `AsyncLocalStorage<TenantStore>` export named `tenantStorage`.
   - Add `getEmpresaId(): string | undefined`.
   - Keep it dependency-free.

4. **Create `src/middleware/auth.ts`**
   - Add JWT Bearer validation using `process.env.JWT_SECRET`.
   - Extend `Express.Request` with `empresaId: string`.
   - Reject missing/malformed Authorization headers with `401`.
   - Reject missing `empresaId` claim with `401`.
   - Propagate verification errors as `401` JSON responses.

5. **Create `src/services/uploadService.ts`**
   - Import `Pool` from `pg` and `uuid`.
   - Create a singleton `Pool` with `connectionString: process.env.DATABASE_URL`.
   - Export `saveUpload(record)` that inserts into `uploads` and returns the generated `docId`.
   - Do not modify existing Track B service files.

6. **Create `src/routes/upload.ts`**
   - Use `multer.diskStorage` with `process.env.UPLOAD_DIR ?? './uploads'`.
   - Accept `multipart/form-data` field name `file`.
   - Allow `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
   - Enforce a 10 MB file size limit.
   - Apply `authMiddleware`.
   - Save upload metadata through `saveUpload`.
   - Return `201 { docId }` on success and JSON errors on failure.

7. **Create `src/routes/api.ts`**
   - Apply `authMiddleware` to all `/api` routes.
   - Add `GET /api/health` returning `{ status: 'ok', ts }`.
   - Reuse Track B services without reimplementing logic:
     - `POST /api/buscarFarmacia` accepting `{ parametroEjemplo }` and returning `ejecutarBuscarFarmacia(parametroEjemplo)`.
     - `POST /api/crearFacturas` accepting `{ parametroEjemplo }` and returning `ejecutarCrearFacturas(parametroEjemplo)`.
   - Return JSON errors with `500` for thrown service failures.

8. **Extract `src/server.ts`**
   - Move `McpServer` creation and tool auto-loading out of `src/index.ts`.
   - Preserve the existing auto-loader behavior:
     - Read compiled `build/tools/*.js` at runtime.
     - Inspect named exports for objects with `name`, `description`, `schema`, and `handler`.
     - Register each tool with `server.tool(tool.name, tool.description, tool.schema, tool.handler)`.
   - Export `createMcpServer(): Promise<McpServer>`.

9. **Rewrite `src/index.ts` as the HTTP entry point**
   - Import `dotenv/config`, `express`, `cors`, the actual SDK HTTP transport class, `tenantStorage`, auth, upload, API routes, and `createMcpServer`.
   - Configure `express.json()` and CORS.
   - Ensure `UPLOAD_DIR` exists on startup.
   - Add `POST /mcp` protected by `authMiddleware`.
   - Run the MCP request inside `tenantStorage.run({ empresaId: req.empresaId }, async () => { ... })`.
   - Create one `McpServer` per request, connect it to the HTTP transport, and delegate request handling using the exact SDK transport API discovered in Step 2.
   - Mount:
     - `/upload`
     - `/api`
     - `GET /health`
   - Listen on `process.env.PORT ?? 3000`.

10. **Update `package.json` scripts**
    - Preserve existing scripts.
    - Add:
      ```json
      "start:http": "node build/index.js",
      "dev:http": "node --watch build/index.js"
      ```

11. **Create `.env.example`**
    - Add:
      ```bash
      # Track C additions
      PORT=3000
      JWT_SECRET=replace_with_a_secure_random_string_minimum_32_chars
      UPLOAD_DIR=./uploads
      ```

12. **Create `scripts/migrate.sql`**
    - Add the `uploads` table DDL.
    - Add `idx_uploads_empresa` index.

## Verification plan

1. Run `npm run build` and fix every TypeScript error.
2. Start the HTTP server with `node build/index.js` in the background.
3. Verify `GET /health` returns JSON with `status: "ok"`.
4. Verify unprotected MCP upload/API calls are rejected with `401`.
5. Generate a test JWT using `JWT_SECRET` from `.env` and payload `{ "empresaId": "empresa_test_001" }`.
6. Verify `POST /upload` with a real image and bearer token returns `{ docId }`.
7. Verify `GET /api/health` with bearer token returns JSON health.
8. Stop the background server.
9. Optionally verify MCP tools still work through the inspector after migration.

## Engineering decisions to document

- **Stateless per-request MCP server:** avoids cross-request tenant leakage and keeps HTTP MCP state isolated.
- **AsyncLocalStorage tenant propagation:** lets Track B services access `empresaId` without changing existing function signatures.
- **Local disk upload storage:** fastest P0 path; can be swapped for S3-compatible storage later.
- **JWT-only auth:** satisfies P0 without adding OAuth flow complexity.
