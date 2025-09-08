import { Router } from 'express';

const router = Router();

router.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

export { router as monitoringRoutes };
