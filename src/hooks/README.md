# Custom Hooks

Este directorio contiene hooks personalizados para manejar lógica reutilizable en toda la aplicación.

## usePagination

Hook para manejar paginación de datos de manera consistente.

### Uso
```typescript
import { usePagination } from '@/hooks/usePagination';

const MyComponent = () => {
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 10,
    totalItems: 100,
  });

  return (
    <div>
      <p>Página {pagination.page} de {pagination.totalPages}</p>
      <button onClick={pagination.nextPage} disabled={!pagination.hasNextPage}>
        Siguiente
      </button>
    </div>
  );
};
```

### API
- **page**: Página actual
- **limit**: Items por página
- **total**: Total de items
- **totalPages**: Total de páginas
- **goToPage(page)**: Ir a página específica
- **nextPage()**: Ir a página siguiente
- **prevPage()**: Ir a página anterior
- **setItemsPerPage(limit)**: Cambiar items por página
- **updateTotal(total)**: Actualizar total de items
- **getOffset()**: Obtener offset para consultas
- **getPageRange()**: Obtener rango de items visibles

## useFilters

Hook para manejar filtros complejos con múltiples campos.

### Uso
```typescript
import { useFilters } from '@/hooks/useFilters';

const MyComponent = () => {
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
      {
        key: 'search',
        label: 'Búsqueda',
        type: 'text',
        placeholder: 'Buscar...',
      },
    ],
  });

  return (
    <div>
      <input
        value={filters.getFilterValue('search') || ''}
        onChange={(e) => filters.updateFilter('search', e.target.value)}
      />
      <select
        value={filters.getFilterValue('status') || ''}
        onChange={(e) => filters.updateFilter('status', e.target.value)}
      >
        <option value="">Todos</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>
    </div>
  );
};
```

### API
- **filters**: Objeto con filtros activos
- **updateFilter(key, value)**: Actualizar un filtro específico
- **updateMultipleFilters(filters)**: Actualizar múltiples filtros
- **clearFilter(key)**: Limpiar un filtro específico
- **clearAllFilters()**: Limpiar todos los filtros
- **hasActiveFilters**: Booleano que indica si hay filtros activos
- **getActiveFiltersCount()**: Número de filtros activos
- **getFilterValue(key)**: Obtener valor de un filtro
- **getFilterLabel(key, value)**: Obtener etiqueta formateada de un filtro
- **getFilterQueryParams()**: Obtener query params para URL
- **setFiltersFromQueryParams(searchParams)**: Establecer filtros desde URL
- **getFilterFields()**: Obtener campos de filtros configurados

## useSocket

Hook para manejar conexiones WebSocket/Socket.io.

### Uso
```typescript
import { useSocket } from '@/hooks/useSocket';

const MyComponent = () => {
  const socket = useSocket();

  useEffect(() => {
    if (socket.connected) {
      socket.on('notification', (data) => {
        console.log('Nueva notificación:', data);
      });
    }
  }, [socket]);

  return <div>Componente con WebSocket</div>;
};
```

### API
- **socket**: Instancia de Socket.io
- **connected**: Booleano que indica si está conectado
- **connect()**: Conectar al servidor
- **disconnect()**: Desconectar del servidor

## useToast

Hook para mostrar notificaciones toast.

### Uso
```typescript
import { useToast } from '@/hooks/useToast';

const MyComponent = () => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Operación exitosa",
      description: "Los datos se guardaron correctamente",
      variant: "success",
    });
  };

  return <button onClick={showToast}>Mostrar Toast</button>;
};
```

### API
- **toast(options)**: Mostrar un toast
  - **title**: Título del toast
  - **description**: Descripción opcional
  - **variant**: "default" | "destructive" | "success"

## useUserState

Hook para manejar el estado del usuario autenticado.

### Uso
```typescript
import { useUserState } from '@/hooks/useUserState';

const MyComponent = () => {
  const { user, loading, refreshUser } = useUserState();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      <button onClick={refreshUser}>Actualizar datos</button>
    </div>
  );
};
```

### API
- **user**: Objeto de usuario o null
- **loading**: Booleano de carga
- **refreshUser()**: Función para recargar datos del usuario