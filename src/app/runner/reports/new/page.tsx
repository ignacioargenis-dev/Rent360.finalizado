'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Upload,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface ReportData {
  propertyId: string;
  propertyAddress: string;
  tenantName: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'completed' | 'issues_found' | 'incomplete';
  visitDate: string;
  startTime: string;
  endTime: string;
  description: string;
  workDone: string[];
  issuesFound: string[];
  recommendations: string[];
  materials: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  photos: File[];
  signature: boolean;
  notes: string;
}

export default function NewRunnerReportPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [reportData, setReportData] = useState<ReportData>({
    propertyId: '',
    propertyAddress: '',
    tenantName: '',
    serviceType: '',
    priority: 'medium',
    status: 'completed',
    visitDate: new Date().toISOString().split('T')[0] || '',
    startTime: '',
    endTime: '',
    description: '',
    workDone: [],
    issuesFound: [],
    recommendations: [],
    materials: [],
    photos: [],
    signature: false,
    notes: '',
  });

  const [properties] = useState([
    { id: '1', address: 'Av. Providencia 123, Santiago', tenantName: 'Ana Rodríguez' },
    { id: '2', address: 'Calle Las Condes 456, Las Condes', tenantName: 'Pedro Sánchez' },
    { id: '3', address: 'Paseo Ñuñoa 789, Ñuñoa', tenantName: 'Laura Martínez' },
    { id: '4', address: 'Av. Vitacura 321, Vitacura', tenantName: 'Diego Torres' },
  ]);

  const [newWorkItem, setNewWorkItem] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: 1, unit: 'unidad' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const serviceTypes = [
    'Reparación Eléctrica',
    'Reparación de Fontanería',
    'Mantenimiento General',
    'Reparación de Pintura',
    'Mantenimiento de Jardinería',
    'Limpieza General',
    'Reparación de Cerrajería',
    'Instalación de Equipos',
    'Revisión Técnica',
    'Otro',
  ];

  const materialUnits = [
    'unidad',
    'metros',
    'litros',
    'kilogramos',
    'metros cuadrados',
    'rollos',
    'paquetes',
    'cajas',
  ];

  const handleInputChange = (field: string, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }));

    if (field === 'propertyId') {
      const selectedProperty = properties.find(p => p.id === value);
      if (selectedProperty) {
        setReportData(prev => ({
          ...prev,
          propertyId: value,
          propertyAddress: selectedProperty.address,
          tenantName: selectedProperty.tenantName,
        }));
      }
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addWorkItem = () => {
    if (newWorkItem.trim()) {
      setReportData(prev => ({
        ...prev,
        workDone: [...prev.workDone, newWorkItem.trim()],
      }));
      setNewWorkItem('');
    }
  };

  const removeWorkItem = (index: number) => {
    setReportData(prev => ({
      ...prev,
      workDone: prev.workDone.filter((_, i) => i !== index),
    }));
  };

  const addIssue = () => {
    if (newIssue.trim()) {
      setReportData(prev => ({
        ...prev,
        issuesFound: [...prev.issuesFound, newIssue.trim()],
      }));
      setNewIssue('');
    }
  };

  const removeIssue = (index: number) => {
    setReportData(prev => ({
      ...prev,
      issuesFound: prev.issuesFound.filter((_, i) => i !== index),
    }));
  };

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setReportData(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, newRecommendation.trim()],
      }));
      setNewRecommendation('');
    }
  };

  const removeRecommendation = (index: number) => {
    setReportData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index),
    }));
  };

  const addMaterial = () => {
    if (newMaterial.name.trim()) {
      setReportData(prev => ({
        ...prev,
        materials: [...prev.materials, { ...newMaterial }],
      }));
      setNewMaterial({ name: '', quantity: 1, unit: 'unidad' });
    }
  };

  const removeMaterial = (index: number) => {
    setReportData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReportData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setReportData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!reportData.propertyId) {
      newErrors.propertyId = 'Debe seleccionar una propiedad';
    }
    if (!reportData.serviceType) {
      newErrors.serviceType = 'Debe seleccionar un tipo de servicio';
    }
    if (!reportData.visitDate) {
      newErrors.visitDate = 'Debe seleccionar una fecha de visita';
    }
    if (!reportData.startTime) {
      newErrors.startTime = 'Debe seleccionar hora de inicio';
    }
    if (!reportData.endTime) {
      newErrors.endTime = 'Debe seleccionar hora de fin';
    }
    if (!reportData.description) {
      newErrors.description = 'Debe ingresar una descripción';
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

      logger.info('Reporte de runner creado exitosamente', {
        propertyId: reportData.propertyId,
        serviceType: reportData.serviceType,
        status: reportData.status,
      });

      setSuccessMessage('Reporte creado exitosamente');

      setTimeout(() => {
        router.push('/runner/reports');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear reporte', { error });
      setErrorMessage('Error al crear el reporte. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/runner/reports');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'issues_found':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Problemas Encontrados
          </Badge>
        );
      case 'incomplete':
        return <Badge variant="destructive">Incompleto</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Reporte de Servicio</h1>
            <p className="text-gray-600">Documenta los trabajos realizados en una propiedad</p>
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
            {/* Información de la Visita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información de la Visita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Seleccionar Propiedad *</Label>
                  <Select
                    value={reportData.propertyId}
                    onValueChange={value => handleInputChange('propertyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="propertyAddress">Dirección de la Propiedad</Label>
                  <Input
                    id="propertyAddress"
                    value={reportData.propertyAddress}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="tenantName">Nombre del Inquilino</Label>
                  <Input
                    id="tenantName"
                    value={reportData.tenantName}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceType">Tipo de Servicio *</Label>
                  <Select
                    value={reportData.serviceType}
                    onValueChange={value => handleInputChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceType && (
                    <p className="text-sm text-red-600 mt-1">{errors.serviceType}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={reportData.priority}
                      onValueChange={value => handleInputChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Estado del Trabajo</Label>
                    <Select
                      value={reportData.status}
                      onValueChange={value => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="issues_found">Problemas Encontrados</SelectItem>
                        <SelectItem value="incomplete">Incompleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Horarios de la Visita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horarios de la Visita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="visitDate">Fecha de Visita *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={reportData.visitDate}
                    onChange={e => handleInputChange('visitDate', e.target.value)}
                  />
                  {errors.visitDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.visitDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Hora de Inicio *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={reportData.startTime}
                      onChange={e => handleInputChange('startTime', e.target.value)}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="endTime">Hora de Fin *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={reportData.endTime}
                      onChange={e => handleInputChange('endTime', e.target.value)}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción del Trabajo *</Label>
                  <Textarea
                    id="description"
                    value={reportData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describe brevemente el trabajo realizado..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trabajo Realizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Trabajo Realizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Trabajos Completados</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newWorkItem}
                      onChange={e => setNewWorkItem(e.target.value)}
                      placeholder="Ej: Reparación de tomacorriente"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addWorkItem())}
                    />
                    <Button type="button" onClick={addWorkItem} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {reportData.workDone.length > 0 && (
                    <div className="space-y-2">
                      {reportData.workDone.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-green-50 rounded"
                        >
                          <span className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {item}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeWorkItem(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Problemas Encontrados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Problemas Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Problemas Identificados</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newIssue}
                      onChange={e => setNewIssue(e.target.value)}
                      placeholder="Ej: Cableado dañado requiere reemplazo"
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addIssue())}
                    />
                    <Button type="button" onClick={addIssue} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {reportData.issuesFound.length > 0 && (
                    <div className="space-y-2">
                      {reportData.issuesFound.map((issue, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-orange-50 rounded"
                        >
                          <span className="text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            {issue}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeIssue(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Recomendaciones</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newRecommendation}
                      onChange={e => setNewRecommendation(e.target.value)}
                      placeholder="Ej: Programar mantenimiento preventivo"
                      onKeyPress={e =>
                        e.key === 'Enter' && (e.preventDefault(), addRecommendation())
                      }
                    />
                    <Button type="button" onClick={addRecommendation} size="sm">
                      Agregar
                    </Button>
                  </div>
                  {reportData.recommendations.length > 0 && (
                    <div className="space-y-2">
                      {reportData.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded"
                        >
                          <span className="text-sm">{rec}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRecommendation(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Materiales Utilizados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Materiales Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Input
                    placeholder="Nombre del material"
                    value={newMaterial.name}
                    onChange={e => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    min="0.1"
                    step="0.1"
                    value={newMaterial.quantity}
                    onChange={e =>
                      setNewMaterial(prev => ({
                        ...prev,
                        quantity: parseFloat(e.target.value) || 1,
                      }))
                    }
                  />
                  <Select
                    value={newMaterial.unit}
                    onValueChange={value => setNewMaterial(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {materialUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={addMaterial} size="sm" className="w-full">
                  Agregar Material
                </Button>

                {reportData.materials.length > 0 && (
                  <div className="space-y-2">
                    {reportData.materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {material.name} - {material.quantity} {material.unit}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaterial(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fotos y Firma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Fotos y Firma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photos">Subir Fotos del Trabajo</Label>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">Formatos: JPG, PNG. Máximo 10 fotos.</p>
                </div>

                {reportData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {reportData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 w-6 h-6 p-0"
                          onClick={() => removePhoto(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="signature"
                    checked={reportData.signature}
                    onChange={e =>
                      setReportData(prev => ({ ...prev, signature: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="signature">Trabajo verificado y aprobado por el cliente</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={reportData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Observaciones adicionales, comentarios del cliente, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del Reporte */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Reporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Propiedad</Label>
                  <p className="text-sm text-gray-600">
                    {reportData.propertyAddress || 'No seleccionada'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Servicio</Label>
                  <p className="text-sm text-gray-600">
                    {reportData.serviceType || 'No especificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <div className="mt-1">{getStatusBadge(reportData.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Trabajos Realizados</Label>
                  <p className="text-sm text-gray-600">{reportData.workDone.length} items</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Problemas Encontrados</Label>
                  <p className="text-sm text-gray-600">{reportData.issuesFound.length} items</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fotos Adjuntas</Label>
                  <p className="text-sm text-gray-600">{reportData.photos.length} fotos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando Reporte...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Reporte
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
