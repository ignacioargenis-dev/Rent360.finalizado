'use client';

import { logger } from '@/lib/logger';

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
import { Bell, Shield, Mail, Phone, Camera, Save, CheckCircle, AlertTriangle, Lock, Globe, CreditCard, Settings, User, Info } from 'lucide-react';
interface TenantProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
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
    };
  };
  createdAt: Date;
  emailVerified: boolean;
  isActive: boolean;
}

export default function TenantSettingsPage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Simular datos del perfil
      const mockProfile: TenantProfile = {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+56 9 1234 5678',
        avatar: 'https://ui-avatars.com/api/?name=Juan+Pérez&background=0D8ABC&color=fff',
        bio: 'Profesional responsable buscando arriendo a largo plazo',
        emergencyContact: {
          name: 'María Pérez',
          phone: '+56 9 8765 4321',
          relationship: 'Hermana',
        },
        preferences: {
          language: 'es',
          currency: 'CLP',
          timezone: 'America/Santiago',
          notifications: {
            email: true,
            push: true,
            sms: false,
            paymentReminders: true,
            contractUpdates: true,
            maintenanceAlerts: true,
          },
        },
        createdAt: new Date('2024-01-15'),
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
      <EnhancedDashboardLayout title="Configuración" subtitle="Gestiona tu perfil y preferencias">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Configuración" subtitle="Gestiona tu perfil y preferencias">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
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

                {/* Contacto de Emergencia */}
                <div className="space-y-4">
                  <h4 className="font-medium">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="emergency-name">Nombre</Label>
                      <Input
                        id="emergency-name"
                        value={profile.emergencyContact?.name || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          emergencyContact: {
                            ...profile.emergencyContact!,
                            name: e.target.value,
                          },
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency-phone">Teléfono</Label>
                      <Input
                        id="emergency-phone"
                        value={profile.emergencyContact?.phone || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          emergencyContact: {
                            ...profile.emergencyContact!,
                            phone: e.target.value,
                          },
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency-relation">Relación</Label>
                      <Select 
                        value={profile.emergencyContact?.relationship || ''} 
                        onValueChange={(value) => setProfile({
                          ...profile,
                          emergencyContact: {
                            ...profile.emergencyContact!,
                            relationship: value,
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona relación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="padre">Padre</SelectItem>
                          <SelectItem value="madre">Madre</SelectItem>
                          <SelectItem value="hermano/a">Hermano/a</SelectItem>
                          <SelectItem value="pareja">Pareja</SelectItem>
                          <SelectItem value="amigo/a">Amigo/a</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

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
                      <div className="text-sm text-gray-500">Último cambio: hace 3 meses</div>
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
                      <div className="text-sm text-gray-500">3 dispositivos conectados</div>
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
                  <CreditCard className="w-5 h-5" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Gestiona tus métodos de pago guardados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <div className="font-medium mb-2">Gestiona tus métodos de pago</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Agrega y administra tus tarjetas y cuentas bancarias
                  </div>
                  <Button onClick={() => window.open('/tenant/payments/methods', '_blank')}>
                    Administrar Métodos de Pago
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
