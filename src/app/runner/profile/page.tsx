'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);

  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 'Básico',
  });

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const handleAddSkill = () => {
    setShowAddSkillDialog(true);
  };

  const handleSaveNewSkill = () => {
    if (!newSkill.name.trim()) {
      return;
    }

    const updatedData = {
      ...data,
      skills: [
        ...(data?.skills || []),
        {
          id: Date.now().toString(),
          name: newSkill.name.trim(),
          level: newSkill.level,
          addedDate: new Date().toISOString(),
        },
      ],
    };

    setData(updatedData);
    setNewSkill({ name: '', level: 'Básico' });
    setShowAddSkillDialog(false);
    logger.debug('Nueva habilidad agregada:', newSkill);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (data?.skills) {
      const updatedData = {
        ...data,
        skills: data.skills.filter((skill: any) => skill.id !== skillId),
      };
      setData(updatedData);
    }
  };

  const handleExportCV = () => {
    // Create and download CV/Profile as PDF
    const cvContent = `
      CURRICULUM VITAE - RUNNER
      =========================

      ${data?.personalInfo.name}
      ${data?.personalInfo.email} | ${data?.personalInfo.phone}
      ${data?.personalInfo.location}

      EXPERIENCIA PROFESIONAL:
      ${data?.experience.map((exp: any) => `- ${exp.position} en ${exp.company} (${exp.period})`).join('\n')}

      HABILIDADES:
      ${data?.skills.map((skill: any) => `- ${skill.name} (${skill.level})`).join('\n')}

      CERTIFICACIONES:
      ${data?.certifications.map((cert: any) => `- ${cert.name} (${cert.issuer})`).join('\n')}

      EQUIPO:
      ${data?.equipment.join('\n')}

      ESTADÍSTICAS:
      - Visitas Totales: ${data?.stats.totalVisits}
      - Calificación Promedio: ${data?.stats.avgRating}/5.0
      - Tasa de Completación: ${data?.stats.completionRate}%
    `;

    const blob = new Blob([cvContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CV_${data?.personalInfo.name.replace(' ', '_')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock runner profile data
      const mockProfile = {
        personalInfo: {
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@email.com',
          phone: '+56 9 8765 4321',
          avatar: '/avatars/carlos.jpg',
          location: 'Santiago Centro',
          joinDate: '2023-03-15',
          status: 'active',
        },
        stats: {
          totalVisits: 245,
          completedTasks: 238,
          avgRating: 4.7,
          totalEarnings: 1250000,
          responseTime: '2.3 horas',
          completionRate: 97.1,
        },
        skills: [
          { name: 'Fotografía Profesional', level: 'Experto', verified: true },
          { name: 'Inspección de Propiedades', level: 'Avanzado', verified: true },
          { name: 'Entrega de Llaves', level: 'Intermedio', verified: true },
          { name: 'Reportes Técnicos', level: 'Avanzado', verified: false },
          { name: 'Atención al Cliente', level: 'Experto', verified: true },
        ],
        experience: [
          {
            company: 'Rent360',
            position: 'Runner Senior',
            period: 'Mar 2023 - Presente',
            description:
              'Responsable de visitas de propiedades, fotografías profesionales y coordinación con clientes.',
          },
          {
            company: 'Propiedades Express',
            position: 'Asistente de Ventas',
            period: 'Ene 2022 - Feb 2023',
            description: 'Apoyo en ventas de propiedades y coordinación de visitas.',
          },
        ],
        certifications: [
          {
            name: 'Certificación Fotografía Inmobiliaria',
            issuer: 'ChileProp',
            date: '2023-08-10',
            validUntil: '2025-08-10',
          },
          {
            name: 'Curso Seguridad en Propiedades',
            issuer: 'SENCE',
            date: '2023-05-15',
            validUntil: '2024-05-15',
          },
        ],
        equipment: [
          'Cámara DSLR Canon EOS R',
          'Tripode profesional',
          'Medidor láser',
          'Kit de herramientas básicas',
          'Dispositivo GPS',
        ],
      };

      setData(mockProfile);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Perfil" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Perfil" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Perfil" subtitle="Gestiona y visualiza la información de perfil">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Detalles básicos de tu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-600" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p className="text-lg font-semibold">{data?.personalInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-lg">{data?.personalInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-lg">{data?.personalInfo.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ubicación</label>
                    <p className="text-lg">{data?.personalInfo.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                    <p className="text-lg">
                      {new Date(data?.personalInfo.joinDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalVisits}</div>
              <p className="text-xs text-muted-foreground">Completadas exitosamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.avgRating}/5.0</div>
              <p className="text-xs text-muted-foreground">Promedio de clientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">De tareas asignadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habilidades */}
          <Card>
            <CardHeader>
              <CardTitle>Habilidades</CardTitle>
              <CardDescription>Competencias técnicas y certificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.skills.map((skill: any, index: number) => (
                  <div key={skill.id || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {skill.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{skill.level}</Badge>
                      {skill.verified && (
                        <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id || index.toString())}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experiencia */}
          <Card>
            <CardHeader>
              <CardTitle>Experiencia Laboral</CardTitle>
              <CardDescription>Historial profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.experience.map((exp: any, index: number) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4">
                    <div className="font-semibold">{exp.position}</div>
                    <div className="text-sm text-gray-600">{exp.company}</div>
                    <div className="text-xs text-gray-500 mb-2">{exp.period}</div>
                    <p className="text-sm text-gray-700">{exp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Certificaciones</CardTitle>
              <CardDescription>Credenciales y capacitaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.certifications.map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-sm text-gray-600">Emitido por {cert.issuer}</div>
                      <div className="text-xs text-gray-500">
                        Válido hasta {new Date(cert.validUntil).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipo */}
          <Card>
            <CardHeader>
              <CardTitle>Equipo y Herramientas</CardTitle>
              <CardDescription>Recursos disponibles para el trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data?.equipment.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
                <DialogTrigger asChild>
                  <QuickActionButton
                    icon={Plus}
                    label="Nueva Habilidad"
                    description="Agregar competencia"
                    onClick={handleAddSkill}
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Habilidad</DialogTitle>
                    <DialogDescription>
                      Agrega una nueva competencia a tu perfil profesional.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="skill-name">Nombre de la Habilidad</Label>
                      <Input
                        id="skill-name"
                        placeholder="Ej: Reparación de electrodomésticos"
                        value={newSkill.name}
                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skill-level">Nivel de Experiencia</Label>
                      <Select
                        value={newSkill.level}
                        onValueChange={value => setNewSkill({ ...newSkill, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Básico">Básico</SelectItem>
                          <SelectItem value="Intermedio">Intermedio</SelectItem>
                          <SelectItem value="Avanzado">Avanzado</SelectItem>
                          <SelectItem value="Experto">Experto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveNewSkill} className="flex-1">
                        Agregar Habilidad
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddSkillDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <QuickActionButton
                icon={Edit}
                label="Editar Perfil"
                description="Actualizar información"
                onClick={() => router.push('/runner/profile/edit')}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar CV"
                description="Descargar perfil"
                onClick={handleExportCV}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Estadísticas"
                description="Ver rendimiento"
                onClick={() => router.push('/runner/reports')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Ajustes del perfil"
                onClick={() => router.push('/runner/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar perfil"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
