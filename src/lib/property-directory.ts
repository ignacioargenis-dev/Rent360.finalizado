import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from './logger-minimal';

/**
 * Crea el directorio de una propiedad si no existe
 * @param propertyId - ID de la propiedad
 * @returns Promise<string> - Ruta del directorio creado
 */
export async function ensurePropertyDirectory(propertyId: string): Promise<string> {
  try {
    const propertyDir = join(process.cwd(), 'public', 'uploads', 'properties', propertyId);

    // Verificar si el directorio ya existe
    if (!existsSync(propertyDir)) {
      // Crear el directorio con permisos recursivos
      await mkdir(propertyDir, { recursive: true });
      logger.info('Property directory created', { propertyId, path: propertyDir });
    } else {
      logger.info('Property directory already exists', { propertyId, path: propertyDir });
    }

    return propertyDir;
  } catch (error) {
    logger.error('Error creating property directory', { error, propertyId });
    throw new Error(`Failed to create directory for property ${propertyId}`);
  }
}

/**
 * Obtiene la ruta del directorio de una propiedad
 * @param propertyId - ID de la propiedad
 * @returns string - Ruta del directorio
 */
export function getPropertyDirectoryPath(propertyId: string): string {
  return join(process.cwd(), 'public', 'uploads', 'properties', propertyId);
}

/**
 * Verifica si el directorio de una propiedad existe
 * @param propertyId - ID de la propiedad
 * @returns boolean - True si existe, false si no
 */
export function propertyDirectoryExists(propertyId: string): boolean {
  const propertyDir = getPropertyDirectoryPath(propertyId);
  return existsSync(propertyDir);
}

/**
 * Crea la estructura completa de directorios para uploads
 * @returns Promise<void>
 */
export async function ensureUploadsStructure(): Promise<void> {
  try {
    const baseUploadsDir = join(process.cwd(), 'public', 'uploads');
    const propertiesDir = join(baseUploadsDir, 'properties');
    const documentsDir = join(baseUploadsDir, 'documents');
    const virtualToursDir = join(baseUploadsDir, 'virtual-tours');

    // Crear directorios base si no existen
    await mkdir(baseUploadsDir, { recursive: true });
    await mkdir(propertiesDir, { recursive: true });
    await mkdir(documentsDir, { recursive: true });
    await mkdir(virtualToursDir, { recursive: true });

    logger.info('Uploads directory structure ensured');
  } catch (error) {
    logger.error('Error creating uploads structure', { error });
    throw new Error('Failed to create uploads directory structure');
  }
}
