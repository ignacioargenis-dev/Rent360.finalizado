'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, 
  Bell, 
  Shield, 
  Save,
  CheckCircle,
  AlertTriangle,
  Lock,
  Globe,
  CreditCard,
  TrendingUp,
  Camera,
  Building } from 'lucide-react';
interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  taxId?: string;
  bankAccount?: string;
  preferences: {
    language: 'es' | 'en';
    currency: 'CLP' | 'USD' | 'EUR';
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      paymentReminders: boolean;
      contractUpdates: boolean;
      maintenanceAlerts: boolean;
      newInquiries: boolean;
    };
    reports: {
      autoGenerate: boolean;
      frequency: 'weekly' | 'monthly' | 'quarterly';
      includeCharts: boolean;
    };
  };
  createdAt: Date;
  emailVerified: boolean;
  isActive: boolean;
}

export default function OwnerSettingsPage() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Simular datos del perfil de propietario
      const mockProfile: OwnerProfile = {
        id: '1',
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@example.com',
        phone: '+56 9 8765 4321',
        avatar: 'https://ui-avatars.com/api/?name=Carlos+Rodríguez&background=0D8ABC&color=fff',
        bio: 'Inversionista inmobiliario con más de 10 años de experiencia',
        company: 'Inversiones Inmobiliarias SpA',
        taxId: '76.123.456-7',
        bankAccount: 'Banco de Chile - Cta. Cte. ****1234',
        preferences: {
          language: 'es',
          currency: 'CLP',
          timezone: 'America/Santiago',
          notifications: {
            email: true,
            push: true,
            sms: true,
            paymentReminders: true,
            contractUpdates: true,
            maintenanceAlerts: true,
            newInquiries: true,
          },
          reports: {
            autoGenerate: true,
            frequency: 'monthly',
            includeCharts: true,
          },
        },
        createdAt: new Date('2023-06-15'),
        emailVerified: true,
        isActive: true,
      };
      setProfile(mockProfile);
    } catch (error) {
      logger.error('Error fetching profile:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) {
return;
}
    
    setSaving(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      logger.error('Error saving profile:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      // Simular cambio de contraseña
      alert('Solicitud de cambio de contraseña enviada a tu correo');
    } catch (error) {
      logger.error('Error updating password:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && profile) {
      try {
        // Simular carga de avatar
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfile({
            ...profile,
            avatar: e.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
        alert('Avatar actualizado exitosamente');
      } catch (error) {
        logger.error('Error uploading avatar:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  };

  if (loading || !profile) {
    return (
      <EnhancedDashboardLayout title="Configuración" subtitle="Gestiona tu perfil y preferencias de propietario">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Configuración" subtitle="Gestiona tu perfil y preferencias de propietario">
      <div className="space-y-6">
        {/* Información de Verificación */}
        {!profile.emailVerified && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Tu correo electrónico no ha sido verificado. Por favor verifica tu bandeja de entrada y sigue las instrucciones.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="business">Negocio</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tu información personal y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                      <Camera className="w-3 h-3" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadAvatar}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-gray-500">{profile.email}</div>
                    <div className="text-xs text-gray-400">
                      Miembro desde {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Datos Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                    <div className="flex items-center gap-1 mt-1">
                      {profile.emailVerified ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600">Verificado</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs text-yellow-600">No verificado</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Biografía</Label>
                    <Input
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder="Breve descripción sobre ti..."
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            {/* Información de Negocio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Información de Negocio
                </CardTitle>
                <CardDescription>
                  Configura los datos de tu empresa para facturación y pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={profile.company || ''}
                      onChange={(e) => setProfile({...profile, company: e.target.value})}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">RUT</Label>
                    <Input
                      id="taxId"
                      value={profile.taxId || ''}
                      onChange={(e) => setProfile({...profile, taxId: e.target.value})}
                      placeholder="76.123.456-7"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bankAccount">Cuenta Bancaria</Label>
                    <Input
                      id="bankAccount"
                      value={profile.bankAccount || ''}
                      onChange={(e) => setProfile({...profile, bankAccount: e.target.value})}
                      placeholder="Banco - Tipo de cuenta - Número de cuenta"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Estos datos se utilizarán para generar facturas y recibir pagos. 
                    Asegúrate de que la información sea correcta.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferencias de Notificación
                </CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notificaciones por Email</div>
                      <div className="text-sm text-gray-500">Recibe notificaciones importantes en tu correo</div>
                    </div>
                    <Switch
                      checked={profile.preferences.notifications.email}
                      onCheckedChange={(checked) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            email: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notificaciones Push</div>
                      <div className="text-sm text-gray-500">Recibe notificaciones en tu dispositivo móvil</div>
                    </div>
                    <Switch
                      checked={profile.preferences.notifications.push}
                      onCheckedChange={(checked) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            push: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notificaciones SMS</div>
                      <div className="text-sm text-gray-500">Recibe alertas importantes por mensaje de texto</div>
                    </div>
                    <Switch
                      checked={profile.preferences.notifications.sms}
                      onCheckedChange={(checked) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            sms: checked,
                          },
                        },
                      })}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Tipos de Notificaciones</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Recordatorios de Pago</div>
                        <div className="text-sm text-gray-500">Te avisaremos cuando tus pagos estén próximos</div>
                      </div>
                      <Switch
                        checked={profile.preferences.notifications.paymentReminders}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              paymentReminders: checked,
                            },
                          },
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Actualizaciones de Contrato</div>
                        <div className="text-sm text-gray-500">Notificaciones sobre cambios en tus contratos</div>
                      </div>
                      <Switch
                        checked={profile.preferences.notifications.contractUpdates}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              contractUpdates: checked,
                            },
                          },
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Alertas de Mantenimiento</div>
                        <div className="text-sm text-gray-500">Notificaciones sobre solicitudes de mantenimiento</div>
                      </div>
                      <Switch
                        checked={profile.preferences.notifications.maintenanceAlerts}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              maintenanceAlerts: checked,
                            },
                          },
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Nuevas Consultas</div>
                        <div className="text-sm text-gray-500">Recibe notificaciones de nuevos interesados</div>
                      </div>
                      <Switch
                        checked={profile.preferences.notifications.newInquiries}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              newInquiries: checked,
                            },
                          },
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Seguridad
                </CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Contraseña</div>
                      <div className="text-sm text-gray-500">Último cambio: hace 2 meses</div>
                    </div>
                    <Button variant="outline" onClick={handleUpdatePassword}>
                      <Lock className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Autenticación de Dos Factores</div>
                      <div className="text-sm text-gray-500">Añade una capa extra de seguridad</div>
                    </div>
                    <Badge variant="secondary">No configurado</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Sesiones Activas</div>
                      <div className="text-sm text-gray-500">2 dispositivos conectados</div>
                    </div>
                    <Button variant="outline">Ver Sesiones</Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consejo de seguridad:</strong> Usa una contraseña única para Rent360 y activa la autenticación de dos factores para mayor protección.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Preferencias Generales
                </CardTitle>
                <CardDescription>
                  Configura tus preferencias de idioma, moneda y más
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select 
                      value={profile.preferences.language} 
                      onValueChange={(value: any) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          language: value,
                        },
                      })}
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

                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select 
                      value={profile.preferences.currency} 
                      onValueChange={(value: any) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          currency: value,
                        },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select 
                      value={profile.preferences.timezone} 
                      onValueChange={(value) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          timezone: value,
                        },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Santiago">Santiago, Chile</SelectItem>
                        <SelectItem value="America/Mexico_City">Ciudad de México, México</SelectItem>
                        <SelectItem value="America/Buenos_Aires">Buenos Aires, Argentina</SelectItem>
                        <SelectItem value="America/Lima">Lima, Perú</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Reportes Automáticos
                </CardTitle>
                <CardDescription>
                  Configura la generación automática de reportes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Generar Reportes Automáticos</div>
                      <div className="text-sm text-gray-500">Recibe reportes periódicos de tus propiedades</div>
                    </div>
                    <Switch
                      checked={profile.preferences.reports.autoGenerate}
                      onCheckedChange={(checked) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          reports: {
                            ...profile.preferences.reports,
                            autoGenerate: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  {profile.preferences.reports.autoGenerate && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Frecuencia</div>
                          <div className="text-sm text-gray-500">¿Con qué frecuencia quieres los reportes?</div>
                        </div>
                        <Select 
                          value={profile.preferences.reports.frequency} 
                          onValueChange={(value: any) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              reports: {
                                ...profile.preferences.reports,
                                frequency: value,
                              },
                            },
                          })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Incluir Gráficos</div>
                          <div className="text-sm text-gray-500">Añade visualizaciones a tus reportes</div>
                        </div>
                        <Switch
                          checked={profile.preferences.reports.includeCharts}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              reports: {
                                ...profile.preferences.reports,
                                includeCharts: checked,
                              },
                            },
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Gestiona tus métodos de pago para recibir ingresos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <div className="font-medium mb-2">Configura tus métodos de pago</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Agrega tus cuentas bancarias para recibir los pagos de arriendo
                  </div>
                  <Button>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Configurar Métodos de Pago
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedDashboardLayout>
  );
}
