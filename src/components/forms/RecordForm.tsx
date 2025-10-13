'use client';

import { logger } from '@/lib/logger-minimal';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, 
  Save, 
  X, 
  DollarSign, 
  Users, 
  FileText,
  Building,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Image as ImageIcon,
  Upload,
  MemoryStick } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
interface RecordFormProps {
  type: 'property' | 'client' | 'contract' | 'ticket' | 'maintenance' | 'payment'
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: any
  mode?: 'create' | 'edit'
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox' | 'file'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: (value: any) => string | null
}

// Esquemas de validación por tipo de formulario
const propertySchema = z.object({
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'Ciudad es requerida'),
  commune: z.string().min(2, 'Comuna es requerida'),
  price: z.number().positive('Precio debe ser positivo'),
  deposit: z.number().min(0, 'Depósito debe ser mayor o igual a 0'),
  bedrooms: z.number().int().min(0, 'Dormitorios debe ser un número entero positivo'),
  bathrooms: z.number().int().min(0, 'Baños debe ser un número entero positivo'),
  area: z.number().positive('Área debe ser positiva'),
  description: z.string().optional(),
});

const clientSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono debe tener al menos 8 caracteres'),
  type: z.string().min(1, 'Tipo de cliente es requerido'),
});

const contractSchema = z.object({
  propertyId: z.string().min(1, 'Propiedad es requerida'),
  tenantId: z.string().min(1, 'Inquilino es requerido'),
  startDate: z.string().min(1, 'Fecha de inicio es requerida'),
  endDate: z.string().min(1, 'Fecha de fin es requerida'),
  monthlyRent: z.number().positive('Renta mensual debe ser positiva'),
  deposit: z.number().min(0, 'Depósito debe ser mayor o igual a 0'),
});

const ticketSchema = z.object({
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  category: z.string().min(1, 'Categoría es requerida'),
  priority: z.string().min(1, 'Prioridad es requerida'),
});

const maintenanceSchema = z.object({
  propertyId: z.string().min(1, 'Propiedad es requerida'),
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  category: z.string().min(1, 'Categoría es requerida'),
  priority: z.string().min(1, 'Prioridad es requerida'),
  estimatedCost: z.number().min(0, 'Costo estimado debe ser mayor o igual a 0').optional(),
});

const paymentSchema = z.object({
  contractId: z.string().min(1, 'Contrato es requerido'),
  amount: z.number().positive('Monto debe ser positivo'),
  dueDate: z.string().min(1, 'Fecha de vencimiento es requerida'),
  paymentMethod: z.string().min(1, 'Método de pago es requerido'),
});

const getSchemaByType = (type: string) => {
  switch (type) {
    case 'property': return propertySchema;
    case 'client': return clientSchema;
    case 'contract': return contractSchema;
    case 'ticket': return ticketSchema;
    case 'maintenance': return maintenanceSchema;
    case 'payment': return paymentSchema;
    default: return z.object({});
  }
};

export default function RecordForm({
  type,
  onSubmit,
  onCancel,
  initialData,
  mode = 'create',
}: RecordFormProps) {

  const schema = getSchemaByType(type);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<any>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string> & { submit?: string }>({});

  const getFormFields = (): FormField[] => {
    switch (type) {
      case 'property':
        return [
          { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ej: Departamento Las Condes' },
          { name: 'address', label: 'Dirección', type: 'text', required: true, placeholder: 'Ej: Av. Apoquindo 3400' },
          { name: 'city', label: 'Ciudad', type: 'select', required: true, options: [
            { value: 'Santiago', label: 'Santiago' },
            { value: 'Valparaíso', label: 'Valparaíso' },
            { value: 'Concepción', label: 'Concepción' },
            { value: 'La Serena', label: 'La Serena' },
            { value: 'Antofagasta', label: 'Antofagasta' },
          ]},
          { name: 'commune', label: 'Comuna', type: 'text', required: true, placeholder: 'Ej: Las Condes' },
          { name: 'price', label: 'Precio de Arriendo', type: 'number', required: true, placeholder: 'Ej: 350000' },
          { name: 'deposit', label: 'Depósito', type: 'number', required: true, placeholder: 'Ej: 350000' },
          { name: 'bedrooms', label: 'Dormitorios', type: 'number', required: true, placeholder: 'Ej: 2' },
          { name: 'bathrooms', label: 'Baños', type: 'number', required: true, placeholder: 'Ej: 2' },
          { name: 'area', label: 'Superficie (m²)', type: 'number', required: true, placeholder: 'Ej: 85' },
          { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Describe la propiedad...' },
          { name: 'status', label: 'Estado', type: 'select', required: true, options: [
            { value: 'AVAILABLE', label: 'Disponible' },
            { value: 'RENTED', label: 'Arrendado' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'MAINTENANCE', label: 'Mantenimiento' },
          ]},
        ];

      case 'client':
        return [
          { name: 'name', label: 'Nombre Completo', type: 'text', required: true, placeholder: 'Ej: Juan Pérez' },
          { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ej: juan@ejemplo.com' },
          { name: 'phone', label: 'Teléfono', type: 'text', required: true, placeholder: 'Ej: +56 9 1234 5678' },
          { name: 'type', label: 'Tipo de Cliente', type: 'select', required: true, options: [
            { value: 'OWNER', label: 'Propietario' },
            { value: 'TENANT', label: 'Inquilino' },
            { value: 'BOTH', label: 'Ambos' },
          ]},
          { name: 'status', label: 'Estado', type: 'select', required: true, options: [
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'INACTIVE', label: 'Inactivo' },
            { value: 'PENDING', label: 'Pendiente' },
          ]},
          { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Información adicional del cliente...' },
        ];

      case 'contract':
        return [
          { name: 'propertyId', label: 'Propiedad', type: 'select', required: true, options: [
            { value: '1', label: 'Departamento Las Condes' },
            { value: '2', label: 'Oficina Providencia' },
            { value: '3', label: 'Casa Vitacura' },
          ]},
          { name: 'tenantId', label: 'Inquilino', type: 'select', required: true, options: [
            { value: '1', label: 'Carlos Ramírez' },
            { value: '2', label: 'María González' },
            { value: '3', label: 'Ana Martínez' },
          ]},
          { name: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true },
          { name: 'endDate', label: 'Fecha de Término', type: 'date', required: true },
          { name: 'monthlyRent', label: 'Arriendo Mensual', type: 'number', required: true, placeholder: 'Ej: 350000' },
          { name: 'deposit', label: 'Depósito', type: 'number', required: true, placeholder: 'Ej: 350000' },
          { name: 'status', label: 'Estado', type: 'select', required: true, options: [
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'EXPIRED', label: 'Expirado' },
            { value: 'TERMINATED', label: 'Terminado' },
          ]},
        ];

      case 'ticket':
        return [
          { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ej: Problema con pago' },
          { name: 'description', label: 'Descripción', type: 'textarea', required: true, placeholder: 'Describe el problema en detalle...' },
          { name: 'category', label: 'Categoría', type: 'select', required: true, options: [
            { value: 'technical', label: 'Técnico' },
            { value: 'billing', label: 'Facturación' },
            { value: 'account', label: 'Cuenta' },
            { value: 'other', label: 'Otro' },
          ]},
          { name: 'priority', label: 'Prioridad', type: 'select', required: true, options: [
            { value: 'low', label: 'Baja' },
            { value: 'medium', label: 'Media' },
            { value: 'high', label: 'Alta' },
            { value: 'critical', label: 'Crítica' },
          ]},
        ];

      case 'maintenance':
        return [
          { name: 'propertyId', label: 'Propiedad', type: 'select', required: true, options: [
            { value: '1', label: 'Departamento Las Condes' },
            { value: '2', label: 'Oficina Providencia' },
            { value: '3', label: 'Casa Vitacura' },
          ]},
          { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ej: Fuga de agua' },
          { name: 'description', label: 'Descripción', type: 'textarea', required: true, placeholder: 'Describe el problema de mantenimiento...' },
          { name: 'category', label: 'Categoría', type: 'select', required: true, options: [
            { value: 'plumbing', label: 'Fontanería' },
            { value: 'electrical', label: 'Electricidad' },
            { value: 'hvac', label: 'Climatización' },
            { value: 'structural', label: 'Estructural' },
            { value: 'other', label: 'Otro' },
          ]},
          { name: 'priority', label: 'Prioridad', type: 'select', required: true, options: [
            { value: 'low', label: 'Baja' },
            { value: 'medium', label: 'Media' },
            { value: 'high', label: 'Alta' },
            { value: 'urgent', label: 'Urgente' },
          ]},
          { name: 'estimatedCost', label: 'Costo Estimado', type: 'number', placeholder: 'Ej: 50000' },
        ];

      case 'payment':
        return [
          { name: 'contractId', label: 'Contrato', type: 'select', required: true, options: [
            { value: '1', label: 'Contrato Arriendo Depto Las Condes' },
            { value: '2', label: 'Contrato Oficina Providencia' },
            { value: '3', label: 'Contrato Casa Vitacura' },
          ]},
          { name: 'amount', label: 'Monto', type: 'number', required: true, placeholder: 'Ej: 350000' },
          { name: 'dueDate', label: 'Fecha de Vencimiento', type: 'date', required: true },
          { name: 'paymentMethod', label: 'Método de Pago', type: 'select', options: [
            { value: 'transfer', label: 'Transferencia' },
            { value: 'cash', label: 'Efectivo' },
            { value: 'check', label: 'Cheque' },
            { value: 'credit_card', label: 'Tarjeta de Crédito' },
          ]},
          { name: 'status', label: 'Estado', type: 'select', required: true, options: [
            { value: 'PAID', label: 'Pagado' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'OVERDUE', label: 'Atrasado' },
            { value: 'CANCELLED', label: 'Cancelado' },
          ]},
        ];

      default:
        return [];
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return 'Este campo es requerido';
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Email inválido';
      }
    }

    if (field.type === 'number' && value) {
      if (isNaN(value) || value <= 0) {
        return 'Debe ser un número válido';
      }
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev: Record<string, string> & { submit?: string }) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev: File[]) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev: File[]) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = getFormFields();

    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitForm = async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data for submission
      const submissionData = {
        ...data,
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      };

      await onSubmit(submissionData);
    } catch (error) {
      logger.error('Error submitting form:', { 
        error: error instanceof Error ? error.message : String(error),
        formType: type 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'property': return 'Propiedad';
      case 'client': return 'Cliente';
      case 'contract': return 'Contrato';
      case 'ticket': return 'Ticket';
      case 'maintenance': return 'Solicitud de Mantenimiento';
      case 'payment': return 'Pago';
      default: return 'Registro';
    }
  };

  const fields = getFormFields();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {mode === 'create' ? 'Crear' : 'Editar'} {getTypeTitle()}
            </CardTitle>
            <CardDescription>
              {mode === 'create' ? 'Complete el formulario para crear un nuevo registro' : 'Modifique los datos del registro'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>

                {field.type === 'select' && (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleInputChange(field.name, value)}
                  >
                    <SelectTrigger className={errors[field.name] ? 'border-red-500' : ''}>
                      <SelectValue placeholder={`Seleccione ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={errors[field.name] ? 'border-red-500' : ''}
                    rows={3}
                  />
                )}

                {field.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={formData[field.name] || false}
                      onCheckedChange={(checked) => handleInputChange(field.name, checked)}
                    />
                    <Label htmlFor={field.name}>{field.label}</Label>
                  </div>
                )}

                {field.type === 'file' && (
                  <div className="space-y-2">
                    <Input
                      id={field.name}
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      className={errors[field.name] ? 'border-red-500' : ''}
                    />
                    {files.length > 0 && (
                      <div className="space-y-1">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {['text', 'email', 'number', 'date'].includes(field.type) && (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, 
                      field.type === 'number' ? Number(e.target.value) : e.target.value,
                    )}
                    placeholder={field.placeholder}
                    className={errors[field.name] ? 'border-red-500' : ''}
                  />
                )}

                {errors[field.name] && (
                  <p className="text-sm text-red-500">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
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
                  {mode === 'create' ? 'Crear' : 'Guardar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
