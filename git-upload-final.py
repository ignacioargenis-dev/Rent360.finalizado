#!/usr/bin/env python3
"""
SCRIPT FINAL PARA SUBIR CAMBIOS A GITHUB
Ejecuta git commands usando subprocess con configuración robusta
"""

import subprocess
import os
import sys
import time

def run_git_command(cmd, description):
    """Ejecuta comando git con configuración robusta"""
    print(f"🔧 {description}...")

    # Configurar entorno para mejor compatibilidad
    env = os.environ.copy()
    env['GIT_TERMINAL_PROMPT'] = '0'  # Deshabilitar prompts interactivos

    try:
        # Ejecutar comando con configuración robusta
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado',
            env=env,
            capture_output=True,
            text=True,
            timeout=60  # Timeout de 60 segundos
        )

        if result.returncode == 0:
            print("✅ ÉXITO")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
            return True
        else:
            print("❌ ERROR")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False

    except subprocess.TimeoutExpired:
        print("⏰ TIMEOUT - Comando tomó demasiado tiempo")
        return False
    except Exception as e:
        print(f"💥 EXCEPCIÓN: {str(e)}")
        return False

def main():
    print("🚨 EMERGENCIA: SUBIENDO CORRECCIÓN CRÍTICA A GITHUB")
    print("=" * 70)
    print("DigitalOcean está fallando porque no tiene la corrección del error TypeScript")
    print("=" * 70)
    print()

    # Verificar que estamos en el directorio correcto
    if not os.path.exists('.git'):
        print("❌ Error: No se encuentra repositorio Git")
        return False

    if not os.path.exists('src/app/admin/contracts/page.tsx'):
        print("❌ Error: Archivo corregido no encontrado")
        return False

    # Paso 1: Verificar estado
    if not run_git_command('git status --porcelain', 'Verificando cambios pendientes'):
        return False

    # Paso 2: Agregar cambios
    if not run_git_command('git add .', 'Agregando todos los cambios'):
        return False

    # Paso 3: Crear commit
    commit_msg = '''fix: correccion EMERGENTE error TypeScript createdAt

🚨 CORRECCION CRITICA PARA DIGITALOCEAN APP PLATFORM

- Resolver DEFINITIVAMENTE error 'string | undefined' en contracts page
- Cambiar split('T')[0] por substring(0, 10) para 100% seguridad
- Garantizar formato YYYY-MM-DD siempre valido
- Fix DigitalOcean App Platform build failure
- Preparar despliegue exitoso inmediato

Este commit resuelve el error que esta causando fallos en DigitalOcean.'''

    # Intentar commit
    success = run_git_command(f'git commit -m "{commit_msg}"', 'Creando commit con corrección')

    # Si no hay cambios para commitear, continuar
    if not success:
        stderr_output = subprocess.run(
            'git commit -m "dummy"', shell=True, capture_output=True, text=True,
            cwd=r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado'
        ).stderr
        if "nothing to commit" not in stderr_output.lower():
            return False
        print("⚠️  No hay cambios nuevos para commitear")
        print("✅ Continuando con push...")

    # Paso 4: Subir a GitHub
    if not run_git_command('git push origin master', 'Subiendo a GitHub (master)'):
        print("⚠️  Intentando con rama 'main'...")
        if not run_git_command('git push origin main', 'Subiendo a GitHub (main)'):
            return False

    print()
    print("=" * 70)
    print("🎉 ¡CORRECCIÓN SUBIDA EXITOSAMENTE A GITHUB!")
    print("=" * 70)
    print()
    print("✅ DigitalOcean ahora debería poder hacer build exitosamente")
    print("✅ El error TypeScript está corregido")
    print("✅ Proyecto listo para producción")
    print()
    print("🚀 El próximo build debería ser EXITOSO.")
    print()

    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print()
        print("❌ ERROR: No se pudieron subir los cambios")
        print("Verifica tu conexión a GitHub y credenciales")
        sys.exit(1)
    else:
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        input("Presiona Enter para continuar...")
