import { exec } from 'child_process';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { logger } from './logger';
// Imports condicionales para servicios de nube (se cargan dinámicamente)
let S3Client: any = null;
let PutObjectCommand: any = null;
let Storage: any = null;

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    customCron?: string;
  };
  retention: {
    daily: number; // días
    weekly: number; // semanas
    monthly: number; // meses
  };
  storage: {
    local: boolean;
    remote: boolean;
    remoteConfig?: {
      provider: 's3' | 'gcs' | 'azure';
      bucket: string;
      region?: string;
      accessKey?: string;
      secretKey?: string;
    };
  };
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
}

export interface BackupResult {
  id: string;
  timestamp: Date;
  type: 'manual' | 'daily' | 'weekly' | 'monthly';
  size: number;
  duration: number;
  status: 'success' | 'failed' | 'partial';
  path: string;
  error?: string;
}

class BackupManager {
  private config: BackupConfig;
  private backupHistory: BackupResult[] = [];
  private isRunning: boolean = false;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      enabled: true,
      schedule: {
        daily: true,
        weekly: true,
        monthly: true,
      },
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
      },
      storage: {
        local: true,
        remote: false,
      },
      compression: true,
      encryption: false,
      ...config,
    };

    this.initializeBackupSystem();
  }

  private async initializeBackupSystem(): Promise<void> {
    try {
      // Crear directorio de backups si no existe
      const backupDir = path.join(process.cwd(), 'backups');
      await fsPromises.mkdir(backupDir, { recursive: true });

      // Crear directorio de configuración si no existe
      const configDir = path.join(process.cwd(), 'config');
      await fsPromises.mkdir(configDir, { recursive: true });

      logger.info('Sistema de backup inicializado', {
        context: 'backup.init',
        backupDir,
        config: this.config,
      });

      // Iniciar programador de backups
      this.startScheduler();

    } catch (error) {
      logger.error('Error inicializando sistema de backup', {
        context: 'backup.init-error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private startScheduler(): void {
    if (!this.config.enabled) return;

    // Backup diario
    if (this.config.schedule.daily) {
      setInterval(() => {
        const now = new Date();
        if (now.getHours() === 2 && now.getMinutes() === 0) { // 2:00 AM
          this.performBackup('daily');
        }
      }, 60 * 1000); // Verificar cada minuto
    }

    // Backup semanal (domingo a las 3:00 AM)
    if (this.config.schedule.weekly) {
      setInterval(() => {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() === 0) {
          this.performBackup('weekly');
        }
      }, 60 * 1000);
    }

    // Backup mensual (primer día del mes a las 4:00 AM)
    if (this.config.schedule.monthly) {
      setInterval(() => {
        const now = new Date();
        if (now.getDate() === 1 && now.getHours() === 4 && now.getMinutes() === 0) {
          this.performBackup('monthly');
        }
      }, 60 * 1000);
    }

    logger.info('Programador de backups iniciado', {
      context: 'backup.scheduler',
      schedule: this.config.schedule,
    });
  }

  public async performBackup(type: 'manual' | 'daily' | 'weekly' | 'monthly' = 'manual'): Promise<BackupResult> {
    if (this.isRunning) {
      throw new Error('Ya hay un backup en ejecución');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const backupId = `${type}_${Date.now()}`;

    try {
      logger.info('Iniciando backup', {
        context: 'backup.start',
        backupId,
        type,
      });

      // Crear backup de la base de datos
      const backupPath = await this.createDatabaseBackup(backupId);

      // Comprimir si está habilitado
      let finalPath = backupPath;
      if (this.config.compression) {
        finalPath = await this.compressBackup(backupPath);
        // Eliminar archivo original no comprimido
        await fsPromises.unlink(backupPath);
      }

      // Encriptar si está habilitado
      if (this.config.encryption && this.config.encryptionKey) {
        finalPath = await this.encryptBackup(finalPath, this.config.encryptionKey);
      }

      // Subir a almacenamiento remoto si está configurado
      if (this.config.storage.remote && this.config.storage.remoteConfig) {
        const remotePath = path.basename(finalPath);
        await this.uploadToCloud(finalPath, remotePath);
      }

      // Limpiar backups antiguos
      await this.cleanupOldBackups(type);

      const duration = Date.now() - startTime;
      const stats = await fsPromises.stat(finalPath);

      const result: BackupResult = {
        id: backupId,
        timestamp: new Date(),
        type,
        size: stats.size,
        duration,
        status: 'success',
        path: finalPath,
      };

      this.backupHistory.push(result);

      logger.info('Backup completado exitosamente', {
        context: 'backup.success',
        backupId,
        type,
        size: stats.size,
        duration,
        path: finalPath,
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      const result: BackupResult = {
        id: backupId,
        timestamp: new Date(),
        type,
        size: 0,
        duration,
        status: 'failed',
        path: '',
        error: error instanceof Error ? error.message : String(error),
      };

      this.backupHistory.push(result);

      logger.error('Error en backup', {
        context: 'backup.error',
        backupId,
        type,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  private async createDatabaseBackup(backupId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
      const backupDir = path.join(process.cwd(), 'backups');
      const backupPath = path.join(backupDir, `${backupId}.db`);

      // Para SQLite, simplemente copiar el archivo
      exec(`cp "${dbPath}" "${backupPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error creando backup: ${error.message}`));
          return;
        }

        if (stderr) {
          logger.warn('Advertencia en backup', {
            context: 'backup.warning',
            stderr,
          });
        }

        resolve(backupPath);
      });
    });
  }

  private async compressBackup(backupPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const compressedPath = `${backupPath}.gz`;

      exec(`gzip -c "${backupPath}" > "${compressedPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error comprimiendo backup: ${error.message}`));
          return;
        }

        resolve(compressedPath);
      });
    });
  }

  private async encryptBackup(backupPath: string, key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const encryptedPath = `${backupPath}.enc`;

      // Usar openssl para encriptar
      exec(`openssl enc -aes-256-cbc -salt -in "${backupPath}" -out "${encryptedPath}" -k "${key}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error encriptando backup: ${error.message}`));
          return;
        }

        resolve(encryptedPath);
      });
    });
  }

  private async uploadToRemote(backupPath: string, config: NonNullable<BackupConfig['storage']['remoteConfig']>): Promise<void> {
    // Implementar subida a servicios en la nube
    // Por ahora solo loggear
    logger.info('Subida a almacenamiento remoto simulada', {
      context: 'backup.upload-simulated',
      path: backupPath,
      provider: config.provider,
      bucket: config.bucket,
    });
  }

  private async cleanupOldBackups(currentType: string): Promise<void> {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      const files = await fsPromises.readdir(backupDir);

      const filteredFiles = files.filter(file => file.endsWith('.db') || file.endsWith('.db.gz') || file.endsWith('.db.enc'));

      const backupFiles = await Promise.all(
        filteredFiles.map(async (file) => {
          const filePath = path.join(backupDir, file);
          const stats = await fsPromises.stat(filePath);
          const type = this.getBackupTypeFromFilename(file);

          return {
            name: file,
            path: filePath,
            type,
            createdAt: stats.birthtime,
            size: stats.size,
          };
        })
      );

      backupFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Eliminar backups antiguos según retención
      const toDelete = [];

      if (currentType === 'daily') {
        const dailyBackups = backupFiles.filter(f => f.type === 'daily');
        if (dailyBackups.length > this.config.retention.daily) {
          toDelete.push(...dailyBackups.slice(this.config.retention.daily));
        }
      }

      if (currentType === 'weekly') {
        const weeklyBackups = backupFiles.filter(f => f.type === 'weekly');
        if (weeklyBackups.length > this.config.retention.weekly) {
          toDelete.push(...weeklyBackups.slice(this.config.retention.weekly));
        }
      }

      if (currentType === 'monthly') {
        const monthlyBackups = backupFiles.filter(f => f.type === 'monthly');
        if (monthlyBackups.length > this.config.retention.monthly) {
          toDelete.push(...monthlyBackups.slice(this.config.retention.monthly));
        }
      }

      for (const file of toDelete) {
        await fsPromises.unlink(file.path);
        logger.info('Backup antiguo eliminado', {
          context: 'backup.cleanup',
          file: file.name,
          type: file.type,
          createdAt: file.createdAt,
        });
      }

    } catch (error) {
      logger.error('Error limpiando backups antiguos', {
        context: 'backup.cleanup-error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getBackupTypeFromFilename(filename: string): string {
    if (filename.includes('weekly_')) return 'weekly';
    if (filename.includes('monthly_')) return 'monthly';
    if (filename.includes('daily_')) return 'daily';
    return 'manual';
  }

  public getBackupHistory(limit: number = 50): BackupResult[] {
    return this.backupHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Métodos para backup en la nube
  private async uploadToS3(filePath: string, remotePath: string): Promise<void> {
    if (!this.config.storage.remoteConfig) {
      throw new Error('Configuración de S3 no encontrada');
    }

    const { region, accessKey, secretKey, bucket } = this.config.storage.remoteConfig;

    if (!accessKey || !secretKey) {
      throw new Error('Credenciales de S3 no configuradas');
    }

    // Cargar dinámicamente las dependencias de AWS
    if (!S3Client || !PutObjectCommand) {
      try {
        const awsSdk = await import('@aws-sdk/client-s3');
        S3Client = awsSdk.S3Client;
        PutObjectCommand = awsSdk.PutObjectCommand;
      } catch (error) {
        logger.error('No se pudo cargar AWS SDK', { error });
        throw new Error('AWS SDK no disponible. Instale @aws-sdk/client-s3');
      }
    }

    const s3Client = new S3Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const fileContent = await fsPromises.readFile(filePath);
    const key = `backups/${remotePath}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: 'application/octet-stream',
    });

    await s3Client.send(command);
    logger.info('Backup subido a S3', {
      context: 'backup.s3-upload',
      bucket,
      key,
      fileSize: fileContent.length,
    });
  }

  private async uploadToGCS(filePath: string, remotePath: string): Promise<void> {
    if (!this.config.storage.remoteConfig) {
      throw new Error('Configuración de Google Cloud Storage no encontrada');
    }

    const { bucket } = this.config.storage.remoteConfig;

    // Cargar dinámicamente las dependencias de Google Cloud
    if (!Storage) {
      try {
        const gcsSdk = await import('@google-cloud/storage');
        Storage = gcsSdk.Storage;
      } catch (error) {
        logger.error('No se pudo cargar Google Cloud Storage SDK', { error });
        throw new Error('Google Cloud Storage SDK no disponible. Instale @google-cloud/storage');
      }
    }

    const storage = new Storage();
    const bucketInstance = storage.bucket(bucket);
    const fileName = `backups/${remotePath}`;

    await bucketInstance.upload(filePath, {
      destination: fileName,
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    logger.info('Backup subido a Google Cloud Storage', {
      context: 'backup.gcs-upload',
      bucket,
      fileName,
      localPath: filePath,
    });
  }

  private async uploadToAzure(filePath: string, remotePath: string): Promise<void> {
    logger.warn('Upload to Azure no implementado - funcionalidad pendiente', {
      context: 'backup.azure-placeholder',
      filePath,
      remotePath,
    });

    // En implementación futura:
    // - Instalar @azure/storage-blob
    // - Implementar subida a Azure Blob Storage
    // - Manejar credenciales de Azure
  }

  private async uploadToCloud(filePath: string, remotePath: string): Promise<void> {
    if (!this.config.storage.remote || !this.config.storage.remoteConfig) {
      logger.info('Backup en nube no configurado, omitiendo subida');
      return;
    }

    try {
      const { provider } = this.config.storage.remoteConfig;

      switch (provider) {
        case 's3':
          await this.uploadToS3(filePath, remotePath);
          break;
        case 'gcs':
          await this.uploadToGCS(filePath, remotePath);
          break;
        case 'azure':
          await this.uploadToAzure(filePath, remotePath);
          break;
        default:
          logger.warn('Proveedor de nube no soportado', {
            context: 'backup.cloud-provider-unsupported',
            provider,
          });
      }
    } catch (error) {
      logger.error('Error subiendo backup a la nube', {
        context: 'backup.cloud-upload-error',
        error: error instanceof Error ? error.message : String(error),
        provider: this.config.storage.remoteConfig?.provider,
      });
      // No lanzamos error para no detener el backup local
      logger.warn('Continuando con backup local a pesar del error en nube');
    }
  }

  public getConfig(): BackupConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configuración de backup actualizada', {
      context: 'backup.config-update',
      newConfig,
    });
  }

  public async restoreBackup(backupId: string): Promise<void> {
    try {
      const backup = this.backupHistory.find(b => b.id === backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} no encontrado`);
      }

      // Implementar lógica de restauración
      logger.info('Restauración de backup iniciada', {
        context: 'backup.restore',
        backupId,
        path: backup.path,
      });

      // Aquí iría la lógica real de restauración
      // ...

    } catch (error) {
      logger.error('Error restaurando backup', {
        context: 'backup.restore-error',
        backupId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Instancia singleton
export const backupManager = new BackupManager();

// Funciones de conveniencia
export const performBackup = (type?: 'manual' | 'daily' | 'weekly' | 'monthly') =>
  backupManager.performBackup(type);
export const getBackupHistory = (limit?: number) =>
  backupManager.getBackupHistory(limit);
export const restoreBackup = (backupId: string) =>
  backupManager.restoreBackup(backupId);
