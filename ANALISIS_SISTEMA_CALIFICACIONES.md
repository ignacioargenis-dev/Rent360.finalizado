# Análisis del Sistema de Calificaciones - Problemas Detectados

## Resumen Ejecutivo

Se han identificado **múltiples inconsistencias críticas** y **pérdida de datos** en el sistema de calificaciones de Rent360. El sistema actual utiliza **3 mecanismos diferentes** que no están sincronizados entre sí, lo que resulta en:

- **Pérdida de datos** al reiniciar el servidor
- **Inconsistencias** en cómo se almacenan y recuperan las calificaciones
- **Duplicación** de lógica y código
- **Falta de sincronización** entre sistemas

---

## Problemas Críticos Identificados

### 🔴 PROBLEMA 1: Sistema de Calificaciones en Memoria (PÉRDIDA DE DATOS)

**Ubicación:** `src/lib/ratings/rating-service.ts`

**Descripción:**
El servicio `RatingService` almacena todas las calificaciones en memoria usando `Map`:

```typescript
private ratings: Map<string, ProviderRating[]> = new Map();
private summaries: Map<string, ProviderRatingSummary> = new Map();
```

**Impacto:**

- ❌ **Todas las calificaciones se pierden al reiniciar el servidor**
- ❌ Las calificaciones creadas con este servicio nunca se persisten en la base de datos
- ❌ No hay sincronización con otros sistemas de calificaciones

**Evidencia:**

- `src/app/client/rate-service/[jobId]/page.tsx` línea 193: Usa `ratingService.createRating()` que guarda en memoria
- `src/app/rate/provider/[providerId]/page.tsx` línea 147: Usa `/api/ratings` que sí persiste, pero hay confusión sobre qué sistema usar

---

### 🔴 PROBLEMA 2: Sistemas de Calificaciones Duplicados

El sistema tiene **3 mecanismos diferentes** para manejar calificaciones:

#### A) `RunnerRating` (Tabla separada)

- **Modelo:** `prisma/schema.prisma` línea 1600-1633
- **Servicio:** `src/lib/runner-rating-service.ts`
- **API:** `/api/visit/rate`
- **Uso:** Solo para calificar runners después de visitas
- **Campos:** `punctualityRating`, `professionalismRating`, `communicationRating`, `propertyKnowledgeRating`

#### B) `UserRating` (Sistema universal)

- **Modelo:** `prisma/schema.prisma` línea 1637-1684
- **Servicio:** `src/lib/user-rating-service.ts`
- **API:** `/api/ratings`
- **Uso:** Calificaciones bidireccionales entre usuarios
- **Campos:** `communicationRating`, `reliabilityRating`, `professionalismRating`, `qualityRating`, `punctualityRating`

#### C) `RatingService` (En memoria - NO persiste)

- **Servicio:** `src/lib/ratings/rating-service.ts`
- **Uso:** Calificaciones de proveedores (pero se pierden)
- **Campos:** Enum `RatingType` con `CLEANLINESS`, `QUALITY_OF_WORK`, etc.

**Problema:** No hay claridad sobre cuándo usar cada sistema, y no están sincronizados.

---

### 🔴 PROBLEMA 3: Inconsistencias en Campos de Calificación

Los diferentes sistemas usan nombres de campos diferentes para conceptos similares:

| Concepto        | RunnerRating              | UserRating              | RatingService        |
| --------------- | ------------------------- | ----------------------- | -------------------- |
| Puntualidad     | `punctualityRating`       | `punctualityRating`     | `PUNCTUALITY`        |
| Profesionalismo | `professionalismRating`   | `professionalismRating` | `PROFESSIONALISM`    |
| Comunicación    | `communicationRating`     | `communicationRating`   | `COMMUNICATION`      |
| Conocimiento    | `propertyKnowledgeRating` | ❌ No existe            | `PROPERTY_KNOWLEDGE` |
| Calidad         | ❌ No existe              | `qualityRating`         | `QUALITY_OF_WORK`    |
| Confiabilidad   | ❌ No existe              | `reliabilityRating`     | ❌ No existe         |
| Limpieza        | ❌ No existe              | ❌ No existe            | `CLEANLINESS`        |

**Impacto:**

- Dificulta la migración de datos entre sistemas
- Genera confusión al mostrar calificaciones
- No se pueden comparar calificaciones de diferentes fuentes

---

### 🔴 PROBLEMA 4: Actualización de Estadísticas Inconsistente

**Problema:** Solo se actualizan las estadísticas de `MaintenanceProvider` cuando se usa `UserRatingService` con contexto `MAINTENANCE`:

```typescript
// src/lib/user-rating-service.ts línea 195-227
if (ratingData.contextType === 'MAINTENANCE' && toUser.role === 'MAINTENANCE') {
  // Actualiza estadísticas
}
```

**Impacto:**

- ❌ Si se usa `RatingService` (en memoria), las estadísticas NO se actualizan
- ❌ Si se usa `RunnerRatingService`, las estadísticas NO se actualizan
- ❌ No hay actualización cuando se elimina o modifica una calificación

---

### 🔴 PROBLEMA 5: Falta de Validación de Duplicados entre Sistemas

**Problema:** Cada sistema valida duplicados independientemente:

- `RunnerRating`: Valida por `visitId_clientId` (único)
- `UserRating`: Valida por `fromUserId_toUserId_contextType_contextId` (único)
- `RatingService`: Valida en memoria (se pierde al reiniciar)

**Impacto:**

- Un usuario podría calificar el mismo servicio múltiples veces usando diferentes sistemas
- No hay validación cruzada entre sistemas

---

### 🔴 PROBLEMA 6: Inconsistencia en APIs de Calificación

**Problema:** Diferentes endpoints usan diferentes servicios:

| Endpoint                       | Servicio Usado            | Persiste en BD | Actualiza Estadísticas   |
| ------------------------------ | ------------------------- | -------------- | ------------------------ |
| `/api/ratings`                 | `UserRatingService`       | ✅ Sí          | ✅ Solo para MAINTENANCE |
| `/api/visit/rate`              | `RunnerRatingService`     | ✅ Sí          | ❌ No                    |
| `/api/visit/rate-owner`        | `UserRatingService`       | ✅ Sí          | ❌ No                    |
| `ratingService.createRating()` | `RatingService` (memoria) | ❌ No          | ❌ No                    |

**Impacto:**

- Confusión sobre qué endpoint usar
- Pérdida de datos cuando se usa el servicio en memoria
- Estadísticas inconsistentes

---

### 🟡 PROBLEMA 7: Mapeo Incorrecto de Campos en Frontend

**Ubicación:** `src/app/client/rate-service/[jobId]/page.tsx` línea 178-187

**Problema:** El frontend mapea campos incorrectamente:

```typescript
ratings: {
  overall: rating.overall,
  punctuality: rating.punctuality,
  professionalism: rating.professionalism,
  communication: rating.communication,
  property_knowledge: rating.quality, // ❌ Mapeo incorrecto
  cleanliness: rating.quality,        // ❌ Mismo valor duplicado
  quality_of_work: rating.quality,     // ❌ Mismo valor duplicado
  value: rating.value,                // ❌ Campo no existe en RatingType
}
```

**Impacto:**

- Datos incorrectos almacenados
- Pérdida de información del usuario

---

### 🟡 PROBLEMA 8: Falta de Sincronización con RunnerRating

**Problema:** Cuando un tenant/owner califica un runner usando `/api/visit/rate`, se crea un `RunnerRating`, pero:

- ❌ No se crea un `UserRating` correspondiente
- ❌ No se puede ver en el sistema universal de calificaciones
- ❌ Las calificaciones de runners están aisladas del resto del sistema

**Impacto:**

- Imposible tener una vista unificada de todas las calificaciones
- Duplicación de datos

---

### 🟡 PROBLEMA 9: Ranking y Estadísticas No Actualizados

**Problema:** Los rankings y estadísticas se calculan solo cuando se solicitan, pero:

- `RunnerRatingService.calculateRunnerRanking()` solo considera `RunnerRating`
- `UserRatingService.getUserRatingSummary()` solo considera `UserRating`
- No hay un sistema unificado que combine ambos

**Impacto:**

- Rankings incompletos
- Estadísticas fragmentadas

---

## Recomendaciones de Solución

### 1. **Eliminar RatingService en Memoria**

- Migrar todas las calificaciones a `UserRating` o `RunnerRating`
- Eliminar `src/lib/ratings/rating-service.ts`
- Actualizar todos los componentes que lo usan

### 2. **Unificar Sistema de Calificaciones**

- Usar `UserRating` como sistema principal
- Migrar `RunnerRating` a `UserRating` con contexto `PROPERTY_VISIT`
- Mantener `RunnerRating` solo para compatibilidad temporal

### 3. **Estandarizar Campos**

- Definir un conjunto estándar de campos de calificación
- Crear mapeo entre sistemas antiguos y nuevos
- Actualizar esquema de base de datos

### 4. **Sincronización Automática**

- Cuando se crea un `RunnerRating`, crear también un `UserRating`
- Actualizar estadísticas automáticamente en todos los casos
- Implementar triggers o eventos para mantener consistencia

### 5. **Validación Unificada**

- Crear un servicio centralizado de validación
- Validar duplicados entre todos los sistemas
- Prevenir calificaciones duplicadas

### 6. **Migración de Datos**

- Script para migrar calificaciones de `RunnerRating` a `UserRating`
- Backup de datos antes de migración
- Validación post-migración

---

## Archivos Afectados

### Servicios

- `src/lib/ratings/rating-service.ts` - **ELIMINAR** (pérdida de datos)
- `src/lib/user-rating-service.ts` - Mejorar y extender
- `src/lib/runner-rating-service.ts` - Migrar a UserRating

### APIs

- `src/app/api/ratings/route.ts` - ✅ Correcto
- `src/app/api/visit/rate/route.ts` - ⚠️ Debe crear también UserRating
- `src/app/api/visit/rate-owner/route.ts` - ✅ Correcto

### Frontend

- `src/app/client/rate-service/[jobId]/page.tsx` - Corregir mapeo de campos
- `src/app/rate/provider/[providerId]/page.tsx` - Verificar que use API correcta

### Modelos

- `prisma/schema.prisma` - Considerar deprecar RunnerRating a largo plazo

---

## Prioridad de Corrección

1. **CRÍTICO:** Eliminar `RatingService` en memoria (pérdida de datos)
2. **ALTO:** Unificar sistemas de calificaciones
3. **ALTO:** Corregir actualización de estadísticas
4. **MEDIO:** Estandarizar campos
5. **MEDIO:** Sincronización automática
6. **BAJO:** Migración de datos históricos

---

## Conclusión

El sistema de calificaciones actual tiene **problemas críticos de pérdida de datos** y **múltiples inconsistencias** que afectan la integridad y confiabilidad del sistema. Se requiere una **refactorización urgente** para unificar los sistemas y garantizar la persistencia correcta de todas las calificaciones.
