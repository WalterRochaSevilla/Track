// src/routes/api.ts
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ejecutarBuscarFarmacia } from '../services/buscarFarmacia.js';
import { ejecutarCrearFacturas } from '../services/CrearFacturas.js';

export const apiRouter = Router();

// All /api routes require a valid JWT with empresaId
apiRouter.use(authMiddleware);

/** Health check — useful for frontend integration debugging */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

/**
 * POST /api/buscarFarmacia
 * Body: { parametroEjemplo: string }
 * Wraps Track B service ejecutarBuscarFarmacia without reimplementing logic.
 */
apiRouter.post('/buscarFarmacia', async (req: Request, res: Response) => {
  const { parametroEjemplo } = req.body as { parametroEjemplo?: string };

  if (typeof parametroEjemplo !== 'string') {
    res.status(400).json({ error: 'parametroEjemplo (string) is required' });
    return;
  }

  try {
    const result = await ejecutarBuscarFarmacia(parametroEjemplo);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Service error';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/crearFacturas
 * Body: { parametroEjemplo: string }
 * Wraps Track B service ejecutarCrearFacturas without reimplementing logic.
 */
apiRouter.post('/crearFacturas', async (req: Request, res: Response) => {
  const { parametroEjemplo } = req.body as { parametroEjemplo?: string };

  if (typeof parametroEjemplo !== 'string') {
    res.status(400).json({ error: 'parametroEjemplo (string) is required' });
    return;
  }

  try {
    const result = await ejecutarCrearFacturas(parametroEjemplo);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Service error';
    res.status(500).json({ error: message });
  }
});