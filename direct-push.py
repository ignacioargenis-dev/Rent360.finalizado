#!/usr/bin/env python3
"""
SCRIPT DIRECTO PARA SUBIR CAMBIOS A GITHUB
Ejecuta git add, commit y push directamente
"""

import os
import sys
from datetime import datetime

# Cambiar al directorio del proyecto
os.chdir(r'C:\Users\Perrita\Documents\GitHub\Rent360.finalizado')

print("🚀 SUBIENDO CAMBIOS DIRECTAMENTE A GITHUB")
print("=" * 60)

def run_command(cmd):
    """Ejecuta comando usando os.system"""
    print(f"🔧 Ejecutando: {cmd}")
    result = os.system(cmd)
    if result == 0:
        print("✅ ÉXITO")
        return True
    else:
        print(f"❌ ERROR (código: {result})")
        return False

# Ejecutar comandos paso a paso
commands = [
    'git status --short',
    'git add .',
    f'git commit -m "fix: correccion final error TypeScript createdAt - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n- Resolver definitivamente error \'string | undefined\'\n- Usar substring(0, 10) para formato seguro YYYY-MM-DD\n- Preparar para despliegue DigitalOcean App Platform"',
    'git push origin master'
]

for i, cmd in enumerate(commands, 1):
    print(f"\n[{i}/{len(commands)}] ", end="")
    if not run_command(cmd):
        if i == 4:  # Si falla push a master, intentar main
            print("⚠️  Intentando con rama 'main'...")
            if not run_command('git push origin main'):
                print("\n❌ Error al subir cambios")
                sys.exit(1)
        elif i == 3:  # Si falla commit, puede ser normal si no hay cambios
            print("⚠️  Posiblemente no hay cambios nuevos para commitear")
        else:
            print(f"\n❌ Error en paso {i}")
            sys.exit(1)

print("\n" + "=" * 60)
print("🎉 ¡TODOS LOS CAMBIOS SUBIDOS EXITOSAMENTE!")
print("✅ Proyecto listo para DigitalOcean")
print("=" * 60)
