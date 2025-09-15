import subprocess
import os
import sys

os.chdir(r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado')

print("🚀 SUBIENDO CAMBIOS A GITHUB")
print("=" * 50)

# Verificar estado
print("\n[1/4] Verificando estado...")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Estado obtenido")
    if result.stdout.strip():
        print("Cambios pendientes:")
        print(result.stdout)
    else:
        print("No hay cambios pendientes")
        sys.exit(0)
else:
    print("❌ Error al verificar estado:", result.stderr)
    sys.exit(1)

# Agregar cambios
print("\n[2/4] Agregando cambios...")
result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Cambios agregados")
else:
    print("❌ Error al agregar cambios:", result.stderr)
    sys.exit(1)

# Crear commit
print("\n[3/4] Creando commit...")
commit_msg = """fix: correccion final error TypeScript createdAt

- Resolver definitivamente error 'string | undefined'
- Usar substring(0, 10) para formato seguro YYYY-MM-DD
- Preparar para despliegue DigitalOcean App Platform
- Limpiar archivos residuales de sesiones anteriores"""

result = subprocess.run(['git', 'commit', '-m', commit_msg], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Commit creado")
else:
    print("❌ Error al crear commit:", result.stderr)
    # Si no hay cambios para commitear, continuar
    if "nothing to commit" not in result.stderr.lower():
        sys.exit(1)

# Subir a GitHub
print("\n[4/4] Subiendo a GitHub...")
result = subprocess.run(['git', 'push', 'origin', 'master'], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Cambios subidos exitosamente")
else:
    print("❌ Error al subir cambios:", result.stderr)
    # Intentar con main
    print("Intentando con rama 'main'...")
    result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Cambios subidos exitosamente a main")
    else:
        print("❌ Error al subir a main:", result.stderr)
        sys.exit(1)

print("\n" + "=" * 50)
print("🎉 ¡PROCESO COMPLETADO!")
print("✅ Todos los cambios están en GitHub")
print("=" * 50)
