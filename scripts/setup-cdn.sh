#!/bin/bash

# Script de configuración de CDN para Rent360
# Configura Cloudflare Pages, CloudFront u otras soluciones CDN

set -e

echo "🌐 Configurando CDN para Rent360..."

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
# CONFIGURACIÓN DE CLOUDFLARE
# =====================================================

setup_cloudflare() {
    echo "☁️ Configurando Cloudflare..."

    # Verificar credenciales de Cloudflare
    if ! check_env_var "CLOUDFLARE_API_TOKEN"; then
        echo "⚠️ Cloudflare API token no configurado - omitiendo configuración automática"
        return 1
    fi

    # Instalar Wrangler CLI si no está disponible
    if ! command -v wrangler &> /dev/null; then
        echo "📦 Instalando Wrangler CLI..."
        npm install -g wrangler
    fi

    # Configurar Wrangler
    cat << EOF > "$PROJECT_ROOT/wrangler.toml"
name = "rent360-prod"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
cwd = "."

[build.upload]
format = "service-worker"

# Environment variables
[vars]
NODE_ENV = "production"

# Page Rules for CDN optimization
[[pages_build_output]]
# API routes will be handled by Next.js API routes

# =====================================================
# CDN OPTIMIZATION RULES
# =====================================================

# Static assets caching
[[page_rules]]
targets = ["rent360.pages.dev/_next/static/*"]
actions = [
  { type = "cache_level", value = "cache_everything" },
  { type = "edge_cache_ttl", value = 31536000 },
  { type = "browser_cache_ttl", value = 31536000 }
]

# Images and media caching
[[page_rules]]
targets = ["rent360.pages.dev/uploads/*", "rent360.pages.dev/images/*"]
actions = [
  { type = "cache_level", value = "cache_everything" },
  { type = "edge_cache_ttl", value = 86400 },
  { type = "browser_cache_ttl", value = 86400 }
]

# API responses caching (selective)
[[page_rules]]
targets = ["rent360.pages.dev/api/public/*"]
actions = [
  { type = "cache_level", value = "cache_everything" },
  { type = "edge_cache_ttl", value = 300 },
  { type = "browser_cache_ttl", value = 0 }
]

# Security headers
[[page_rules]]
targets = ["rent360.pages.dev/*"]
actions = [
  { type = "security_level", value = "medium" },
  { type = "ssl", value = "strict" },
  { type = "cache_level", value = "aggressive" }
]
EOF

    # Autenticar con Cloudflare
    echo "🔐 Autenticando con Cloudflare..."
    CLOUDFLARE_API_TOKEN=$(grep "^CLOUDFLARE_API_TOKEN=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    wrangler auth login --api-token "$CLOUDFLARE_API_TOKEN"

    # Configurar dominio personalizado
    if check_env_var "CLOUDFLARE_ZONE_ID"; then
        CLOUDFLARE_ZONE_ID=$(grep "^CLOUDFLARE_ZONE_ID=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')

        echo "🌐 Configurando dominio personalizado..."

        # Añadir registro DNS
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "rent360.cl",
                "content": "rent360.pages.dev",
                "ttl": 1,
                "proxied": true
            }'

        # Configurar SSL
        curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value": "strict"}'
    fi

    echo "✅ Cloudflare configurado"
    return 0
}

# =====================================================
# CONFIGURACIÓN DE AWS CLOUDFRONT
# =====================================================

setup_cloudfront() {
    echo "☁️ Configurando AWS CloudFront..."

    # Verificar credenciales de AWS
    if ! check_env_var "AWS_ACCESS_KEY_ID" || ! check_env_var "AWS_SECRET_ACCESS_KEY"; then
        echo "⚠️ Credenciales AWS no configuradas - omitiendo configuración automática"
        return 1
    fi

    # Verificar si AWS CLI está instalado
    if ! command -v aws &> /dev/null; then
        echo "📦 Instalando AWS CLI..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
    fi

    # Configurar AWS CLI
    AWS_ACCESS_KEY_ID=$(grep "^AWS_ACCESS_KEY_ID=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    AWS_SECRET_ACCESS_KEY=$(grep "^AWS_SECRET_ACCESS_KEY=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    AWS_REGION=$(grep "^AWS_REGION=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' || echo "us-east-1")

    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    aws configure set region "$AWS_REGION"

    # Crear bucket S3 si no existe
    S3_BUCKET_NAME=$(grep "^AWS_S3_BUCKET_NAME=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' || echo "rent360-production-files")

    if ! aws s3 ls "s3://$S3_BUCKET_NAME" &> /dev/null; then
        echo "📦 Creando bucket S3: $S3_BUCKET_NAME"
        aws s3 mb "s3://$S3_BUCKET_NAME"

        # Configurar bucket para sitio web estático
        aws s3 website "s3://$S3_BUCKET_NAME" --index-document index.html --error-document error.html

        # Configurar CORS
        cat << EOF > cors-policy.json
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF
        aws s3api put-bucket-cors --bucket "$S3_BUCKET_NAME" --cors-configuration file://cors-policy.json
        rm cors-policy.json
    fi

    # Crear distribución CloudFront
    if check_env_var "ALB_SSL_CERTIFICATE_ARN"; then
        echo "🚀 Creando distribución CloudFront..."

        CERTIFICATE_ARN=$(grep "^ALB_SSL_CERTIFICATE_ARN=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')

        aws cloudformation deploy \
            --template-file "$PROJECT_ROOT/config/cloudfront-distribution.yaml" \
            --stack-name rent360-cdn \
            --parameter-overrides \
                S3BucketName="$S3_BUCKET_NAME" \
                CertificateArn="$CERTIFICATE_ARN" \
                DomainName="rent360.cl" \
            --capabilities CAPABILITY_IAM

        # Obtener la URL de CloudFront
        CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name rent360-cdn --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text)

        echo "✅ CloudFront configurado: $CLOUDFRONT_URL"
    else
        echo "⚠️ ARN del certificado SSL no configurado"
    fi

    return 0
}

# =====================================================
# CONFIGURACIÓN DE NGINX (ALTERNATIVA)
# =====================================================

setup_nginx() {
    echo "🔧 Configurando Nginx como CDN alternativo..."

    # Instalar Nginx si no está disponible
    if ! command -v nginx &> /dev/null; then
        echo "📦 Instalando Nginx..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y nginx
        else
            echo "❌ No se puede instalar Nginx automáticamente"
            return 1
        fi
    fi

    # Crear configuración de Nginx
    cat << EOF | sudo tee /etc/nginx/sites-available/rent360
# Upstream servers
upstream rent360_app {
    least_conn;
    server app1:3000 weight=1;
    server app2:3000 weight=1;
    server app3:3000 weight=1;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name rent360.cl www.rent360.cl;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/rent360.crt;
    ssl_certificate_key /etc/ssl/private/rent360.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Static files caching
    location /_next/static/ {
        proxy_pass http://rent360_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /uploads/ {
        proxy_pass http://rent360_app;
        expires 24h;
        add_header Cache-Control "public";
    }

    location /images/ {
        proxy_pass http://rent360_app;
        expires 24h;
        add_header Cache-Control "public";
    }

    # API routes (no cache)
    location /api/ {
        proxy_pass http://rent360_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # No caching for API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Main application
    location / {
        proxy_pass http://rent360_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Basic caching for HTML
        expires 1h;
        add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name rent360.cl www.rent360.cl;
    return 301 https://\$server_name\$request_uri;
}
EOF

    # Habilitar sitio
    sudo ln -sf /etc/nginx/sites-available/rent360 /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default

    # Probar configuración
    sudo nginx -t

    # Reiniciar Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx

    echo "✅ Nginx configurado como CDN"
    return 0
}

# =====================================================
# CONFIGURACIÓN DE CERTIFICADOS SSL
# =====================================================

setup_ssl() {
    echo "🔒 Configurando certificados SSL..."

    # Instalar Certbot si no está disponible
    if ! command -v certbot &> /dev/null; then
        echo "📦 Instalando Certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python-certbot-nginx
        fi
    fi

    # Obtener certificado Let's Encrypt
    echo "📜 Obteniendo certificado SSL de Let's Encrypt..."
    sudo certbot --nginx -d rent360.cl -d www.rent360.cl --non-interactive --agree-tos --email admin@rent360.cl

    echo "✅ SSL configurado"
}

# =====================================================
# MENÚ PRINCIPAL
# =====================================================

echo "🚀 Selecciona tu proveedor de CDN:"
echo "1) Cloudflare Pages"
echo "2) AWS CloudFront"
echo "3) Nginx (local)"
echo "4) Todos los anteriores"
echo ""
read -p "Opción (1-4): " choice

case $choice in
    1)
        setup_cloudflare
        ;;
    2)
        setup_cloudfront
        ;;
    3)
        setup_nginx
        setup_ssl
        ;;
    4)
        setup_cloudflare
        setup_cloudfront
        setup_nginx
        setup_ssl
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "🎉 Configuración de CDN completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Actualizar DNS para apuntar al CDN"
echo "2. Probar la configuración con curl o navegador"
echo "3. Configurar monitoreo del rendimiento del CDN"
echo "4. Configurar invalidación de cache automática"
echo ""

echo "🔧 Comandos útiles:"
echo "  # Probar configuración de Nginx:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  # Verificar certificados SSL:"
echo "  openssl s_client -connect rent360.cl:443 -servername rent360.cl"
echo ""
echo "  # Invalidar cache de CloudFront:"
echo "  aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"
echo ""

echo "⚠️ Recuerda:"
echo "  - Configurar backups de archivos estáticos"
echo "  - Monitorear el uso del CDN para costos"
echo "  - Configurar alertas para downtime del CDN"
echo "  - Mantener certificados SSL actualizados"
