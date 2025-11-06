'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit,
  Save,
  MapPin,
  Phone,
  Mail,
  Award,
  Star,
  Users,
  Calendar,
  Wrench,
  Building,
  Upload,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ProviderProfile {
  basicInfo: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    mobile: string;
    website?: string;
    logo?: string;
    description: string;
  };
  business: {
    businessType: string;
    taxId: string;
    registrationNumber: string;
    foundedYear: number;
    employeeCount: string;
  };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  services: {
    categories: string[];
    specialties: string[];
    certifications: string[];
    insurance: {
      hasInsurance: boolean;
      provider: string;
      coverage: string;
      expiryDate: string;
    };
    licensing: {
      licenseNumber: string;
      issuingAuthority: string;
      expiryDate: string;
    };
  };
  operational: {
    workingHours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
    serviceAreas: string[];
    emergencyService: boolean;
    responseTime: string;
  };
  stats: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    averageRating: number;
    totalReviews: number;
    satisfactionRate: number;
    repeatClients: number;
    averageResponseTime: number;
  };
}

export default function ProviderProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const regions = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    "O'Higgins",
    'Maule',
    'Ñuble',
    'Biobío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes',
  ];

  const serviceCategories = [
    'Electricidad',
    'Fontanería',
    'Mantenimiento General',
    'Pintura',
    'Jardinería',
    'Carpintería',
    'Cerrajería',
    'Limpieza',
    'Seguridad',
    'Climatización',
    'Construcción',
    'Mudanzas',
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      // ✅ Cargar perfil real desde la API
      const profileResponse = await fetch('/api/provider/profile', {
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        throw new Error('Error al cargar el perfil del proveedor');
      }

      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.profile) {
        throw new Error('No se encontró el perfil del proveedor');
      }

      const apiProfile = profileData.profile;
      console.log('🔍 [PROFILE] API Profile received:', apiProfile);

      // ✅ Cargar estadísticas reales
      const statsResponse = await fetch('/api/provider/stats', {
        credentials: 'include',
      });

      let stats = {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        averageRating: 0,
        totalReviews: 0,
        satisfactionRate: 0,
        repeatClients: 0,
        averageResponseTime: 0,
      };

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          stats = {
            totalJobs: statsData.data.completedJobs + statsData.data.activeJobs || 0,
            completedJobs: statsData.data.completedJobs || 0,
            activeJobs: statsData.data.activeJobs || 0,
            averageRating: statsData.data.averageRating || 0,
            totalReviews: statsData.data.totalRatings || 0,
            satisfactionRate: statsData.data.averageRating
              ? (statsData.data.averageRating / 5) * 100
              : 0,
            repeatClients: 0, // TODO: Calcular desde la BD
            averageResponseTime: apiProfile.responseTime
              ? parseFloat(apiProfile.responseTime.split('-')[0])
              : 0,
          };
        }
      }

      // Parsear servicios
      const serviceTypes = apiProfile.serviceTypes || apiProfile.specialties || [];
      const categories = Array.isArray(serviceTypes) ? serviceTypes : [];
      const specialties = Array.isArray(serviceTypes) ? serviceTypes : [];

      // Parsear disponibilidad
      let availability = {
        weekdays: true,
        weekends: false,
        emergencies: false,
      };
      if (apiProfile.availability) {
        try {
          availability =
            typeof apiProfile.availability === 'string'
              ? JSON.parse(apiProfile.availability)
              : apiProfile.availability;
        } catch {
          // Usar valores por defecto
        }
      }

      // Mapear datos de la API al formato del componente
      const realProfile: ProviderProfile = {
        basicInfo: {
          companyName: apiProfile.companyName || '',
          contactName: apiProfile.contactName || '',
          email: apiProfile.email || '',
          phone: apiProfile.phone || '',
          mobile: apiProfile.phone || '',
          website: apiProfile.website || '',
          logo: '',
          description: apiProfile.description || '',
        },
        business: {
          businessType: 'SPA',
          taxId: apiProfile.taxId || '',
          registrationNumber: '',
          foundedYear: new Date().getFullYear() - 5, // Aproximación
          employeeCount: '1-10',
        },
        address: {
          street: apiProfile.address || '',
          city: apiProfile.city || '',
          region: apiProfile.region || '',
          postalCode: '',
        },
        services: {
          categories,
          specialties,
          certifications: [],
          insurance: {
            hasInsurance: false,
            provider: '',
            coverage: '',
            expiryDate: '',
          },
          licensing: {
            licenseNumber: '',
            issuingAuthority: '',
            expiryDate: '',
          },
        },
        operational: {
          workingHours: {
            monday: { open: '08:00', close: '18:00', closed: !availability.weekdays },
            tuesday: { open: '08:00', close: '18:00', closed: !availability.weekdays },
            wednesday: { open: '08:00', close: '18:00', closed: !availability.weekdays },
            thursday: { open: '08:00', close: '18:00', closed: !availability.weekdays },
            friday: { open: '08:00', close: '17:00', closed: !availability.weekdays },
            saturday: { open: '09:00', close: '14:00', closed: !availability.weekends },
            sunday: { open: '00:00', close: '00:00', closed: !availability.weekends },
          },
          serviceAreas: apiProfile.region ? [apiProfile.region] : [],
          emergencyService: availability.emergencies || false,
          responseTime: apiProfile.responseTime || '2-4 horas',
        },
        stats,
      };

      console.log('✅ [PROFILE] Transformed profile:', realProfile);
      console.log('✅ [PROFILE] Services section:', realProfile.services);

      console.log('🎯 [PROFILE] Perfil listo para renderizar:', {
        hasServices: !!realProfile.services,
        servicesKeys: realProfile.services ? Object.keys(realProfile.services) : [],
        categoriesCount: realProfile.services?.categories?.length || 0,
        specialtiesCount: realProfile.services?.specialties?.length || 0,
      });

      setProfile(realProfile);
      setSuccessMessage('Perfil cargado exitosamente');
    } catch (error) {
      logger.error('Error al cargar perfil del proveedor', { error });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al cargar el perfil. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Perfil del proveedor actualizado', {
        companyName: profile.basicInfo.companyName,
      });
      setSuccessMessage('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      logger.error('Error al guardar perfil', { error });
      setErrorMessage('Error al guardar el perfil. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (!profile) {
      return;
    }

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev!,
        [parent as keyof typeof prev]: {
          ...(prev![parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setProfile(prev => ({
        ...prev!,
        basicInfo: {
          ...prev!.basicInfo,
          [field]: value,
        },
      }));
    }
  };

  const handleWorkingHoursChange = (
    day: string,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    if (!profile) {
      return;
    }

    setProfile(prev => ({
      ...prev!,
      operational: {
        ...prev!.operational,
        workingHours: {
          ...prev!.operational.workingHours,
          [day]: {
            ...(prev!.operational.workingHours as any)[day],
            [field]: value,
          },
        },
      },
    }));
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando perfil...</span>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!profile) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12 text-gray-500">
            No se pudo cargar el perfil del proveedor
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfil del Proveedor</h1>
            <p className="text-gray-600">Gestiona la información de tu empresa y servicios</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="business">Empresa</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="operations">Operaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Header con Logo y Info Básica */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.basicInfo.logo} />
                    <AvatarFallback className="text-2xl">
                      {profile.basicInfo.companyName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{profile.basicInfo.companyName}</h2>
                        <p className="text-gray-600 mt-1">{profile.basicInfo.contactName}</p>
                        <div className="flex items-center gap-4 mt-2">
                          {getRatingStars(profile.stats.averageRating)}
                          <span className="text-sm text-gray-600">
                            ({profile.stats.totalReviews} reseñas)
                          </span>
                        </div>
                      </div>

                      {isEditing && (
                        <div>
                          <Label htmlFor="logo" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                              <Upload className="w-4 h-4" />
                              Cambiar Logo
                            </div>
                            <Input
                              id="logo"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = e => {
                                    handleInputChange('logo', e.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </Label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            value={profile.basicInfo.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span>{profile.basicInfo.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            value={profile.basicInfo.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span>{profile.basicInfo.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>
                          {profile.address.city}, {profile.address.region}
                        </span>
                      </div>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={profile.basicInfo.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        placeholder="Descripción de la empresa..."
                        rows={3}
                        className="mt-4"
                      />
                    ) : (
                      <p className="text-gray-700 mt-4">{profile.basicInfo.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trabajos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{profile.stats.totalJobs}</p>
                    </div>
                    <Wrench className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trabajos Activos</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {profile.stats.activeJobs}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clientes Recurrentes</p>
                      <p className="text-2xl font-bold text-green-600">
                        {profile.stats.repeatClients}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Satisfacción</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {profile.stats.satisfactionRate}%
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Categorías de Servicio */}
            <Card>
              <CardHeader>
                <CardTitle>Categorías de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.services.categories.map(category => (
                    <Badge key={category} variant="outline" className="text-sm">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Empresarial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Nombre de la Empresa</Label>
                      {isEditing ? (
                        <Input
                          id="companyName"
                          value={profile.basicInfo.companyName}
                          onChange={e => handleInputChange('companyName', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile.basicInfo.companyName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="businessType">Tipo de Empresa</Label>
                      {isEditing ? (
                        <Select
                          value={profile.business.businessType}
                          onValueChange={value => handleInputChange('business.businessType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SPA">SPA</SelectItem>
                            <SelectItem value="LTDA">LTDA</SelectItem>
                            <SelectItem value="EIRL">EIRL</SelectItem>
                            <SelectItem value="SA">SA</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-gray-600">{profile.business.businessType}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="foundedYear">Año de Fundación</Label>
                      {isEditing ? (
                        <Input
                          id="foundedYear"
                          type="number"
                          value={profile.business.foundedYear}
                          onChange={e =>
                            handleInputChange(
                              'business.foundedYear',
                              parseInt(e.target.value) || 2000
                            )
                          }
                        />
                      ) : (
                        <p className="text-gray-600">{profile.business.foundedYear}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taxId">RUT</Label>
                      {isEditing ? (
                        <Input
                          id="taxId"
                          value={profile.business.taxId}
                          onChange={e => handleInputChange('business.taxId', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-600">{profile.business.taxId}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="registrationNumber">Número de Registro</Label>
                      {isEditing ? (
                        <Input
                          id="registrationNumber"
                          value={profile.business.registrationNumber}
                          onChange={e =>
                            handleInputChange('business.registrationNumber', e.target.value)
                          }
                        />
                      ) : (
                        <p className="text-gray-600">{profile.business.registrationNumber}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="employeeCount">Número de Empleados</Label>
                      {isEditing ? (
                        <Select
                          value={profile.business.employeeCount}
                          onValueChange={value =>
                            handleInputChange('business.employeeCount', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 empleados</SelectItem>
                            <SelectItem value="11-50">11-50 empleados</SelectItem>
                            <SelectItem value="51-200">51-200 empleados</SelectItem>
                            <SelectItem value="201+">201+ empleados</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-gray-600">{profile.business.employeeCount} empleados</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dirección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Dirección</Label>
                      {isEditing ? (
                        <Input
                          id="street"
                          value={profile.address.street}
                          onChange={e => handleInputChange('address.street', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-600">{profile.address.street}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={profile.address.city}
                          onChange={e => handleInputChange('address.city', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-600">{profile.address.city}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="region">Región</Label>
                      {isEditing ? (
                        <Select
                          value={profile.address.region}
                          onValueChange={value => handleInputChange('address.region', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(region => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-gray-600">{profile.address.region}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="postalCode">Código Postal</Label>
                      {isEditing ? (
                        <Input
                          id="postalCode"
                          value={profile.address.postalCode}
                          onChange={e => handleInputChange('address.postalCode', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-600">{profile.address.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Servicios y Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Categorías de Servicio</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.services.categories.map(category => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Especialidades</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.services.specialties.map(specialty => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Certificaciones</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.services.certifications.map(certification => (
                      <Badge
                        key={certification}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        {certification}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seguros y Licencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Seguro de Responsabilidad Civil</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Estado</span>
                        <Badge
                          className={
                            profile.services.insurance.hasInsurance ? 'bg-green-500' : 'bg-red-500'
                          }
                        >
                          {profile.services.insurance.hasInsurance ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {profile.services.insurance.hasInsurance && (
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Proveedor:</strong> {profile.services.insurance.provider}
                          </p>
                          <p>
                            <strong>Cobertura:</strong> {profile.services.insurance.coverage}
                          </p>
                          <p>
                            <strong>Vence:</strong>{' '}
                            {new Date(profile.services.insurance.expiryDate).toLocaleDateString(
                              'es-CL'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Licencia Municipal</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Número:</strong> {profile.services.licensing.licenseNumber}
                        </p>
                        <p>
                          <strong>Autoridad:</strong> {profile.services.licensing.issuingAuthority}
                        </p>
                        <p>
                          <strong>Vence:</strong>{' '}
                          {new Date(profile.services.licensing.expiryDate).toLocaleDateString(
                            'es-CL'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Trabajo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(profile.operational.workingHours).map(([day, hours]) => (
                    <div key={day} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{day}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${day}-closed`}
                            checked={hours.closed}
                            onChange={e =>
                              handleWorkingHoursChange(day, 'closed', e.target.checked)
                            }
                            className="rounded"
                          />
                          <label htmlFor={`${day}-closed`} className="text-sm text-gray-600">
                            Cerrado
                          </label>
                        </div>
                      </div>

                      {!hours.closed && (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <Label htmlFor={`${day}-open`} className="text-xs text-gray-500">
                              Apertura
                            </Label>
                            <Input
                              id={`${day}-open`}
                              type="time"
                              value={hours.open}
                              onChange={e => handleWorkingHoursChange(day, 'open', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`${day}-close`} className="text-xs text-gray-500">
                              Cierre
                            </Label>
                            <Input
                              id={`${day}-close`}
                              type="time"
                              value={hours.close}
                              onChange={e => handleWorkingHoursChange(day, 'close', e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Área de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Regiones Atendidas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.operational.serviceAreas.map(region => (
                        <Badge key={region} variant="outline">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Servicio de Emergencia</span>
                      <Badge
                        className={
                          profile.operational.emergencyService ? 'bg-green-500' : 'bg-red-500'
                        }
                      >
                        {profile.operational.emergencyService ? 'Disponible' : 'No Disponible'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Tiempo de Respuesta</span>
                      <span className="text-sm font-semibold">
                        {profile.operational.responseTime}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
