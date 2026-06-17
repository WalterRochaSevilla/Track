import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/environments.js";
import { users } from "../data/users.js";
import { db } from "../database/db.js";
import { usuarioSchema } from "../database/schemas/usuario.js";
import { usuarioEmpresaSchema } from "../database/schemas/usuarioEmpresa.js";
import { eq } from "drizzle-orm";

const authRouter = Router();

interface LoginInput {
  email: string;
  password: string;
}

authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  // Try to find user in DB
  let userRecord: any = null;
  try {
    const rows = await db.select().from(usuarioSchema).where(eq(usuarioSchema.email, email)).limit(1);
    if (rows.length > 0) userRecord = rows[0];
  } catch (e) {
    console.error('DB error checking usuario:', e);
  }

  // If not in DB, fallback to memory users and upsert into DB
  if (!userRecord) {
    const candidate = users.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (candidate && candidate.password === password) {
      try {
        const id = candidate.id;
        await db.insert(usuarioSchema).values({ id, email: candidate.email, token: candidate.password }).onConflictDoNothing();
        await db.insert(usuarioEmpresaSchema).values({ usuarioId: id, empresaId: id, rol: candidate.role }).onConflictDoNothing();
        userRecord = { id: candidate.id, email: candidate.email, token: candidate.password, name: candidate.name, role: candidate.role, nit: candidate.nit, ci: candidate.ci };
      } catch (e) {
        console.error('DB upsert error:', e);
      }
    }
  }

  const valid = userRecord ? userRecord.token === password : false;

  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas." });
    return;
  }

  // Resolve empresaId: try usuario_empresa mapping, else use user id as empresaId fallback
  let empresaIdForToken = userRecord.id;
  try {
    const mappings = await db.select().from(usuarioEmpresaSchema).where(eq(usuarioEmpresaSchema.usuarioId, userRecord.id)).limit(1);
    if (mappings.length > 0) empresaIdForToken = mappings[0].empresaId;
  } catch (e) {
    console.error('DB error reading usuario_empresa mapping:', e);
  }

  const secret = ENV.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET no configurado en el servidor." });
    return;
  }

  const token = jwt.sign({ empresaId: empresaIdForToken }, secret, { expiresIn: "8h" });

  res.json({ id: userRecord.id, email: userRecord.email, name: userRecord.name ?? userRecord.email, role: userRecord.role ?? 'pyme', nit: userRecord.nit, ci: userRecord.ci, token });
});

export { authRouter };
