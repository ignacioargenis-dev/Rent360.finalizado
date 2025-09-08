#!/bin/bash

# Pre-commit hook para validar tests
# Este script se ejecuta automáticamente antes de cada commit

echo "🔍 Ejecutando validaciones pre-commit..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en un repositorio git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "No se encuentra repositorio git"
    exit 1
fi

# Obtener archivos modificados
MODIFIED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
ALL_FILES=$(git diff --cached --name-only)

# Verificar si hay archivos de test modificados
TEST_FILES=$(echo "$MODIFIED_FILES" | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$" || true)
SOURCE_FILES=$(echo "$MODIFIED_FILES" | grep -E "\.(ts|tsx|js|jsx)$" | grep -v -E "\.(test|spec)\." || true)

# 1. Validación de TypeScript
echo "🔧 Ejecutando type checking..."
if npm run type-check > /dev/null 2>&1; then
    print_status "TypeScript validation passed"
else
    print_error "TypeScript validation failed"
    echo "Ejecuta: npm run type-check"
    exit 1
fi

# 2. Validación de ESLint
echo "🎨 Ejecutando ESLint..."
if npm run lint --silent > /dev/null 2>&1; then
    print_status "ESLint validation passed"
else
    print_error "ESLint validation failed"
    echo "Ejecuta: npm run lint"
    exit 1
fi

# 3. Ejecutar tests relacionados con archivos modificados
if [ -n "$SOURCE_FILES" ] || [ -n "$TEST_FILES" ]; then
    echo "🧪 Ejecutando tests relacionados..."

    # Si hay archivos de test modificados, ejecutar solo esos
    if [ -n "$TEST_FILES" ]; then
        echo "Ejecutando tests modificados: $TEST_FILES"
        if npm run test:unit -- --testPathPattern="$TEST_FILES" --watchAll=false > /dev/null 2>&1; then
            print_status "Tests modificados pasaron"
        else
            print_error "Tests modificados fallaron"
            exit 1
        fi
    else
        # Si hay archivos fuente modificados, ejecutar tests unitarios
        echo "Ejecutando tests unitarios..."
        if npm run test:unit -- --watchAll=false --passWithNoTests > /dev/null 2>&1; then
            print_status "Tests unitarios pasaron"
        else
            print_error "Tests unitarios fallaron"
            exit 1
        fi
    fi
else
    print_warning "No se encontraron archivos modificados para validar tests"
fi

# 4. Verificar cobertura mínima si hay archivos fuente modificados
if [ -n "$SOURCE_FILES" ]; then
    echo "📊 Verificando cobertura de código..."

    # Ejecutar tests con cobertura
    if npm run test:coverage -- --watchAll=false > /dev/null 2>&1; then
        # Leer reporte de cobertura
        if [ -f "coverage/coverage-summary.json" ]; then
            LINES_COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
            FUNCTIONS_COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.functions.pct")

            if (( $(echo "$LINES_COVERAGE < 75" | bc -l 2>/dev/null || echo "1") )); then
                print_error "Cobertura de líneas baja: ${LINES_COVERAGE}% (mínimo: 75%)"
                exit 1
            fi

            if (( $(echo "$FUNCTIONS_COVERAGE < 75" | bc -l 2>/dev/null || echo "1") )); then
                print_error "Cobertura de funciones baja: ${FUNCTIONS_COVERAGE}% (mínimo: 75%)"
                exit 1
            fi

            print_status "Cobertura aceptable - Líneas: ${LINES_COVERAGE}%, Funciones: ${FUNCTIONS_COVERAGE}%"
        else
            print_warning "No se pudo leer reporte de cobertura"
        fi
    else
        print_error "Error ejecutando tests de cobertura"
        exit 1
    fi
fi

# 5. Verificar que no hay archivos sensibles en el commit
echo "🔒 Verificando archivos sensibles..."
SENSITIVE_FILES=$(echo "$ALL_FILES" | grep -E "\.(env|key|pem|cert)$" || true)

if [ -n "$SENSITIVE_FILES" ]; then
    print_error "Archivos sensibles detectados en el commit:"
    echo "$SENSITIVE_FILES"
    print_error "Remueve estos archivos del commit"
    exit 1
fi

# 6. Verificar que no hay console.log en archivos fuente
echo "🧹 Verificando código limpio..."
CONSOLE_LOGS=$(echo "$SOURCE_FILES" | xargs grep -l "console\." 2>/dev/null || true)

if [ -n "$CONSOLE_LOGS" ]; then
    print_warning "console.* encontrado en archivos fuente:"
    echo "$CONSOLE_LOGS"
    print_warning "Considera remover console.log antes del commit"
fi

# 7. Verificar tamaño del commit
echo "📏 Verificando tamaño del commit..."
COMMIT_SIZE=$(git diff --cached --stat | tail -1 | awk '{print $4+$6}')

if [ "$COMMIT_SIZE" -gt 1000 ]; then
    print_warning "Commit muy grande detectado (${COMMIT_SIZE} líneas modificadas)"
    print_warning "Considera dividir en commits más pequeños"
fi

# 8. Ejecutar análisis de código si está disponible
echo "🔍 Ejecutando análisis de código..."
if npm run code-analysis > /dev/null 2>&1; then
    print_status "Análisis de código completado"
else
    print_warning "Análisis de código no disponible o falló"
fi

# Todas las validaciones pasaron
print_status "🎉 Todas las validaciones pre-commit pasaron exitosamente!"
print_status "El commit puede proceder."

exit 0
