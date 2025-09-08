const fs = require('fs');
const path = require('path');

// Rutas que necesitan sidebar pero no lo tienen
const routesNeedingSidebar = [
  // Admin
  '/admin/maintenance',
  '/admin/integrations', 
  '/admin/database-stats',
  '/admin/providers',
  
  // Tenant
  '/tenant/advanced-search',
  '/tenant/payments',
  '/tenant/maintenance',
  '/tenant/ratings',
  
  // Owner
  '/owner/tenants',
  '/owner/maintenance',
  '/owner/messages',
  '/owner/ratings',
  '/owner/analytics',
  
  // Broker
  '/broker/clients/active',
  '/broker/maintenance',
  
  // Runner
  '/runner/tasks',
  '/runner/schedule',
  '/runner/reports',
  '/runner/profile',
  
  // Support
  '/support/tickets',
  '/support/reports/resolved',
  '/support/reports/response-time',
  '/support/reports/satisfaction',
  
  // Provider
  '/provider/dashboard'
];

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para verificar si un archivo ya tiene sidebar
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

// Función para obtener el título de la página basado en la ruta
function getPageTitle(route) {
  const routeParts = route.split('/').filter(part => part);
  const lastPart = routeParts[routeParts.length - 1];
  
  // Mapeo de títulos
  const titleMap = {
    'dashboard': 'Panel Principal',
    'maintenance': 'Mantenimiento',
    'integrations': 'Integraciones',
    'database-stats': 'Estadísticas de Base de Datos',
    'providers': 'Proveedores',
    'advanced-search': 'Búsqueda Avanzada',
    'payments': 'Pagos',
    'ratings': 'Calificaciones',
    'tenants': 'Inquilinos',
    'messages': 'Mensajes',
    'analytics': 'Analytics',
    'active': 'Clientes Activos',
    'tasks': 'Tareas',
    'schedule': 'Horario',
    'reports': 'Reportes',
    'profile': 'Perfil',
    'tickets': 'Tickets',
    'resolved': 'Tickets Resueltos',
    'response-time': 'Tiempo de Respuesta',
    'satisfaction': 'Satisfacción'
  };
  
  return titleMap[lastPart] || lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

// Función para obtener el rol basado en la ruta
function getRoleFromRoute(route) {
  const routeParts = route.split('/');
  return routeParts[1] || 'tenant';
}

// Función para crear el contenido de la página con sidebar
function createPageWithSidebar(route, title) {
  const role = getRoleFromRoute(route);
  
  return `'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  FileText, 
  CreditCard, 
  Star, 
  Settings, 
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ${title.replace(/\s+/g, '')}Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar carga de datos específicos de la página
      // const response = await fetch(\`/api${route}\`);
      // const result = await response.json();
      // setData(result);
      
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error loading page data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="${title}"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout 
        title="${title}"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="${title}"
      subtitle="Gestiona y visualiza la información de ${title.toLowerCase()}"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>${title}</CardTitle>
            <CardDescription>
              Aquí puedes gestionar y visualizar toda la información relacionada con ${title.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido en desarrollo</h3>
              <p className="text-gray-600 mb-4">
                Esta página está siendo desarrollada. Pronto tendrás acceso a todas las funcionalidades.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Plus className="w-6 h-6 mb-2" />
                <span>Agregar Nuevo</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Filter className="w-6 h-6 mb-2" />
                <span>Filtrar</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>Reportes</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Settings className="w-6 h-6 mb-2" />
                <span>Configuración</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}`;
}

// Función para actualizar una página específica
function updatePageWithSidebar(route) {
  const srcDir = path.join(__dirname, '..', 'src', 'app');
  const pagePath = path.join(srcDir, route.replace(/^\//, ''), 'page.tsx');
  
  if (!fileExists(pagePath)) {
    console.log(`⚠️  Archivo no encontrado: ${pagePath}`);
    return false;
  }
  
  if (hasSidebar(pagePath)) {
    console.log(`✅ Ya tiene sidebar: ${route}`);
    return true;
  }
  
  const title = getPageTitle(route);
  const newContent = createPageWithSidebar(route, title);
  
  try {
    fs.writeFileSync(pagePath, newContent, 'utf8');
    console.log(`✅ Actualizado con sidebar: ${route}`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando ${route}:`, error.message);
    return false;
  }
}

// Función principal
function updateAllPagesWithSidebar() {
  console.log('🔧 Iniciando actualización de páginas con sidebar...\n');
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  routesNeedingSidebar.forEach(route => {
    const result = updatePageWithSidebar(route);
    if (result === true) {
      updatedCount++;
    } else if (result === false) {
      errorCount++;
    } else {
      skippedCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE ACTUALIZACIÓN');
  console.log('='.repeat(60));
  console.log(`Páginas actualizadas: ${updatedCount} ✅`);
  console.log(`Páginas omitidas: ${skippedCount} ⏭️`);
  console.log(`Errores: ${errorCount} ❌`);
  console.log(`Total procesadas: ${routesNeedingSidebar.length}`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 ¡Actualización completada!');
    console.log('💡 Ejecuta "node scripts/test-sidebar-presence.js" para verificar los resultados.');
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  updateAllPagesWithSidebar();
}

module.exports = {
  updateAllPagesWithSidebar,
  updatePageWithSidebar,
  routesNeedingSidebar
};
