import { NextRequest } from 'next/server';

// Logger simplificado para evitar dependencias circulares
const simpleLogger = {
  info: (message: string, data?: any) => {
    console.log(`[RATE LIMITER INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[RATE LIMITER WARN] ${message}`, data || '');
  },
  error: (message: string, data?: any) => {
    console.error(`[RATE LIMITER ERROR] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[RATE LIMITER DEBUG] ${message}`, data || '');
    }
  }
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private cleanupInterval!: NodeJS.Timeout;

  constructor() {
    // Configuraciones por defecto
    this.setConfig('default', {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100,
      message: 'Demasiadas solicitudes desde esta IP',
      statusCode: 429
    });

    this.setConfig('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,
      message: 'Demasiados intentos de autenticación',
      statusCode: 429
    });

    this.setConfig('auth-strict', {
      windowMs: 60 * 1000, // 1 minuto - más estricto para login/register
      maxRequests: 3,
      message: 'Demasiados intentos de autenticación. Intente más tarde.',
      statusCode: 429
    });

    this.setConfig('financial', {
      windowMs: 60 * 1000, // 1 minuto - sensible para pagos/depósitos
      maxRequests: 10,
      message: 'Demasiadas operaciones financieras. Intente más tarde.',
      statusCode: 429
    });

    this.setConfig('api', {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 60,
      message: 'Límite de API excedido',
      statusCode: 429
    });

    this.setConfig('admin', {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 120, // Más permisivo para admin
      message: 'Límite de administración excedido',
      statusCode: 429
    });

    this.setConfig('health-unlimited', {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 1000, // Sin límite práctico para health checks
      message: 'Servicio no disponible',
      statusCode: 503
    });

    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  setConfig(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  private getClientIdentifier(request: NextRequest): string {
    // Obtener IP del cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request as any).ip || 'unknown';
    
    // Combinar IP con user agent para mejor identificación
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }

  private getConfig(key: string): RateLimitConfig {
    return this.configs.get(key) || this.configs.get('default')!;
  }

  checkLimit(request: NextRequest, key: string = 'default'): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    message?: string;
    statusCode?: number;
  } {
    const config = this.getConfig(key);
    const identifier = this.getClientIdentifier(request);
    const now = Date.now();
    const entryKey = `${identifier}:${key}`;

    let entry = this.limits.get(entryKey);

    // Si no existe entrada o ha expirado, crear nueva
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
        blockUntil: 0
      };
    }

    // Verificar si está bloqueado
    if (entry.blocked && now < entry.blockUntil) {
      const remainingBlockTime = Math.ceil((entry.blockUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message: `IP bloqueada temporalmente. Intente nuevamente en ${remainingBlockTime} segundos.`,
        statusCode: 429
      };
    }

    // Verificar límite
    if (entry.count >= config.maxRequests) {
      // Bloquear por 5 minutos si excede el límite
      entry.blocked = true;
      entry.blockUntil = now + 5 * 60 * 1000;
      
      simpleLogger.warn('Rate limit excedido', {
        identifier,
        key,
        count: entry.count,
        limit: config.maxRequests
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message: config.message,
        statusCode: config.statusCode
      };
    }

    // Incrementar contador
    entry.count++;
    this.limits.set(entryKey, entry);

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime && !entry.blocked) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.limits.delete(key));

    if (expiredKeys.length > 0) {
      simpleLogger.debug('Rate limiter cleanup', { 
        expiredEntries: expiredKeys.length,
        totalEntries: this.limits.size
      });
    }
  }

  getStats(): {
    totalKeys: number;
    activeKeys: number;
    memoryUsage: number;
    configs: Record<string, RateLimitConfig>;
  } {
    const now = Date.now();
    const activeKeys = Array.from(this.limits.values()).filter(
      entry => now <= entry.resetTime || entry.blocked
    ).length;

    return {
      totalKeys: this.limits.size,
      activeKeys,
      memoryUsage: this.limits.size * 64, // Estimación aproximada
      configs: Object.fromEntries(this.configs)
    };
  }

  clear(): void {
    this.limits.clear();
    simpleLogger.info('Rate limiter limpiado');
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

// Instancia singleton
export const rateLimiter = new RateLimiter();

// Middleware para usar en API routes
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  key: string = 'default'
) {
  return async (request: NextRequest): Promise<Response> => {
    const limitCheck = rateLimiter.checkLimit(request, key);
    
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: limitCheck.message || 'Rate limit excedido',
          retryAfter: Math.ceil((limitCheck.resetTime - Date.now()) / 1000)
        }),
        {
          status: limitCheck.statusCode || 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((limitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': limitCheck.remaining.toString(),
            'X-RateLimit-Reset': limitCheck.resetTime.toString()
          }
        }
      );
    }

    // Agregar headers de rate limit a la respuesta
    const response = await handler(request);
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', limitCheck.remaining.toString());
      response.headers.set('X-RateLimit-Reset', limitCheck.resetTime.toString());
    }

    return response;
  };
}

// Decorador para usar en funciones
export function rateLimit(key: string = 'default') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0];
      if (request instanceof Request) {
        const limitCheck = rateLimiter.checkLimit(request as any, key);
        
        if (!limitCheck.allowed) {
          throw new Error(limitCheck.message || 'Rate limit excedido');
        }
      }
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
