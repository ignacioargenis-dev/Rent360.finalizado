#!/usr/bin/env python3
import subprocess
import os
import time

def run_command(cmd, description):
    """Ejecuta comando con timeout y manejo de errores"""
    print(f"🔧 {description}...")
    try:
        # Usar shell=True para mejor compatibilidad
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                              timeout=30, cwd=os.getcwd())
        if result.returncode == 0:
            print(f"✅ {description} - ÉXITO")
            if result.stdout.strip():
                print(f"Output: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ {description} - ERROR (código: {result.returncode})")
            if result.stderr.strip():
                print(f"Error: {result.stderr.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT (30s)")
        return False
    except Exception as e:
        print(f"💥 {description} - EXCEPCIÓN: {str(e)}")
        return False

def main():
    print("🚀 CORRECCIÓN FINAL - SUBIENDO A GITHUB")
    print("=" * 50)

    # Verificar que estamos en el directorio correcto
    if not os.path.exists('.git'):
        print("❌ Error: No se encuentra repositorio Git")
        return

    if not os.path.exists('src/app/admin/contracts/page.tsx'):
        print("❌ Error: Archivo corregido no encontrado")
        return

    print("📁 Directorio actual:", os.getcwd())

    # Ejecutar comandos paso a paso
    commands = [
        ("git status", "Verificando estado del repositorio"),
        ("git add src/app/admin/contracts/page.tsx", "Agregando archivo corregido"),
        ('git commit -m "fix: corregir definitivamente error de tipos en createdAt

- Usar substring(0, 10) en lugar de split para mayor seguridad
- Garantizar que createdAt siempre sea string valido
- Resolver error TypeScript en DigitalOcean App Platform
- Mejorar robustez de la creacion de contratos"', "Creando commit final"),
        ("git push origin master", "Subiendo a GitHub")
    ]

    success_count = 0
    for cmd, desc in commands:
        if run_command(cmd, desc):
            success_count += 1
        else:
            print(f"⚠️  Comando falló: {desc}")
            break

    print("\n" + "=" * 50)
    if success_count == len(commands):
        print("🎉 ¡TODOS LOS CAMBIOS SUBIDOS EXITOSAMENTE!")
        print("✅ Corrección final aplicada")
        print("✅ Build debería funcionar correctamente")
        print("🚀 DigitalOcean App Platform listo")
    else:
        print(f"❌ Solo {success_count}/{len(commands)} comandos exitosos")
        print("🔧 Puede requerir intervención manual")

    input("\nPresiona Enter para continuar...")

if __name__ == "__main__":
    main()
