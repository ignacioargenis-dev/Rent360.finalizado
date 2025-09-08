const fs = require('fs');
const path = require('path');

// Rutas que deben tener sidebar
const routesWithSidebar = {
  admin: [
    '/admin/dashboard',
    '/admin/users',
    '/admin/properties',
    '/admin/properties/pending',
    '/admin/properties/reported',
    '/admin/contracts',
    '/admin/payments',
    '/admin/payments/pending',
    '/admin/payments/reports',
    '/admin/tickets',
    '/admin/reports',
    '/admin/reports/financial',
    '/admin/reports/users',
    '/admin/reports/properties',
    '/admin/settings',
    '/admin/settings/enhanced',
    '/admin/analytics',
    '/admin/notifications',
    '/admin/notifications-enhanced',
    '/admin/maintenance',
    '/admin/backup',
    '/admin/audit-logs',
    '/admin/integrations',
    '/admin/database-stats',
    '/admin/system-health',
    '/admin/predictive-analytics',
    '/admin/providers',
    '/admin/contractors'
  ],
  tenant: [
    '/tenant/dashboard',
    '/tenant/advanced-search',
    '/tenant/contracts',
    '/tenant/payments',
    '/tenant/maintenance',
    '/tenant/messages',
    '/tenant/ratings',
    '/tenant/settings'
  ],
  owner: [
    '/owner/dashboard',
    '/owner/properties',
    '/owner/tenants',
    '/owner/contracts',
    '/owner/payments',
    '/owner/payment-reminders',
    '/owner/maintenance',
    '/owner/messages',
    '/owner/ratings',
    '/owner/reports',
    '/owner/analytics',
    '/owner/settings',
    '/owner/property-comparison'
  ],
  broker: [
    '/broker/dashboard',
    '/broker/properties',
    '/broker/properties/new',
    '/broker/clients',
    '/broker/clients/prospects',
    '/broker/clients/active',
    '/broker/appointments',
    '/broker/contracts',
    '/broker/commissions',
    '/broker/messages',
    '/broker/reports',
    '/broker/analytics',
    '/broker/settings',
    '/broker/maintenance'
  ],
  runner: [
    '/runner/dashboard',
    '/runner/tasks',
    '/runner/visits',
    '/runner/photos',
    '/runner/clients',
    '/runner/schedule',
    '/runner/earnings',
    '/runner/messages',
    '/runner/reports',
    '/runner/profile',
    '/runner/settings'
  ],
  support: [
    '/support/dashboard',
    '/support/tickets',
    '/support/users',
    '/support/properties',
    '/support/knowledge',
    '/support/reports',
    '/support/reports/resolved',
    '/support/reports/response-time',
    '/support/reports/satisfaction',
    '/support/settings'
  ],
  provider: [
    '/provider/dashboard',
    '/provider/services',
    '/provider/requests',
    '/provider/ratings',
    '/provider/earnings',
    '/provider/settings'
  ]
};

// Rutas que NO deben tener sidebar (públicas)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/about',
  '/contact',
  '/properties/search',
  '/properties/[id]',
  '/register-provider'
];

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para verificar si un archivo usa el sidebar
function hasSidebar(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('DashboardLayout') || 
           content.includes('UnifiedSidebar') || 
           content.includes('EnhancedDashboardLayout');
  } catch (error) {
    return false;
  }
}

// Función para verificar si un archivo es una página válida
function isValidPage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('export default') || 
           content.includes('export async function') ||
           content.includes('export function');
  } catch (error) {
    return false;
  }
}

// Función para procesar directorios recursivamente
function processDirectory(dir, basePath = '') {
  const results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      const subResults = processDirectory(filePath, path.join(basePath, file));
      results.push(...subResults);
    } else if (file === 'page.tsx' || file === 'page.js') {
      const routePath = path.join(basePath, file === 'page.tsx' ? '' : '').replace(/\\/g, '/');
      results.push({
        path: routePath,
        fullPath: filePath,
        exists: true,
        hasSidebar: hasSidebar(filePath),
        isValidPage: isValidPage(filePath)
      });
    }
  });
  
  return results;
}

// Función principal de prueba
function testSidebarPresence() {
  console.log('🔍 Iniciando prueba de presencia de sidebar...\n');
  
  const srcDir = path.join(__dirname, '..', 'src', 'app');
  const foundPages = processDirectory(srcDir);
  
  console.log('📊 RESULTADOS DE LA PRUEBA\n');
  console.log('='.repeat(80));
  
  // Verificar rutas que deben tener sidebar
  let totalRoutes = 0;
  let routesWithSidebarCount = 0;
  let routesWithoutSidebarCount = 0;
  let missingRoutes = 0;
  
  Object.entries(routesWithSidebar).forEach(([role, routes]) => {
    console.log(`\n👥 ROL: ${role.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    routes.forEach(route => {
      totalRoutes++;
      const pagePath = path.join(srcDir, route.replace(/^\//, ''), 'page.tsx');
      const pageExists = fileExists(pagePath);
      
      if (pageExists) {
        const hasSidebarComponent = hasSidebar(pagePath);
        const status = hasSidebarComponent ? '✅' : '❌';
        const sidebarStatus = hasSidebarComponent ? 'CON SIDEBAR' : 'SIN SIDEBAR';
        
        console.log(`${status} ${route} - ${sidebarStatus}`);
        
        if (hasSidebarComponent) {
          routesWithSidebarCount++;
        } else {
          routesWithoutSidebarCount++;
        }
      } else {
        console.log(`⚠️  ${route} - ARCHIVO NO ENCONTRADO`);
        missingRoutes++;
      }
    });
  });
  
  // Verificar rutas públicas
  console.log(`\n🌐 RUTAS PÚBLICAS (NO DEBEN TENER SIDEBAR)`);
  console.log('-'.repeat(50));
  
  publicRoutes.forEach(route => {
    const pagePath = path.join(srcDir, route.replace(/^\//, ''), 'page.tsx');
    const pageExists = fileExists(pagePath);
    
    if (pageExists) {
      const hasSidebarComponent = hasSidebar(pagePath);
      const status = hasSidebarComponent ? '❌' : '✅';
      const sidebarStatus = hasSidebarComponent ? 'TIENE SIDEBAR (INCORRECTO)' : 'SIN SIDEBAR (CORRECTO)';
      
      console.log(`${status} ${route} - ${sidebarStatus}`);
    } else {
      console.log(`⚠️  ${route} - ARCHIVO NO ENCONTRADO`);
    }
  });
  
  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMEN');
  console.log('='.repeat(80));
  console.log(`Total de rutas verificadas: ${totalRoutes}`);
  console.log(`Rutas con sidebar: ${routesWithSidebarCount} ✅`);
  console.log(`Rutas sin sidebar: ${routesWithoutSidebarCount} ❌`);
  console.log(`Rutas faltantes: ${missingRoutes} ⚠️`);
  
  const coverage = ((routesWithSidebarCount / totalRoutes) * 100).toFixed(1);
  console.log(`Cobertura de sidebar: ${coverage}%`);
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES');
  console.log('='.repeat(80));
  
  if (routesWithoutSidebarCount > 0) {
    console.log('❌ Rutas que necesitan sidebar:');
    // Aquí podrías listar las rutas específicas que necesitan sidebar
  }
  
  if (missingRoutes > 0) {
    console.log('⚠️  Rutas faltantes que deben ser creadas');
  }
  
  if (routesWithSidebarCount === totalRoutes) {
    console.log('🎉 ¡Excelente! Todas las rutas tienen sidebar implementado');
  }
  
  console.log('\n✅ Prueba completada');
}

// Ejecutar la prueba
if (require.main === module) {
  testSidebarPresence();
}

module.exports = {
  testSidebarPresence,
  routesWithSidebar,
  publicRoutes
};
