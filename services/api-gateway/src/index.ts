import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware, auditLog } from './middleware/auth';
import { loggingMiddleware, auditMiddleware, metricsMiddleware } from './middleware/logging';
import { errorHandler, sanitizeError, timeoutMiddleware } from './middleware/error-handler';
import { sanitizeInput, validateContentType, validateBodySize } from './middleware/validation';
import { healthRoutes } from './routes/health';
import { monitoringRoutes } from './routes/monitoring';

// Configuración de logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-gateway.log' })
  ]
});

// Configuración de servicios
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  property: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3002',
  contract: process.env.CONTRACT_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
};

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de 1000 requests por windowMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Inicializar Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware personalizado mejorado
app.use(sanitizeError); // Sanitización de errores primero
app.use(loggingMiddleware); // Logging básico
app.use(metricsMiddleware); // Métricas de rendimiento
app.use(sanitizeInput); // Sanitización de entrada
app.use(validateContentType(['application/json', 'multipart/form-data'])); // Validación de Content-Type
app.use(validateBodySize('10mb')); // Validación de tamaño de body
app.use(timeoutMiddleware(30000)); // Timeout de 30 segundos

// Health check
app.use('/health', healthRoutes);

// Monitoring routes
app.use('/api/monitoring', monitoringRoutes);

// Rutas públicas (sin autenticación)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/monitoring/health'
];

// Middleware de autenticación para rutas protegidas
app.use('/api', (req, res, next) => {
  const isPublicRoute = publicRoutes.some(route =>
    req.path.startsWith(route)
  );

  if (isPublicRoute) {
    return next();
  }

  return authMiddleware(req, res, next);
});

// Proxy a servicio de autenticación
app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/v1/auth'
  },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
      // Agregar headers personalizados
      proxyReq.setHeader('X-Gateway', 'rent360-api-gateway');
      proxyReq.setHeader('X-Client-IP', req.ip);

      logger.info('Proxying auth request', {
        originalUrl: req.originalUrl,
        target: SERVICES.auth,
        method: req.method
      });
    }
  }
}));

// Proxy a servicio de propiedades
app.use('/api/properties', auditMiddleware('PROPERTY_ACCESS'), createProxyMiddleware({
  target: SERVICES.property,
  changeOrigin: true,
  pathRewrite: {
    '^/api/properties': '/api/v1/properties'
  },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
    proxyReq.setHeader('X-Gateway', 'rent360-api-gateway');
    proxyReq.setHeader('X-Client-IP', req.ip);
    proxyReq.setHeader('X-User-ID', req.user?.userId || '');
    proxyReq.setHeader('X-User-Role', req.user?.role || '');

    logger.info('Proxying property request', {
      originalUrl: req.originalUrl,
      target: SERVICES.property,
      method: req.method,
      userId: req.user?.userId
    });
    }
  }
}));

// Proxy a servicio de contratos
app.use('/api/contracts', auditMiddleware('CONTRACT_ACCESS'), createProxyMiddleware({
  target: SERVICES.contract,
  changeOrigin: true,
  pathRewrite: {
    '^/api/contracts': '/api/v1/contracts'
  },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
    proxyReq.setHeader('X-Gateway', 'rent360-api-gateway');
    proxyReq.setHeader('X-Client-IP', req.ip);
    proxyReq.setHeader('X-User-ID', req.user?.userId || '');
    proxyReq.setHeader('X-User-Role', req.user?.role || '');

    logger.info('Proxying contract request', {
      originalUrl: req.originalUrl,
      target: SERVICES.contract,
      method: req.method,
      userId: req.user?.userId
    });
    }
  }
}));

// Proxy a servicio de pagos
app.use('/api/payments', auditMiddleware('PAYMENT_ACCESS'), createProxyMiddleware({
  target: SERVICES.payment,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/v1/payments'
  },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
    proxyReq.setHeader('X-Gateway', 'rent360-api-gateway');
    proxyReq.setHeader('X-Client-IP', req.ip);
    proxyReq.setHeader('X-User-ID', req.user?.userId || '');
    proxyReq.setHeader('X-User-Role', req.user?.role || '');

    logger.info('Proxying payment request', {
      originalUrl: req.originalUrl,
      target: SERVICES.payment,
      method: req.method,
      userId: req.user?.userId
    });
    }
  }
}));

// Proxy a servicio de notificaciones
app.use('/api/notifications', createProxyMiddleware({
  target: SERVICES.notification,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/v1/notifications'
  },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
    proxyReq.setHeader('X-Gateway', 'rent360-api-gateway');
    proxyReq.setHeader('X-Client-IP', req.ip);
    proxyReq.setHeader('X-User-ID', req.user?.userId || '');
    proxyReq.setHeader('X-User-Role', req.user?.role || '');

    logger.info('Proxying notification request', {
      originalUrl: req.originalUrl,
      target: SERVICES.notification,
      method: req.method,
      userId: req.user?.userId
    });
    }
  }
}));

// Endpoint para obtener estado de servicios
app.get('/api/services/status', async (req, res) => {
  try {
    const serviceStatuses: any = {};

    for (const [name, url] of Object.entries(SERVICES)) {
      try {
        const response = await fetch(`${url}/health`);
        serviceStatuses[name] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          url,
          responseTime: Date.now()
        };
      } catch (error) {
        serviceStatuses[name] = {
          status: 'unreachable',
          url,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    res.json({
      success: true,
      data: {
        gateway: {
          status: 'healthy',
          version: '1.0.0',
          uptime: process.uptime()
        },
        services: serviceStatuses
      }
    });

  } catch (error) {
    logger.error('Error checking services status:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado de servicios'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  logger.warn('Gateway - Route not found:', {
    method: req.method,
    url: req.url
  });

  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('API Gateway - SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('API Gateway - SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Iniciar servidor
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      services: SERVICES
    });
  });
};

startServer();
