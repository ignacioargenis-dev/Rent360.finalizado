import { logger } from './logger-minimal';

/**
 * Configuración de validación de archivos
 */
export interface FileValidationConfig {
  maxSize: number; // en bytes
  allowedTypes: string[]; // tipos MIME permitidos
  allowedExtensions: string[]; // extensiones permitidas
  scanContent: boolean; // escanear contenido malicioso
  checkIntegrity: boolean; // verificar integridad del archivo
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    size: number;
    type: string;
    extension: string;
    hash?: string;
    checksum?: string;
  };
}

/**
 * Tipos de archivo permitidos por categoría
 */
export const FILE_TYPES = {
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  },
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  contracts: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },
} as const;

/**
 * Validar archivo único
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {
      size: file.size,
      type: file.type || 'unknown',
      extension: getFileExtension(file.name),
    },
  };

  try {
    // 1. Validar tamaño
    if (file.size > config.maxSize) {
      result.valid = false;
      result.errors.push(
        `El archivo es demasiado grande. Tamaño máximo permitido: ${formatBytes(config.maxSize)}`
      );
    }

    // 2. Validar tipo MIME
    if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type)) {
      result.valid = false;
      result.errors.push(
        `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${config.allowedTypes.join(', ')}`
      );
    }

    // 3. Validar extensión
    if (
      config.allowedExtensions.length > 0 &&
      !config.allowedExtensions.includes(result.metadata.extension)
    ) {
      result.valid = false;
      result.errors.push(
        `Extensión de archivo no permitida: ${result.metadata.extension}. Extensiones permitidas: ${config.allowedExtensions.join(', ')}`
      );
    }

    // 4. Validar nombre de archivo
    const nameValidation = validateFileName(file.name);
    if (!nameValidation.valid) {
      result.valid = false;
      result.errors.push(...nameValidation.errors);
    }

    // 5. Escanear contenido si está habilitado
    if (config.scanContent && result.valid) {
      const contentScan = await scanFileContent(file);
      if (!contentScan.safe) {
        result.valid = false;
        result.errors.push('El archivo contiene contenido potencialmente peligroso');
      }
    }

    // 6. Verificar integridad si está habilitado
    if (config.checkIntegrity && result.valid) {
      const integrityCheck = await checkFileIntegrity(file);
      result.metadata.hash = integrityCheck.hash;
      result.metadata.checksum = integrityCheck.checksum;

      if (!integrityCheck.integrity) {
        result.valid = false;
        result.errors.push('El archivo está corrupto o ha sido modificado');
      }
    }

    // 7. Generar warnings
    if (file.size > config.maxSize * 0.8) {
      result.warnings.push(
        `El archivo está cerca del límite de tamaño (${formatBytes(config.maxSize)})`
      );
    }

    logger.info('Validación de archivo completada', {
      fileName: file.name,
      valid: result.valid,
      errors: result.errors.length,
      warnings: result.warnings.length,
      size: result.metadata.size,
      type: result.metadata.type,
    });
  } catch (error) {
    logger.error('Error durante validación de archivo:', {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
    });

    result.valid = false;
    result.errors.push('Error interno durante la validación del archivo');
  }

  return result;
}

/**
 * Validar múltiples archivos
 */
export async function validateFiles(
  files: File[],
  config: FileValidationConfig
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of files) {
    const result = await validateFile(file, config);
    results.push(result);
  }

  return results;
}

/**
 * Obtener configuración de validación por tipo
 */
export function getValidationConfig(type: keyof typeof FILE_TYPES): FileValidationConfig {
  const baseConfig = FILE_TYPES[type];

  return {
    maxSize: baseConfig.maxSize,
    allowedTypes: [...baseConfig.allowedTypes],
    allowedExtensions: [...baseConfig.allowedExtensions],
    scanContent: true,
    checkIntegrity: true,
  };
}

/**
 * Validar nombre de archivo
 */
function validateFileName(fileName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar caracteres peligrosos
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    errors.push('El nombre del archivo contiene caracteres no permitidos');
  }

  // Verificar longitud
  if (fileName.length > 255) {
    errors.push('El nombre del archivo es demasiado largo');
  }

  // Verificar que no sea solo espacios
  if (fileName.trim().length === 0) {
    errors.push('El nombre del archivo no puede estar vacío');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtener extensión de archivo
 */
function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
}

/**
 * Escanear contenido del archivo (simulado)
 */
async function scanFileContent(file: File): Promise<{ safe: boolean }> {
  try {
    // En una implementación real, aquí se integraría con un servicio de escaneo de malware
    // Por ahora, simulamos un escaneo básico

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verificar patrones básicos de archivos maliciosos
    const dangerousPatterns = [
      // Scripts peligrosos
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,

      // Ejecutables
      /^\x4d\x5a/, // MZ header (EXE)
      /^\x7f\x45\x4c\x46/, // ELF header
      /^\x23\x21/, // Shebang

      // Archivos comprimidos potencialmente peligrosos
      /^\x50\x4b\x03\x04/, // ZIP
      /^\x52\x61\x72\x21/, // RAR
    ];

    // Convertir primeros bytes a string para análisis de texto
    const firstBytes = Array.from(bytes.slice(0, Math.min(1024, bytes.length)))
      .map(b => String.fromCharCode(b))
      .join('');

    for (const pattern of dangerousPatterns) {
      if (pattern.test(firstBytes)) {
        logger.warn('Patrón peligroso detectado en archivo:', {
          fileName: file.name,
          pattern: pattern.toString(),
        });
        return { safe: false };
      }
    }

    return { safe: true };
  } catch (error) {
    logger.error('Error durante escaneo de contenido:', {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
    });

    // En caso de error, consideramos el archivo seguro por defecto
    return { safe: true };
  }
}

/**
 * Verificar integridad del archivo
 */
async function checkFileIntegrity(
  file: File
): Promise<{ integrity: boolean; hash: string; checksum: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Calcular hash simple (en producción usar crypto.subtle)
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]!;
      hash = (hash << 5) - hash + byte;
      hash = hash & hash; // Convertir a 32 bits
    }

    // Calcular checksum simple
    let checksum = 0;
    for (let i = 0; i < bytes.length; i++) {
      checksum = (checksum + bytes[i]!) % 256;
    }

    const hashString = Math.abs(hash).toString(16);
    const checksumString = checksum.toString(16).padStart(2, '0');

    // Verificar integridad básica (longitud y contenido no vacío)
    const integrity = bytes.length > 0 && bytes.some(byte => byte !== 0);

    return {
      integrity,
      hash: hashString,
      checksum: checksumString,
    };
  } catch (error) {
    logger.error('Error verificando integridad de archivo:', {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
    });

    return {
      integrity: false,
      hash: 'error',
      checksum: 'error',
    };
  }
}

/**
 * Formatear bytes a formato legible
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Middleware para validar archivos en endpoints
 */
export async function validateFileMiddleware(
  files: File[],
  type: keyof typeof FILE_TYPES = 'documents'
): Promise<{
  valid: boolean;
  results: ValidationResult[];
  summary: { valid: number; invalid: number; warnings: number };
}> {
  const config = getValidationConfig(type);
  const results = await validateFiles(files, config);

  const summary = {
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    warnings: results.reduce((acc, r) => acc + r.warnings.length, 0),
  };

  logger.info('Validación de archivos completada', {
    total: files.length,
    valid: summary.valid,
    invalid: summary.invalid,
    warnings: summary.warnings,
    type,
  });

  return {
    valid: summary.invalid === 0,
    results,
    summary,
  };
}
