'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, 
  Settings, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Camera,
  Car,
  Clock,
  Bell,
  Shield,
  CreditCard,
  FileText,
  Save,
  Upload,
  Download,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Star, Info } from 'lucide-react';
import { User as UserType } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface RunnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  bio: string;
  experience: string;
  specialties: string[];
  availableHours: {
    weekdays: string;
    weekends: string;
  };
  transportation: 'car' | 'public' | 'bike' | 'walking';
  hasEquipment: boolean;
  equipmentList: string[];
  rating: number;
  totalVisits: number;
  completedVisits: number;
  memberSince: string;
  lastActive: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  paymentInfo: {
    bankAccount: string;
    bankName: string;
    accountType: string;
    rut: string;
  };
}

export default function RunnerSettings() {

  const [user, setUser] = useState<UserType | null>(null);

  const [profile, setProfile] = useState<RunnerProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Simulate API call - in real implementation, this would fetch from /api/runner/profile
        const mockProfile: RunnerProfile = {
          id: '1',
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@runner360.cl',
          phone: '+56 9 1234 5678',
          address: 'Av. Providencia 1234',
          city: 'Santiago',
          region: 'Región Metropolitana',
          bio: 'Runner360 con más de 2 años de experiencia en visitas fotográficas y virtuales. Especializado en propiedades residenciales y comerciales.',
          experience: '2+ años',
          specialties: ['Fotografía Inmobiliaria', 'Video Tours', 'Visitas Virtuales', 'Drone'],
          availableHours: {
            weekdays: '09:00 - 18:00',
            weekends: '10:00 - 14:00',
          },
          transportation: 'car',
          hasEquipment: true,
          equipmentList: ['Cámara DSLR', 'Trípode', 'Iluminación Profesional', 'Drone', 'Lente Gran Angular'],
          rating: 4.8,
          totalVisits: 156,
          completedVisits: 152,
          memberSince: '2022-03-15',
          lastActive: '2024-03-16',
          notificationPreferences: {
            email: true,
            sms: true,
            push: true,
          },
          paymentInfo: {
            bankAccount: '123456789',
            bankName: 'Banco de Chile',
            accountType: 'Cuenta Corriente',
            rut: '12.345.678-9',
          },
        };

        setProfile(mockProfile);
      } catch (error) {
        logger.error('Error loading profile data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) {
return;
}
    
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Perfil actualizado correctamente');
    } catch (error) {
      logger.error('Error saving profile:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || !profile) {
    return (
      <DashboardLayout
        user={user}
        title="Configuración"
        subtitle="Gestión de perfil y preferencias"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout
    );
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'availability', label: 'Disponibilidad', icon: Clock },
    { id: 'equipment', label: 'Equipamiento', icon: Camera },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'payment', label: 'Pagos', icon: CreditCard },
    { id: 'documents', label: 'Documentos', icon: FileText },
  ];

  return (
    <DashboardLayout
      user={user}
      title="Configuración"
      subtitle="Gestión de perfil y preferencias"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Resumen del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-medium">{profile.name}</h3>
                <p className="text-sm text-gray-600">Runner360</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{profile.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-600">Calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{profile.completedVisits}</span>
                  <span className="text-sm text-gray-600">Visitas Completadas</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Miembro desde</span>
                </div>
                <p className="font-medium">{formatDate(profile.memberSince)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Última actividad</span>
                </div>
                <p className="font-medium">{formatDate(profile.lastActive)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración Detallada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 border-b">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <Input
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ciudad</label>
                        <Input
                          value={profile.city}
                          onChange={(e) => setProfile({...profile, city: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Dirección</label>
                      <Input
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Biografía</label>
                      <Textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Experiencia</label>
                      <Input
                        value={profile.experience}
                        onChange={(e) => setProfile({...profile, experience: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'availability' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Horario entre semana</label>
                        <Input
                          value={profile.availableHours.weekdays}
                          onChange={(e) => setProfile({
                            ...profile,
                            availableHours: {...profile.availableHours, weekdays: e.target.value},
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Horario fines de semana</label>
                        <Input
                          value={profile.availableHours.weekends}
                          onChange={(e) => setProfile({
                            ...profile,
                            availableHours: {...profile.availableHours, weekends: e.target.value},
                          })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Transporte</label>
                      <Select 
                        value={profile.transportation} 
                        onValueChange={(value: any) => setProfile({...profile, transportation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car">Automóvil</SelectItem>
                          <SelectItem value="public">Transporte Público</SelectItem>
                          <SelectItem value="bike">Bicicleta</SelectItem>
                          <SelectItem value="walking">Caminando</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeTab === 'equipment' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasEquipment"
                        checked={profile.hasEquipment}
                        onChange={(e) => setProfile({...profile, hasEquipment: e.target.checked})}
                      />
                      <label htmlFor="hasEquipment" className="text-sm font-medium">
                        Tengo equipo profesional
                      </label>
                    </div>
                    
                    {profile.hasEquipment && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Lista de equipos</label>
                        <div className="space-y-2">
                          {profile.equipmentList.map((equipment, index) => (
                            <Input
                              key={index}
                              value={equipment}
                              onChange={(e) => {
                                const newEquipmentList = [...profile.equipmentList];
                                newEquipmentList[index] = e.target.value;
                                setProfile({...profile, equipmentList: newEquipmentList});
                              }}
                            />
                          ))}
                          <Button 
                            variant="outline" 
                            onClick={() => setProfile({
                              ...profile, 
                              equipmentList: [...profile.equipmentList, ''],
                            })}
                          >
                            Añadir equipo
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>Notificaciones por Email</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.notificationPreferences.email}
                          onChange={(e) => setProfile({
                            ...profile,
                            notificationPreferences: {
                              ...profile.notificationPreferences,
                              email: e.target.checked,
                            },
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Notificaciones SMS</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.notificationPreferences.sms}
                          onChange={(e) => setProfile({
                            ...profile,
                            notificationPreferences: {
                              ...profile.notificationPreferences,
                              sms: e.target.checked,
                            },
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>Notificaciones Push</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.notificationPreferences.push}
                          onChange={(e) => setProfile({
                            ...profile,
                            notificationPreferences: {
                              ...profile.notificationPreferences,
                              push: e.target.checked,
                            },
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Banco</label>
                        <Input
                          value={profile.paymentInfo.bankName}
                          onChange={(e) => setProfile({
                            ...profile,
                            paymentInfo: {...profile.paymentInfo, bankName: e.target.value},
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Cuenta</label>
                        <Input
                          value={profile.paymentInfo.accountType}
                          onChange={(e) => setProfile({
                            ...profile,
                            paymentInfo: {...profile.paymentInfo, accountType: e.target.value},
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de Cuenta</label>
                        <Input
                          value={profile.paymentInfo.bankAccount}
                          onChange={(e) => setProfile({
                            ...profile,
                            paymentInfo: {...profile.paymentInfo, bankAccount: e.target.value},
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">RUT</label>
                        <Input
                          value={profile.paymentInfo.rut}
                          onChange={(e) => setProfile({
                            ...profile,
                            paymentInfo: {...profile.paymentInfo, rut: e.target.value},
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Certificado de Antecedentes</span>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Vence el 15 de Diciembre de 2024</p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Licencia de Conducir</span>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Vence el 20 de Marzo de 2025</p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Seguro de Accidentes</span>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Vence el 30 de Junio de 2024</p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">Subir nuevo documento</p>
                      <Button variant="outline" size="sm">
                        Seleccionar Archivo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}
