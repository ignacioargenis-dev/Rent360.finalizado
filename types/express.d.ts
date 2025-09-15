// Type declarations for Express in API Gateway service
declare module 'express' {
  import { Application, Request, Response, NextFunction, Router } from 'express-serve-static-core';

  interface Request {
    user?: {
      userId: string;
      role: string;
      [key: string]: any;
    };
    ip: string;
  }

  interface Response {
    json(body: any): this;
    status(code: number): this;
  }

  interface Application {
    use(path: string | Router | ((req: Request, res: Response, next: NextFunction) => void), ...handlers: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    listen(port: number, callback?: () => void): any;
  }

  function express(): Application;
  export = express;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      role: string;
      [key: string]: any;
    };
  }

  interface Response {
    json(body: any): Response;
    status(code: number): Response;
  }
}
