// server.ts - SERVIDOR SIMPLIFICADO PARA PRODUCCIÓN
import next from 'next';
import { IncomingMessage, ServerResponse } from 'http';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = require('http').createServer((req: IncomingMessage, res: ServerResponse) => {
    handle(req, res);
  });

  server.listen(port, (err: Error | null) => {
    if (err) {
      throw err;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
});
