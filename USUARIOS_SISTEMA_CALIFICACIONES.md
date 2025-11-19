# Usuarios del Sistema Unificado de Calificaciones

## Roles del Sistema

El sistema Rent360 tiene **8 roles principales** que interactúan con el sistema de calificaciones:

1. **ADMIN** - Administrador del sistema
2. **OWNER** - Propietario de propiedades
3. **TENANT** - Inquilino/Arrendatario
4. **BROKER** - Corredor de propiedades
5. **RUNNER** - Corredor de visitas (muestra propiedades)
6. **PROVIDER** - Proveedor de servicios generales
7. **MAINTENANCE** - Proveedor de servicios de mantenimiento
8. **SUPPORT** - Soporte técnico (no califica ni es calificado)

---

## Matriz de Calificaciones: ¿Quién Califica a Quién?

### ✅ Calificaciones Permitidas en el Sistema Unificado

| Quien Califica → | OWNER              | TENANT             | BROKER             | RUNNER      | PROVIDER      | MAINTENANCE        |
| ---------------- | ------------------ | ------------------ | ------------------ | ----------- | ------------- | ------------------ |
| **OWNER**        | ❌                 | ✅ (Contrato)      | ✅ (Servicio)      | ✅ (Visita) | ✅ (Servicio) | ✅ (Mantenimiento) |
| **TENANT**       | ✅ (Contrato)      | ❌                 | ✅ (Servicio)      | ✅ (Visita) | ✅ (Servicio) | ✅ (Mantenimiento) |
| **BROKER**       | ✅ (Servicio)      | ✅ (Servicio)      | ❌                 | ✅ (Visita) | ✅ (Servicio) | ✅ (Mantenimiento) |
| **RUNNER**       | ✅ (Visita)        | ✅ (Visita)        | ✅ (Visita)        | ❌          | ❌            | ❌                 |
| **PROVIDER**     | ✅ (Servicio)      | ✅ (Servicio)      | ✅ (Servicio)      | ❌          | ❌            | ❌                 |
| **MAINTENANCE**  | ✅ (Mantenimiento) | ✅ (Mantenimiento) | ✅ (Mantenimiento) | ❌          | ❌            | ❌                 |

**Leyenda:**

- ✅ = Calificación permitida
- ❌ = No puede calificar (o no aplica)

---

## Detalle por Rol

### 1. **OWNER (Propietario)**

#### Puede Calificar a:

- ✅ **TENANT** - Por contrato completado (`CONTRACT`)
- ✅ **BROKER** - Por servicios de corretaje (`SERVICE`)
- ✅ **RUNNER** - Por visita a propiedad (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por servicios prestados (`SERVICE`)
- ✅ **MAINTENANCE** - Por trabajos de mantenimiento (`MAINTENANCE`)

#### Puede Ser Calificado por:

- ✅ **TENANT** - Por contrato completado (`CONTRACT`)
- ✅ **RUNNER** - Por experiencia en visita (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por colaboración en servicios (`SERVICE`)
- ✅ **MAINTENANCE** - Por colaboración en mantenimiento (`MAINTENANCE`)

**Contextos de Calificación:**

- `CONTRACT` - Al finalizar un contrato de arriendo
- `SERVICE` - Al recibir servicios de broker o provider
- `PROPERTY_VISIT` - Después de una visita a su propiedad
- `MAINTENANCE` - Al completar trabajos de mantenimiento

---

### 2. **TENANT (Inquilino)**

#### Puede Calificar a:

- ✅ **OWNER** - Por contrato completado (`CONTRACT`)
- ✅ **BROKER** - Por servicios de corretaje (`SERVICE`)
- ✅ **RUNNER** - Por visita a propiedad (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por servicios prestados (`SERVICE`)
- ✅ **MAINTENANCE** - Por trabajos de mantenimiento (`MAINTENANCE`)

#### Puede Ser Calificado por:

- ✅ **OWNER** - Por contrato completado (`CONTRACT`)
- ✅ **RUNNER** - Por experiencia en visita (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por colaboración en servicios (`SERVICE`)
- ✅ **MAINTENANCE** - Por colaboración en mantenimiento (`MAINTENANCE`)

**Contextos de Calificación:**

- `CONTRACT` - Al finalizar un contrato de arriendo
- `SERVICE` - Al recibir servicios de broker o provider
- `PROPERTY_VISIT` - Después de una visita a propiedad
- `MAINTENANCE` - Al completar trabajos de mantenimiento

---

### 3. **BROKER (Corredor)**

#### Puede Calificar a:

- ✅ **OWNER** - Por servicios de corretaje (`SERVICE`)
- ✅ **TENANT** - Por servicios de corretaje (`SERVICE`)
- ✅ **RUNNER** - Por visita a propiedad (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por servicios prestados (`SERVICE`)
- ✅ **MAINTENANCE** - Por trabajos de mantenimiento (`MAINTENANCE`)

#### Puede Ser Calificado por:

- ✅ **OWNER** - Por servicios de corretaje (`SERVICE`)
- ✅ **TENANT** - Por servicios de corretaje (`SERVICE`)
- ✅ **RUNNER** - Por experiencia en visita (`PROPERTY_VISIT`)
- ✅ **PROVIDER** - Por colaboración en servicios (`SERVICE`)
- ✅ **MAINTENANCE** - Por colaboración en mantenimiento (`MAINTENANCE`)

**Contextos de Calificación:**

- `SERVICE` - Al prestar o recibir servicios de corretaje
- `PROPERTY_VISIT` - Después de una visita coordinada
- `MAINTENANCE` - Al coordinar trabajos de mantenimiento

---

### 4. **RUNNER (Corredor de Visitas)**

#### Puede Calificar a:

- ✅ **OWNER** - Por experiencia en visita (`PROPERTY_VISIT`)
- ✅ **TENANT** - Por experiencia en visita (`PROPERTY_VISIT`)
- ✅ **BROKER** - Por experiencia en visita (`PROPERTY_VISIT`)

#### Puede Ser Calificado por:

- ✅ **OWNER** - Por visita a propiedad (`PROPERTY_VISIT`)
- ✅ **TENANT** - Por visita a propiedad (`PROPERTY_VISIT`)
- ✅ **BROKER** - Por visita a propiedad (`PROPERTY_VISIT`)

**Contextos de Calificación:**

- `PROPERTY_VISIT` - Único contexto para runners (visitas a propiedades)

**Nota Especial:**

- Los runners son calificados usando el sistema `RunnerRating` actual, que debe migrarse a `UserRating` con contexto `PROPERTY_VISIT`
- Los runners pueden calificar a owners después de visitas (ya implementado en `/api/visit/rate-owner`)

---

### 5. **PROVIDER (Proveedor de Servicios)**

#### Puede Calificar a:

- ✅ **OWNER** - Por colaboración en servicios (`SERVICE`)
- ✅ **TENANT** - Por colaboración en servicios (`SERVICE`)
- ✅ **BROKER** - Por colaboración en servicios (`SERVICE`)

#### Puede Ser Calificado por:

- ✅ **OWNER** - Por servicios prestados (`SERVICE`)
- ✅ **TENANT** - Por servicios prestados (`SERVICE`)
- ✅ **BROKER** - Por servicios prestados (`SERVICE`)

**Contextos de Calificación:**

- `SERVICE` - Al prestar o recibir servicios generales

**Nota Especial:**

- Actualmente usa `RatingService` (en memoria) que debe migrarse a `UserRating`

---

### 6. **MAINTENANCE (Proveedor de Mantenimiento)**

#### Puede Calificar a:

- ✅ **OWNER** - Por colaboración en mantenimiento (`MAINTENANCE`)
- ✅ **TENANT** - Por colaboración en mantenimiento (`MAINTENANCE`)
- ✅ **BROKER** - Por colaboración en mantenimiento (`MAINTENANCE`)

#### Puede Ser Calificado por:

- ✅ **OWNER** - Por trabajos de mantenimiento (`MAINTENANCE`)
- ✅ **TENANT** - Por trabajos de mantenimiento (`MAINTENANCE`)
- ✅ **BROKER** - Por trabajos de mantenimiento (`MAINTENANCE`)

**Contextos de Calificación:**

- `MAINTENANCE` - Al completar trabajos de mantenimiento

**Nota Especial:**

- Actualmente actualiza estadísticas en `MaintenanceProvider` cuando se usa `UserRatingService` con contexto `MAINTENANCE`
- Debe mantener esta funcionalidad en el sistema unificado

---

### 7. **ADMIN (Administrador)**

#### Puede:

- ✅ **Ver todas las calificaciones** (sin restricciones)
- ✅ **Moderar calificaciones** (marcar como verificadas, ocultar, eliminar)
- ✅ **Generar reportes** de calificaciones
- ❌ **No califica ni es calificado** (rol administrativo)

---

### 8. **SUPPORT (Soporte)**

#### Puede:

- ✅ **Ver calificaciones** relacionadas con tickets de soporte
- ✅ **Ayudar a resolver disputas** sobre calificaciones
- ❌ **No califica ni es calificado** (rol de soporte)

---

## Contextos de Calificación (RatingContextType)

El sistema unificado usa los siguientes contextos:

### 1. **CONTRACT**

- **Quién:** OWNER ↔ TENANT
- **Cuándo:** Al finalizar un contrato de arriendo
- **Bidireccional:** Sí (ambos pueden calificarse)

### 2. **SERVICE**

- **Quién:** OWNER, TENANT, BROKER ↔ PROVIDER
- **Cuándo:** Al completar servicios generales
- **Bidireccional:** Sí

### 3. **MAINTENANCE**

- **Quién:** OWNER, TENANT, BROKER ↔ MAINTENANCE
- **Cuándo:** Al completar trabajos de mantenimiento
- **Bidireccional:** Sí
- **Especial:** Actualiza estadísticas en `MaintenanceProvider`

### 4. **PROPERTY_VISIT**

- **Quién:** OWNER, TENANT, BROKER ↔ RUNNER
- **Cuándo:** Después de una visita a propiedad
- **Bidireccional:** Sí
- **Especial:** Actualmente usa `RunnerRating`, debe migrarse

### 5. **GENERAL**

- **Quién:** Cualquier usuario
- **Cuándo:** Calificaciones generales sin contexto específico
- **Bidireccional:** Sí

### 6. **OTHER**

- **Quién:** Cualquier usuario
- **Cuándo:** Otros contextos no categorizados
- **Bidireccional:** Sí

---

## Reglas de Negocio del Sistema Unificado

### ✅ Reglas de Validación

1. **No Auto-Calificación**
   - Un usuario NO puede calificarse a sí mismo
   - Validación: `fromUserId !== toUserId`

2. **Unicidad por Contexto**
   - Un usuario solo puede calificar una vez por contexto específico
   - Validación: `fromUserId + toUserId + contextType + contextId` debe ser único

3. **Validación de Usuarios**
   - Ambos usuarios (quien califica y quien es calificado) deben existir
   - Ambos usuarios deben estar activos (`isActive = true`)

4. **Validación de Contexto**
   - El `contextId` debe referenciar un recurso válido (contrato, servicio, visita, etc.)
   - El `contextType` debe ser válido según el enum

### ✅ Reglas de Permisos

1. **Permisos por Rol**
   - Cada rol solo puede calificar según la matriz definida arriba
   - Los runners solo califican/reciben calificaciones en contexto `PROPERTY_VISIT`

2. **Permisos por Contexto**
   - Solo usuarios relacionados con el contexto pueden calificar
   - Ejemplo: Solo el tenant/owner de una visita puede calificar al runner

3. **Permisos de Visualización**
   - Las calificaciones públicas (`isPublic = true`) son visibles para todos
   - Las calificaciones privadas solo son visibles para el autor y el receptor
   - Los admins pueden ver todas las calificaciones

### ✅ Actualización de Estadísticas

1. **MaintenanceProvider**
   - Se actualiza automáticamente cuando:
     - Se crea un `UserRating` con `contextType = 'MAINTENANCE'` y `toUser.role = 'MAINTENANCE'`
   - Campos actualizados:
     - `rating` (promedio)
     - `totalRatings` (contador)

2. **Runner Statistics** (Futuro)
   - Debe actualizarse cuando se crea un `UserRating` con `contextType = 'PROPERTY_VISIT'` y `toUser.role = 'RUNNER'`

3. **Provider Statistics** (Futuro)
   - Debe actualizarse cuando se crea un `UserRating` con `contextType = 'SERVICE'` y `toUser.role = 'PROVIDER'`

---

## Migración de Sistemas Actuales

### Sistema Actual → Sistema Unificado

| Sistema Actual            | Migrar a     | Contexto                  | Notas                                   |
| ------------------------- | ------------ | ------------------------- | --------------------------------------- |
| `RunnerRating`            | `UserRating` | `PROPERTY_VISIT`          | Mantener datos históricos               |
| `RatingService` (memoria) | `UserRating` | `SERVICE` o `MAINTENANCE` | ⚠️ Datos se pierden, solo migrar lógica |
| `UserRating` (existente)  | `UserRating` | Todos                     | Ya está en el sistema correcto          |

---

## Resumen de Usuarios del Sistema Unificado

### Total de Usuarios que Pueden Calificar: **6 roles**

1. OWNER
2. TENANT
3. BROKER
4. RUNNER
5. PROVIDER
6. MAINTENANCE

### Total de Usuarios que Pueden Ser Calificados: **6 roles**

1. OWNER
2. TENANT
3. BROKER
4. RUNNER
5. PROVIDER
6. MAINTENANCE

### Roles que NO Participan en Calificaciones: **2 roles**

1. ADMIN (solo moderación)
2. SUPPORT (solo soporte)

### Total de Interacciones Posibles: **30 combinaciones**

- 6 roles que califican × 5 roles que pueden ser calificados (excluyendo auto-calificación)
- Cada interacción puede tener múltiples contextos

---

## Campos de Calificación Estándar

El sistema unificado usará estos campos para todos los roles:

### Campos Obligatorios

- `overallRating` (1-5) - Calificación general

### Campos Opcionales

- `communicationRating` (1-5) - Comunicación
- `reliabilityRating` (1-5) - Confiabilidad
- `professionalismRating` (1-5) - Profesionalismo
- `qualityRating` (1-5) - Calidad del servicio/trabajo
- `punctualityRating` (1-5) - Puntualidad

### Campos Adicionales

- `comment` (String) - Comentario textual
- `positiveFeedback` (String[]) - Aspectos positivos
- `improvementAreas` (String[]) - Áreas de mejora
- `isAnonymous` (Boolean) - Si es anónima
- `isPublic` (Boolean) - Si es pública
- `isVerified` (Boolean) - Si está verificada por sistema

---

## Conclusión

El sistema unificado de calificaciones será usado por **6 roles principales** que pueden tanto calificar como ser calificados, con **4 contextos principales** de interacción:

1. **CONTRACT** - Entre OWNER y TENANT
2. **SERVICE** - Entre OWNER/TENANT/BROKER y PROVIDER
3. **MAINTENANCE** - Entre OWNER/TENANT/BROKER y MAINTENANCE
4. **PROPERTY_VISIT** - Entre OWNER/TENANT/BROKER y RUNNER

Todos estos usuarios y contextos deben ser soportados por el sistema unificado basado en `UserRating`.
