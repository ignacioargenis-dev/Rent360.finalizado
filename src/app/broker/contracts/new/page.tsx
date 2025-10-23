'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Home,
  User,
  Users,
  Search,
  UserCheck,
  Mail,
  Send,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  deposit: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerRUT?: string;
}

// Función para generar términos y condiciones base para corredores
const generateBrokerContractTerms = (
  propertyTitle: string = '[PROPIEDAD]',
  ownerName: string = '[PROPIETARIO]',
  tenantName: string = '[INQUILINO]',
  brokerName: string = '[CORREDOR]',
  startDate: string = '[FECHA_INICIO]',
  endDate: string = '[FECHA_TERMINO]',
  monthlyRent: string = '[RENTA_MENSUAL]',
  deposit: string = '[DEPÓSITO]',
  commission: string = '[COMISIÓN]'
) => {
  return `CONTRATO DE ARRIENDO DE VIVIENDA MEDIADO POR CORREDOR

Entre las partes que al final aparecen firmando, se ha convenido el siguiente contrato de arriendo de vivienda, mediado por el corredor ${brokerName}, regido por la Ley N° 18.101 y demás normas aplicables.

PRIMERA: OBJETO DEL CONTRATO
El ARRENDADOR da en arriendo al ARRENDATARIO, y este lo recibe, la propiedad ubicada en ${propertyTitle}, para ser destinada exclusivamente a habitación familiar.

SEGUNDA: INTERMEDIACIÓN DEL CORREDOR
El corredor ${brokerName} ha actuado como intermediario en la celebración del presente contrato, cobrando por sus servicios una comisión equivalente a ${commission} pesos chilenos, pagadera conforme a lo establecido en la cláusula quinta.

TERCERA: PLAZO DEL CONTRATO
El presente contrato tendrá una duración de [DURACIÓN] meses, contados desde el ${startDate} hasta el ${endDate}, prorrogándose automáticamente por períodos iguales, salvo aviso de no renovación con anticipación de 90 días.

CUARTA: RENTA Y FORMA DE PAGO
El ARRENDATARIO pagará al ARRENDADOR una renta mensual de ${monthlyRent} pesos chilenos, pagadera por adelantado dentro de los primeros 5 días de cada mes.

El primer pago deberá efectuarse al momento de suscribir el presente contrato.

QUINTA: DEPÓSITO DE GARANTÍA Y COMISIÓN
El ARRENDATARIO entrega en este acto un depósito de garantía equivalente a ${deposit} pesos chilenos.

La comisión del corredor será pagada por el ARRENDADOR en un plazo máximo de 30 días contados desde la firma del presente contrato.

SEXTA: OBLIGACIONES DEL ARRENDADOR
El ARRENDADOR se obliga a:
1. Entregar el inmueble en perfectas condiciones de habitabilidad
2. Mantener el inmueble en condiciones adecuadas durante el contrato
3. Efectuar las reparaciones necesarias para el mantenimiento normal
4. Respetar la privacidad del ARRENDATARIO
5. Permitir el uso pacífico del inmueble

SÉPTIMA: OBLIGACIONES DEL ARRENDATARIO
El ARRENDATARIO se obliga a:
1. Pagar puntualmente la renta convenida
2. Destinar el inmueble exclusivamente a habitación
3. Conservar el inmueble en buen estado
4. Permitir el acceso al inmueble para inspecciones con previo aviso de 24 horas
5. No realizar modificaciones sin autorización escrita
6. No subarrendar total o parcialmente el inmueble
7. Comunicar inmediatamente cualquier daño o desperfecto

OCTAVA: OBLIGACIONES DEL CORREDOR
El corredor se obliga a:
1. Actuar con la diligencia y lealtad debidas
2. Informar verazmente sobre las condiciones del inmueble
3. Facilitar la comunicación entre las partes
4. Mantener la confidencialidad de la información
5. Cumplir con las normas de la Ley N° 18.101

NOVENA: MORA EN EL PAGO
Si el ARRENDATARIO incurriere en mora en el pago de la renta, se aplicarán intereses de mora conforme al artículo 47 de la Ley N° 18.101, equivalentes al 1.5% mensual sobre el monto adeudado.

DÉCIMA: TERMINACIÓN ANTICIPADA
1. El ARRENDADOR podrá terminar el contrato por las causales establecidas en la Ley N° 18.101
2. El ARRENDATARIO podrá terminar el contrato dando aviso con 30 días de anticipación
3. En caso de venta del inmueble, el contrato continúa vigente con el nuevo propietario

DÉCIMA PRIMERA: LEGISLACIÓN APLICABLE
Este contrato se rige por las disposiciones de la Ley N° 18.101, Ley N° 21.461 ("Devuélveme mi Casa") y demás normas del Código Civil aplicables.

DÉCIMA SEGUNDA: DOMICILIO Y NOTIFICACIONES
Para todos los efectos del presente contrato, las partes fijan domicilio en las direcciones que anteceden. Las notificaciones se efectuarán válidamente en dichos domicilios.

EN FE DE LO CUAL, las partes firman el presente contrato en [LUGAR], a los [DÍAS] días del mes de [MES] de [AÑO].

___________________________     ___________________________
ARRENDADOR: ${ownerName}           ARRENDATARIO: ${tenantName}

RUT: [RUT_ARRENDADOR]              RUT: [RUT_ARRENDATARIO]

Domicilio: [DOMICILIO_ARRENDADOR]  Domicilio: [DOMICILIO_ARRENDATARIO]

___________________________
CORREDOR: ${brokerName}

RUT: [RUT_CORREDOR]`;
};

export default function NewBrokerContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [commission, setCommission] = useState<string>('');
  const [terms, setTerms] = useState<string>('');

  // Información del propietario (puede no estar en el sistema)
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerRUT, setOwnerRUT] = useState<string>('');

  // Información del inquilino (puede no estar en el sistema)
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [tenantRUT, setTenantRUT] = useState<string>('');

  // Opciones de envío
  const [sendToOwner, setSendToOwner] = useState<boolean>(false);
  const [customMessage, setCustomMessage] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Cargar propiedades disponibles para el corredor
  useEffect(() => {
    const loadProperties = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch('/api/broker/properties', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProperties(data.properties || []);
          }
        }
      } catch (error) {
        logger.error('Error loading properties for broker:', error);
      }
    };

    loadProperties();
  }, [user]);

  // Establecer propiedad por defecto si viene en URL
  useEffect(() => {
    const propertyId = searchParams?.get('propertyId');
    if (propertyId) {
      setSelectedPropertyId(propertyId);
      // Cargar información del propietario si la propiedad está en el sistema
      const selectedProperty = properties.find(p => p.id === propertyId);
      if (selectedProperty) {
        setOwnerName(selectedProperty.ownerName || '');
        setOwnerEmail(selectedProperty.ownerEmail || '');
        setOwnerPhone(selectedProperty.ownerPhone || '');
        setOwnerRUT(selectedProperty.ownerRUT || '');
        setDeposit(selectedProperty.deposit?.toString() || '');
      }
    }
  }, [searchParams, properties]);

  // Inicializar términos con contenido base
  useEffect(() => {
    if (terms === '' && user && selectedPropertyId) {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      const baseTerms = generateBrokerContractTerms(
        selectedProperty?.title || '[PROPIEDAD]',
        ownerName || '[PROPIETARIO]',
        tenantName || '[INQUILINO]',
        user.name || '[CORREDOR]',
        startDate || '[FECHA_INICIO]',
        endDate || '[FECHA_TERMINO]',
        monthlyRent || '[RENTA_MENSUAL]',
        deposit || '[DEPÓSITO]',
        commission || '[COMISIÓN]'
      );
      setTerms(baseTerms);
    }
  }, [
    properties,
    selectedPropertyId,
    ownerName,
    tenantName,
    startDate,
    endDate,
    monthlyRent,
    deposit,
    commission,
    user,
    terms,
  ]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const selectedProperty = properties.find(p => p.id === propertyId);
    if (selectedProperty) {
      setOwnerName(selectedProperty.ownerName || '');
      setOwnerEmail(selectedProperty.ownerEmail || '');
      setOwnerPhone(selectedProperty.ownerPhone || '');
      setOwnerRUT(selectedProperty.ownerRUT || '');
      setDeposit(selectedProperty.deposit?.toString() || '');
    }
  };

  const updateTermsWithData = () => {
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    const updatedTerms = generateBrokerContractTerms(
      selectedProperty?.title || '[PROPIEDAD]',
      ownerName || '[PROPIETARIO]',
      tenantName || '[INQUILINO]',
      user?.name || '[CORREDOR]',
      startDate || '[FECHA_INICIO]',
      endDate || '[FECHA_TERMINO]',
      monthlyRent || '[RENTA_MENSUAL]',
      deposit || '[DEPÓSITO]',
      commission || '[COMISIÓN]'
    );
    setTerms(updatedTerms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedPropertyId ||
      !tenantName ||
      !tenantEmail ||
      !ownerName ||
      !ownerEmail ||
      !startDate ||
      !endDate ||
      !monthlyRent
    ) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    setLoading(true);

    try {
      const contractData = {
        propertyId: selectedPropertyId,
        tenantName,
        tenantEmail,
        tenantPhone: tenantPhone || undefined,
        tenantRUT: tenantRUT || undefined,
        ownerName,
        ownerEmail,
        ownerPhone: ownerPhone || undefined,
        ownerRUT: ownerRUT || undefined,
        startDate,
        endDate,
        monthlyRent: parseFloat(monthlyRent),
        depositAmount: parseFloat(deposit) || 0,
        commissionAmount: parseFloat(commission) || 0,
        terms: terms || undefined,
        sendToOwner,
        customMessage: sendToOwner ? customMessage : undefined,
      };

      const response = await fetch('/api/broker/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Contrato creado exitosamente como borrador.');
        router.push(`/broker/contracts/${data.contract.id}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Error al crear contrato: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error creating broker contract:', error);
      alert('❌ Error de conexión al crear contrato');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    updateTermsWithData();
    setShowPreview(true);
  };

  const handleSendToOwner = () => {
    if (!ownerEmail) {
      alert('Debe ingresar el email del propietario para enviar el contrato.');
      return;
    }
    setShowSendDialog(true);
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Contrato de Arriendo</h1>
            <p className="text-gray-600">Crear contrato como corredor inmobiliario</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la Propiedad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Información de la Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property">Seleccionar Propiedad</Label>
                <Select value={selectedPropertyId} onValueChange={handlePropertyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyRent">Renta Mensual (CLP)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(e.target.value)}
                    placeholder="Ej: 450000"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Depósito de Garantía (CLP)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                    placeholder="Ej: 900000"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission">Comisión del Corredor (CLP)</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={commission}
                    onChange={e => setCommission(e.target.value)}
                    placeholder="Ej: 135000"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Propietario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Propietario
              </CardTitle>
              <p className="text-sm text-gray-600">
                Si el propietario no está registrado en Rent360, complete manualmente
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Nombre Completo *</Label>
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Juan Pérez González"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerRUT">RUT</Label>
                  <Input
                    id="ownerRUT"
                    value={ownerRUT}
                    onChange={e => setOwnerRUT(e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerEmail">Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerPhone">Teléfono</Label>
                  <Input
                    id="ownerPhone"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Inquilino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Información del Inquilino
              </CardTitle>
              <p className="text-sm text-gray-600">
                Si el inquilino no está registrado en Rent360, complete manualmente
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantName">Nombre Completo *</Label>
                  <Input
                    id="tenantName"
                    value={tenantName}
                    onChange={e => setTenantName(e.target.value)}
                    placeholder="María González López"
                  />
                </div>
                <div>
                  <Label htmlFor="tenantRUT">RUT</Label>
                  <Input
                    id="tenantRUT"
                    value={tenantRUT}
                    onChange={e => setTenantRUT(e.target.value)}
                    placeholder="11.222.333-4"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantEmail">Email *</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    value={tenantEmail}
                    onChange={e => setTenantEmail(e.target.value)}
                    placeholder="maria@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="tenantPhone">Teléfono</Label>
                  <Input
                    id="tenantPhone"
                    value={tenantPhone}
                    onChange={e => setTenantPhone(e.target.value)}
                    placeholder="+56 9 8765 4321"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Términos y Condiciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Términos y Condiciones
              </CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={updateTermsWithData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar con datos
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Los términos se generan automáticamente según la legislación chilena (Ley 18.101).
                  Puede editarlos manualmente según las necesidades específicas del contrato.
                </p>
                <Textarea
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Los términos del contrato se generan automáticamente..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Opciones de Envío */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Envío del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendToOwner"
                  checked={sendToOwner}
                  onChange={e => setSendToOwner(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="sendToOwner">
                  Enviar contrato automáticamente al propietario por email para firma electrónica
                </Label>
              </div>

              {sendToOwner && (
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Mensaje Personalizado (Opcional)</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="Estimado propietario, le envío el contrato de arriendo para la firma electrónica..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-600">
                    El propietario recibirá un email con el contrato adjunto y un enlace seguro para
                    firmar digitalmente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={handlePreview} disabled={loading}>
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando Contrato...' : 'Crear Contrato como Borrador'}
            </Button>
          </div>
        </form>

        {/* Modal de Vista Previa */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa del Contrato</DialogTitle>
              <DialogDescription>Revisa el contrato antes de guardarlo</DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{terms}</pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
