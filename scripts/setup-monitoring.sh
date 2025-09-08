#!/bin/bash

# Script de configuración de servicios de monitoreo para Rent360
# Configura DataDog, New Relic, Sentry y otras herramientas de monitoreo

set -e

echo "📊 Configurando servicios de monitoreo para Rent360..."

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
# INSTALACIÓN DE DATADOG AGENT
# =====================================================

echo "🐶 Instalando DataDog Agent..."

# Verificar si DataDog ya está instalado
if command -v datadog-agent &> /dev/null; then
    echo "✅ DataDog Agent ya está instalado"
else
    echo "📦 Instalando DataDog Agent..."

    # Instalar DataDog Agent (Ubuntu/Debian)
    if command -v apt-get &> /dev/null; then
        # Importar clave GPG de DataDog
        curl -fsSL https://keys.datadoghq.com/DATADOG_APT_KEY_CURRENT.public | sudo gpg --dearmor -o /usr/share/keyrings/datadog-archive-keyring.gpg

        # Añadir repositorio de DataDog
        echo 'deb [signed-by=/usr/share/keyrings/datadog-archive-keyring.gpg] https://apt.datadoghq.com/ stable main' | sudo tee /etc/apt/sources.list.d/datadog.list

        # Actualizar e instalar
        sudo apt-get update
        sudo apt-get install -y datadog-agent

    # Instalar DataDog Agent (CentOS/RHEL)
    elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
        # Añadir repositorio de DataDog
        cat << EOF | sudo tee /etc/yum.repos.d/datadog.repo
[datadog]
name=Datadog, Inc.
baseurl=https://yum.datadoghq.com/stable/7/x86_64/
enabled=1
gpgcheck=1
gpgkey=https://keys.datadoghq.com/DATADOG_RPM_KEY_CURRENT.public
EOF

        # Instalar DataDog Agent
        sudo yum install -y datadog-agent

    else
        echo "❌ Sistema operativo no soportado para instalación automática de DataDog"
        echo "💡 Instala DataDog Agent manualmente desde: https://docs.datadoghq.com/agent/"
    fi
fi

# Configurar DataDog Agent
if [ -f /etc/datadog-agent/datadog.yaml ]; then
    echo "⚙️ Configurando DataDog Agent..."

    # Copiar configuración personalizada
    sudo cp "$PROJECT_ROOT/config/datadog.yaml" /etc/datadog-agent/datadog.yaml

    # Reiniciar DataDog Agent
    sudo systemctl restart datadog-agent
    sudo systemctl enable datadog-agent

    echo "✅ DataDog Agent configurado"
else
    echo "⚠️ DataDog Agent instalado pero no configurado"
fi

# =====================================================
# INSTALACIÓN DE NEW RELIC
# =====================================================

echo "🔧 Instalando New Relic..."

# Verificar si New Relic ya está instalado
if command -v newrelic-daemon &> /dev/null; then
    echo "✅ New Relic ya está instalado"
else
    echo "📦 Instalando New Relic Agent..."

    # Instalar New Relic Agent
    curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash

    # Instalar Node.js agent
    npm install newrelic --save

    echo "✅ New Relic Agent instalado"
fi

# Copiar configuración de New Relic
cp "$PROJECT_ROOT/config/newrelic.js" "$PROJECT_ROOT/newrelic.js"

echo "✅ New Relic configurado"

# =====================================================
# CONFIGURACIÓN DE SENTRY
# =====================================================

echo "🛡️ Configurando Sentry..."

# Instalar Sentry CLI si no está disponible
if ! command -v sentry-cli &> /dev/null; then
    echo "📦 Instalando Sentry CLI..."

    # Instalar Sentry CLI
    npm install -g @sentry/cli

    echo "✅ Sentry CLI instalado"
fi

# Verificar configuración de Sentry
if check_env_var "SENTRY_DSN"; then
    echo "🔧 Configurando Sentry en la aplicación..."

    # Crear archivo de configuración de Sentry
    cp "$PROJECT_ROOT/config/sentry.js" "$PROJECT_ROOT/sentry.config.js"

    # Configurar Sentry para Next.js
    if [ ! -f "$PROJECT_ROOT/instrumentation.ts" ]; then
        cat << EOF > "$PROJECT_ROOT/instrumentation.ts"
import { initSentry } from './sentry.config';

export function register() {
  initSentry();
}
EOF
    fi

    echo "✅ Sentry configurado"
else
    echo "⚠️ Sentry no configurado - establece SENTRY_DSN en el archivo de entorno"
fi

# =====================================================
# CONFIGURACIÓN DE LOGGING
# =====================================================

echo "📝 Configurando logging estructurado..."

# Crear directorios de logs
sudo mkdir -p /var/log/rent360
sudo chown -R $USER:$USER /var/log/rent360

# Configurar rotación de logs
cat << EOF | sudo tee /etc/logrotate.d/rent360
/var/log/rent360/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        # Reiniciar aplicación si es necesario
        if [ -f /var/run/rent360.pid ]; then
            kill -HUP \$(cat /var/run/rent360.pid)
        fi
    endscript
}
EOF

echo "✅ Logging configurado"

# =====================================================
# CONFIGURACIÓN DE HEALTH CHECKS
# =====================================================

echo "🏥 Configurando health checks..."

# Crear endpoint de health check
mkdir -p "$PROJECT_ROOT/pages/api/health"

cat << EOF > "$PROJECT_ROOT/pages/api/health/live.js"
export default function handler(req, res) {
  // Liveness probe - verifica que la aplicación esté ejecutándose
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'rent360'
  });
}
EOF

cat << EOF > "$PROJECT_ROOT/pages/api/health/ready.js"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Readiness probe - verifica conexiones a servicios externos

    // Verificar conexión a base de datos
    await prisma.\$queryRaw\`SELECT 1\`;

    // Verificar conexión a Redis (si está configurado)
    if (process.env.REDIS_URL) {
      const { createClient } = require('redis');
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.quit();
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'rent360',
      checks: {
        database: 'ok',
        redis: process.env.REDIS_URL ? 'ok' : 'not_configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'rent360',
      error: error.message
    });
  } finally {
    await prisma.\$disconnect();
  }
}
EOF

echo "✅ Health checks configurados"

# =====================================================
# CONFIGURACIÓN DE MÉTRICAS PERSONALIZADAS
# =====================================================

echo "📊 Configurando métricas personalizadas..."

# Crear script de métricas personalizadas para DataDog
cat << EOF > "$PROJECT_ROOT/scripts/custom-metrics.py"
#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

# Script para enviar métricas personalizadas a DataDog

def send_metric(metric_name, value, tags=None):
    """Enviar métrica a DataDog"""
    api_key = "${DATADOG_API_KEY}"

    if not api_key:
        return

    payload = {
        "series": [{
            "metric": f"rent360.{metric_name}",
            "points": [[int(time.time()), value]],
            "tags": tags or ["env:production", "service:rent360"]
        }]
    }

    try:
        response = requests.post(
            f"https://api.datadoghq.com/api/v1/series?api_key={api_key}",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        print(f"✅ Métrica enviada: {metric_name} = {value}")
    except Exception as e:
        print(f"❌ Error enviando métrica {metric_name}: {e}")

def collect_business_metrics():
    """Recolectar métricas de negocio"""
    try:
        # Métricas de ejemplo (reemplaza con lógica real)
        send_metric("users.active", 1250, ["region:santiago"])
        send_metric("transactions.total", 450, ["type:payment", "status:completed"])
        send_metric("services.completed", 89, ["period:daily"])
        send_metric("ratings.average", 4.7, ["category:all"])

    except Exception as e:
        print(f"❌ Error recolectando métricas de negocio: {e}")

if __name__ == "__main__":
    collect_business_metrics()
EOF

chmod +x "$PROJECT_ROOT/scripts/custom-metrics.py"

echo "✅ Métricas personalizadas configuradas"

# =====================================================
# CONFIGURACIÓN DE ALERTAS
# =====================================================

echo "🚨 Configurando alertas..."

# Crear script de alertas
cat << EOF > "$PROJECT_ROOT/scripts/alerts.py"
#!/usr/bin/env python3

import requests
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuración de alertas para Rent360

def send_slack_alert(message, severity="warning"):
    """Enviar alerta a Slack"""
    webhook_url = "${ALERT_SLACK_WEBHOOK_URL}"

    if not webhook_url:
        return

    colors = {
        "info": "#17a2b8",
        "warning": "#ffc107",
        "error": "#dc3545",
        "critical": "#721c24"
    }

    payload = {
        "attachments": [{
            "color": colors.get(severity, "#17a2b8"),
            "title": f"🚨 Alerta Rent360 - {severity.upper()}",
            "text": message,
            "footer": "Rent360 Monitoring",
            "ts": int(__import__('time').time())
        }]
    }

    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        print(f"✅ Alerta Slack enviada: {severity}")
    except Exception as e:
        print(f"❌ Error enviando alerta Slack: {e}")

def send_email_alert(subject, message, recipients=None):
    """Enviar alerta por email"""
    smtp_server = "${SMTP_HOST}"
    smtp_port = ${SMTP_PORT:-587}
    smtp_user = "${SMTP_USER}"
    smtp_pass = "${SMTP_PASS}"

    if not smtp_server or not recipients:
        return

    # Configuración por defecto de destinatarios
    if not recipients:
        recipients = ["${ALERT_EMAIL_RECIPIENTS}".split(",")]

    try:
        msg = MIMEMultipart()
        msg['From'] = "${SMTP_FROM_EMAIL}"
        msg['To'] = ", ".join(recipients)
        msg['Subject'] = f"🚨 {subject}"

        msg.attach(MIMEText(message, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

        print(f"✅ Email de alerta enviado a: {', '.join(recipients)}")
    except Exception as e:
        print(f"❌ Error enviando email de alerta: {e}")

def check_system_health():
    """Verificar estado del sistema y enviar alertas si es necesario"""
    try:
        # Verificar CPU
        import psutil
        cpu_percent = psutil.cpu_percent(interval=1)

        if cpu_percent > ${ALERT_HIGH_CPU_USAGE:-90}:
            send_slack_alert(
                f"⚠️ Uso de CPU alto: {cpu_percent}%",
                "warning"
            )
            send_email_alert(
                "Alerta: Uso de CPU Alto",
                f"El uso de CPU ha alcanzado {cpu_percent}%, lo cual supera el umbral configurado."
            )

        # Verificar memoria
        memory = psutil.virtual_memory()
        if memory.percent > ${ALERT_HIGH_MEMORY_USAGE:-85}:
            send_slack_alert(
                f"⚠️ Uso de memoria alto: {memory.percent}%",
                "warning"
            )

        # Verificar disco
        disk = psutil.disk_usage('/')
        if disk.percent > ${ALERT_HIGH_DISK_USAGE:-90}:
            send_slack_alert(
                f"⚠️ Uso de disco alto: {disk.percent}%",
                "warning"
            )

        print("✅ Verificación de salud del sistema completada")

    except ImportError:
        print("⚠️ psutil no instalado - omitiendo verificación de sistema")
    except Exception as e:
        print(f"❌ Error en verificación de salud del sistema: {e}")

if __name__ == "__main__":
    check_system_health()
EOF

chmod +x "$PROJECT_ROOT/scripts/alerts.py"

echo "✅ Alertas configuradas"

# =====================================================
# CONFIGURACIÓN DE DASHBOARD DE MONITOREO
# =====================================================

echo "📈 Configurando dashboard de monitoreo..."

# Crear archivo de configuración para Grafana (opcional)
cat << EOF > "$PROJECT_ROOT/config/grafana-dashboard.json"
{
  "dashboard": {
    "title": "Rent360 Production Dashboard",
    "tags": ["rent360", "production"],
    "timezone": "America/Santiago",
    "panels": [
      {
        "title": "Application Response Time",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"rent360\"}[5m]))",
          "legendFormat": "95th percentile"
        }]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total{status!~\"2..\", job=\"rent360\"}[5m]) / rate(http_requests_total{job=\"rent360\"}[5m]) * 100",
          "legendFormat": "Error rate %"
        }]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [{
          "expr": "pg_stat_activity_count{datname=\"rent360_prod\"}",
          "legendFormat": "Active connections"
        }]
      }
    ]
  }
}
EOF

echo "✅ Dashboard de monitoreo configurado"

# =====================================================
# VERIFICACIÓN FINAL
# =====================================================

echo ""
echo "🎉 Configuración de monitoreo completada!"
echo ""
echo "📋 Servicios configurados:"
echo "  ✅ DataDog Agent"
echo "  ✅ New Relic APM"
echo "  ✅ Sentry Error Tracking"
echo "  ✅ Health Checks"
echo "  ✅ Custom Metrics"
echo "  ✅ Alert System"
echo "  ✅ Structured Logging"
echo ""

echo "🚀 Próximos pasos:"
echo "1. Reinicia los servicios: sudo systemctl restart datadog-agent"
echo "2. Verifica que las métricas llegan a DataDog"
echo "3. Configura dashboards en New Relic"
echo "4. Configura alertas en Sentry"
echo "5. Programa la ejecución de métricas personalizadas"
echo ""

echo "📊 Comandos útiles:"
echo "  - Ver estado de DataDog: sudo datadog-agent status"
echo "  - Ver logs de aplicación: tail -f /var/log/rent360/*.log"
echo "  - Ejecutar métricas personalizadas: python3 scripts/custom-metrics.py"
echo "  - Ejecutar verificación de alertas: python3 scripts/alerts.py"
echo ""

echo "🔗 URLs importantes:"
echo "  - DataDog: https://app.datadoghq.com"
echo "  - New Relic: https://one.newrelic.com"
echo "  - Sentry: https://sentry.io"
echo "  - Health Check: https://rent360.cl/api/health/ready"
echo ""

echo "⚠️ Recuerda:"
echo "  - Configurar variables de entorno faltantes"
echo "  - Establecer alertas apropiadas en cada plataforma"
echo "  - Monitorear los dashboards regularmente"
echo "  - Configurar notificaciones de alertas críticas"
