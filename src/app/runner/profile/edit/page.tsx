'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Save,
  Camera,
  User,
  MapPin,
  Phone,
  Mail,
  Car,
  Wrench,
  Award,
  Upload,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface RunnerProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mobile: string;
    dateOfBirth: string;
    profileImage?: string;
  };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  professional: {
    experience: number;
    specialties: string[];
    certifications: string[];
    languages: string[];
    availability: {
      weekdays: boolean;
      weekends: boolean;
      evenings: boolean;
      emergencies: boolean;
    };
  };
  vehicle: {
    hasVehicle: boolean;
    type: string;
    model: string;
    year: number;
    licensePlate: string;
    insurance: boolean;
  };
  serviceArea: {
    regions: string[];
    maxDistance: number;
  };
  preferences: {
    notifications: boolean;
    marketingEmails: boolean;
    language: string;
  };
}

export default function EditRunnerProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<RunnerProfile>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      dateOfBirth: '',
      profileImage: '',
    },
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
    },
    professional: {
      experience: 0,
      specialties: [],
      certifications: [],
      languages: ['Español'],
      availability: {
        weekdays: true,
        weekends: false,
        evenings: false,
        emergencies: false,
      },
    },
    vehicle: {
      hasVehicle: true,
      type: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      insurance: false,
    },
    serviceArea: {
      regions: [],
      maxDistance: 50,
    },
    preferences: {
      notifications: true,
      marketingEmails: false,
      language: 'es',
    },
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const vehicleTypes = ['Automóvil', 'Camioneta', 'Motocicleta', 'Bicicleta', 'Scooter Eléctrico'];

  const specialties = [
    'Reparaciones Eléctricas',
    'Fontanería',
    'Cerrajería',
    'Pintura',
    'Jardinería',
    'Limpieza',
    'Mantenimiento General',
    'Instalaciones',
    'Mudanzas',
    'Servicio Técnico',
  ];

  const languages = ['Español', 'Inglés', 'Portugués', 'Francés', 'Italiano'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Simular carga de perfil existente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - en producción vendría de la API
      const mockProfile: RunnerProfile = {
        personalInfo: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+56912345678',
          mobile: '+56987654321',
          dateOfBirth: '1990-05-15',
          profileImage: '/api/placeholder/150/150',
        },
        address: {
          street: 'Av. Providencia 123',
          city: 'Santiago',
          region: 'Metropolitana',
          postalCode: '7500000',
        },
        professional: {
          experience: 5,
          specialties: ['Reparaciones Eléctricas', 'Fontanería', 'Cerrajería'],
          certifications: ['Certificación Eléctrica Básica', 'Primeros Auxilios'],
          languages: ['Español', 'Inglés'],
          availability: {
            weekdays: true,
            weekends: true,
            evenings: false,
            emergencies: true,
          },
        },
        vehicle: {
          hasVehicle: true,
          type: 'Automóvil',
          model: 'Toyota Corolla',
          year: 2020,
          licensePlate: 'AB-CD-12',
          insurance: true,
        },
        serviceArea: {
          regions: ['Metropolitana', 'Valparaíso', "O'Higgins"],
          maxDistance: 100,
        },
        preferences: {
          notifications: true,
          marketingEmails: false,
          language: 'es',
        },
      };

      setProfile(mockProfile);
    } catch (error) {
      logger.error('Error al cargar perfil', { error });
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !profile.professional.specialties.includes(newSpecialty.trim())) {
      setProfile(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          specialties: [...prev.professional.specialties, newSpecialty.trim()],
        },
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        specialties: prev.professional.specialties.filter(s => s !== specialty),
      },
    }));
  };

  const addCertification = () => {
    if (
      newCertification.trim() &&
      !profile.professional.certifications.includes(newCertification.trim())
    ) {
      setProfile(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          certifications: [...prev.professional.certifications, newCertification.trim()],
        },
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        certifications: prev.professional.certifications.filter(c => c !== certification),
      },
    }));
  };

  const addRegion = () => {
    if (newRegion && !profile.serviceArea.regions.includes(newRegion)) {
      setProfile(prev => ({
        ...prev,
        serviceArea: {
          ...prev.serviceArea,
          regions: [...prev.serviceArea.regions, newRegion],
        },
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (region: string) => {
    setProfile(prev => ({
      ...prev,
      serviceArea: {
        ...prev.serviceArea,
        regions: prev.serviceArea.regions.filter(r => r !== region),
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simular subida de imagen
      const reader = new FileReader();
      reader.onload = e => {
        setProfile(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            profileImage: e.target?.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!profile.personalInfo.firstName) {
      newErrors['personalInfo.firstName'] = 'Nombre es requerido';
    }
    if (!profile.personalInfo.lastName) {
      newErrors['personalInfo.lastName'] = 'Apellido es requerido';
    }
    if (!profile.personalInfo.email) {
      newErrors['personalInfo.email'] = 'Email es requerido';
    }
    if (!profile.personalInfo.phone) {
      newErrors['personalInfo.phone'] = 'Teléfono es requerido';
    }

    if (profile.personalInfo.email && !/\S+@\S+\.\S+/.test(profile.personalInfo.email)) {
      newErrors['personalInfo.email'] = 'Email inválido';
    }

    if (!profile.address.street) {
      newErrors['address.street'] = 'Dirección es requerida';
    }
    if (!profile.address.city) {
      newErrors['address.city'] = 'Ciudad es requerida';
    }
    if (!profile.address.region) {
      newErrors['address.region'] = 'Región es requerida';
    }

    if (profile.vehicle.hasVehicle) {
      if (!profile.vehicle.type) {
        newErrors['vehicle.type'] = 'Tipo de vehículo es requerido';
      }
      if (!profile.vehicle.licensePlate) {
        newErrors['vehicle.licensePlate'] = 'Patente es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Perfil de runner actualizado exitosamente', {
        email: profile.personalInfo.email,
        specialties: profile.professional.specialties.length,
      });

      setSuccessMessage('Perfil actualizado exitosamente');

      setTimeout(() => {
        router.push('/runner/profile');
      }, 2000);
    } catch (error) {
      logger.error('Error al actualizar perfil', { error });
      setErrorMessage('Error al actualizar el perfil. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/runner/profile');
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
            <p className="text-gray-600">Actualiza tu información personal y profesional</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Foto de Perfil */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.personalInfo.profileImage} />
                    <AvatarFallback>
                      {profile.personalInfo.firstName && profile.personalInfo.lastName ? (
                        `${profile.personalInfo.firstName[0]}${profile.personalInfo.lastName[0]}`
                      ) : (
                        <Camera className="w-8 h-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="profileImage" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Camera className="w-4 h-4" />
                        Cambiar Foto
                      </div>
                      <Input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG hasta 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={profile.personalInfo.firstName}
                      onChange={e => handleInputChange('personalInfo.firstName', e.target.value)}
                    />
                    {errors['personalInfo.firstName'] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors['personalInfo.firstName']}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={profile.personalInfo.lastName}
                      onChange={e => handleInputChange('personalInfo.lastName', e.target.value)}
                    />
                    {errors['personalInfo.lastName'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['personalInfo.lastName']}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.personalInfo.email}
                    onChange={e => handleInputChange('personalInfo.email', e.target.value)}
                  />
                  {errors['personalInfo.email'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['personalInfo.email']}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={profile.personalInfo.phone}
                      onChange={e => handleInputChange('personalInfo.phone', e.target.value)}
                    />
                    {errors['personalInfo.phone'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['personalInfo.phone']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mobile">Teléfono Móvil</Label>
                    <Input
                      id="mobile"
                      value={profile.personalInfo.mobile}
                      onChange={e => handleInputChange('personalInfo.mobile', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.personalInfo.dateOfBirth}
                    onChange={e => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dirección */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Dirección *</Label>
                  <Input
                    id="street"
                    value={profile.address.street}
                    onChange={e => handleInputChange('address.street', e.target.value)}
                    placeholder="Calle, número, departamento"
                  />
                  {errors['address.street'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['address.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={profile.address.city}
                      onChange={e => handleInputChange('address.city', e.target.value)}
                    />
                    {errors['address.city'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['address.city']}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={profile.address.postalCode}
                      onChange={e => handleInputChange('address.postalCode', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="region">Región *</Label>
                  <Select
                    value={profile.address.region}
                    onValueChange={value => handleInputChange('address.region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione región" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors['address.region'] && (
                    <p className="text-sm text-red-600 mt-1">{errors['address.region']}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información Profesional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Información Profesional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="experience">Años de Experiencia</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={profile.professional.experience}
                    onChange={e =>
                      handleInputChange('professional.experience', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Especialidades */}
                <div>
                  <Label>Especialidades</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map(specialty => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addSpecialty} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {profile.professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.professional.specialties.map(specialty => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certificaciones */}
                <div>
                  <Label>Certificaciones</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCertification}
                      onChange={e => setNewCertification(e.target.value)}
                      placeholder="Ej: Certificación Eléctrica"
                      onKeyPress={e =>
                        e.key === 'Enter' && (e.preventDefault(), addCertification())
                      }
                    />
                    <Button type="button" onClick={addCertification} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {profile.professional.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.professional.certifications.map(certification => (
                        <Badge
                          key={certification}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {certification}
                          <button
                            type="button"
                            onClick={() => removeCertification(certification)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Idiomas */}
                <div>
                  <Label>Idiomas</Label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(language => (
                      <label key={language} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profile.professional.languages.includes(language)}
                          onChange={e => {
                            const updatedLanguages = e.target.checked
                              ? [...profile.professional.languages, language]
                              : profile.professional.languages.filter(l => l !== language);
                            handleInputChange('professional.languages', updatedLanguages);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Disponibilidad */}
                <div>
                  <Label>Disponibilidad</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekdays"
                        checked={profile.professional.availability.weekdays}
                        onChange={e =>
                          handleInputChange('professional.availability.weekdays', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label htmlFor="weekdays">Días de semana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekends"
                        checked={profile.professional.availability.weekends}
                        onChange={e =>
                          handleInputChange('professional.availability.weekends', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label htmlFor="weekends">Fines de semana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="evenings"
                        checked={profile.professional.availability.evenings}
                        onChange={e =>
                          handleInputChange('professional.availability.evenings', e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label htmlFor="evenings">Tardes/noches</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="emergencies"
                        checked={profile.professional.availability.emergencies}
                        onChange={e =>
                          handleInputChange(
                            'professional.availability.emergencies',
                            e.target.checked
                          )
                        }
                        className="rounded"
                      />
                      <Label htmlFor="emergencies">Emergencias 24/7</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasVehicle"
                    checked={profile.vehicle.hasVehicle}
                    onChange={e => handleInputChange('vehicle.hasVehicle', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="hasVehicle">Tengo vehículo propio</Label>
                </div>

                {profile.vehicle.hasVehicle && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleType">Tipo de Vehículo *</Label>
                        <Select
                          value={profile.vehicle.type}
                          onValueChange={value => handleInputChange('vehicle.type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors['vehicle.type'] && (
                          <p className="text-sm text-red-600 mt-1">{errors['vehicle.type']}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="model">Modelo</Label>
                        <Input
                          id="model"
                          value={profile.vehicle.model}
                          onChange={e => handleInputChange('vehicle.model', e.target.value)}
                          placeholder="Ej: Toyota Corolla"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year">Año</Label>
                        <Input
                          id="year"
                          type="number"
                          min="1990"
                          max={new Date().getFullYear() + 1}
                          value={profile.vehicle.year}
                          onChange={e =>
                            handleInputChange(
                              'vehicle.year',
                              parseInt(e.target.value) || new Date().getFullYear()
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="licensePlate">Patente *</Label>
                        <Input
                          id="licensePlate"
                          value={profile.vehicle.licensePlate}
                          onChange={e => handleInputChange('vehicle.licensePlate', e.target.value)}
                          placeholder="AB-CD-12"
                        />
                        {errors['vehicle.licensePlate'] && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors['vehicle.licensePlate']}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="insurance"
                        checked={profile.vehicle.insurance}
                        onChange={e => handleInputChange('vehicle.insurance', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="insurance">Vehículo asegurado</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Área de Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Área de Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Regiones donde presto servicio</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value={newRegion} onValueChange={setNewRegion}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addRegion} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {profile.serviceArea.regions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.serviceArea.regions.map(region => (
                        <Badge key={region} variant="outline" className="flex items-center gap-1">
                          {region}
                          <button
                            type="button"
                            onClick={() => removeRegion(region)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="maxDistance">Distancia máxima (km)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    min="10"
                    max="500"
                    value={profile.serviceArea.maxDistance}
                    onChange={e =>
                      handleInputChange('serviceArea.maxDistance', parseInt(e.target.value) || 50)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={profile.preferences.notifications}
                    onChange={e => handleInputChange('preferences.notifications', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="notifications">Recibir notificaciones de nuevos trabajos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    checked={profile.preferences.marketingEmails}
                    onChange={e =>
                      handleInputChange('preferences.marketingEmails', e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="marketingEmails">Recibir emails de marketing</Label>
                </div>

                <div>
                  <Label htmlFor="language">Idioma preferido</Label>
                  <Select
                    value={profile.preferences.language}
                    onValueChange={value => handleInputChange('preferences.language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
