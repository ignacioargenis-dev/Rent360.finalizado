// server.ts - Next.js Custom Server with Socket.IO
import { websocketServer } from '@/lib/websocket/socket-server';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { join } from 'path';
import { promises as fs } from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const hostname = '0.0.0.0';

// Helper function to get content type
function getContentType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({
      dev,
      dir: process.cwd()
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer(async (req, res) => {
      const { url } = req;

      // Skip socket.io requests from Next.js handler
      if (url?.startsWith('/api/socketio')) {
        return;
      }

      // Handle static files for Next.js in production
      if (!dev && url) {
        // Handle _next/static files
        if (url.startsWith('/_next/static/')) {
          const filePath = join(process.cwd(), '.next', url);
          try {
            const file = await fs.readFile(filePath);
            res.setHeader('Content-Type', getContentType(url));
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.end(file);
            return;
          } catch (error) {
            // File not found, let Next.js handle it
          }
        }

        // Handle public static files
        if (url.startsWith('/icons/') || url.startsWith('/screenshots/') ||
            url === '/manifest.json' || url === '/robots.txt' ||
            url === '/favicon.ico' || url.startsWith('/sw.js')) {
          const filePath = join(process.cwd(), 'public', url);
          try {
            const file = await fs.readFile(filePath);
            res.setHeader('Content-Type', getContentType(url));
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(file);
            return;
          } catch (error) {
            // File not found, let Next.js handle it
          }
        }
      }

      // Let Next.js handle the request
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    websocketServer.initialize(server);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
