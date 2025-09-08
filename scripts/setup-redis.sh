#!/bin/bash

# Script de configuración de Redis para Rent360
# Configura Redis para cache y sesiones

set -e

echo "🔴 Configurando Redis para Rent360..."

# Variables de configuración
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/config/production.env"

# Función para verificar si una variable de entorno está configurada
check_env_var() {
    local var_name="$1"
    if grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
        local value=$(grep "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
        if [[ "$value" != *"your-"* && "$value" != *"change-in-production"* ]]; then
            echo "✅ $var_name: Configurado"
            return 0
        fi
    fi
    echo "❌ $var_name: NO CONFIGURADO"
    return 1
}

# =====================================================
# INSTALACIÓN DE REDIS
# =====================================================

install_redis() {
    echo "📦 Instalando Redis..."

    # Verificar si Redis ya está instalado
    if command -v redis-server &> /dev/null; then
        echo "✅ Redis ya está instalado"
        return 0
    fi

    # Instalar Redis según el sistema operativo
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y redis-server

    elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
        # CentOS/RHEL/Fedora
        if command -v dnf &> /dev/null; then
            sudo dnf install -y redis
        else
            sudo yum install -y redis
        fi

    elif command -v apk &> /dev/null; then
        # Alpine Linux
        sudo apk add redis

    else
        echo "❌ Sistema operativo no soportado para instalación automática de Redis"
        echo "💡 Instala Redis manualmente o usa Docker:"
        echo "   docker run -d -p 6379:6379 --name redis redis:alpine"
        return 1
    fi

    echo "✅ Redis instalado"
    return 0
}

# =====================================================
# CONFIGURACIÓN DE REDIS
# =====================================================

configure_redis() {
    echo "⚙️ Configurando Redis..."

    # Crear directorios necesarios
    sudo mkdir -p /var/lib/redis
    sudo mkdir -p /var/log/redis
    sudo chown redis:redis /var/lib/redis
    sudo chown redis:redis /var/log/redis

    # Copiar configuración personalizada
    sudo cp "$PROJECT_ROOT/config/redis.conf" /etc/redis/redis.conf

    # Configurar contraseña si está disponible
    if check_env_var "REDIS_PASSWORD"; then
        REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
        sudo sed -i "s/your-secure-redis-password/$REDIS_PASSWORD/" /etc/redis/redis.conf
    fi

    # Reiniciar Redis con nueva configuración
    sudo systemctl restart redis
    sudo systemctl enable redis

    echo "✅ Redis configurado"
}

# =====================================================
# INSTALACIÓN DE REDIS CLUSTER (OPCIONAL)
# =====================================================

setup_redis_cluster() {
    echo "🔗 Configurando Redis Cluster..."

    # Instalar Ruby y gem redis para gestión del cluster
    if ! command -v ruby &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y ruby-full
        elif command -v yum &> /dev/null; then
            sudo yum install -y ruby
        fi
    fi

    # Instalar redis gem
    sudo gem install redis

    # Crear script para gestión del cluster
    cat << EOF > "$PROJECT_ROOT/scripts/redis-cluster.sh"
#!/bin/bash

# Script para gestión de Redis Cluster

CLUSTER_NODES="${REDIS_CLUSTER_NODES:-redis://localhost:6379,redis://localhost:6380,redis://localhost:6381}"

create_cluster() {
    echo "Creando cluster Redis..."
    redis-cli --cluster create \$CLUSTER_NODES --cluster-replicas 1
}

check_cluster() {
    echo "Verificando estado del cluster..."
    redis-cli --cluster check localhost:6379
}

reshard_cluster() {
    echo "Rebalanceando cluster..."
    redis-cli --cluster rebalance localhost:6379
}

add_node() {
    local new_node="\$1"
    echo "Añadiendo nodo \$new_node al cluster..."
    redis-cli --cluster add-node \$new_node localhost:6379
}

remove_node() {
    local node="\$1"
    echo "Removiendo nodo \$node del cluster..."
    redis-cli --cluster del-node localhost:6379 \$node
}

case "\$1" in
    create)
        create_cluster
        ;;
    check)
        check_cluster
        ;;
    reshard)
        reshard_cluster
        ;;
    add)
        add_node "\$2"
        ;;
    remove)
        remove_node "\$2"
        ;;
    *)
        echo "Uso: \$0 {create|check|reshard|add <node>|remove <node>}"
        exit 1
        ;;
esac
EOF

    chmod +x "$PROJECT_ROOT/scripts/redis-cluster.sh"

    echo "✅ Redis Cluster configurado"
}

# =====================================================
# CONFIGURACIÓN DE SESIONES EN NEXT.JS
# =====================================================

configure_sessions() {
    echo "🔐 Configurando sesiones con Redis..."

    # Instalar dependencias necesarias
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        npm install ioredis connect-redis express-session @types/express-session
    fi

    # Crear configuración de sesiones
    cat << EOF > "$PROJECT_ROOT/lib/redis/session-store.ts"
/**
 * Redis Session Store for Next.js
 */

import Redis from 'ioredis';
import { RedisStore } from 'connect-redis';
import { sessionConfig } from './config';

class SessionStore {
  private redis: Redis;
  private store: RedisStore;

  constructor() {
    this.redis = new Redis(sessionConfig.redis);
    this.store = new RedisStore({
      client: this.redis,
      prefix: sessionConfig.prefix,
      ttl: sessionConfig.ttl
    });
  }

  getStore() {
    return this.store;
  }

  getClient() {
    return this.redis;
  }

  async close() {
    await this.redis.quit();
  }

  // Métodos de utilidad
  async setSession(sessionId: string, data: any, ttl?: number) {
    const key = \`\${sessionConfig.prefix}\${sessionId}\`;
    await this.redis.setex(key, ttl || sessionConfig.ttl, JSON.stringify(data));
  }

  async getSession(sessionId: string) {
    const key = \`\${sessionConfig.prefix}\${sessionId}\`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string) {
    const key = \`\${sessionConfig.prefix}\${sessionId}\`;
    await this.redis.del(key);
  }

  async getAllSessions() {
    const keys = await this.redis.keys(\`\${sessionConfig.prefix}*\`);
    const sessions = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        sessions.push({
          id: key.replace(sessionConfig.prefix, ''),
          data: JSON.parse(data)
        });
      }
    }

    return sessions;
  }

  async cleanupExpiredSessions() {
    // Redis maneja la expiración automáticamente
    // Este método puede ser usado para limpieza manual si es necesario
    const keys = await this.redis.keys(\`\${sessionConfig.prefix}*\`);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -2) { // Key doesn't exist
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const sessionStore = new SessionStore();
export default sessionStore;
EOF

    # Crear configuración de Redis
    cat << EOF > "$PROJECT_ROOT/lib/redis/config.ts"
/**
 * Redis Configuration
 */

import { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;

// Parse Redis URL
const url = new URL(redisUrl);

export const redisConfig: RedisOptions = {
  host: url.hostname,
  port: parseInt(url.port) || 6379,
  password: redisPassword,
  db: parseInt(url.pathname.slice(1)) || 0,

  // Connection options
  lazyConnect: true,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  connectTimeout: 60000,
  commandTimeout: 5000,

  // Cluster options
  enableReadyCheck: false,
  clusterRetryDelay: 100,

  // TLS options (if using Redis with TLS)
  // tls: process.env.NODE_ENV === 'production' ? {} : undefined,
};

export const sessionConfig = {
  redis: redisConfig,
  prefix: process.env.SESSION_PREFIX || 'rent360:sess:',
  ttl: parseInt(process.env.SESSION_MAX_AGE || '86400000') / 1000, // Convert to seconds
  secret: process.env.SESSION_SECRET || 'your-session-secret-key'
};

export const cacheConfig = {
  redis: redisConfig,
  prefix: process.env.CACHE_PREFIX || 'rent360:cache:',
  ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour in seconds
  compression: true,
  keyPrefix: 'rent360:'
};
EOF

    # Crear utilidad de cache
    cat << EOF > "$PROJECT_ROOT/lib/redis/cache.ts"
/**
 * Redis Cache Utility
 */

import Redis from 'ioredis';
import { cacheConfig } from './config';
import { logger } from '@/lib/logger';

class Cache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(cacheConfig.redis);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      logger.info('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis cache error:', error);
    });

    this.redis.on('ready', () => {
      logger.info('Redis cache ready');
    });
  }

  private getKey(key: string): string {
    return \`\${cacheConfig.prefix}\${key}\`;
  }

  async get(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(this.getKey(key));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const finalTtl = ttl || cacheConfig.ttl;

      await this.redis.setex(this.getKey(key), finalTtl, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.redis.expire(this.getKey(key), ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.getKey(key));
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -1;
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys = await this.redis.keys(\`\${cacheConfig.prefix}\${pattern}\`);
      return keys.map(key => key.replace(cacheConfig.prefix, ''));
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  async clear(pattern: string = '*'): Promise<number> {
    try {
      const keys = await this.redis.keys(\`\${cacheConfig.prefix}\${pattern}\`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return 0;
    }
  }

  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const lines = info.split('\\n');

      let keys = 0;
      let memory = '0';
      let hits = 0;
      let misses = 0;

      lines.forEach(line => {
        if (line.startsWith('db0:')) {
          const match = line.match(/keys=(\\d+)/);
          if (match) keys = parseInt(match[1]);
        } else if (line.startsWith('used_memory:')) {
          memory = line.split(':')[1];
        } else if (line.startsWith('keyspace_hits:')) {
          hits = parseInt(line.split(':')[1]);
        } else if (line.startsWith('keyspace_misses:')) {
          misses = parseInt(line.split(':')[1]);
        }
      });

      return { keys, memory, hits, misses };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { keys: 0, memory: '0', hits: 0, misses: 0 };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async close() {
    await this.redis.quit();
  }
}

export const cache = new Cache();
export default cache;
EOF

    echo "✅ Sesiones y cache con Redis configurados"
}

# =====================================================
# CONFIGURACIÓN DE NEXT.JS PARA USAR REDIS
# =====================================================

configure_nextjs() {
    echo "⚛️ Configurando Next.js para usar Redis..."

    # Crear archivo de configuración de Next.js con Redis
    cat << EOF > "$PROJECT_ROOT/lib/redis/nextjs-config.ts"
/**
 * Next.js Configuration with Redis Cache
 */

import cache from './cache';
import { logger } from '@/lib/logger';

// Cache wrapper for Next.js
export const redisCache = {
  async get(key: string) {
    try {
      const data = await cache.get(key);
      logger.debug(\`Cache hit for key: \${key}\`);
      return data;
    } catch (error) {
      logger.error(\`Cache get error for key \${key}:\`, error);
      return null;
    }
  },

  async set(key: string, data: any, options?: { revalidate?: number }) {
    try {
      const ttl = options?.revalidate;
      await cache.set(key, data, ttl);
      logger.debug(\`Cache set for key: \${key}, TTL: \${ttl}\`);
    } catch (error) {
      logger.error(\`Cache set error for key \${key}:\`, error);
    }
  },

  async revalidateTag(tag: string) {
    try {
      // Clear all cache entries with this tag
      const pattern = \`tag:\${tag}:*\`;
      const cleared = await cache.clear(pattern);
      logger.info(\`Revalidated tag '\${tag}': cleared \${cleared} entries\`);
    } catch (error) {
      logger.error(\`Revalidate tag error for \${tag}:\`, error);
    }
  }
};

// ISR (Incremental Static Regeneration) helper
export const revalidatePage = async (path: string, revalidate?: number) => {
  try {
    await fetch(\`\${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?secret=\${process.env.REVALIDATE_TOKEN}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, revalidate }),
    });
    logger.info(\`Revalidated page: \${path}\`);
  } catch (error) {
    logger.error(\`Revalidate page error for \${path}:\`, error);
  }
};

// Cache middleware for API routes
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: any, res: any, next: any) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = \`api:\${req.url}\`;

    try {
      // Check cache
      const cached = await cache.get(key);
      if (cached) {
        logger.debug(\`API cache hit: \${key}\`);
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      res.json = async (data: any) => {
        // Cache the response
        await cache.set(key, data, ttl);
        logger.debug(\`API cache set: \${key}, TTL: \${ttl}\`);

        // Call original json method
        originalJson.call(res, data);
      };

      next();
    } catch (error) {
      logger.error(\`Cache middleware error for \${key}:\`, error);
      next();
    }
  };
};
EOF

    echo "✅ Next.js configurado con Redis"
}

# =====================================================
# CONFIGURACIÓN DE MONITOREO DE REDIS
# =====================================================

configure_monitoring() {
    echo "📊 Configurando monitoreo de Redis..."

    # Crear script de monitoreo
    cat << EOF > "$PROJECT_ROOT/scripts/monitor-redis.sh"
#!/bin/bash

# Script de monitoreo para Redis

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# Función para ejecutar comandos Redis
redis_cmd() {
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" "\$@"
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" "\$@"
    fi
}

# Verificar conexión
check_connection() {
    echo "🔍 Verificando conexión a Redis..."
    if redis_cmd ping | grep -q "PONG"; then
        echo "✅ Redis está conectado"
        return 0
    else
        echo "❌ Redis no está conectado"
        return 1
    fi
}

# Obtener estadísticas
get_stats() {
    echo "📊 Estadísticas de Redis:"
    redis_cmd info stats | grep -E "(total_connections_received|total_commands_processed|keyspace_hits|keyspace_misses)"
}

# Verificar uso de memoria
check_memory() {
    echo "🧠 Uso de memoria:"
    redis_cmd info memory | grep -E "(used_memory_human|maxmemory|mem_fragmentation_ratio)"
}

# Verificar conexiones activas
check_connections() {
    echo "🔗 Conexiones activas:"
    redis_cmd info clients | grep -E "(connected_clients|maxclients)"
}

# Verificar rendimiento
check_performance() {
    echo "⚡ Rendimiento:"
    redis_cmd info cpu | grep -E "(used_cpu_sys|used_cpu_user)"
}

# Monitoreo continuo (opcional)
monitor_continuous() {
    echo "🔄 Monitoreo continuo iniciado (Ctrl+C para detener)..."
    while true; do
        echo "=== \$(date) ==="
        check_connection || exit 1
        check_memory
        check_connections
        echo ""
        sleep 60
    done
}

# Alertas
send_alert() {
    local message="\$1"
    local severity="\$2"

    echo "🚨 ALERTA: \$message"

    # Aquí puedes integrar con servicios de alertas
    # Ejemplo: enviar a Slack, email, etc.
}

# Verificaciones de salud
health_check() {
    # Verificar memoria
    local mem_usage=\$(redis_cmd info memory | grep used_memory: | cut -d: -f2)
    local max_mem=\$(redis_cmd config get maxmemory | tail -1)

    if [ "\$max_mem" != "0" ] && [ "\$mem_usage" -gt "\$((max_mem * 80 / 100))" ]; then
        send_alert "Uso de memoria alto: \$mem_usage bytes" "warning"
    fi

    # Verificar conexiones
    local connections=\$(redis_cmd info clients | grep connected_clients: | cut -d: -f2)
    if [ "\$connections" -gt 1000 ]; then
        send_alert "Muchas conexiones activas: \$connections" "warning"
    fi

    echo "✅ Verificación de salud completada"
}

case "\$1" in
    status)
        check_connection && get_stats && check_memory && check_connections
        ;;
    monitor)
        monitor_continuous
        ;;
    health)
        health_check
        ;;
    *)
        echo "Uso: \$0 {status|monitor|health}"
        echo "  status  - Ver estado actual"
        echo "  monitor - Monitoreo continuo"
        echo "  health  - Verificación de salud"
        exit 1
        ;;
esac
EOF

    chmod +x "$PROJECT_ROOT/scripts/monitor-redis.sh"

    echo "✅ Monitoreo de Redis configurado"
}

# =====================================================
# EJECUCIÓN PRINCIPAL
# =====================================================

# Instalar Redis
install_redis

# Configurar Redis
configure_redis

# Configurar sesiones y cache
configure_sessions

# Configurar Next.js
configure_nextjs

# Configurar monitoreo
configure_monitoring

# Configurar cluster si está habilitado
if check_env_var "REDIS_CLUSTER_ENABLED" && grep -q "^REDIS_CLUSTER_ENABLED=true" "$ENV_FILE"; then
    setup_redis_cluster
fi

echo ""
echo "🎉 Configuración de Redis completada!"
echo ""
echo "📋 Servicios configurados:"
echo "  ✅ Redis Server"
echo "  ✅ Sesiones con Redis"
echo "  ✅ Cache con Redis"
echo "  ✅ Monitoreo de Redis"
echo "  ✅ Configuración Next.js"
echo ""

echo "🚀 Próximos pasos:"
echo "1. Reinicia tu aplicación: npm run build && npm start"
echo "2. Verifica que Redis esté funcionando: redis-cli ping"
echo "3. Revisa las métricas: ./scripts/monitor-redis.sh status"
echo "4. Configura backups de Redis"
echo ""

echo "🔧 Comandos útiles:"
echo "  # Ver estado de Redis:"
echo "  redis-cli info"
echo ""
echo "  # Monitoreo continuo:"
echo "  ./scripts/monitor-redis.sh monitor"
echo ""
echo "  # Verificar salud:"
echo "  ./scripts/monitor-redis.sh health"
echo ""
echo "  # Gestionar cluster (si está habilitado):"
echo "  ./scripts/redis-cluster.sh check"
echo ""

echo "⚠️ Recuerda:"
echo "  - Configurar firewall para Redis (puerto 6379)"
echo "  - Configurar backups automáticos"
echo "  - Monitorear el uso de memoria"
echo "  - Configurar alertas para cuando Redis esté caído"
