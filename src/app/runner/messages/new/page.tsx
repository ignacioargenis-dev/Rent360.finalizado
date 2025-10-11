'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { ArrowLeft, Send, User, Building, MapPin, Search, CheckCircle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'OWNER' | 'TENANT' | 'BOTH';
  properties?: Array<{
    id: string;
    title: string;
    address: string;
  }>;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  commune: string;
  price: number;
  status: string;
}

export default function NewRunnerMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useAuth();

  const [formData, setFormData] = useState({
    recipientId: '',
    propertyId: '',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [searchPropertyTerm, setSearchPropertyTerm] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockClients: Client[] = [
        {
          id: 'c1',
          name: 'Carlos Ramírez',
          email: 'carlos@ejemplo.com',
          phone: '+56 9 1234 5678',
          type: 'OWNER',
          properties: [
            { id: 'p1', title: 'Departamento Las Condes', address: 'Av. Apoquindo 3400' },
            { id: 'p2', title: 'Casa Vitacura', address: 'Av. Vitacura 8900' },
          ],
        },
        {
          id: 'c2',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
          phone: '+56 9 8765 4321',
          type: 'TENANT',
          properties: [{ id: 'p3', title: 'Oficina Providencia', address: 'Av. Providencia 1245' }],
        },
        {
          id: 'c3',
          name: 'Pedro Silva',
          email: 'pedro@ejemplo.com',
          phone: '+56 9 2345 6789',
          type: 'BOTH',
          properties: [{ id: 'p4', title: 'Local Comercial Centro', address: 'Ahumada 456' }],
        },
      ];

      const mockProperties: Property[] = [
        {
          id: 'p1',
          title: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          city: 'Santiago',
          commune: 'Las Condes',
          price: 850000,
          status: 'available',
        },
        {
          id: 'p2',
          title: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          city: 'Santiago',
          commune: 'Vitacura',
          price: 2500000,
          status: 'available',
        },
        {
          id: 'p3',
          title: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          city: 'Santiago',
          commune: 'Providencia',
          price: 1200000,
          status: 'rented',
        },
        {
          id: 'p4',
          title: 'Local Comercial Centro',
          address: 'Ahumada 456, Santiago Centro',
          city: 'Santiago',
          commune: 'Santiago',
          price: 1800000,
          status: 'available',
        },
      ];

      setClients(mockClients);
      setProperties(mockProperties);
      setFilteredClients(mockClients);
      setFilteredProperties(mockProperties);
    }, 500);
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    const filtered = clients.filter(
      client =>
        client.name.toLowerCase().includes(searchClientTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchClientTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchClientTerm]);

  useEffect(() => {
    // Filter properties based on search term
    const filtered = properties.filter(
      property =>
        property.title.toLowerCase().includes(searchPropertyTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchPropertyTerm.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [properties, searchPropertyTerm]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientId) {
      newErrors.recipientId = 'Debes seleccionar un destinatario';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es obligatorio';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje no puede estar vacío';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create message object
      const newMessage = {
        id: `msg_${Date.now()}`,
        sender: {
          id: user?.id || 'runner1',
          name: user?.name || 'Corredor',
          email: user?.email || 'runner@rent360.cl',
          role: 'runner',
        },
        recipient:
          clients.find(c => c.id === formData.recipientId) ||
          properties.find(p => p.id === formData.propertyId),
        subject: formData.subject,
        content: formData.message,
        timestamp: new Date().toISOString(),
        type: 'general',
        read: false,
        priority: formData.priority,
        propertyId: formData.propertyId,
        propertyTitle: properties.find(p => p.id === formData.propertyId)?.title || '',
      };

      // Store in sessionStorage for demo
      const existingMessages = JSON.parse(sessionStorage.getItem('runnerMessages') || '[]');
      existingMessages.push(newMessage);
      sessionStorage.setItem('runnerMessages', JSON.stringify(existingMessages));

      alert('Mensaje enviado exitosamente');

      // Redirect back to messages
      router.push('/runner/messages');
    } catch (error) {
      alert('Error al enviar el mensaje. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.recipientId);
  const selectedProperty = properties.find(p => p.id === formData.propertyId);

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
        title="Nuevo Mensaje"
        subtitle="Envía un mensaje a un cliente o propietario"
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Redactar Mensaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipient Selection */}
                <div>
                  <Label className="text-base font-medium">Destinatario *</Label>
                  <div className="mt-2 space-y-4">
                    {/* Client Search */}
                    <div>
                      <Label htmlFor="clientSearch" className="text-sm font-medium">
                        Buscar Cliente
                      </Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="clientSearch"
                          placeholder="Buscar por nombre o email..."
                          className="pl-10"
                          value={searchClientTerm}
                          onChange={e => setSearchClientTerm(e.target.value)}
                        />
                      </div>
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                        {filteredClients.map(client => (
                          <div
                            key={client.id}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                              formData.recipientId === client.id ? 'bg-blue-50 border-blue-500' : ''
                            }`}
                            onClick={() => handleInputChange('recipientId', client.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{client.name}</p>
                                  <p className="text-sm text-gray-600">{client.email}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {client.type === 'OWNER'
                                  ? 'Propietario'
                                  : client.type === 'TENANT'
                                    ? 'Inquilino'
                                    : 'Ambos'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.recipientId && (
                        <p className="text-red-500 text-sm mt-1">{errors.recipientId}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Selection */}
                <div>
                  <Label className="text-base font-medium">Propiedad Relacionada (Opcional)</Label>
                  <div className="mt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar propiedad..."
                        className="pl-10"
                        value={searchPropertyTerm}
                        onChange={e => setSearchPropertyTerm(e.target.value)}
                      />
                    </div>
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                      {filteredProperties.map(property => (
                        <div
                          key={property.id}
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                            formData.propertyId === property.id ? 'bg-blue-50 border-blue-500' : ''
                          }`}
                          onClick={() => handleInputChange('propertyId', property.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Building className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{property.title}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.address}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              ${property.price.toLocaleString('es-CL')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject" className="text-base font-medium">
                    Asunto *
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Asunto del mensaje..."
                    value={formData.subject}
                    onChange={e => handleInputChange('subject', e.target.value)}
                    className={errors.subject ? 'border-red-500' : ''}
                  />
                  {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-base font-medium">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Baja
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Media
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Urgente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-base font-medium">
                    Mensaje *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                    value={formData.message}
                    onChange={e => handleInputChange('message', e.target.value)}
                    className={errors.message ? 'border-red-500' : ''}
                  />
                  {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensaje
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
                <CardTitle>Información del Mensaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedClient && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Destinatario</h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedClient.name}</p>
                        <p className="text-sm text-gray-600">{selectedClient.email}</p>
                        <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProperty && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Propiedad Relacionada</h4>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{selectedProperty.title}</p>
                        <p className="text-sm text-gray-600">{selectedProperty.address}</p>
                        <p className="text-sm text-green-600 font-medium">
                          ${selectedProperty.price.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedClient && !selectedProperty && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Selecciona un destinatario y propiedad (opcional)</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Consejos</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sé claro y específico en tu mensaje</li>
                    <li>• Incluye información de contacto si es necesario</li>
                    <li>• Usa la prioridad adecuada según la urgencia</li>
                    <li>• Relaciona el mensaje con una propiedad si aplica</li>
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
