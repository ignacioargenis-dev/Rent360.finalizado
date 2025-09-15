// Type declarations for Express
declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      role: string;
      [key: string]: any;
    };
    ip: string;
  }

  interface Response {
    json(body: any): Response;
    status(code: number): Response;
  }

  interface Application {
    use(path: string | any, ...handlers: any[]): Application;
    get(path: string, ...handlers: any[]): Application;
    post(path: string, ...handlers: any[]): Application;
    put(path: string, ...handlers: any[]): Application;
    delete(path: string, ...handlers: any[]): Application;
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
