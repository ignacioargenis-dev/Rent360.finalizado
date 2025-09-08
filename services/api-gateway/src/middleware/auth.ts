import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Extender Request interface para incluir información del usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    // Validar token con el servicio de autenticación
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const response = await axios.get(`${authServiceUrl}/api/v1/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.data.success) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        next();
      } else {
        return res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
      }
    } catch (authError) {
      console.error('Error validating token with auth service:', authError);
      return res.status(503).json({
        success: false,
        error: 'Servicio de autenticación no disponible'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token JWT inválido'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos suficientes'
      });
    }

    next();
  };
};

// Middleware para verificar propiedad de recursos
export const requireOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const resourceId = req.params.id;

    try {
      // Aquí iríamos al servicio correspondiente para verificar propiedad
      // Por ahora, asumimos que el usuario tiene acceso si está autenticado
      // En una implementación real, consultaríamos la base de datos

      if (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT') {
        return next();
      }

      // Para otros roles, verificar propiedad del recurso
      // Esta es una implementación simplificada
      next();

    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Error verificando permisos'
      });
    }
  };
};

// Middleware para rate limiting por usuario
export const userRateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();

    const userId = req.user.userId;
    const now = Date.now();
    const windowStart = now - windowMs;

    let userRequests = requests.get(userId);

    if (!userRequests || userRequests.resetTime < windowStart) {
      userRequests = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    userRequests.count++;

    if (userRequests.count > maxRequests) {
      const resetTime = Math.ceil((userRequests.resetTime - now) / 1000);

      return res.status(429).json({
        success: false,
        error: 'Límite de solicitudes excedido',
        retryAfter: resetTime
      });
    }

    requests.set(userId, userRequests);
    next();
  };
};

// Middleware para logging de actividades sensibles
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Log de actividad
      console.log(`AUDIT: ${action}`, {
        userId: req.user?.userId,
        userRole: req.user?.role,
        method: req.method,
        url: req.url,
        ip: req.ip,
        timestamp: new Date().toISOString(),
        success: res.statusCode < 400
      });

      originalSend.call(this, data);
    };

    next();
  };
};
