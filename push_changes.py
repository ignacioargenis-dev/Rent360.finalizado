#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print(f"✅ {description} - ÉXITO")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - ERROR")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {str(e)}")
        return False

def main():
    print("🚀 SUBIENDO CAMBIOS A GITHUB - RENT360")
    print("=" * 50)

    # Verificar que estamos en el directorio correcto
    if not os.path.exists('.git'):
        print("❌ Error: No se encuentra repositorio Git")
        sys.exit(1)

    if not os.path.exists('src/app/admin/contracts/page.tsx'):
        print("❌ Error: Archivo corregido no encontrado")
        sys.exit(1)

    # Ejecutar comandos
    commands = [
        ("git status", "Verificando estado del repositorio"),
        ("git add src/app/admin/contracts/page.tsx", "Agregando archivo corregido"),
        ('git commit -m "fix: corregir error de tipos en contratos - asegurar createdAt siempre sea string\n\n- Agregar type annotation explicita para Contract\n- Asegurar createdAt nunca sea undefined usando fallback\n- Agregar id temporal para satisfacer el tipo Contract\n- Prevenir errores de TypeScript en DigitalOcean App Platform\n- Mejorar robustez del codigo de creacion de contratos"', "Creando commit"),
        ("git push origin master", "Subiendo a GitHub")
    ]

    success = True
    for command, description in commands:
        if not run_command(command, description):
            success = False
            break

    if success:
        print("\n" + "=" * 50)
        print("🎉 ¡TODOS LOS CAMBIOS SUBIDOS EXITOSAMENTE!")
        print("=" * 50)
        print("\n✅ Los cambios han sido subidos a GitHub.")
        print("✅ El build debería funcionar correctamente ahora.")
        print("🚀 DigitalOcean App Platform debería desplegar sin errores.")
    else:
        print("\n" + "=" * 50)
        print("❌ ERROR: No se pudieron subir todos los cambios")
        print("=" * 50)

    input("\nPresiona Enter para continuar...")

if __name__ == "__main__":
    main()
