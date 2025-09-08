#!/usr/bin/env node

/**
 * REVISIÓN COMPLETA 360° DEL SISTEMA RENT360
 * Script de análisis sistemático según metodología especificada
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemReview360 {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.issues = {
      logic: [],
      communication: [],
      incomplete: [],
      functionality: [],
      critical: []
    };
    this.stats = {
      filesAnalyzed: 0,
      totalLines: 0,
      issuesFound: 0,
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 }
    };
  }

  async runCompleteReview() {
    console.log('🔍 RENT360 - REVISIÓN COMPLETA 360°');
    console.log('=' .repeat(80));
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log(`📁 Proyecto: ${this.projectRoot}`);
    console.log('');

    try {
      // 1. REVISIÓN DE ERRORES DE LÓGICA
      console.log('1️⃣ REVISIÓN DE ERRORES DE LÓGICA');
      await this.reviewLogicErrors();

      // 2. REVISIÓN DE COMUNICACIÓN ENTRE COMPONENTES
      console.log('\n2️⃣ REVISIÓN DE COMUNICACIÓN ENTRE COMPONENTES');
      await this.reviewCommunication();

      // 3. REVISIÓN DE FUNCIONALIDADES INCOMPLETAS
      console.log('\n3️⃣ REVISIÓN DE FUNCIONALIDADES INCOMPLETAS');
      await this.reviewIncompleteFeatures();

      // 4. REVISIÓN DE ERRORES DE FUNCIONAMIENTO
      console.log('\n4️⃣ REVISIÓN DE ERRORES DE FUNCIONAMIENTO');
      await this.reviewFunctionalityErrors();

      // 5. REVISIÓN DE ASPECTOS CRÍTICOS
      console.log('\n5️⃣ REVISIÓN DE ASPECTOS CRÍTICOS');
      await this.reviewCriticalAspects();

      // Generar reporte final
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Error en revisión completa:', error.message);
      this.generateErrorReport();
    }
  }

  async reviewLogicErrors() {
    console.log('   🔍 Analizando errores de lógica...');

    // Revisar archivos críticos
    const criticalFiles = [
      'src/lib/payout-service.ts',
      'src/lib/commission-service.ts',
      'src/lib/kyc-service.ts',
      'src/middleware.ts',
      'src/lib/auth.ts',
      'src/lib/payment-config.ts'
    ];

    for (const filePath of criticalFiles) {
      await this.analyzeLogicInFile(filePath);
    }

    // Buscar patrones comunes de errores lógicos
    await this.findCommonLogicPatterns();
  }

  async analyzeLogicInFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      this.addIssue('logic', 'high', `Archivo no encontrado: ${filePath}`, filePath, 1);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    this.stats.filesAnalyzed++;
    this.stats.totalLines += lines.length;

    // Análisis de lógica en cada línea
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 1. Condiciones incorrectas
      this.checkIncorrectConditions(line, filePath, lineNumber);

      // 2. Cálculos matemáticos erróneos
      this.checkMathematicalErrors(line, filePath, lineNumber);

      // 3. Flujos de ejecución inconsistentes
      this.checkInconsistentFlows(line, filePath, lineNumber);

      // 4. Reglas de negocio incorrectas
      this.checkBusinessLogicErrors(line, filePath, lineNumber);
    });

    // Análisis de estructura general
    this.checkFileStructure(content, filePath);
  }

  checkIncorrectConditions(line, filePath, lineNumber) {
    // Buscar if/else con lógica potencialmente incorrecta
    const ifMatches = line.match(/if\s*\(([^)]+)\)/g);
    if (ifMatches) {
      ifMatches.forEach(match => {
        const condition = match.match(/if\s*\(([^)]+)\)/)?.[1];

        // Condiciones problemáticas comunes
        if (condition?.includes('==') && !condition.includes('===')) {
          this.addIssue('logic', 'medium',
            'Uso de == en lugar de === puede causar comparación laxa',
            filePath, lineNumber, line.trim());
        }

        if (condition?.includes('!=') && !condition.includes('!==')) {
          this.addIssue('logic', 'medium',
            'Uso de != en lugar de !== puede causar comparación laxa',
            filePath, lineNumber, line.trim());
        }

        if (condition?.includes('&& false') || condition?.includes('false &&')) {
          this.addIssue('logic', 'high',
            'Condición siempre falsa detectada',
            filePath, lineNumber, line.trim());
        }

        if (condition?.includes('|| true') || condition?.includes('true ||')) {
          this.addIssue('logic', 'high',
            'Condición siempre verdadera detectada',
            filePath, lineNumber, line.trim());
        }
      });
    }
  }

  checkMathematicalErrors(line, filePath, lineNumber) {
    // Buscar operaciones matemáticas potencialmente problemáticas
    const mathPatterns = [
      /(\w+)\s*\+\s*\1/g,  // Suma consigo mismo (x + x)
      /(\w+)\s*\*\s*0/g,   // Multiplicación por cero
      /(\w+)\s*\/\s*0/g,   // División por cero
      /0\s*\/\s*(\w+)/g,   // División de cero
      /NaN/g,              // NaN en código
      /Infinity/g          // Infinity en código
    ];

    mathPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        if (pattern.source.includes('\\+\\s*\\1')) {
          this.addIssue('logic', 'high',
            'Posible error: suma de variable consigo mismo',
            filePath, lineNumber, line.trim());
        }
        if (pattern.source.includes('\\*\\s*0')) {
          this.addIssue('logic', 'medium',
            'Multiplicación por cero - verificar intención',
            filePath, lineNumber, line.trim());
        }
        if (pattern.source.includes('\\/\\s*0') || pattern.source.includes('0\\s*\\/')) {
          this.addIssue('logic', 'critical',
            'División por cero detectada',
            filePath, lineNumber, line.trim());
        }
        if (pattern.source.includes('NaN')) {
          this.addIssue('logic', 'high',
            'Uso de NaN en código - posible error matemático',
            filePath, lineNumber, line.trim());
        }
      }
    });
  }

  checkInconsistentFlows(line, filePath, lineNumber) {
    // Buscar flujos de ejecución problemáticos
    if (line.includes('return') && line.includes('if')) {
      this.addIssue('logic', 'medium',
        'Return dentro de condición if - verificar flujo',
        filePath, lineNumber, line.trim());
    }

    if (line.includes('throw') && !line.includes('new Error')) {
      this.addIssue('logic', 'medium',
        'Throw sin new Error()',
        filePath, lineNumber, line.trim());
    }

    // Buscar bucles potencialmente infinitos
    if (line.includes('while') && line.includes('true')) {
      this.addIssue('logic', 'high',
        'Bucle while(true) potencialmente infinito',
        filePath, lineNumber, line.trim());
    }

    // Buscar recursión sin condición de parada
    if (line.match(/\b\w+\s*\([^)]*\)\s*{/)) {
      const funcName = line.match(/function\s+(\w+)/)?.[1] ||
                      line.match(/const\s+(\w+)\s*=/)?.[1] ||
                      line.match(/(\w+)\s*\(/)?.[1];

      if (funcName && line.includes(funcName + '(')) {
        this.addIssue('logic', 'high',
          'Posible recursión infinita detectada',
          filePath, lineNumber, line.trim());
    }
  }
  }

  checkBusinessLogicErrors(line, filePath, lineNumber) {
    // Verificar reglas de negocio específicas de Rent360

    // Validaciones de montos
    if (line.includes('amount') || line.includes('monto')) {
      if (line.includes('< 0') || line.includes('<= 0')) {
        // Bien - valida montos positivos
      } else if (!line.includes('> 0') && !line.includes('>= 0')) {
        this.addIssue('logic', 'medium',
          'Monto sin validación de positividad',
          filePath, lineNumber, line.trim());
      }
    }

    // Validaciones de fechas
    if (line.includes('Date') && line.includes('new')) {
      if (line.includes('Invalid Date') || line.includes('isNaN')) {
        // Bien - valida fechas
      } else {
        this.addIssue('logic', 'low',
          'Fecha sin validación de validez',
          filePath, lineNumber, line.trim());
      }
    }

    // Validaciones KYC
    if (line.includes('kyc') || line.includes('KYC')) {
      if (!line.includes('verified') && !line.includes('status')) {
        this.addIssue('logic', 'medium',
          'Verificación KYC incompleta',
          filePath, lineNumber, line.trim());
      }
    }
  }

  checkFileStructure(content, filePath) {
    // Verificar estructura general del archivo

    // Contar funciones sin return
    const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    const asyncFunctions = content.match(/async\s+function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];

    functions.forEach(func => {
      if (!func.includes('return') && !func.includes('void') && !func.includes('Promise')) {
        this.addIssue('logic', 'low',
          'Función sin return explícito',
          filePath, 0, func.substring(0, 50) + '...');
      }
    });

    // Verificar imports no utilizados
    const imports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
    imports.forEach(importStmt => {
      const moduleName = importStmt.match(/from\s+['"]([^'"]+)['"]/)[1];
      if (!content.includes(moduleName.split('/').pop())) {
        this.addIssue('logic', 'low',
          'Import potencialmente no utilizado',
          filePath, 0, importStmt);
      }
    });
  }

  async findCommonLogicPatterns() {
    console.log('   🔍 Buscando patrones comunes de errores...');

    // Buscar archivos con patrones problemáticos
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Buscar console.log en producción
        if (content.includes('console.log') && !file.includes('test')) {
          this.addIssue('logic', 'medium',
            'console.log encontrado en código de producción',
            file, 0);
        }

        // Buscar TODO/FIXME comments
        const todoMatches = content.match(/\/\/\s*(TODO|FIXME|XXX)/gi);
        if (todoMatches) {
          this.addIssue('logic', 'low',
            `Comentarios TODO/FIXME encontrados: ${todoMatches.length}`,
            file, 0);
        }

        // Buscar código comentado
        const commentedCode = content.match(/^\s*\/\/\s*[a-zA-Z]/gm);
        if (commentedCode && commentedCode.length > 10) {
          this.addIssue('logic', 'low',
            'Código comentado extenso encontrado',
            file, 0);
        }

      } catch (error) {
        this.addIssue('logic', 'medium',
          `Error analizando archivo: ${error.message}`,
          file, 0);
      }
    }
  }

  async reviewCommunication() {
    console.log('   🔍 Analizando comunicación entre componentes...');

    // Verificar imports/exports
    await this.checkImportsExports();

    // Verificar llamadas API
    await this.checkAPICalls();

    // Verificar paso de parámetros
    await this.checkParameterPassing();

    // Verificar rutas
    await this.checkRoutes();
  }

  async checkImportsExports() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar imports relativos incorrectos
        const relativeImports = content.match(/from\s+['"](\.\.?[^'"]*)['"]/g) || [];
        relativeImports.forEach(importStmt => {
          const importPath = importStmt.match(/from\s+['"]([^'"]+)['"]/)[1];
          const fullImportPath = path.resolve(path.dirname(file), importPath);

          if (!fs.existsSync(fullImportPath + '.ts') &&
              !fs.existsSync(fullImportPath + '.tsx') &&
              !fs.existsSync(fullImportPath + '/index.ts') &&
              !fs.existsSync(fullImportPath + '/index.tsx') &&
              !fs.existsSync(fullImportPath)) {
            this.addIssue('communication', 'high',
              `Import no encontrado: ${importPath}`,
              file, 0, importStmt);
          }
        });

        // Verificar imports de node_modules faltantes
        const nodeModulesImports = content.match(/from\s+['"]([^'"\./][^'"]*)['"]/g) || [];
        // Nota: Esta verificación requeriría análisis más complejo

      } catch (error) {
        this.addIssue('communication', 'medium',
          `Error verificando imports: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkAPICalls() {
    const apiFiles = await this.findFilesWithPattern('src/app/api', '**/*.ts');

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar endpoints sin validación
        const handlers = content.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE)/g) || [];
        handlers.forEach(handler => {
          const handlerName = handler.match(/(GET|POST|PUT|DELETE)/)[1];
          const handlerCode = this.getHandlerCode(content, handlerName);

          if (!handlerCode.includes('validation') && !handlerCode.includes('schema')) {
            this.addIssue('communication', 'medium',
              `Endpoint ${handlerName} sin validación de entrada`,
              file, 0);
          }
        });

        // Verificar respuestas sin manejo de errores
        if (!content.includes('try') || !content.includes('catch')) {
          this.addIssue('communication', 'medium',
            'Endpoint sin manejo de errores try/catch',
            file, 0);
        }

      } catch (error) {
        this.addIssue('communication', 'medium',
          `Error analizando API: ${error.message}`,
          file, 0);
      }
    }
  }

  getHandlerCode(content, handlerName) {
    const lines = content.split('\n');
    let inHandler = false;
    let braceCount = 0;
    let handlerCode = '';

    for (const line of lines) {
      if (line.includes(`export`) && line.includes(handlerName)) {
        inHandler = true;
      }

      if (inHandler) {
        handlerCode += line + '\n';
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && inHandler) {
          break;
        }
      }
    }

    return handlerCode;
  }

  async checkParameterPassing() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar funciones con muchos parámetros
        const functions = content.match(/function\s+\w+\s*\(([^)]*)\)/g) || [];
        functions.forEach(func => {
          const params = func.match(/\(([^)]*)\)/)[1];
          const paramCount = params.split(',').length;

          if (paramCount > 5) {
            this.addIssue('communication', 'low',
              `Función con muchos parámetros (${paramCount}) - considerar objeto`,
              file, 0, func);
          }
        });

        // Verificar llamadas a funciones con parámetros undefined
        const calls = content.match(/\w+\s*\([^)]*undefined[^)]*\)/g);
        if (calls) {
          this.addIssue('communication', 'medium',
            'Llamada a función con parámetro undefined',
            file, 0, calls[0]);
        }

      } catch (error) {
        this.addIssue('communication', 'low',
          `Error analizando parámetros: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkRoutes() {
    // Verificar archivos de rutas Next.js
    const routeFiles = await this.findFilesWithPattern('src/app', '**/*.tsx');

    for (const file of routeFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar rutas dinámicas sin validación
        if (file.includes('[id]') || file.includes('[slug]')) {
          const routeParam = file.includes('[id]') ? 'id' : 'slug';

          if (!content.includes(routeParam) && !content.includes('params')) {
            this.addIssue('communication', 'medium',
              `Ruta dinámica sin usar parámetro ${routeParam}`,
              file, 0);
          }
        }

        // Verificar páginas sin metadata
        if (!content.includes('metadata') && !content.includes('generateMetadata')) {
          this.addIssue('communication', 'low',
            'Página sin metadata SEO',
            file, 0);
        }

      } catch (error) {
        this.addIssue('communication', 'low',
          `Error analizando ruta: ${error.message}`,
          file, 0);
      }
    }
  }

  async reviewIncompleteFeatures() {
    console.log('   🔍 Analizando funcionalidades incompletas...');

    // Verificar archivos con implementación parcial
    await this.checkPartialImplementations();

    // Verificar componentes sin funcionalidad
    await this.checkEmptyComponents();

    // Verificar APIs sin implementación
    await this.checkIncompleteAPIs();

    // Verificar TODOs y placeholders
    await this.checkPlaceholders();
  }

  async checkPartialImplementations() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Buscar funciones con solo return o throw
        const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
        functions.forEach(func => {
          if (func.includes('return null') ||
              func.includes('return undefined') ||
              func.includes('throw new Error') && func.length < 100) {
            this.addIssue('incomplete', 'medium',
              'Función con implementación mínima',
              file, 0, func.substring(0, 50) + '...');
          }
        });

        // Buscar métodos sin implementación
        if (content.includes('// TODO: Implement')) {
          this.addIssue('incomplete', 'medium',
            'Método marcado para implementar',
            file, 0);
        }

      } catch (error) {
        this.addIssue('incomplete', 'low',
          `Error analizando implementación: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkEmptyComponents() {
    const componentFiles = await this.findFilesWithPattern('src/components', '**/*.tsx');

    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Componentes muy pequeños
        if (content.length < 200) {
          this.addIssue('incomplete', 'low',
            'Componente muy pequeño - posible implementación incompleta',
            file, 0);
        }

        // Componentes sin JSX
        if (!content.includes('return') || !content.includes('<')) {
          this.addIssue('incomplete', 'medium',
            'Componente sin JSX retornado',
            file, 0);
        }

        // Componentes sin props
        if (!content.includes('props') && !content.includes('interface') && content.includes('export default function')) {
          this.addIssue('incomplete', 'low',
            'Componente sin props definidas',
            file, 0);
        }

      } catch (error) {
        this.addIssue('incomplete', 'low',
          `Error analizando componente: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkIncompleteAPIs() {
    const apiFiles = await this.findFilesWithPattern('src/app/api', '**/*.ts');

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // APIs sin implementación real
        if (content.includes('return NextResponse.json({ message:') ||
            content.includes('return { success: false') ||
            content.length < 300) {
          this.addIssue('incomplete', 'medium',
            'API con implementación básica',
            file, 0);
        }

        // APIs sin validación de autenticación
        if (!content.includes('auth') && !content.includes('verify') && !content.includes('token')) {
          this.addIssue('incomplete', 'high',
            'API sin verificación de autenticación',
            file, 0);
        }

      } catch (error) {
        this.addIssue('incomplete', 'low',
          `Error analizando API: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkPlaceholders() {
    const files = await this.getAllSourceFiles();

    const placeholderPatterns = [
      /\/\/\s*TODO/i,
      /\/\/\s*FIXME/i,
      /\/\/\s*IMPLEMENT/i,
      /console\.log/i,
      /throw new Error\('Not implemented'\)/i,
      /return null\s*\/\//i,
      /return undefined\s*\/\//i
    ];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        placeholderPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.addIssue('incomplete', 'medium',
              `Código placeholder encontrado: ${pattern}`,
              file, 0);
          }
        });

      } catch (error) {
        this.addIssue('incomplete', 'low',
          `Error buscando placeholders: ${error.message}`,
          file, 0);
        }
    }
  }

  async reviewFunctionalityErrors() {
    console.log('   🔍 Analizando errores de funcionamiento...');

    // Verificar formularios
    await this.checkForms();

    // Verificar manejo de errores
    await this.checkErrorHandling();

    // Verificar estados de aplicación
    await this.checkApplicationStates();

    // Verificar operaciones CRUD
    await this.checkCRUDOperations();
  }

  async checkForms() {
    const componentFiles = await this.findFilesWithPattern('src/components', '**/*.tsx');

    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Formularios sin validación
        if (content.includes('<form') || content.includes('onSubmit')) {
          if (!content.includes('validation') && !content.includes('schema') && !content.includes('zod')) {
            this.addIssue('functionality', 'medium',
              'Formulario sin validación',
              file, 0);
          }
        }

        // Inputs sin labels o placeholders
        const inputs = content.match(/<input[^>]*>/g) || [];
        inputs.forEach(input => {
          if (!input.includes('placeholder') && !input.includes('aria-label')) {
            this.addIssue('functionality', 'low',
              'Input sin placeholder o label accesible',
              file, 0, input);
          }
        });

      } catch (error) {
        this.addIssue('functionality', 'low',
          `Error analizando formularios: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkErrorHandling() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Funciones async sin try/catch
        const asyncFunctions = content.match(/async\s+(function|\w+)\s*\(/g) || [];
        asyncFunctions.forEach(func => {
          const funcName = func.match(/async\s+(function|\w+)\s*\(/)[1];
          const funcCode = this.getFunctionCode(content, funcName);

          if (!funcCode.includes('try') || !funcCode.includes('catch')) {
            this.addIssue('functionality', 'medium',
              `Función async sin manejo de errores: ${funcName}`,
              file, 0);
          }
        });

        // Promesas sin manejo de errores
        const promises = content.match(/\.then\(|\.catch\(/g);
        if (promises && promises.length % 2 !== 0) {
          this.addIssue('functionality', 'medium',
            'Promesas sin manejo completo de errores',
            file, 0);
        }

      } catch (error) {
        this.addIssue('functionality', 'low',
          `Error analizando manejo de errores: ${error.message}`,
          file, 0);
      }
    }
  }

  getFunctionCode(content, funcName) {
    const lines = content.split('\n');
    let inFunction = false;
    let braceCount = 0;
    let functionCode = '';

    for (const line of lines) {
      if ((line.includes(`function ${funcName}`) ||
           line.includes(`${funcName}(`) ||
           line.includes(`${funcName} =`)) &&
          line.includes('{')) {
        inFunction = true;
      }

      if (inFunction) {
        functionCode += line + '\n';
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && inFunction) {
          break;
        }
      }
    }

    return functionCode;
  }

  async checkApplicationStates() {
    const componentFiles = await this.findFilesWithPattern('src/components', '**/*.tsx');

    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Estados de carga sin manejo
        if (content.includes('loading') || content.includes('isLoading')) {
          if (!content.includes('Loading') && !content.includes('Spinner')) {
            this.addIssue('functionality', 'low',
              'Estado de carga sin indicador visual',
              file, 0);
          }
        }

        // Estados de error sin manejo
        if (content.includes('error') || content.includes('Error')) {
          if (!content.includes('ErrorMessage') && !content.includes('error.message')) {
            this.addIssue('functionality', 'medium',
              'Estado de error sin manejo visual',
              file, 0);
          }
        }

        // Estados vacíos sin manejo
        if (content.includes('length === 0') || content.includes('length == 0')) {
          if (!content.includes('No data') && !content.includes('Empty')) {
            this.addIssue('functionality', 'low',
              'Estado vacío sin mensaje',
              file, 0);
          }
        }

      } catch (error) {
        this.addIssue('functionality', 'low',
          `Error analizando estados: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkCRUDOperations() {
    const apiFiles = await this.findFilesWithPattern('src/app/api', '**/*.ts');

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar operaciones CRUD completas
        const operations = [];
        if (content.includes('export') && content.includes('GET')) operations.push('READ');
        if (content.includes('export') && content.includes('POST')) operations.push('CREATE');
        if (content.includes('export') && content.includes('PUT')) operations.push('UPDATE');
        if (content.includes('export') && content.includes('DELETE')) operations.push('DELETE');

        if (operations.length > 0 && operations.length < 4) {
          this.addIssue('functionality', 'low',
            `CRUD incompleto - faltan: ${['CREATE', 'READ', 'UPDATE', 'DELETE'].filter(op => !operations.includes(op)).join(', ')}`,
            file, 0);
        }

        // Verificar validaciones en operaciones de escritura
        if (operations.includes('CREATE') || operations.includes('UPDATE')) {
          if (!content.includes('validation') && !content.includes('schema')) {
            this.addIssue('functionality', 'medium',
              'Operación de escritura sin validación',
              file, 0);
          }
        }

      } catch (error) {
        this.addIssue('functionality', 'low',
          `Error analizando CRUD: ${error.message}`,
          file, 0);
      }
    }
  }

  async reviewCriticalAspects() {
    console.log('   🔍 Analizando aspectos críticos...');

    // Verificar dependencias
    await this.checkDependencies();

    // Verificar configuraciones
    await this.checkConfigurations();

    // Verificar problemas de seguridad
    await this.checkSecurityIssues();

    // Verificar código comentado
    await this.checkCommentedCode();
  }

  async checkDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));

      // Verificar dependencias críticas
      const criticalDeps = [
        'next',
        'react',
        'prisma',
        '@prisma/client',
        'bcryptjs',
        'jsonwebtoken'
      ];

      criticalDeps.forEach(dep => {
        if (!packageJson.dependencies[dep]) {
          this.addIssue('critical', 'high',
            `Dependencia crítica faltante: ${dep}`,
            'package.json', 0);
        }
      });

      // Verificar versiones problemáticas
      Object.entries(packageJson.dependencies).forEach(([dep, version]) => {
        if (version.includes('^0.') || version.includes('~0.')) {
          this.addIssue('critical', 'medium',
            `Dependencia inestable: ${dep}@${version}`,
            'package.json', 0);
        }
      });

    } catch (error) {
      this.addIssue('critical', 'high',
        `Error analizando dependencias: ${error.message}`,
        'package.json', 0);
    }
  }

  async checkConfigurations() {
    const configFiles = [
      '.env.example',
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.ts',
      'jest.config.full.js'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.addIssue('critical', 'high',
          `Archivo de configuración faltante: ${file}`,
          file, 0);
      }
    });

    // Verificar configuraciones específicas
    try {
      const nextConfig = fs.readFileSync(path.join(this.projectRoot, 'next.config.js'), 'utf8');
      if (!nextConfig.includes('experimental')) {
        this.addIssue('critical', 'low',
          'Next.js sin configuración experimental',
          'next.config.js', 0);
      }
    } catch (error) {
      this.addIssue('critical', 'medium',
        `Error verificando configuración: ${error.message}`,
        'next.config.js', 0);
    }
  }

  async checkSecurityIssues() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar exposición de datos sensibles
        const sensitivePatterns = [
          /password\s*=\s*['"][^'"]*['"]/i,
          /secret\s*=\s*['"][^'"]*['"]/i,
          /token\s*=\s*['"][^'"]*['"]/i,
          /api[_-]?key\s*=\s*['"][^'"]*['"]/i
        ];

        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.addIssue('critical', 'critical',
              'Posible exposición de datos sensibles en código',
              file, 0, matches[0]);
          }
        });

        // Verificar SQL injection
        if (content.includes('db.$queryRaw') || content.includes('db.executeRaw')) {
          if (!content.includes('placeholder') && !content.includes('bind')) {
            this.addIssue('critical', 'high',
              'Consulta SQL sin parámetros preparados',
              file, 0);
          }
        }

        // Verificar XSS
        if (content.includes('dangerouslySetInnerHTML')) {
          this.addIssue('critical', 'high',
            'Uso de dangerouslySetInnerHTML - riesgo XSS',
            file, 0);
        }

      } catch (error) {
        this.addIssue('critical', 'low',
          `Error analizando seguridad: ${error.message}`,
          file, 0);
      }
    }
  }

  async checkCommentedCode() {
    const files = await this.getAllSourceFiles();

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        // Contar líneas comentadas vs código
        let commentedLines = 0;
        let codeLines = 0;

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            commentedLines++;
          } else if (trimmed && !trimmed.startsWith('*') && !trimmed.startsWith('*/')) {
            codeLines++;
          }
        });

        const commentRatio = commentedLines / (commentedLines + codeLines);

        if (commentRatio > 0.3) {
          this.addIssue('critical', 'low',
            `Archivo con alta proporción de comentarios: ${(commentRatio * 100).toFixed(1)}%`,
            file, 0);
        }

        // Buscar bloques grandes de código comentado
        const commentedBlocks = content.match(/\/\*[\s\S]*?\*\//g) || [];
        commentedBlocks.forEach(block => {
          if (block.split('\n').length > 10) {
            this.addIssue('critical', 'medium',
              'Bloque grande de código comentado encontrado',
              file, 0);
          }
        });

      } catch (error) {
        this.addIssue('critical', 'low',
          `Error analizando comentarios: ${error.message}`,
          file, 0);
      }
    }
  }

  async getAllSourceFiles() {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'scripts/**/*.js',
      'scripts/**/*.ts'
    ];

    const files = [];
    for (const pattern of patterns) {
      try {
        const result = execSync(`find ${this.projectRoot} -name "${pattern.split('/').pop()}" -type f`, {
          encoding: 'utf8',
          cwd: this.projectRoot
        });
        files.push(...result.trim().split('\n').filter(Boolean));
      } catch (error) {
        // Ignorar errores de find
      }
    }

    return [...new Set(files)]; // Eliminar duplicados
  }

  async findFilesWithPattern(basePath, pattern) {
    try {
      const result = execSync(`find ${path.join(this.projectRoot, basePath)} -name "${pattern.split('/').pop()}" -type f`, {
        encoding: 'utf8',
        cwd: this.projectRoot
      });
      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  addIssue(category, severity, description, filePath, lineNumber, codeSnippet = '') {
    this.issues[category].push({
      severity,
      description,
      file: filePath,
      line: lineNumber,
      code: codeSnippet,
      timestamp: new Date().toISOString()
    });

    this.stats.issuesFound++;
    this.stats.severityCounts[severity] = (this.stats.severityCounts[severity] || 0) + 1;
  }

  generateFinalReport() {
    const totalIssues = this.stats.issuesFound;

    console.log('\n📋 REPORTE FINAL DE REVISIÓN 360°');
    console.log('='.repeat(80));
    console.log(`📊 Archivos analizados: ${this.stats.filesAnalyzed}`);
    console.log(`📝 Líneas totales: ${this.stats.totalLines.toLocaleString()}`);
    console.log(`🔍 Problemas encontrados: ${totalIssues}`);
    console.log('');

    // Resumen por severidad
    console.log('📊 PROBLEMAS POR SEVERIDAD:');
    console.log(`   🔴 Críticos: ${this.stats.severityCounts.critical || 0}`);
    console.log(`   🟠 Altos: ${this.stats.severityCounts.high || 0}`);
    console.log(`   🟡 Medios: ${this.stats.severityCounts.medium || 0}`);
    console.log(`   🟢 Bajos: ${this.stats.severityCounts.low || 0}`);
    console.log('');

    // Resumen por categoría
    console.log('📂 PROBLEMAS POR CATEGORÍA:');
    Object.entries(this.issues).forEach(([category, issues]) => {
      const count = issues.length;
      const critical = issues.filter(i => i.severity === 'critical').length;
      const high = issues.filter(i => i.severity === 'high').length;

      console.log(`   ${this.getCategoryIcon(category)} ${category}: ${count} (${critical} críticos, ${high} altos)`);
    });
    console.log('');

    // Top 10 problemas más críticos
    this.showTopIssues();

    // Recomendaciones
    this.showRecommendations();

    // Guardar reporte completo
    this.saveDetailedReport();
  }

  getCategoryIcon(category) {
    const icons = {
      logic: '🧠',
      communication: '📡',
      incomplete: '🔧',
      functionality: '⚙️',
      critical: '🚨'
    };
    return icons[category] || '❓';
  }

  showTopIssues() {
    console.log('🔥 TOP 10 PROBLEMAS MÁS CRÍTICOS:');

    const allIssues = Object.values(this.issues).flat();
    const sortedIssues = allIssues
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);

    sortedIssues.forEach((issue, index) => {
      const severityIcon = this.getSeverityIcon(issue.severity);
      console.log(`   ${index + 1}. ${severityIcon} ${issue.description}`);
      console.log(`      📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      if (issue.code) {
        console.log(`      💻 ${issue.code.substring(0, 60)}${issue.code.length > 60 ? '...' : ''}`);
      }
      console.log('');
    });
  }

  getSeverityIcon(severity) {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '❓';
  }

  showRecommendations() {
    console.log('💡 RECOMENDACIONES DE CORRECCIÓN:');

    const criticalCount = this.stats.severityCounts.critical || 0;
    const highCount = this.stats.severityCounts.high || 0;

    if (criticalCount > 0) {
      console.log('   🚨 PRIORIDAD CRÍTICA:');
      console.log('      • Corregir todos los problemas críticos inmediatamente');
      console.log('      • No hacer deploy hasta resolver problemas de seguridad');
      console.log('      • Revisar dependencias faltantes o versiones problemáticas');
      console.log('');
    }

    if (highCount > 0) {
      console.log('   🟠 PRIORIDAD ALTA:');
      console.log('      • Resolver problemas de comunicación entre componentes');
      console.log('      • Implementar validaciones faltantes');
      console.log('      • Completar funcionalidades críticas');
      console.log('');
    }

    console.log('   📋 ACCIONES RECOMENDADAS:');
    console.log('      • Ejecutar tests completos: npm run test:full-suite');
    console.log('      • Configurar hooks de Git: npm run setup-hooks');
    console.log('      • Revisar cobertura: npm run test:coverage');
    console.log('      • Limpiar código comentado y TODOs');
    console.log('      • Implementar manejo de errores consistente');
    console.log('      • Agregar validaciones a formularios');
    console.log('');

    // Calificación general
    const overallScore = this.calculateOverallScore();
    console.log('🎯 CALIFICACIÓN GENERAL:');
    console.log(`   • Puntaje: ${overallScore}/100`);
    console.log(`   • Nivel: ${this.getQualityLevel(overallScore)}`);
    console.log('');
  }

  calculateOverallScore() {
    const totalIssues = this.stats.issuesFound;
    const criticalIssues = this.stats.severityCounts.critical || 0;
    const highIssues = this.stats.severityCounts.high || 0;

    // Base score
    let score = 100;

    // Penalizaciones por severidad
    score -= criticalIssues * 15;  // -15 por crítico
    score -= highIssues * 8;       // -8 por alto
    score -= (this.stats.severityCounts.medium || 0) * 4;  // -4 por medio
    score -= (this.stats.severityCounts.low || 0) * 2;     // -2 por bajo

    // Penalización por cantidad total
    if (totalIssues > 50) score -= 10;
    else if (totalIssues > 25) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  getQualityLevel(score) {
    if (score >= 90) return '🏆 EXCELENTE';
    if (score >= 80) return '🎯 MUY BUENO';
    if (score >= 70) return '✅ BUENO';
    if (score >= 60) return '⚠️ ACEPTABLE';
    if (score >= 50) return '🟡 REQUIERE MEJORA';
    return '🔴 CRÍTICO - REVISIÓN URGENTE';
  }

  saveDetailedReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - (this.startTime || Date.now()),
        version: '1.0',
        analyzer: 'Rent360 System Review 360°'
      },
      statistics: this.stats,
      issues: this.issues,
      overallScore: this.calculateOverallScore(),
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.projectRoot, 'system-review-report-360.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Reporte detallado guardado: ${reportPath}`);
    console.log('');
  }

  generateRecommendations() {
    return {
      critical: [
        'Resolver todos los problemas críticos antes del próximo deploy',
        'Implementar validaciones de seguridad faltantes',
        'Corregir dependencias faltantes o versiones problemáticas',
        'Revisar configuraciones incompletas'
      ],
      high: [
        'Completar funcionalidades parcialmente implementadas',
        'Resolver problemas de comunicación entre componentes',
        'Implementar manejo de errores consistente',
        'Agregar validaciones a formularios y APIs'
      ],
      medium: [
        'Limpiar código comentado y TODOs',
        'Optimizar funciones con muchos parámetros',
        'Implementar metadata en páginas faltantes',
        'Agregar indicadores de carga y error'
      ],
      low: [
        'Mejorar documentación de código',
        'Optimizar imports no utilizados',
        'Agregar labels accesibles a inputs',
        'Implementar estados vacíos en listas'
      ]
    };
  }

  generateErrorReport() {
    console.log('\n❌ REPORTE DE ERRORES DE ANÁLISIS:');
    console.log('='.repeat(50));

    if (this.issues.logic.length > 0) {
      console.log('Errores de lógica encontrados:', this.issues.logic.length);
    }

    if (this.issues.communication.length > 0) {
      console.log('Problemas de comunicación:', this.issues.communication.length);
    }

    if (this.issues.incomplete.length > 0) {
      console.log('Funcionalidades incompletas:', this.issues.incomplete.length);
    }

    if (this.issues.functionality.length > 0) {
      console.log('Errores de funcionamiento:', this.issues.functionality.length);
    }

    if (this.issues.critical.length > 0) {
      console.log('Problemas críticos:', this.issues.critical.length);
    }

    console.log('\n💡 Consulte el archivo system-review-report-360.json para detalles completos');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const reviewer = new SystemReview360();
  reviewer.runCompleteReview().catch(error => {
    console.error('Error fatal en revisión:', error);
    process.exit(1);
  });
}

module.exports = { SystemReview360 };
