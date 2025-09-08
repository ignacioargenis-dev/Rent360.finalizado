import { Router } from 'express';

const router = Router();

// Placeholder routes for search
router.get('/', (req, res) => {
  res.json({ message: 'Search properties endpoint' });
});

export { router as searchRoutes };
