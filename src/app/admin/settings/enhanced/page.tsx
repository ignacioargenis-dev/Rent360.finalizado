'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Mail,
  Database,
  Users,
  CreditCard,
  FileText,
  Globe,
  Smartphone,
  Key,
  CheckCircle,
  AlertTriangle,
  Info,
  Building,
  Zap,
  Link,
  Palette,
  Camera,
  MapPin,
  Calendar,
  Clock,
  BarChart3,
  Filter,
  Download,
  Upload,
  Lock,
  Unlock,
  EyeOff,
  Wifi,
  WifiOff,
  Server,
  HardDrive,
  Cloud,
  Monitor,
  Tablet,
  MessageSquare,
  Phone,
  Video,
  Mic,
  Image,
  File,
  Folder,
  FolderOpen,
  Trash2,
  Archive,
  Share2,
  Printer,
  Scissors,
  Copy,
  Edit3,
  Trash,
  Plus,
  Minus,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  Flag,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertCircle,
  CheckSquare,
  Square,
  RadioIcon,
  ToggleLeft,
  ToggleRight,
  User,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { User as UserType } from '@/types';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'welcome' | 'notification' | 'marketing' | 'transaction' | 'support' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemSettings {
  // Configuración General
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  maxPropertyImages: number;
  maxFileSize: number;
  currency: string;
  timezone: string;
  language: string;

  // Configuración de Propiedades
  defaultPropertyStatus: string;
  autoApproveProperties: boolean;
  propertyExpiryDays: number;
  featuredPropertyLimit: number;
  allowPropertyVideos: boolean;
  maxPropertyVideos: number;
  virtualTourEnabled: boolean;
  propertyMapEnabled: boolean;

  // Configuración de Usuarios
  defaultUserRole: string;
  userApprovalRequired: boolean;
  maxLoginAttempts: number;
  accountLockoutDuration: number;
  passwordExpiryDays: number;
  sessionTimeout: number;
  allowSocialLogin: boolean;
  socialProviders: string[];

  // Configuración de Comisiones
  defaultCommissionRate: number;
  commissionStructure: 'fixed' | 'percentage' | 'tiered';
  minimumCommissionAmount: number;
  commissionPaymentMethod: string;
  commissionSchedule: 'immediate' | 'weekly' | 'monthly';

  // Configuración de Notificaciones
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  newPropertyAlerts: boolean;
  paymentReminders: boolean;
  maintenanceAlerts: boolean;
  supportAlerts: boolean;
  commissionAlerts: boolean;

  // Configuración de Seguridad
  twoFactorAuth: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  passwordHistoryCount: number;
  sessionTimeoutMinutes: number;
  loginNotifications: boolean;
  ipRestrictionEnabled: boolean;
  allowedIPs: string[];

  // Configuración de Email
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  encryption: 'none' | 'ssl' | 'tls';
  emailTemplatesEnabled: boolean;

  // Configuración de Pagos
  paymentsEnabled: boolean;
  paymentProviders: string[];
  defaultPaymentMethod: string;
  autoPaymentProcessing: boolean;
  paymentRetryAttempts: number;
  latePaymentFee: number;
  latePaymentGracePeriod: number;

  // Configuración de Khipu
  khipuEnabled: boolean;
  khipuReceiverId: string;
  khipuSecretKey: string;
  khipuNotificationToken: string;
  khipuEnvironment: 'production' | 'test';

  // Configuración específica para Runners
  runnerPayoutsEnabled: boolean;
  runnerBaseRatePerMinute: number;
  runnerPremiumPropertyBonus: number;
  runnerPremiumPropertyThreshold: number;
  runnerVisitTypeMultipliers: {
    regular: number;
    premium: number;
    express: number;
  };
  runnerMinimumPayout: number;
  runnerMaximumDailyPayout: number;
  runnerRequireManualApproval: boolean;
  runnerApprovalThreshold: number;
  runnerPayoutSchedule: 'immediate' | 'weekly' | 'monthly';
  runnerCutoffDay: number;
  runnerSupportedPaymentMethods: string[];
  runnerRequireBankVerification: boolean;
  runnerRequireKYC: boolean;
  runnerPlatformFeePercentage: number;

  // Configuración específica para Proveedores de Mantenimiento
  maintenanceProviderPayoutsEnabled: boolean;
  maintenanceProviderCommissionPercentage: number;
  maintenanceProviderGracePeriodDays: number;
  maintenanceProviderMinimumPayout: number;
  maintenanceProviderMaximumDailyPayout: number;
  maintenanceProviderRequireManualApproval: boolean;
  maintenanceProviderApprovalThreshold: number;
  maintenanceProviderPayoutSchedule: 'immediate' | 'weekly' | 'monthly';
  maintenanceProviderSupportedPaymentMethods: string[];
  maintenanceProviderRequireBankVerification: boolean;

  // Configuración específica para Proveedores de Servicios
  serviceProviderPayoutsEnabled: boolean;
  serviceProviderCommissionPercentage: number;
  serviceProviderGracePeriodDays: number;
  serviceProviderMinimumPayout: number;
  serviceProviderMaximumDailyPayout: number;
  serviceProviderRequireManualApproval: boolean;
  serviceProviderApprovalThreshold: number;
  serviceProviderPayoutSchedule: 'immediate' | 'weekly' | 'monthly';
  serviceProviderSupportedPaymentMethods: string[];
  serviceProviderRequireBankVerification: boolean;

  // Configuración de Integraciones
  googleMapsEnabled: boolean;
  googleAnalyticsEnabled: boolean;
  facebookPixelEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string;
  apiEnabled: boolean;
  apiKey: string;
  crmIntegration: boolean;
  crmProvider: string;

  // Configuración Avanzada
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  cacheEnabled: boolean;
  cacheTimeout: number;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  theme: 'light' | 'dark' | 'auto';
  customCSS: string;

  // Configuración de UI/UX
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: number;
  fontSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
  darkModeEnabled: boolean;
  mobileResponsive: boolean;

  // Configuración de Rendimiento
  imageCompressionEnabled: boolean;
  imageQuality: number;
  lazyLoadingEnabled: boolean;
  cachingEnabled: boolean;
  minificationEnabled: boolean;
  cdnEnabled: boolean;
  cdnUrl: string;

  // Configuración Legal
  termsOfServiceRequired: boolean;
  privacyPolicyRequired: boolean;
  cookieConsentEnabled: boolean;
  gdprCompliance: boolean;
  dataRetentionDays: number;
  autoDeleteInactiveUsers: boolean;
  inactiveUserDays: number;

  // Configuración de Seguridad para Runners
  runnerFraudDetectionEnabled: boolean;

  // Configuración del Footer
  footerDescription: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  footerCopyright: string;
  termsUrl: string;
  privacyUrl: string;
  cookiesUrl: string;
  footerEnabled: boolean;
}

export default function EnhancedAdminSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');

  const [settings, setSettings] = useState<SystemSettings>({
    // Configuración General
    siteName: 'Rent360',
    siteUrl: 'https://rent360.cl',
    adminEmail: 'admin@rent360.cl',
    supportEmail: 'soporte@rent360.cl',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxPropertyImages: 10,
    maxFileSize: 5,
    currency: 'CLP',
    timezone: 'America/Santiago',
    language: 'es',

    // Configuración de Propiedades
    defaultPropertyStatus: 'AVAILABLE',
    autoApproveProperties: false,
    propertyExpiryDays: 30,
    featuredPropertyLimit: 5,
    allowPropertyVideos: true,
    maxPropertyVideos: 3,
    virtualTourEnabled: true,
    propertyMapEnabled: true,

    // Configuración de Usuarios
    defaultUserRole: 'tenant',
    userApprovalRequired: false,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30,
    passwordExpiryDays: 90,
    sessionTimeout: 60,
    allowSocialLogin: false,
    socialProviders: [],

    // Configuración de Comisiones
    defaultCommissionRate: 5.0,
    commissionStructure: 'percentage',
    minimumCommissionAmount: 10000,
    commissionPaymentMethod: 'bank_transfer',
    commissionSchedule: 'monthly',

    // Configuración de Notificaciones
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    inAppNotifications: true,
    newPropertyAlerts: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    supportAlerts: true,
    commissionAlerts: true,

    // Configuración de Seguridad
    twoFactorAuth: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    passwordHistoryCount: 5,
    sessionTimeoutMinutes: 60,
    loginNotifications: true,
    ipRestrictionEnabled: false,
    allowedIPs: [],

    // Configuración de Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@rent360.cl',
    fromName: 'Rent360',
    encryption: 'tls',
    emailTemplatesEnabled: true,

    // Configuración de Pagos
    paymentsEnabled: false,
    paymentProviders: [],
    defaultPaymentMethod: 'bank_transfer',
    autoPaymentProcessing: true,
    paymentRetryAttempts: 3,
    latePaymentFee: 5000,
    latePaymentGracePeriod: 5,

    // Configuración de Khipu
    khipuEnabled: false,
    khipuReceiverId: '',
    khipuSecretKey: '',
    khipuNotificationToken: '',
    khipuEnvironment: 'test',

    // Configuración específica para Runners
    runnerPayoutsEnabled: true,
    runnerBaseRatePerMinute: 500,
    runnerPremiumPropertyBonus: 200,
    runnerPremiumPropertyThreshold: 1000000,
    runnerVisitTypeMultipliers: {
      regular: 1.0,
      premium: 1.5,
      express: 1.2,
    },
    runnerMinimumPayout: 5000,
    runnerMaximumDailyPayout: 500000,
    runnerRequireManualApproval: true,
    runnerApprovalThreshold: 50000,
    runnerFraudDetectionEnabled: true,
    runnerPayoutSchedule: 'weekly',
    runnerCutoffDay: 5,
    runnerSupportedPaymentMethods: ['bank_transfer', 'paypal'],
    runnerRequireBankVerification: true,
    runnerRequireKYC: false,
    runnerPlatformFeePercentage: 5,

    // Configuración específica para Proveedores de Mantenimiento
    maintenanceProviderPayoutsEnabled: true,
    maintenanceProviderCommissionPercentage: 10,
    maintenanceProviderGracePeriodDays: 15,
    maintenanceProviderMinimumPayout: 10000,
    maintenanceProviderMaximumDailyPayout: 1000000,
    maintenanceProviderRequireManualApproval: false,
    maintenanceProviderApprovalThreshold: 100000,
    maintenanceProviderPayoutSchedule: 'weekly',
    maintenanceProviderSupportedPaymentMethods: ['bank_transfer'],
    maintenanceProviderRequireBankVerification: true,

    // Configuración específica para Proveedores de Servicios
    serviceProviderPayoutsEnabled: true,
    serviceProviderCommissionPercentage: 8,
    serviceProviderGracePeriodDays: 7,
    serviceProviderMinimumPayout: 5000,
    serviceProviderMaximumDailyPayout: 500000,
    serviceProviderRequireManualApproval: false,
    serviceProviderApprovalThreshold: 50000,
    serviceProviderPayoutSchedule: 'weekly',
    serviceProviderSupportedPaymentMethods: ['bank_transfer', 'cash'],
    serviceProviderRequireBankVerification: true,

    // Configuración de Integraciones
    googleMapsEnabled: true,
    googleAnalyticsEnabled: false,
    facebookPixelEnabled: false,
    webhookEnabled: false,
    webhookUrl: '',
    apiEnabled: false,
    apiKey: '',
    crmIntegration: false,
    crmProvider: '',

    // Configuración Avanzada
    debugMode: false,
    logLevel: 'error',
    cacheEnabled: true,
    cacheTimeout: 3600,
    backupEnabled: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    theme: 'light',
    customCSS: '',

    // Configuración de UI/UX
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    accentColor: '#10B981',
    borderRadius: 8,
    fontSize: 'medium',
    animationsEnabled: true,
    darkModeEnabled: false,
    mobileResponsive: true,

    // Configuración de Rendimiento
    imageCompressionEnabled: true,
    imageQuality: 80,
    lazyLoadingEnabled: true,
    cachingEnabled: true,
    minificationEnabled: true,
    cdnEnabled: false,
    cdnUrl: '',

    // Configuración Legal
    termsOfServiceRequired: true,
    privacyPolicyRequired: true,
    cookieConsentEnabled: true,
    gdprCompliance: true,
    dataRetentionDays: 365,
    autoDeleteInactiveUsers: false,
    inactiveUserDays: 180,

    // Configuración del Footer
    footerDescription:
      'Plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos y profesionales del sector inmobiliario.',
    footerEmail: 'contacto@rent360.cl',
    footerPhone: '+56 9 1234 5678',
    footerAddress: 'Santiago, Chile',
    footerCopyright: 'Desarrollado con ❤️ para el sector inmobiliario chileno',
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    cookiesUrl: '/cookies',
    footerEnabled: true,
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }

        // Load settings
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();

          // Function to safely convert settings, filtering out null/undefined values
          const processSettingsData = (apiSettings: any) => {
            const processed: any = {};

            // Helper function to safely get numeric values
            const safeNumber = (value: any, defaultValue: number): number => {
              if (value === null || value === undefined || value === '') {
                return defaultValue;
              }
              const num = Number(value);
              return isNaN(num) ? defaultValue : num;
            };

            // Helper function to safely get string values
            const safeString = (value: any, defaultValue: string): string => {
              return value === null || value === undefined ? defaultValue : String(value);
            };

            // Helper function to safely get boolean values
            const safeBoolean = (value: any, defaultValue: boolean): boolean => {
              return value === null || value === undefined ? defaultValue : Boolean(value);
            };

            // Process each category
            Object.keys(apiSettings).forEach(category => {
              if (!processed[category]) {
                processed[category] = {};
              }

              Object.keys(apiSettings[category]).forEach(key => {
                const settingData = apiSettings[category][key];
                if (settingData && settingData.value !== null && settingData.value !== undefined) {
                  // Convert based on expected type
                  if (typeof settingData.value === 'number' || !isNaN(Number(settingData.value))) {
                    processed[category][key] = Number(settingData.value);
                  } else if (
                    typeof settingData.value === 'boolean' ||
                    settingData.value === 'true' ||
                    settingData.value === 'false'
                  ) {
                    processed[category][key] =
                      settingData.value === 'true' || settingData.value === true;
                  } else {
                    processed[category][key] = settingData.value;
                  }
                }
              });
            });

            return processed;
          };

          const processedSettings = processSettingsData(settingsData.settings);
          // Merge with default settings, but only override with valid values
          setSettings(prev => {
            const merged = { ...prev } as any;
            Object.keys(processedSettings).forEach(category => {
              if (!merged[category]) {
                merged[category] = {};
              }
              Object.keys(processedSettings[category]).forEach(key => {
                const value = processedSettings[category][key];
                if (value !== null && value !== undefined && !isNaN(value)) {
                  merged[category] = { ...merged[category], [key]: value };
                }
              });
            });
            return merged;
          });
        }

        // Load email templates
        const templatesResponse = await fetch('/api/admin/email-templates');
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setEmailTemplates(templatesData.templates || []);
        } else {
          // Initialize with default templates
          const defaultTemplates: EmailTemplate[] = [
            {
              id: '1',
              name: 'Bienvenida de Usuario',
              subject: '¡Bienvenido a Rent360!',
              content: `¡Hola {{userName}}!

Bienvenido a Rent360, tu plataforma de alquiler de propiedades en Chile.

Estamos emocionados de tenerte con nosotros. Aquí podrás:
- Encontrar la propiedad perfecta para ti
- Gestionar tus contratos de manera segura
- Recibir soporte personalizado

Tu cuenta ha sido activada exitosamente.

¡Comienza explorando propiedades disponibles!

Saludos cordiales,
El equipo de Rent360`,
              variables: ['userName'],
              category: 'welcome',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Confirmación de Contrato',
              subject: 'Contrato confirmado - {{propertyTitle}}',
              content: `¡Hola {{userName}}!

Tu contrato para la propiedad "{{propertyTitle}}" ha sido confirmado exitosamente.

Detalles del contrato:
- Propiedad: {{propertyTitle}}
- Dirección: {{propertyAddress}}
- Monto mensual: {{monthlyRent}}
- Fecha de inicio: {{startDate}}
- Fecha de término: {{endDate}}

Puedes revisar todos los detalles en tu panel de usuario.

Si tienes alguna pregunta, no dudes en contactarnos.

¡Felicitaciones por tu nueva propiedad!

Saludos cordiales,
El equipo de Rent360`,
              variables: [
                'userName',
                'propertyTitle',
                'propertyAddress',
                'monthlyRent',
                'startDate',
                'endDate',
              ],
              category: 'transaction',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '3',
              name: 'Recordatorio de Pago',
              subject: 'Recordatorio: Pago pendiente - {{propertyTitle}}',
              content: `Hola {{userName}},

Te recordamos que tienes un pago pendiente para tu propiedad "{{propertyTitle}}".

Detalles del pago:
- Monto: {{amount}}
- Fecha límite: {{dueDate}}
- Propiedad: {{propertyTitle}}

Por favor, realiza el pago a tiempo para evitar cargos adicionales.

Si ya realizaste el pago, puedes ignorar este mensaje.

¿Necesitas ayuda? Contáctanos.

Saludos cordiales,
El equipo de Rent360`,
              variables: ['userName', 'propertyTitle', 'amount', 'dueDate'],
              category: 'notification',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '4',
              name: 'Solicitud de Mantenimiento Recibida',
              subject: 'Solicitud de mantenimiento recibida - {{propertyTitle}}',
              content: `Hola {{userName}},

Hemos recibido tu solicitud de mantenimiento para la propiedad "{{propertyTitle}}".

Detalles de la solicitud:
- Tipo: {{maintenanceType}}
- Descripción: {{description}}
- Prioridad: {{priority}}
- ID de solicitud: {{requestId}}

Un proveedor de servicios será asignado pronto y se pondrá en contacto contigo para programar la visita.

Tiempo estimado de respuesta: 24-48 horas.

Si tienes alguna urgencia adicional, por favor contáctanos directamente.

Gracias por mantener tu propiedad en óptimas condiciones.

Saludos cordiales,
El equipo de Rent360`,
              variables: [
                'userName',
                'propertyTitle',
                'maintenanceType',
                'description',
                'priority',
                'requestId',
              ],
              category: 'support',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '5',
              name: 'Nueva Propiedad Disponible',
              subject: '¡Nueva propiedad disponible en tu zona!',
              content: `¡Hola {{userName}}!

Tenemos una nueva propiedad que podría interesarte:

🏠 {{propertyTitle}}
📍 {{propertyAddress}}
💰 {{monthlyRent}} mensual
🛏️ {{bedrooms}} dormitorio(s), 🛁 {{bathrooms}} baño(s)

Esta propiedad cumple con tus criterios de búsqueda y está disponible ahora mismo.

¿Te interesa conocer más detalles? Visita nuestra plataforma y agenda una visita virtual.

¡No pierdas la oportunidad!

Saludos cordiales,
El equipo de Rent360`,
              variables: [
                'userName',
                'propertyTitle',
                'propertyAddress',
                'monthlyRent',
                'bedrooms',
                'bathrooms',
              ],
              category: 'marketing',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
          setEmailTemplates(defaultTemplates);
        }
      } catch (error) {
        logger.error('Error loading data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert('Configuración guardada exitosamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'properties', label: 'Propiedades', icon: Building },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'commissions', label: 'Comisiones', icon: CreditCard },
    { id: 'runners', label: 'Runners', icon: User },
    { id: 'providers', label: 'Proveedores', icon: Wrench },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'email-templates', label: 'Plantillas Email', icon: FileText },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'integrations', label: 'Integraciones', icon: Link },
    { id: 'footer', label: 'Footer', icon: FileText },
    { id: 'advanced', label: 'Avanzado', icon: Zap },
    { id: 'ui', label: 'UI/UX', icon: Palette },
    { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
    { id: 'legal', label: 'Legal', icon: FileText },
  ];

  // Email Templates functions
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    try {
      setEmailTemplates(prev => prev.filter(t => t.id !== templateId));
      // Here you would make an API call to delete the template
    } catch (error) {
      logger.error('Error deleting template:', { error });
    }
  };

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        setEmailTemplates(prev =>
          prev.map(t =>
            t.id === selectedTemplate.id
              ? { ...t, ...templateData, updatedAt: new Date().toISOString() }
              : t
          )
        );
      } else {
        // Create new template
        const newTemplate: EmailTemplate = {
          id: String(Date.now()),
          name: templateData.name || '',
          subject: templateData.subject || '',
          content: templateData.content || '',
          variables: templateData.variables || [],
          category: templateData.category || 'custom',
          isActive: templateData.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEmailTemplates(prev => [...prev, newTemplate]);
      }

      setShowTemplateModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      logger.error('Error saving template:', { error });
    }
  };

  const handleToggleTemplateStatus = (templateId: string) => {
    setEmailTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const getFilteredTemplates = () => {
    let filtered = emailTemplates;

    if (templateCategoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === templateCategoryFilter);
    }

    if (templateSearch) {
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
          t.subject.toLowerCase().includes(templateSearch.toLowerCase()) ||
          t.content.toLowerCase().includes(templateSearch.toLowerCase())
      );
    }

    return filtered;
  };

  const getCategoryLabel = (category: EmailTemplate['category']) => {
    const labels = {
      welcome: 'Bienvenida',
      notification: 'Notificación',
      marketing: 'Marketing',
      transaction: 'Transacción',
      support: 'Soporte',
      custom: 'Personalizado',
    };
    return labels[category];
  };

  const getCategoryColor = (category: EmailTemplate['category']) => {
    const colors = {
      welcome: 'bg-green-100 text-green-800',
      notification: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      transaction: 'bg-orange-100 text-orange-800',
      support: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  const renderGeneralSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Información del Sitio
          </CardTitle>
          <CardDescription>Configuración básica del sitio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sitio</label>
            <Input
              value={settings.siteName}
              onChange={e => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL del Sitio</label>
            <Input
              value={settings.siteUrl}
              onChange={e => setSettings({ ...settings, siteUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Administración
            </label>
            <Input
              type="email"
              value={settings.adminEmail}
              onChange={e => setSettings({ ...settings, adminEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email de Soporte</label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
          </CardTitle>
          <CardDescription>Opciones de funcionamiento del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modo Mantenimiento</div>
              <div className="text-sm text-gray-600">Desactiva el sitio para mantenimiento</div>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={checked => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Permitir Registros</div>
              <div className="text-sm text-gray-600">Permite que nuevos usuarios se registren</div>
            </div>
            <Switch
              checked={settings.allowRegistrations}
              onCheckedChange={checked => setSettings({ ...settings, allowRegistrations: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Verificación de Email Requerida</div>
              <div className="text-sm text-gray-600">Los usuarios deben verificar su email</div>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={checked =>
                setSettings({ ...settings, requireEmailVerification: checked })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Imágenes por Propiedad
            </label>
            <Input
              type="number"
              value={settings.maxPropertyImages}
              onChange={e =>
                setSettings({ ...settings, maxPropertyImages: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño Máximo de Archivo (MB)
            </label>
            <Input
              type="number"
              value={settings.maxFileSize}
              onChange={e => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configuración Regional
          </CardTitle>
          <CardDescription>Preferencias de idioma y moneda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            <Select
              value={settings.currency}
              onValueChange={value => setSettings({ ...settings, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
            <Select
              value={settings.timezone}
              onValueChange={value => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Santiago">Santiago</SelectItem>
                <SelectItem value="America/Lima">Lima</SelectItem>
                <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <Select
              value={settings.language}
              onValueChange={value => setSettings({ ...settings, language: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPropertySettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Configuración de Propiedades
          </CardTitle>
          <CardDescription>Opciones para el manejo de propiedades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Predeterminado
            </label>
            <Select
              value={settings.defaultPropertyStatus}
              onValueChange={value => setSettings({ ...settings, defaultPropertyStatus: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="RENTED">Arrendado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Aprobar Propiedades Automáticamente</div>
              <div className="text-sm text-gray-600">Las propiedades se publican sin revisión</div>
            </div>
            <Switch
              checked={settings.autoApproveProperties}
              onCheckedChange={checked =>
                setSettings({ ...settings, autoApproveProperties: checked })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de Expiración de Propiedades
            </label>
            <Input
              type="number"
              value={settings.propertyExpiryDays}
              onChange={e =>
                setSettings({ ...settings, propertyExpiryDays: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite de Propiedades Destacadas
            </label>
            <Input
              type="number"
              value={settings.featuredPropertyLimit}
              onChange={e =>
                setSettings({ ...settings, featuredPropertyLimit: parseInt(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Medios y Tours Virtuales
          </CardTitle>
          <CardDescription>Configuración de imágenes, videos y tours virtuales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Permitir Videos en Propiedades</div>
              <div className="text-sm text-gray-600">Los usuarios pueden subir videos</div>
            </div>
            <Switch
              checked={settings.allowPropertyVideos}
              onCheckedChange={checked =>
                setSettings({ ...settings, allowPropertyVideos: checked })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Videos por Propiedad
            </label>
            <Input
              type="number"
              value={settings.maxPropertyVideos}
              onChange={e =>
                setSettings({ ...settings, maxPropertyVideos: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Tours Virtuales Habilitados</div>
              <div className="text-sm text-gray-600">Permitir tours virtuales 360°</div>
            </div>
            <Switch
              checked={settings.virtualTourEnabled}
              onCheckedChange={checked => setSettings({ ...settings, virtualTourEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Mapa de Propiedades Habilitado</div>
              <div className="text-sm text-gray-600">Mostrar propiedades en mapa</div>
            </div>
            <Switch
              checked={settings.propertyMapEnabled}
              onCheckedChange={checked => setSettings({ ...settings, propertyMapEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Configuración de Usuarios
          </CardTitle>
          <CardDescription>Opciones para el manejo de usuarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol Predeterminado
            </label>
            <Select
              value={settings.defaultUserRole}
              onValueChange={value => setSettings({ ...settings, defaultUserRole: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Inquilino</SelectItem>
                <SelectItem value="owner">Propietario</SelectItem>
                <SelectItem value="broker">Corredor</SelectItem>
                <SelectItem value="runner">Runner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Aprobación de Usuarios Requerida</div>
              <div className="text-sm text-gray-600">Los usuarios requieren aprobación manual</div>
            </div>
            <Switch
              checked={settings.userApprovalRequired}
              onCheckedChange={checked =>
                setSettings({ ...settings, userApprovalRequired: checked })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Intentos de Login
            </label>
            <Input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={e =>
                setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración de Bloqueo (minutos)
            </label>
            <Input
              type="number"
              value={settings.accountLockoutDuration}
              onChange={e =>
                setSettings({ ...settings, accountLockoutDuration: parseInt(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Contraseñas y Sesiones
          </CardTitle>
          <CardDescription>Configuración de seguridad de contraseñas y sesiones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiración de Contraseña (días)
            </label>
            <Input
              type="number"
              value={settings.passwordExpiryDays}
              onChange={e =>
                setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de Sesión (minutos)
            </label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Permitir Login Social</div>
              <div className="text-sm text-gray-600">Login con redes sociales</div>
            </div>
            <Switch
              checked={settings.allowSocialLogin}
              onCheckedChange={checked => setSettings({ ...settings, allowSocialLogin: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommissionSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Configuración de Comisiones
          </CardTitle>
          <CardDescription>Opciones para el cálculo de comisiones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Comisión Predeterminada (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={settings.defaultCommissionRate}
              onChange={e =>
                setSettings({ ...settings, defaultCommissionRate: parseFloat(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estructura de Comisión
            </label>
            <Select
              value={settings.commissionStructure}
              onValueChange={(value: any) =>
                setSettings({ ...settings, commissionStructure: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fijo</SelectItem>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="tiered">Por Niveles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Mínimo de Comisión
            </label>
            <Input
              type="number"
              value={settings.minimumCommissionAmount}
              onChange={e =>
                setSettings({ ...settings, minimumCommissionAmount: parseInt(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pagos de Comisiones
          </CardTitle>
          <CardDescription>Configuración de pagos a corredores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
            <Select
              value={settings.commissionPaymentMethod}
              onValueChange={value => setSettings({ ...settings, commissionPaymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programa de Pagos
            </label>
            <Select
              value={settings.commissionSchedule}
              onValueChange={(value: any) =>
                setSettings({ ...settings, commissionSchedule: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Inmediato</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Canales de Notificación
          </CardTitle>
          <CardDescription>Configura los métodos de notificación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Notificaciones por Email</div>
                <div className="text-sm text-gray-600">
                  Enviar notificaciones al correo electrónico
                </div>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={checked => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Notificaciones SMS</div>
                <div className="text-sm text-gray-600">
                  Enviar notificaciones por mensaje de texto
                </div>
              </div>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={checked => setSettings({ ...settings, smsNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Notificaciones Push</div>
                <div className="text-sm text-gray-600">Notificaciones en tiempo real</div>
              </div>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={checked => setSettings({ ...settings, pushNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Notificaciones en App</div>
                <div className="text-sm text-gray-600">Notificaciones dentro de la plataforma</div>
              </div>
            </div>
            <Switch
              checked={settings.inAppNotifications}
              onCheckedChange={checked => setSettings({ ...settings, inAppNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Tipos de Notificaciones
          </CardTitle>
          <CardDescription>Selecciona qué eventos generan notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Alertas de Nuevas Propiedades</div>
                <div className="text-sm text-gray-600">Notificar sobre nuevas propiedades</div>
              </div>
            </div>
            <Switch
              checked={settings.newPropertyAlerts}
              onCheckedChange={checked => setSettings({ ...settings, newPropertyAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Recordatorios de Pago</div>
                <div className="text-sm text-gray-600">Notificar sobre pagos pendientes</div>
              </div>
            </div>
            <Switch
              checked={settings.paymentReminders}
              onCheckedChange={checked => setSettings({ ...settings, paymentReminders: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Alertas de Mantenimiento</div>
                <div className="text-sm text-gray-600">
                  Notificar sobre solicitudes de mantenimiento
                </div>
              </div>
            </div>
            <Switch
              checked={settings.maintenanceAlerts}
              onCheckedChange={checked => setSettings({ ...settings, maintenanceAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Alertas de Soporte</div>
                <div className="text-sm text-gray-600">
                  Notificar sobre nuevos tickets de soporte
                </div>
              </div>
            </div>
            <Switch
              checked={settings.supportAlerts}
              onCheckedChange={checked => setSettings({ ...settings, supportAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Alertas de Comisiones</div>
                <div className="text-sm text-gray-600">Notificar sobre pagos de comisiones</div>
              </div>
            </div>
            <Switch
              checked={settings.commissionAlerts}
              onCheckedChange={checked => setSettings({ ...settings, commissionAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRunnerSettings = () => (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuración General de Runners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Configuración General de Runners
            </CardTitle>
            <CardDescription>
              Configuración básica del sistema de pagos para runners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Pagos de Runners Habilitados</div>
                <div className="text-sm text-gray-600">
                  Activar/desactivar el sistema de pagos para runners
                </div>
              </div>
              <Switch
                checked={settings.runnerPayoutsEnabled}
                onCheckedChange={checked =>
                  setSettings({ ...settings, runnerPayoutsEnabled: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa Base por Minuto ($)
              </label>
              <Input
                type="number"
                value={settings.runnerBaseRatePerMinute}
                onChange={e =>
                  setSettings({ ...settings, runnerBaseRatePerMinute: Number(e.target.value) })
                }
                placeholder="500"
              />
              <p className="text-sm text-gray-500 mt-1">Monto base pagado por minuto de visita</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bono Propiedades Premium ($)
              </label>
              <Input
                type="number"
                value={settings.runnerPremiumPropertyBonus}
                onChange={e =>
                  setSettings({ ...settings, runnerPremiumPropertyBonus: Number(e.target.value) })
                }
                placeholder="200"
              />
              <p className="text-sm text-gray-500 mt-1">Bono adicional por propiedades premium</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral Propiedad Premium ($)
              </label>
              <Input
                type="number"
                value={settings.runnerPremiumPropertyThreshold}
                onChange={e =>
                  setSettings({
                    ...settings,
                    runnerPremiumPropertyThreshold: Number(e.target.value),
                  })
                }
                placeholder="1000000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Valor mínimo para considerar propiedad premium
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Multiplicadores por Tipo de Visita */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Multiplicadores por Tipo de Visita
            </CardTitle>
            <CardDescription>Factores de multiplicación según el tipo de visita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visita Regular (multiplicador)
              </label>
              <Input
                type="number"
                step="0.1"
                value={settings.runnerVisitTypeMultipliers.regular}
                onChange={e =>
                  setSettings({
                    ...settings,
                    runnerVisitTypeMultipliers: {
                      ...settings.runnerVisitTypeMultipliers,
                      regular: Number(e.target.value),
                    },
                  })
                }
                placeholder="1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visita Premium (multiplicador)
              </label>
              <Input
                type="number"
                step="0.1"
                value={settings.runnerVisitTypeMultipliers.premium}
                onChange={e =>
                  setSettings({
                    ...settings,
                    runnerVisitTypeMultipliers: {
                      ...settings.runnerVisitTypeMultipliers,
                      premium: Number(e.target.value),
                    },
                  })
                }
                placeholder="1.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visita Express (multiplicador)
              </label>
              <Input
                type="number"
                step="0.1"
                value={settings.runnerVisitTypeMultipliers.express}
                onChange={e =>
                  setSettings({
                    ...settings,
                    runnerVisitTypeMultipliers: {
                      ...settings.runnerVisitTypeMultipliers,
                      express: Number(e.target.value),
                    },
                  })
                }
                placeholder="1.2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Límites y Validaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Límites y Validaciones
            </CardTitle>
            <CardDescription>Configuración de límites de pago y validaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Mínimo ($)
              </label>
              <Input
                type="number"
                value={settings.runnerMinimumPayout}
                onChange={e =>
                  setSettings({ ...settings, runnerMinimumPayout: Number(e.target.value) })
                }
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Máximo Diario ($)
              </label>
              <Input
                type="number"
                value={settings.runnerMaximumDailyPayout}
                onChange={e =>
                  setSettings({ ...settings, runnerMaximumDailyPayout: Number(e.target.value) })
                }
                placeholder="500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral de Aprobación Manual ($)
              </label>
              <Input
                type="number"
                value={settings.runnerApprovalThreshold}
                onChange={e =>
                  setSettings({ ...settings, runnerApprovalThreshold: Number(e.target.value) })
                }
                placeholder="50000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Pagos sobre este monto requieren aprobación manual
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Aprobación Manual Requerida</div>
                <div className="text-sm text-gray-600">
                  Todos los pagos requieren aprobación manual del administrador
                </div>
              </div>
              <Switch
                checked={settings.runnerRequireManualApproval}
                onCheckedChange={checked =>
                  setSettings({ ...settings, runnerRequireManualApproval: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Programación y Métodos de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programación y Métodos de Pago
            </CardTitle>
            <CardDescription>
              Configuración del calendario de pagos y métodos soportados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programa de Pagos
              </label>
              <Select
                value={settings.runnerPayoutSchedule}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, runnerPayoutSchedule: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Inmediato</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.runnerPayoutSchedule === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día de Corte del Mes
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.runnerCutoffDay}
                  onChange={e =>
                    setSettings({ ...settings, runnerCutoffDay: Number(e.target.value) })
                  }
                  placeholder="5"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métodos de Pago Soportados
              </label>
              <div className="space-y-2">
                {[
                  { value: 'bank_transfer', label: 'Transferencia Bancaria' },
                  { value: 'paypal', label: 'PayPal' },
                ].map(method => (
                  <div key={method.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`runner-${method.value}`}
                      checked={settings.runnerSupportedPaymentMethods.includes(method.value)}
                      onChange={e => {
                        const methods = e.target.checked
                          ? [...settings.runnerSupportedPaymentMethods, method.value]
                          : settings.runnerSupportedPaymentMethods.filter(m => m !== method.value);
                        setSettings({ ...settings, runnerSupportedPaymentMethods: methods });
                      }}
                    />
                    <label htmlFor={`runner-${method.value}`} className="text-sm">
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuración de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configuración de Seguridad
            </CardTitle>
            <CardDescription>
              Requisitos de seguridad para procesar pagos de runners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Verificación Bancaria Requerida</div>
                <div className="text-sm text-gray-600">
                  Requiere cuenta bancaria verificada para procesar pagos
                </div>
              </div>
              <Switch
                checked={settings.runnerRequireBankVerification}
                onCheckedChange={checked =>
                  setSettings({ ...settings, runnerRequireBankVerification: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">KYC Requerido</div>
                <div className="text-sm text-gray-600">
                  Requiere verificación de identidad (Know Your Customer)
                </div>
              </div>
              <Switch
                checked={settings.runnerRequireKYC}
                onCheckedChange={checked => setSettings({ ...settings, runnerRequireKYC: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Detección de Fraude Habilitada</div>
                <div className="text-sm text-gray-600">
                  Activar análisis de fraude en transacciones
                </div>
              </div>
              <Switch
                checked={settings.runnerFraudDetectionEnabled}
                onCheckedChange={checked =>
                  setSettings({ ...settings, runnerFraudDetectionEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Comisión de Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Comisión de Plataforma
            </CardTitle>
            <CardDescription>
              Configuración de la comisión retenida por la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje de Comisión (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={settings.runnerPlatformFeePercentage}
                onChange={e =>
                  setSettings({ ...settings, runnerPlatformFeePercentage: Number(e.target.value) })
                }
                placeholder="5"
              />
              <p className="text-sm text-gray-500 mt-1">
                Porcentaje retenido por la plataforma en cada pago
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Ejemplo de Cálculo</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Ganancia Bruta: $15.000</div>
                <div>
                  Comisión ({settings.runnerPlatformFeePercentage}%): $
                  {((15000 * settings.runnerPlatformFeePercentage) / 100).toLocaleString()}
                </div>
                <div>
                  <strong>
                    Pago Neto: $
                    {(15000 * (1 - settings.runnerPlatformFeePercentage / 100)).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProvidersSettings = () => (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuración de Proveedores de Mantenimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Proveedores de Mantenimiento
            </CardTitle>
            <CardDescription>
              Configuración de pagos y comisiones para proveedores de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Pagos Automáticos Habilitados</div>
                <div className="text-sm text-gray-600">
                  Procesar pagos automáticamente a proveedores de mantenimiento
                </div>
              </div>
              <Switch
                checked={settings.maintenanceProviderPayoutsEnabled}
                onCheckedChange={checked =>
                  setSettings({ ...settings, maintenanceProviderPayoutsEnabled: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión de Plataforma (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={settings.maintenanceProviderCommissionPercentage}
                onChange={e =>
                  setSettings({
                    ...settings,
                    maintenanceProviderCommissionPercentage: Number(e.target.value),
                  })
                }
                placeholder="10"
              />
              <p className="text-sm text-gray-500 mt-1">Porcentaje retenido por la plataforma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Gracia (días)
              </label>
              <Input
                type="number"
                min="0"
                max="90"
                value={settings.maintenanceProviderGracePeriodDays}
                onChange={e =>
                  setSettings({
                    ...settings,
                    maintenanceProviderGracePeriodDays: Number(e.target.value),
                  })
                }
                placeholder="15"
              />
              <p className="text-sm text-gray-500 mt-1">
                Días sin cobrar comisión después del registro
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Mínimo ($)
              </label>
              <Input
                type="number"
                value={settings.maintenanceProviderMinimumPayout}
                onChange={e =>
                  setSettings({
                    ...settings,
                    maintenanceProviderMinimumPayout: Number(e.target.value),
                  })
                }
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Máximo Diario ($)
              </label>
              <Input
                type="number"
                value={settings.maintenanceProviderMaximumDailyPayout}
                onChange={e =>
                  setSettings({
                    ...settings,
                    maintenanceProviderMaximumDailyPayout: Number(e.target.value),
                  })
                }
                placeholder="1000000"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Aprobación Manual Requerida</div>
                <div className="text-sm text-gray-600">
                  Todos los pagos requieren aprobación manual
                </div>
              </div>
              <Switch
                checked={settings.maintenanceProviderRequireManualApproval}
                onCheckedChange={checked =>
                  setSettings({ ...settings, maintenanceProviderRequireManualApproval: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral de Aprobación Manual ($)
              </label>
              <Input
                type="number"
                value={settings.maintenanceProviderApprovalThreshold}
                onChange={e =>
                  setSettings({
                    ...settings,
                    maintenanceProviderApprovalThreshold: Number(e.target.value),
                  })
                }
                placeholder="100000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Proveedores de Servicios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Proveedores de Servicios
            </CardTitle>
            <CardDescription>
              Configuración de pagos y comisiones para proveedores de servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Pagos Automáticos Habilitados</div>
                <div className="text-sm text-gray-600">
                  Procesar pagos automáticamente a proveedores de servicios
                </div>
              </div>
              <Switch
                checked={settings.serviceProviderPayoutsEnabled}
                onCheckedChange={checked =>
                  setSettings({ ...settings, serviceProviderPayoutsEnabled: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión de Plataforma (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={settings.serviceProviderCommissionPercentage}
                onChange={e =>
                  setSettings({
                    ...settings,
                    serviceProviderCommissionPercentage: Number(e.target.value),
                  })
                }
                placeholder="8"
              />
              <p className="text-sm text-gray-500 mt-1">Porcentaje retenido por la plataforma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Gracia (días)
              </label>
              <Input
                type="number"
                min="0"
                max="90"
                value={settings.serviceProviderGracePeriodDays}
                onChange={e =>
                  setSettings({
                    ...settings,
                    serviceProviderGracePeriodDays: Number(e.target.value),
                  })
                }
                placeholder="7"
              />
              <p className="text-sm text-gray-500 mt-1">
                Días sin cobrar comisión después del registro
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Mínimo ($)
              </label>
              <Input
                type="number"
                value={settings.serviceProviderMinimumPayout}
                onChange={e =>
                  setSettings({ ...settings, serviceProviderMinimumPayout: Number(e.target.value) })
                }
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pago Máximo Diario ($)
              </label>
              <Input
                type="number"
                value={settings.serviceProviderMaximumDailyPayout}
                onChange={e =>
                  setSettings({
                    ...settings,
                    serviceProviderMaximumDailyPayout: Number(e.target.value),
                  })
                }
                placeholder="500000"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Aprobación Manual Requerida</div>
                <div className="text-sm text-gray-600">
                  Todos los pagos requieren aprobación manual
                </div>
              </div>
              <Switch
                checked={settings.serviceProviderRequireManualApproval}
                onCheckedChange={checked =>
                  setSettings({ ...settings, serviceProviderRequireManualApproval: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral de Aprobación Manual ($)
              </label>
              <Input
                type="number"
                value={settings.serviceProviderApprovalThreshold}
                onChange={e =>
                  setSettings({
                    ...settings,
                    serviceProviderApprovalThreshold: Number(e.target.value),
                  })
                }
                placeholder="50000"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Programación de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programación de Pagos
            </CardTitle>
            <CardDescription>
              Configuración del calendario de pagos para proveedores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Proveedores de Mantenimiento</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programa de Pagos
                  </label>
                  <Select
                    value={settings.maintenanceProviderPayoutSchedule}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, maintenanceProviderPayoutSchedule: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Inmediato</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Métodos de Pago Soportados
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'bank_transfer', label: 'Transferencia Bancaria' },
                      { value: 'cash', label: 'Efectivo' },
                      { value: 'check', label: 'Cheque' },
                    ].map(method => (
                      <div key={method.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`maintenance-${method.value}`}
                          checked={settings.maintenanceProviderSupportedPaymentMethods.includes(
                            method.value
                          )}
                          onChange={e => {
                            const methods = e.target.checked
                              ? [
                                  ...settings.maintenanceProviderSupportedPaymentMethods,
                                  method.value,
                                ]
                              : settings.maintenanceProviderSupportedPaymentMethods.filter(
                                  m => m !== method.value
                                );
                            setSettings({
                              ...settings,
                              maintenanceProviderSupportedPaymentMethods: methods,
                            });
                          }}
                        />
                        <label htmlFor={`maintenance-${method.value}`} className="text-sm">
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Proveedores de Servicios</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programa de Pagos
                  </label>
                  <Select
                    value={settings.serviceProviderPayoutSchedule}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, serviceProviderPayoutSchedule: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Inmediato</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Métodos de Pago Soportados
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'bank_transfer', label: 'Transferencia Bancaria' },
                      { value: 'cash', label: 'Efectivo' },
                      { value: 'check', label: 'Cheque' },
                    ].map(method => (
                      <div key={method.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`service-${method.value}`}
                          checked={settings.serviceProviderSupportedPaymentMethods.includes(
                            method.value
                          )}
                          onChange={e => {
                            const methods = e.target.checked
                              ? [...settings.serviceProviderSupportedPaymentMethods, method.value]
                              : settings.serviceProviderSupportedPaymentMethods.filter(
                                  m => m !== method.value
                                );
                            setSettings({
                              ...settings,
                              serviceProviderSupportedPaymentMethods: methods,
                            });
                          }}
                        />
                        <label htmlFor={`service-${method.value}`} className="text-sm">
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configuración de Seguridad
            </CardTitle>
            <CardDescription>
              Requisitos de seguridad para procesar pagos a proveedores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Verificación Bancaria (Mantenimiento)</div>
                <div className="text-sm text-gray-600">Requiere cuenta bancaria verificada</div>
              </div>
              <Switch
                checked={settings.maintenanceProviderRequireBankVerification}
                onCheckedChange={checked =>
                  setSettings({ ...settings, maintenanceProviderRequireBankVerification: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Verificación Bancaria (Servicios)</div>
                <div className="text-sm text-gray-600">Requiere cuenta bancaria verificada</div>
              </div>
              <Switch
                checked={settings.serviceProviderRequireBankVerification}
                onCheckedChange={checked =>
                  setSettings({ ...settings, serviceProviderRequireBankVerification: checked })
                }
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Los proveedores ya incluyen configuración bancaria en el registro</p>
                <p>• La verificación bancaria es opcional para proveedores de servicios</p>
                <p>• Los proveedores de mantenimiento requieren verificación obligatoria</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>Opciones de seguridad y protección</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Autenticación de Dos Factores</div>
              <div className="text-sm text-gray-600">Requerir 2FA para todos los usuarios</div>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={checked => setSettings({ ...settings, twoFactorAuth: checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitud Mínima de Contraseña
            </label>
            <Input
              type="number"
              value={settings.passwordMinLength}
              onChange={e =>
                setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Requerir Mayúsculas</div>
              <div className="text-sm text-gray-600">Las contraseñas deben tener mayúsculas</div>
            </div>
            <Switch
              checked={settings.passwordRequireUppercase}
              onCheckedChange={checked =>
                setSettings({ ...settings, passwordRequireUppercase: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Requerir Números</div>
              <div className="text-sm text-gray-600">Las contraseñas deben tener números</div>
            </div>
            <Switch
              checked={settings.passwordRequireNumbers}
              onCheckedChange={checked =>
                setSettings({ ...settings, passwordRequireNumbers: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Requerir Caracteres Especiales</div>
              <div className="text-sm text-gray-600">
                Las contraseñas deben tener caracteres especiales
              </div>
            </div>
            <Switch
              checked={settings.passwordRequireSpecial}
              onCheckedChange={checked =>
                setSettings({ ...settings, passwordRequireSpecial: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sesiones y Acceso
          </CardTitle>
          <CardDescription>Configuración de sesiones y control de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historial de Contraseñas
            </label>
            <Input
              type="number"
              value={settings.passwordHistoryCount}
              onChange={e =>
                setSettings({ ...settings, passwordHistoryCount: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de Sesión (minutos)
            </label>
            <Input
              type="number"
              value={settings.sessionTimeoutMinutes}
              onChange={e =>
                setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Notificaciones de Login</div>
              <div className="text-sm text-gray-600">Notificar sobre inicios de sesión</div>
            </div>
            <Switch
              checked={settings.loginNotifications}
              onCheckedChange={checked => setSettings({ ...settings, loginNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Restricción por IP</div>
              <div className="text-sm text-gray-600">Limitar acceso por direcciones IP</div>
            </div>
            <Switch
              checked={settings.ipRestrictionEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, ipRestrictionEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración SMTP
          </CardTitle>
          <CardDescription>Configuración del servidor de correo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servidor SMTP</label>
            <Input
              value={settings.smtpHost}
              onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Puerto SMTP</label>
            <Input
              type="number"
              value={settings.smtpPort}
              onChange={e => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario SMTP</label>
            <Input
              value={settings.smtpUsername}
              onChange={e => setSettings({ ...settings, smtpUsername: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña SMTP</label>
            <Input
              type="password"
              value={settings.smtpPassword}
              onChange={e => setSettings({ ...settings, smtpPassword: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración de Envío
          </CardTitle>
          <CardDescription>Opciones de envío de correos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email de Origen</label>
            <Input
              value={settings.fromEmail}
              onChange={e => setSettings({ ...settings, fromEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Origen</label>
            <Input
              value={settings.fromName}
              onChange={e => setSettings({ ...settings, fromName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Encriptación</label>
            <Select
              value={settings.encryption}
              onValueChange={(value: any) => setSettings({ ...settings, encryption: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin Encriptación</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="tls">TLS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Plantillas de Email Habilitadas</div>
              <div className="text-sm text-gray-600">Usar plantillas personalizadas</div>
            </div>
            <Switch
              checked={settings.emailTemplatesEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, emailTemplatesEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Configuración de Pagos
            </CardTitle>
            <CardDescription>Opciones generales de pagos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Pagos Habilitados</div>
                <div className="text-sm text-gray-600">Permitir procesamiento de pagos</div>
              </div>
              <Switch
                checked={settings.paymentsEnabled}
                onCheckedChange={checked => setSettings({ ...settings, paymentsEnabled: checked })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago Predeterminado
              </label>
              <Select
                value={settings.defaultPaymentMethod}
                onValueChange={value => setSettings({ ...settings, defaultPaymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                  <SelectItem value="khipu">Khipu</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Procesamiento Automático</div>
                <div className="text-sm text-gray-600">Procesar pagos automáticamente</div>
              </div>
              <Switch
                checked={settings.autoPaymentProcessing}
                onCheckedChange={checked =>
                  setSettings({ ...settings, autoPaymentProcessing: checked })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intentos de Reintento
              </label>
              <Input
                type="number"
                value={settings.paymentRetryAttempts}
                onChange={e =>
                  setSettings({ ...settings, paymentRetryAttempts: parseInt(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Pagos Tardíos
            </CardTitle>
            <CardDescription>Configuración de penalizaciones por pagos tardíos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa por Pago Tardío
              </label>
              <Input
                type="number"
                value={settings.latePaymentFee}
                onChange={e =>
                  setSettings({ ...settings, latePaymentFee: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Gracia (días)
              </label>
              <Input
                type="number"
                value={settings.latePaymentGracePeriod}
                onChange={e =>
                  setSettings({ ...settings, latePaymentGracePeriod: parseInt(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Khipu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Integración con Khipu
          </CardTitle>
          <CardDescription>
            Configura las credenciales de Khipu para procesar pagos en línea
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Habilitar Khipu</div>
              <div className="text-sm text-gray-600">Activar pagos a través de Khipu</div>
            </div>
            <Switch
              checked={settings.khipuEnabled}
              onCheckedChange={checked => setSettings({ ...settings, khipuEnabled: checked })}
            />
          </div>

          {settings.khipuEnabled && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entorno</label>
                <Select
                  value={settings.khipuEnvironment}
                  onValueChange={(value: any) =>
                    setSettings({ ...settings, khipuEnvironment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Pruebas (Sandbox)</SelectItem>
                    <SelectItem value="production">Producción</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.khipuEnvironment === 'test'
                    ? 'Usa el entorno de pruebas para desarrollo'
                    : 'Usa el entorno de producción para pagos reales'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Receptor (Receiver ID)
                </label>
                <Input
                  value={settings.khipuReceiverId}
                  onChange={e => setSettings({ ...settings, khipuReceiverId: e.target.value })}
                  placeholder="Ej: 123456789"
                />
                <p className="text-xs text-gray-500 mt-1">ID de cuenta de Khipu</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Llave Secreta (Secret Key)
                </label>
                <Input
                  type="password"
                  value={settings.khipuSecretKey}
                  onChange={e => setSettings({ ...settings, khipuSecretKey: e.target.value })}
                  placeholder="Ingresa tu llave secreta"
                />
                <p className="text-xs text-gray-500 mt-1">Mantén esta información segura</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de Notificación
                </label>
                <Input
                  type="password"
                  value={settings.khipuNotificationToken}
                  onChange={e =>
                    setSettings({ ...settings, khipuNotificationToken: e.target.value })
                  }
                  placeholder="Token para notificaciones webhook"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token para verificar notificaciones de Khipu
                </p>
              </div>
            </div>
          )}

          {settings.khipuEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Información Importante</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Las credenciales se guardan de forma segura en el sistema</li>
                    <li>• Usa el entorno de pruebas para desarrollo y pruebas</li>
                    <li>• Configura las URLs de webhook en tu cuenta de Khipu</li>
                    <li>
                      • La URL de notificación es:{' '}
                      <code className="bg-blue-100 px-1 rounded">/api/payments/khipu/notify</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {settings.khipuEnabled && settings.khipuEnvironment === 'production' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Modo Producción</h4>
                  <p className="text-sm text-orange-700">
                    Estás utilizando el entorno de producción. Todos los pagos procesados serán
                    reales y se cobrarán según las tarifas de Khipu.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Integraciones Externas
          </CardTitle>
          <CardDescription>Servicios de terceros integrados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Google Maps Habilitado</div>
              <div className="text-sm text-gray-600">Mostrar mapas de Google</div>
            </div>
            <Switch
              checked={settings.googleMapsEnabled}
              onCheckedChange={checked => setSettings({ ...settings, googleMapsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Google Analytics Habilitado</div>
              <div className="text-sm text-gray-600">Seguimiento de analíticas</div>
            </div>
            <Switch
              checked={settings.googleAnalyticsEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, googleAnalyticsEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Facebook Pixel Habilitado</div>
              <div className="text-sm text-gray-600">Seguimiento de conversiones</div>
            </div>
            <Switch
              checked={settings.facebookPixelEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, facebookPixelEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Integración CRM</div>
              <div className="text-sm text-gray-600">Conectar con sistema CRM</div>
            </div>
            <Switch
              checked={settings.crmIntegration}
              onCheckedChange={checked => setSettings({ ...settings, crmIntegration: checked })}
            />
          </div>

          {settings.crmIntegration && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor CRM</label>
              <Input
                value={settings.crmProvider}
                onChange={e => setSettings({ ...settings, crmProvider: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            API y Webhooks
          </CardTitle>
          <CardDescription>Configuración de API y webhooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">API Habilitada</div>
              <div className="text-sm text-gray-600">Permitir acceso a la API</div>
            </div>
            <Switch
              checked={settings.apiEnabled}
              onCheckedChange={checked => setSettings({ ...settings, apiEnabled: checked })}
            />
          </div>

          {settings.apiEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Clave de API</label>
              <Input
                value={settings.apiKey}
                onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Webhooks Habilitados</div>
              <div className="text-sm text-gray-600">Enviar notificaciones a webhooks</div>
            </div>
            <Switch
              checked={settings.webhookEnabled}
              onCheckedChange={checked => setSettings({ ...settings, webhookEnabled: checked })}
            />
          </div>

          {settings.webhookEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de Webhook</label>
              <Input
                value={settings.webhookUrl}
                onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configuración Avanzada
          </CardTitle>
          <CardDescription>Opciones avanzadas del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modo Depuración</div>
              <div className="text-sm text-gray-600">Habilitar mensajes de depuración</div>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={checked => setSettings({ ...settings, debugMode: checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Log</label>
            <Select
              value={settings.logLevel}
              onValueChange={(value: any) => setSettings({ ...settings, logLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Advertencia</SelectItem>
                <SelectItem value="info">Información</SelectItem>
                <SelectItem value="debug">Depuración</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Caché Habilitado</div>
              <div className="text-sm text-gray-600">Habilitar caché del sistema</div>
            </div>
            <Switch
              checked={settings.cacheEnabled}
              onCheckedChange={checked => setSettings({ ...settings, cacheEnabled: checked })}
            />
          </div>

          {settings.cacheEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de Caché (segundos)
              </label>
              <Input
                type="number"
                value={settings.cacheTimeout}
                onChange={e => setSettings({ ...settings, cacheTimeout: parseInt(e.target.value) })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Respaldo y Mantenimiento
          </CardTitle>
          <CardDescription>Configuración de respaldos automáticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Respaldo Habilitado</div>
              <div className="text-sm text-gray-600">Realizar respaldos automáticos</div>
            </div>
            <Switch
              checked={settings.backupEnabled}
              onCheckedChange={checked => setSettings({ ...settings, backupEnabled: checked })}
            />
          </div>

          {settings.backupEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Respaldo
                </label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value: any) =>
                    setSettings({ ...settings, backupFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retención de Respaldos (días)
                </label>
                <Input
                  type="number"
                  value={settings.backupRetention}
                  onChange={e =>
                    setSettings({ ...settings, backupRetention: parseInt(e.target.value) })
                  }
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
            <Select
              value={settings.theme}
              onValueChange={(value: any) => setSettings({ ...settings, theme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUISettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Colores y Estilos
          </CardTitle>
          <CardDescription>Personalización de la interfaz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.primaryColor}
                onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={settings.primaryColor}
                onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.secondaryColor}
                onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={settings.secondaryColor}
                onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color de Acento</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.accentColor}
                onChange={e => setSettings({ ...settings, accentColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={settings.accentColor}
                onChange={e => setSettings({ ...settings, accentColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radio de Bordes (px)
            </label>
            <Input
              type="number"
              value={settings.borderRadius}
              onChange={e => setSettings({ ...settings, borderRadius: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Comportamiento de la Interfaz
          </CardTitle>
          <CardDescription>Opciones de comportamiento y diseño</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de Fuente</label>
            <Select
              value={settings.fontSize}
              onValueChange={(value: any) => setSettings({ ...settings, fontSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeño</SelectItem>
                <SelectItem value="medium">Mediano</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Animaciones Habilitadas</div>
              <div className="text-sm text-gray-600">Mostrar animaciones y transiciones</div>
            </div>
            <Switch
              checked={settings.animationsEnabled}
              onCheckedChange={checked => setSettings({ ...settings, animationsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modo Oscuro Habilitado</div>
              <div className="text-sm text-gray-600">Permitir tema oscuro</div>
            </div>
            <Switch
              checked={settings.darkModeEnabled}
              onCheckedChange={checked => setSettings({ ...settings, darkModeEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Diseño Responsivo</div>
              <div className="text-sm text-gray-600">Optimizado para móviles</div>
            </div>
            <Switch
              checked={settings.mobileResponsive}
              onCheckedChange={checked => setSettings({ ...settings, mobileResponsive: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Optimización de Imágenes
          </CardTitle>
          <CardDescription>Configuración de compresión y manejo de imágenes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Compresión de Imágenes Habilitada</div>
              <div className="text-sm text-gray-600">Comprimir imágenes automáticamente</div>
            </div>
            <Switch
              checked={settings.imageCompressionEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, imageCompressionEnabled: checked })
              }
            />
          </div>

          {settings.imageCompressionEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad de Imagen (%)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={settings.imageQuality}
                onChange={e => setSettings({ ...settings, imageQuality: parseInt(e.target.value) })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Carga Perezosa Habilitada</div>
              <div className="text-sm text-gray-600">Cargar imágenes bajo demanda</div>
            </div>
            <Switch
              checked={settings.lazyLoadingEnabled}
              onCheckedChange={checked => setSettings({ ...settings, lazyLoadingEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Caché y Optimización
          </CardTitle>
          <CardDescription>Configuración de rendimiento del servidor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Caché Habilitado</div>
              <div className="text-sm text-gray-600">Habilitar caché del navegador</div>
            </div>
            <Switch
              checked={settings.cachingEnabled}
              onCheckedChange={checked => setSettings({ ...settings, cachingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Minificación Habilitada</div>
              <div className="text-sm text-gray-600">Minificar CSS y JavaScript</div>
            </div>
            <Switch
              checked={settings.minificationEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, minificationEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">CDN Habilitado</div>
              <div className="text-sm text-gray-600">Usar Red de Entrega de Contenido</div>
            </div>
            <Switch
              checked={settings.cdnEnabled}
              onCheckedChange={checked => setSettings({ ...settings, cdnEnabled: checked })}
            />
          </div>

          {settings.cdnEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL del CDN</label>
              <Input
                value={settings.cdnUrl}
                onChange={e => setSettings({ ...settings, cdnUrl: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderFooterSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contenido del Footer
          </CardTitle>
          <CardDescription>Personaliza los textos y enlaces del footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Empresa
            </label>
            <Textarea
              value={
                settings.footerDescription ||
                'Plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos y profesionales del sector inmobiliario.'
              }
              onChange={e => setSettings({ ...settings, footerDescription: e.target.value })}
              rows={3}
              placeholder="Descripción de Rent360..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Contacto
              </label>
              <Input
                type="email"
                value={settings.footerEmail || 'contacto@rent360.cl'}
                onChange={e => setSettings({ ...settings, footerEmail: e.target.value })}
                placeholder="contacto@rent360.cl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Contacto
              </label>
              <Input
                type="tel"
                value={settings.footerPhone || '+56 9 1234 5678'}
                onChange={e => setSettings({ ...settings, footerPhone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <Input
              value={settings.footerAddress || 'Santiago, Chile'}
              onChange={e => setSettings({ ...settings, footerAddress: e.target.value })}
              placeholder="Santiago, Chile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto de Copyright
            </label>
            <Input
              value={
                settings.footerCopyright ||
                'Desarrollado con ❤️ para el sector inmobiliario chileno'
              }
              onChange={e => setSettings({ ...settings, footerCopyright: e.target.value })}
              placeholder="Texto de copyright..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Páginas Legales
          </CardTitle>
          <CardDescription>Configura las páginas de términos, privacidad y cookies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Términos y Condiciones
              </label>
              <Input
                value={settings.termsUrl || '/terms'}
                onChange={e => setSettings({ ...settings, termsUrl: e.target.value })}
                placeholder="/terms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Política de Privacidad
              </label>
              <Input
                value={settings.privacyUrl || '/privacy'}
                onChange={e => setSettings({ ...settings, privacyUrl: e.target.value })}
                placeholder="/privacy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Política de Cookies
              </label>
              <Input
                value={settings.cookiesUrl || '/cookies'}
                onChange={e => setSettings({ ...settings, cookiesUrl: e.target.value })}
                placeholder="/cookies"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Footer Habilitado</div>
              <div className="text-sm text-gray-600">Mostrar footer en todas las páginas</div>
            </div>
            <Switch
              checked={settings.footerEnabled !== false}
              onCheckedChange={checked => setSettings({ ...settings, footerEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLegalSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Legales
          </CardTitle>
          <CardDescription>Configuración de documentos legales requeridos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Términos de Servicio Requeridos</div>
              <div className="text-sm text-gray-600">Los usuarios deben aceptar los términos</div>
            </div>
            <Switch
              checked={settings.termsOfServiceRequired}
              onCheckedChange={checked =>
                setSettings({ ...settings, termsOfServiceRequired: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Política de Privacidad Requerida</div>
              <div className="text-sm text-gray-600">Los usuarios deben aceptar la política</div>
            </div>
            <Switch
              checked={settings.privacyPolicyRequired}
              onCheckedChange={checked =>
                setSettings({ ...settings, privacyPolicyRequired: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Consentimiento de Cookies</div>
              <div className="text-sm text-gray-600">Mostrar banner de cookies</div>
            </div>
            <Switch
              checked={settings.cookieConsentEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, cookieConsentEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Cumplimiento GDPR</div>
              <div className="text-sm text-gray-600">Cumplir con regulaciones GDPR</div>
            </div>
            <Switch
              checked={settings.gdprCompliance}
              onCheckedChange={checked => setSettings({ ...settings, gdprCompliance: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Retención y Limpieza de Datos
          </CardTitle>
          <CardDescription>Configuración de gestión de datos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retención de Datos (días)
            </label>
            <Input
              type="number"
              value={settings.dataRetentionDays}
              onChange={e =>
                setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Eliminación Automática de Usuarios Inactivos</div>
              <div className="text-sm text-gray-600">
                Eliminar cuentas inactivas automáticamente
              </div>
            </div>
            <Switch
              checked={settings.autoDeleteInactiveUsers}
              onCheckedChange={checked =>
                setSettings({ ...settings, autoDeleteInactiveUsers: checked })
              }
            />
          </div>

          {settings.autoDeleteInactiveUsers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días para Considerar Usuario Inactivo
              </label>
              <Input
                type="number"
                value={settings.inactiveUserDays}
                onChange={e =>
                  setSettings({ ...settings, inactiveUserDays: parseInt(e.target.value) })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const renderEmailTemplatesSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plantillas de Email</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las plantillas de correos electrónicos del sistema
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailTemplates.length}</div>
            <p className="text-xs text-muted-foreground">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {emailTemplates.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Plantillas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Categoría</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(emailTemplates.map(t => t.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">Categorías distintas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variables Totales</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailTemplates.reduce((sum, t) => sum + t.variables.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Variables definidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar plantillas..."
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={templateCategoryFilter} onValueChange={setTemplateCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="welcome">Bienvenida</SelectItem>
                <SelectItem value="notification">Notificación</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transaction">Transacción</SelectItem>
                <SelectItem value="support">Soporte</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTemplateSearch('');
                  setTemplateCategoryFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredTemplates().map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">Asunto: {template.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryLabel(template.category)}
                  </Badge>
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() => handleToggleTemplateStatus(template.id)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                </div>

                {template.variables.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Variables disponibles:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 4).map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(template.updatedAt).toLocaleDateString('es-CL')}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredTemplates().length === 0 && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {templateSearch || templateCategoryFilter !== 'all'
                ? 'No se encontraron plantillas'
                : 'No hay plantillas de email'}
            </h3>
            <p className="text-gray-600 mb-4">
              {templateSearch || templateCategoryFilter !== 'all'
                ? 'Intenta con otros criterios de búsqueda'
                : 'Crea tu primera plantilla de email para comenzar'}
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Plantilla
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <UnifiedDashboardLayout
      title="Configuración Avanzada"
      subtitle="Gestiona toda la configuración del sistema Rent360"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración Avanzada</h1>
            <p className="text-gray-600 mt-2">
              Gestiona todas las preferencias y opciones del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restablecer Valores
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'properties' && renderPropertySettings()}
          {activeTab === 'users' && renderUserSettings()}
          {activeTab === 'commissions' && renderCommissionSettings()}
          {activeTab === 'runners' && renderRunnerSettings()}
          {activeTab === 'providers' && renderProvidersSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'email' && renderEmailSettings()}
          {activeTab === 'email-templates' && renderEmailTemplatesSettings()}
          {activeTab === 'payments' && renderPaymentSettings()}
          {activeTab === 'integrations' && renderIntegrationSettings()}
          {activeTab === 'advanced' && renderAdvancedSettings()}
          {activeTab === 'ui' && renderUISettings()}
          {activeTab === 'performance' && renderPerformanceSettings()}
          {activeTab === 'footer' && renderFooterSettings()}
          {activeTab === 'legal' && renderLegalSettings()}
        </div>

        {/* Email Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
                </h2>
                <Button size="sm" variant="ghost" onClick={() => setShowTemplateModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const templateData = {
                      name: formData.get('name') as string,
                      subject: formData.get('subject') as string,
                      content: formData.get('content') as string,
                      category: formData.get('category') as EmailTemplate['category'],
                      variables:
                        (formData.get('variables') as string)
                          ?.split(',')
                          .map(v => v.trim())
                          .filter(v => v) || [],
                      isActive: formData.get('isActive') === 'true',
                    };
                    handleSaveTemplate(templateData);
                  }}
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de la Plantilla *
                        </label>
                        <Input
                          name="name"
                          defaultValue={selectedTemplate?.name || ''}
                          placeholder="Ej: Bienvenida de Usuario"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoría *
                        </label>
                        <Select
                          name="category"
                          defaultValue={selectedTemplate?.category || 'custom'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome">Bienvenida</SelectItem>
                            <SelectItem value="notification">Notificación</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="transaction">Transacción</SelectItem>
                            <SelectItem value="support">Soporte</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Asunto del Email *
                      </label>
                      <Input
                        name="subject"
                        defaultValue={selectedTemplate?.subject || ''}
                        placeholder="Ej: ¡Bienvenido a Rent360!"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Puedes usar variables como {'{{userName}}'}, {'{{propertyTitle}}'}, etc.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variables Disponibles
                      </label>
                      <Input
                        name="variables"
                        defaultValue={selectedTemplate?.variables?.join(', ') || ''}
                        placeholder="Ej: userName, propertyTitle, monthlyRent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separa las variables con comas. Estas estarán disponibles para usar en el
                        asunto y contenido.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenido del Email *
                      </label>
                      <Textarea
                        name="content"
                        defaultValue={selectedTemplate?.content || ''}
                        placeholder="Escribe el contenido del email..."
                        rows={15}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Usa las variables definidas arriba con el formato {'{{variableName}}'}.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        id="isActive"
                        defaultChecked={selectedTemplate?.isActive ?? true}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Plantilla activa
                      </label>
                    </div>

                    {selectedTemplate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">
                          Información de la Plantilla
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Creada:</span>{' '}
                            {new Date(selectedTemplate.createdAt).toLocaleDateString('es-CL')}
                          </div>
                          <div>
                            <span className="font-medium">Última actualización:</span>{' '}
                            {new Date(selectedTemplate.updatedAt).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTemplateModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1">
                        {selectedTemplate ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
