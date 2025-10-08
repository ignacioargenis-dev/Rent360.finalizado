'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: 'OWNER' | 'TENANT' | 'BOTH';
  address: string;
  region: string;
  commune: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
  sendWelcomeMessage: boolean;
}

const regions = [
  'Región Metropolitana',
  'Valparaíso',
  'Región del Libertador',
  'Región del Maule',
  'Región del Biobío',
  'Región de la Araucanía',
  'Región de Los Lagos',
  'Región de Aysén',
  'Región de Magallanes',
];

const communesByRegion: Record<string, string[]> = {
  'Región Metropolitana': [
    'Santiago Centro',
    'Providencia',
    'Las Condes',
    'Vitacura',
    'Ñuñoa',
    'La Reina',
    'Macul',
    'Peñalolén',
    'La Florida',
    'Puente Alto',
    'Maipú',
    'La Cisterna',
    'San Miguel',
    'Quinta Normal',
    'Recoleta',
    'Independencia',
    'Conchalí',
    'Huechuraba',
    'Renca',
    'Cerro Navia',
    'Lo Prado',
    'Pudahuel',
    'Quilicura',
    'Colina',
    'Lampa',
    'Til Til',
    'Pirque',
    'Puente Alto',
    'San José de Maipo',
    'Buin',
    'Calera de Tango',
    'Paine',
    'San Bernardo',
    'Alhué',
    'Curacaví',
    'El Monte',
    'Isla de Maipo',
    'Padre Hurtado',
    'Peñaflor',
    'Talagante',
  ],
  Valparaíso: [
    'Valparaíso',
    'Viña del Mar',
    'Concón',
    'Quilpué',
    'Villa Alemana',
    'Quillota',
    'La Calera',
    'Limache',
    'Olmué',
    'Quintero',
    'Puchuncaví',
    'San Antonio',
    'Santo Domingo',
    'Cartagena',
    'El Tabo',
    'El Quisco',
    'Algarrobo',
    'Casablanca',
    'Juan Fernández',
    'Isla de Pascua',
  ],
  'Región del Libertador': [
    'Rancagua',
    'Machalí',
    'Graneros',
    'San Francisco de Mostazal',
    'Codegua',
    'Coltauco',
    'Doñihue',
    'Coinco',
    'Colchagua',
    'Las Cabras',
    'Peumo',
    'Pichidegua',
    'Quinta de Tilcoco',
    'Rengo',
    'Requínoa',
    'Mostazal',
    'Olivar',
    'Malloa',
    'Marchihue',
    'Navidad',
    'Paredones',
    'Pichilemu',
    'Chépica',
    'Chimbarongo',
    'Lolol',
    'Nancagua',
    'Palmilla',
    'Peralillo',
    'Placilla',
    'Pumanque',
    'San Fernando',
    'Santa Cruz',
  ],
  'Región del Maule': [
    'Talca',
    'Constitución',
    'Curepto',
    'Empedrado',
    'Maule',
    'Pelarco',
    'Pencahue',
    'Río Claro',
    'San Clemente',
    'San Rafael',
    'Curicó',
    'Hualañé',
    'Licantén',
    'Molina',
    'Rauco',
    'Romeral',
    'Sagrada Familia',
    'Teno',
    'Vichuquén',
    'Linares',
    'Colbún',
    'Longaví',
    'Parral',
    'Retiro',
    'Villa Alegre',
    'Yerbas Buenas',
    'Cauquenes',
  ],
  'Región del Biobío': [
    'Concepción',
    'Talcahuano',
    'Chillán',
    'Los Ángeles',
    'Coronel',
    'Lota',
    'Penco',
    'Tomé',
    'Hualqui',
    'Florida',
    'Cabrero',
    'Yumbel',
    'San Rosendo',
    'Laja',
    'Nacimiento',
    'Negrete',
    'Quilaco',
    'Antuco',
    'Santa Bárbara',
    'Quilleco',
    'San Ignacio',
    'Alto Biobío',
    'Mulchén',
    'Quirihue',
    'Cobquecura',
    'Treguaco',
    'Coihueco',
    'Chillán Viejo',
    'Bulnes',
    'San Carlos',
    'Coihueco',
    'Pinto',
    'Coelemu',
    'Ránquil',
    'Portezuelo',
    'Ninhue',
    'Trehuaco',
  ],
  'Región de la Araucanía': [
    'Temuco',
    'Padre Las Casas',
    'Villarrica',
    'Pucón',
    'Valdivia',
    'La Unión',
    'Los Lagos',
    'Panguipulli',
    'Futrono',
    'Lanco',
    'Mariquina',
    'Paillaco',
    'Corral',
    'Máfil',
    'Loncoche',
    'Angol',
    'Collipulli',
    'Curacautín',
    'Ercilla',
    'Lonquimay',
    'Los Sauces',
    'Lumaco',
    'Purén',
    'Renaico',
    'Traiguén',
    'Victoria',
    'Carahue',
    'Cholchol',
    'Cunco',
    'Curarrehue',
    'Freire',
    'Galvarino',
    'Gorbea',
    'Lautaro',
    'Loncoche',
    'Melipeuco',
    'Nueva Imperial',
    'Padre Las Casas',
    'Perquenco',
    'Pitrufquén',
    'Pucón',
    'Saavedra',
    'Temuco',
    'Teodoro Schmidt',
    'Toltén',
    'Villarrica',
    'Vilcún',
    'Cochamó',
    'Fresia',
    'Frutillar',
    'Llanquihue',
    'Los Muermos',
    'Puerto Montt',
    'Puerto Varas',
    'Osorno',
    'Puerto Octay',
    'Purranque',
    'Puyehue',
    'Río Negro',
    'San Pablo',
    'San Juan de la Costa',
    'Calbuco',
    'Cochamó',
    'Maullín',
    'Puerto Varas',
    'Fresia',
    'Frutillar',
    'Llanquihue',
    'Los Muermos',
    'Puerto Montt',
  ],
  'Región de Los Lagos': [
    'Puerto Montt',
    'Puerto Varas',
    'Osorno',
    'Castro',
    'Ancud',
    'Quellón',
    'Calbuco',
    'Fresia',
    'Frutillar',
    'Llanquihue',
    'Los Muermos',
    'Puerto Octay',
    'Purranque',
    'Puyehue',
    'Río Negro',
    'San Pablo',
    'San Juan de la Costa',
    'Chaitén',
    'Futaleufú',
    'Hualaihué',
    'Palena',
    'Cochamó',
    'Maullín',
    'Carelmapu',
    'Dalcahue',
    'Puqueldón',
    'Queilén',
    'Quinchao',
    'Quemchi',
    'Chonchi',
    'Curaco de Vélez',
    'Puqueldón',
    'Queilén',
    'Quinchao',
    'Quemchi',
    'Chonchi',
    'Curaco de Vélez',
  ],
  'Región de Aysén': [
    'Coyhaique',
    'Lago Verde',
    'Aysén',
    'Cisnes',
    'Guaitecas',
    'Cochrane',
    "O'Higgins",
    'Tortel',
    'Chile Chico',
    'Río Ibáñez',
  ],
  'Región de Magallanes': [
    'Punta Arenas',
    'Laguna Blanca',
    'Río Verde',
    'San Gregorio',
    'Cabo de Hornos',
    'Antártica',
    'Porvenir',
    'Primavera',
    'Timaukel',
    'Natales',
    'Torres del Paine',
    'Cerro Sombrero',
  ],
};

export default function NewClientPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUserState();

  const [formData, setFormData] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    type: 'TENANT',
    address: '',
    region: '',
    commune: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    sendWelcomeMessage: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const availableCommunes = communesByRegion[formData.region] || [];

  useEffect(() => {
    // Clear commune when region changes
    if (formData.region && formData.commune && !availableCommunes.includes(formData.commune)) {
      setFormData(prev => ({ ...prev, commune: '' }));
    }
  }, [formData.region, formData.commune, availableCommunes]);

  const handleInputChange = (field: keyof NewClientForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    if (!formData.region) {
      newErrors.region = 'La región es obligatoria';
    }

    if (!formData.commune) {
      newErrors.commune = 'La comuna es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create client object
      const newClient = {
        id: `client_${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        address: formData.address,
        region: formData.region,
        commune: formData.commune,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        notes: formData.notes,
        status: 'active',
        totalServices: 0,
        propertyCount: 0,
        rating: 0,
        lastServiceDate: '',
        satisfactionScore: 0,
        specialInstructions: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in sessionStorage for demo
      const existingClients = JSON.parse(sessionStorage.getItem('runnerClients') || '[]');
      existingClients.push(newClient);
      sessionStorage.setItem('runnerClients', JSON.stringify(existingClients));

      setSuccessMessage('Cliente creado exitosamente');

      // Send welcome message if requested
      if (formData.sendWelcomeMessage) {
        alert(`Mensaje de bienvenida enviado a ${formData.firstName} ${formData.lastName}`);
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/runner/clients');
      }, 1500);
    } catch (error) {
      setErrorMessage('Error al crear el cliente. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <DashboardHeader
        user={user}
        title="Nuevo Cliente"
        subtitle="Agrega un nuevo cliente a tu cartera"
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={e => handleInputChange('firstName', e.target.value)}
                        placeholder="Ingresa el nombre"
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={e => handleInputChange('lastName', e.target.value)}
                        placeholder="Ingresa el apellido"
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        placeholder="cliente@email.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Cliente</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TENANT">Inquilino</SelectItem>
                        <SelectItem value="OWNER">Propietario</SelectItem>
                        <SelectItem value="BOTH">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ubicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Región *</Label>
                      <Select
                        value={formData.region}
                        onValueChange={value => handleInputChange('region', value)}
                      >
                        <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecciona una región" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.region && <p className="text-red-500 text-sm">{errors.region}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commune">Comuna *</Label>
                      <Select
                        value={formData.commune}
                        onValueChange={value => handleInputChange('commune', value)}
                        disabled={!formData.region}
                      >
                        <SelectTrigger className={errors.commune ? 'border-red-500' : ''}>
                          <SelectValue
                            placeholder={
                              formData.region
                                ? 'Selecciona una comuna'
                                : 'Primero selecciona región'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCommunes.map(commune => (
                            <SelectItem key={commune} value={commune}>
                              {commune}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.commune && <p className="text-red-500 text-sm">{errors.commune}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => handleInputChange('address', e.target.value)}
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contacto de Emergencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={e => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Nombre del contacto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={e => handleInputChange('emergencyPhone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Adicional</h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={e => handleInputChange('notes', e.target.value)}
                      placeholder="Información adicional sobre el cliente, preferencias, instrucciones especiales, etc."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendWelcomeMessage"
                      checked={formData.sendWelcomeMessage}
                      onCheckedChange={checked => handleInputChange('sendWelcomeMessage', checked)}
                    />
                    <Label htmlFor="sendWelcomeMessage" className="text-sm">
                      Enviar mensaje de bienvenida al cliente
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando Cliente...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Crear Cliente
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview/Info Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formData.firstName || 'Nombre'} {formData.lastName || 'Apellido'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.type === 'OWNER'
                          ? 'Propietario'
                          : formData.type === 'TENANT'
                            ? 'Inquilino'
                            : 'Ambos'}
                      </p>
                    </div>
                  </div>

                  {formData.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{formData.email}</p>
                      </div>
                    </div>
                  )}

                  {formData.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                  )}

                  {formData.region && formData.commune && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium">Ubicación</p>
                        <p className="text-sm text-gray-600">
                          {formData.commune}, {formData.region}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Próximos Pasos</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Se creará el perfil del cliente</li>
                    <li>• Se podrá asignar propiedades</li>
                    <li>• Se habilitará la mensajería directa</li>
                    {formData.sendWelcomeMessage && <li>• Se enviará mensaje de bienvenida</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
