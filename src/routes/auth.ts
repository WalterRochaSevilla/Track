import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/environments.js";
import { users } from "../data/users.js";

const authRouter = Router();

interface LoginInput {
  email: string;
  password: string;
}

authRouter.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = users.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.toLowerCase() &&
      candidate.password === password,
  );

  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas." });
    return;
  }

  const secret = ENV.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET no configurado en el servidor." });
    return;
  }

  // Some test users previously used numeric IDs; ensure the token's
  // empresaId is a UUID that matches seeded companies when needed.
  const empresaIdForToken = /^[0-9]+$/.test(user.id)
    ? "f69b7f4a-4b79-44a6-af0f-b8f9a0b7e8df"
    : user.id;

  const token = jwt.sign({ empresaId: empresaIdForToken }, secret, {
    expiresIn: "8h",
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    nit: user.nit,
    ci: user.ci,
    token,
  });
});

export { authRouter };
