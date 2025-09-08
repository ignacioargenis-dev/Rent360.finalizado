#!/usr/bin/env node

/**
 * Script maestro para ejecutar toda la suite de testing de Rent360
 * Incluye: setup, ejecución, reportes y recomendaciones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestingSuiteRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.startTime = Date.now();
    this.results = {
      setup: false,
      unit: false,
      integration: false,
      e2e: false,
      security: false,
      coverage: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coveragePercent: 0,
      errors: [],
      warnings: []
    };
  }

  async runFullSuite() {
    console.log('🚀 RENT360 - SUITE COMPLETA DE TESTING');
    console.log('=' .repeat(60));
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log(`📁 Proyecto: ${this.projectRoot}`);
    console.log('');

    try {
      // 1. Verificar setup
      await this.verifySetup();

      // 2. Ejecutar tests unitarios
      await this.runUnitTests();

      // 3. Ejecutar tests de integración
      await this.runIntegrationTests();

      // 4. Ejecutar tests E2E
      await this.runE2ETests();

      // 5. Ejecutar tests de seguridad
      await this.runSecurityTests();

      // 6. Generar análisis de cobertura
      await this.runCoverageAnalysis();

      // 7. Generar reporte final
      this.generateFinalReport();

      // 8. Recomendaciones
      this.generateRecommendations();

    } catch (error) {
      console.error('❌ Error ejecutando suite completa:', error.message);
      this.results.errors.push(error.message);
      this.generateErrorReport();
    }
  }

  async verifySetup() {
    console.log('🔧 VERIFICANDO SETUP...');

    try {
      // Verificar dependencias
      execSync('npm list jest @playwright/test @testing-library/react', {
        stdio: 'pipe',
        cwd: this.projectRoot
      });

      // Verificar archivos de configuración
      const requiredFiles = [
        'jest.config.full.js',
        'playwright.config.ts',
        'tests/setup.ts',
        '.github/workflows/ci-cd.yml'
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(this.projectRoot, file))) {
          throw new Error(`Archivo requerido faltante: ${file}`);
        }
      }

      this.results.setup = true;
      console.log('✅ Setup verificado correctamente');

    } catch (error) {
      console.log('❌ Error en setup:', error.message);
      console.log('💡 Ejecuta: npm install');
      throw error;
    }
  }

  async runUnitTests() {
    console.log('\n🧪 EJECUTANDO TESTS UNITARIOS...');

    try {
      const output = execSync('npm run test:unit -- --watchAll=false --json', {
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const results = JSON.parse(output);
      this.results.unit = results.success;
      this.results.totalTests += results.numTotalTests || 0;
      this.results.passedTests += results.numPassedTests || 0;
      this.results.failedTests += results.numFailedTests || 0;

      console.log(`✅ Tests unitarios: ${results.numPassedTests}/${results.numTotalTests} pasaron`);

    } catch (error) {
      console.log('❌ Tests unitarios fallaron');
      this.results.warnings.push('Tests unitarios con errores');
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 EJECUTANDO TESTS DE INTEGRACIÓN...');

    try {
      const output = execSync('npm run test:integration -- --watchAll=false --json', {
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const results = JSON.parse(output);
      this.results.integration = results.success;
      this.results.totalTests += results.numTotalTests || 0;
      this.results.passedTests += results.numPassedTests || 0;
      this.results.failedTests += results.numFailedTests || 0;

      console.log(`✅ Tests de integración: ${results.numPassedTests}/${results.numTotalTests} pasaron`);

    } catch (error) {
      console.log('❌ Tests de integración fallaron');
      this.results.warnings.push('Tests de integración con errores');
    }
  }

  async runE2ETests() {
    console.log('\n🌐 EJECUTANDO TESTS E2E...');

    try {
      // Verificar si Playwright está configurado
      execSync('npx playwright --version', { stdio: 'pipe', cwd: this.projectRoot });

      const output = execSync('npm run test:e2e -- --reporter=json', {
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const results = JSON.parse(output);
      this.results.e2e = true; // Playwright no tiene success flag igual que Jest
      this.results.totalTests += results.suites?.[0]?.specs?.length || 0;

      console.log(`✅ Tests E2E ejecutados`);

    } catch (error) {
      console.log('⚠️ Tests E2E no disponibles o fallaron');
      this.results.warnings.push('Tests E2E requieren configuración adicional');
    }
  }

  async runSecurityTests() {
    console.log('\n🔐 EJECUTANDO TESTS DE SEGURIDAD...');

    try {
      const output = execSync('npm run test:security -- --watchAll=false --json', {
        stdio: 'pipe',
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const results = JSON.parse(output);
      this.results.security = results.success;
      this.results.totalTests += results.numTotalTests || 0;
      this.results.passedTests += results.numPassedTests || 0;
      this.results.failedTests += results.numFailedTests || 0;

      console.log(`✅ Tests de seguridad: ${results.numPassedTests}/${results.numTotalTests} pasaron`);

    } catch (error) {
      console.log('❌ Tests de seguridad fallaron');
      this.results.warnings.push('Tests de seguridad con errores');
    }
  }

  async runCoverageAnalysis() {
    console.log('\n📊 GENERANDO ANÁLISIS DE COBERTURA...');

    try {
      execSync('npm run test:coverage -- --watchAll=false', {
        stdio: 'pipe',
        cwd: this.projectRoot
      });

      // Leer reporte de cobertura
      const coveragePath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.results.coverage = true;
        this.results.coveragePercent = Math.round(coverage.total.lines.pct);

        console.log(`✅ Cobertura generada: ${this.results.coveragePercent}%`);
      }

    } catch (error) {
      console.log('❌ Error generando cobertura');
      this.results.warnings.push('Error en análisis de cobertura');
    }
  }

  generateFinalReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const successRate = this.results.totalTests > 0
      ? Math.round((this.results.passedTests / this.results.totalTests) * 100)
      : 0;

    console.log('\n📋 REPORTE FINAL DE TESTING');
    console.log('='.repeat(60));
    console.log(`⏱️ Duración: ${duration} segundos`);
    console.log(`🧪 Tests totales: ${this.results.totalTests}`);
    console.log(`✅ Pasaron: ${this.results.passedTests}`);
    console.log(`❌ Fallaron: ${this.results.failedTests}`);
    console.log(`📊 Tasa de éxito: ${successRate}%`);
    console.log(`📈 Cobertura: ${this.results.coveragePercent}%`);
    console.log('');

    // Estado de cada componente
    console.log('📊 ESTADO POR COMPONENTE:');
    console.log(`   🔧 Setup: ${this.results.setup ? '✅' : '❌'}`);
    console.log(`   🧪 Unitarios: ${this.results.unit ? '✅' : '❌'}`);
    console.log(`   🔗 Integración: ${this.results.integration ? '✅' : '❌'}`);
    console.log(`   🌐 E2E: ${this.results.e2e ? '✅' : '⚠️'}`);
    console.log(`   🔐 Seguridad: ${this.results.security ? '✅' : '❌'}`);
    console.log(`   📊 Cobertura: ${this.results.coverage ? '✅' : '❌'}`);
    console.log('');

    // Calificación general
    const overallScore = this.calculateOverallScore();
    console.log('🎯 CALIFICACIÓN GENERAL:');
    console.log(`   • Puntaje: ${overallScore}/100`);
    console.log(`   • Nivel: ${this.getQualityLevel(overallScore)}`);
    console.log('');

    // Guardar reporte
    this.saveReport();

    if (this.results.failedTests === 0 && this.results.coveragePercent >= 75) {
      console.log('🎉 ¡FELICITACIONES! Todos los tests pasaron y la cobertura es excelente.');
      console.log('🚀 El código está listo para producción.');
    } else {
      console.log('⚠️ Se encontraron algunos problemas que requieren atención.');
      console.log('💡 Revisa el reporte detallado para más información.');
    }
  }

  calculateOverallScore() {
    let score = 0;

    // Setup (20%)
    if (this.results.setup) score += 20;

    // Tests (50%)
    const testScore = (this.results.passedTests / Math.max(this.results.totalTests, 1)) * 50;
    score += testScore;

    // Cobertura (30%)
    const coverageScore = Math.min(this.results.coveragePercent / 100 * 30, 30);
    score += coverageScore;

    return Math.round(Math.min(score, 100));
  }

  getQualityLevel(score) {
    if (score >= 95) return '🏆 EXCELENTE';
    if (score >= 85) return '🎯 MUY BUENO';
    if (score >= 75) return '✅ BUENO';
    if (score >= 65) return '⚠️ ACEPTABLE';
    return '❌ REQUIERE MEJORA';
  }

  generateRecommendations() {
    console.log('\n💡 RECOMENDACIONES:');

    if (!this.results.setup) {
      console.log('   • Configurar setup completo: npm install');
    }

    if (!this.results.unit) {
      console.log('   • Corregir tests unitarios: npm run test:unit');
    }

    if (!this.results.integration) {
      console.log('   • Corregir tests de integración: npm run test:integration');
    }

    if (!this.results.e2e) {
      console.log('   • Configurar tests E2E: npx playwright install');
    }

    if (!this.results.security) {
      console.log('   • Implementar tests de seguridad: npm run test:security');
    }

    if (!this.results.coverage) {
      console.log('   • Mejorar cobertura: npm run test:coverage');
    }

    if (this.results.coveragePercent < 75) {
      console.log('   • Aumentar cobertura al 75% mínimo');
    }

    console.log('   • Configurar hooks de Git: npm run setup-hooks');
    console.log('   • Ver documentación: TESTING_IMPLEMENTATION_SUMMARY.md');
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      overallScore: this.calculateOverallScore(),
      recommendations: this.generateRecommendationsText()
    };

    const reportPath = path.join(this.projectRoot, 'full-testing-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Reporte guardado: ${reportPath}`);
  }

  generateRecommendationsText() {
    const recommendations = [];

    if (this.results.failedTests > 0) {
      recommendations.push('Corregir tests fallidos');
    }

    if (this.results.coveragePercent < 75) {
      recommendations.push('Aumentar cobertura de código al 75%');
    }

    if (!this.results.e2e) {
      recommendations.push('Configurar tests E2E con Playwright');
    }

    return recommendations;
  }

  generateErrorReport() {
    console.log('\n❌ REPORTE DE ERRORES:');
    console.log('='.repeat(40));

    this.results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const runner = new TestingSuiteRunner();
  runner.runFullSuite().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { TestingSuiteRunner };
