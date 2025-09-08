#!/bin/bash

# Script de configuración de monitoreo de logs y alertas para Rent360
# Configura monitoreo centralizado de logs y sistema de alertas

set -e

echo "📊 Configurando monitoreo de logs y alertas para Rent360..."

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
# CONFIGURACIÓN DE LOGROTATE
# =====================================================

setup_logrotate() {
    echo "🔄 Configurando rotación de logs..."

    # Crear configuración de logrotate para aplicación
    cat << EOF | sudo tee /etc/logrotate.d/rent360
/var/log/rent360/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Reiniciar aplicación si es necesario
        if [ -f /var/run/rent360.pid ]; then
            kill -USR1 \$(cat /var/run/rent360.pid) 2>/dev/null || true
        fi
    endscript
}

/var/log/rent360/error.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        # Enviar alerta por email si hay errores críticos
        if [ -f /var/log/rent360/error.log ]; then
            ERROR_COUNT=\$(grep -c "ERROR\|CRITICAL" /var/log/rent360/error.log 2>/dev/null || echo "0")
            if [ "\$ERROR_COUNT" -gt 100 ]; then
                echo "Alerta: Alto número de errores en Rent360 (\$ERROR_COUNT)" | mail -s "Rent360 Error Alert" admin@rent360.com
            fi
        fi
    endscript
}

/var/log/rent360/access.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        # Comprimir logs antiguos
        find /var/log/rent360 -name "*.log.*" -mtime +7 -exec gzip {} \; 2>/dev/null || true
    endscript
}
EOF

    # Configuración de logrotate para Nginx
    cat << EOF | sudo tee /etc/logrotate.d/nginx-rent360
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

    # Configuración de logrotate para PostgreSQL
    cat << EOF | sudo tee /etc/logrotate.d/postgresql-rent360
/var/log/postgresql/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 postgres postgres
    sharedscripts
    postrotate
        if [ -f /var/run/postgresql/*.pid ]; then
            kill -HUP \$(cat /var/run/postgresql/*.pid) 2>/dev/null || true
        fi
    endscript
}
EOF

    # Probar configuración
    sudo logrotate -d /etc/logrotate.d/rent360

    echo "✅ Logrotate configurado"
}

# =====================================================
# CONFIGURACIÓN DE RSYSLOG
# =====================================================

setup_rsyslog() {
    echo "📝 Configurando RSyslog..."

    # Crear directorio para logs
    sudo mkdir -p /var/log/rent360
    sudo chown syslog:adm /var/log/rent360

    # Configuración de rsyslog para aplicación Rent360
    cat << EOF | sudo tee /etc/rsyslog.d/rent360.conf
# RSyslog configuration for Rent360 application

# Reglas para logs de aplicación
if \$programname == 'rent360' then /var/log/rent360/app.log
& stop

if \$programname == 'rent360-error' then /var/log/rent360/error.log
& stop

if \$programname == 'rent360-access' then /var/log/rent360/access.log
& stop

# Reglas para logs de Nginx
if \$programname == 'nginx' and \$msg contains 'error' then /var/log/rent360/nginx-error.log
& stop

# Reglas para logs de PostgreSQL
if \$programname == 'postgres' then /var/log/rent360/postgres.log
& stop

# Reglas para logs de Redis
if \$programname == 'redis' then /var/log/rent360/redis.log
& stop

# Reglas generales de seguridad
if \$msg contains 'authentication failure' then /var/log/rent360/security.log
& stop

if \$msg contains 'sudo' then /var/log/rent360/sudo.log
& stop

# Reglas de monitoreo de rendimiento
if \$msg contains 'high cpu' or \$msg contains 'high memory' then /var/log/rent360/performance.log
& stop

# Configuración de rate limiting para prevenir spam de logs
\$RateLimitInterval 5
\$RateLimitBurst 100
EOF

    # Configuración para envío remoto de logs (opcional)
    cat << EOF | sudo tee /etc/rsyslog.d/rent360-remote.conf
# Remote logging configuration for Rent360
# Descomentar y configurar si necesitas envío remoto

# *.* @@logs.rent360.com:514
# *.* @@backup-logs.rent360.com:514

# Configuración con TLS para logs remotos
# \$DefaultNetstreamDriver gtls
# \$DefaultNetstreamDriverCAFile /etc/ssl/certs/ca-certificates.crt
# *.* @@logs.rent360.com:6514
EOF

    # Reiniciar rsyslog
    sudo systemctl restart rsyslog
    sudo systemctl enable rsyslog

    echo "✅ RSyslog configurado"
}

# =====================================================
# CONFIGURACIÓN DE LOGSTASH (OPCIONAL)
# =====================================================

setup_logstash() {
    echo "🔍 Configurando Logstash..."

    # Instalar Logstash si no está instalado
    if ! command -v logstash &> /dev/null; then
        echo "📦 Instalando Logstash..."

        # Añadir repositorio de Elastic
        wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
        echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list

        sudo apt-get update
        sudo apt-get install -y logstash
    fi

    # Crear configuración de Logstash para procesar logs de Rent360
    cat << EOF | sudo tee /etc/logstash/conf.d/rent360.conf
input {
  file {
    path => "/var/log/rent360/*.log"
    start_position => "beginning"
    sincedb_path => "/var/lib/logstash/plugins/inputs/file/.sincedb_rent360"
    tags => ["rent360"]
  }

  file {
    path => "/var/log/nginx/*.log"
    start_position => "beginning"
    sincedb_path => "/var/lib/logstash/plugins/inputs/file/.sincedb_nginx"
    tags => ["nginx"]
  }

  file {
    path => "/var/log/postgresql/*.log"
    start_position => "beginning"
    sincedb_path => "/var/lib/logstash/plugins/inputs/file/.sincedb_postgres"
    tags => ["postgres"]
  }
}

filter {
  if "rent360" in [tags] {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{DATA:component} %{GREEDYDATA:message}" }
    }

    if [level] == "ERROR" or [level] == "CRITICAL" {
      mutate {
        add_tag => ["error"]
      }
    }
  }

  if "nginx" in [tags] {
    grok {
      match => { "message" => '%{IPORHOST:clientip} - %{DATA:user} \[%{HTTPDATE:timestamp}\] "%{WORD:method} %{DATA:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response} %{NUMBER:bytes} "%{DATA:referrer}" "%{DATA:agent}"' }
    }

    if [response] >= 400 {
      mutate {
        add_tag => ["error"]
      }
    }
  }

  if "postgres" in [tags] {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{DATA:user} %{DATA:database} %{DATA:level}: %{GREEDYDATA:message}" }
    }
  }

  # Añadir campos comunes
  mutate {
    add_field => {
      "service" => "rent360"
      "environment" => "production"
      "hostname" => "\%{HOSTNAME}"
    }
  }

  date {
    match => ["timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss,SSS"]
  }
}

output {
  if "_grokparsefailure" not in [tags] {
    elasticsearch {
      hosts => ["localhost:9200"]
      index => "rent360-logs-%{+YYYY.MM.dd}"
      document_type => "log"
    }

    # También enviar a archivo para backup
    file {
      path => "/var/log/logstash/rent360-processed-%{+YYYY-MM-dd}.log"
      codec => json_lines
    }
  }

  # Logs con errores van a un índice separado
  if "error" in [tags] {
    elasticsearch {
      hosts => ["localhost:9200"]
      index => "rent360-errors-%{+YYYY.MM.dd}"
      document_type => "error"
    }
  }
}
EOF

    # Crear directorio para archivos de Logstash
    sudo mkdir -p /var/log/logstash
    sudo chown logstash:logstash /var/log/logstash

    # Reiniciar Logstash
    sudo systemctl restart logstash
    sudo systemctl enable logstash

    echo "✅ Logstash configurado"
}

# =====================================================
# CONFIGURACIÓN DE ALERTAS
# =====================================================

setup_alerts() {
    echo "🚨 Configurando sistema de alertas..."

    # Instalar herramientas necesarias
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y mailutils ssmtp curl jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y mailx sendmail curl jq
    fi

    # Configuración de email para alertas
    cat << EOF | sudo tee /etc/ssmtp/ssmtp.conf
root=postmaster
mailhub=smtp.gmail.com:587
hostname=rent360.com
AuthUser=alerts@rent360.com
AuthPass=your-app-password
UseSTARTTLS=YES
FromLineOverride=YES
EOF

    # Configuración de aliases para email
    cat << EOF | sudo tee /etc/aliases
# Alert aliases for Rent360
root: admin@rent360.com
rent360-alerts: dev-team@rent360.com,ops-team@rent360.com
EOF

    sudo newaliases

    # Crear script de alertas
    cat << EOF | sudo tee /usr/local/bin/rent360-alert
#!/bin/bash

# Script de alertas para Rent360

SEVERITY="\$1"
SUBJECT="\$2"
MESSAGE="\$3"
RECIPIENT="\$4"

if [ -z "\$RECIPIENT" ]; then
    RECIPIENT="admin@rent360.com"
fi

# Formatear mensaje según severidad
case "\$SEVERITY" in
    "critical")
        FORMATTED_SUBJECT="🚨 CRITICAL: \$SUBJECT"
        ;;
    "warning")
        FORMATTED_SUBJECT="⚠️ WARNING: \$SUBJECT"
        ;;
    "info")
        FORMATTED_SUBJECT="ℹ️ INFO: \$SUBJECT"
        ;;
    *)
        FORMATTED_SUBJECT="📢 ALERT: \$SUBJECT"
        ;;
esac

# Enviar email
echo "\$MESSAGE" | mail -s "\$FORMATTED_SUBJECT" "\$RECIPIENT"

# También loggear la alerta
logger -t rent360-alert "\$SEVERITY: \$SUBJECT - \$MESSAGE"

# Integración con Slack (opcional)
if [ -n "\$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \\
        --data "{
            \"text\": \"\$FORMATTED_SUBJECT\",
            \"blocks\": [
                {
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*\$FORMATTED_SUBJECT*\n\$MESSAGE\"
                    }
                }
            ]
        }" \\
        "\$SLACK_WEBHOOK_URL"
fi

# Integración con PagerDuty (opcional)
if [ -n "\$PAGERDUTY_INTEGRATION_KEY" ] && [ "\$SEVERITY" = "critical" ]; then
    curl -X POST \\
        -H "Content-Type: application/json" \\
        -d "{
            \"routing_key\": \"\$PAGERDUTY_INTEGRATION_KEY\",
            \"event_action\": \"trigger\",
            \"payload\": {
                \"summary\": \"\$SUBJECT\",
                \"source\": \"rent360-production\",
                \"severity\": \"\$SEVERITY\",
                \"component\": \"application\",
                \"group\": \"production\",
                \"class\": \"alert\",
                \"custom_details\": {
                    \"message\": \"\$MESSAGE\"
                }
            }
        }" \\
        https://events.pagerduty.com/v2/enqueue
fi
EOF

    sudo chmod +x /usr/local/bin/rent360-alert

    # Crear script de verificación de salud
    cat << EOF | sudo tee /usr/local/bin/rent360-health-check
#!/bin/bash

# Script de verificación de salud para Rent360

LOG_FILE="/var/log/rent360/health-check.log"
ALERT_SCRIPT="/usr/local/bin/rent360-alert"

# Función para verificar servicio
check_service() {
    local service="\$1"
    local check_command="\$2"
    local critical=\${3:-false}

    echo "\$(date): Verificando \$service..." >> "\$LOG_FILE"

    if eval "\$check_command"; then
        echo "\$(date): ✅ \$service OK" >> "\$LOG_FILE"
        return 0
    else
        echo "\$(date): ❌ \$service FALLANDO" >> "\$LOG_FILE"

        if [ "\$critical" = "true" ]; then
            "\$ALERT_SCRIPT" "critical" "\$service no disponible" "El servicio \$service no está respondiendo" "ops-team@rent360.com"
        else
            "\$ALERT_SCRIPT" "warning" "\$service con problemas" "El servicio \$service tiene problemas" "ops-team@rent360.com"
        fi
        return 1
    fi
}

# Verificar aplicación
check_service "Aplicación Rent360" "curl -s -f http://localhost:3000/api/health/live" "true"

# Verificar base de datos
check_service "Base de datos PostgreSQL" "pg_isready -h localhost -p 5432" "true"

# Verificar Redis
check_service "Redis" "redis-cli ping | grep -q PONG" "true"

# Verificar Nginx
check_service "Nginx" "curl -s -f http://localhost/health" "true"

# Verificar espacio en disco
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ "\$DISK_USAGE" -gt 90 ]; then
    "\$ALERT_SCRIPT" "critical" "Espacio en disco bajo" "Uso de disco: \$DISK_USAGE%" "ops-team@rent360.com"
elif [ "\$DISK_USAGE" -gt 80 ]; then
    "\$ALERT_SCRIPT" "warning" "Espacio en disco alto" "Uso de disco: \$DISK_USAGE%" "ops-team@rent360.com"
fi

# Verificar uso de memoria
MEM_USAGE=\$(free | grep Mem | awk '{printf "%.0f", \$3/\$2 * 100.0}')
if [ "\$MEM_USAGE" -gt 90 ]; then
    "\$ALERT_SCRIPT" "critical" "Uso de memoria alto" "Uso de memoria: \$MEM_USAGE%" "ops-team@rent360.com"
elif [ "\$MEM_USAGE" -gt 80 ]; then
    "\$ALERT_SCRIPT" "warning" "Uso de memoria elevado" "Uso de memoria: \$MEM_USAGE%" "ops-team@rent360.com"
fi

# Verificar procesos zombie
ZOMBIE_COUNT=\$(ps aux | awk '{print \$8}' | grep -c 'Z')
if [ "\$ZOMBIE_COUNT" -gt 5 ]; then
    "\$ALERT_SCRIPT" "warning" "Procesos zombie detectados" "Número de procesos zombie: \$ZOMBIE_COUNT" "ops-team@rent360.com"
fi

echo "Verificación de salud completada: \$(date)" >> "\$LOG_FILE"
EOF

    sudo chmod +x /usr/local/bin/rent360-health-check

    # Configurar cron para verificaciones periódicas
    cat << EOF | sudo tee /etc/cron.d/rent360-monitoring
# Verificaciones de salud cada 5 minutos
*/5 * * * * root /usr/local/bin/rent360-health-check

# Limpieza de logs antiguos semanalmente
0 2 * * 0 root find /var/log/rent360 -name "*.log.*" -mtime +30 -delete

# Verificación de backups diariamente
0 3 * * * root /usr/local/bin/rent360-check-backups
EOF

    sudo chmod 644 /etc/cron.d/rent360-monitoring

    echo "✅ Sistema de alertas configurado"
}

# =====================================================
# CONFIGURACIÓN DE MONITOREO AVANZADO
# =====================================================

setup_advanced_monitoring() {
    echo "🔬 Configurando monitoreo avanzado..."

    # Instalar herramientas de monitoreo adicionales
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y htop iotop sysstat nmon
    elif command -v yum &> /dev/null; then
        sudo yum install -y htop iotop sysstat nmon
    fi

    # Configurar sysstat para recopilar métricas
    sudo sed -i 's/ENABLED="false"/ENABLED="true"/' /etc/default/sysstat
    sudo systemctl restart sysstat

    # Crear script de métricas personalizadas
    cat << EOF | sudo tee /usr/local/bin/rent360-metrics
#!/bin/bash

# Script para recopilar métricas personalizadas de Rent360

METRICS_FILE="/var/log/rent360/metrics.log"
TIMESTAMP=\$(date +%s)

# Métricas del sistema
CPU_USAGE=\$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - \$1}')
MEM_TOTAL=\$(free -m | grep '^Mem:' | awk '{print \$2}')
MEM_USED=\$(free -m | grep '^Mem:' | awk '{print \$3}')
DISK_TOTAL=\$(df / | tail -1 | awk '{print \$2}')
DISK_USED=\$(df / | tail -1 | awk '{print \$3}')
LOAD_AVERAGE=\$(uptime | awk -F'load average:' '{ print \$2 }' | cut -d, -f1 | sed 's/ //g')

# Métricas de la aplicación
if curl -s -f http://localhost:3000/api/metrics > /tmp/app_metrics.json 2>/dev/null; then
    APP_REQUESTS=\$(jq -r '.requests // 0' /tmp/app_metrics.json)
    APP_ERRORS=\$(jq -r '.errors // 0' /tmp/app_metrics.json)
    APP_RESPONSE_TIME=\$(jq -r '.avgResponseTime // 0' /tmp/app_metrics.json)
else
    APP_REQUESTS=0
    APP_ERRORS=0
    APP_RESPONSE_TIME=0
fi

# Métricas de base de datos
if command -v pg_isready &> /dev/null && pg_isready -h localhost -p 5432 >/dev/null; then
    DB_CONNECTIONS=\$(psql -h localhost -U rent360 -d rent360_prod -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "0")
else
    DB_CONNECTIONS=0
fi

# Métricas de Redis
if command -v redis-cli &> /dev/null && redis-cli ping 2>/dev/null | grep -q PONG; then
    REDIS_KEYS=\$(redis-cli dbsize 2>/dev/null || echo "0")
    REDIS_MEMORY=\$(redis-cli info memory | grep used_memory: | cut -d: -f2 | sed 's/\r//' 2>/dev/null || echo "0")
else
    REDIS_KEYS=0
    REDIS_MEMORY=0
fi

# Escribir métricas en formato JSON
cat << METRICS_EOF >> "\$METRICS_FILE"
{
  "timestamp": \$TIMESTAMP,
  "system": {
    "cpu_usage": \$CPU_USAGE,
    "memory_total": \$MEM_TOTAL,
    "memory_used": \$MEM_USED,
    "disk_total": \$DISK_TOTAL,
    "disk_used": \$DISK_USED,
    "load_average": \$LOAD_AVERAGE
  },
  "application": {
    "requests": \$APP_REQUESTS,
    "errors": \$APP_ERRORS,
    "avg_response_time": \$APP_RESPONSE_TIME
  },
  "database": {
    "connections": \$DB_CONNECTIONS
  },
  "redis": {
    "keys": \$REDIS_KEYS,
    "memory_used": \$REDIS_MEMORY
  }
}
METRICS_EOF

# Rotar archivo de métricas si es muy grande
if [ \$(stat -f%z "\$METRICS_FILE" 2>/dev/null || stat -c%s "\$METRICS_FILE" 2>/dev/null) -gt 104857600 ]; then # 100MB
    mv "\$METRICS_FILE" "\$METRICS_FILE.\$(date +%Y%m%d_%H%M%S)"
    touch "\$METRICS_FILE"
fi
EOF

    sudo chmod +x /usr/local/bin/rent360-metrics

    # Añadir a cron para recopilar métricas cada minuto
    echo "* * * * * root /usr/local/bin/rent360-metrics" | sudo tee -a /etc/cron.d/rent360-monitoring

    # Crear script de análisis de métricas
    cat << EOF | sudo tee /usr/local/bin/rent360-analyze-metrics
#!/bin/bash

# Script para analizar métricas recopiladas

METRICS_FILE="/var/log/rent360/metrics.log"
ANALYSIS_FILE="/var/log/rent360/metrics-analysis.log"

# Función para calcular promedio
calculate_average() {
    local values="\$1"
    echo "scale=2; (\$values) / \$(echo "\$values" | wc -w)" | bc 2>/dev/null || echo "0"
}

# Analizar últimas 24 horas
echo "=== Análisis de métricas - Últimas 24 horas ===" > "\$ANALYSIS_FILE"
echo "Generado: \$(date)" >> "\$ANALYSIS_FILE"
echo "" >> "\$ANALYSIS_FILE"

# CPU Usage
CPU_VALUES=\$(tail -1440 "\$METRICS_FILE" | jq -r '.system.cpu_usage' 2>/dev/null | tr '\n' ' ')
if [ -n "\$CPU_VALUES" ]; then
    CPU_AVG=\$(calculate_average "\$CPU_VALUES")
    CPU_MAX=\$(echo "\$CPU_VALUES" | tr ' ' '\n' | sort -nr | head -1)
    echo "CPU Usage - Promedio: \$CPU_AVG%, Máximo: \$CPU_MAX%" >> "\$ANALYSIS_FILE"
fi

# Memory Usage
MEM_VALUES=\$(tail -1440 "\$METRICS_FILE" | jq -r '.system.memory_used' 2>/dev/null | tr '\n' ' ')
if [ -n "\$MEM_VALUES" ]; then
    MEM_AVG=\$(calculate_average "\$MEM_VALUES")
    MEM_MAX=\$(echo "\$MEM_VALUES" | tr ' ' '\n' | sort -nr | head -1)
    echo "Memory Usage - Promedio: \$MEM_AVG MB, Máximo: \$MEM_MAX MB" >> "\$ANALYSIS_FILE"
fi

# Application Requests
REQ_VALUES=\$(tail -1440 "\$METRICS_FILE" | jq -r '.application.requests' 2>/dev/null | tr '\n' ' ')
if [ -n "\$REQ_VALUES" ]; then
    REQ_TOTAL=\$(echo "\$REQ_VALUES" | awk '{sum += \$1} END {print sum}')
    echo "Total Requests: \$REQ_TOTAL" >> "\$ANALYSIS_FILE"
fi

# Application Errors
ERR_VALUES=\$(tail -1440 "\$METRICS_FILE" | jq -r '.application.errors' 2>/dev/null | tr '\n' ' ')
if [ -n "\$ERR_VALUES" ]; then
    ERR_TOTAL=\$(echo "\$ERR_VALUES" | awk '{sum += \$1} END {print sum}')
    echo "Total Errors: \$ERR_TOTAL" >> "\$ANALYSIS_FILE"
fi

# Database Connections
DB_VALUES=\$(tail -1440 "\$METRICS_FILE" | jq -r '.database.connections' 2>/dev/null | tr '\n' ' ')
if [ -n "\$DB_VALUES" ]; then
    DB_AVG=\$(calculate_average "\$DB_VALUES")
    DB_MAX=\$(echo "\$DB_VALUES" | tr ' ' '\n' | sort -nr | head -1)
    echo "DB Connections - Promedio: \$DB_AVG, Máximo: \$DB_MAX" >> "\$ANALYSIS_FILE"
fi

echo "" >> "\$ANALYSIS_FILE"
echo "Análisis completado: \$(date)" >> "\$ANALYSIS_FILE"

# Generar alertas basadas en análisis
if [ "\$CPU_MAX" -gt 90 ]; then
    /usr/local/bin/rent360-alert "critical" "Uso de CPU crítico" "Uso máximo de CPU en las últimas 24h: \$CPU_MAX%" "ops-team@rent360.com"
fi

if [ "\$MEM_MAX" -gt 8000 ]; then
    /usr/local/bin/rent360-alert "warning" "Uso de memoria alto" "Uso máximo de memoria en las últimas 24h: \$MEM_MAX MB" "ops-team@rent360.com"
fi
EOF

    sudo chmod +x /usr/local/bin/rent360-analyze-metrics

    # Añadir análisis diario a cron
    echo "0 6 * * * root /usr/local/bin/rent360-analyze-metrics" | sudo tee -a /etc/cron.d/rent360-monitoring

    echo "✅ Monitoreo avanzado configurado"
}

# =====================================================
# CONFIGURACIÓN DE DASHBOARD DE MONITOREO
# =====================================================

setup_monitoring_dashboard() {
    echo "📊 Configurando dashboard de monitoreo..."

    # Crear página HTML simple para monitoreo
    cat << EOF | sudo tee /var/www/html/monitoring/index.html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rent360 - Dashboard de Monitoreo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }
        .status-good { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        h1 { color: #333; }
        .refresh { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>🏠 Rent360 - Dashboard de Monitoreo</h1>
    <div class="refresh">
        <button onclick="location.reload()">🔄 Actualizar</button>
        <span>Última actualización: <span id="lastUpdate"></span></span>
    </div>

    <div class="grid">
        <div class="metric">
            <h3>Estado de Servicios</h3>
            <div id="servicesStatus">Cargando...</div>
        </div>

        <div class="metric">
            <h3>Uso de Sistema</h3>
            <div id="systemUsage">Cargando...</div>
        </div>

        <div class="metric">
            <h3>Métricas de Aplicación</h3>
            <div id="appMetrics">Cargando...</div>
        </div>

        <div class="metric">
            <h3>Logs Recientes</h3>
            <div id="recentLogs">Cargando...</div>
        </div>

        <div class="metric">
            <h3>Alertas Activas</h3>
            <div id="activeAlerts">Cargando...</div>
        </div>

        <div class="metric">
            <h3>Rendimiento</h3>
            <div id="performance">Cargando...</div>
        </div>
    </div>

    <script>
        async function updateMetrics() {
            try {
                // Actualizar servicios
                const servicesResponse = await fetch('/api/health');
                const services = await servicesResponse.json();
                document.getElementById('servicesStatus').innerHTML = formatServices(services);

                // Actualizar métricas del sistema
                const systemResponse = await fetch('/api/system-metrics');
                const system = await systemResponse.json();
                document.getElementById('systemUsage').innerHTML = formatSystemMetrics(system);

                // Actualizar métricas de aplicación
                const appResponse = await fetch('/api/app-metrics');
                const app = await appResponse.json();
                document.getElementById('appMetrics').innerHTML = formatAppMetrics(app);

                // Actualizar logs recientes
                const logsResponse = await fetch('/api/recent-logs');
                const logs = await logsResponse.json();
                document.getElementById('recentLogs').innerHTML = formatLogs(logs);

                // Actualizar alertas
                const alertsResponse = await fetch('/api/active-alerts');
                const alerts = await alertsResponse.json();
                document.getElementById('activeAlerts').innerHTML = formatAlerts(alerts);

                // Actualizar rendimiento
                const perfResponse = await fetch('/api/performance');
                const perf = await perfResponse.json();
                document.getElementById('performance').innerHTML = formatPerformance(perf);

                document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
            } catch (error) {
                console.error('Error updating metrics:', error);
            }
        }

        function formatServices(services) {
            return Object.entries(services).map(([service, status]) => {
                const statusClass = status ? 'status-good' : 'status-error';
                return \`<div class="\${statusClass}">\$service: \${status ? '✅ OK' : '❌ ERROR'}</div>\`;
            }).join('');
        }

        function formatSystemMetrics(system) {
            return \`
                <div>CPU: \${system.cpu}%</div>
                <div>Memoria: \${system.memory.used}MB / \${system.memory.total}MB</div>
                <div>Disco: \${system.disk.used}GB / \${system.disk.total}GB</div>
                <div>Carga: \${system.load}</div>
            \`;
        }

        function formatAppMetrics(app) {
            return \`
                <div>Requests: \${app.requests}</div>
                <div>Errors: \${app.errors}</div>
                <div>Avg Response: \${app.avgResponseTime}ms</div>
                <div>Active Users: \${app.activeUsers}</div>
            \`;
        }

        function formatLogs(logs) {
            return logs.slice(0, 10).map(log => {
                const levelClass = log.level === 'error' ? 'status-error' : 'status-good';
                return \`<div class="\${levelClass}">\${log.timestamp}: \${log.message}</div>\`;
            }).join('');
        }

        function formatAlerts(alerts) {
            if (alerts.length === 0) {
                return '<div class="status-good">No hay alertas activas</div>';
            }
            return alerts.map(alert => {
                const severityClass = alert.severity === 'critical' ? 'status-error' : 'status-warning';
                return \`<div class="\${severityClass}">\$alert.message</div>\`;
            }).join('');
        }

        function formatPerformance(perf) {
            return \`
                <div>Response Time: \${perf.avgResponseTime}ms</div>
                <div>Throughput: \${perf.requestsPerSecond} req/s</div>
                <div>Error Rate: \${perf.errorRate}%</div>
                <div>DB Query Time: \${perf.avgDbQueryTime}ms</div>
            \`;
        }

        // Actualizar cada 30 segundos
        updateMetrics();
        setInterval(updateMetrics, 30000);
    </script>
</body>
</html>
EOF

    # Configurar Nginx para servir el dashboard (solo acceso interno)
    cat << EOF | sudo tee /etc/nginx/sites-available/monitoring
server {
    listen 8081;
    server_name monitoring.rent360.local;

    root /var/www/html/monitoring;
    index index.html;

    # Restringir acceso
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # Proxy para APIs de métricas
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Logs de acceso
    access_log /var/log/nginx/monitoring-access.log;
    error_log /var/log/nginx/monitoring-error.log;
}
EOF

    sudo ln -sf /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx

    echo "✅ Dashboard de monitoreo configurado en http://monitoring.rent360.local:8081"
}

# =====================================================
# EJECUCIÓN PRINCIPAL
# =====================================================

# Configurar rotación de logs
setup_logrotate

# Configurar RSyslog
setup_rsyslog

# Configurar alertas
setup_alerts

# Configurar monitoreo avanzado
setup_advanced_monitoring

# Configurar dashboard
setup_monitoring_dashboard

# Configurar Logstash si está habilitado
if check_env_var "LOGSTASH_ENABLED" && grep -q "^LOGSTASH_ENABLED=true" "$ENV_FILE"; then
    setup_logstash
fi

echo ""
echo "🎉 Configuración de monitoreo de logs y alertas completada!"
echo ""
echo "📋 Servicios configurados:"
echo "  ✅ Logrotate para rotación de logs"
echo "  ✅ RSyslog para centralización de logs"
echo "  ✅ Sistema de alertas por email"
echo "  ✅ Verificaciones de salud automáticas"
echo "  ✅ Monitoreo avanzado con métricas"
echo "  ✅ Dashboard de monitoreo web"
echo "  ✅ Logstash (opcional)"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Configura las credenciales de email en /etc/ssmtp/ssmtp.conf"
echo "2. Configura los destinatarios de alertas en /etc/aliases"
echo "3. Revisa el dashboard en http://monitoring.rent360.local:8081"
echo "4. Configura notificaciones adicionales (Slack, PagerDuty)"
echo "5. Ajusta los umbrales de alertas según tus necesidades"
echo ""
echo "🔧 Comandos útiles:"
echo "  # Ver estado de logs:"
echo "  tail -f /var/log/rent360/app.log"
echo ""
echo "  # Ver métricas:"
echo "  tail -f /var/log/rent360/metrics.log"
echo ""
echo "  # Forzar rotación de logs:"
echo "  logrotate -f /etc/logrotate.d/rent360"
echo ""
echo "  # Ejecutar verificación de salud manual:"
echo "  /usr/local/bin/rent360-health-check"
echo ""
echo "  # Enviar alerta de prueba:"
echo "  /usr/local/bin/rent360-alert info 'Prueba' 'Esta es una alerta de prueba'"
echo ""
echo "⚠️ Recuerda:"
echo "  - Configurar backups de logs"
echo "  - Monitorear el espacio en disco de /var/log"
echo "  - Revisar alertas regularmente"
echo "  - Configurar retención de logs según políticas de cumplimiento"
echo "  - Considerar envío de logs a sistemas centralizados (ELK, Splunk)"
