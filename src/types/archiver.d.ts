declare module 'archiver' {
  import { Transform } from 'stream';

  interface ArchiverOptions {
    gzip?: boolean;
    zlib?: any;
  }

  interface EntryData {
    name: string;
    date?: Date;
    mode?: number;
    prefix?: string;
    stats?: any;
  }

  interface Archiver {
    append(source: string | Buffer | NodeJS.ReadableStream, name?: string | EntryData): Archiver;
    append(source: string | Buffer | NodeJS.ReadableStream, data: EntryData): Archiver;
    directory(source: string, name?: string): Archiver;
    file(source: string, data: EntryData): Archiver;
    glob(pattern: string, options?: any, data?: EntryData): Archiver;
    finalize(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): Archiver;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
  }

  function archiver(format: string, options?: ArchiverOptions): Archiver;

  export = archiver;
}
