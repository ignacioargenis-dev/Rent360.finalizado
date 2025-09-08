import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'property-service', timestamp: new Date().toISOString() });
});

export { router as healthRoutes };
