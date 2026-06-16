// src/routes/upload.ts
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';
import { saveUpload } from '../services/uploadService.js';

const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        error: 'No file provided. Use multipart/form-data with field name "file".',
      });
      return;
    }

    try {
      const docId = await saveUpload({
        empresaId: req.empresaId,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        mimetype: req.file.mimetype,
      });
      res.status(201).json({ docId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ error: message });
    }
  }
);