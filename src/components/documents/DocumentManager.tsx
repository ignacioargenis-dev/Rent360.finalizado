'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, 
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
  User,
  Mail,
  Phone,
  Hash,
  Signature,
  Shield,
  BarChart3,
  RefreshCw,
  Settings,
  Calendar
} from 'lucide-react';
interface Document {
  id: string
  title: string
  type: 'contract' | 'agreement' | 'receipt' | 'form' | 'other'
  status: 'draft' | 'pending_signature' | 'signed' | 'declined' | 'expired'
  created_at: string
  updated_at: string
  expires_at?: string
  parties: {
    id: string
    name: string
    email: string
    role: string
    signed_at?: string
  }[]
  metadata?: {
    property_id?: string
    contract_id?: string
    amount?: number
    start_date?: string
    end_date?: string
  }
  signatures: {
    id: string
    signer_id: string
    signer_name: string
    signer_email: string
    signature_date?: string
    status: 'pending' | 'signed' | 'declined'
    verification_hash: string
  }[]
  file_url?: string
  thumbnail_url?: string
}

interface DocumentStats {
  total_documents: number
  signed_documents: number
  pending_documents: number
  declined_documents: number
  expired_documents: number
  by_type: { type: string; count: number }[]
  by_status: { status: string; count: number }[]
  monthly_trend: { month: string; created: number; signed: number }[]
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Contrato de Arriendo - Departamento Las Condes',
    type: 'contract',
    status: 'signed',
    created_at: '2024-01-10',
    updated_at: '2024-01-15',
    parties: [
      {
        id: '1',
        name: 'Carlos Rodríguez',
        email: 'carlos@ejemplo.com',
        role: 'Propietario',
        signed_at: '2024-01-12',
      },
      {
        id: '2',
        name: 'María González',
        email: 'maria@ejemplo.com',
        role: 'Inquilino',
        signed_at: '2024-01-15',
      },
    ],
    metadata: {
      property_id: 'prop_001',
      contract_id: 'contract_001',
      amount: 350000,
      start_date: '2024-02-01',
      end_date: '2025-01-31',
    },
    signatures: [
      {
        id: '1',
        signer_id: '1',
        signer_name: 'Carlos Rodríguez',
        signer_email: 'carlos@ejemplo.com',
        signature_date: '2024-01-12',
        status: 'signed',
        verification_hash: 'hash_001',
      },
      {
        id: '2',
        signer_id: '2',
        signer_name: 'María González',
        signer_email: 'maria@ejemplo.com',
        signature_date: '2024-01-15',
        status: 'signed',
        verification_hash: 'hash_002',
      },
    ],
    file_url: '/documents/contract_001.pdf',
    thumbnail_url: '/documents/contract_001_thumb.png',
  },
  {
    id: '2',
    title: 'Acuerdo de Mantenimiento',
    type: 'agreement',
    status: 'pending_signature',
    created_at: '2024-01-12',
    updated_at: '2024-01-12',
    expires_at: '2024-01-20',
    parties: [
      {
        id: '1',
        name: 'Carlos Rodríguez',
        email: 'carlos@ejemplo.com',
        role: 'Propietario',
      },
      {
        id: '3',
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        role: 'Proveedor',
      },
    ],
    metadata: {
      property_id: 'prop_001',
    },
    signatures: [
      {
        id: '3',
        signer_id: '1',
        signer_name: 'Carlos Rodríguez',
        signer_email: 'carlos@ejemplo.com',
        status: 'pending',
        verification_hash: 'hash_003',
      },
      {
        id: '4',
        signer_id: '3',
        signer_name: 'Juan Pérez',
        signer_email: 'juan@ejemplo.com',
        status: 'pending',
        verification_hash: 'hash_004',
      },
    ],
  },
  {
    id: '3',
    title: 'Recibo de Pago - Enero 2024',
    type: 'receipt',
    status: 'signed',
    created_at: '2024-01-05',
    updated_at: '2024-01-05',
    parties: [
      {
        id: '2',
        name: 'María González',
        email: 'maria@ejemplo.com',
        role: 'Inquilino',
        signed_at: '2024-01-05',
      },
    ],
    metadata: {
      contract_id: 'contract_001',
      amount: 350000,
    },
    signatures: [
      {
        id: '5',
        signer_id: '2',
        signer_name: 'María González',
        signer_email: 'maria@ejemplo.com',
        signature_date: '2024-01-05',
        status: 'signed',
        verification_hash: 'hash_005',
      },
    ],
    file_url: '/documents/receipt_001.pdf',
  },
];

const mockStats: DocumentStats = {
  total_documents: 156,
  signed_documents: 124,
  pending_documents: 18,
  declined_documents: 8,
  expired_documents: 6,
  by_type: [
    { type: 'contract', count: 89 },
    { type: 'agreement', count: 32 },
    { type: 'receipt', count: 25 },
    { type: 'form', count: 10 },
  ],
  by_status: [
    { status: 'signed', count: 124 },
    { status: 'pending_signature', count: 18 },
    { status: 'draft', count: 5 },
    { status: 'declined', count: 8 },
    { status: 'expired', count: 1 },
  ],
  monthly_trend: [
    { month: 'Sep', created: 12, signed: 10 },
    { month: 'Oct', created: 15, signed: 13 },
    { month: 'Nov', created: 18, signed: 16 },
    { month: 'Dec', created: 22, signed: 20 },
    { month: 'Jan', created: 28, signed: 25 },
  ],
};

export default function DocumentManager() {

  const [documents, setDocuments] = useState<Document[]>(mockDocuments);

  const [stats, setStats] = useState<DocumentStats>(mockStats);

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');

  const [activeTab, setActiveTab] = useState('documents');

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.parties.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || document.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Contrato';
      case 'agreement':
        return 'Acuerdo';
      case 'receipt':
        return 'Recibo';
      case 'form':
        return 'Formulario';
      default:
        return 'Otro';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'pending_signature':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending_signature':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'declined':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSignatureProgress = (document: Document) => {
    const totalSignatures = document.signatures.length;
    const signedSignatures = document.signatures.filter(s => s.status === 'signed').length;
    return {
      total: totalSignatures,
      signed: signedSignatures,
      percentage: totalSignatures > 0 ? (signedSignatures / totalSignatures) * 100 : 0,
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Documentos</h1>
          <p className="text-muted-foreground">Administra documentos digitales y firmas electrónicas</p>
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reporte
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_documents}</div>
            <p className="text-xs text-muted-foreground">
              Documentos gestionados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signed_documents}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.signed_documents / stats.total_documents) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_documents}</div>
            <p className="text-xs text-muted-foreground">
              Esperando firma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declinados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declined_documents}</div>
            <p className="text-xs text-muted-foreground">
              Rechazados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired_documents}</div>
            <p className="text-xs text-muted-foreground">
              Plazo vencido
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="contract">Contratos</SelectItem>
                    <SelectItem value="agreement">Acuerdos</SelectItem>
                    <SelectItem value="receipt">Recibos</SelectItem>
                    <SelectItem value="form">Formularios</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="signed">Firmados</SelectItem>
                    <SelectItem value="pending_signature">Pendientes</SelectItem>
                    <SelectItem value="draft">Borradores</SelectItem>
                    <SelectItem value="declined">Declinados</SelectItem>
                    <SelectItem value="expired">Expirados</SelectItem>
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
            {filteredDocuments.map((document) => {
              const progress = getSignatureProgress(document);
              
              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          <CardTitle className="text-lg">{document.title}</CardTitle>
                          <Badge className="capitalize">
                            {getDocumentTypeLabel(document.type)}
                          </Badge>
                          <Badge className={getStatusColor(document.status)}>
                            {getStatusIcon(document.status)}
                            <span className="ml-1">
                              {document.status === 'pending_signature' ? 'Pendiente' :
                               document.status === 'signed' ? 'Firmado' :
                               document.status === 'draft' ? 'Borrador' :
                               document.status === 'declined' ? 'Declinado' :
                               document.status === 'expired' ? 'Expirado' : document.status}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Creado: {formatDate(document.created_at)}</span>
                          {document.updated_at !== document.created_at && (
                            <span>Actualizado: {formatDate(document.updated_at)}</span>
                          )}
                          {document.expires_at && (
                            <span className="text-orange-600">
                              Expira: {formatDate(document.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Signature Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progreso de Firma</span>
                          <span className="text-sm text-muted-foreground">
                            {progress.signed}/{progress.total} firmas
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Parties */}
                      <div>
                        <span className="text-sm font-medium">Partes Involucradas</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {document.parties.map((party, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <div>
                                  <p className="text-sm font-medium">{party.name}</p>
                                  <p className="text-xs text-muted-foreground">{party.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {party.signed_at ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-green-600">Firmado</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="text-xs text-yellow-600">Pendiente</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metadata */}
                      {document.metadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {document.metadata.property_id && (
                            <div>
                              <span className="text-muted-foreground">Propiedad:</span>
                              <p className="font-medium">{document.metadata.property_id}</p>
                            </div>
                          )}
                          {document.metadata.contract_id && (
                            <div>
                              <span className="text-muted-foreground">Contrato:</span>
                              <p className="font-medium">{document.metadata.contract_id}</p>
                            </div>
                          )}
                          {document.metadata.amount && (
                            <div>
                              <span className="text-muted-foreground">Monto:</span>
                              <p className="font-medium">
                                ${document.metadata.amount.toLocaleString('es-CL')}
                              </p>
                            </div>
                          )}
                          {document.metadata.start_date && (
                            <div>
                              <span className="text-muted-foreground">Inicio:</span>
                              <p className="font-medium">{formatDate(document.metadata.start_date)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification */}
                      {document.status === 'signed' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                          <Shield className="w-4 h-4" />
                          <span>Documento verificado y almacenado de forma segura</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Gestiona tus plantillas de documentos</p>
                <p className="text-sm text-gray-400">Crea y personaliza plantillas para generar documentos rápidamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.by_type.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getDocumentTypeLabel(item.type)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(item.count / Math.max(...stats.by_type.map(t => t.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.monthly_trend.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(month.created / Math.max(...stats.monthly_trend.map(m => m.created))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {month.created} creados
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(month.signed / Math.max(...stats.monthly_trend.map(m => m.signed))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {month.signed} firmados
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Configuración de documentos digitales</p>
                <p className="text-sm text-gray-400">Personaliza las opciones de firma y almacenamiento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
