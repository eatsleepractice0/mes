import { Router } from 'express';
import { checkDatabaseConnection } from '../db/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const database = await checkDatabaseConnection();

  res.json({
    status: 'ok',
    database: database ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
