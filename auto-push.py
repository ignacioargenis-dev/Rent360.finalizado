#!/usr/bin/env python3
"""
SCRIPT AUTOMÁTICO PARA SUBIR CAMBIOS A GITHUB
Ejecuta automáticamente: git add . && git commit && git push
"""

import subprocess
import os
import sys
from datetime import datetime

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print(f"✅ {description} - ÉXITO")
            return True, result.stdout.strip()
        else:
            print(f"❌ {description} - ERROR")
            print(f"   Código: {result.returncode}")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False, result.stderr.strip()
    except Exception as e:
        print(f"💥 {description} - EXCEPCIÓN: {str(e)}")
        return False, str(e)

def main():
    print("🚀 SUBIENDO CAMBIOS A GITHUB AUTOMÁTICAMENTE")
    print("=" * 60)

    # Verificar que estamos en un repositorio Git
    if not os.path.exists('.git'):
        print("❌ Error: No es un repositorio Git")
        return False

    # Verificar estado del repositorio
    success, output = run_command("git status --porcelain", "Verificando cambios pendientes")
    if not success:
        return False

    if not output.strip():
        print("📋 No hay cambios pendientes para subir")
        return True

    print(f"📝 Cambios encontrados:\n{output}")

    # Agregar todos los cambios
    success, _ = run_command("git add .", "Agregando todos los cambios")
    if not success:
        return False

    # Crear commit con timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_msg = f"auto-commit: cambios automáticos - {timestamp}"

    success, _ = run_command(f'git commit -m "{commit_msg}"', "Creando commit automático")
    if not success:
        return False

    # Subir a GitHub
    success, output = run_command("git push origin master", "Subiendo a GitHub")
    if not success:
        # Intentar con main si master falla
        print("⚠️  Intentando con rama 'main'...")
        success, output = run_command("git push origin main", "Subiendo a rama main")
        if not success:
            return False

    print("\n" + "=" * 60)
    print("🎉 ¡CAMBIOS SUBIDOS EXITOSAMENTE!")
    print("✅ Todos los cambios están en GitHub")
    print("🔄 Próximos cambios serán subidos automáticamente")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Error al subir cambios. Verifica la conexión a GitHub.")
        sys.exit(1)
    else:
        print("\n✅ Proceso completado exitosamente!")
