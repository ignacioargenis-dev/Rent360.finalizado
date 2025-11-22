'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
  FileText,
  Download,
  ExternalLink,
  CreditCard,
  AlertCircle,
  Star,
  TrendingUp,
  Home,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { User as UserType } from '@/types';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${params?.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error('Usuario no encontrado');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadUser();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalles del Usuario">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg mb-2">Cargando información del usuario...</div>
            <div className="text-sm text-gray-500">Por favor espera</div>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <UnifiedDashboardLayout title="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-2">{error || 'Usuario no encontrado'}</div>
            <Button variant="outline" onClick={() => router.push('/admin/users')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista de usuarios
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: 'Administrador', className: 'bg-red-100 text-red-800' },
      OWNER: { label: 'Propietario', className: 'bg-blue-100 text-blue-800' },
      TENANT: { label: 'Arrendatario', className: 'bg-green-100 text-green-800' },
      SUPPORT: { label: 'Soporte', className: 'bg-indigo-100 text-indigo-800' },
      BROKER: { label: 'Corredor', className: 'bg-purple-100 text-purple-800' },
      PROVIDER: { label: 'Proveedor', className: 'bg-orange-100 text-orange-800' },
      MAINTENANCE: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-800' },
      RUNNER: { label: 'Corredor', className: 'bg-cyan-100 text-cyan-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      label: role,
      className: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) {
      return 'No disponible';
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const parseBio = (bio: string | null | undefined) => {
    if (!bio) {
      return null;
    }

    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(bio);

      // Si es un objeto, formatearlo de manera legible
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }

      // Si no es un objeto, retornar el texto original
      return bio;
    } catch {
      // Si no es JSON válido, retornar el texto original
      return bio;
    }
  };

  const renderBio = (bio: string | null | undefined) => {
    const parsed = parseBio(bio);

    if (!parsed) {
      return null;
    }

    if (typeof parsed === 'string') {
      return <p className="text-gray-700 whitespace-pre-wrap">{parsed}</p>;
    }

    // Si es un objeto, renderizar los campos
    return (
      <div className="space-y-2">
        {Object.entries(parsed).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="ml-4 border-l-2 border-gray-200 pl-4">
                <h5 className="font-semibold text-sm text-gray-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </h5>
                <div className="space-y-1">
                  {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 capitalize">
                        {subKey.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-gray-800">
                        {typeof subValue === 'boolean'
                          ? subValue
                            ? 'Sí'
                            : 'No'
                          : String(subValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="font-medium text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-gray-800">
                {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PROPERTY_DOCUMENT: 'Documento de Propiedad',
      UTILITY_BILL: 'Boleta de Servicios',
      OTHER_DOCUMENT: 'Otro Documento',
      ID_FRONT: 'Cédula de Identidad (Frente)',
      ID_BACK: 'Cédula de Identidad (Reverso)',
      CRIMINAL_RECORD: 'Antecedentes Penales',
      SOCIAL_SECURITY: 'Seguridad Social',
      PROPERTY_DEED: 'Escritura de Propiedad',
      RESIDENCE_PROOF: 'Comprobante de Residencia',
      CONTRACT: 'Contrato',
      OTHER: 'Otro',
    };
    return types[type] || type;
  };

  const getRatingContextLabel = (contextType: string) => {
    const contexts: Record<string, string> = {
      CONTRACT: 'Contrato',
      SERVICE: 'Servicio',
      MAINTENANCE: 'Mantenimiento',
      PROPERTY_VISIT: 'Visita a Propiedad',
      GENERAL: 'General',
      OTHER: 'Otro',
    };
    return contexts[contextType] || contextType;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) {
      return 0;
    }
    const sum = ratings.reduce((acc, rating) => acc + (rating.overallRating || 0), 0);
    return sum / ratings.length;
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      APARTMENT: 'Departamento',
      HOUSE: 'Casa',
      STUDIO: 'Estudio',
      ROOM: 'Habitación',
      COMMERCIAL: 'Comercial',
    };
    return types[type] || type;
  };

  const getPropertyStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      AVAILABLE: 'Disponible',
      RENTED: 'Arrendada',
      PENDING: 'Pendiente',
      MAINTENANCE: 'Mantenimiento',
    };
    return statuses[status] || status;
  };

  const getContractStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activo',
      EXPIRED: 'Expirado',
      TERMINATED: 'Terminado',
      CANCELLED: 'Cancelado',
    };
    return statuses[status] || status;
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleBadge(user.role)}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Biografía / Información Adicional</h4>
                    {renderBio(user.bio)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-800 text-xs ml-2">Verificado</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2">
                        No verificado
                      </Badge>
                    )}
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Teléfono:</span>
                      <span>{user.phone}</span>
                      {(user as any).phoneVerified ? (
                        <Badge className="bg-green-100 text-green-800 text-xs ml-2">
                          Verificado
                        </Badge>
                      ) : null}
                    </div>
                  )}

                  {(user as any).phoneSecondary && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Teléfono Secundario:</span>
                      <span>{(user as any).phoneSecondary}</span>
                    </div>
                  )}

                  {(user as any).emergencyContact && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">Contacto de Emergencia:</span>
                      <span>{(user as any).emergencyContact}</span>
                      {(user as any).emergencyPhone && (
                        <span className="ml-2 text-gray-600">({(user as any).emergencyPhone})</span>
                      )}
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-red-600 mt-1" />
                      <div className="flex-1">
                        <span className="font-medium">Dirección:</span>
                        <div className="text-gray-700">
                          {user.address}
                          {((user as any).city ||
                            (user as any).commune ||
                            (user as any).region) && (
                            <div className="text-sm text-gray-600 mt-1">
                              {[(user as any).commune, (user as any).city, (user as any).region]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            {((user as any).rut ||
              (user as any).dateOfBirth ||
              (user as any).gender ||
              (user as any).nationality) && (
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(user as any).rut && (
                      <div>
                        <span className="font-medium">RUT:</span>
                        <span className="ml-2">{(user as any).rut}</span>
                        {user.rutVerified ? (
                          <Badge className="bg-green-100 text-green-800 text-xs ml-2">
                            Verificado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2">
                            No verificado
                          </Badge>
                        )}
                      </div>
                    )}

                    {(user as any).dateOfBirth && (
                      <div>
                        <span className="font-medium">Fecha de Nacimiento:</span>
                        <span className="ml-2">{formatDate((user as any).dateOfBirth)}</span>
                      </div>
                    )}

                    {(user as any).gender && (
                      <div>
                        <span className="font-medium">Género:</span>
                        <span className="ml-2">
                          {(user as any).gender === 'M'
                            ? 'Masculino'
                            : (user as any).gender === 'F'
                              ? 'Femenino'
                              : (user as any).gender}
                        </span>
                      </div>
                    )}

                    {(user as any).nationality && (
                      <div>
                        <span className="font-medium">Nacionalidad:</span>
                        <span className="ml-2">{(user as any).nationality}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos
                  {(user as any).documents && (user as any).documents.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({((user as any).documents as any[]).length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(user as any).documents && (user as any).documents.length > 0 ? (
                  <div className="space-y-3">
                    {((user as any).documents as any[]).map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{doc.name}</div>
                            <div className="text-xs text-gray-500 space-x-2">
                              <span>{getDocumentTypeLabel(doc.type)}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/access`, {
                                  credentials: 'include',
                                  method: 'GET',
                                });
                                if (!response.ok) {
                                  throw new Error('Error al acceder al documento');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                setTimeout(() => window.URL.revokeObjectURL(url), 100);
                              } catch (error) {
                                alert(
                                  'Error al abrir el documento. Por favor, verifica tus permisos.'
                                );
                                console.error('Error abriendo documento:', error);
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/access`, {
                                  credentials: 'include',
                                  method: 'GET',
                                });
                                if (!response.ok) {
                                  throw new Error('Error al descargar el documento');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = doc.fileName;
                                link.click();
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                alert(
                                  'Error al descargar el documento. Por favor, verifica tus permisos.'
                                );
                                console.error('Error descargando documento:', error);
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay documentos subidos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ratings Received */}
            {(user as any).ratingsReceived && (user as any).ratingsReceived.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Calificaciones Recibidas
                      <span className="text-sm font-normal text-gray-500">
                        ({((user as any).ratingsReceived as any[]).length})
                      </span>
                    </div>
                    {((user as any).ratingsReceived as any[]).length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Promedio:</span>
                        {renderStars(calculateAverageRating((user as any).ratingsReceived))}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {((user as any).ratingsReceived as any[]).map((rating: any) => (
                      <div
                        key={rating.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {rating.fromUser?.avatar ? (
                              <img
                                src={rating.fromUser.avatar}
                                alt={rating.fromUser.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {rating.isAnonymous
                                  ? 'Usuario Anónimo'
                                  : rating.fromUser?.name || 'Usuario'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {getRatingContextLabel(rating.contextType)}
                                {rating.property && ` • ${rating.property.title}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {renderStars(rating.overallRating)}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(rating.createdAt)}
                            </div>
                          </div>
                        </div>
                        {(rating.communicationRating ||
                          rating.reliabilityRating ||
                          rating.professionalismRating ||
                          rating.qualityRating ||
                          rating.punctualityRating) && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-sm">
                            {rating.communicationRating && (
                              <div>
                                <span className="text-gray-600">Comunicación:</span>{' '}
                                {renderStars(rating.communicationRating)}
                              </div>
                            )}
                            {rating.reliabilityRating && (
                              <div>
                                <span className="text-gray-600">Confiabilidad:</span>{' '}
                                {renderStars(rating.reliabilityRating)}
                              </div>
                            )}
                            {rating.professionalismRating && (
                              <div>
                                <span className="text-gray-600">Profesionalismo:</span>{' '}
                                {renderStars(rating.professionalismRating)}
                              </div>
                            )}
                            {rating.qualityRating && (
                              <div>
                                <span className="text-gray-600">Calidad:</span>{' '}
                                {renderStars(rating.qualityRating)}
                              </div>
                            )}
                            {rating.punctualityRating && (
                              <div>
                                <span className="text-gray-600">Puntualidad:</span>{' '}
                                {renderStars(rating.punctualityRating)}
                              </div>
                            )}
                          </div>
                        )}
                        {rating.comment && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            {rating.comment}
                          </div>
                        )}
                        {rating.positiveFeedback && rating.positiveFeedback.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-green-700">
                              Aspectos positivos:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rating.positiveFeedback.map((feedback: string, idx: number) => (
                                <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                                  {feedback}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {rating.improvementAreas && rating.improvementAreas.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-orange-700">
                              Áreas de mejora:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rating.improvementAreas.map((area: string, idx: number) => (
                                <Badge key={idx} className="bg-orange-100 text-orange-800 text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ratings Given */}
            {(user as any).ratingsGiven && (user as any).ratingsGiven.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Calificaciones Dadas ({((user as any).ratingsGiven as any[]).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {((user as any).ratingsGiven as any[]).map((rating: any) => (
                      <div
                        key={rating.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {rating.toUser?.avatar ? (
                              <img
                                src={rating.toUser.avatar}
                                alt={rating.toUser.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{rating.toUser?.name || 'Usuario'}</div>
                              <div className="text-sm text-gray-500">
                                {getRatingContextLabel(rating.contextType)}
                                {rating.property && ` • ${rating.property.title}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {renderStars(rating.overallRating)}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(rating.createdAt)}
                            </div>
                          </div>
                        </div>
                        {rating.comment && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            {rating.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties */}
            {(((user as any).properties && (user as any).properties.length > 0) ||
              ((user as any).brokerProperties && (user as any).brokerProperties.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Propiedades
                    {(user as any).properties && (user as any).properties.length > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        (Propias: {((user as any).properties as any[]).length})
                      </span>
                    )}
                    {(user as any).brokerProperties &&
                      (user as any).brokerProperties.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          (Gestionadas: {((user as any).brokerProperties as any[]).length})
                        </span>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Owned Properties */}
                    {(user as any).properties &&
                      (user as any).properties.length > 0 &&
                      ((user as any).properties as any[]).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-lg">{property.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{property.address}</div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>
                                  {property.city && property.commune
                                    ? `${property.commune}, ${property.city}`
                                    : property.city || property.commune}
                                </span>
                                <span>•</span>
                                <span>{getPropertyTypeLabel(property.type)}</span>
                                <span>•</span>
                                <span className="font-semibold">
                                  ${property.price?.toLocaleString('es-CL') || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Badge
                                className={
                                  property.status === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-800'
                                    : property.status === 'RENTED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {getPropertyStatusLabel(property.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Broker Managed Properties */}
                    {(user as any).brokerProperties &&
                      (user as any).brokerProperties.length > 0 &&
                      ((user as any).brokerProperties as any[]).map((property: any) => (
                        <div
                          key={property.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-purple-500"
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  Gestionada
                                </Badge>
                                <span className="font-medium text-lg">{property.title}</span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">{property.address}</div>
                              {property.owner && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Propietario: {property.owner.name} ({property.owner.email})
                                </div>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>
                                  {property.city && property.commune
                                    ? `${property.commune}, ${property.city}`
                                    : property.city || property.commune}
                                </span>
                                <span>•</span>
                                <span>{getPropertyTypeLabel(property.type)}</span>
                                <span>•</span>
                                <span className="font-semibold">
                                  ${property.price?.toLocaleString('es-CL') || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Badge
                                className={
                                  property.status === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-800'
                                    : property.status === 'RENTED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {getPropertyStatusLabel(property.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contracts */}
            {(((user as any).contractsAsOwner && (user as any).contractsAsOwner.length > 0) ||
              ((user as any).contractsAsTenant && (user as any).contractsAsTenant.length > 0) ||
              ((user as any).contractsAsBroker && (user as any).contractsAsBroker.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Contratos
                    {(user as any).contractsAsOwner &&
                      (user as any).contractsAsOwner.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          (Como Propietario: {((user as any).contractsAsOwner as any[]).length})
                        </span>
                      )}
                    {(user as any).contractsAsTenant &&
                      (user as any).contractsAsTenant.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          (Como Arrendatario: {((user as any).contractsAsTenant as any[]).length})
                        </span>
                      )}
                    {(user as any).contractsAsBroker &&
                      (user as any).contractsAsBroker.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          (Como Corredor: {((user as any).contractsAsBroker as any[]).length})
                        </span>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Owner Contracts */}
                    {(user as any).contractsAsOwner &&
                      (user as any).contractsAsOwner.length > 0 &&
                      ((user as any).contractsAsOwner as any[]).map((contract: any) => (
                        <div
                          key={contract.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/contracts/${contract.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">Contrato #{contract.contractNumber}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {contract.property?.title || contract.property?.address}
                              </div>
                              {contract.tenant && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Arrendatario: {contract.tenant.name} ({contract.tenant.email})
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                ${contract.monthlyRent?.toLocaleString('es-CL')}/mes •{' '}
                                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                              </div>
                            </div>
                            <Badge
                              className={
                                contract.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : contract.status === 'EXPIRED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {getContractStatusLabel(contract.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}

                    {/* Tenant Contracts */}
                    {(user as any).contractsAsTenant &&
                      (user as any).contractsAsTenant.length > 0 &&
                      ((user as any).contractsAsTenant as any[]).map((contract: any) => (
                        <div
                          key={contract.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-green-500"
                          onClick={() => router.push(`/admin/contracts/${contract.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Como Arrendatario
                                </Badge>
                                <span className="font-medium">
                                  Contrato #{contract.contractNumber}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {contract.property?.title || contract.property?.address}
                              </div>
                              {contract.owner && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Propietario: {contract.owner.name} ({contract.owner.email})
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                ${contract.monthlyRent?.toLocaleString('es-CL')}/mes •{' '}
                                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                              </div>
                            </div>
                            <Badge
                              className={
                                contract.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : contract.status === 'EXPIRED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {getContractStatusLabel(contract.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}

                    {/* Broker Contracts */}
                    {(user as any).contractsAsBroker &&
                      (user as any).contractsAsBroker.length > 0 &&
                      ((user as any).contractsAsBroker as any[]).map((contract: any) => (
                        <div
                          key={contract.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-purple-500"
                          onClick={() => router.push(`/admin/contracts/${contract.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  Como Corredor
                                </Badge>
                                <span className="font-medium">
                                  Contrato #{contract.contractNumber}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {contract.property?.title || contract.property?.address}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {contract.owner && <>Propietario: {contract.owner.name} • </>}
                                {contract.tenant && <>Arrendatario: {contract.tenant.name}</>}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ${contract.monthlyRent?.toLocaleString('es-CL')}/mes •{' '}
                                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                              </div>
                            </div>
                            <Badge
                              className={
                                contract.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : contract.status === 'EXPIRED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {getContractStatusLabel(contract.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">ID de Usuario:</span>
                  <span className="ml-2 font-mono text-sm">{user.id}</span>
                </div>

                <div>
                  <span className="font-medium">Rol:</span>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>

                <div>
                  <span className="font-medium">Estado:</span>
                  <span className="ml-2">
                    {user.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                    )}
                  </span>
                </div>

                <div>
                  <span className="font-medium">Verificado:</span>
                  <span className="ml-2">
                    {/* Para proveedores, mostrar el estado de verificación del proveedor */}
                    {(user as any).maintenanceProvider || (user as any).serviceProvider ? (
                      (user as any).maintenanceProvider ? (
                        (user as any).maintenanceProvider.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">Sí</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">No</Badge>
                        )
                      ) : (user as any).serviceProvider ? (
                        (user as any).serviceProvider.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">Sí</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">No</Badge>
                        )
                      ) : null
                    ) : // Para usuarios normales, mostrar verificación de RUT
                    user.rutVerified ? (
                      <Badge className="bg-green-100 text-green-800">Sí</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">No</Badge>
                    )}
                  </span>
                </div>

                {(user as any).rut && (
                  <div>
                    <span className="font-medium">RUT:</span>
                    <span className="ml-2 font-mono text-sm">{(user as any).rut}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Accounts */}
            {(user as any).bankAccounts && (user as any).bankAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Cuentas Bancarias ({(user as any).bankAccounts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {((user as any).bankAccounts as any[]).map((account: any) => (
                    <div key={account.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{account.bank}</div>
                        {account.isPrimary && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Principal</Badge>
                        )}
                        {account.isVerified ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Verificada</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Tipo:</span> {account.accountType}
                        </div>
                        <div>
                          <span className="font-medium">Número:</span>{' '}
                          <span className="font-mono">{account.accountNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium">Titular:</span> {account.holderName}
                        </div>
                        {account.rut && (
                          <div>
                            <span className="font-medium">RUT:</span>{' '}
                            <span className="font-mono">{account.rut}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.createdAt && (
                  <div>
                    <span className="font-medium">Registrado:</span>
                    <span className="ml-2">{formatDate(user.createdAt)}</span>
                  </div>
                )}
                {user.updatedAt && (
                  <div>
                    <span className="font-medium">Última actualización:</span>
                    <span className="ml-2">{formatDate(user.updatedAt)}</span>
                  </div>
                )}
                {user.lastLogin && (
                  <div>
                    <span className="font-medium">Último acceso:</span>
                    <span className="ml-2">{formatDate(user.lastLogin)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Information */}
            {(user as any).maintenanceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Proveedor de Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.businessName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Especialidad:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.specialty || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2">
                      <Badge
                        className={
                          (user as any).maintenanceProvider.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {(user as any).maintenanceProvider.isVerified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).maintenanceProvider.status || 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {(user as any).serviceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Proveedor de Servicios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del Negocio:</span>
                    <span className="ml-2">
                      {(user as any).serviceProvider.businessName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Servicio:</span>
                    <span className="ml-2">
                      {(user as any).serviceProvider.serviceType || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2">
                      <Badge
                        className={
                          (user as any).serviceProvider.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {(user as any).serviceProvider.isVerified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Estado del Negocio:</span>
                    <span className="ml-2">{(user as any).serviceProvider.status || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
