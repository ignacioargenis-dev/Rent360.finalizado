// server.ts - SERVIDOR CON WEBSOCKET PARA PRODUCCIÓN
import next from 'next';
import { IncomingMessage, ServerResponse } from 'http';
import { websocketServer } from './src/lib/websocket/socket-server';

const dev = process.env.NODE_ENV !== 'production';

// DEBUGGING: Verificar variables de entorno
console.log('🔍 [SERVER] Environment variables:');
console.log('🔍 [SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 [SERVER] PORT:', process.env.PORT);
console.log('🔍 [SERVER] HOST:', process.env.HOST);

// Usar el puerto que Digital Ocean configura automáticamente
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
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
    handle(req, res);
  });

  // Inicializar WebSocket server
  websocketServer.initialize(server);

  // Hacer el WebSocket server disponible globalmente para las notificaciones
  (global as any).websocketServer = websocketServer;

  server.listen(port, (err: Error | null) => {
    if (err) {
      throw err;
    }
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    console.log(`> Ready on http://${host}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> WebSocket server initialized`);
  });
});
