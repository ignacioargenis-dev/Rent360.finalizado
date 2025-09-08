import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { redisClient } from '../redis';
import logger from '../logger';

const router = express.Router();

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['TENANT', 'OWNER', 'BROKER', 'RUNNER', 'SUPPORT', 'ADMIN'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Función para generar tokens
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Middleware de autenticación
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    // Verificar si el token está en la lista negra (logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
};

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      isActive: true,
      createdAt: new Date()
    });

    await user.save();

    // Generar tokens
    const tokens = generateTokens(user);

    // Cachear información del usuario
    await redisClient.setEx(
      `user:${user._id}`,
      3600, // 1 hora
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      })
    );

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de registro inválidos',
        details: error.errors
      });
    }

    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta desactivada'
      });
    }

    // Generar tokens
    const tokens = generateTokens(user);

    // Actualizar última conexión
    user.lastLogin = new Date();
    await user.save();

    // Cachear información del usuario
    await redisClient.setEx(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      })
    );

    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de inicio de sesión inválidos',
        details: error.errors
      });
    }

    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Refrescar token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
    ) as any;

    // Verificar si el usuario existe
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o inactivo'
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(user);

    logger.info('Token refreshed successfully', {
      userId: user._id
    });

    res.json({
      success: true,
      data: { tokens }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token de refresco inválido'
    });
  }
});

// Cerrar sesión
router.post('/logout', authenticate, async (req: any, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      // Agregar token a lista negra
      await redisClient.setEx(`blacklist:${token}`, 3600, 'true'); // 1 hora
    }

    // Limpiar cache del usuario
    await redisClient.del(`user:${req.user.userId}`);

    logger.info('User logged out successfully', {
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar token
router.get('/verify', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export { router as authRoutes };
