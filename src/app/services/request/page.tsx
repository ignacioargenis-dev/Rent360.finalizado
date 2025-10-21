'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wrench, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

export default function RequestServicePage() {
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    urgency: 'Media',
    preferredDate: '',
    budget: '',
    images: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        logger.info('Solicitud de servicio enviada:', formData);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar la solicitud');
      }
    } catch (error) {
      logger.error('Error enviando solicitud de servicio:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validar tipos de archivo
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Solo se permiten imágenes en formato JPEG, PNG o WebP');
      return;
    }

    // Validar tamaño (max 5MB por archivo)
    const sizeValidFiles = validFiles.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    });

    if (sizeValidFiles.length !== validFiles.length) {
      alert('Las imágenes no pueden superar los 5MB cada una');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...sizeValidFiles],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-green-700">¡Solicitud Enviada!</h2>
                <p className="text-muted-foreground mt-2">
                  Tu solicitud de servicio ha sido enviada exitosamente. Los proveedores disponibles
                  recibirán tu solicitud y te contactarán pronto.
                </p>
              </div>
              <Button onClick={() => router.push('/')} className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Solicitar Servicio</h1>
          <p className="text-muted-foreground mt-2">
            Encuentra proveedores calificados para tus necesidades
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Nueva Solicitud de Servicio
            </CardTitle>
            <CardDescription>
              Describe tu necesidad y recibe cotizaciones de proveedores verificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={value => handleChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plomería">Plomería</SelectItem>
                      <SelectItem value="Electricidad">Electricidad</SelectItem>
                      <SelectItem value="Pintura">Pintura</SelectItem>
                      <SelectItem value="Jardinería">Jardinería</SelectItem>
                      <SelectItem value="Carpintería">Carpintería</SelectItem>
                      <SelectItem value="Limpieza">Limpieza</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento General</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgency">Urgencia</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={value => handleChange('urgency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona urgencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja - Sin prisa</SelectItem>
                      <SelectItem value="Media">Media - Esta semana</SelectItem>
                      <SelectItem value="Alta">Alta - Lo antes posible</SelectItem>
                      <SelectItem value="Urgente">Urgente - Hoy mismo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción del Trabajo</Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente el trabajo que necesitas realizar..."
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Fecha Preferida</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={e => handleChange('preferredDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Presupuesto Aproximado (opcional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      className="pl-9"
                      value={formData.budget}
                      onChange={e => handleChange('budget', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sección de imágenes */}
              <div>
                <Label htmlFor="images">Imágenes del Trabajo (opcional)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Sube fotos del problema o área a trabajar. Formatos: JPG, PNG, WebP. Máximo 5MB
                  por imagen.
                </p>

                {/* Mostrar imágenes seleccionadas */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Imágenes seleccionadas:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">¿Qué sucede después?</p>
                    <ul className="text-blue-800 mt-1 space-y-1">
                      <li>• Tu solicitud será visible para proveedores calificados</li>
                      <li>• Recibirás cotizaciones por email y en tu dashboard</li>
                      <li>• Puedes elegir el proveedor que mejor se ajuste a tus necesidades</li>
                      <li>• El pago se realiza de forma segura a través de la plataforma</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
