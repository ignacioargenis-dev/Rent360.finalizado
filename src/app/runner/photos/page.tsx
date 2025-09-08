'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, 
  Upload, 
  Download, Eye, Trash2, 
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Building,
  User as UserIcon,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  FileImage,
  Folder,
  Grid,
  List,
  MoreHorizontal,
  Edit,
  Share,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize, Info } from 'lucide-react';
import { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface PhotoReport {
  id: string;
  visitId: string;
  propertyTitle: string;
  propertyAddress: string;
  clientName: string;
  visitDate: string;
  photos: Photo[];
  status: 'PENDING' | 'UPLOADED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  earnings: number;
  notes?: string;
  reviewerFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
  category: 'general' | 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'exterior' | 'special';
  description?: string;
  isMain: boolean;
}

interface PhotoStats {
  totalPhotos: number;
  pendingUploads: number;
  uploadedThisMonth: number;
  approvedPhotos: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
}

export default function RunnerPhotosPage() {
  const { user, loading: userLoading } = useUserState();

  const [photoReports, setPhotoReports] = useState<PhotoReport[]>([]);

  const [stats, setStats] = useState<PhotoStats>({
    totalPhotos: 0,
    pendingUploads: 0,
    uploadedThisMonth: 0,
    approvedPhotos: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [dateFilter, setDateFilter] = useState<string>('all');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedReport, setSelectedReport] = useState<PhotoReport | null>(null);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockPhotoReports: PhotoReport[] = [
        {
          id: '1',
          visitId: '3',
          propertyTitle: 'Casa Vitacura',
          propertyAddress: 'Av. Vitacura 8900, Vitacura',
          clientName: 'Pedro Silva',
          visitDate: '2024-03-15',
          status: 'APPROVED',
          earnings: 25000,
          notes: 'Visita completada exitosamente, cliente muy satisfecho',
          reviewerFeedback: 'Excelente calidad de fotos, buena cobertura de todas las áreas',
          photos: [
            {
              id: '1',
              url: 'https://via.placeholder.com/400x300',
              filename: 'fachada.jpg',
              size: 2048000,
              uploadedAt: '2024-03-15 16:30',
              category: 'exterior',
              description: 'Fachada principal de la casa',
              isMain: true,
            },
            {
              id: '2',
              url: 'https://via.placeholder.com/400x300',
              filename: 'sala.jpg',
              size: 1843200,
              uploadedAt: '2024-03-15 16:35',
              category: 'living',
              description: 'Sala de estar principal',
              isMain: false,
            },
            {
              id: '3',
              url: 'https://via.placeholder.com/400x300',
              filename: 'cocina.jpg',
              size: 1920000,
              uploadedAt: '2024-03-15 16:40',
              category: 'kitchen',
              description: 'Cocina completamente equipada',
              isMain: false,
            },
          ],
          createdAt: '2024-03-15 16:20',
          updatedAt: '2024-03-15 17:00',
        },
        {
          id: '2',
          visitId: '4',
          propertyTitle: 'Departamento Providencia',
          propertyAddress: 'Av. Providencia 2345, Providencia',
          clientName: 'Laura Fernández',
          visitDate: '2024-03-14',
          status: 'UPLOADED',
          earnings: 18000,
          photos: [
            {
              id: '4',
              url: 'https://via.placeholder.com/400x300',
              filename: 'departamento.jpg',
              size: 1760000,
              uploadedAt: '2024-03-14 12:00',
              category: 'general',
              description: 'Vista general del departamento',
              isMain: true,
            },
            {
              id: '5',
              url: 'https://via.placeholder.com/400x300',
              filename: 'dormitorio.jpg',
              size: 1680000,
              uploadedAt: '2024-03-14 12:05',
              category: 'bedroom',
              description: 'Dormitorio principal',
              isMain: false,
            },
          ],
          createdAt: '2024-03-14 11:45',
          updatedAt: '2024-03-14 12:10',
        },
        {
          id: '3',
          visitId: '1',
          propertyTitle: 'Departamento Las Condes',
          propertyAddress: 'Av. Apoquindo 3400, Las Condes',
          clientName: 'Carlos Ramírez',
          visitDate: '2024-03-15',
          status: 'PENDING',
          earnings: 15000,
          notes: 'Visita pendiente por realizar',
          photos: [],
          createdAt: '2024-03-14 15:30',
          updatedAt: '2024-03-14 15:30',
        },
      ];

      setPhotoReports(mockPhotoReports);
      
      // Calculate stats
      const totalPhotos = mockPhotoReports.reduce((sum, report) => sum + report.photos.length, 0);
      const pendingUploads = mockPhotoReports.filter(report => report.status === 'PENDING').length;
      const uploadedThisMonth = mockPhotoReports
        .filter(report => {
          const uploadDate = new Date(report.createdAt);
          const now = new Date();
          return uploadDate.getMonth() === now.getMonth() && 
                 uploadDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, report) => sum + report.photos.length, 0);
      const approvedPhotos = mockPhotoReports
        .filter(report => report.status === 'APPROVED')
        .reduce((sum, report) => sum + report.photos.length, 0);
      const totalEarnings = mockPhotoReports
        .filter(report => report.status === 'APPROVED')
        .reduce((sum, report) => sum + report.earnings, 0);
      const averageRating = 4.7; // Mock value
      const completionRate = ((totalPhotos - pendingUploads) / totalPhotos) * 100;

      setStats({
        totalPhotos,
        pendingUploads,
        uploadedThisMonth,
        approvedPhotos,
        totalEarnings,
        averageRating,
        completionRate: Number(completionRate.toFixed(1)),
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'UPLOADED':
        return <Badge className="bg-blue-100 text-blue-800">Subido</Badge>;
      case 'REVIEWED':
        return <Badge className="bg-purple-100 text-purple-800">Revisado</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bedroom':
        return <CheckCircle className="w-4 h-4" />;
      case 'bathroom':
        return <CheckCircle className="w-4 h-4" />;
      case 'kitchen':
        return <CheckCircle className="w-4 h-4" />;
      case 'living':
        return <CheckCircle className="w-4 h-4" />;
      case 'exterior':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileImage className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'general': return 'General';
      case 'bedroom': return 'Dormitorio';
      case 'bathroom': return 'Baño';
      case 'kitchen': return 'Cocina';
      case 'living': return 'Sala de Estar';
      case 'exterior': return 'Exterior';
      case 'special': return 'Especial';
      default: return category;
    }
  };

  const filteredReports = photoReports.filter(report => {
    const matchesSearch = report.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const reportDate = new Date(report.visitDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'thisMonth':
          matchesDate = reportDate.getMonth() === now.getMonth() && 
                        reportDate.getFullYear() === now.getFullYear();
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesDate = reportDate >= lastMonth && reportDate < new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'pending':
          matchesDate = report.status === 'PENDING';
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando fotos...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Reportes Fotográficos"
        subtitle="Gestiona las fotos de tus visitas a propiedades"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fotos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingUploads}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.uploadedThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedPhotos}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ganancias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalEarnings)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Completado</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad, cliente o dirección..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="UPLOADED">Subidos</option>
                  <option value="APPROVED">Aprobados</option>
                  <option value="REJECTED">Rechazados</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Todas las fechas</option>
                  <option value="thisMonth">Este mes</option>
                  <option value="lastMonth">Mes pasado</option>
                  <option value="pending">Pendientes</option>
                </select>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Fotos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Reports */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{report.propertyTitle}</CardTitle>
                      <CardDescription className="text-sm">
                        {report.propertyAddress}
                      </CardDescription>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Photos Grid */}
                    {report.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {report.photos.slice(0, 4).map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.url}
                              alt={photo.description || photo.filename}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {photo.isMain && (
                              <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                        ))}
                        {report.photos.length > 4 && (
                          <div className="relative">
                            <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                +{report.photos.length - 4} más
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">No hay fotos</span>
                      </div>
                    )}

                    {/* Report Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">{report.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{formatDate(report.visitDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fotos:</span>
                        <span className="font-medium">{report.photos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ganancias:</span>
                        <span className="font-medium text-green-600">
                          {formatPrice(report.earnings)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      {report.status === 'PENDING' && (
                        <Button size="sm" className="flex-1">
                          <Upload className="w-4 h-4 mr-1" />
                          Subir
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.propertyTitle}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {report.propertyAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      <Badge className="bg-blue-100 text-blue-800">
                        {report.photos.length} fotos
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium">{report.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha visita</p>
                      <p className="font-medium">{formatDate(report.visitDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fotos subidas</p>
                      <p className="font-medium">{report.photos.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ganancias</p>
                      <p className="font-medium text-green-600">
                        {formatPrice(report.earnings)}
                      </p>
                    </div>
                  </div>

                  {report.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Fotos recientes:</p>
                      <div className="flex gap-2">
                        {report.photos.slice(0, 3).map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={photo.url}
                              alt={photo.description || photo.filename}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            {photo.isMain && (
                              <Badge className="absolute top-0 left-0 bg-blue-500 text-white text-xs rounded-tl-lg rounded-br-lg">
                                Principal
                              </Badge>
                            )}
                          </div>
                        ))}
                        {report.photos.length > 3 && (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{report.photos.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {report.reviewerFeedback && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-green-800">
                        <strong>Feedback:</strong> {report.reviewerFeedback}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {report.status === 'PENDING' && (
                      <Button size="sm" className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Fotos
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron reportes fotográficos
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no has subido fotos de visitas.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Subir Primer Reporte
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
