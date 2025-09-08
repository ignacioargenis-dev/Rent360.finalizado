import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '../../src/app/api/auth/login/route';
import { POST as registerHandler } from '../../src/app/api/auth/register/route';
import { db } from '../../src/lib/db';
import { logger } from '../../src/lib/logger';
import { BusinessLogicError, ValidationError } from '../../src/lib/errors';

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('debería autenticar usuario correctamente', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        password: '$2a$10$hashedPasswordHere',
        role: 'TENANT',
        isActive: true,
        emailVerified: true,
      };

      const loginData = {
        email: 'user@example.com',
        password: 'correctPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare
      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      // Mock JWT sign
      jest.doMock('jsonwebtoken', () => ({
        sign: jest.fn().mockReturnValue('jwt_token_123'),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.id).toBe('user_123');
      expect(result.user.role).toBe('TENANT');
      expect(logger.info).toHaveBeenCalledWith(
        'Usuario autenticado exitosamente',
        expect.objectContaining({ userId: 'user_123' })
      );
    });

    it('debería rechazar credenciales incorrectas', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        password: '$2a$10$hashedPasswordHere',
      };

      const loginData = {
        email: 'user@example.com',
        password: 'wrongPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare - contraseña incorrecta
      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(false),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('credenciales');
      expect(logger.warn).toHaveBeenCalledWith(
        'Intento de login fallido',
        expect.objectContaining({ email: 'user@example.com' })
      );
    });

    it('debería rechazar usuario inactivo', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        isActive: false,
      };

      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toContain('inactiva');
    });

    it('debería rechazar usuario sin email verificado', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        isActive: true,
        emailVerified: false,
      };

      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare
      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toContain('verificar');
    });

    it('debería manejar usuario no encontrado', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain('credenciales');
    });

    it('debería validar formato de email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('debería requerir contraseña', async () => {
      const loginData = {
        email: 'user@example.com',
        password: '',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('contraseña');
    });

    it('debería manejar errores de base de datos', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error interno');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar usuario correctamente', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'Juan Pérez',
        role: 'TENANT',
        phone: '+56912345678',
      };

      const mockNewUser = {
        id: 'user_456',
        ...registerData,
        password: '$2a$10$hashedPassword',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null); // Email no existe
      (db.user.create as jest.Mock).mockResolvedValue(mockNewUser);

      // Mock bcrypt hash
      jest.doMock('bcryptjs', () => ({
        hash: jest.fn().mockResolvedValue('$2a$10$hashedPassword'),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user_456');
      expect(result.user.email).toBe('newuser@example.com');
      expect(logger.info).toHaveBeenCalledWith(
        'Usuario registrado exitosamente',
        expect.objectContaining({ userId: 'user_456' })
      );
    });

    it('debería rechazar email ya registrado', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Juan Pérez',
        role: 'TENANT',
      };

      const mockExistingUser = {
        id: 'user_123',
        email: 'existing@example.com',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ya registrado');
    });

    it('debería validar fortaleza de contraseña', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'weak',
        name: 'Juan Pérez',
        role: 'TENANT',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('contraseña');
    });

    it('debería validar formato de email', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Juan Pérez',
        role: 'TENANT',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('debería requerir campos obligatorios', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        // Falta name y role
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('obligatorios');
    });

    it('debería validar rol válido', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'Juan Pérez',
        role: 'INVALID_ROLE',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await registerHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('rol');
    });
  });

  describe('Rate Limiting', () => {
    it('debería aplicar rate limiting a intentos de login', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'wrongPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock rate limiter que bloquea después de varios intentos
      jest.doMock('../../src/lib/rate-limiter', () => ({
        rateLimiter: {
          check: jest.fn()
            .mockResolvedValueOnce({ allowed: true })
            .mockResolvedValueOnce({ allowed: true })
            .mockResolvedValueOnce({ allowed: false, remainingTime: 900 }),
        },
      }));

      // Primer intento - permitido
      const request1 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response1 = await loginHandler(request1);
      expect(response1.status).toBe(401);

      // Segundo intento - permitido
      const response2 = await loginHandler(request1);
      expect(response2.status).toBe(401);

      // Tercer intento - bloqueado
      const response3 = await loginHandler(request1);
      expect(response3.status).toBe(429);
      const result3 = await response3.json();
      expect(result3.error).toContain('demasiados intentos');
    });
  });

  describe('Session Management', () => {
    it('debería generar tokens JWT válidos', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        role: 'TENANT',
      };

      // Mock JWT sign con payload esperado
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      jest.doMock('jsonwebtoken', () => ({
        sign: jest.fn().mockReturnValue(mockToken),
      }));

      const loginData = {
        email: 'user@example.com',
        password: 'correctPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: '$2a$10$hashedPassword',
        isActive: true,
        emailVerified: true,
      });

      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(result.token).toBe(mockToken);
      expect(result.user).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });

    it('debería incluir información de sesión correcta', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'Juan Pérez',
        role: 'BROKER',
        isActive: true,
        emailVerified: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: '$2a$10$hashedPassword',
      });

      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      jest.doMock('jsonwebtoken', () => ({
        sign: jest.fn().mockReturnValue('jwt_token_123'),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correctPassword',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);
      const result = await response.json();

      expect(result.user).toEqual({
        id: 'user_123',
        email: 'user@example.com',
        name: 'Juan Pérez',
        role: 'BROKER',
      });
      expect(result.token).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('debería incluir headers de seguridad en respuestas', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'correctPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'user@example.com',
        password: '$2a$10$hashedPassword',
        role: 'TENANT',
        isActive: true,
        emailVerified: true,
      });

      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      jest.doMock('jsonwebtoken', () => ({
        sign: jest.fn().mockReturnValue('jwt_token_123'),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginHandler(request);

      // Verificar headers de seguridad
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('Audit Logging', () => {
    it('debería registrar eventos de autenticación', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        isActive: true,
        emailVerified: true,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: '$2a$10$hashedPassword',
      });

      (db.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'audit_123',
        userId: 'user_123',
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: 'user_123',
        details: { ip: '127.0.0.1', userAgent: 'TestAgent' },
        createdAt: new Date(),
      });

      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      jest.doMock('jsonwebtoken', () => ({
        sign: jest.fn().mockReturnValue('jwt_token_123'),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correctPassword',
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '127.0.0.1',
          'User-Agent': 'TestAgent',
        },
      });

      await loginHandler(request);

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'LOGIN_SUCCESS',
          entityType: 'USER',
          entityId: 'user_123',
          details: expect.objectContaining({
            ip: '127.0.0.1',
            userAgent: 'TestAgent',
          }),
        }),
      });
    });

    it('debería registrar intentos de login fallidos', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'wrongPassword',
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'user@example.com',
      });

      (db.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'audit_123',
        action: 'LOGIN_FAILED',
        details: { reason: 'INVALID_CREDENTIALS', email: 'user@example.com' },
        createdAt: new Date(),
      });

      jest.doMock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(false),
      }));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: { 'Content-Type': 'application/json' },
      });

      await loginHandler(request);

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_FAILED',
          details: expect.objectContaining({
            reason: 'INVALID_CREDENTIALS',
            email: 'user@example.com',
          }),
        }),
      });
    });
  });
});
