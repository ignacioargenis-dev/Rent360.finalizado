'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  MapPin, 
  Search,
  Building,
  UserIcon,
  CheckCircle
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface VisitFormData {
  propertyId: string;
  clientId: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes: string;
  photosRequired: boolean;
  specialInstructions: string;
  earnings: number;
}

interface PropertyOption {
  id: string;
  title: string;
  address: string;
  city: string;
  commune: string;
  price: number;
  status: string;
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'OWNER' | 'TENANT' | 'BOTH';
}

const durationOptions = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

export default function NewVisitPage() {
  const { user, loading: userLoading } = useUserState();

  const [formData, setFormData] = useState<VisitFormData>({
    propertyId: '',
    clientId: '',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: 30,
    priority: 'MEDIUM',
    notes: '',
    photosRequired: true,
    specialInstructions: '',
    earnings: 0,
  });

  const [properties, setProperties] = useState<PropertyOption[]>([]);

  const [clients, setClients] = useState<ClientOption[]>([]);

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [searchPropertyTerm, setSearchPropertyTerm] = useState('');

  const [searchClientTerm, setSearchClientTerm] = useState('');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockProperties: PropertyOption[] = [
        {
          id: '1',
          title: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          city: 'Santiago',
          commune: 'Las Condes',
          price: 550000,
          status: 'AVAILABLE',
        },
        {
          id: '2',
          title: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          city: 'Santiago',
          commune: 'Providencia',
          price: 350000,
          status: 'AVAILABLE',
        },
        {
          id: '3',
          title: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          city: 'Santiago',
          commune: 'Vitacura',
          price: 1200000,
          status: 'AVAILABLE',
        },
        {
          id: '4',
          title: 'Departamento Providencia',
          address: 'Av. Providencia 2345, Providencia',
          city: 'Santiago',
          commune: 'Providencia',
          price: 800000,
          status: 'AVAILABLE',
        },
      ];

      const mockClients: ClientOption[] = [
        {
          id: '1',
          name: 'Carlos Ramírez',
          email: 'carlos@ejemplo.com',
          phone: '+56 9 1234 5678',
          type: 'TENANT',
        },
        {
          id: '2',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
          phone: '+56 9 8765 4321',
          type: 'TENANT',
        },
        {
          id: '3',
          name: 'María González',
          email: 'maria@ejemplo.com',
          phone: '+56 9 2345 6789',
          type: 'OWNER',
        },
        {
          id: '4',
          name: 'Pedro Silva',
          email: 'pedro@ejemplo.com',
          phone: '+56 9 3456 7890',
          type: 'OWNER',
        },
        {
          id: '5',
          name: 'Laura Fernández',
          email: 'laura@ejemplo.com',
          phone: '+56 9 4567 8901',
          type: 'TENANT',
        },
      ];

      setProperties(mockProperties);
      setClients(mockClients);
    }, 500);
  }, []);

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.propertyId) {
newErrors.propertyId = 'Debes seleccionar una propiedad';
}
        if (!formData.clientId) {
newErrors.clientId = 'Debes seleccionar un cliente';
}
        break;
      case 2:
        if (!formData.scheduledDate) {
newErrors.scheduledDate = 'Debes seleccionar una fecha';
}
        if (!formData.scheduledTime) {
newErrors.scheduledTime = 'Debes seleccionar una hora';
}
        if (!formData.estimatedDuration) {
newErrors.estimatedDuration = 'Debes seleccionar una duración';
}
        break;
      case 3:
        if (!formData.priority) {
newErrors.priority = 'Debes seleccionar una prioridad';
}
        if (formData.earnings <= 0) {
newErrors.earnings = 'Las ganancias deben ser mayores a 0';
}
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleInputChange = (field: keyof VisitFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateEarnings = (duration: number, propertyPrice?: number) => {
    // Base rate per minute
    const baseRatePerMinute = 500;
    // Bonus for high-value properties
    const propertyBonus = propertyPrice && propertyPrice > 1000000 ? 200 : 0;
    return (duration * baseRatePerMinute) + propertyBonus;
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
return;
}

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would normally send the data to your API
      logger.debug('Visit data:', { formData });
      
      // Show success message and redirect
      alert('Visita programada exitosamente');
      // Redirect to runner visits page
    } catch (error) {
      logger.error('Error creating visit:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al programar la visita');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchPropertyTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchPropertyTerm.toLowerCase()),
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchClientTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchClientTerm.toLowerCase()),
  );

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const selectedClient = clients.find(c => c.id === formData.clientId);

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
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Nueva Visita"
        subtitle="Programa una nueva visita a propiedad"
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Progreso de Programación</h2>
                <span className="text-sm text-gray-600">Paso {step} de 4</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 4 && (
                      <div
                        className={`w-16 h-1 ${
                          step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <Card>
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Seleccionar Propiedad y Cliente</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Propiedad *
                        </label>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar propiedad..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchPropertyTerm}
                            onChange={(e) => setSearchPropertyTerm(e.target.value)}
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                          {filteredProperties.map((property) => (
                            <div
                              key={property.id}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                formData.propertyId === property.id ? 'bg-blue-50 border-blue-500' : ''
                              }`}
                              onClick={() => {
                                handleInputChange('propertyId', property.id);
                                // Auto-calculate earnings based on property price and duration
                                const earnings = calculateEarnings(formData.estimatedDuration, property.price);
                                handleInputChange('earnings', earnings);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{property.title}</h4>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {property.address}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {property.commune}, {property.city}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatPrice(property.price)}
                                  </p>
                                  <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                                    Disponible
                          </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.propertyId && <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cliente *
                        </label>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchClientTerm}
                            onChange={(e) => setSearchClientTerm(e.target.value)}
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                formData.clientId === client.id ? 'bg-blue-50 border-blue-500' : ''
                              }`}
                              onClick={() => handleInputChange('clientId', client.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                                  <p className="text-sm text-gray-600">{client.email}</p>
                                  <p className="text-sm text-gray-500">{client.phone}</p>
                                </div>
                                <Badge className={
                                  client.type === 'OWNER' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }>
                                  {client.type === 'OWNER' ? 'Propietario' : 'Inquilino'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Programar Fecha y Hora</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha *
                          </label>
                          <input
                            type="date"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.scheduledDate}
                            onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                            min={new Date().toISOString().substring(0, 10)}
                          />
                          {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hora *
                          </label>
                          <input
                            type="time"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={formData.scheduledTime}
                            onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                          />
                          {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duración estimada *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {durationOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`p-3 border rounded-lg text-center transition-colors ${
                                formData.estimatedDuration === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => {
                                handleInputChange('estimatedDuration', option.value);
                                // Recalculate earnings
                                const earnings = calculateEarnings(option.value, selectedProperty?.price);
                                handleInputChange('earnings', earnings);
                              }}
                            >
                              <div className="font-medium">{option.label}</div>
                            </button>
                          ))}
                        </div>
                        {errors.estimatedDuration && <p className="text-red-500 text-sm mt-1">{errors.estimatedDuration}</p>}
                      </div>

                      {selectedProperty && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-blue-900">Propiedad seleccionada</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-1">
                            <strong>{selectedProperty.title}</strong>
                          </p>
                          <p className="text-sm text-blue-700">
                            {selectedProperty.address}, {selectedProperty.commune}
                          </p>
                        </div>
                      )}

                      {selectedClient && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <UserIcon className="w-5 h-5 text-purple-600" />
                            <h4 className="font-medium text-purple-900">Cliente seleccionado</h4>
                          </div>
                          <p className="text-sm text-purple-700 mb-1">
                            <strong>{selectedClient.name}</strong>
                          </p>
                          <p className="text-sm text-purple-700">
                            {selectedClient.email} • {selectedClient.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detalles de la Visita</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridad *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {priorityOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`p-3 border rounded-lg text-center transition-colors ${
                                formData.priority === option.value
                                  ? `border-${option.color.split('-')[1]}-500 bg-${option.color.split('-')[1]}-50 text-${option.color.split('-')[1]}-700`
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => handleInputChange('priority', option.value)}
                            >
                              <div className="font-medium">{option.label}</div>
                            </button>
                          ))}
                        </div>
                        {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ganancias estimadas (CLP) *
                        </label>
                        <input
                          type="number"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.earnings ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="15000"
                          value={formData.earnings || ''}
                          onChange={(e) => handleInputChange('earnings', Number(e.target.value))}
                        />
                        {errors.earnings && <p className="text-red-500 text-sm mt-1">{errors.earnings}</p>}
                        <p className="text-sm text-gray-500 mt-1">
                          Calculado automáticamente según duración y valor de la propiedad
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.photosRequired}
                            onChange={(e) => handleInputChange('photosRequired', e.target.checked)}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Se requieren fotografías
                          </span>
                        </label>
                        <p className="text-sm text-gray-500 ml-6">
                          El cliente ha solicitado fotos detalladas de la propiedad
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas para el Runner
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Instrucciones especiales, puntos a destacar, etc."
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instrucciones especiales del cliente
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Requerimientos específicos del cliente para la visita"
                          value={formData.specialInstructions}
                          onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Resumen de la Visita</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Información General</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Propiedad:</span>
                            <span className="font-medium ml-2">{selectedProperty?.title}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cliente:</span>
                            <span className="font-medium ml-2">{selectedClient?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fecha:</span>
                            <span className="font-medium ml-2">{formData.scheduledDate}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Hora:</span>
                            <span className="font-medium ml-2">{formData.scheduledTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">Detalles de la Visita</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-blue-700">Duración:</span>
                            <span className="font-medium ml-2 text-blue-900">{formData.estimatedDuration} minutos</span>
                          </div>
                          <div>
                            <span className="text-blue-700">Prioridad:</span>
                            <span className="font-medium ml-2 text-blue-900">
                              {priorityOptions.find(p => p.value === formData.priority)?.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700">Ganancias:</span>
                            <span className="font-medium ml-2 text-blue-900">
                              {formatPrice(formData.earnings)}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700">Fotos requeridas:</span>
                            <span className="font-medium ml-2 text-blue-900">
                              {formData.photosRequired ? 'Sí' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {formData.notes && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-900 mb-2">Notas</h4>
                          <p className="text-sm text-yellow-800">{formData.notes}</p>
                        </div>
                      )}

                      {formData.specialInstructions && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-2">Instrucciones Especiales</h4>
                          <p className="text-sm text-orange-800">{formData.specialInstructions}</p>
                        </div>
                      )}

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Confirmación</h4>
                            <p className="text-sm text-green-700">
                              La visita ha sido programada correctamente. Se notificará al cliente y se enviarán los detalles a tu correo.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex gap-2">
                  {step < 4 ? (
                    <Button onClick={nextStep}>
                      Siguiente
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Programando Visita...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Programar Visita
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
