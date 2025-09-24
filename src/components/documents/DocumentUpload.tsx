'use client';

import { useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import { ValidationResult } from '@/lib/file-validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Plus,
  Image as ImageIcon,
  File,
  FileVideo,
  FileAudio,
  Archive
} from 'lucide-react';

interface DocumentFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  status: 'uploading' | 'completed' | 'error' | 'validating'
  progress: number
  error?: string
  validation?: ValidationResult
  warnings?: string[]
}

interface DocumentUploadProps {
  onUploadComplete?: (files: DocumentFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  allowedTypes?: string[]
  category?: 'contract' | 'agreement' | 'receipt' | 'form' | 'property' | 'maintenance' | 'other'
  showPreview?: boolean
}

export default function DocumentUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10,
  allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  category = 'other',
  showPreview = true,
}: DocumentUploadProps) {

  const [files, setFiles] = useState<DocumentFile[]>([]);

  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<'contract' | 'agreement' | 'receipt' | 'form' | 'property' | 'maintenance' | 'other'>(category);

  const [tags, setTags] = useState<string[]>([]);

  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
return <ImageIcon className="w-8 h-8 text-blue-500" />;
}
    if (type.includes('pdf')) {
return <FileText className="w-8 h-8 text-red-500" />;
}
    if (type.includes('video')) {
return <FileVideo className="w-8 h-8 text-purple-500" />;
}
    if (type.includes('audio')) {
return <FileAudio className="w-8 h-8 text-green-500" />;
}
    if (type.includes('zip') || type.includes('rar')) {
return <Archive className="w-8 h-8 text-orange-500" />;
}
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
return '0 Bytes';
}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo excede el tamaño máximo de ${maxSize}MB`;
    }
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido';
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) {
return;
}

    const newFiles: DocumentFile[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      const error = validateFile(file);
      const documentFile: DocumentFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? 'error' : 'uploading',
        progress: 0,
        ...(error && { error }),
      };
      newFiles.push(documentFile);
    });

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    
    // Simulate upload progress
    newFiles.filter(f => f.status === 'uploading').forEach(file => {
      simulateUpload(file.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', progress: 100 }
            : f,
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f,
        ));
      }
    }, 500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return;
    }

    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length !== files.length) {
      alert('Por favor espera a que todos los archivos terminen de subir');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Primero marcar archivos como en validación
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'validating' as const
      })));

      setUploadProgress(25);

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file as any);
      });

      formData.append('title', title || files[0].name);
      formData.append('description', description);
      formData.append('category', selectedCategory);
      tags.forEach(tag => formData.append('tags', tag));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      setUploadProgress(75);

      if (!response.ok) {
        // Manejar errores de validación
        if (response.status === 400 && result.details) {
          setFiles(prev => prev.map(file => {
            const errorDetail = result.details?.find((detail: string) =>
              detail.startsWith(file.name + ':')
            );

            if (errorDetail) {
              return {
                ...file,
                status: 'error',
                error: errorDetail.split(': ').slice(1).join(': '),
              };
            }

            return {
              ...file,
              status: 'completed',
              progress: 100,
            };
          }));

          logger.warn('Archivos rechazados por validación:', {
            errors: result.details,
            summary: result.summary
          });

          alert(`Validación fallida: ${result.details.length} archivo(s) rechazado(s)`);
          return;
        }

        throw new Error(result.error || 'Error al subir documentos');
      }

      // Update file statuses con información de validación
      setFiles(prev => prev.map(file => {
        const uploadedFile = result.files?.find((f: any) => f.name === file.name);
        if (uploadedFile) {
          return {
            ...file,
            id: uploadedFile.id,
            url: uploadedFile.url,
            status: 'completed',
            progress: 100,
            validation: uploadedFile.validation,
            ...(uploadedFile.validation?.warnings && { warnings: uploadedFile.validation.warnings })
          };
        }
        return file;
      }));

      setUploadProgress(100);

      logger.info('Documento creado exitosamente:', {
        title: title || files[0].name,
        fileCount: result.files?.length,
        summary: result.summary
      });

      onUploadComplete?.(files.filter(f => f.status === 'completed'));

      // Reset form
      setFiles([]);
      setTitle('');
      setDescription('');
      setTags([]);
      setNewTag('');

    } catch (error) {
      logger.error('Error al subir documentos:', { error: error instanceof Error ? error.message : String(error) });

      // Mark all files as error
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      })));
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'contract': return 'Contrato';
      case 'agreement': return 'Acuerdo';
      case 'receipt': return 'Recibo';
      case 'form': return 'Formulario';
      case 'property': return 'Propiedad';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Otro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir Documentos
          </CardTitle>
          <CardDescription>
            Sube archivos para crear un nuevo documento. Máximo {maxFiles} archivos, {maxSize}MB cada uno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos soportados: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Seleccionar Archivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Details */}
      {(files.length > 0 || title || description) && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ingresa un título para el documento"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el contenido del documento"
                rows={3}
              />
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="agreement">Acuerdo</SelectItem>
                  <SelectItem value="receipt">Recibo</SelectItem>
                  <SelectItem value="form">Formulario</SelectItem>
                  <SelectItem value="property">Propiedad</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Etiquetas</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Agregar etiqueta"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button variant="outline" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <XCircle 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <Progress value={file.progress} className="w-24" />
                        <span className="text-sm text-gray-500">{Math.round(file.progress)}%</span>
                      </div>
                    )}

                    {file.status === 'validating' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <AlertCircle className="w-3 h-3 mr-1 animate-spin" />
                        Validando...
                      </Badge>
                    )}

                    {file.status === 'completed' && (
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completado
                        </Badge>
                        {file.warnings && file.warnings.length > 0 && (
                          <div className="text-xs text-yellow-600">
                            ⚠️ {file.warnings.length} advertencia(s)
                          </div>
                        )}
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                        {file.error && (
                          <div className="text-xs text-red-600 max-w-32 truncate" title={file.error}>
                            {file.error}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {files.some(f => f.error) && (
              <Alert className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Algunos archivos no pudieron ser procesados. Por favor verifica los requisitos y vuelve a intentarlo.
                </AlertDescription>
              </Alert>
            )}
            
            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Subiendo archivos...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setFiles([])} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documentos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
