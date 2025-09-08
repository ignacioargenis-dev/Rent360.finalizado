import { Router } from 'express';

const router = Router();

// Placeholder routes for users
router.get('/', (req, res) => {
  res.json({ message: 'Users endpoint' });
});

export { router as userRoutes };
