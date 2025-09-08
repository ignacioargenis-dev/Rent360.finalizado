import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import mongoose from 'mongoose';
import redis from 'redis';
import { propertyRoutes } from './routes/properties';
import { searchRoutes } from './routes/search';
import { healthRoutes } from './routes/health';

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
    new winston.transports.File({ filename: 'property-service.log' })
  ]
});

// Configuración de Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Configuración de MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent360_properties');
    logger.info('Property Service conectado a MongoDB');
  } catch (error) {
    logger.error('Error conectando Property Service a MongoDB:', error);
    process.exit(1);
  }
};

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // límite de 200 requests por windowMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Inicializar Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '50mb' })); // Mayor límite para imágenes
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info('Property Service - Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Property Service - Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Health check
app.use('/health', healthRoutes);

// API Routes
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/search', searchRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Property Service - Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Property Service - Route not found:', {
    method: req.method,
    url: req.url
  });

  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Property Service - SIGTERM received, shutting down gracefully');

  await mongoose.connection.close();
  await redisClient.quit();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Property Service - SIGINT received, shutting down gracefully');

  await mongoose.connection.close();
  await redisClient.quit();

  process.exit(0);
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a bases de datos
    await connectDB();
    await redisClient.connect();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Property Service running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'configured' : 'default',
        redis: process.env.REDIS_URL ? 'configured' : 'default'
      });
    });

  } catch (error) {
    logger.error('Error starting Property Service:', error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  logger.error('Failed to start Property Service:', error);
  process.exit(1);
});
