#!/bin/bash

# Script para configurar Git hooks
# Instala el hook de pre-commit para validar código automáticamente

echo "🔧 Configurando Git hooks..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Verificar que existe el directorio de hooks
HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    print_error "Directorio de hooks de git no encontrado"
    exit 1
fi

# Verificar que existe el script de pre-commit
PRE_COMMIT_SCRIPT="scripts/pre-commit.sh"
if [ ! -f "$PRE_COMMIT_SCRIPT" ]; then
    print_error "Script de pre-commit no encontrado: $PRE_COMMIT_SCRIPT"
    exit 1
fi

# Hacer ejecutable el script de pre-commit
chmod +x "$PRE_COMMIT_SCRIPT"
print_status "Script de pre-commit hecho ejecutable"

# Instalar el hook de pre-commit
HOOK_FILE="$HOOKS_DIR/pre-commit"
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Git pre-commit hook
# Ejecuta validaciones antes de permitir el commit

# Obtener directorio del repositorio
REPO_DIR=$(git rev-parse --show-toplevel)

# Ejecutar script de pre-commit
"$REPO_DIR/scripts/pre-commit.sh"

# Si el script falla, cancelar el commit
if [ $? -ne 0 ]; then
    echo "❌ Pre-commit validations failed. Commit cancelled."
    exit 1
fi

echo "✅ Pre-commit validations passed. Proceeding with commit."
exit 0
EOF

# Hacer ejecutable el hook
chmod +x "$HOOK_FILE"
print_status "Hook de pre-commit instalado"

# Verificar instalación
if [ -x "$HOOK_FILE" ]; then
    print_status "Hook de pre-commit configurado correctamente"
    echo ""
    echo "📋 El hook de pre-commit ahora validará automáticamente:"
    echo "   • TypeScript type checking"
    echo "   • ESLint code quality"
    echo "   • Tests relacionados con archivos modificados"
    echo "   • Cobertura de código mínima (75%)"
    echo "   • Archivos sensibles"
    echo "   • Código limpio (sin console.log)"
    echo "   • Análisis de código"
    echo ""
    echo "🎯 Para hacer un commit, ejecuta:"
    echo "   git add ."
    echo "   git commit -m 'Tu mensaje de commit'"
    echo ""
    echo "El hook se ejecutará automáticamente antes de cada commit."
else
    print_error "Error instalando hook de pre-commit"
    exit 1
fi

# Instalar hook de pre-push (opcional)
read -p "¿Deseas instalar también hook de pre-push? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    PUSH_HOOK_FILE="$HOOKS_DIR/pre-push"
    cat > "$PUSH_HOOK_FILE" << 'EOF'
#!/bin/bash

# Git pre-push hook
# Ejecuta validaciones completas antes de hacer push

echo "🔍 Ejecutando validaciones pre-push..."

# Obtener directorio del repositorio
REPO_DIR=$(git rev-parse --show-toplevel)

# Ejecutar tests completos
cd "$REPO_DIR"
if npm run test:comprehensive; then
    echo "✅ Todas las validaciones pasaron. Push permitido."
    exit 0
else
    echo "❌ Validaciones fallaron. Push cancelado."
    echo "Ejecuta: npm run test:comprehensive"
    exit 1
fi
EOF

    chmod +x "$PUSH_HOOK_FILE"
    print_status "Hook de pre-push también instalado"
fi

print_status "🎉 Configuración de Git hooks completada!"
echo ""
echo "💡 Para probar los hooks:"
echo "   1. Modifica algún archivo"
echo "   2. Ejecuta: git add . && git commit -m 'test'"
echo "   3. El hook debería ejecutarse automáticamente"
