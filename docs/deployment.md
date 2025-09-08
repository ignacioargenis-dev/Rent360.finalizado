# 🚀 Guía de Deployment - Rent360

## 📋 Estrategias de Deployment

### 1. Vercel (Recomendado para Frontend)
Vercel ofrece deployment automático con integración Git.

#### Configuración
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Configurar proyecto
vercel --prod
```

#### Variables de Entorno
```bash
# En Vercel Dashboard o via CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
```

#### Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 2. Docker + Docker Compose

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Instalar dependencias solo cuando cambien
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Puerto de exposición
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/rent360
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=rent360
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Comandos de Deployment
```bash
# Build
docker-compose build

# Deploy
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Scaling
docker-compose up -d --scale app=3
```

### 3. Kubernetes

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rent360-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rent360
  template:
    metadata:
      labels:
        app: rent360
    spec:
      containers:
      - name: rent360
        image: rent360:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rent360-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: rent360-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service Manifest
```yaml
apiVersion: v1
kind: Service
metadata:
  name: rent360-service
spec:
  selector:
    app: rent360
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rent360-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - rent360.com
    secretName: rent360-tls
  rules:
  - host: rent360.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: rent360-service
            port:
              number: 80
```

## 🔧 Configuración de Infraestructura

### Base de Datos

#### PostgreSQL en AWS RDS
```bash
# Crear instancia RDS
aws rds create-db-instance \
  --db-instance-identifier rent360-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username rent360 \
  --master-user-password your-password \
  --allocated-storage 20
```

#### Configuración de Conexión
```env
DATABASE_URL="postgresql://user:pass@rent360-prod.cluster-xxxx.us-east-1.rds.amazonaws.com:5432/rent360"
```

### Redis

#### ElastiCache (AWS)
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id rent360-cache \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --engine redis \
  --engine-version 7.0
```

#### Configuración
```env
REDIS_URL="redis://rent360-cache.xxxx.amazonaws.com:6379"
```

### Storage

#### AWS S3
```bash
# Crear bucket
aws s3 mb s3://rent360-production-files

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket rent360-production-files \
  --cors-configuration file://cors-config.json
```

#### CORS Config (cors-config.json)
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://rent360.com"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## 🔒 Seguridad en Producción

### SSL/TLS

#### Certificado con Let's Encrypt
```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d rent360.com -d www.rent360.com

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Configuración HTTPS
```nginx
server {
    listen 443 ssl http2;
    server_name rent360.com;

    ssl_certificate /etc/letsencrypt/live/rent360.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rent360.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall

#### UFW (Ubuntu)
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Verificar estado
sudo ufw status
```

#### AWS Security Groups
```bash
# Crear security group
aws ec2 create-security-group \
  --group-name rent360-sg \
  --description "Security group for Rent360"

# Agregar reglas
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr your-ip/32
```

## 📊 Monitoreo y Observabilidad

### Application Monitoring

#### Winston + CloudWatch
```typescript
import winston from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: 'rent360-production',
      logStreamName: 'app-logs',
      awsRegion: 'us-east-1',
      jsonMessage: true
    })
  ]
});
```

#### Sentry para Error Tracking
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Infrastructure Monitoring

#### Prometheus + Grafana
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'rent360'
    static_configs:
      - targets: ['localhost:3000']
```

#### Métricas Personalizadas
```typescript
import { collectDefaultMetrics, register } from 'prom-client';

// Métricas por defecto
collectDefaultMetrics();

// Métricas personalizadas
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Alertas

#### Alert Manager Config
```yaml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'email'
  routes:
  - match:
      severity: critical
    receiver: 'pagerduty'

receivers:
- name: 'email'
  email_configs:
  - to: 'alerts@rent360.com'

- name: 'pagerduty'
  pagerduty_configs:
  - service_key: 'your-pagerduty-key'
```

## 🔄 Estrategias de Backup

### Base de Datos

#### Backup Automático con pg_dump
```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/rent360_$DATE.sql"

# Crear backup
pg_dump -h localhost -U rent360 -d rent360 > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Subir a S3
aws s3 cp $BACKUP_FILE.gz s3://rent360-backups/

# Limpiar backups antiguos (mantener 30 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

#### Programar con Cron
```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Archivos

#### Backup de S3 con Cross-Region Replication
```bash
# Configurar replication
aws s3api put-bucket-replication \
  --bucket rent360-production-files \
  --replication-configuration file://replication-config.json
```

## 🚀 CI/CD Pipeline

### GitHub Actions

#### Workflow Completo (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test:ci

    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

### Blue-Green Deployment

#### Script de Deployment
```bash
#!/bin/bash

# Variables
BLUE_PORT=3000
GREEN_PORT=3001
HEALTH_CHECK_URL="http://localhost:$GREEN_PORT/api/health"

echo "🚀 Starting blue-green deployment..."

# Verificar que la nueva versión esté saludable
echo "🔍 Checking health of green environment..."
if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
    echo "✅ Green environment is healthy"

    # Cambiar el balanceador de carga
    echo "🔄 Switching load balancer to green environment..."
    # Aquí iría la lógica para cambiar el LB (nginx, ALB, etc.)

    # Detener blue environment
    echo "🛑 Stopping blue environment..."
    docker stop rent360-blue

    echo "🎉 Deployment completed successfully!"
else
    echo "❌ Green environment health check failed"
    echo "🔙 Rolling back..."
    docker stop rent360-green
    exit 1
fi
```

## 📈 Optimización de Performance

### CDN Configuration

#### CloudFront Distribution
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### Configuración de Cache
```json
{
  "CallerReference": "rent360-cdn",
  "Comment": "CDN for Rent360",
  "DefaultCacheBehavior": {
    "TargetOriginId": "rent360-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "rent360-origin",
        "DomainName": "rent360.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  }
}
```

### Database Optimization

#### Índices Recomendados
```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

-- Índices para contratos
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Connection Pooling
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔧 Troubleshooting

### Problemas Comunes

#### Application Won't Start
```bash
# Verificar logs
docker logs rent360-app

# Verificar variables de entorno
docker exec rent360-app env

# Verificar conectividad de BD
docker exec rent360-app npx prisma db push --preview-feature
```

#### High Memory Usage
```bash
# Verificar uso de memoria
docker stats rent360-app

# Restart con límites
docker update --memory=512m --memory-swap=1g rent360-app
```

#### Database Connection Issues
```bash
# Verificar conectividad
telnet your-db-host 5432

# Verificar credenciales
psql -h your-db-host -U your-user -d your-db
```

### Rollback Strategy

#### Quick Rollback
```bash
# Con Vercel
vercel rollback

# Con Docker
docker tag rent360:latest rent360:rollback
docker rollback rent360-app

# Con Kubernetes
kubectl rollout undo deployment/rent360-app
```

Esta guía proporciona una base sólida para el deployment y mantenimiento de Rent360 en producción. Ajusta las configuraciones según tus necesidades específicas y requisitos de seguridad.
