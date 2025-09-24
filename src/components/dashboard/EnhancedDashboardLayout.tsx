'use client';

import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sidebar, 
  SidebarHeader
} from '@/components/ui/sidebar';
import { Home, Building, Users,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Star,
  Calendar,
  MapPin,
  TrendingUp,
  Shield,
  Ticket,
  Database,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  LogOut,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications';
import ConnectionStatus from '@/components/notifications/ConnectionStatus';
import ToastNotifications from '@/components/notifications/ToastNotifications';

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  title: string;
  subtitle: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  submenu?: MenuItem[];
}

interface RoleMenuItems {
  [key: string]: MenuItem[];
}

const menuItems: RoleMenuItems = {
  admin: [
    {
      title: 'Panel Principal',
      url: '/admin/dashboard',
      icon: Home,
    },
    {
      title: 'Gestión de Usuarios',
      url: '/admin/users',
      icon: Users,
      badge: '12',
      badgeVariant: 'secondary',
    },
    {
      title: 'Propiedades',
      url: '/admin/properties',
      icon: Building,
      submenu: [
        { title: 'Todas las Propiedades', url: '/admin/properties', icon: Building },
        { title: 'Propiedades Pendientes', url: '/admin/properties/pending', icon: Eye },
        { title: 'Reportadas', url: '/admin/properties/reported', icon: Bell },
      ],
    },
    {
      title: 'Contratos',
      url: '/admin/contracts',
      icon: FileText,
    },
    {
      title: 'Pagos',
      url: '/admin/payments',
      icon: CreditCard,
      submenu: [
        { title: 'Todos los Pagos', url: '/admin/payments', icon: CreditCard },
        { title: 'Pagos Pendientes', url: '/admin/payments/pending', icon: Clock },
        { title: 'Reporte de Ingresos', url: '/admin/payments/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Soporte',
      url: '/admin/tickets',
      icon: Ticket,
      badge: '5',
      badgeVariant: 'destructive',
    },
    {
      title: 'Reportes',
      url: '/admin/reports',
      icon: BarChart3,
      submenu: [
        { title: 'Reportes Financieros', url: '/admin/reports/financial', icon: TrendingUp },
        { title: 'Reportes de Usuarios', url: '/admin/reports/users', icon: Users },
        { title: 'Reportes de Propiedades', url: '/admin/reports/properties', icon: Building },
      ],
    },
    {
      title: 'Configuración',
      url: '/admin/settings',
      icon: Settings,
      submenu: [
        { title: 'Configuración Básica', url: '/admin/settings', icon: Settings },
        { title: 'Configuración Avanzada', url: '/admin/settings/enhanced', icon: Zap },
      ],
    },
  ],
  tenant: [
    {
      title: 'Panel Principal',
      url: '/tenant/dashboard',
      icon: Home,
    },
    {
      title: 'Buscar Propiedades',
      url: '/properties/search',
      icon: Search,
    },
    {
      title: 'Mis Contratos',
      url: '/tenant/contracts',
      icon: FileText,
      badge: '1',
      badgeVariant: 'default',
    },
    {
      title: 'Pagos',
      url: '/tenant/payments',
      icon: CreditCard,
      submenu: [
        { title: 'Historial de Pagos', url: '/tenant/payments', icon: CreditCard },
        { title: 'Próximos Pagos', url: '/tenant/payments/upcoming', icon: Calendar },
        { title: 'Métodos de Pago', url: '/tenant/payments/methods', icon: Settings },
      ],
    },
    {
      title: 'Mensajes',
      url: '/tenant/messages',
      icon: MessageSquare,
      badge: '3',
      badgeVariant: 'destructive',
    },
    {
      title: 'Mantenimiento',
      url: '/tenant/maintenance',
      icon: Ticket,
    },
    {
      title: 'Calificaciones',
      url: '/tenant/ratings',
      icon: Star,
    },
    {
      title: 'Configuración',
      url: '/tenant/settings',
      icon: Settings,
    },
  ],
  owner: [
    {
      title: 'Panel Principal',
      url: '/owner/dashboard',
      icon: Home,
    },
    {
      title: 'Mis Propiedades',
      url: '/owner/properties',
      icon: Building,
      badge: '3',
      badgeVariant: 'default',
    },
    {
      title: 'Nueva Propiedad',
      url: '/owner/properties/new',
      icon: Edit,
    },
    {
      title: 'Inquilinos',
      url: '/owner/tenants',
      icon: Users,
    },
    {
      title: 'Contratos',
      url: '/owner/contracts',
      icon: FileText,
    },
    {
      title: 'Pagos',
      url: '/owner/payments',
      icon: CreditCard,
      submenu: [
        { title: 'Recibidos', url: '/owner/payments', icon: CreditCard },
        { title: 'Pendientes', url: '/owner/payments/pending', icon: Clock },
        { title: 'Reportes', url: '/owner/payments/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Mantenimiento',
      url: '/owner/maintenance',
      icon: Ticket,
    },
    {
      title: 'Mensajes',
      url: '/owner/messages',
      icon: MessageSquare,
    },
    {
      title: 'Reportes',
      url: '/owner/reports',
      icon: BarChart3,
    },
    {
      title: 'Configuración',
      url: '/owner/settings',
      icon: Settings,
    },
  ],
  broker: [
    {
      title: 'Panel Principal',
      url: '/broker/dashboard',
      icon: Home,
    },
    {
      title: 'Propiedades',
      url: '/broker/properties',
      icon: Building,
      badge: '8',
      badgeVariant: 'default',
    },
    {
      title: 'Nueva Propiedad',
      url: '/broker/properties/new',
      icon: Edit,
    },
    {
      title: 'Clientes',
      url: '/broker/clients',
      icon: Users,
      submenu: [
        { title: 'Todos los Clientes', url: '/broker/clients', icon: Users },
        { title: 'Clientes Potenciales', url: '/broker/clients/prospects', icon: UserPlus },
        { title: 'Clientes Activos', url: '/broker/clients/active', icon: Star },
      ],
    },
    {
      title: 'Citas',
      url: '/broker/appointments',
      icon: Calendar,
    },
    {
      title: 'Contratos',
      url: '/broker/contracts',
      icon: FileText,
    },
    {
      title: 'Comisiones',
      url: '/broker/commissions',
      icon: TrendingUp,
    },
    {
      title: 'Mensajes',
      url: '/broker/messages',
      icon: MessageSquare,
    },
    {
      title: 'Reportes',
      url: '/broker/reports',
      icon: BarChart3,
    },
    {
      title: 'Configuración',
      url: '/broker/settings',
      icon: Settings,
    },
  ],
  runner: [
    {
      title: 'Panel Principal',
      url: '/runner/dashboard',
      icon: Home,
    },
    {
      title: 'Visitas Programadas',
      url: '/runner/visits',
      icon: Calendar,
      badge: '4',
      badgeVariant: 'destructive',
    },
    {
      title: 'Nueva Visita',
      url: '/runner/visits/new',
      icon: MapPin,
    },
    {
      title: 'Fotos',
      url: '/runner/photos',
      icon: Eye,
    },
    {
      title: 'Mis Ganancias',
      url: '/runner/earnings',
      icon: TrendingUp,
      badge: '2',
      badgeVariant: 'default',
    },
    {
      title: 'Propiedades',
      url: '/runner/properties',
      icon: Building,
    },
    {
      title: 'Clientes',
      url: '/runner/clients',
      icon: Users,
    },
    {
      title: 'Reportes',
      url: '/runner/reports',
      icon: FileText,
      submenu: [
        { title: 'Visitas Realizadas', url: '/runner/reports/visits', icon: Eye },
        { title: 'Conversiones', url: '/runner/reports/conversions', icon: TrendingUp },
        { title: 'Rendimiento', url: '/runner/reports/performance', icon: BarChart3 },
      ],
    },
    {
      title: 'Mensajes',
      url: '/runner/messages',
      icon: MessageSquare,
    },
    {
      title: 'Configuración',
      url: '/runner/settings',
      icon: Settings,
    },
  ],
  support: [
    {
      title: 'Panel Principal',
      url: '/support/dashboard',
      icon: Home,
    },
    {
      title: 'Tickets',
      url: '/support/tickets',
      icon: Ticket,
      badge: '12',
      badgeVariant: 'destructive',
    },
    {
      title: 'Usuarios',
      url: '/support/users',
      icon: Users,
    },
    {
      title: 'Propiedades',
      url: '/support/properties',
      icon: Building,
    },
    {
      title: 'Base de Conocimiento',
      url: '/support/knowledge',
      icon: Database,
    },
    {
      title: 'Reportes',
      url: '/support/reports',
      icon: BarChart3,
      submenu: [
        { title: 'Tickets Resueltos', url: '/support/reports/resolved', icon: CheckCircle },
        { title: 'Tiempo de Respuesta', url: '/support/reports/response-time', icon: Clock },
        { title: 'Satisfacción', url: '/support/reports/satisfaction', icon: Star },
      ],
    },
    {
      title: 'Configuración',
      url: '/support/settings',
      icon: Settings,
    },
  ],
};

export default function EnhancedDashboardLayout({
  children,
  user,
  title,
  subtitle,
  showNotifications = true,
  notificationCount = 0,
}: EnhancedDashboardLayoutProps) {

  const [openSubmenus, setOpenSubmenus] = useState<{[key: string]: boolean}>({});
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Clear any stored user data
        localStorage.removeItem('user');
        router.push('/');
      } else {
        logger.error('Logout failed');
      }
    } catch (error) {
      logger.error('Error logging out:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const userRole = user?.role || 'tenant';
  const items = menuItems[userRole] || menuItems.tenant || [];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openSubmenus[item.title];

    const IconComponent = item.icon;

    return (
      <div key={item.title} className="sidebar-item">
        {hasSubmenu ? (
          <>
            <button
              onClick={() => toggleSubmenu(item.title)}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded"
            >
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isOpen && item.submenu && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((subItem) => {
                  const SubIconComponent = subItem.icon;
                  return (
                    <div key={subItem.title} className="submenu-item">
                      <Link href={subItem.url} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                        <SubIconComponent className="w-4 h-4" />
                        <span>{subItem.title}</span>
                        {subItem.badge && (
                          <Badge variant={subItem.badgeVariant || 'default'} className="ml-auto">
                            {subItem.badge}
                          </Badge>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <Link href={item.url} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <IconComponent className="w-4 h-4" />
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Rent360</h1>
              <p className="text-xs text-gray-500">Sistema de Arriendos</p>
            </div>
          </div>
        </SidebarHeader>
        
        <div className="flex flex-col flex-1">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Menú Principal
              </h3>
            </div>
            {items.map((item) => renderMenuItem(item))}
          </nav>
          
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
        
        {user && (
          <div className="p-2 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.name || 'Usuario'} />
                <AvatarFallback>{(user.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Sidebar />
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showNotifications && (
                <RealTimeNotifications />
              )}
              <ConnectionStatus showDetails={false} />
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastNotifications position="top-right" maxToasts={3} />
    </div>
  );
}
