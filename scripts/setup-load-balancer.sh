#!/bin/bash

# Script de configuración de Load Balancer y Auto-scaling para Rent360
# Configura Nginx como load balancer y AWS auto-scaling

set -e

echo "🔄 Configurando Load Balancer y Auto-scaling para Rent360..."

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
# CONFIGURACIÓN DE NGINX COMO LOAD BALANCER
# =====================================================

setup_nginx_load_balancer() {
    echo "🌐 Configurando Nginx como Load Balancer..."

    # Instalar Nginx si no está instalado
    if ! command -v nginx &> /dev/null; then
        echo "📦 Instalando Nginx..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y nginx
        elif command -v apk &> /dev/null; then
            sudo apk add nginx
        else
            echo "❌ Sistema operativo no soportado para instalación automática de Nginx"
            return 1
        fi
    fi

    # Crear configuración de upstream para las instancias de la aplicación
    cat << EOF | sudo tee /etc/nginx/sites-available/rent360-upstream
# Upstream configuration for Rent360 application servers
upstream rent360_app {
    # Configuración de balanceo de carga
    least_conn;  # Algoritmo de menor conexiones

    # Servidores de aplicación (actualizar con IPs reales)
    server app1.rent360.com:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app2.rent360.com:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app3.rent360.com:3000 weight=1 max_fails=3 fail_timeout=30s;

    # Servidor de respaldo
    # server backup.rent360.com:3000 backup;

    # Mantener conexiones keepalive
    keepalive 32;
}

# Health check upstream
upstream rent360_health {
    server app1.rent360.com:3000;
    server app2.rent360.com:3000;
    server app3.rent360.com:3000;
}
EOF

    # Crear configuración principal del sitio
    cat << EOF | sudo tee /etc/nginx/sites-available/rent360
# Load Balancer Configuration for Rent360
server {
    listen 80;
    server_name rent360.com www.rent360.com;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rent360.com www.rent360.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/rent360.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rent360.com/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;

    # Static files cache
    location /_next/static/ {
        proxy_pass http://rent360_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status \$upstream_cache_status;

        # Compression
        gzip_static on;
    }

    # API routes with rate limiting
    location /api/ {
        # Rate limiting for API
        limit_req zone=api burst=20 nodelay;

        # Authentication endpoints with stricter limits
        location ~ ^/api/(auth|login|register) {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://rent360_app;
        }

        # Payment endpoints
        location ~ ^/api/(payments|payouts) {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://rent360_app;
        }

        proxy_pass http://rent360_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Readiness check
    location /ready {
        proxy_pass http://rent360_health/api/health/ready;
        proxy_set_header Host \$host;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://rent360_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;

        # WebSocket support for real-time features
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings for better performance
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Security: Don't serve dotfiles
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

    # Crear configuración de Nginx para monitoreo y métricas
    cat << EOF | sudo tee /etc/nginx/sites-available/rent360-monitoring
# Monitoring Configuration for Rent360
server {
    listen 8080;
    server_name monitoring.rent360.com;

    # Restrict access to monitoring
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;

    # Nginx status page
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }

    # Application metrics
    location /metrics {
        proxy_pass http://rent360_app/api/metrics;
        proxy_set_header Host \$host;
    }

    # Health checks
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Habilitar los sitios
    sudo ln -sf /etc/nginx/sites-available/rent360 /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/rent360-monitoring /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/rent360-upstream /etc/nginx/sites-enabled/

    # Remover configuración por defecto
    sudo rm -f /etc/nginx/sites-enabled/default

    # Configuración de Nginx para alta concurrencia
    cat << EOF | sudo tee /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
worker_rlimit_nofile 65536;

error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 65536;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for" '
                    'rt=\$request_time ua="\$upstream_addr" '
                    'us="\$upstream_status" ut="\$upstream_response_time" '
                    'ul="\$upstream_response_length" '
                    'cs=\$upstream_cache_status';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting zones
    limit_req_zone \$binary_remote_addr zone=general:10m rate=100r/s;
    limit_req_zone \$binary_remote_addr zone=api:10m rate=50r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=10r/m;

    # Connection limiting
    limit_conn_zone \$binary_remote_addr zone=conn_limit_per_ip:10m;

    # Upstream keepalive
    upstream_keepalive 32;

    include /etc/nginx/sites-enabled/*;
}
EOF

    # Probar configuración
    sudo nginx -t

    # Reiniciar Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx

    echo "✅ Nginx configurado como Load Balancer"
}

# =====================================================
# CONFIGURACIÓN DE AWS APPLICATION LOAD BALANCER
# =====================================================

setup_aws_alb() {
    echo "☁️ Configurando AWS Application Load Balancer..."

    # Verificar si AWS CLI está instalado
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI no está instalado. Instálalo primero."
        return 1
    fi

    # Verificar credenciales de AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ Credenciales de AWS no configuradas o inválidas"
        return 1
    fi

    # Crear CloudFormation template para ALB
    cat << EOF > "$PROJECT_ROOT/config/aws-alb.yaml"
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Application Load Balancer for Rent360'

Parameters:
  VPCId:
    Type: String
    Description: VPC ID where the ALB will be created
  SubnetIds:
    Type: CommaDelimitedList
    Description: Subnet IDs for the ALB (at least 2 in different AZs)
  CertificateArn:
    Type: String
    Description: ARN of the SSL certificate for HTTPS
  SecurityGroupIds:
    Type: CommaDelimitedList
    Description: Security group IDs for the ALB

Resources:
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: rent360-alb
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups: !Ref SecurityGroupIds
      Subnets: !Ref SubnetIds

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: rent360-targets
      Protocol: HTTP
      Port: 3000
      VpcId: !Ref VPCId
      TargetType: instance
      HealthCheckPath: /api/health/ready
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: 200

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Rent360 ALB
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: Rent360LoadBalancerDNS

  LoadBalancerArn:
    Description: ARN of the load balancer
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: Rent360LoadBalancerArn

  TargetGroupArn:
    Description: ARN of the target group
    Value: !Ref TargetGroup
    Export:
      Name: Rent360TargetGroupArn
EOF

    # Script para desplegar ALB
    cat << EOF > "$PROJECT_ROOT/scripts/deploy-alb.sh"
#!/bin/bash

# Script para desplegar Application Load Balancer en AWS

set -e

STACK_NAME="rent360-alb"
TEMPLATE_FILE="\$PROJECT_ROOT/config/aws-alb.yaml"

# Parámetros requeridos (configurar según tu entorno)
VPC_ID="vpc-xxxxxx"
SUBNET_IDS="subnet-xxxxxx,subnet-yyyyyy"
CERTIFICATE_ARN="arn:aws:acm:region:account:certificate/xxxxx"
SECURITY_GROUP_IDS="sg-xxxxxx"

echo "Desplegando ALB en AWS..."

# Crear o actualizar el stack
aws cloudformation deploy \\
  --template-file "\$TEMPLATE_FILE" \\
  --stack-name "\$STACK_NAME" \\
  --parameter-overrides \\
    VPCId="\$VPC_ID" \\
    SubnetIds="\$SUBNET_IDS" \\
    CertificateArn="\$CERTIFICATE_ARN" \\
    SecurityGroupIds="\$SECURITY_GROUP_IDS" \\
  --capabilities CAPABILITY_IAM

# Obtener outputs del stack
ALB_DNS=\$(aws cloudformation describe-stacks \\
  --stack-name "\$STACK_NAME" \\
  --query 'Stacks[0].Outputs[?OutputKey==\`LoadBalancerDNS\`].OutputValue' \\
  --output text)

echo "✅ ALB desplegado exitosamente!"
echo "DNS del ALB: \$ALB_DNS"
echo ""
echo "Configura tu dominio para apuntar a: \$ALB_DNS"
EOF

    chmod +x "$PROJECT_ROOT/scripts/deploy-alb.sh"

    echo "✅ AWS ALB configurado"
}

# =====================================================
# CONFIGURACIÓN DE AWS AUTO SCALING GROUP
# =====================================================

setup_aws_autoscaling() {
    echo "📈 Configurando AWS Auto Scaling Group..."

    # Crear CloudFormation template para Auto Scaling
    cat << EOF > "$PROJECT_ROOT/config/aws-autoscaling.yaml"
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Auto Scaling Group for Rent360 Application'

Parameters:
  VPCId:
    Type: String
    Description: VPC ID
  SubnetIds:
    Type: CommaDelimitedList
    Description: Subnet IDs for EC2 instances
  AMIId:
    Type: AWS::EC2::Image::Id
    Description: AMI ID for the application instances
  InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Key pair name for SSH access
  TargetGroupArn:
    Type: String
    Description: ARN of the target group

Resources:
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: rent360-app-template
      LaunchTemplateData:
        ImageId: !Ref AMIId
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        SecurityGroupIds: [!Ref InstanceSecurityGroup]
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            amazon-linux-extras install docker -y
            systemctl start docker
            systemctl enable docker

            # Configurar aplicación
            docker run -d \\
              --name rent360-app \\
              -p 3000:3000 \\
              -e NODE_ENV=production \\
              -e DATABASE_URL="\${DatabaseUrl}" \\
              -e REDIS_URL="\${RedisUrl}" \\
              rent360/app:latest

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Rent360 application instances
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          CidrIp: 0.0.0.0/0

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: rent360-app-asg
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: '\$Latest'
      MinSize: '2'
      MaxSize: '10'
      DesiredCapacity: '3'
      VPCZoneIdentifier: !Ref SubnetIds
      TargetGroupARNs:
        - !Ref TargetGroupArn
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300

      # Políticas de escalado
      ScalingPolicies:
        # Escalar hacia arriba basado en CPU
        - PolicyName: ScaleUpOnCPU
          PolicyType: TargetTrackingScaling
          TargetTrackingConfiguration:
            PredefinedMetricSpecification:
              PredefinedMetricType: ASGAverageCPUUtilization
            TargetValue: 70.0

        # Escalar hacia arriba basado en conexiones ALB
        - PolicyName: ScaleUpOnALBConnections
          PolicyType: TargetTrackingScaling
          TargetTrackingConfiguration:
            PredefinedMetricSpecification:
              PredefinedMetricType: ALBRequestCountPerTarget
              ResourceLabel: !Sub "\${LoadBalancer}/targetgroup/\${TargetGroup}"
            TargetValue: 1000

        # Escalar hacia abajo
        - PolicyName: ScaleDown
          PolicyType: TargetTrackingScaling
          TargetTrackingConfiguration:
            PredefinedMetricSpecification:
              PredefinedMetricType: ASGAverageCPUUtilization
            TargetValue: 30.0

Outputs:
  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: Rent360AutoScalingGroupName

  LaunchTemplateId:
    Description: ID of the Launch Template
    Value: !Ref LaunchTemplate
    Export:
      Name: Rent360LaunchTemplateId
EOF

    # Script para desplegar Auto Scaling
    cat << EOF > "$PROJECT_ROOT/scripts/deploy-autoscaling.sh"
#!/bin/bash

# Script para desplegar Auto Scaling Group en AWS

set -e

STACK_NAME="rent360-autoscaling"
TEMPLATE_FILE="\$PROJECT_ROOT/config/aws-autoscaling.yaml"

# Parámetros requeridos
VPC_ID="vpc-xxxxxx"
SUBNET_IDS="subnet-xxxxxx,subnet-yyyyyy"
AMI_ID="ami-xxxxxx"
INSTANCE_TYPE="t3.medium"
KEY_NAME="rent360-key"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:region:account:targetgroup/xxxxx"

echo "Desplegando Auto Scaling Group..."

# Crear o actualizar el stack
aws cloudformation deploy \\
  --template-file "\$TEMPLATE_FILE" \\
  --stack-name "\$STACK_NAME" \\
  --parameter-overrides \\
    VPCId="\$VPC_ID" \\
    SubnetIds="\$SUBNET_IDS" \\
    AMIId="\$AMI_ID" \\
    InstanceType="\$INSTANCE_TYPE" \\
    KeyName="\$KEY_NAME" \\
    TargetGroupArn="\$TARGET_GROUP_ARN" \\
  --capabilities CAPABILITY_IAM

echo "✅ Auto Scaling Group desplegado exitosamente!"
EOF

    chmod +x "$PROJECT_ROOT/scripts/deploy-autoscaling.sh"

    echo "✅ AWS Auto Scaling configurado"
}

# =====================================================
# CONFIGURACIÓN DE KUBERNETES HPA
# =====================================================

setup_kubernetes_hpa() {
    echo "🐳 Configurando Kubernetes HPA..."

    # Crear archivos de configuración de Kubernetes
    cat << EOF > "$PROJECT_ROOT/config/k8s-deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rent360-app
  labels:
    app: rent360
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
        image: rent360/app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rent360-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: rent360-secrets
              key: redis-url
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
EOF

    cat << EOF > "$PROJECT_ROOT/config/k8s-hpa.yaml"
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: rent360-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: rent360-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
        max: 100
EOF

    cat << EOF > "$PROJECT_ROOT/config/k8s-service.yaml"
apiVersion: v1
kind: Service
metadata:
  name: rent360-service
spec:
  selector:
    app: rent360
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
EOF

    # Script para desplegar en Kubernetes
    cat << EOF > "$PROJECT_ROOT/scripts/deploy-k8s.sh"
#!/bin/bash

# Script para desplegar aplicación en Kubernetes con HPA

set -e

NAMESPACE="rent360-prod"

echo "Desplegando en Kubernetes..."

# Crear namespace si no existe
kubectl create namespace "\$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Crear secrets
kubectl create secret generic rent360-secrets \\
  --from-literal=database-url="\$DATABASE_URL" \\
  --from-literal=redis-url="\$REDIS_URL" \\
  --namespace="\$NAMESPACE" \\
  --dry-run=client -o yaml | kubectl apply -f -

# Desplegar aplicación
kubectl apply -f config/k8s-deployment.yaml -n "\$NAMESPACE"
kubectl apply -f config/k8s-service.yaml -n "\$NAMESPACE"
kubectl apply -f config/k8s-hpa.yaml -n "\$NAMESPACE"

# Verificar despliegue
kubectl get pods -n "\$NAMESPACE"
kubectl get hpa -n "\$NAMESPACE"

echo "✅ Despliegue en Kubernetes completado!"
EOF

    chmod +x "$PROJECT_ROOT/scripts/deploy-k8s.sh"

    echo "✅ Kubernetes HPA configurado"
}

# =====================================================
# MONITOREO DE LOAD BALANCER
# =====================================================

setup_monitoring() {
    echo "📊 Configurando monitoreo del Load Balancer..."

    # Crear script de monitoreo
    cat << EOF > "$PROJECT_ROOT/scripts/monitor-lb.sh"
#!/bin/bash

# Script de monitoreo para Load Balancer

LB_ENDPOINT="${LB_ENDPOINT:-http://localhost}"
LB_METRICS_ENDPOINT="${LB_METRICS_ENDPOINT:-http://localhost:8080}"

# Función para verificar estado del LB
check_lb_status() {
    echo "🔍 Verificando estado del Load Balancer..."

    local response=\$(curl -s -o /dev/null -w "%{http_code}" "\$LB_ENDPOINT/health")
    if [ "\$response" = "200" ]; then
        echo "✅ Load Balancer está funcionando"
        return 0
    else
        echo "❌ Load Balancer no responde (HTTP \$response)"
        return 1
    fi
}

# Verificar upstream servers
check_upstream_servers() {
    echo "🔍 Verificando servidores upstream..."

    # Usar nginx stub status si está disponible
    if curl -s "\$LB_METRICS_ENDPOINT/nginx_status" > /dev/null 2>&1; then
        echo "📊 Estadísticas de Nginx:"
        curl -s "\$LB_METRICS_ENDPOINT/nginx_status"
    fi

    # Verificar servidores individuales
    local servers=("app1.rent360.com" "app2.rent360.com" "app3.rent360.com")

    for server in "\${servers[@]}"; do
        local response=\$(curl -s -o /dev/null -w "%{http_code}" "http://\$server:3000/api/health/live")
        if [ "\$response" = "200" ]; then
            echo "✅ \$server: OK"
        else
            echo "❌ \$server: FALLANDO (HTTP \$response)"
        fi
    done
}

# Monitoreo de rendimiento
check_performance() {
    echo "⚡ Verificando rendimiento..."

    # Medir tiempo de respuesta
    local response_time=\$(curl -s -o /dev/null -w "%{time_total}" "\$LB_ENDPOINT/api/health/live")

    echo "Tiempo de respuesta: \${response_time}s"

    # Alertar si es muy lento
    if (( \$(echo "\$response_time > 2.0" | bc -l) )); then
        echo "🚨 ALERTA: Tiempo de respuesta alto"
    fi
}

# Verificar balanceo de carga
check_load_distribution() {
    echo "⚖️ Verificando distribución de carga..."

    # Realizar múltiples requests y ver distribución
    local requests=10
    declare -A server_counts

    for i in \$(seq 1 \$requests); do
        local server=\$(curl -s "\$LB_ENDPOINT/api/server-info" | jq -r '.server' 2>/dev/null)
        if [ -n "\$server" ]; then
            ((server_counts["\$server"]++))
        fi
        sleep 0.1
    done

    echo "Distribución de requests:"
    for server in "\${!server_counts[@]}"; do
        echo "  \$server: \${server_counts[\$server]} requests"
    done
}

# Monitoreo continuo
monitor_continuous() {
    echo "🔄 Monitoreo continuo iniciado (Ctrl+C para detener)..."
    while true; do
        echo "=== \$(date) ==="
        check_lb_status || echo "❌ Load Balancer no disponible"
        check_upstream_servers
        check_performance
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
    # Verificar estado general
    if ! check_lb_status; then
        send_alert "Load Balancer no disponible" "critical"
        return 1
    fi

    # Verificar upstream servers
    local failed_servers=0
    local servers=("app1.rent360.com" "app2.rent360.com" "app3.rent360.com")

    for server in "\${servers[@]}"; do
        local response=\$(curl -s -o /dev/null -w "%{http_code}" "http://\$server:3000/api/health/live")
        if [ "\$response" != "200" ]; then
            ((failed_servers++))
        fi
    done

    if [ "\$failed_servers" -gt 1 ]; then
        send_alert "\$failed_servers servidores upstream fallando" "warning"
    fi

    # Verificar rendimiento
    local response_time=\$(curl -s -o /dev/null -w "%{time_total}" "\$LB_ENDPOINT/api/health/live")
    if (( \$(echo "\$response_time > 5.0" | bc -l) )); then
        send_alert "Tiempo de respuesta muy alto: \${response_time}s" "warning"
    fi

    echo "✅ Verificación de salud completada"
}

case "\$1" in
    status)
        check_lb_status && check_upstream_servers && check_performance
        ;;
    distribution)
        check_load_distribution
        ;;
    monitor)
        monitor_continuous
        ;;
    health)
        health_check
        ;;
    *)
        echo "Uso: \$0 {status|distribution|monitor|health}"
        echo "  status       - Ver estado general"
        echo "  distribution - Ver distribución de carga"
        echo "  monitor      - Monitoreo continuo"
        echo "  health       - Verificación de salud"
        exit 1
        ;;
esac
EOF

    chmod +x "$PROJECT_ROOT/scripts/monitor-lb.sh"

    echo "✅ Monitoreo configurado"
}

# =====================================================
# EJECUCIÓN PRINCIPAL
# =====================================================

# Configurar Nginx como Load Balancer
setup_nginx_load_balancer

# Configurar AWS ALB si está habilitado
if check_env_var "AWS_ALB_ENABLED" && grep -q "^AWS_ALB_ENABLED=true" "$ENV_FILE"; then
    setup_aws_alb
fi

# Configurar AWS Auto Scaling si está habilitado
if check_env_var "AWS_AUTOSCALING_ENABLED" && grep -q "^AWS_AUTOSCALING_ENABLED=true" "$ENV_FILE"; then
    setup_aws_autoscaling
fi

# Configurar Kubernetes HPA si está habilitado
if check_env_var "KUBERNETES_HPA_ENABLED" && grep -q "^KUBERNETES_HPA_ENABLED=true" "$ENV_FILE"; then
    setup_kubernetes_hpa
fi

# Configurar monitoreo
setup_monitoring

echo ""
echo "🎉 Configuración de Load Balancer y Auto-scaling completada!"
echo ""
echo "📋 Servicios configurados:"
echo "  ✅ Nginx Load Balancer"
echo "  ✅ AWS ALB (opcional)"
echo "  ✅ AWS Auto Scaling Group (opcional)"
echo "  ✅ Kubernetes HPA (opcional)"
echo "  ✅ Monitoreo de Load Balancer"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Configura los servidores upstream en nginx.conf"
echo "2. Instala certificados SSL con Let's Encrypt"
echo "3. Configura tu dominio para apuntar al Load Balancer"
echo "4. Prueba la configuración: ./scripts/monitor-lb.sh status"
echo ""

echo "🔧 Comandos útiles:"
echo "  # Ver estado del Load Balancer:"
echo "  ./scripts/monitor-lb.sh status"
echo ""
echo "  # Ver distribución de carga:"
echo "  ./scripts/monitor-lb.sh distribution"
echo ""
echo "  # Monitoreo continuo:"
echo "  ./scripts/monitor-lb.sh monitor"
echo ""
echo "  # Verificar salud:"
echo "  ./scripts/monitor-lb.sh health"
echo ""

echo "⚠️ Recuerda:"
echo "  - Configurar DNS para el Load Balancer"
echo "  - Configurar SSL/TLS certificates"
echo "  - Configurar firewalls y security groups"
echo "  - Monitorear logs de Nginx"
echo "  - Configurar backups de configuración"
echo "  - Probar failover scenarios"
