import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../auth/register/route';
import { POST as loginHandler } from '../auth/login/route';
import { db } from '@/lib/db';

// Mock de la base de datos
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'tenant',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Mock successful database operations
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    (db.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      ...userData,
      role: userData.role.toUpperCase(),
    });

    const response = await registerHandler(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
    expect(result.data.email).toBe(userData.email);
  });

  it('should return error for existing user', async () => {
    const userData = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Existing User',
      role: 'tenant',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Mock existing user
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      ...userData,
    });

    const response = await registerHandler(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
  });

  it('should validate required fields', async () => {
    const invalidData = {
      email: '',
      password: '123',
      name: '',
      role: 'invalid',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(invalidData),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await registerHandler(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
  });
});

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login user successfully', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Mock successful login
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: loginData.email,
      password: 'hashedPassword',
      name: 'Test User',
      role: 'TENANT',
      isActive: true,
    });

    const response = await loginHandler(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });

  it('should return error for invalid credentials', async () => {
    const loginData = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Mock user not found
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await loginHandler(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
  });
});