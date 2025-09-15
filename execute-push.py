import subprocess
import sys

print("🚀 EJECUTANDO PUSH FINAL...")
print("=" * 50)

# Ejecutar el script push-final.py
try:
    result = subprocess.run([sys.executable, 'push-final.py'],
                          capture_output=True, text=True,
                          cwd=r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado')

    print("STDOUT:")
    print(result.stdout)

    if result.stderr:
        print("\nSTDERR:")
        print(result.stderr)

    print(f"\nReturn code: {result.returncode}")

    if result.returncode == 0:
        print("\n✅ ¡SCRIPT EJECUTADO EXITOSAMENTE!")
    else:
        print(f"\n❌ Error en ejecución (código: {result.returncode})")

except Exception as e:
    print(f"💥 Error al ejecutar script: {str(e)}")
    sys.exit(1)
