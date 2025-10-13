import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-minimal';
import {
  validateSecurityHeaders,
  validateQueryParams,
  detectInjectionAttacks,
  sanitizeString,
  sanitizeObject
} from '@/lib/security/input-validator';

// Configuración de seguridad avanzada
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 1000, // Aumentado temporalmente para producción
  MAX_REQUESTS_PER_HOUR: 10000, // Aumentado temporalmente para producción
  BLOCKED_IPS: new Set<string>(),
  SUSPICIOUS_PATTERNS: [
    /\bunion\b.*\bselect\b/i,
    /\bscript\b.*\balert\b/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:\s*\w+/gi,
    /\beval\s*\(/gi,
    /\bFunction\s*\(/gi,
    /\bsetTimeout\s*\(/gi,
    /\bsetInterval\s*\(/gi,
    /\bdocument\.cookie/gi,
    /\blocalStorage\./gi,
    /\bsessionStorage\./gi,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /\.\./g,
    /%2e%2e/gi, // URL encoded ../
    /%2f%65%74%63/gi, // URL encoded /etc
  ],
  ALLOWED_USER_AGENTS: [
    'Mozilla/',
    'Chrome/',
    'Safari/',
    'Firefox/',
    'Edge/',
    'Opera/',
    'PostmanRuntime/',
    'curl/',
    'wget/'
  ]
};

// Cache de rate limiting en memoria (en producción usar Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Función para verificar rate limiting
function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  const current = rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  current.count++;
  rateLimitCache.set(key, current);

  // Limpiar entradas antiguas cada 1000 requests
  if (Math.random() < 0.001) {
    for (const [k, v] of rateLimitCache.entries()) {
      if (now > v.resetTime) {
        rateLimitCache.delete(k);
      }
    }
  }

  return current.count <= maxRequests;
}

// Función para validar User-Agent
function validateUserAgent(userAgent: string | null): { isValid: boolean; risk: 'low' | 'medium' | 'high' } {
  if (!userAgent) {
    return { isValid: false, risk: 'high' };
  }

  // Verificar si el User-Agent está en la lista blanca
  const isAllowed = SECURITY_CONFIG.ALLOWED_USER_AGENTS.some(allowed =>
    userAgent.includes(allowed)
  );

  if (isAllowed) {
    return { isValid: true, risk: 'low' };
  }

  // Verificar patrones sospechosos
  const suspiciousPatterns = [
    /^$/ , // Empty
    /^-$/, // Dash only
    /^unknown$/i, // Unknown
    /^python/i, // Python requests
    /^go-http/i, // Go HTTP client
    /^java\//i, // Java HTTP client
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    return { isValid: false, risk: 'high' };
  }

  // User-Agent desconocido pero no claramente malicioso
  return { isValid: true, risk: 'medium' };
}

// Función para detectar ataques avanzados
function detectAdvancedAttacks(request: NextRequest): {
  isAttack: boolean;
  attackType: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const url = request.url;
  const method = request.method;
  const headers = Object.fromEntries(request.headers.entries());
  const searchParams = new URL(request.url).searchParams;

  // 1. SQL Injection avanzado
  const sqlInjectionPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\border\s+by\s+\d+)/i,
    /(\bgroup\s+by\s+\d+)/i,
    (/having\s+\d+\s*=\s*\d+/i),
    (/;\s*(drop|delete|update|insert)/i),
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(url) || pattern.test(searchParams.toString())) {
      return { isAttack: true, attackType: 'SQL Injection', severity: 'critical' };
    }
  }

  // 2. XSS avanzado
  const xssPatterns = [
    /<script[^>]*src\s*=\s*["'][^"']*["'][^>]*>/gi,
    /<iframe[^>]*src\s*=\s*["'][^"']*["'][^>]*>/gi,
    /javascript:\s*confirm\s*\(/gi,
    /javascript:\s*prompt\s*\(/gi,
    /javascript:\s*alert\s*\(/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(url) || pattern.test(searchParams.toString())) {
      return { isAttack: true, attackType: 'XSS', severity: 'high' };
    }
  }

  // 3. Path Traversal
  const traversalPatterns = [
    /\.\.[\/\\]/g,
    /%2e%2e%2f/gi, // URL encoded ../
    /%2e%2e%5c/gi, // URL encoded ..\
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /\/proc\/self\/environ/gi,
    /\/windows\/system32/gi,
  ];

  for (const pattern of traversalPatterns) {
    if (pattern.test(url)) {
      return { isAttack: true, attackType: 'Path Traversal', severity: 'critical' };
    }
  }

  // 4. Command Injection
  const commandPatterns = [
    /;\s*(ls|cat|rm|cp|mv|chmod|chown)/gi,
    /\|\s*(ls|cat|rm|cp|mv)/gi,
    /\$\(/gi,
    /\`/gi,
  ];

  for (const pattern of commandPatterns) {
    if (pattern.test(url) || pattern.test(searchParams.toString())) {
      return { isAttack: true, attackType: 'Command Injection', severity: 'critical' };
    }
  }

  // 5. Verificar headers sospechosos
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'x-original-url',
    'x-rewrite-url',
    'x-custom-header'
  ];

  for (const header of suspiciousHeaders) {
    if (headers[header] && headers[header] !== headers[header.toLowerCase()]) {
      // Header duplicado con diferentes capitalizaciones
      return { isAttack: true, attackType: 'Header Injection', severity: 'medium' };
    }
  }

  // 6. Verificar parámetros duplicados
  const paramCounts = new Map<string, number>();
  for (const [key] of searchParams.entries()) {
    paramCounts.set(key, (paramCounts.get(key) || 0) + 1);
  }

  for (const [key, count] of paramCounts.entries()) {
    if (count > 5) { // Más de 5 valores para el mismo parámetro
      return { isAttack: true, attackType: 'Parameter Pollution', severity: 'medium' };
    }
  }

  return { isAttack: false, attackType: null, severity: 'low' };
}

// Middleware principal de seguridad
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('cf-connecting-ip') ||
                   'unknown';

  const userAgent = request.headers.get('user-agent');
  const url = request.url;
  const method = request.method;

  try {
    // 1. Verificar IP bloqueada
    if (SECURITY_CONFIG.BLOCKED_IPS.has(clientIP)) {
      logger.warn('Blocked IP attempted access', {
        clientIP,
        userAgent,
        url,
        context: 'security.blocked_ip'
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Your IP address has been blocked due to suspicious activity'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Validar User-Agent
    const userAgentValidation = validateUserAgent(userAgent);
    if (!userAgentValidation.isValid && userAgentValidation.risk === 'high') {
      logger.warn('Invalid User-Agent detected', {
        clientIP,
        userAgent,
        risk: userAgentValidation.risk,
        context: 'security.invalid_user_agent'
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Invalid request'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Rate limiting por IP (excluir rutas críticas durante prerendering)
    const pathname = new URL(url).pathname;
    const isPrerendering = !userAgent || userAgent.includes('Next.js') || userAgent.includes('prerenderer');
    const isCriticalAPI = pathname.startsWith('/api/users') ||
                         pathname.startsWith('/api/settings') ||
                         pathname.startsWith('/api/auth/me') ||
                         pathname.startsWith('/api/health') ||
                         pathname.startsWith('/api/test-');

    // Excluir rate limiting para prerendering y APIs críticas
    if (!isPrerendering && !isCriticalAPI) {
      const rateLimitKey = `ip:${clientIP}`;
      if (!checkRateLimit(rateLimitKey, SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE, 60000)) {
        logger.warn('Rate limit exceeded by IP', {
          clientIP,
          userAgent,
          url,
          context: 'security.rate_limit_ip'
        });

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP address',
            retryAfter: 60
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        );
      }
    }

    // 4. Detectar ataques avanzados
    const attackDetection = detectAdvancedAttacks(request);
    if (attackDetection.isAttack) {
      logger.error('Advanced attack detected', {
        clientIP,
        userAgent,
        url,
        attackType: attackDetection.attackType,
        severity: attackDetection.severity,
        context: 'security.attack_detected'
      });

      // Bloquear IP por ataques críticos
      if (attackDetection.severity === 'critical') {
        SECURITY_CONFIG.BLOCKED_IPS.add(clientIP);
        setTimeout(() => {
          SECURITY_CONFIG.BLOCKED_IPS.delete(clientIP);
        }, 3600000); // Desbloquear después de 1 hora
      }

      const statusCode = attackDetection.severity === 'critical' ? 403 : 400;

      return new NextResponse(
        JSON.stringify({
          error: 'Security violation detected',
          message: 'Your request contains potentially malicious content'
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Validar headers de seguridad
    const headerValidation = validateSecurityHeaders(request);
    if (!headerValidation.isValid || headerValidation.warnings.length > 0) {
      logger.warn('Security header validation issues', {
        clientIP,
        userAgent,
        url,
        warnings: headerValidation.warnings,
        context: 'security.header_validation'
      });
    }

    // 6. Validar parámetros de consulta
    const queryValidation = validateQueryParams(new URL(request.url).searchParams);
    if (!queryValidation.isValid) {
      logger.warn('Query parameter validation failed', {
        clientIP,
        userAgent,
        url,
        error: queryValidation.error,
        context: 'security.query_validation'
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Invalid request parameters',
          message: queryValidation.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 7. Sanitizar URL
    const sanitizedUrl = sanitizeString(url, 2048);
    if (sanitizedUrl !== url) {
      logger.warn('URL sanitized', {
        clientIP,
        userAgent,
        originalUrl: url,
        sanitizedUrl,
        context: 'security.url_sanitization'
      });
    }

    // Log de actividad de seguridad normal
    const processingTime = Date.now() - startTime;
    logger.info('Security check passed', {
      clientIP,
      userAgent: userAgent?.substring(0, 100),
      method,
      url: sanitizedUrl,
      processingTime,
      riskLevel: userAgentValidation.risk,
      context: 'security.check_passed'
    });

    // Continuar con la solicitud normal
    return null;

  } catch (error) {
    logger.error('Security middleware error', {
      clientIP,
      userAgent,
      url,
      error: error instanceof Error ? error.message : String(error),
      context: 'security.middleware_error'
    });

    // En caso de error en el middleware, permitir la solicitud para evitar bloqueos
    return null;
  }
}

// Función para bloquear IP manualmente
export function blockIP(ip: string, durationMs: number = 3600000): void {
  SECURITY_CONFIG.BLOCKED_IPS.add(ip);

  if (durationMs > 0) {
    setTimeout(() => {
      SECURITY_CONFIG.BLOCKED_IPS.delete(ip);
    }, durationMs);
  }

  logger.warn('IP manually blocked', {
    ip,
    durationMs,
    context: 'security.manual_block'
  });
}

// Función para desbloquear IP
export function unblockIP(ip: string): boolean {
  const wasBlocked = SECURITY_CONFIG.BLOCKED_IPS.delete(ip);

  if (wasBlocked) {
    logger.info('IP manually unblocked', {
      ip,
      context: 'security.manual_unblock'
    });
  }

  return wasBlocked;
}

// Función para obtener estadísticas de seguridad
export function getSecurityStats(): {
  blockedIPs: number;
  rateLimitCacheSize: number;
  blockedIPsList: string[];
} {
  return {
    blockedIPs: SECURITY_CONFIG.BLOCKED_IPS.size,
    rateLimitCacheSize: rateLimitCache.size,
    blockedIPsList: Array.from(SECURITY_CONFIG.BLOCKED_IPS)
  };
}
