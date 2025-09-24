'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail,
  Building, Video,
  X,
  Save
} from 'lucide-react';
import { format } from 'date-fns';

interface PropertyOption {
  id: string;
  title: string;
  address: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: any) => void;
  selectedDate?: Date;
  selectedTime?: string;
  properties?: PropertyOption[];
  clients?: Client[];
  editingAppointment?: any;
}

export default function AppointmentForm({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  selectedTime,
  properties = [],
  clients = [],
  editingAppointment,
}: AppointmentFormProps) {

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    propertyId: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: selectedTime || '09:00',
    duration: 60,
    type: 'visit',
    priority: 'medium',
    status: 'scheduled',
    notes: '',
    reminderSent: false,
  });


  const [errors, setErrors] = useState<Record<string, string>>({});

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00',
  ];

  const durations = [30, 60, 90, 120, 180];

  const appointmentTypes = [
    { value: 'visit', label: 'Visita a propiedad', icon: Building },
    { value: 'meeting', label: 'Reunión', icon: User },
    { value: 'call', label: 'Llamada', icon: Phone },
    { value: 'video', label: 'Video llamada', icon: Video },
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    if (editingAppointment) {
      setFormData({
        title: editingAppointment.title || '',
        clientId: editingAppointment.clientId || '',
        propertyId: editingAppointment.propertyId || '',
        date: editingAppointment.date || '',
        time: editingAppointment.time || '09:00',
        duration: editingAppointment.duration || 60,
        type: editingAppointment.type || 'visit',
        priority: editingAppointment.priority || 'medium',
        status: editingAppointment.status || 'scheduled',
        notes: editingAppointment.notes || '',
        reminderSent: editingAppointment.reminderSent || false,
      });
    }
  }, [editingAppointment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.clientId) {
      newErrors.clientId = 'Debe seleccionar un cliente';
    }
    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }
    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    const selectedProperty = properties.find(p => p.id === formData.propertyId);

    const appointmentData = {
      ...formData,
      clientName: selectedClient?.name || '',
      clientEmail: selectedClient?.email || '',
      clientPhone: selectedClient?.phone || '',
      propertyTitle: selectedProperty?.title || '',
      propertyAddress: selectedProperty?.address || '',
      ...(editingAppointment && { id: editingAppointment.id }),
    };

    onSave(appointmentData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <Label htmlFor="title">Título de la cita</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Visita departamento centro"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Cliente */}
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{client.name}</span>
                        <span className="text-gray-500 text-sm">({client.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
            </div>

            {/* Propiedad */}
            <div>
              <Label htmlFor="property">Propiedad (opcional)</Label>
              <Select value={formData.propertyId} onValueChange={(value) => handleInputChange('propertyId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{property.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
                  <SelectTrigger className={errors.time ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
              </div>
            </div>

            {/* Duración y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Select value={formData.duration.toString()} onValueChange={(value) => handleInputChange('duration', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map(duration => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Tipo de cita</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prioridad y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <Badge className={priority.color}>
                          {priority.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <Badge className="bg-emerald-100 text-emerald-800">Programada</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge className="bg-green-100 text-green-800">Completada</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
                    </SelectItem>
                    <SelectItem value="no_show">
                      <Badge className="bg-orange-100 text-orange-800">No asistió</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre la cita..."
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingAppointment ? 'Actualizar' : 'Crear'} Cita
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
