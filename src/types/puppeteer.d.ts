declare module 'puppeteer' {
  export interface LaunchOptions {
    headless?: boolean | 'new';
    args?: string[];
    executablePath?: string;
    ignoreHTTPSErrors?: boolean;
    defaultViewport?: {
      width?: number;
      height?: number;
    };
  }

  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    setContent(html: string, options?: { waitUntil?: string | string[] }): Promise<void>;
    pdf(options?: PDFOptions): Promise<Buffer>;
    close(): Promise<void>;
  }

  export interface PDFOptions {
    format?: string;
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    path?: string;
  }

  export function launch(options?: LaunchOptions): Promise<Browser>;

  const puppeteer: {
    launch(options?: LaunchOptions): Promise<Browser>;
  };

  export default puppeteer;
}
