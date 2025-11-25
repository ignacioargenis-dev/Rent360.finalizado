'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Camera,
  Video,
  Loader2,
  User,
  MapPin,
  Clock,
  Info,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
}

interface IdentityVerificationProps {
  userId: string;
  level?: 'basic' | 'intermediate' | 'advanced';
  onComplete?: (verificationId: string) => void;
  onError?: (error: string) => void;
}

export default function IdentityVerification({
  userId,
  level = 'intermediate',
  onComplete,
  onError,
}: IdentityVerificationProps) {
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<VerificationStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [requirements, setRequirements] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar verificación
  useEffect(() => {
    initiateVerification();
    loadRequirements();
  }, [level]);

  const initiateVerification = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/kyc/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          documentType: 'national_id',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar verificación');
      }

      setVerificationId(data.sessionId);
      logger.info('Verificación iniciada', { verificationId: data.sessionId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      logger.error('Error iniciando verificación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequirements = async () => {
    try {
      const response = await fetch(`/api/user/kyc/status?level=${level}`);
      const data = await response.json();

      if (data.success && data.requirements) {
        setRequirements(data.requirements);

        // Inicializar pasos basados en requisitos
        const initialSteps: VerificationStep[] = [
          {
            id: 'rut_validation',
            title: 'Validación de RUT',
            description: 'Verificar tu RUT con el Registro Civil',
            status: 'pending',
            required: true,
          },
          {
            id: 'document_upload',
            title: 'Subir Cédula de Identidad',
            description: 'Toma una foto clara de tu cédula de identidad',
            status: 'pending',
            required: true,
          },
        ];

        if (level === 'intermediate' || level === 'advanced') {
          initialSteps.push({
            id: 'selfie',
            title: 'Selfie de Verificación',
            description: 'Toma una selfie para verificar tu identidad',
            status: 'pending',
            required: true,
          });
        }

        if (level === 'advanced') {
          initialSteps.push({
            id: 'liveness',
            title: 'Video de Vivacidad',
            description: 'Graba un video corto para verificar que eres una persona real',
            status: 'pending',
            required: true,
          });
          initialSteps.push({
            id: 'background',
            title: 'Verificación de Antecedentes',
            description: 'Verificación de antecedentes penales y laborales',
            status: 'pending',
            required: true,
          });
        }

        setSteps(initialSteps);
      }
    } catch (error) {
      logger.error('Error cargando requisitos:', error);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!verificationId) {
      setError('Verificación no iniciada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convertir archivo a base64
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/user/kyc/upload-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationId,
          documentType,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al subir documento');
      }

      // Actualizar paso como completado
      const updatedSteps = [...steps];
      const stepIndex = steps.findIndex(s => s.id === 'document_upload');
      const stepToUpdate = updatedSteps[stepIndex];
      if (stepIndex !== -1 && stepToUpdate) {
        stepToUpdate.status = 'completed';
        setSteps(updatedSteps);
        setCurrentStep(currentStep + 1);
        updateProgress();
      }

      logger.info('Documento subido exitosamente', { documentId: data.document.id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error subiendo documento';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      logger.error('Error subiendo documento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureSelfie = async () => {
    if (!verificationId) {
      setError('Verificación no iniciada');
      return;
    }

    // Aquí se abriría la cámara del dispositivo
    // Por ahora, simular la captura
    try {
      setIsLoading(true);

      // Simular captura de selfie
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedSteps = [...steps];
      const stepIndex = steps.findIndex(s => s.id === 'selfie');
      const stepToUpdate = updatedSteps[stepIndex];
      if (stepIndex !== -1 && stepToUpdate) {
        stepToUpdate.status = 'completed';
        setSteps(updatedSteps);
        setCurrentStep(currentStep + 1);
        updateProgress();
      }

      logger.info('Selfie capturada');
    } catch (error) {
      const errorMsg = 'Error capturando selfie';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      logger.error('Error capturando selfie:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordVideo = async () => {
    if (!verificationId) {
      setError('Verificación no iniciada');
      return;
    }

    // Aquí se abriría la cámara para grabar video
    // Por ahora, simular la grabación
    try {
      setIsLoading(true);

      // Simular grabación de video
      await new Promise(resolve => setTimeout(resolve, 3000));

      const updatedSteps = [...steps];
      const stepIndex = steps.findIndex(s => s.id === 'liveness');
      const stepToUpdate = updatedSteps[stepIndex];
      if (stepIndex !== -1 && stepToUpdate) {
        stepToUpdate.status = 'completed';
        setSteps(updatedSteps);
        setCurrentStep(currentStep + 1);
        updateProgress();
      }

      logger.info('Video grabado');
    } catch (error) {
      const errorMsg = 'Error grabando video';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      logger.error('Error grabando video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const updateProgress = () => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const totalSteps = steps.length;
    const newProgress = (completedSteps / totalSteps) * 100;
    setProgress(newProgress);

    if (completedSteps === totalSteps && onComplete && verificationId) {
      onComplete(verificationId);
    }
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle>Verificación de Identidad</CardTitle>
              <CardDescription>
                Nivel: <Badge variant="outline">{level.toUpperCase()}</Badge>
                {requirements && (
                  <span className="ml-2 text-sm">
                    ⏱️ Tiempo estimado: {requirements.estimatedTime}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso de verificación</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id} className={currentStep === index ? 'border-green-500' : ''}>
            <CardHeader>
              <div className="flex items-start gap-4">
                {getStepIcon(step)}
                <div className="flex-1">
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                  {step.required && (
                    <Badge variant="secondary" className="mt-2">
                      Requerido
                    </Badge>
                  )}
                </div>
                <Badge
                  variant={
                    step.status === 'completed'
                      ? 'default'
                      : step.status === 'failed'
                        ? 'destructive'
                        : 'outline'
                  }
                >
                  {step.status === 'completed'
                    ? 'Completado'
                    : step.status === 'in_progress'
                      ? 'En progreso'
                      : step.status === 'failed'
                        ? 'Fallido'
                        : 'Pendiente'}
                </Badge>
              </div>
            </CardHeader>

            {currentStep === index && step.status !== 'completed' && (
              <CardContent>
                {step.id === 'document_upload' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-gray-600">
                        Asegúrate de que la foto sea clara y legible. Incluye ambas caras de tu
                        cédula.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'cedula_identidad');
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Subir Cédula de Identidad
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {step.id === 'selfie' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-gray-600">
                        Toma una selfie mirando directamente a la cámara en un lugar bien iluminado.
                      </p>
                    </div>
                    <Button onClick={handleCaptureSelfie} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Capturando...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Tomar Selfie
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {step.id === 'liveness' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-gray-600">
                        Graba un video corto (5-10 segundos) moviendo tu cabeza lentamente.
                      </p>
                    </div>
                    <Button onClick={handleRecordVideo} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Grabando...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 h-4 w-4" />
                          Grabar Video
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {step.id === 'background' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-gray-600">
                        Se verificarán tus antecedentes automáticamente. Este proceso puede tomar
                        unos minutos.
                      </p>
                    </div>
                    <Button disabled className="w-full">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificación en Progreso
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Requirements Info */}
      {requirements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requisitos de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Documentos requeridos:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {requirements.documents.map((doc: string) => (
                  <li key={doc}>{doc.replace(/_/g, ' ').toUpperCase()}</li>
                ))}
              </ul>
              <p className="font-medium mt-4">Verificaciones que se realizarán:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {requirements.checks.map((check: string) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
