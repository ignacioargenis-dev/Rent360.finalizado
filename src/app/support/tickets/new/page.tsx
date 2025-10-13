'use client';

import { logger } from '@/lib/logger-minimal';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Loader2,
  Settings,
  FileText,
  Users,
  CreditCard,
  Home,
  Shield,
  CheckCircle,
  ArrowLeft,
  Ticket,
  Mail,
  Phone,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const categories = [
  { value: 'technical', label: 'Soporte Técnico', icon: Settings, description: 'Problemas con la plataforma, errores, acceso' },
  { value: 'billing', label: 'Facturación y Pagos', icon: CreditCard, description: 'Problemas con pagos, facturas, suscripciones' },
  { value: 'account', label: 'Cuenta y Perfil', icon: Users, description: 'Problemas con la cuenta, verificación, datos personales' },
  { value: 'property', label: 'Propiedades', icon: Home, description: 'Problemas con propiedades, publicaciones, reservas' },
  { value: 'contract', label: 'Contratos', icon: FileText, description: 'Problemas con contratos, firmas, términos' },
  { value: 'security', label: 'Seguridad', icon: Shield, description: 'Reportes de seguridad, acceso no autorizado' },
  { value: 'other', label: 'Otro', icon: AlertCircle, description: 'Otras consultas o sugerencias' },
];

export default function NewTicketPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el ticket');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect to tickets list after 2 seconds
      setTimeout(() => {
        router.push('/support/tickets');
      }, 2000);

    } catch (err) {
      logger.error('Error creating ticket:', { error: err instanceof Error ? err.message : String(err) });
      setError('Error al crear el ticket. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCategorySelect = (categoryValue: string) => {
    handleInputChange('category', categoryValue);
    const category = categories.find(cat => cat.value === categoryValue);
    setSelectedCategory(category);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">¡Ticket Creado!</h2>
            <p className="text-gray-600 mb-4">
              Tu ticket ha sido creado exitosamente y será atendido pronto.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido a la lista de tickets...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/support/tickets">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nuevo Ticket de Soporte</h1>
              <p className="text-gray-600">Describe tu problema y te ayudaremos a resolverlo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Selecciona una Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.category === category.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategorySelect(category.value)}
                    >
                      <div className="flex items-start gap-3">
                        <category.icon className="w-6 h-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{category.label}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Ticket *
                  </label>
                  <Input
                    placeholder="Breve descripción del problema"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      {getPriorityBadge(formData.priority)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría Seleccionada
                    </label>
                    <div className="p-3 border rounded-lg bg-gray-50">
                      {selectedCategory ? (
                        <div className="flex items-center gap-2">
                          <selectedCategory.icon className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{selectedCategory.label}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No seleccionada</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción Detallada *
                  </label>
                  <Textarea
                    placeholder="Describe en detalle el problema que estás experimentando..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Sé lo más específico posible para que podamos ayudarte mejor.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    Nos contactaremos contigo utilizando la información de tu perfil.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>Tu email registrado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>Tu teléfono registrado</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link href="/support/tickets">
                <Button variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando Ticket...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Crear Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
