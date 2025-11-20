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

app.prepare().then(() => {
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

  // Inicializar WebSocket server
  websocketServer.initialize(server);

  // Hacer el WebSocket server disponible globalmente para las notificaciones
  (global as any).websocketServer = websocketServer;

  // En producción, escuchar en 0.0.0.0 para que sea accesible desde fuera del contenedor
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  server.listen(port, host, (err: Error | null) => {
    if (err) {
      throw err;
    }
    console.log(`> Ready on http://${host}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> WebSocket server initialized`);
  });
});
