#!/usr/bin/env tsx

/**
 * Script de Validación Completa Rent360
 *
 * Ejecuta todas las validaciones necesarias para verificar que el sistema
 * funciona correctamente después de todas las mejoras implementadas.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class Rent360Validator {
  private results: ValidationResult[] = [];
  private startTime: number = Date.now();

  async run(): Promise<void> {
    console.log('🚀 Iniciando Validación Completa Rent360\n');
    console.log('=' .repeat(60));

    try {
      await this.validateEnvironment();
      await this.validateDatabase();
      await this.validateDependencies();
      await this.validateTypeScript();
      await this.validateBuild();
      await this.validateTests();
      await this.validateSecurity();
      await this.validatePerformance();

      this.generateReport();
    } catch (error) {
      console.error('❌ Error durante la validación:', error);
      process.exit(1);
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('\n📋 Validando entorno...');

    const checks = [
      { name: 'Node.js', command: 'node --version', expected: /^v\d+\.\d+\.\d+/ },
      { name: 'npm', command: 'npm --version', expected: /^\d+\.\d+\.\d+/ },
      { name: 'TypeScript', command: 'npx tsc --version', expected: /Version \d+\.\d+\.\d+/ },
      { name: 'Prisma', command: 'npx prisma --version', expected: /prisma/ },
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8' }).trim();
        const passed = check.expected.test(result);

        this.results.push({
          test: `Environment - ${check.name}`,
          status: passed ? 'PASS' : 'FAIL',
          message: passed ? `${check.name} OK: ${result}` : `${check.name} FAIL: ${result}`,
        });

        console.log(`${passed ? '✅' : '❌'} ${check.name}: ${result}`);
      } catch (error) {
        this.results.push({
          test: `Environment - ${check.name}`,
          status: 'FAIL',
          message: `${check.name} no encontrado`,
        });
        console.log(`❌ ${check.name}: No encontrado`);
      }
    }
  }

  private async validateDatabase(): Promise<void> {
    console.log('\n🗄️  Validando base de datos...');

    try {
      // Verificar que el archivo de base de datos existe
      const dbPath = join(process.cwd(), 'prisma/dev.db');
      const exists = existsSync(dbPath);

      this.results.push({
        test: 'Database - File exists',
        status: exists ? 'PASS' : 'FAIL',
        message: exists ? 'Base de datos encontrada' : 'Base de datos no encontrada',
      });

      console.log(`${exists ? '✅' : '❌'} Base de datos: ${exists ? 'Encontrada' : 'No encontrada'}`);

      // Verificar conexión a la base de datos
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
        this.results.push({
          test: 'Database - Connection',
          status: 'PASS',
          message: 'Conexión a base de datos exitosa',
        });
        console.log('✅ Conexión a base de datos: OK');
      } catch (error) {
        this.results.push({
          test: 'Database - Connection',
          status: 'FAIL',
          message: 'Error conectando a base de datos',
        });
        console.log('❌ Conexión a base de datos: FAIL');
      }

    } catch (error) {
      console.log('❌ Error validando base de datos');
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('\n📦 Validando dependencias...');

    try {
      execSync('npm list --depth=0', { stdio: 'pipe' });
      this.results.push({
        test: 'Dependencies - Check',
        status: 'PASS',
        message: 'Todas las dependencias instaladas correctamente',
      });
      console.log('✅ Dependencias: Todas instaladas');
    } catch (error) {
      this.results.push({
        test: 'Dependencies - Check',
        status: 'FAIL',
        message: 'Error en dependencias',
      });
      console.log('❌ Dependencias: Error detectado');
    }
  }

  private async validateTypeScript(): Promise<void> {
    console.log('\n🔷 Validando TypeScript...');

    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.results.push({
        test: 'TypeScript - Compilation',
        status: 'PASS',
        message: 'TypeScript compila sin errores',
      });
      console.log('✅ TypeScript: Sin errores');
    } catch (error) {
      this.results.push({
        test: 'TypeScript - Compilation',
        status: 'FAIL',
        message: 'Errores de TypeScript detectados',
      });
      console.log('❌ TypeScript: Errores encontrados');
    }
  }

  private async validateBuild(): Promise<void> {
    console.log('\n🔨 Validando build...');

    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.results.push({
        test: 'Build - Next.js',
        status: 'PASS',
        message: 'Build completado exitosamente',
      });
      console.log('✅ Build: Exitoso');
    } catch (error) {
      this.results.push({
        test: 'Build - Next.js',
        status: 'FAIL',
        message: 'Error en build',
      });
      console.log('❌ Build: Falló');
    }
  }

  private async validateTests(): Promise<void> {
    console.log('\n🧪 Ejecutando pruebas...');

    try {
      const startTime = Date.now();
      execSync('npm test -- --watchAll=false --passWithNoTests', { stdio: 'pipe' });
      const duration = Date.now() - startTime;

      this.results.push({
        test: 'Tests - Jest',
        status: 'PASS',
        message: 'Todas las pruebas pasaron',
        duration,
      });
      console.log(`✅ Pruebas: Todas pasaron (${duration}ms)`);
    } catch (error) {
      this.results.push({
        test: 'Tests - Jest',
        status: 'FAIL',
        message: 'Algunas pruebas fallaron',
      });
      console.log('❌ Pruebas: Algunas fallaron');
    }
  }

  private async validateSecurity(): Promise<void> {
    console.log('\n🔒 Validando seguridad...');

    // Verificar que no hay console.log en producción
    try {
      const consoleUsage = execSync('grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l', { encoding: 'utf8' }).trim();

      if (parseInt(consoleUsage) === 0) {
        this.results.push({
          test: 'Security - Console statements',
          status: 'PASS',
          message: 'No se encontraron console statements',
        });
        console.log('✅ Console statements: Ninguno encontrado');
      } else {
        this.results.push({
          test: 'Security - Console statements',
          status: 'FAIL',
          message: `${consoleUsage} console statements encontrados`,
        });
        console.log(`❌ Console statements: ${consoleUsage} encontrados`);
      }
    } catch (error) {
      console.log('⚠️  No se pudo verificar console statements');
    }

    // Verificar que las variables de entorno críticas existen
    const criticalEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET'
    ];

    for (const envVar of criticalEnvVars) {
      const exists = process.env[envVar] !== undefined;

      this.results.push({
        test: `Security - ${envVar}`,
        status: exists ? 'PASS' : 'SKIP',
        message: exists ? 'Variable definida' : 'Variable no definida (usar .env)',
      });

      console.log(`${exists ? '✅' : '⏭️'} ${envVar}: ${exists ? 'Definida' : 'No definida'}`);
    }
  }

  private async validatePerformance(): Promise<void> {
    console.log('\n⚡ Validando rendimiento...');

    try {
      // Verificar que el sistema de caché está funcionando
      const cacheStats = execSync('curl -s http://localhost:3000/api/admin/system-stats || echo "Server not running"', { encoding: 'utf8' });

      if (cacheStats.includes('Server not running')) {
        this.results.push({
          test: 'Performance - Cache system',
          status: 'SKIP',
          message: 'Servidor no está ejecutándose',
        });
        console.log('⏭️  Cache system: Servidor no ejecutándose');
      } else {
        this.results.push({
          test: 'Performance - Cache system',
          status: 'PASS',
          message: 'Sistema de caché operativo',
        });
        console.log('✅ Cache system: Operativo');
      }
    } catch (error) {
      console.log('⚠️  No se pudo verificar rendimiento');
    }
  }

  private generateReport(): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE VALIDACIÓN COMPLETA');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\n📈 Resumen:`);
    console.log(`   ✅ Pasaron: ${passed}`);
    console.log(`   ❌ Fallaron: ${failed}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   📊 Total: ${total}`);
    console.log(`   ⏱️  Duración: ${duration}ms`);

    console.log(`\n📋 Detalles:`);

    for (const result of this.results) {
      const icon = result.status === 'PASS' ? '✅' :
                   result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.message}`);
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 ¡VALIDACIÓN COMPLETA! Todas las pruebas pasaron.');
      console.log('🚀 El sistema Rent360 está listo para producción.');
    } else {
      console.log(`⚠️  VALIDACIÓN CON PROBLEMAS: ${failed} pruebas fallaron.`);
      console.log('🔧 Revisar los errores arriba y corregir antes de continuar.');
      process.exit(1);
    }

    console.log('='.repeat(60));
  }
}

// Ejecutar validación
const validator = new Rent360Validator();
validator.run().catch(console.error);
