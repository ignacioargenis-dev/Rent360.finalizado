'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';
import {
  Home,
  Building,
  Users,
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
  Truck,
  Ticket,
  Database,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Shield,
  Trophy,
  LogOut,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  Zap,
  Menu,
  X,
  User,
  Wrench,
  DollarSign,
  Camera,
  Target,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserType } from '@/types';
import { logger } from '@/lib/logger-minimal';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  submenu?: MenuItem[];
  roles?: string[];
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
        { title: 'Payouts de Propietarios', url: '/admin/payments/owners', icon: Building },
        { title: 'Payouts de Corredores', url: '/admin/payments/brokers', icon: Users },
        { title: 'Payouts de Proveedores', url: '/admin/payments/providers', icon: Truck },
        { title: 'Payouts de Runners', url: '/admin/runners/payouts', icon: User },
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
      title: 'Casos Legales',
      url: '/admin/legal-cases',
      icon: Shield,
      badge: '3',
      badgeVariant: 'destructive',
    },
    {
      title: 'Disputas de Garantía',
      url: '/admin/disputes',
      icon: AlertTriangle,
      badge: '2',
      badgeVariant: 'outline',
    },
    {
      title: 'Métricas del Sistema',
      url: '/admin/system-metrics',
      icon: Activity,
      badge: 'Live',
      badgeVariant: 'default',
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
    {
      title: 'Firmas Electrónicas',
      url: '/admin/signatures',
      icon: Shield,
      badge: 'SII',
      badgeVariant: 'default',
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
      url: '/tenant/advanced-search',
      icon: Search,
    },
    {
      title: 'Mis Contratos',
      url: '/tenant/contracts',
      icon: FileText,
    },
    {
      title: 'Mis Pagos',
      url: '/tenant/payments',
      icon: CreditCard,
    },
    {
      title: 'Mantenimiento',
      url: '/tenant/maintenance',
      icon: Wrench,
    },
    {
      title: 'Buscar Servicios',
      url: '/tenant/services',
      icon: Zap,
    },
    {
      title: 'Mensajes',
      url: '/tenant/messages',
      icon: MessageSquare,
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
    },
    {
      title: 'Mis Inquilinos',
      url: '/owner/tenants',
      icon: Users,
    },
    {
      title: 'Contratos',
      url: '/owner/contracts',
      icon: FileText,
    },
    {
      title: 'Casos Legales',
      url: '/owner/legal-cases',
      icon: Shield,
    },
    {
      title: 'Pagos',
      url: '/owner/payments',
      icon: CreditCard,
    },
    {
      title: 'Recordatorios',
      url: '/owner/payment-reminders',
      icon: Bell,
    },
    {
      title: 'Mantenimiento',
      url: '/owner/maintenance',
      icon: Wrench,
    },
    {
      title: 'Mensajes',
      url: '/owner/messages',
      icon: MessageSquare,
    },
    {
      title: 'Calificaciones',
      url: '/owner/ratings',
      icon: Star,
    },
    {
      title: 'Reportes',
      url: '/owner/reports',
      icon: BarChart3,
    },
    {
      title: 'Analytics',
      url: '/owner/analytics',
      icon: TrendingUp,
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
      title: 'Casos Legales',
      url: '/broker/legal-cases',
      icon: Shield,
    },
    {
      title: 'Disputas',
      url: '/broker/disputes',
      icon: AlertTriangle,
    },
    {
      title: 'Mantenimiento',
      url: '/broker/maintenance',
      icon: Wrench,
      badge: '3',
      badgeVariant: 'outline',
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
      title: 'Analytics',
      url: '/broker/analytics',
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
      title: 'Tareas',
      url: '/runner/tasks',
      icon: Target,
    },
    {
      title: 'Visitas',
      url: '/runner/visits',
      icon: MapPin,
    },
    {
      title: 'Fotos',
      url: '/runner/photos',
      icon: Camera,
    },
    {
      title: 'Clientes',
      url: '/runner/clients',
      icon: Users,
    },
    {
      title: 'Horario',
      url: '/runner/schedule',
      icon: Calendar,
    },
    {
      title: 'Ganancias',
      url: '/runner/earnings',
      icon: DollarSign,
    },
    {
      title: 'Incentivos',
      url: '/runner/incentives',
      icon: Trophy,
    },
    {
      title: 'Mensajes',
      url: '/runner/messages',
      icon: MessageSquare,
    },
    {
      title: 'Reportes',
      url: '/runner/reports',
      icon: BarChart3,
    },
    {
      title: 'Perfil',
      url: '/runner/profile',
      icon: User,
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
      title: 'Casos Legales',
      url: '/support/legal-cases',
      icon: FileText,
      badge: '3',
      badgeVariant: 'secondary',
    },
    {
      title: 'Disputas de Garantía',
      url: '/support/disputes',
      icon: AlertTriangle,
      badge: '2',
      badgeVariant: 'outline',
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
  provider: [
    {
      title: 'Panel Principal',
      url: '/provider/dashboard',
      icon: Home,
    },
    {
      title: 'Servicios',
      url: '/provider/services',
      icon: Wrench,
    },
    {
      title: 'Solicitudes',
      url: '/provider/requests',
      icon: Ticket,
    },
    {
      title: 'Calificaciones',
      url: '/provider/ratings',
      icon: Star,
    },
    {
      title: 'Ganancias',
      url: '/provider/earnings',
      icon: DollarSign,
    },
    {
      title: 'Configuración',
      url: '/provider/settings',
      icon: Settings,
    },
  ],
  maintenance: [
    {
      title: 'Panel Principal',
      url: '/maintenance',
      icon: Home,
    },
    {
      title: 'Trabajos Activos',
      url: '/maintenance/jobs',
      icon: Wrench,
      badge: '8',
      badgeVariant: 'secondary',
    },
    {
      title: 'Propiedades',
      url: '/maintenance/properties',
      icon: Building,
    },
    {
      title: 'Calendario',
      url: '/maintenance/calendar',
      icon: Calendar,
    },
    {
      title: 'Reportes',
      url: '/maintenance/reports',
      icon: BarChart3,
    },
    {
      title: 'Ganancias',
      url: '/maintenance/earnings',
      icon: DollarSign,
    },
    {
      title: 'Calificaciones',
      url: '/maintenance/ratings',
      icon: Star,
    },
    {
      title: 'Configuración',
      url: '/maintenance/settings',
      icon: Settings,
    },
  ],
};

interface UnifiedSidebarProps {
  children: React.ReactNode;
  user?: UserType | null;
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function UnifiedSidebar({
  children,
  user,
  showNotifications = true,
  notificationCount = 0,
}: UnifiedSidebarProps) {
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        localStorage.removeItem('user');
        router.push('/');
      } else {
        logger.error('Logout failed');
      }
    } catch (error) {
      logger.error('Error logging out:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Determinar rol del usuario - priorizar el rol real del usuario
  let finalUserRole: string;

  if (user && user.role) {
    // Si tenemos información real del usuario, usarla
    finalUserRole = user.role.toLowerCase();
  } else {
    // Si no hay usuario, determinar desde la URL como fallback
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    if (pathname.startsWith('/admin/')) {
      finalUserRole = 'admin';
    } else if (pathname.startsWith('/owner/')) {
      finalUserRole = 'owner';
    } else if (pathname.startsWith('/tenant/')) {
      finalUserRole = 'tenant';
    } else if (pathname.startsWith('/broker/')) {
      finalUserRole = 'broker';
    } else if (pathname.startsWith('/provider/')) {
      finalUserRole = 'provider';
    } else if (pathname.startsWith('/maintenance/')) {
      finalUserRole = 'maintenance';
    } else if (pathname.startsWith('/runner/')) {
      finalUserRole = 'runner';
    } else if (pathname.startsWith('/support/')) {
      finalUserRole = 'support';
    } else {
      finalUserRole = 'tenant';
    }
  }

  // Validar que el rol existe en menuItems
  if (!(finalUserRole in menuItems)) {
    // Rol no encontrado en menuItems, usando 'tenant' como fallback
    finalUserRole = 'tenant';
  }

  const items = menuItems[finalUserRole] || menuItems.tenant || [];

  const isActiveRoute = (url: string) => {
    return pathname === url || pathname.startsWith(url + '/');
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openSubmenus[item.title];
    const isActive = isActiveRoute(item.url);

    return (
      <div key={item.title}>
        {hasSubmenu ? (
          <>
            <button
              onClick={() => toggleSubmenu(item.title)}
              className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isOpen && item.submenu && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map(subItem => (
                  <div key={subItem.title}>
                    <Link
                      href={subItem.url}
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${isActiveRoute(subItem.url) ? 'bg-emerald-50 text-emerald-700' : ''}`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.title}</span>
                      {subItem.badge && (
                        <Badge variant={subItem.badgeVariant || 'default'} className="ml-auto">
                          {subItem.badge}
                        </Badge>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.url}
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}
          >
            <item.icon className="w-4 h-4" />
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
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 w-64 bg-white border-r border-gray-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Rent360</h1>
              <p className="text-xs text-gray-500">Sistema de Arriendos</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Menú Principal</h3>
            <nav className="space-y-2">{items.map(item => renderMenuItem(item))}</nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          {user && (
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Rent360</span>
            </div>
            {showNotifications && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
