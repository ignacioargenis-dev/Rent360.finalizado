# Componentes UI

Este directorio contiene componentes reutilizables construidos con shadcn/ui y Tailwind CSS.

## DataTable

Componente para mostrar datos tabulares con paginación, filtrado y ordenamiento integrados.

### Uso
```typescript
import { DataTable } from '@/components/ui/data-table';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/hooks/useFilters';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const MyComponent = () => {
  const pagination = usePagination({ initialLimit: 10 });
  const filters = useFilters({
    fields: [
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
        ],
      },
    ],
  });

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  const data: User[] = [
    { id: '1', name: 'Juan Pérez', email: 'juan@example.com', status: 'active' },
    { id: '2', name: 'María García', email: 'maria@example.com', status: 'inactive' },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={pagination}
      filters={filters}
      searchable
      exportable
      refreshable
      onExport={() => console.log('Exportar datos')}
      onRefresh={() => console.log('Actualizar datos')}
    />
  );
};
```

### Props
- **data**: Array de datos a mostrar
- **columns**: Configuración de columnas
- **pagination**: Configuración de paginación (opcional)
- **filters**: Configuración de filtros (opcional)
- **loading**: Estado de carga
- **searchable**: Habilitar búsqueda global
- **exportable**: Habilitar botón de exportación
- **refreshable**: Habilitar botón de actualización
- **onExport**: Función para exportar datos
- **onRefresh**: Función para actualizar datos
- **onSort**: Función para manejar ordenamiento
- **onFilter**: Función para manejar filtros
- **className**: Clases CSS adicionales
- **emptyMessage**: Mensaje cuando no hay datos
- **loadingMessage**: Mensaje durante carga

## DashboardLayout

Componente de layout para páginas de dashboard.

### Uso
```typescript
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const MyPage = () => {
  return (
    <DashboardLayout>
      <div>Contenido del dashboard</div>
    </DashboardLayout>
  );
};
```

## DashboardHeader

Componente para encabezados de páginas de dashboard.

### Uso
```typescript
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const MyPage = () => {
  const user = { name: 'Juan Pérez', role: 'admin' };

  return (
    <DashboardHeader
      user={user}
      title="Título de la página"
      subtitle="Subtítulo descriptivo"
    />
  );
};
```

### Props
- **user**: Objeto de usuario
- **title**: Título principal
- **subtitle**: Subtítulo opcional
- **actions**: Acciones adicionales (JSX)

## StatCard

Componente para mostrar tarjetas de estadísticas.

### Uso
```typescript
import StatCard from '@/components/dashboard/StatCard';

const MyPage = () => {
  return (
    <StatCard
      title="Total Usuarios"
      value="1,234"
      change="+12%"
      changeType="positive"
      icon={Users}
    />
  );
};
```

### Props
- **title**: Título de la estadística
- **value**: Valor principal
- **change**: Cambio porcentual (opcional)
- **changeType**: "positive" | "negative" | "neutral"
- **icon**: Icono de Lucide React
- **className**: Clases CSS adicionales

## DocumentManager

Componente para gestión de documentos con upload y vista previa.

### Uso
```typescript
import DocumentManager from '@/components/documents/DocumentManager';

const MyPage = () => {
  return (
    <DocumentManager
      allowedTypes={['pdf', 'jpg', 'png']}
      maxSize={10 * 1024 * 1024} // 10MB
      onUpload={(files) => console.log('Files uploaded:', files)}
      onDelete={(id) => console.log('Document deleted:', id)}
    />
  );
};
```

### Props
- **allowedTypes**: Array de tipos de archivo permitidos
- **maxSize**: Tamaño máximo en bytes
- **onUpload**: Función al subir archivos
- **onDelete**: Función al eliminar documento
- **documents**: Array de documentos existentes
- **className**: Clases CSS adicionales

## DigitalSignature

Componente para firmas digitales.

### Uso
```typescript
import DigitalSignature from '@/components/documents/DigitalSignature';

const MyPage = () => {
  const [signature, setSignature] = useState<string | null>(null);

  return (
    <DigitalSignature
      value={signature}
      onChange={setSignature}
      onClear={() => setSignature(null)}
      width={600}
      height={200}
    />
  );
};
```

### Props
- **value**: Valor actual de la firma
- **onChange**: Función al cambiar firma
- **onClear**: Función al limpiar firma
- **width**: Ancho del canvas
- **height**: Altura del canvas
- **className**: Clases CSS adicionales

## KhipuPayment

Componente para pagos con Khipu.

### Uso
```typescript
import KhipuPayment from '@/components/payments/KhipuPayment';

const MyPage = () => {
  return (
    <KhipuPayment
      amount={50000}
      description="Pago de arriendo"
      onSuccess={(payment) => console.log('Payment successful:', payment)}
      onError={(error) => console.log('Payment error:', error)}
    />
  );
};
```

### Props
- **amount**: Monto del pago
- **description**: Descripción del pago
- **onSuccess**: Función al completar pago
- **onError**: Función al ocurrir error
- **className**: Clases CSS adicionales

## AppointmentCalendar

Componente para calendario de citas.

### Uso
```typescript
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';

const MyPage = () => {
  return (
    <AppointmentCalendar
      appointments={appointments}
      onAppointmentSelect={(appointment) => console.log('Selected:', appointment)}
      onDateChange={(date) => console.log('Date changed:', date)}
    />
  );
};
```

### Props
- **appointments**: Array de citas
- **onAppointmentSelect**: Función al seleccionar cita
- **onDateChange**: Función al cambiar fecha
- **className**: Clases CSS adicionales

## CommissionCalculator

Componente para calcular comisiones.

### Uso
```typescript
import CommissionCalculator from '@/components/commissions/CommissionCalculator';

const MyPage = () => {
  return (
    <CommissionCalculator
      amount={1000000}
      commissionRate={0.05}
      onCalculate={(result) => console.log('Commission:', result)}
    />
  );
};
```

### Props
- **amount**: Monto base
- **commissionRate**: Tasa de comisión (0-1)
- **onCalculate**: Función al calcular
- **className**: Clases CSS adicionales

## Componentes de Notificaciones

### RealTimeNotifications
Componente para notificaciones en tiempo real.

```typescript
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications';

const MyPage = () => {
  return (
    <RealTimeNotifications
      maxNotifications={5}
      onNotificationClick={(notification) => console.log('Clicked:', notification)}
    />
  );
};
```

### ToastNotifications
Componente para notificaciones toast.

```typescript
import ToastNotifications from '@/components/notifications/ToastNotifications';

const MyPage = () => {
  return <ToastNotifications />;
};
```

### ConnectionStatus
Componente para mostrar estado de conexión.

```typescript
import ConnectionStatus from '@/components/notifications/ConnectionStatus';

const MyPage = () => {
  return <ConnectionStatus />;
};
```