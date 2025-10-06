#!/bin/bash

# Script de despliegue automatizado para DigitalOcean App Platform
# Rent360 - Despliegue automático

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar variables de entorno requeridas
check_env_vars() {
    log "Verificando variables de entorno..."

    required_vars=("DIGITALOCEAN_ACCESS_TOKEN" "DIGITALOCEAN_APP_ID")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        error "Variables de entorno faltantes:"
        printf '  - %s\n' "${missing_vars[@]}"
        exit 1
    fi

    success "Variables de entorno verificadas"
}

# Instalar y configurar DigitalOcean CLI
setup_doctl() {
    log "Configurando DigitalOcean CLI..."

    if ! command -v doctl &> /dev/null; then
        log "Instalando doctl..."
        curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
        sudo mv doctl /usr/local/bin/
    fi

    # Autenticar
    echo "$DIGITALOCEAN_ACCESS_TOKEN" | doctl auth init --access-token-stdin

    success "DigitalOcean CLI configurado"
}

# Verificar estado de la aplicación
check_app_status() {
    log "Verificando estado de la aplicación..."

    app_info=$(doctl apps get "$DIGITALOCEAN_APP_ID" --format json)

    if [[ $? -ne 0 ]]; then
        error "No se pudo obtener información de la aplicación"
        exit 1
    fi

    phase=$(echo "$app_info" | jq -r '.phase')
    app_url=$(echo "$app_info" | jq -r '.default_ingress')

    log "Estado actual: $phase"
    log "URL de la aplicación: $app_url"

    success "Estado de la aplicación verificado"
}

# Crear deployment
create_deployment() {
    log "Creando nuevo deployment..."

    deployment_result=$(doctl apps create-deployment "$DIGITALOCEAN_APP_ID" --wait --format json)

    if [[ $? -ne 0 ]]; then
        error "Error al crear el deployment"
        echo "$deployment_result"
        exit 1
    fi

    deployment_id=$(echo "$deployment_result" | jq -r '.id')
    deployment_phase=$(echo "$deployment_result" | jq -r '.phase')

    log "Deployment ID: $deployment_id"
    log "Estado del deployment: $deployment_phase"

    success "Deployment creado exitosamente"
}

# Esperar a que el deployment esté listo
wait_for_deployment() {
    log "Esperando a que el deployment esté listo..."

    max_attempts=30
    attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        app_info=$(doctl apps get "$DIGITALOCEAN_APP_ID" --format json 2>/dev/null)

        if [[ $? -eq 0 ]]; then
            phase=$(echo "$app_info" | jq -r '.phase')
            app_url=$(echo "$app_info" | jq -r '.default_ingress')

            case $phase in
                "ACTIVE")
                    success "Deployment completado exitosamente"
                    log "URL de la aplicación: $app_url"
                    return 0
                    ;;
                "ERROR"|"FAILED")
                    error "Deployment falló"
                    echo "$app_info" | jq '.cause'
                    exit 1
                    ;;
                "PENDING"|"BUILDING"|"DEPLOYING")
                    log "Deployment en progreso... ($phase) - Intento $attempt/$max_attempts"
                    ;;
                *)
                    warning "Estado desconocido: $phase"
                    ;;
            esac
        else
            warning "No se pudo verificar el estado (intento $attempt/$max_attempts)"
        fi

        sleep 20
        ((attempt++))
    done

    error "Timeout esperando el deployment"
    exit 1
}

# Health check
perform_health_check() {
    log "Realizando health check..."

    app_info=$(doctl apps get "$DIGITALOCEAN_APP_ID" --format json)
    app_url=$(echo "$app_info" | jq -r '.default_ingress')

    if [[ -z "$app_url" || "$app_url" == "null" ]]; then
        error "No se pudo obtener la URL de la aplicación"
        exit 1
    fi

    health_url="$app_url/api/health"
    log "Verificando endpoint: $health_url"

    max_attempts=10
    attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            success "Health check exitoso"
            return 0
        else
            log "Health check falló (intento $attempt/$max_attempts) - reintentando..."
        fi

        sleep 10
        ((attempt++))
    done

    error "Health check falló después de $max_attempts intentos"
    exit 1
}

# Función principal
main() {
    log "🚀 Iniciando despliegue a DigitalOcean App Platform"
    log "Aplicación: Rent360"

    check_env_vars
    setup_doctl
    check_app_status
    create_deployment
    wait_for_deployment
    perform_health_check

    success "🎉 Despliegue completado exitosamente"
    success "La aplicación Rent360 está lista en producción"
}

# Manejo de errores
trap 'error "El despliegue falló"' ERR

# Ejecutar función principal
main "$@"
