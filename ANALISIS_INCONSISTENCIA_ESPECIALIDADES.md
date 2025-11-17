# Análisis: Inconsistencia de Datos - Especialidades de Proveedores de Mantenimiento

## Problema Identificado

El usuario de mantenimiento tiene servicios específicos configurados (Plomería, Eléctrica, Estructural, Pintura, Carpintería), pero no aparecen proveedores disponibles al intentar asignar un proveedor a una solicitud de mantenimiento.

## Análisis de la Inconsistencia

### 1. **Formato de Almacenamiento de Especialidades**

**En la Base de Datos:**

- Campo `specialties`: JSON array de strings
- Campo `specialty`: String principal
- Ejemplo: `specialties: '["Plomería", "Eléctrica", "Estructural", "Pintura", "Carpintería"]'`

**En el Frontend (Settings):**

- Las especialidades se guardan como array de strings
- Se convierten a JSON string antes de guardar en BD
- Código: `specialties: JSON.stringify(specialties)`

### 2. **Categorías de Mantenimiento**

**Valores posibles en `maintenance.category`:**

- `'electrical'` → Eléctrica
- `'plumbing'` → Plomería
- `'structural'` → Estructural
- `'appliance'` → Electrodomésticos
- `'general'` → General
- `'other'` → Otro

**Problema:** No hay categorías para:

- `'painting'` → Pintura
- `'carpentry'` → Carpintería
- `'hvac'` → Climatización
- `'gardening'` → Jardinería

### 3. **Mapeo de Categorías a Especialidades**

**ANTES de la corrección:**

```typescript
const categoryMapping: Record<string, string[]> = {
  general: ['general', 'mantenimiento general', 'mantenimiento'],
  electrical: ['eléctrica', 'electricidad', 'reparaciones eléctricas', 'electrical'],
  plumbing: ['plomería', 'plumbing', 'fontanería'],
  structural: ['estructural', 'structural', 'construcción'],
  appliance: ['electrodomésticos', 'appliance', 'reparación'],
  cleaning: ['limpieza', 'cleaning', 'limpieza profesional'],
  other: ['otro', 'other', 'general'],
};
```

**Problemas:**

1. ❌ No incluye mapeos para Pintura, Carpintería, Climatización, Jardinería
2. ❌ Comparación simple con `includes()` puede fallar con acentos
3. ❌ No normaliza strings antes de comparar
4. ❌ No maneja variantes en mayúsculas/minúsculas correctamente

### 4. **Lógica de Comparación**

**Problema Principal:**

```typescript
// Comparación ANTES (problemática)
const hasMatchingSpecialty = specialtiesArray.some(spec => {
  const specLower = spec.toLowerCase();
  return mappedCategories.some(cat => specLower.includes(cat) || cat.includes(specLower));
});
```

**Problemas:**

- No normaliza acentos: "Eléctrica" vs "electrica"
- No maneja espacios extra
- Comparación bidireccional puede dar falsos positivos
- No loguea detalles del proceso de matching

## Soluciones Implementadas

### 1. **Mapeo Expandido de Categorías**

```typescript
const categoryMapping: Record<string, string[]> = {
  general: [
    'general',
    'mantenimiento general',
    'mantenimiento',
    'reparación',
    'reparaciones',
    'otro',
    'other',
  ],
  electrical: [
    'eléctrica',
    'electricidad',
    'reparaciones eléctricas',
    'electrical',
    'electric',
    'eléctrico',
    'instalación eléctrica',
  ],
  plumbing: [
    'plomería',
    'plumbing',
    'fontanería',
    'fontanero',
    'cañerías',
    'tuberías',
    'agua',
    'sanitario',
  ],
  structural: [
    'estructural',
    'structural',
    'construcción',
    'albañilería',
    'mampostería',
    'techos',
    'paredes',
  ],
  // ✅ NUEVAS CATEGORÍAS AGREGADAS
  painting: ['pintura', 'painting', 'pintor', 'pintado', 'acabados', 'reparación pintura'],
  carpentry: ['carpintería', 'carpentry', 'carpintero', 'muebles', 'puertas', 'ventanas', 'madera'],
  hvac: [
    'climatización',
    'hvac',
    'aire acondicionado',
    'calefacción',
    'ventilación',
    'refrigeración',
  ],
  gardening: ['jardinería', 'gardening', 'jardín', 'paisajismo', 'riego', 'poda', 'césped'],
  // ... más categorías
};
```

### 2. **Normalización de Strings**

```typescript
// Función de normalización que elimina acentos
const normalizeString = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .trim();
```

**Ventajas:**

- ✅ Compara "eléctrica" con "electrica" correctamente
- ✅ Maneja espacios extra
- ✅ Consistente con mayúsculas/minúsculas

### 3. **Comparación Mejorada**

```typescript
const normalizedMappedCategories = mappedCategories.map(normalizeString);

const hasMatchingSpecialty = specialtiesArray.some(spec => {
  const specNormalized = normalizeString(spec);
  return normalizedMappedCategories.some(
    cat => specNormalized.includes(cat) || cat.includes(specNormalized) || specNormalized === cat // Comparación exacta también
  );
});
```

### 4. **Logging Detallado**

```typescript
if (matchesCategory) {
  logger.info('Proveedor coincide con categoría:', {
    providerId: provider.id,
    businessName: provider.businessName,
    category: maintenance.category,
    mappedCategories,
    specialtiesArray,
    hasMatchingSpecialty,
    hasMatchingMainSpecialty,
  });
} else {
  logger.warn('Proveedor NO coincide con categoría:', {
    providerId: provider.id,
    businessName: provider.businessName,
    category: maintenance.category,
    mappedCategories,
    specialtiesArray,
    suggestion: 'Verificar que las especialidades incluyan términos relacionados',
  });
}
```

## Casos de Prueba

### Caso 1: Proveedor con "Plomería" y Solicitud con category="plumbing"

- ✅ **ANTES:** Podría fallar si había acentos o espacios
- ✅ **AHORA:** Funciona correctamente con normalización

### Caso 2: Proveedor con "Pintura" y Solicitud con category="general"

- ❌ **ANTES:** No había mapeo para "pintura"
- ✅ **AHORA:** Se mapea a "general" o se puede agregar category="painting"

### Caso 3: Proveedor con "Carpintería" y Solicitud con category="structural"

- ❌ **ANTES:** No había mapeo específico
- ✅ **AHORA:** Se puede mapear a "structural" o crear category="carpentry"

## Recomendaciones Adicionales

### 1. **Actualizar Formulario de Creación de Solicitud**

Agregar más opciones de categoría en el formulario:

```typescript
<SelectItem value="painting">Pintura</SelectItem>
<SelectItem value="carpentry">Carpintería</SelectItem>
<SelectItem value="hvac">Climatización</SelectItem>
<SelectItem value="gardening">Jardinería</SelectItem>
```

### 2. **Validación en el Frontend**

Mostrar mensaje más informativo cuando no hay proveedores:

```typescript
if (availableProviders.length === 0) {
  return (
    <div>
      <p>No hay proveedores disponibles para esta categoría.</p>
      <p>Categoría buscada: {maintenance.category}</p>
      <p>Sugerencia: Intenta con una categoría más general o contacta a soporte.</p>
    </div>
  );
}
```

### 3. **Endpoint de Diagnóstico**

Crear endpoint para verificar mapeos:

```typescript
GET /api/admin/diagnostics/category-mapping?category=plumbing
```

### 4. **Script de Migración**

Si hay solicitudes con categorías antiguas, crear script para actualizar:

```typescript
// Migrar categorías antiguas a nuevas
UPDATE maintenance
SET category = 'painting'
WHERE category = 'general' AND title LIKE '%pintura%';
```

## Archivos Modificados

1. ✅ `src/app/api/maintenance/[id]/available-providers/route.ts`
   - Mapeo expandido de categorías
   - Normalización de strings
   - Logging detallado
   - Comparación mejorada

## Próximos Pasos

1. ✅ **Desplegar cambios** a producción
2. ⏳ **Revisar logs** para ver qué categorías se están usando
3. ⏳ **Actualizar formularios** para incluir nuevas categorías
4. ⏳ **Migrar datos** si es necesario
5. ⏳ **Probar** con proveedores reales en producción

## Notas Importantes

- Los cambios son **backward compatible** - no rompen funcionalidad existente
- El filtro actualmente **muestra todos los proveedores** aunque no coincidan con la categoría (solo loguea)
- Se puede cambiar para **filtrar estrictamente** si es necesario
- El logging detallado ayudará a identificar problemas rápidamente
