import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración de DigitalOcean Spaces (compatible con S3)
const s3Client = new S3Client({
  region: process.env.DO_SPACES_REGION || 'nyc3',
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  },
});

export interface CloudStorageConfig {
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;
}

export class CloudStorageService {
  private client: S3Client;
  private bucket: string;

  constructor(config: CloudStorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
    this.bucket = config.bucket;
  }

  /**
   * Sube un archivo al cloud storage
   */
  async uploadFile(
    file: File | Buffer,
    key: string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; key: string }> {
    try {
      let buffer: Buffer;
      let mimeType = contentType;

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || contentType;
      } else {
        buffer = file;
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: metadata,
        // Configuración de permisos públicos para imágenes
        ACL: 'public-read',
      });

      await this.client.send(command);

      // Generar URL pública (para DigitalOcean Spaces)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/${key}`;

      return { url, key };
    } catch (error) {
      console.error('Error uploading to cloud storage:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Elimina un archivo del cloud storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting from cloud storage:', error);
      throw new Error('Failed to delete file from cloud storage');
    }
  }

  /**
   * Verifica si un archivo existe en el cloud storage
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Genera URL firmada para acceso temporal (opcional)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Obtiene la URL base para archivos públicos
   */
  private getBaseUrl(): string {
    // Para DigitalOcean Spaces
    if (process.env.DO_SPACES_REGION) {
      return `https://${this.bucket}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`;
    }

    // Para AWS S3
    if (process.env.AWS_REGION) {
      return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    }

    // Fallback
    return `https://${this.bucket}.s3.amazonaws.com`;
  }
}

// Instancia global del servicio
let cloudStorageService: CloudStorageService | null = null;

export function getCloudStorageService(): CloudStorageService {
  if (!cloudStorageService) {
    // Configuración por defecto para DigitalOcean Spaces
    const config: CloudStorageConfig = {
      bucket: process.env.DO_SPACES_BUCKET || 'rent360-images',
      region: process.env.DO_SPACES_REGION || 'nyc3',
      accessKey: process.env.DO_SPACES_ACCESS_KEY || '',
      secretKey: process.env.DO_SPACES_SECRET_KEY || '',
      endpoint: process.env.DO_SPACES_ENDPOINT || `https://nyc3.digitaloceanspaces.com`,
    };

    cloudStorageService = new CloudStorageService(config);
  }

  return cloudStorageService;
}

// Función de utilidad para generar claves de archivo
export function generateFileKey(propertyId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `properties/${propertyId}/${timestamp}_${randomId}_${filename}`;
}

// Función de utilidad para extraer key de URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Para DigitalOcean Spaces: https://bucket.region.digitaloceanspaces.com/path
    // Para S3: https://bucket.s3.region.amazonaws.com/path

    let key = '';
    if (urlObj.hostname.includes('digitaloceanspaces.com')) {
      key = urlObj.pathname.substring(1); // Remover leading slash
    } else if (urlObj.hostname.includes('s3.')) {
      key = urlObj.pathname.substring(1); // Remover leading slash
    } else if (urlObj.hostname.includes('cloudinary.com')) {
      // Para Cloudinary: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
      const pathParts = urlObj.pathname.split('/');
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < pathParts.length - 1) {
        key = pathParts.slice(uploadIndex + 1).join('/');
      }
    }

    return key || null;
  } catch {
    return null;
  }
}
