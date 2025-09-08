#!/bin/bash

# Script para validar configuración de variables de entorno de producción
# Uso: ./scripts/validate-env.sh [archivo_env]

set -e

ENV_FILE="${1:-config/production.env}"

echo "🔍 Validando configuración de producción..."
echo "📄 Archivo: $ENV_FILE"
echo ""

# Verificar que el archivo existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Archivo de configuración no encontrado: $ENV_FILE"
    echo "💡 Crea el archivo con: cp config/production.env .env.production"
    exit 1
fi

# Función para verificar variable de entorno
check_env_var() {
    local var_name="$1"
    local var_value="$2"
    local required="$3"
    local placeholder_pattern="$4"

    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo "❌ $var_name: NO CONFIGURADO (requerido)"
            return 1
        else
            echo "⚠️  $var_name: NO CONFIGURADO (opcional)"
            return 0
        fi
    fi

    # Verificar si es un placeholder
    if [[ "$var_value" =~ $placeholder_pattern ]]; then
        if [ "$required" = "true" ]; then
            echo "❌ $var_name: PLACEHOLDER NO REEMPLAZADO (requerido)"
            return 1
        else
            echo "⚠️  $var_name: PLACEHOLDER NO REEMPLAZADO (opcional)"
            return 0
        fi
    fi

    echo "✅ $var_name: CONFIGURADO"
    return 0
}

# Contadores
total_vars=0
configured_vars=0
errors=0

echo "📊 VALIDACIÓN DE VARIABLES DE ENTORNO"
echo "====================================="
echo ""

# Leer archivo línea por línea
while IFS='=' read -r key value; do
    # Saltar líneas vacías y comentarios
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue

    # Remover espacios y comillas
    key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"//' | sed 's/"$//')

    ((total_vars++))

    # Determinar si es requerido y patrón de placeholder
    required="false"
    placeholder_pattern=""

    case "$key" in
        # Variables críticas requeridas
        DATABASE_URL|NEXTAUTH_SECRET|JWT_SECRET)
            required="true"
            placeholder_pattern="your-.*|secure_.*|change-in-production"
            ;;
        # APIs bancarias (requeridas para producción)
        BANCO_ESTADO_API_KEY|BANCO_ESTADO_API_SECRET|BCI_CLIENT_ID|BCI_CLIENT_SECRET)
            required="true"
            placeholder_pattern="your-.*"
            ;;
        # Firebase (requerido para notificaciones)
        NEXT_PUBLIC_FIREBASE_*|FIREBASE_*)
            if [[ "$key" == *"API_KEY"* || "$key" == *"PROJECT_ID"* ]]; then
                required="true"
                placeholder_pattern="your-.*"
            fi
            ;;
        # Otras variables con placeholders
        *)
            placeholder_pattern="your-.*|secure_.*|change-in-production"
            ;;
    esac

    if check_env_var "$key" "$value" "$required" "$placeholder_pattern"; then
        ((configured_vars++))
    else
        ((errors++))
    fi

done < "$ENV_FILE"

echo ""
echo "📈 RESUMEN DE VALIDACIÓN"
echo "========================"
echo "Total de variables: $total_vars"
echo "Variables configuradas: $configured_vars"
echo "Variables con errores: $errors"
echo ""

# Verificaciones adicionales
echo "🔧 VERIFICACIONES ADICIONALES"
echo "=============================="

# Verificar conectividad de base de datos
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    if [[ "$DB_URL" != *"your-"* && "$DB_URL" != *"secure_password"* ]]; then
        echo "🔍 Probando conexión a base de datos..."
        if command -v psql &> /dev/null; then
            if psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
                echo "✅ Conexión a base de datos: OK"
            else
                echo "❌ Conexión a base de datos: FALLÓ"
                ((errors++))
            fi
        else
            echo "⚠️  psql no disponible para probar conexión"
        fi
    fi
fi

# Verificar conectividad de Redis
if grep -q "^REDIS_URL=" "$ENV_FILE"; then
    REDIS_URL=$(grep "^REDIS_URL=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    if [[ "$REDIS_URL" != *"your-"* ]]; then
        echo "🔍 Probando conexión a Redis..."
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
                echo "✅ Conexión a Redis: OK"
            else
                echo "❌ Conexión a Redis: FALLÓ"
                ((errors++))
            fi
        else
            echo "⚠️  redis-cli no disponible para probar conexión"
        fi
    fi
fi

echo ""
echo "🎯 RESULTADO FINAL"
echo "=================="

if [ $errors -eq 0 ]; then
    echo "✅ CONFIGURACIÓN VÁLIDA"
    echo "🚀 Lista para desplegar a producción"
    exit 0
else
    echo "❌ CONFIGURACIÓN CON ERRORES"
    echo "🔧 Revisa y corrige las variables marcadas antes de desplegar"
    echo ""
    echo "💡 Comandos útiles:"
    echo "   - Ver variables faltantes: grep 'your-\|secure_\|change-in-production' $ENV_FILE"
    echo "   - Generar contraseñas seguras: openssl rand -base64 32"
    echo "   - Validar nuevamente: ./scripts/validate-env.sh"
    exit 1
fi
