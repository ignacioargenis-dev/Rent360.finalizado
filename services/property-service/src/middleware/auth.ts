import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Placeholder authentication middleware
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // Add user to request object
  (req as any).user = { id: 'user123', role: 'user' };
  next();
};
