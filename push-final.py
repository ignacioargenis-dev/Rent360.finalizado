#!/usr/bin/env python3
import subprocess
import os
import sys

# Cambiar al directorio del proyecto
project_dir = r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado'
os.chdir(project_dir)

print("🚀 SUBIENDO CAMBIOS A GITHUB")
print("=" * 60)
print(f"📁 Directorio: {project_dir}")

def run_git_command(args, description):
    """Ejecuta un comando git y maneja errores"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(['git'] + args, capture_output=True, text=True, cwd=project_dir)
        if result.returncode == 0:
            print(f"✅ {description} - ÉXITO")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ {description} - ERROR")
            if result.stderr.strip():
                print(f"   Error: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"💥 {description} - EXCEPCIÓN: {str(e)}")
        return False

# Paso 1: Verificar estado
if not run_git_command(['status', '--short'], 'Verificando estado del repositorio'):
    print("\n❌ Error al verificar estado")
    sys.exit(1)

# Paso 2: Agregar cambios
if not run_git_command(['add', '.'], 'Agregando todos los cambios'):
    print("\n❌ Error al agregar cambios")
    sys.exit(1)

# Paso 3: Crear commit
commit_msg = """fix: correccion final error TypeScript createdAt

- Resolver definitivamente error 'string | undefined'
- Usar substring(0, 10) para formato seguro YYYY-MM-DD
- Preparar para despliegue DigitalOcean App Platform
- Limpiar archivos residuales de sesiones anteriores"""

if not run_git_command(['commit', '-m', commit_msg], 'Creando commit'):
    # Si no hay cambios para commitear, es normal
    if "nothing to commit" in commit_msg.lower():
        print("⚠️  No hay cambios nuevos para commitear")
    else:
        print("\n❌ Error al crear commit")
        sys.exit(1)

# Paso 4: Subir a GitHub
if not run_git_command(['push', 'origin', 'master'], 'Subiendo a GitHub (master)'):
    print("⚠️  Intentando con rama 'main'...")
    if not run_git_command(['push', 'origin', 'main'], 'Subiendo a GitHub (main)'):
        print("\n❌ Error al subir cambios a GitHub")
        sys.exit(1)

print("\n" + "=" * 60)
print("🎉 ¡CAMBIOS SUBIDOS EXITOSAMENTE!")
print("✅ Corrección final aplicada")
print("✅ Proyecto listo para DigitalOcean")
print("=" * 60)
