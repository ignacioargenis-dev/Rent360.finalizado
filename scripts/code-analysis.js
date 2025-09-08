#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Iniciando análisis de código...\n');

// Análisis de archivos TypeScript/JavaScript
function analyzeCodebase() {
  console.log('📁 Analizando estructura de archivos...');

  const srcDir = path.join(__dirname, '..', 'src');
  const issues = [];

  // Función recursiva para analizar archivos
  function analyzeDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativeFilePath = path.join(relativePath, file);

      if (stat.isDirectory()) {
        // Saltar directorios de node_modules y otros no relevantes
        if (!['node_modules', '.next', 'coverage', 'dist'].includes(file)) {
          analyzeDirectory(filePath, relativeFilePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const issuesInFile = analyzeFile(filePath, relativeFilePath);
        issues.push(...issuesInFile);
      }
    }
  }

  // Análisis de un archivo individual
  function analyzeFile(filePath, relativePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 1. Buscar console.log en producción
    if (content.includes('console.log') && !relativePath.includes('test')) {
      const consoleLines = lines
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => line.includes('console.log'));

      consoleLines.forEach(({ index }) => {
        issues.push({
          type: 'WARNING',
          file: relativePath,
          line: index,
          message: 'console.log encontrado - considerar usar logger en producción'
        });
      });
    }

    // 2. Buscar async/await sin try/catch
    const asyncFunctions = content.match(/async\s+\w+\s*\([^)]*\)\s*{[^}]*}/g);
    if (asyncFunctions) {
      asyncFunctions.forEach(func => {
        if (!func.includes('try') && !func.includes('catch')) {
          const lineNumber = lines.findIndex(line => line.includes(func.split('{')[0])) + 1;
          issues.push({
            type: 'WARNING',
            file: relativePath,
            line: lineNumber,
            message: 'Función async sin manejo de errores try/catch'
          });
        }
      });
    }

    // 3. Buscar uso de any type
    const anyTypes = (content.match(/:\s*any\b/g) || []).length;
    if (anyTypes > 0) {
      issues.push({
        type: 'INFO',
        file: relativePath,
        line: 1,
        message: `${anyTypes} uso(s) de tipo 'any' - considerar usar tipos más específicos`
      });
    }

    // 4. Buscar imports no utilizados (básico)
    const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
    imports.forEach(imp => {
      const importMatch = imp.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const [, importedItems] = importMatch;
        const items = importedItems.split(',').map(item => item.trim());

        items.forEach(item => {
          const cleanItem = item.replace(/as\s+\w+/, '').trim();
          // Verificar si el item importado se usa en el archivo
          const usageRegex = new RegExp(`\\b${cleanItem}\\b`, 'g');
          const usages = content.match(usageRegex) || [];

          if (usages.length <= 1) { // Solo el import cuenta como uso
            const lineNumber = lines.findIndex(line => line.includes(imp)) + 1;
            issues.push({
              type: 'WARNING',
              file: relativePath,
              line: lineNumber,
              message: `Import '${cleanItem}' posiblemente no utilizado`
            });
          }
        });
      }
    });

    // 5. Buscar funciones demasiado largas
    let braceCount = 0;
    let functionStart = -1;
    let functionName = '';

    lines.forEach((line, index) => {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;

      if (line.includes('function') || line.includes('=>') || line.includes('async')) {
        if (functionStart === -1) {
          functionStart = index;
          const funcMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)/);
          if (funcMatch) {
            functionName = funcMatch[1];
          }
        }
      }

      if (braceCount === 0 && functionStart !== -1) {
        const functionLength = index - functionStart;
        if (functionLength > 50) { // Más de 50 líneas
          issues.push({
            type: 'WARNING',
            file: relativePath,
            line: functionStart + 1,
            message: `Función '${functionName}' muy larga (${functionLength} líneas) - considerar dividir`
          });
        }
        functionStart = -1;
        functionName = '';
      }
    });

    // 6. Buscar uso de eval o Function constructor
    if (content.includes('eval(') || content.includes('new Function(')) {
      const evalLines = lines
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => line.includes('eval(') || line.includes('new Function('));

      evalLines.forEach(({ index }) => {
        issues.push({
          type: 'CRITICAL',
          file: relativePath,
          line: index,
          message: 'Uso de eval() o Function constructor - riesgo de seguridad'
        });
      });
    }

    return issues;
  }

  analyzeDirectory(srcDir);

  return issues;
}

// Análisis de dependencias
function analyzeDependencies() {
  console.log('📦 Analizando dependencias...');

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const issues = [];

    // Verificar versiones de dependencias críticas
    const criticalDeps = ['next', 'react', 'typescript'];
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        const version = packageJson.dependencies[dep];
        if (version.includes('^0.') || version.includes('~0.')) {
          issues.push({
            type: 'WARNING',
            file: 'package.json',
            line: 1,
            message: `Dependencia crítica '${dep}' en versión preliminar: ${version}`
          });
        }
      }
    });

    // Verificar dependencias duplicadas
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(allDeps);
    const duplicates = depNames.filter((dep, index) => depNames.indexOf(dep) !== index);

    duplicates.forEach(dep => {
      issues.push({
        type: 'ERROR',
        file: 'package.json',
        line: 1,
        message: `Dependencia duplicada encontrada: ${dep}`
      });
    });

    return issues;
  } catch (error) {
    return [{
      type: 'ERROR',
      file: 'package.json',
      line: 1,
      message: `Error analizando package.json: ${error.message}`
    }];
  }
}

// Análisis de configuración de base de datos
function analyzeDatabase() {
  console.log('🗄️  Analizando configuración de base de datos...');

  const issues = [];
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    issues.push({
      type: 'ERROR',
      file: 'prisma/schema.prisma',
      line: 1,
      message: 'Archivo schema.prisma no encontrado'
    });
    return issues;
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Verificar índices faltantes en campos frecuentemente consultados
  const commonFields = ['email', 'status', 'createdAt', 'updatedAt'];
  commonFields.forEach(field => {
    if (schema.includes(` ${field} `) && !schema.includes(`@@index([${field}])`)) {
      issues.push({
        type: 'WARNING',
        file: 'prisma/schema.prisma',
        line: 1,
        message: `Campo '${field}' frecuentemente consultado sin índice`
      });
    }
  });

  // Verificar relaciones sin índices
  const relations = schema.match(/(\w+)Id\s+String/g) || [];
  relations.forEach(relation => {
    const fieldName = relation.replace('Id', '').toLowerCase();
    if (!schema.includes(`@@index([${fieldName}Id])`)) {
      issues.push({
        type: 'WARNING',
        file: 'prisma/schema.prisma',
        line: 1,
        message: `Relación '${fieldName}Id' sin índice - puede causar consultas N+1`
      });
    }
  });

  return issues;
}

// Función principal
function main() {
  const allIssues = [
    ...analyzeCodebase(),
    ...analyzeDependencies(),
    ...analyzeDatabase()
  ];

  // Clasificar issues por severidad
  const criticalIssues = allIssues.filter(issue => issue.type === 'CRITICAL');
  const errorIssues = allIssues.filter(issue => issue.type === 'ERROR');
  const warningIssues = allIssues.filter(issue => issue.type === 'WARNING');
  const infoIssues = allIssues.filter(issue => issue.type === 'INFO');

  // Mostrar resumen
  console.log('\n📊 Resumen del análisis:');
  console.log(`🔴 Críticos: ${criticalIssues.length}`);
  console.log(`❌ Errores: ${errorIssues.length}`);
  console.log(`⚠️  Advertencias: ${warningIssues.length}`);
  console.log(`ℹ️  Información: ${infoIssues.length}`);

  // Mostrar issues críticos y errores primero
  const priorityIssues = [...criticalIssues, ...errorIssues, ...warningIssues, ...infoIssues];

  if (priorityIssues.length > 0) {
    console.log('\n🔍 Issues encontrados:');

    priorityIssues.forEach((issue, index) => {
      const icon = {
        CRITICAL: '🔴',
        ERROR: '❌',
        WARNING: '⚠️',
        INFO: 'ℹ️'
      }[issue.type];

      console.log(`${index + 1}. ${icon} ${issue.file}:${issue.line} - ${issue.message}`);
    });
  } else {
    console.log('\n✅ No se encontraron issues críticos en el análisis.');
  }

  // Recomendaciones generales
  console.log('\n💡 Recomendaciones:');
  console.log('1. Revisar todos los issues críticos y errores antes del despliegue');
  console.log('2. Considerar agregar índices para campos frecuentemente consultados');
  console.log('3. Implementar manejo de errores consistente en todas las funciones async');
  console.log('4. Reemplazar tipos "any" con tipos más específicos');
  console.log('5. Ejecutar tests regularmente para detectar regresiones');

  // Código de salida basado en severidad
  if (criticalIssues.length > 0) {
    console.log('\n❌ Análisis completado con issues críticos. Código de salida: 1');
    process.exit(1);
  } else if (errorIssues.length > 0) {
    console.log('\n⚠️ Análisis completado con errores. Código de salida: 1');
    process.exit(1);
  } else {
    console.log('\n✅ Análisis completado exitosamente. Código de salida: 0');
    process.exit(0);
  }
}

// Ejecutar análisis
main();
