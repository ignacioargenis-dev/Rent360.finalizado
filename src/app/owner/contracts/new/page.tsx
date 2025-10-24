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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  deposit: number;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rut?: string;
  address?: string;
  city?: string;
  commune?: string;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// Función para generar términos y condiciones base según legislación chilena
const generateBaseContractTerms = (
  propertyAddress: string = '[DIRECCIÓN_PROPIEDAD]',
  propertyRol: string = '[ROL_PROPIEDAD]',
  tenantName: string = '[INQUILINO]',
  ownerName: string = '[PROPIETARIO]',
  startDate: string = '[FECHA_INICIO]',
  endDate: string = '[FECHA_TERMINO]',
  monthlyRent: string = '[RENTA_MENSUAL]',
  deposit: string = '[DEPÓSITO]'
) => {
  return `CONTRATO DE ARRIENDO DE VIVIENDA

Entre las partes que al final aparecen firmando, se ha convenido el siguiente contrato de arriendo de vivienda, regido por la Ley N° 18.101 y demás normas aplicables.

PRIMERA: OBJETO DEL CONTRATO
El ARRENDADOR da en arriendo al ARRENDATARIO, y este lo recibe, la propiedad ubicada en ${propertyAddress}${propertyRol ? `, Rol N° ${propertyRol}` : ''}, para ser destinada exclusivamente a habitación familiar.

SEGUNDA: PLAZO DEL CONTRATO
El presente contrato tendrá una duración de [DURACIÓN] meses, contados desde el ${startDate} hasta el ${endDate}, prorrogándose automáticamente por períodos iguales, salvo aviso de no renovación con anticipación de 90 días.

TERCERA: RENTA Y FORMA DE PAGO
El ARRENDATARIO pagará al ARRENDADOR una renta mensual de ${monthlyRent} pesos chilenos, pagadera por adelantado dentro de los primeros 5 días de cada mes.

El primer pago deberá efectuarse al momento de suscribir el presente contrato.

CUARTA: DEPÓSITO DE GARANTÍA
El ARRENDATARIO entrega en este acto un depósito de garantía equivalente a ${deposit} pesos chilenos, equivalente a [MESES] meses de arriendo.

El depósito será devuelto al ARRENDATARIO dentro del plazo de 60 días contados desde la efectiva restitución del inmueble, una vez deducidos los montos correspondientes a:

- Arriendos impagos
- Daños causados por uso indebido
- Multas por infracciones contractuales
- Gastos de reparación por deterioro anormal

QUINTA: OBLIGACIONES DEL ARRENDADOR
El ARRENDADOR se obliga a:
1. Entregar el inmueble en perfectas condiciones de habitabilidad
2. Mantener el inmueble en condiciones adecuadas durante el contrato
3. Efectuar las reparaciones necesarias para el mantenimiento normal
4. Respetar la privacidad del ARRENDATARIO
5. Permitir el uso pacífico del inmueble

SEXTA: OBLIGACIONES DEL ARRENDATARIO
El ARRENDATARIO se obliga a:
1. Pagar puntualmente la renta convenida
2. Destinar el inmueble exclusivamente a habitación
3. Conservar el inmueble en buen estado
4. Permitir el acceso al inmueble para inspecciones con previo aviso de 24 horas
5. No realizar modificaciones sin autorización escrita
6. No subarrendar total o parcialmente el inmueble
7. Comunicar inmediatamente cualquier daño o desperfecto

SÉPTIMA: MORA EN EL PAGO
Si el ARRENDATARIO incurriere en mora en el pago de la renta, se aplicarán intereses de mora conforme al artículo 47 de la Ley N° 18.101, equivalentes al 1.5% mensual sobre el monto adeudado.

OCTAVA: TERMINACIÓN ANTICIPADA
1. El ARRENDADOR podrá terminar el contrato por las causales establecidas en la Ley N° 18.101
2. El ARRENDATARIO podrá terminar el contrato dando aviso con 30 días de anticipación
3. En caso de venta del inmueble, el contrato continúa vigente con el nuevo propietario

NOVENA: LEGISLACIÓN APLICABLE
Este contrato se rige por las disposiciones de la Ley N° 18.101, Ley N° 21.461 ("Devuélveme mi Casa") y demás normas del Código Civil aplicables.

DÉCIMA: DOMICILIO Y NOTIFICACIONES
Para todos los efectos del presente contrato, las partes fijan domicilio en las direcciones que anteceden. Las notificaciones se efectuarán válidamente en dichos domicilios.

EN FE DE LO CUAL, las partes firman el presente contrato en [LUGAR], a los [DÍAS] días del mes de [MES] de [AÑO].

___________________________     ___________________________
ARRENDADOR: ${ownerName}           ARRENDATARIO: ${tenantName}

RUT: [RUT_ARRENDADOR]              RUT: [RUT_ARRENDATARIO]

Domicilio: [DOMICILIO_ARRENDADOR]  Domicilio: [DOMICILIO_ARRENDATARIO]`;
};

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [propertyRolNumber, setPropertyRolNumber] = useState<string>('');
  const [tenantRut, setTenantRut] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTenant, setSearchTenant] = useState<string>('');
  const [searchBroker, setSearchBroker] = useState<string>('');

  // Inicializar términos y condiciones con contenido base
  useEffect(() => {
    if (terms === '') {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      const selectedTenant = tenants.find(t => t.id === selectedTenantId);

      const baseTerms = generateBaseContractTerms(
        selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}` : '[DIRECCIÓN_PROPIEDAD]',
        propertyRolNumber || '[ROL_PROPIEDAD]',
        selectedTenant?.name || '[INQUILINO]',
        user?.name || '[PROPIETARIO]',
        startDate || '[FECHA_INICIO]',
        endDate || '[FECHA_TERMINO]',
        monthlyRent || '[RENTA_MENSUAL]',
        deposit || '[DEPÓSITO]'
      );

      setTerms(baseTerms);
    }
  }, [
    properties,
    tenants,
    selectedPropertyId,
    selectedTenantId,
    startDate,
    endDate,
    monthlyRent,
    deposit,
    propertyRolNumber,
    user,
    terms,
  ]);

  // Función para actualizar términos cuando cambian los datos
  const updateTermsWithData = () => {
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    const selectedTenant = tenants.find(t => t.id === selectedTenantId);

    const updatedTerms = generateBaseContractTerms(
      selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}` : '[DIRECCIÓN_PROPIEDAD]',
      propertyRolNumber || '[ROL_PROPIEDAD]',
      selectedTenant?.name || '[INQUILINO]',
      user?.name || '[PROPIETARIO]',
      startDate || '[FECHA_INICIO]',
      endDate || '[FECHA_TERMINO]',
      monthlyRent || '[RENTA_MENSUAL]',
      deposit || '[DEPÓSITO]'
    );

    setTerms(updatedTerms);
  };

  // Cargar propiedades del propietario
  useEffect(() => {
    const loadProperties = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch('/api/owner/properties', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProperties(data.properties || []);
          }
        }
      } catch (error) {
        logger.error('Error loading properties:', error);
      }
    };

    loadProperties();
  }, [user]);

  // Cargar inquilinos reales
  useEffect(() => {
    const loadTenants = async () => {
      try {
        // Usar API específica para propietarios
        const response = await fetch(
          `/api/owner/search-tenants?search=${encodeURIComponent(searchTenant)}&limit=50`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            setTenants(data.users);
          }
        } else {
          logger.warn('Could not load tenants from API, using empty list');
          setTenants([]);
        }
      } catch (error) {
        logger.error('Error loading tenants:', error);
        setTenants([]);
      }
    };

    loadTenants();
  }, [searchTenant]);

  // Cargar corredores/brokers reales
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        // Usar API específica para propietarios
        const response = await fetch(
          `/api/owner/search-brokers?search=${encodeURIComponent(searchBroker)}&limit=50`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            setBrokers(data.users);
          }
        } else {
          logger.warn('Could not load brokers from API, using empty list');
          setBrokers([]);
        }
      } catch (error) {
        logger.error('Error loading brokers:', error);
        setBrokers([]);
      }
    };

    loadBrokers();
  }, [searchBroker]);

  // Establecer propiedad por defecto si viene en URL
  useEffect(() => {
    const propertyId = searchParams?.get('propertyId');
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
  }, [searchParams]);

  // Auto-llenar dirección de la propiedad cuando se selecciona
  useEffect(() => {
    if (selectedPropertyId) {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (selectedProperty) {
        const fullAddress = `${selectedProperty.address}, ${selectedProperty.city}`;
        setPropertyAddress(fullAddress);
      }
    } else {
      setPropertyAddress('');
    }
  }, [selectedPropertyId, properties]);

  // Auto-llenar RUT y domicilio del inquilino cuando se selecciona
  useEffect(() => {
    if (selectedTenantId) {
      const selectedTenant = tenants.find(t => t.id === selectedTenantId);
      if (selectedTenant) {
        setTenantRut(selectedTenant.rut || '');
        // Construir dirección completa del inquilino
        const tenantAddress = [
          selectedTenant.address,
          selectedTenant.city,
          selectedTenant.commune
        ].filter(Boolean).join(', ');
        // Aquí podríamos agregar el tenantAddress si queremos mostrarlo, pero por ahora solo usamos RUT
      }
    } else {
      setTenantRut('');
    }
  }, [selectedTenantId, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPropertyId || !selectedTenantId || !startDate || !endDate || !monthlyRent) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    setLoading(true);

    try {
      const contractData: any = {
        propertyId: selectedPropertyId,
        tenantId: selectedTenantId,
        tenantRut: tenantRut || null,
        propertyAddress: propertyAddress || null,
        startDate,
        endDate,
        rentAmount: parseFloat(monthlyRent),
        depositAmount: parseFloat(deposit) || 0,
        propertyRolNumber: propertyRolNumber || null,
        terms: terms || 'Contrato de arriendo estándar',
      };

      // Agregar broker si fue seleccionado
      if (selectedBrokerId && selectedBrokerId.trim() !== '') {
        contractData.brokerId = selectedBrokerId;
      }

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        const result = await response.json();
        logger.info('Contract created successfully', { contractId: result.contract?.id });

        alert(
          '¡Contrato creado exitosamente! El inquilino podrá revisarlo y firmarlo desde su panel de contratos.'
        );
        router.push('/owner/contracts');
      } else {
        const errorData = await response.json();
        alert(`Error al crear contrato: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error creating contract:', error);
      alert('Error al procesar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Crear Nuevo Contrato</h1>
            <p className="text-gray-600">
              Establece los términos del contrato de arriendo con un inquilino
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de la Propiedad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="property">Seleccionar Propiedad</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.address}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProperty && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">{selectedProperty.title}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedProperty.address}, {selectedProperty.city}
                    </p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Renta: ${selectedProperty.price.toLocaleString()}</span>
                    <span>Garantía: ${selectedProperty.deposit.toLocaleString()}</span>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Dirección completa:</strong> {propertyAddress}
                    </p>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Inquilino */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Inquilino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tenantSearch">Buscar Inquilino</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tenantSearch"
                      placeholder="Nombre o email del inquilino"
                      value={searchTenant}
                      onChange={e => setSearchTenant(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Seleccionar Inquilino</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un inquilino" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} - {tenant.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTenantId && tenants.find(t => t.id === selectedTenantId) && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    {(() => {
                      const tenant = tenants.find(t => t.id === selectedTenantId);
                      return tenant ? (
                        <>
                          <h4 className="font-semibold">{tenant.name}</h4>
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                          {tenant.phone && (
                            <p className="text-sm text-gray-600">📱 {tenant.phone}</p>
                          )}
                          {tenantRut && <p className="text-sm text-gray-600">🆔 RUT: {tenantRut}</p>}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Corredor (Opcional) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Corredor (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brokerSearch">Buscar Corredor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brokerSearch"
                      placeholder="Nombre, email o empresa del corredor"
                      value={searchBroker}
                      onChange={e => setSearchBroker(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Seleccionar Corredor</Label>
                  <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin corredor (contrato directo)" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map(broker => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name} - {broker.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBrokerId && brokers.find(b => b.id === selectedBrokerId) && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    {(() => {
                      const broker = brokers.find(b => b.id === selectedBrokerId);
                      return broker ? (
                        <>
                          <h4 className="font-semibold">{broker.name}</h4>
                          <p className="text-sm text-gray-600">{broker.email}</p>
                          {broker.phone && (
                            <p className="text-sm text-gray-600">📱 {broker.phone}</p>
                          )}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p>
                    💡 <strong>Nota:</strong> Si seleccionas un corredor, este podrá gestionar el
                    contrato y recibir comisiones por el arriendo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Términos del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Términos del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyRent">Renta Mensual ($)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    placeholder="0"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Garantía ($)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    placeholder="0"
                    value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyRolNumber">Número de Rol de la Propiedad</Label>
                <Input
                  id="propertyRolNumber"
                  placeholder="Ej: 123-456-789"
                  value={propertyRolNumber}
                  onChange={e => setPropertyRolNumber(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Número de rol fiscal de la propiedad (opcional, para identificación tributaria)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="terms">Términos y Condiciones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={updateTermsWithData}
                    className="text-xs"
                  >
                    🔄 Actualizar con datos
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Los términos se generan automáticamente según la legislación chilena (Ley 18.101).
                  Puedes editarlos manualmente según tus necesidades específicas.
                </div>
                <Textarea
                  id="terms"
                  placeholder="Los términos del contrato se generan automáticamente..."
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedPropertyId || !selectedTenantId}>
              {loading ? 'Creando Contrato...' : 'Crear Contrato'}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}
