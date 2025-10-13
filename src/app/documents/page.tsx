'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Share,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Hash,
  PenTool,
  Shield,
  BarChart3,
  RefreshCw,
  Settings,
  Upload,
} from 'lucide-react';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DigitalSignature from '@/components/documents/DigitalSignature';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  tags?: string;
  uploaded_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

interface DocumentStats {
  total_documents: number;
  by_category: { category: string; count: number }[];
  by_status: { status: string; count: number }[];
  recent_uploads: Document[];
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total_documents: 0,
    by_category: [],
    by_status: [],
    recent_uploads: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents/upload');
      if (response.ok) {
        const data = await response.json();
        // Agregar documentos mock para firma digital
        const mockDocuments: Document[] = [
          {
            id: 'doc-1',
            title: 'Acuerdo de Confidencialidad',
            description:
              'Acuerdo de confidencialidad entre las partes para proteger información sensible.',
            category: 'agreement',
            file_name: 'acuerdo-confidencialidad.pdf',
            file_path: '/uploads/acuerdo-confidencialidad.pdf',
            file_size: 245760,
            file_type: 'application/pdf',
            tags: 'confidencial, acuerdo',
            uploaded_by: 'admin',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
          },
          {
            id: 'doc-2',
            title: 'Contrato de Servicios',
            description: 'Contrato de prestación de servicios entre proveedor y cliente.',
            category: 'contract',
            file_name: 'contrato-servicios.pdf',
            file_path: '/uploads/contrato-servicios.pdf',
            file_size: 512000,
            file_type: 'application/pdf',
            tags: 'contrato, servicios',
            uploaded_by: 'admin',
            status: 'active',
            created_at: '2024-01-20T14:15:00Z',
            updated_at: '2024-01-20T14:15:00Z',
          },
          {
            id: 'doc-3',
            title: 'Acuerdo de Uso',
            description: 'Términos y condiciones de uso de la plataforma Rent360.',
            category: 'agreement',
            file_name: 'acuerdo-uso.pdf',
            file_path: '/uploads/acuerdo-uso.pdf',
            file_size: 189440,
            file_type: 'application/pdf',
            tags: 'términos, condiciones',
            uploaded_by: 'system',
            status: 'active',
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-10T09:00:00Z',
          },
        ];
        setDocuments([...(data.documents || []), ...mockDocuments]);
      } else {
        // Si no hay API, usar documentos mock
        setDocuments([
          {
            id: 'doc-1',
            title: 'Acuerdo de Confidencialidad',
            description:
              'Acuerdo de confidencialidad entre las partes para proteger información sensible.',
            category: 'agreement',
            file_name: 'acuerdo-confidencialidad.pdf',
            file_path: '/uploads/acuerdo-confidencialidad.pdf',
            file_size: 245760,
            file_type: 'application/pdf',
            tags: 'confidencial, acuerdo',
            uploaded_by: 'admin',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
          },
          {
            id: 'doc-2',
            title: 'Contrato de Servicios',
            description: 'Contrato de prestación de servicios entre proveedor y cliente.',
            category: 'contract',
            file_name: 'contrato-servicios.pdf',
            file_path: '/uploads/contrato-servicios.pdf',
            file_size: 512000,
            file_type: 'application/pdf',
            tags: 'contrato, servicios',
            uploaded_by: 'admin',
            status: 'active',
            created_at: '2024-01-20T14:15:00Z',
            updated_at: '2024-01-20T14:15:00Z',
          },
          {
            id: 'doc-3',
            title: 'Acuerdo de Uso',
            description: 'Términos y condiciones de uso de la plataforma Rent360.',
            category: 'agreement',
            file_name: 'acuerdo-uso.pdf',
            file_path: '/uploads/acuerdo-uso.pdf',
            file_size: 189440,
            file_type: 'application/pdf',
            tags: 'términos, condiciones',
            uploaded_by: 'system',
            status: 'active',
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-10T09:00:00Z',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error fetching documents:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback a documentos mock
      setDocuments([
        {
          id: 'doc-1',
          title: 'Acuerdo de Confidencialidad',
          description:
            'Acuerdo de confidencialidad entre las partes para proteger información sensible.',
          category: 'agreement',
          file_name: 'acuerdo-confidencialidad.pdf',
          file_path: '/uploads/acuerdo-confidencialidad.pdf',
          file_size: 245760,
          file_type: 'application/pdf',
          tags: 'confidencial, acuerdo',
          uploaded_by: 'admin',
          status: 'active',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 'doc-2',
          title: 'Contrato de Servicios',
          description: 'Contrato de prestación de servicios entre proveedor y cliente.',
          category: 'contract',
          file_name: 'contrato-servicios.pdf',
          file_path: '/uploads/contrato-servicios.pdf',
          file_size: 512000,
          file_type: 'application/pdf',
          tags: 'contrato, servicios',
          uploaded_by: 'admin',
          status: 'active',
          created_at: '2024-01-20T14:15:00Z',
          updated_at: '2024-01-20T14:15:00Z',
        },
        {
          id: 'doc-3',
          title: 'Acuerdo de Uso',
          description: 'Términos y condiciones de uso de la plataforma Rent360.',
          category: 'agreement',
          file_name: 'acuerdo-uso.pdf',
          file_path: '/uploads/acuerdo-uso.pdf',
          file_size: 189440,
          file_type: 'application/pdf',
          tags: 'términos, condiciones',
          uploaded_by: 'system',
          status: 'active',
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-10T09:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now
      setStats({
        total_documents: 156,
        by_category: [
          { category: 'contract', count: 45 },
          { category: 'agreement', count: 32 },
          { category: 'receipt', count: 38 },
          { category: 'property', count: 25 },
          { category: 'maintenance', count: 16 },
        ],
        by_status: [
          { status: 'active', count: 156 },
          { status: 'archived', count: 12 },
        ],
        recent_uploads: [],
      });
    } catch (error) {
      logger.error('Error fetching stats:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch =
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || document.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSignDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowSignatureDialog(true);
  };

  const handleSignatureComplete = (signatureData: any) => {
    // Aquí se podría guardar la firma en la base de datos
    setShowSignatureDialog(false);
    setSelectedDocument(null);
    // Refrescar documentos para mostrar el estado actualizado
    fetchDocuments();
  };

  const handleSignatureCancel = () => {
    setShowSignatureDialog(false);
    setSelectedDocument(null);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contract':
        return 'Contrato';
      case 'agreement':
        return 'Acuerdo';
      case 'receipt':
        return 'Recibo';
      case 'form':
        return 'Formulario';
      case 'property':
        return 'Propiedad';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Otro';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    }
    if (type.includes('pdf')) {
      return '📄';
    }
    if (type.includes('word')) {
      return '📝';
    }
    if (type.includes('excel')) {
      return '📊';
    }
    return '📎';
  };

  const handleUploadComplete = (files: any[]) => {
    setShowUpload(false);
    fetchDocuments();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Gestión de Documentos"
      subtitle="Administra y organiza tus documentos digitales"
      showNotifications={true}
    >
      <div className="container mx-auto px-4 py-6">
        {showUpload ? (
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Documentos</h1>
                <p className="text-muted-foreground">Gestiona tus documentos digitales</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Subir Documento
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reporte
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_documents}</div>
                  <p className="text-xs text-muted-foreground">Documentos gestionados</p>
                </CardContent>
              </Card>

              {stats.by_category.slice(0, 3).map(category => (
                <Card key={category.category}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {getCategoryLabel(category.category)}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{category.count}</div>
                    <p className="text-xs text-muted-foreground">
                      {((category.count / stats.total_documents) * 100).toFixed(1)}% del total
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="categories">Categorías</TabsTrigger>
                <TabsTrigger value="analytics">Analíticas</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          <SelectItem value="contract">Contratos</SelectItem>
                          <SelectItem value="agreement">Acuerdos</SelectItem>
                          <SelectItem value="receipt">Recibos</SelectItem>
                          <SelectItem value="form">Formularios</SelectItem>
                          <SelectItem value="property">Propiedades</SelectItem>
                          <SelectItem value="maintenance">Mantenimiento</SelectItem>
                          <SelectItem value="other">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="active">Activos</SelectItem>
                          <SelectItem value="archived">Archivados</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Más filtros
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents List */}
                <div className="grid gap-4">
                  {filteredDocuments.map(document => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getFileIcon(document.file_type)}</span>
                              <CardTitle className="text-lg">{document.title}</CardTitle>
                              <Badge className="capitalize">
                                {getCategoryLabel(document.category)}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activo
                              </Badge>
                            </div>
                            {document.description && (
                              <p className="text-sm text-gray-600">{document.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {(document.category === 'agreement' ||
                              document.category === 'contract') && (
                              <Dialog
                                open={showSignatureDialog && selectedDocument?.id === document.id}
                                onOpenChange={setShowSignatureDialog}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSignDocument(document)}
                                  >
                                    <PenTool className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Firmar Documento - {document.title}</DialogTitle>
                                  </DialogHeader>
                                  {selectedDocument && user && (
                                    <DigitalSignature
                                      document={{
                                        id: selectedDocument.id,
                                        title: selectedDocument.title,
                                        type: selectedDocument.category as any,
                                        content:
                                          selectedDocument.description || 'Contenido del documento',
                                        parties: [
                                          {
                                            name: user.name || 'Usuario',
                                            email: user.email || 'usuario@email.com',
                                            phone: user.phone || '+56912345678',
                                            role: 'signer',
                                          },
                                        ],
                                        metadata: {},
                                      }}
                                      currentUser={{
                                        id: user.id || '1',
                                        name: user.name || 'Usuario',
                                        email: user.email || 'usuario@email.com',
                                        phone: user.phone || '+56912345678',
                                        role: user.role || 'tenant',
                                      }}
                                      mode="sign"
                                      onSigned={handleSignatureComplete}
                                      onSave={handleSignatureComplete}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{document.file_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(document.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatFileSize(document.file_size)}
                            </span>
                          </div>
                        </div>
                        {document.tags && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {document.tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {filteredDocuments.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No se encontraron documentos</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setShowUpload(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir primer documento
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.by_category.map(category => (
                    <Card key={category.category}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {getCategoryLabel(category.category)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{category.count}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(category.count / stats.total_documents) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {((category.count / stats.total_documents) * 100).toFixed(1)}% del total
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analíticas de Documentos</CardTitle>
                    <CardDescription>
                      Estadísticas y tendencias de uso de documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Las analíticas estarán disponibles próximamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Documentos</CardTitle>
                    <CardDescription>
                      Administra la configuración de gestión de documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        La configuración estará disponible próximamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
