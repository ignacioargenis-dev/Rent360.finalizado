'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  X,
  Camera,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface VisitInfo {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  scheduledAt: string;
  status: string;
  photosTaken: number;
}

export default function RunnerPhotosUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useAuth();
  const visitId = searchParams.get('visitId');

  const [visitInfo, setVisitInfo] = useState<VisitInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>('general');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visitId) {
      setError('ID de visita no proporcionado');
      setLoading(false);
      return;
    }

    // Obtener información de la visita
    fetch(`/api/runner/visits/${visitId}/photos`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.visit) {
          setVisitInfo(data.visit);
        }
      })
      .catch((err) => {
        console.error('Error fetching visit info:', err);
        setError('Error al cargar la información de la visita');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visitId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError(`El archivo ${file.name} no es un tipo de imagen válido`);
        continue;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`El archivo ${file.name} excede el tamaño máximo de 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Por favor selecciona al menos una imagen');
      return;
    }

    if (!visitId) {
      setError('ID de visita no proporcionado');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('category', category);
      formData.append('description', description);

      const response = await fetch(`/api/runner/visits/${visitId}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir las fotos');
      }

      setSuccess(true);
      setUploadProgress(100);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/runner/photos');
      }, 2000);
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      setError(err.message || 'Error al subir las fotos');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!visitId) {
    return (
      <UnifiedDashboardLayout>
        <DashboardHeader
          user={user}
          title="Subir Fotos"
          subtitle="Error: ID de visita no proporcionado"
        />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">ID de visita no proporcionado</p>
                <Button
                  onClick={() => router.push('/runner/photos')}
                  className="mt-4"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Fotos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <DashboardHeader
        user={user}
        title="Subir Fotos de Visita"
        subtitle="Sube las fotos tomadas durante la visita"
      />

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-800">
              Fotos subidas exitosamente. Redirigiendo...
            </span>
          </div>
        )}

        {/* Visit Info */}
        {visitInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información de la Visita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Propiedad</Label>
                  <p className="font-medium">{visitInfo.propertyTitle}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Dirección</Label>
                  <p className="font-medium">{visitInfo.propertyAddress}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Fecha Programada</Label>
                  <p className="font-medium">
                    {new Date(visitInfo.scheduledAt).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Fotos Actuales</Label>
                  <p className="font-medium">{visitInfo.photosTaken}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Fotos</CardTitle>
            <CardDescription>
              Selecciona las fotos que tomaste durante la visita. Máximo 20 imágenes, 10MB cada una.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="photos">Fotos</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Arrastra y suelta imágenes aquí o
                </p>
                <Label htmlFor="photos" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800">
                    selecciona archivos
                  </span>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos: JPG, PNG, GIF, WebP. Máximo 10MB por imagen.
                </p>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Imágenes seleccionadas ({selectedFiles.length})
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="living">Sala de Estar</SelectItem>
                  <SelectItem value="bedroom">Dormitorio</SelectItem>
                  <SelectItem value="bathroom">Baño</SelectItem>
                  <SelectItem value="kitchen">Cocina</SelectItem>
                  <SelectItem value="special">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe las fotos o cualquier nota relevante..."
                className="mt-2"
                rows={3}
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Subiendo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Foto(s)`}
              </Button>
              <Button
                onClick={() => router.push('/runner/photos')}
                variant="outline"
                disabled={isUploading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

