'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateRut, validateEmail, validatePhone, validatePassword, validateAmount  } from '@/lib/validations';
import { Wrench, 
  User, Building, CreditCard,
  FileText,
  AlertCircle,
  Truck,
  CheckCircle,
  MapPin,
  Shield } from 'lucide-react';
interface ProviderFormData {
  // Datos del usuario
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
  
  // Datos del negocio
  businessName: string
  rut: string
  address: string
  city: string
  region: string
  description: string
  
  // Datos específicos del provider
  specialty?: string
  specialties: string[]
  hourlyRate?: string
  serviceType?: 'MOVING' | 'CLEANING' | 'GARDENING' | 'PACKING' | 'STORAGE' | 'OTHER'
  serviceTypes: string[]
  basePrice?: string
  
  // Datos bancarios
  bank: string
  accountType: 'CHECKING' | 'SAVINGS'
  accountNumber: string
  holderName: string
  bankRut: string
  
  // Documentos (URLs temporales)
  criminalRecord: string
  idFront: string
  idBack: string
  businessCertificate: string
}

const initialFormData: ProviderFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  businessName: '',
  rut: '',
  address: '',
  city: '',
  region: '',
  description: '',
  specialties: [],
  serviceTypes: [],
  bank: '',
  accountType: 'CHECKING',
  accountNumber: '',
  holderName: '',
  bankRut: '',
  criminalRecord: '',
  idFront: '',
  idBack: '',
  businessCertificate: '',
};

const maintenanceSpecialties = [
  'Plomería', 'Electricidad', 'HVAC', 'Carpintería', 'Pintura', 
  'Jardinería', 'Limpieza', 'Estructural', 'Electrodomésticos', 'Otros',
];

const serviceTypes = [
  'Mudanza', 'Limpieza', 'Jardinería', 'Empaque', 'Almacenamiento', 'Otros',
];

const banks = [
  'Banco de Chile', 'Banco Santander', 'Banco BCI', 'Banco Estado',
  'Banco Scotiabank', 'Banco Itaú', 'Banco Security', 'Banco Consorcio',
  'Banco Falabella', 'Banco Ripley', 'Otro',
];

export default function RegisterProviderPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('maintenance');

  const [formData, setFormData] = useState<ProviderFormData>(initialFormData);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof ProviderFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas con funciones de validación
    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join(', ');
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.name) {
newErrors.name = 'Nombre es requerido';
}
    
    if (!formData.phone) {
      newErrors.phone = 'Teléfono es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Teléfono inválido (formato: +56 9 XXXX XXXX)';
    }

    if (!formData.businessName) {
newErrors.businessName = 'Nombre del negocio es requerido';
}
    
    if (!formData.rut) {
      newErrors.rut = 'RUT es requerido';
    } else if (!validateRut(formData.rut)) {
      newErrors.rut = 'RUT inválido';
    }

    if (!formData.bank) {
newErrors.bank = 'Banco es requerido';
}
    if (!formData.accountNumber) {
newErrors.accountNumber = 'Número de cuenta es requerido';
}
    if (!formData.holderName) {
newErrors.holderName = 'Nombre del titular es requerido';
}
    
    if (!formData.bankRut) {
      newErrors.bankRut = 'RUT del titular es requerido';
    } else if (!validateRut(formData.bankRut)) {
      newErrors.bankRut = 'RUT del titular inválido';
    }

    // Validaciones específicas por tipo
    if (activeTab === 'maintenance') {
      if (!formData.specialty) {
newErrors.specialty = 'Especialidad es requerida';
}
      if (!formData.hourlyRate) {
        newErrors.hourlyRate = 'Tarifa por hora es requerida';
      } else {
        const hourlyRate = parseFloat(formData.hourlyRate);
        if (!validateAmount(hourlyRate, 15000, 100000)) {
          newErrors.hourlyRate = 'Tarifa por hora debe estar entre $15.000 y $100.000';
        }
      }
      if (formData.specialties.length === 0) {
        newErrors.specialties = 'Debe seleccionar al menos una especialidad';
      }
    } else {
      if (!formData.serviceType) {
newErrors.serviceType = 'Tipo de servicio es requerido';
}
      if (!formData.basePrice) {
        newErrors.basePrice = 'Precio base es requerido';
      } else {
        const basePrice = parseFloat(formData.basePrice);
        if (!validateAmount(basePrice, 20000, 500000)) {
          newErrors.basePrice = 'Precio base debe estar entre $20.000 y $500.000';
        }
      }
      if (formData.serviceTypes.length === 0) {
        newErrors.serviceTypes = 'Debe seleccionar al menos un tipo de servicio';
      }
    }

    // Validaciones de documentos (simuladas)
    if (!formData.criminalRecord) {
newErrors.criminalRecord = 'Antecedentes penales son requeridos';
}
    if (!formData.idFront) {
newErrors.idFront = 'Carnet frontal es requerido';
}
    if (!formData.idBack) {
newErrors.idBack = 'Carnet reverso es requerido';
}
    if (!formData.businessCertificate) {
newErrors.businessCertificate = 'Certificado de inicio de actividades es requerido';
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
return;
}

    setLoading(true);
    try {
      const providerData = {
        providerType: activeTab,
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
        bankAccount: {
          bank: formData.bank,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          holderName: formData.holderName,
          rut: formData.bankRut,
        },
        documents: {
          criminalRecord: formData.criminalRecord,
          idFront: formData.idFront,
          idBack: formData.idBack,
          businessCertificate: formData.businessCertificate,
        },
      };

      const response = await fetch('/api/auth/register-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrors({ general: result.error || 'Error al registrar proveedor' });
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const addSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      handleInputChange('specialties', [...formData.specialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    handleInputChange('specialties', formData.specialties.filter(s => s !== specialty));
  };

  const addServiceType = (serviceType: string) => {
    if (!formData.serviceTypes.includes(serviceType)) {
      handleInputChange('serviceTypes', [...formData.serviceTypes, serviceType]);
    }
  };

  const removeServiceType = (serviceType: string) => {
    handleInputChange('serviceTypes', formData.serviceTypes.filter(s => s !== serviceType));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Registro Exitoso!
              </h2>
              <p className="text-gray-600 mb-4">
                Tu solicitud ha sido enviada y está pendiente de verificación.
                Te notificaremos cuando tu cuenta esté activa.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Próximos pasos:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Revisión de documentos (1-2 días hábiles)</li>
                  <li>• Verificación de cuenta bancaria</li>
                  <li>• Activación de cuenta</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Únete como Prestador de Servicios
          </h1>
          <p className="text-gray-600">
            Ofrece tus servicios profesionales y gana dinero con Rent360
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Mantenimiento
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Servicios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Prestador de Mantenimiento
                </CardTitle>
                <CardDescription>
                  Reparaciones técnicas domiciliarias para propiedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Tu nombre completo"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="tu@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+56 9 1234 5678"
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="password">Contraseña *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repite tu contraseña"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Información del Negocio */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Información del Negocio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Nombre del Negocio *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          placeholder="Ej: Servicios Técnicos Juan Pérez"
                        />
                        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="rut">RUT *</Label>
                        <Input
                          id="rut"
                          value={formData.rut}
                          onChange={(e) => handleInputChange('rut', e.target.value)}
                          placeholder="12.345.678-9"
                        />
                        {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut}</p>}
                      </div>
                      <div>
                        <Label htmlFor="specialty">Especialidad Principal *</Label>
                        <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu especialidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {maintenanceSpecialties.map(specialty => (
                              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.specialty && <p className="text-red-500 text-sm mt-1">{errors.specialty}</p>}
                      </div>
                      <div>
                        <Label htmlFor="hourlyRate">Tarifa por Hora (CLP) *</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                          placeholder="25000"
                        />
                        {errors.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>}
                      </div>
                    </div>

                    {/* Especialidades */}
                    <div>
                      <Label>Especialidades Adicionales</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {maintenanceSpecialties.map(specialty => (
                          <Badge
                            key={specialty}
                            variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => formData.specialties.includes(specialty) 
                              ? removeSpecialty(specialty) 
                              : addSpecialty(specialty)
                            }
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      {errors.specialties && <p className="text-red-500 text-sm mt-1">{errors.specialties}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Calle y número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Santiago"
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Región</Label>
                        <Input
                          id="region"
                          value={formData.region}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          placeholder="Metropolitana"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción del Negocio</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe tus servicios, experiencia y especialidades..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Información Bancaria */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Información Bancaria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank">Banco *</Label>
                        <Select value={formData.bank} onValueChange={(value) => handleInputChange('bank', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map(bank => (
                              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bank && <p className="text-red-500 text-sm mt-1">{errors.bank}</p>}
                      </div>
                      <div>
                        <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                        <Select value={formData.accountType} onValueChange={(value: 'CHECKING' | 'SAVINGS') => handleInputChange('accountType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CHECKING">Cuenta Corriente</SelectItem>
                            <SelectItem value="SAVINGS">Cuenta Vista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Número de Cuenta *</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                          placeholder="12345678"
                        />
                        {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                      </div>
                      <div>
                        <Label htmlFor="holderName">Nombre del Titular *</Label>
                        <Input
                          id="holderName"
                          value={formData.holderName}
                          onChange={(e) => handleInputChange('holderName', e.target.value)}
                          placeholder="Nombre completo del titular"
                        />
                        {errors.holderName && <p className="text-red-500 text-sm mt-1">{errors.holderName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="bankRut">RUT del Titular *</Label>
                        <Input
                          id="bankRut"
                          value={formData.bankRut}
                          onChange={(e) => handleInputChange('bankRut', e.target.value)}
                          placeholder="12.345.678-9"
                        />
                        {errors.bankRut && <p className="text-red-500 text-sm mt-1">{errors.bankRut}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentos Requeridos
                    </h3>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Todos los documentos son obligatorios para la verificación de tu cuenta.
                        Puedes subirlos más tarde desde tu panel de control.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="criminalRecord">Antecedentes Penales (PDF) *</Label>
                        <Input
                          id="criminalRecord"
                          value={formData.criminalRecord}
                          onChange={(e) => handleInputChange('criminalRecord', e.target.value)}
                          placeholder="URL del documento"
                        />
                        {errors.criminalRecord && <p className="text-red-500 text-sm mt-1">{errors.criminalRecord}</p>}
                      </div>
                      <div>
                        <Label htmlFor="businessCertificate">Certificado Inicio Actividades (PDF) *</Label>
                        <Input
                          id="businessCertificate"
                          value={formData.businessCertificate}
                          onChange={(e) => handleInputChange('businessCertificate', e.target.value)}
                          placeholder="URL del documento"
                        />
                        {errors.businessCertificate && <p className="text-red-500 text-sm mt-1">{errors.businessCertificate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="idFront">Carnet Frontal (Imagen) *</Label>
                        <Input
                          id="idFront"
                          value={formData.idFront}
                          onChange={(e) => handleInputChange('idFront', e.target.value)}
                          placeholder="URL de la imagen"
                        />
                        {errors.idFront && <p className="text-red-500 text-sm mt-1">{errors.idFront}</p>}
                      </div>
                      <div>
                        <Label htmlFor="idBack">Carnet Reverso (Imagen) *</Label>
                        <Input
                          id="idBack"
                          value={formData.idBack}
                          onChange={(e) => handleInputChange('idBack', e.target.value)}
                          placeholder="URL de la imagen"
                        />
                        {errors.idBack && <p className="text-red-500 text-sm mt-1">{errors.idBack}</p>}
                      </div>
                    </div>
                  </div>

                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrar como Prestador de Mantenimiento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Prestador de Servicios
                </CardTitle>
                <CardDescription>
                  Mudanza, limpieza, jardinería y otros servicios para inquilinos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal - Similar al maintenance */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Tu nombre completo"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="tu@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+56 9 1234 5678"
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="password">Contraseña *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repite tu contraseña"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Información del Negocio */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Información del Negocio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Nombre del Negocio *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          placeholder="Ej: Servicios de Mudanza Express"
                        />
                        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="rut">RUT *</Label>
                        <Input
                          id="rut"
                          value={formData.rut}
                          onChange={(e) => handleInputChange('rut', e.target.value)}
                          placeholder="12.345.678-9"
                        />
                        {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut}</p>}
                      </div>
                      <div>
                        <Label htmlFor="serviceType">Tipo de Servicio Principal *</Label>
                        <Select value={formData.serviceType} onValueChange={(value: 'MOVING' | 'CLEANING' | 'GARDENING' | 'PACKING' | 'STORAGE' | 'OTHER') => handleInputChange('serviceType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu servicio principal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MOVING">Mudanza</SelectItem>
                            <SelectItem value="CLEANING">Limpieza</SelectItem>
                            <SelectItem value="GARDENING">Jardinería</SelectItem>
                            <SelectItem value="PACKING">Empaque</SelectItem>
                            <SelectItem value="STORAGE">Almacenamiento</SelectItem>
                            <SelectItem value="OTHER">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType}</p>}
                      </div>
                      <div>
                        <Label htmlFor="basePrice">Precio Base (CLP) *</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => handleInputChange('basePrice', e.target.value)}
                          placeholder="50000"
                        />
                        {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
                      </div>
                    </div>

                    {/* Tipos de Servicios */}
                    <div>
                      <Label>Tipos de Servicios Ofrecidos</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {serviceTypes.map(serviceType => (
                          <Badge
                            key={serviceType}
                            variant={formData.serviceTypes.includes(serviceType) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => formData.serviceTypes.includes(serviceType) 
                              ? removeServiceType(serviceType) 
                              : addServiceType(serviceType)
                            }
                          >
                            {serviceType}
                          </Badge>
                        ))}
                      </div>
                      {errors.serviceTypes && <p className="text-red-500 text-sm mt-1">{errors.serviceTypes}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Calle y número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Santiago"
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Región</Label>
                        <Input
                          id="region"
                          value={formData.region}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          placeholder="Metropolitana"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción del Negocio</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe tus servicios, experiencia y especialidades..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Información Bancaria - Similar al maintenance */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Información Bancaria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank">Banco *</Label>
                        <Select value={formData.bank} onValueChange={(value) => handleInputChange('bank', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map(bank => (
                              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bank && <p className="text-red-500 text-sm mt-1">{errors.bank}</p>}
                      </div>
                      <div>
                        <Label htmlFor="accountType">Tipo de Cuenta *</Label>
                        <Select value={formData.accountType} onValueChange={(value: 'CHECKING' | 'SAVINGS') => handleInputChange('accountType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CHECKING">Cuenta Corriente</SelectItem>
                            <SelectItem value="SAVINGS">Cuenta Vista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Número de Cuenta *</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                          placeholder="12345678"
                        />
                        {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                      </div>
                      <div>
                        <Label htmlFor="holderName">Nombre del Titular *</Label>
                        <Input
                          id="holderName"
                          value={formData.holderName}
                          onChange={(e) => handleInputChange('holderName', e.target.value)}
                          placeholder="Nombre completo del titular"
                        />
                        {errors.holderName && <p className="text-red-500 text-sm mt-1">{errors.holderName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="bankRut">RUT del Titular *</Label>
                        <Input
                          id="bankRut"
                          value={formData.bankRut}
                          onChange={(e) => handleInputChange('bankRut', e.target.value)}
                          placeholder="12.345.678-9"
                        />
                        {errors.bankRut && <p className="text-red-500 text-sm mt-1">{errors.bankRut}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Documentos - Similar al maintenance */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentos Requeridos
                    </h3>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Todos los documentos son obligatorios para la verificación de tu cuenta.
                        Puedes subirlos más tarde desde tu panel de control.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="criminalRecord">Antecedentes Penales (PDF) *</Label>
                        <Input
                          id="criminalRecord"
                          value={formData.criminalRecord}
                          onChange={(e) => handleInputChange('criminalRecord', e.target.value)}
                          placeholder="URL del documento"
                        />
                        {errors.criminalRecord && <p className="text-red-500 text-sm mt-1">{errors.criminalRecord}</p>}
                      </div>
                      <div>
                        <Label htmlFor="businessCertificate">Certificado Inicio Actividades (PDF) *</Label>
                        <Input
                          id="businessCertificate"
                          value={formData.businessCertificate}
                          onChange={(e) => handleInputChange('businessCertificate', e.target.value)}
                          placeholder="URL del documento"
                        />
                        {errors.businessCertificate && <p className="text-red-500 text-sm mt-1">{errors.businessCertificate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="idFront">Carnet Frontal (Imagen) *</Label>
                        <Input
                          id="idFront"
                          value={formData.idFront}
                          onChange={(e) => handleInputChange('idFront', e.target.value)}
                          placeholder="URL de la imagen"
                        />
                        {errors.idFront && <p className="text-red-500 text-sm mt-1">{errors.idFront}</p>}
                      </div>
                      <div>
                        <Label htmlFor="idBack">Carnet Reverso (Imagen) *</Label>
                        <Input
                          id="idBack"
                          value={formData.idBack}
                          onChange={(e) => handleInputChange('idBack', e.target.value)}
                          placeholder="URL de la imagen"
                        />
                        {errors.idBack && <p className="text-red-500 text-sm mt-1">{errors.idBack}</p>}
                      </div>
                    </div>
                  </div>

                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrar como Prestador de Servicios'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
