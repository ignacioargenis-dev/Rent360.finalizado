// server.ts - SERVIDOR CON WEBSOCKET PARA PRODUCCIÓN
import next from 'next';
import { IncomingMessage, ServerResponse } from 'http';
import { websocketServer } from './src/lib/websocket/socket-server';

const dev = process.env.NODE_ENV !== 'production';

// Configuración CORS para cookies
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? ['https://rent360.cl', 'https://rent360management-2yxgz.ondigitalocean.app']
    : ['http://localhost:3000'];

function getCORSHeaders(origin?: string) {
  const baseHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 horas
  };

  // Verificar si el origen está permitido
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin,
    };
  }

  // Si no hay origen específico o no está permitido, usar el primero permitido
  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  };
}

// DEBUGGING: Verificar variables de entorno
console.log('🔍 [SERVER] Environment variables:');
console.log('🔍 [SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 [SERVER] PORT:', process.env.PORT);
console.log('🔍 [SERVER] HOST:', process.env.HOST);

// Usar el puerto que Digital Ocean configura automáticamente
// Digital Ocean App Platform normalmente usa 8080
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
console.log('🔍 [SERVER] Final port value:', port);
console.log('🔍 [SERVER] PORT type:', typeof process.env.PORT);
console.log('🔍 [SERVER] PORT truthy check:', !!process.env.PORT);
console.log(
  '🔍 [SERVER] All env vars starting with PORT:',
  Object.keys(process.env).filter(key => key.includes('PORT'))
);

const app = next({ dev });
const handle = app.getRequestHandler();

// Manejo de errores no capturados
process.on('uncaughtException', (error: Error) => {
  console.error('❌ [SERVER] Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // No salir inmediatamente en producción para dar tiempo a que el health check detecte el problema
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ [SERVER] Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // No salir inmediatamente en producción
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});

app
  .prepare()
  .then(() => {
    console.log('✅ [SERVER] Next.js app prepared successfully');

    const server = require('http').createServer((req: IncomingMessage, res: ServerResponse) => {
      // Obtener el origen de la request
      const origin = req.headers.origin;

      // Manejar preflight CORS requests
      if (req.method === 'OPTIONS') {
        const corsHeaders = getCORSHeaders(origin);
        res.writeHead(200, corsHeaders);
        res.end();
        return;
      }

      // Agregar headers CORS a todas las respuestas
      const originalWriteHead = res.writeHead;

      res.writeHead = function (statusCode: number, headers?: any) {
        const corsHeaders = getCORSHeaders(origin);
        if (headers) {
          Object.assign(corsHeaders, headers);
        }
        return originalWriteHead.call(this, statusCode, corsHeaders);
      };

      handle(req, res);
    });

    // Manejo de errores del servidor HTTP
    server.on('error', (err: Error) => {
      console.error('❌ [SERVER] HTTP Server Error:', err);
      console.error('Stack:', err.stack);
      process.exit(1);
    });

    // Inicializar WebSocket server
    try {
      websocketServer.initialize(server);
      console.log('✅ [SERVER] WebSocket server initialized');
    } catch (error) {
      console.error('❌ [SERVER] Error initializing WebSocket server:', error);
      // Continuar sin WebSocket si falla
    }

    // Hacer el WebSocket server disponible globalmente para las notificaciones
    (global as any).websocketServer = websocketServer;

    // En producción, escuchar en 0.0.0.0 para que sea accesible desde fuera del contenedor
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

    server.listen(port, host, (err: Error | null) => {
      if (err) {
        console.error('❌ [SERVER] Error starting server:', err);
        console.error('Stack:', err.stack);
        process.exit(1);
      }
      console.log(`✅ [SERVER] Ready on http://${host}:${port}`);
      console.log(`✅ [SERVER] Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ [SERVER] WebSocket server initialized`);
    });
  })
  .catch((error: Error) => {
    console.error('❌ [SERVER] Error preparing Next.js app:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
