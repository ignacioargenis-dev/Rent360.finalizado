#!/usr/bin/env node

/**
 * Script de Revisión Completa del Sistema Rent360
 * Análisis del 100% de archivos siguiendo metodología sistemática
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemReviewer {
  constructor() {
    this.findings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };

    this.stats = {
      filesAnalyzed: 0,
      totalLines: 0,
      functionsFound: 0,
      apisFound: 0,
      componentsFound: 0
    };

    this.projectRoot = path.resolve(__dirname, '..');
  }

  async runCompleteReview() {
    console.log('🔍 INICIANDO REVISIÓN COMPLETA DEL SISTEMA RENT360');
    console.log('=' .repeat(60));
    console.log(`📁 Directorio raíz: ${this.projectRoot}`);
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    try {
      // 1. Análisis de estructura del proyecto
      await this.analyzeProjectStructure();

      // 2. Revisión de lógica de negocio
      await this.reviewBusinessLogic();

      // 3. Revisión de comunicación entre componentes
      await this.reviewComponentCommunication();

      // 4. Revisión de funcionalidades
      await this.reviewFunctionalityCompleteness();

      // 5. Revisión de manejo de errores
      await this.reviewErrorHandling();

      // 6. Revisión de aspectos críticos
      await this.reviewCriticalAspects();

      // 7. Generar informe final
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Error durante la revisión:', error);
      this.addFinding('critical', 'SYSTEM_REVIEW', 'Error fatal en proceso de revisión', error.message);
    }
  }

  async analyzeProjectStructure() {
    console.log('📊 PASO 1: ANÁLISIS DE ESTRUCTURA DEL PROYECTO');
    console.log('-'.repeat(50));

    const structure = {
      src: this.countFiles('src'),
      scripts: this.countFiles('scripts'),
      tests: this.countFiles('tests'),
      config: this.countConfigFiles()
    };

    console.log(`📁 Archivos en src/: ${structure.src}`);
    console.log(`📜 Scripts: ${structure.scripts}`);
    console.log(`🧪 Tests: ${structure.tests}`);
    console.log(`⚙️ Archivos de configuración: ${structure.config}`);
    console.log('');
  }

  countFiles(dir) {
    try {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) return 0;

      const files = fs.readdirSync(fullPath, { recursive: true });
      return files.filter(file => {
        const ext = path.extname(file);
        return ['.ts', '.tsx', '.js', '.jsx', '.json'].includes(ext);
      }).length;
    } catch (error) {
      return 0;
    }
  }

  countConfigFiles() {
    const configFiles = [
      'package.json', 'tsconfig.json', 'next.config.js',
      'jest.config.js', 'tailwind.config.ts', 'env.example'
    ];

    return configFiles.filter(file => {
      return fs.existsSync(path.join(this.projectRoot, file));
    }).length;
  }

  async reviewBusinessLogic() {
    console.log('🧠 PASO 2: REVISIÓN DE LÓGICA DE NEGOCIO');
    console.log('-'.repeat(50));

    // Revisar archivos de lógica de negocio
    const businessLogicFiles = [
      'src/lib/payout-service.ts',
      'src/lib/commission-service.ts',
      'src/lib/kyc-service.ts',
      'src/lib/fraud-detection.ts',
      'src/lib/bank-account-service.ts'
    ];

    for (const file of businessLogicFiles) {
      await this.analyzeBusinessLogicFile(file);
    }

    // Revisar servicios principales
    await this.analyzeServiceFiles();
    console.log('');
  }

  async analyzeBusinessLogicFile(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        this.addFinding('high', 'MISSING_FILE', `Archivo de lógica de negocio faltante: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      console.log(`📄 Analizando: ${filePath} (${lines.length} líneas)`);

      // Revisar lógica de cálculos
      this.reviewCalculationLogic(content, filePath);

      // Revisar condiciones y bucles
      this.reviewConditionalLogic(content, filePath);

      // Revisar algoritmos
      this.reviewAlgorithmLogic(content, filePath);

      this.stats.filesAnalyzed++;
      this.stats.totalLines += lines.length;

    } catch (error) {
      this.addFinding('high', 'FILE_READ_ERROR', `Error leyendo archivo: ${filePath}`, error.message);
    }
  }

  reviewCalculationLogic(content, filePath) {
    // Buscar patrones de cálculos potencialmente problemáticos
    const calculationPatterns = [
      /\$(\w+)\s*[\+\-\*\/]\s*\$(\w+)/g, // Variables con $
      /(\w+)\s*\*\s*0\./g, // Multiplicación por decimal
      /Math\.round\([^)]*\*100\)/g, // Rounding de centavos
      /parseFloat\([^)]*\)\s*\*\s*100/g // Conversión a centavos
    ];

    calculationPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        this.addFinding('medium', 'CALCULATION_PATTERN',
          `Patrón de cálculo encontrado en ${filePath}`,
          `Encontrados ${matches.length} cálculos que requieren revisión manual`
        );
      }
    });

    // Revisar cálculos de comisiones y porcentajes
    if (content.includes('commission') || content.includes('percentage')) {
      if (!content.includes('Math.max') && !content.includes('Math.min')) {
        this.addFinding('medium', 'COMMISSION_CALCULATION',
          `Cálculo de comisión sin validación de límites en ${filePath}`,
          'Considerar agregar validaciones de rango mínimo/máximo'
        );
      }
    }
  }

  reviewConditionalLogic(content, filePath) {
    // Buscar condicionales complejos
    const complexConditions = content.match(/if\s*\([^)]{100,}\)/g);
    if (complexConditions && complexConditions.length > 0) {
      this.addFinding('medium', 'COMPLEX_CONDITION',
        `Condición compleja encontrada en ${filePath}`,
        `Se encontraron ${complexConditions.length} condiciones que podrían simplificarse`
      );
    }

    // Buscar switch statements sin default
    if (content.includes('switch') && !content.includes('default:')) {
      this.addFinding('low', 'MISSING_DEFAULT',
        `Switch sin caso default en ${filePath}`,
        'Agregar caso default para manejo de valores inesperados'
      );
    }

    // Buscar bucles sin validación de límites
    const infiniteLoopPatterns = [
      /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/g,
      /while\s*\(\s*true\s*\)/g
    ];

    infiniteLoopPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        this.addFinding('high', 'POTENTIAL_INFINITE_LOOP',
          `Bucle potencialmente infinito en ${filePath}`,
          'Revisar límites y condiciones de salida'
        );
      }
    });
  }

  reviewAlgorithmLogic(content, filePath) {
    // Revisar algoritmos de ML y detección de fraude
    if (filePath.includes('fraud-detection')) {
      if (!content.includes('confidence') || !content.includes('threshold')) {
        this.addFinding('high', 'ML_ALGORITHM_INCOMPLETE',
          `Algoritmo de ML incompleto en ${filePath}`,
          'Faltan validaciones de confianza y umbrales'
        );
      }
    }

    // Revisar algoritmos de cálculo de comisiones
    if (filePath.includes('commission-service')) {
      const requiredMethods = ['calculateCommission', 'validateCommission'];
      requiredMethods.forEach(method => {
        if (!content.includes(method)) {
          this.addFinding('high', 'MISSING_BUSINESS_METHOD',
            `Método de negocio faltante: ${method} en ${filePath}`
          );
        }
      });
    }
  }

  async analyzeServiceFiles() {
    // Revisar servicios principales
    const serviceFiles = [
      'src/lib/auth.ts',
      'src/lib/db.ts',
      'src/lib/logger.ts'
    ];

    for (const file of serviceFiles) {
      await this.analyzeServiceFile(file);
    }
  }

  async analyzeServiceFile(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      if (!fs.existsSync(fullPath)) return;

      const content = fs.readFileSync(fullPath, 'utf8');

      // Revisar configuración de base de datos
      if (filePath.includes('db')) {
        this.reviewDatabaseConfiguration(content, filePath);
      }

      // Revisar configuración de autenticación
      if (filePath.includes('auth')) {
        this.reviewAuthConfiguration(content, filePath);
      }

      // Revisar configuración de logging
      if (filePath.includes('logger')) {
        this.reviewLoggerConfiguration(content, filePath);
      }

    } catch (error) {
      this.addFinding('medium', 'SERVICE_ANALYSIS_ERROR',
        `Error analizando servicio: ${filePath}`, error.message);
    }
  }

  reviewDatabaseConfiguration(content, filePath) {
    // Verificar configuración de Prisma
    if (!content.includes('PrismaClient')) {
      this.addFinding('high', 'MISSING_PRISMA_CLIENT',
        'Configuración de Prisma incompleta', 'Verificar inicialización del cliente');
    }

    // Verificar manejo de conexiones
    if (!content.includes('disconnect') && !content.includes('$disconnect')) {
      this.addFinding('medium', 'MISSING_DB_DISCONNECT',
        'Falta manejo de desconexión de BD', 'Agregar manejo adecuado de conexiones');
    }
  }

  reviewAuthConfiguration(content, filePath) {
    // Verificar JWT configuration
    if (content.includes('jwt') && !content.includes('expiresIn')) {
      this.addFinding('medium', 'JWT_CONFIG_INCOMPLETE',
        'Configuración JWT incompleta', 'Verificar expiración de tokens');
    }

    // Verificar hashing de contraseñas
    if (content.includes('password') && !content.includes('bcrypt')) {
      this.addFinding('high', 'MISSING_PASSWORD_HASHING',
        'Falta hashing de contraseñas', 'Implementar bcrypt para seguridad');
    }
  }

  reviewLoggerConfiguration(content, filePath) {
    // Verificar niveles de logging
    const logLevels = ['error', 'warn', 'info', 'debug'];
    const missingLevels = logLevels.filter(level => !content.includes(level));

    if (missingLevels.length > 0) {
      this.addFinding('low', 'INCOMPLETE_LOG_LEVELS',
        `Niveles de log faltantes: ${missingLevels.join(', ')}`,
        'Considerar agregar todos los niveles de logging');
    }
  }

  async reviewComponentCommunication() {
    console.log('🔗 PASO 3: REVISIÓN DE COMUNICACIÓN ENTRE COMPONENTES');
    console.log('-'.repeat(50));

    // Revisar imports/exports
    await this.reviewImportsExports();

    // Revisar llamadas a APIs
    await this.reviewApiCalls();

    // Revisar comunicación entre servicios
    await this.reviewServiceCommunication();

    console.log('');
  }

  async reviewImportsExports() {
    console.log('📦 Revisando imports/exports...');

    // Buscar archivos con imports problemáticos
    const importPatterns = [
      /import.*from\s*['"`]\.\.[^'"]*['"`]/g, // Imports relativos complejos
      /import.*from\s*['"`]@\/[^'"]*['"`]/g, // Path aliases
    ];

    const files = this.getAllSourceFiles();
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        importPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && matches.length > 3) { // Más de 3 imports complejos
            this.addFinding('low', 'COMPLEX_IMPORTS',
              `Imports complejos en ${file}`,
              `${matches.length} imports que podrían simplificarse`);
          }
        });

      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  async reviewApiCalls() {
    console.log('🌐 Revisando llamadas a APIs...');

    const apiFiles = this.getApiFiles();
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar manejo de errores en APIs
        if (!content.includes('try') || !content.includes('catch')) {
          this.addFinding('high', 'MISSING_API_ERROR_HANDLING',
            `API sin manejo de errores: ${file}`,
            'Agregar try/catch en todos los endpoints');
        }

        // Verificar validación de entrada
        if (!content.includes('zod') && !content.includes('validate')) {
          this.addFinding('medium', 'MISSING_INPUT_VALIDATION',
            `API sin validación de entrada: ${file}`,
            'Considerar usar Zod para validación');
        }

        this.stats.apisFound++;

      } catch (error) {
        this.addFinding('medium', 'API_FILE_READ_ERROR',
          `Error leyendo archivo API: ${file}`, error.message);
      }
    }
  }

  async reviewServiceCommunication() {
    console.log('🔄 Revisando comunicación entre servicios...');

    // Revisar llamadas entre servicios
    const serviceFiles = [
      'src/lib/payout-service.ts',
      'src/lib/commission-service.ts',
      'src/lib/notification-service.ts'
    ];

    for (const file of serviceFiles) {
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');

        // Verificar dependencias circulares
        const imports = content.match(/import.*from\s*['"`][^'"]*['"`]/g) || [];
        const circularDeps = imports.filter(imp =>
          imp.includes('commission-service') && file.includes('payout-service') ||
          imp.includes('payout-service') && file.includes('commission-service')
        );

        if (circularDeps.length > 0) {
          this.addFinding('high', 'CIRCULAR_DEPENDENCY',
            `Dependencia circular detectada en ${file}`,
            'Refactorizar para eliminar dependencia circular');
        }

      } catch (error) {
        // Ignorar errores de archivos faltantes
      }
    }
  }

  async reviewFunctionalityCompleteness() {
    console.log('⚙️ PASO 4: REVISIÓN DE FUNCIONALIDADES INCOMPLETAS');
    console.log('-'.repeat(50));

    await this.reviewUiCompleteness();
    await this.reviewApiCompleteness();
    await this.reviewBusinessLogicCompleteness();

    console.log('');
  }

  async reviewUiCompleteness() {
    console.log('🖥️ Revisando completitud de UI...');

    const uiFiles = this.getUiFiles();
    for (const file of uiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar componentes sin funcionalidad
        if (content.includes('TODO') || content.includes('FIXME') || content.includes('HACK')) {
          this.addFinding('medium', 'INCOMPLETE_COMPONENT',
            `Componente con TODO/FIXME en ${file}`,
            'Revisar y completar implementación');
        }

        // Verificar botones sin handlers
        if (content.includes('onClick={') && content.includes('onClick={() => {}}')) {
          this.addFinding('low', 'EMPTY_CLICK_HANDLER',
            `Handler vacío en ${file}`,
            'Implementar funcionalidad del botón');
        }

        this.stats.componentsFound++;

      } catch (error) {
        this.addFinding('low', 'UI_FILE_READ_ERROR',
          `Error leyendo componente: ${file}`, error.message);
      }
    }
  }

  async reviewApiCompleteness() {
    console.log('🔌 Revisando completitud de APIs...');

    const apiFiles = this.getApiFiles();
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar endpoints sin implementación completa
        if (content.includes('return NextResponse.json({ error:') &&
            !content.includes('return NextResponse.json({ success:')) {
          this.addFinding('medium', 'INCOMPLETE_API_ENDPOINT',
            `Endpoint con solo manejo de error en ${file}`,
            'Implementar respuesta de éxito');
        }

        // Verificar documentación faltante
        if (!content.includes('/**') || !content.includes('*/')) {
          this.addFinding('low', 'MISSING_API_DOCS',
            `API sin documentación: ${file}`,
            'Agregar JSDoc al endpoint');
        }

      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  async reviewBusinessLogicCompleteness() {
    console.log('💼 Revisando completitud de lógica de negocio...');

    // Verificar reglas de negocio implementadas
    const businessRules = {
      'commission-calculation': {
        required: ['baseCommission', 'bonusCalculation', 'deductionCalculation'],
        file: 'src/lib/commission-service.ts'
      },
      'payout-processing': {
        required: ['accountVerification', 'fundsTransfer', 'notification'],
        file: 'src/lib/payout-service.ts'
      },
      'kyc-verification': {
        required: ['documentUpload', 'identityVerification', 'addressVerification'],
        file: 'src/lib/kyc-service.ts'
      }
    };

    for (const [rule, config] of Object.entries(businessRules)) {
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, config.file), 'utf8');

        config.required.forEach(method => {
          if (!content.includes(method)) {
            this.addFinding('high', 'MISSING_BUSINESS_RULE',
              `Regla de negocio faltante: ${method} en ${rule}`,
              'Implementar funcionalidad requerida');
          }
        });

      } catch (error) {
        this.addFinding('high', 'BUSINESS_RULE_FILE_MISSING',
          `Archivo de regla de negocio faltante: ${config.file}`);
      }
    }
  }

  async reviewErrorHandling() {
    console.log('🚨 PASO 5: REVISIÓN DE MANEJO DE ERRORES');
    console.log('-'.repeat(50));

    await this.reviewExceptionHandling();
    await this.reviewInputValidation();
    await this.reviewDatabaseErrorHandling();

    console.log('');
  }

  async reviewExceptionHandling() {
    console.log('⚠️ Revisando manejo de excepciones...');

    const sourceFiles = this.getAllSourceFiles();
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Contar try/catch blocks
        const tryCount = (content.match(/try\s*{/g) || []).length;
        const catchCount = (content.match(/catch\s*\(/g) || []).length;

        if (tryCount > catchCount) {
          this.addFinding('medium', 'UNBALANCED_TRY_CATCH',
            `Try/catch desbalanceado en ${file}`,
            `${tryCount} try vs ${catchCount} catch`);
        }

        // Verificar catch sin logging
        if (content.includes('catch') && !content.includes('logger.')) {
          this.addFinding('low', 'MISSING_ERROR_LOGGING',
            `Catch sin logging en ${file}`,
            'Agregar logger.error en bloques catch');
        }

      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  async reviewInputValidation() {
    console.log('✅ Revisando validación de entrada...');

    const apiFiles = this.getApiFiles();
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar validación de tipos requeridos
        const requiredParams = ['userId', 'id', 'email'].filter(param =>
          content.includes(param) && !content.includes('validate') && !content.includes('zod')
        );

        if (requiredParams.length > 0) {
          this.addFinding('medium', 'MISSING_INPUT_VALIDATION',
            `Validación faltante para parámetros en ${file}`,
            `Parámetros sin validar: ${requiredParams.join(', ')}`);
        }

      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  async reviewDatabaseErrorHandling() {
    console.log('🗄️ Revisando manejo de errores de BD...');

    const filesWithDb = this.getFilesWithDatabase();
    for (const file of filesWithDb) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Verificar transacciones sin rollback
        if (content.includes('$transaction') &&
            (!content.includes('catch') || !content.includes('rollback'))) {
          this.addFinding('high', 'MISSING_TRANSACTION_ROLLBACK',
            `Transacción sin manejo de rollback en ${file}`,
            'Agregar catch con rollback automático');
        }

        // Verificar consultas sin timeout
        if (content.includes('findMany') || content.includes('findFirst')) {
          this.addFinding('low', 'MISSING_QUERY_TIMEOUT',
            `Consulta sin timeout en ${file}`,
            'Considerar agregar timeout para evitar consultas colgantes');
        }

      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  async reviewCriticalAspects() {
    console.log('🔐 PASO 6: REVISIÓN DE ASPECTOS CRÍTICOS');
    console.log('-'.repeat(50));

    await this.reviewSecurityAspects();
    await this.reviewConfigurationCompleteness();
    await this.reviewDependencies();

    console.log('');
  }

  async reviewSecurityAspects() {
    console.log('🛡️ Revisando aspectos de seguridad...');

    // Revisar archivos sensibles
    const sensitiveFiles = [
      'src/lib/auth.ts',
      'src/lib/payout-service.ts',
      'src/lib/bank-account-service.ts'
    ];

    for (const file of sensitiveFiles) {
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');

        // Verificar exposición de datos sensibles
        if (content.includes('password') && content.includes('console.log')) {
          this.addFinding('critical', 'PASSWORD_EXPOSURE',
            `Posible exposición de contraseña en ${file}`,
            'Nunca loggear contraseñas o datos sensibles');
        }

        // Verificar tokens hardcodeados
        if (content.includes('sk-') || content.includes('pk_')) {
          this.addFinding('critical', 'HARDCODED_SECRET',
            `Token hardcodeado encontrado en ${file}`,
            'Mover a variables de entorno');
        }

        // Verificar SQL injection
        if (content.includes('query(') && content.includes('${')) {
          this.addFinding('high', 'SQL_INJECTION_RISK',
            `Riesgo de SQL injection en ${file}`,
            'Usar consultas parametrizadas');
        }

      } catch (error) {
        // Ignorar errores de archivos faltantes
      }
    }
  }

  async reviewConfigurationCompleteness() {
    console.log('⚙️ Revisando completitud de configuraciones...');

    // Verificar package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));

      if (!packageJson.scripts || !packageJson.scripts.build) {
        this.addFinding('medium', 'MISSING_BUILD_SCRIPT',
          'Script de build faltante en package.json');
      }

      if (!packageJson.scripts.test) {
        this.addFinding('low', 'MISSING_TEST_SCRIPT',
          'Script de test faltante en package.json');
      }

    } catch (error) {
      this.addFinding('medium', 'INVALID_PACKAGE_JSON',
        'Error en package.json', error.message);
    }

    // Verificar configuraciones críticas
    const configFiles = ['env.example', 'next.config.js', 'tsconfig.json'];
    for (const file of configFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        this.addFinding('medium', 'MISSING_CONFIG_FILE',
          `Archivo de configuración faltante: ${file}`);
      }
    }
  }

  async reviewDependencies() {
    console.log('📦 Revisando dependencias...');

    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));

      // Verificar dependencias críticas
      const criticalDeps = ['next', 'react', 'prisma', '@prisma/client'];
      const missingDeps = criticalDeps.filter(dep =>
        !packageJson.dependencies || !packageJson.dependencies[dep]
      );

      if (missingDeps.length > 0) {
        this.addFinding('high', 'MISSING_CRITICAL_DEPS',
          `Dependencias críticas faltantes: ${missingDeps.join(', ')}`);
      }

      // Verificar versiones potencialmente problemáticas
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      for (const [dep, version] of Object.entries(deps)) {
        if (version.includes('^0.') || version.includes('~0.')) {
          this.addFinding('low', 'UNSTABLE_DEPENDENCY_VERSION',
            `Versión inestable de dependencia: ${dep}@${version}`,
            'Considerar usar versiones más estables');
        }
      }

    } catch (error) {
      this.addFinding('medium', 'DEPENDENCY_ANALYSIS_ERROR',
        'Error analizando dependencias', error.message);
    }
  }

  // Métodos auxiliares
  getAllSourceFiles() {
    const dirs = ['src/lib', 'src/app', 'src/components'];
    const files = [];

    for (const dir of dirs) {
      try {
        const fullPath = path.join(this.projectRoot, dir);
        if (fs.existsSync(fullPath)) {
          const dirFiles = fs.readdirSync(fullPath, { recursive: true });
          files.push(...dirFiles
            .filter(file => {
              const ext = path.extname(file);
              return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
            })
            .map(file => path.join(dir, file))
          );
        }
      } catch (error) {
        // Ignorar errores de directorios
      }
    }

    return files;
  }

  getApiFiles() {
    try {
      const apiDir = path.join(this.projectRoot, 'src/app/api');
      if (!fs.existsSync(apiDir)) return [];

      const files = fs.readdirSync(apiDir, { recursive: true });
      return files
        .filter(file => path.extname(file) === '.ts')
        .map(file => path.join('src/app/api', file));
    } catch (error) {
      return [];
    }
  }

  getUiFiles() {
    try {
      const componentDir = path.join(this.projectRoot, 'src/components');
      if (!fs.existsSync(componentDir)) return [];

      const files = fs.readdirSync(componentDir, { recursive: true });
      return files
        .filter(file => path.extname(file) === '.tsx')
        .map(file => path.join('src/components', file));
    } catch (error) {
      return [];
    }
  }

  getFilesWithDatabase() {
    const allFiles = this.getAllSourceFiles();
    return allFiles.filter(file => {
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
        return content.includes('prisma') || content.includes('db.') || content.includes('$query');
      } catch (error) {
        return false;
      }
    });
  }

  addFinding(severity, category, title, description = '') {
    const finding = {
      category,
      title,
      description,
      timestamp: new Date().toISOString(),
      severity
    };

    this.findings[severity].push(finding);
  }

  generateFinalReport() {
    console.log('📋 PASO 7: GENERANDO INFORME FINAL');
    console.log('='.repeat(60));

    // Estadísticas generales
    console.log('📊 ESTADÍSTICAS GENERALES:');
    console.log(`   • Archivos analizados: ${this.stats.filesAnalyzed}`);
    console.log(`   • Líneas totales: ${this.stats.totalLines}`);
    console.log(`   • APIs encontradas: ${this.stats.apisFound}`);
    console.log(`   • Componentes encontrados: ${this.stats.componentsFound}`);
    console.log('');

    // Resumen de hallazgos por severidad
    console.log('🎯 RESUMEN DE HALLAZGOS:');
    const severities = ['critical', 'high', 'medium', 'low', 'info'];

    severities.forEach(severity => {
      const count = this.findings[severity].length;
      if (count > 0) {
        const emoji = {
          critical: '🚨',
          high: '🔴',
          medium: '🟡',
          low: '🟢',
          info: 'ℹ️'
        }[severity];

        console.log(`   ${emoji} ${severity.toUpperCase()}: ${count} hallazgo(s)`);
      }
    });
    console.log('');

    // Mostrar hallazgos críticos y altos
    const criticalFindings = [...this.findings.critical, ...this.findings.high];

    if (criticalFindings.length > 0) {
      console.log('🚨 HALLAZGOS CRÍTICOS Y ALTOS:');
      criticalFindings.forEach((finding, index) => {
        console.log(`   ${index + 1}. [${finding.category}] ${finding.title}`);
        if (finding.description) {
          console.log(`      ${finding.description}`);
        }
      });
      console.log('');
    }

    // Recomendaciones por categoría
    console.log('💡 RECOMENDACIONES DE CORRECCIÓN:');
    console.log('   1. 🔴 CRÍTICOS: Corregir inmediatamente (seguridad, funcionalidad)');
    console.log('   2. 🟡 ALTOS: Corregir en próximos días (lógica de negocio)');
    console.log('   3. 🟢 MEDIOS: Corregir en próximas semanas (mejoras)');
    console.log('   4. ℹ️ BAJOS: Corregir cuando sea conveniente (optimizaciones)');
    console.log('');

    // Guardar informe completo
    this.saveDetailedReport();

    const totalFindings = Object.values(this.findings).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`✅ REVISIÓN COMPLETA FINALIZADA`);
    console.log(`📄 Total de hallazgos: ${totalFindings}`);
    console.log(`📁 Informe detallado guardado en: ./system-review-report.json`);
  }

  saveDetailedReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        project: 'Rent360',
        reviewer: 'SystemReviewer',
        totalFiles: this.stats.filesAnalyzed,
        totalLines: this.stats.totalLines
      },
      statistics: this.stats,
      findings: this.findings,
      summary: {
        critical: this.findings.critical.length,
        high: this.findings.high.length,
        medium: this.findings.medium.length,
        low: this.findings.low.length,
        info: this.findings.info.length,
        total: Object.values(this.findings).reduce((sum, arr) => sum + arr.length, 0)
      }
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'system-review-report.json'),
      JSON.stringify(report, null, 2)
    );
  }
}

// Ejecutar revisión completa
if (require.main === module) {
  const reviewer = new SystemReviewer();
  reviewer.runCompleteReview().catch(error => {
    console.error('Error fatal en revisión del sistema:', error);
    process.exit(1);
  });
}

module.exports = { SystemReviewer };
