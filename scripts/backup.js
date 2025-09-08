const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuración de backup
const BACKUP_CONFIG = {
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  backupDir: process.env.BACKUP_DIR || './backups',
  maxBackups: parseInt(process.env.MAX_BACKUPS || '10'),
  compression: process.env.BACKUP_COMPRESSION === 'true',
};

// Función principal de backup
async function createBackup() {
  try {
    console.log('🔄 Iniciando backup de la base de datos...');
    
    // Crear directorio de backup si no existe
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
      console.log(`📁 Directorio de backup creado: ${BACKUP_CONFIG.backupDir}`);
    }
    
    // Generar nombre del archivo de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `rent360-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_CONFIG.backupDir, backupFileName);
    
    // Determinar el tipo de base de datos
    const isSQLite = BACKUP_CONFIG.databaseUrl.startsWith('file:');
    
    if (isSQLite) {
      await backupSQLite(backupPath);
    } else {
      await backupPostgreSQL(backupPath);
    }
    
    // Comprimir backup si está habilitado
    if (BACKUP_CONFIG.compression) {
      await compressBackup(backupPath);
    }
    
    // Limpiar backups antiguos
    await cleanupOldBackups();
    
    console.log('✅ Backup completado exitosamente');
    return backupPath;
    
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  }
}

// Backup de SQLite
async function backupSQLite(backupPath) {
  console.log('📦 Realizando backup de SQLite...');
  
  const dbPath = BACKUP_CONFIG.databaseUrl.replace('file:', '');
  const absoluteDbPath = path.resolve(dbPath);
  
  // Verificar que el archivo de base de datos existe
  if (!fs.existsSync(absoluteDbPath)) {
    throw new Error(`Archivo de base de datos no encontrado: ${absoluteDbPath}`);
  }
  
  // Copiar archivo de base de datos
  fs.copyFileSync(absoluteDbPath, backupPath);
  
  console.log(`📄 Backup SQLite creado: ${backupPath}`);
}

// Backup de PostgreSQL
async function backupPostgreSQL(backupPath) {
  console.log('📦 Realizando backup de PostgreSQL...');
  
  // Extraer información de conexión de la URL
  const url = new URL(BACKUP_CONFIG.databaseUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;
  
  // Comando pg_dump
  const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupPath}`;
  
  try {
    await execAsync(pgDumpCmd);
    console.log(`📄 Backup PostgreSQL creado: ${backupPath}`);
  } catch (error) {
    throw new Error(`Error ejecutando pg_dump: ${error.message}`);
  }
}

// Comprimir backup
async function compressBackup(backupPath) {
  console.log('🗜️ Comprimiendo backup...');
  
  const compressedPath = `${backupPath}.gz`;
  const gzipCmd = `gzip -f "${backupPath}"`;
  
  try {
    await execAsync(gzipCmd);
    console.log(`📦 Backup comprimido: ${compressedPath}`);
    return compressedPath;
  } catch (error) {
    console.warn('⚠️ No se pudo comprimir el backup, manteniendo archivo original');
    return backupPath;
  }
}

// Limpiar backups antiguos
async function cleanupOldBackups() {
  console.log('🧹 Limpiando backups antiguos...');
  
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('rent360-backup-'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_CONFIG.backupDir, file),
        stats: fs.statSync(path.join(BACKUP_CONFIG.backupDir, file)),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    
    // Eliminar backups excedentes
    if (backupFiles.length > BACKUP_CONFIG.maxBackups) {
      const filesToDelete = backupFiles.slice(BACKUP_CONFIG.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Backup eliminado: ${file.name}`);
      }
    }
    
    console.log(`📊 Total de backups mantenidos: ${Math.min(backupFiles.length, BACKUP_CONFIG.maxBackups)}`);
    
  } catch (error) {
    console.warn('⚠️ Error limpiando backups antiguos:', error.message);
  }
}

// Función para restaurar backup
async function restoreBackup(backupPath) {
  try {
    console.log('🔄 Iniciando restauración de backup...');
    
    // Verificar que el archivo de backup existe
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Archivo de backup no encontrado: ${backupPath}`);
    }
    
    // Determinar el tipo de base de datos
    const isSQLite = BACKUP_CONFIG.databaseUrl.startsWith('file:');
    
    if (isSQLite) {
      await restoreSQLite(backupPath);
    } else {
      await restorePostgreSQL(backupPath);
    }
    
    console.log('✅ Restauración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
    throw error;
  }
}

// Restaurar SQLite
async function restoreSQLite(backupPath) {
  console.log('📦 Restaurando backup de SQLite...');
  
  const dbPath = BACKUP_CONFIG.databaseUrl.replace('file:', '');
  const absoluteDbPath = path.resolve(dbPath);
  
  // Crear directorio si no existe
  const dbDir = path.dirname(absoluteDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Copiar archivo de backup a la ubicación de la base de datos
  fs.copyFileSync(backupPath, absoluteDbPath);
  
  console.log(`📄 Base de datos SQLite restaurada desde: ${backupPath}`);
}

// Restaurar PostgreSQL
async function restorePostgreSQL(backupPath) {
  console.log('📦 Restaurando backup de PostgreSQL...');
  
  // Extraer información de conexión de la URL
  const url = new URL(BACKUP_CONFIG.databaseUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;
  
  // Comando psql para restauración
  const psqlCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupPath}"`;
  
  try {
    await execAsync(psqlCmd);
    console.log(`📄 Base de datos PostgreSQL restaurada desde: ${backupPath}`);
  } catch (error) {
    throw new Error(`Error ejecutando psql: ${error.message}`);
  }
}

// Función para listar backups disponibles
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      console.log('📁 No hay directorio de backup');
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('rent360-backup-'))
      .map(file => {
        const filePath = path.join(BACKUP_CONFIG.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          sizeFormatted: formatFileSize(stats.size),
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    console.log('📋 Backups disponibles:');
    backupFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.sizeFormatted}) - ${file.created.toLocaleString()}`);
    });
    
    return backupFiles;
    
  } catch (error) {
    console.error('❌ Error listando backups:', error);
    return [];
  }
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para obtener estadísticas de backup
function getBackupStats() {
  try {
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }
    
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('rent360-backup-'))
      .map(file => {
        const filePath = path.join(BACKUP_CONFIG.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.mtime,
        };
      })
      .sort((a, b) => a.created.getTime() - b.created.getTime());
    
    const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
    
    return {
      totalBackups: backupFiles.length,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      oldestBackup: backupFiles[0]?.created || null,
      newestBackup: backupFiles[backupFiles.length - 1]?.created || null,
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      totalBackups: 0,
      totalSize: 0,
      totalSizeFormatted: '0 Bytes',
      oldestBackup: null,
      newestBackup: null,
    };
  }
}

// Exportar funciones
module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  getBackupStats,
  BACKUP_CONFIG,
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error('❌ Debe especificar la ruta del backup a restaurar');
        process.exit(1);
      }
      restoreBackup(backupPath)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      listBackups();
      break;
      
    case 'stats':
      const stats = getBackupStats();
      console.log('📊 Estadísticas de backup:');
      console.log(`Total de backups: ${stats.totalBackups}`);
      console.log(`Tamaño total: ${stats.totalSizeFormatted}`);
      console.log(`Backup más antiguo: ${stats.oldestBackup?.toLocaleString() || 'N/A'}`);
      console.log(`Backup más reciente: ${stats.newestBackup?.toLocaleString() || 'N/A'}`);
      break;
      
    default:
      console.log('📖 Uso: node backup.js [comando] [opciones]');
      console.log('');
      console.log('Comandos disponibles:');
      console.log('  create    - Crear un nuevo backup');
      console.log('  restore   - Restaurar un backup existente');
      console.log('  list      - Listar backups disponibles');
      console.log('  stats     - Mostrar estadísticas de backup');
      console.log('');
      console.log('Ejemplos:');
      console.log('  node backup.js create');
      console.log('  node backup.js restore ./backups/rent360-backup-2024-01-01.db');
      console.log('  node backup.js list');
      console.log('  node backup.js stats');
      break;
  }
}
