# 🚩 Sistema de Reportes de Conducta de Usuarios

## ✅ Problema Resuelto

Los reportes de usuarios que se enviaban desde el sistema de mensajería **no eran visibles** en los paneles de Administración ni Soporte. Ahora se ha implementado un sistema completo de gestión de reportes.

---

## 📋 ¿Qué Se Implementó?

### 1. **API Endpoint para Gestión de Reportes**

- **Ruta:** `/api/admin/user-reports`
- **Métodos:**
  - `GET`: Obtiene todos los reportes con filtros opcionales
  - `PATCH`: Actualiza el estado de un reporte

**Filtros disponibles:**

- Por estado: `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`
- Por motivo: `spam`, `harassment`, `inappropriate_content`, `scam`, `fake_profile`, `other`
- Paginación automática

**Seguridad:**

- Solo usuarios con rol `ADMIN` o `SUPPORT` pueden acceder
- Validación de tokens JWT
- Logs de auditoría completos

---

### 2. **Página de Administración**

- **Ruta:** `/admin/user-reports`
- **Funcionalidades:**
  - Vista de todos los reportes con información completa
  - Filtros por estado y motivo
  - Modal de detalles con toda la información del reporte
  - Sistema de actualización de estado con notas del admin
  - Avatar y datos del usuario reportado y reportador
  - Fechas de creación y revisión

**Flujo de trabajo:**

1.  **PENDING** → Usuario crea reporte
2.  **REVIEWED** → Admin/Support marca como revisado
3.  **RESOLVED** → Admin/Support resuelve el caso
4.  **DISMISSED** → Admin/Support desestima el reporte

---

### 3. **Página de Soporte**

- **Ruta:** `/support/user-reports`
- **Funcionalidades:** Idénticas a la página de admin
- Permite a soporte gestionar reportes de forma independiente

---

### 4. **Integración en el Sidebar**

- **Admin:** Nueva opción "Reportes de Conducta" después de "Gestión de Usuarios"
- **Support:** Nueva opción "Reportes de Conducta" después de "Tickets"
- Ambas opciones tienen badge rojo "Nuevo" para destacarlas

---

## 🎨 Interfaz de Usuario

### Vista de Lista de Reportes

```
┌──────────────────────────────────────────────────────┐
│ 🚩 Reportes de Conducta                             │
│    X reportes en total                               │
├──────────────────────────────────────────────────────┤
│ Filtros:                                             │
│ [Todos los estados ▼] [Todos los motivos ▼]        │
├──────────────────────────────────────────────────────┤
│ [Avatar] Usuario Reportado                           │
│          usuario@email.com (TENANT)                  │
│                                                      │
│ ⚠️ Spam                                             │
│ "Este usuario me está enviando mensajes..."          │
│                                                      │
│ 👤 Reportado por: Juan Pérez                        │
│ 📅 22 de octubre de 2024                            │
│                                                      │
│ [Ver Detalles] [Marcar Revisado] [Desestimar]      │
└──────────────────────────────────────────────────────┘
```

### Modal de Detalles

```
┌──────────────────────────────────────────────────────┐
│ 🚩 Detalle del Reporte                         [X]  │
├──────────────────────────────────────────────────────┤
│ Usuario Reportado:                                   │
│ [Avatar] Juan Pérez                                  │
│          juan@email.com                              │
│          [TENANT] [Usuario desde 15/01/2024]        │
│                                                      │
│ Motivo del Reporte:                                  │
│ ⚠️ Acoso                                            │
│ "Este usuario me está enviando mensajes..."          │
│                                                      │
│ Reportado Por:                                       │
│ [Avatar] María García                                │
│          maria@email.com                             │
│          Reportado el 22 de octubre de 2024, 14:30  │
│                                                      │
│ Estado:                                              │
│ 🕐 Pendiente                                         │
│                                                      │
│ Notas del Admin:                                     │
│ [Área de texto para agregar notas...]               │
│                                                      │
│ [Cerrar] [Marcar Revisado] [Resolver] [Desestimar] │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Estados del Reporte

| Estado        | Badge                    | Descripción             | Acciones Disponibles              |
| ------------- | ------------------------ | ----------------------- | --------------------------------- |
| **PENDING**   | 🕐 Pendiente (Gris)      | Reporte recién creado   | • Marcar Revisado<br>• Desestimar |
| **REVIEWED**  | 👁️ Revisado (Default)    | Admin/Support lo revisó | • Resolver                        |
| **RESOLVED**  | ✅ Resuelto (Verde)      | Caso resuelto           | N/A                               |
| **DISMISSED** | ❌ Desestimado (Outline) | Reporte desestimado     | N/A                               |

---

## 📊 Motivos de Reporte

| Valor                   | Etiqueta              |
| ----------------------- | --------------------- |
| `spam`                  | Spam                  |
| `harassment`            | Acoso                 |
| `inappropriate_content` | Contenido inapropiado |
| `scam`                  | Estafa                |
| `fake_profile`          | Perfil falso          |
| `other`                 | Otro                  |

---

## 🔐 Seguridad y Permisos

### Control de Acceso

- ✅ Solo `ADMIN` y `SUPPORT` pueden ver y gestionar reportes
- ✅ Validación de tokens JWT en cada request
- ✅ Logs de auditoría para todas las acciones

### Datos Almacenados

```typescript
{
  id: string;
  reporterId: string; // Quien reporta
  reportedUserId: string; // Quien es reportado
  reason: string; // Motivo del reporte
  description: string; // Descripción detallada
  status: string; // Estado actual
  adminNotes: string; // Notas del admin/support
  reviewedBy: string; // ID del admin que revisó
  reviewedAt: Date; // Fecha de revisión
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📍 Rutas Implementadas

### Admin

```
/admin/user-reports        → Vista de reportes de conducta
```

### Support

```
/support/user-reports      → Vista de reportes de conducta
```

### API

```
GET    /api/admin/user-reports              → Obtener reportes
GET    /api/admin/user-reports?status=...   → Filtrar por estado
GET    /api/admin/user-reports?reason=...   → Filtrar por motivo
PATCH  /api/admin/user-reports              → Actualizar estado
```

---

## 🧪 Cómo Probar el Sistema

### 1. **Crear un Reporte**

- Ingresa como cualquier usuario (TENANT, OWNER, etc.)
- Ve a Mensajes
- Abre un chat con otro usuario
- Haz clic en "Reportar usuario"
- Selecciona un motivo y escribe una descripción
- Envía el reporte

### 2. **Ver Reportes como Admin**

- Ingresa como ADMIN
- Ve al menú lateral
- Haz clic en "Reportes de Conducta" (tiene badge rojo "Nuevo")
- Verás todos los reportes creados

### 3. **Gestionar un Reporte**

- Haz clic en "Ver Detalles" en cualquier reporte
- Agrega notas en el campo de texto (opcional)
- Haz clic en "Marcar Revisado" para cambiar el estado
- Luego puedes "Resolver" el caso o "Desestimar" si no procede

### 4. **Probar Filtros**

- Usa los selectores en la parte superior
- Filtra por estado: Pendiente, Revisado, Resuelto, Desestimado
- Filtra por motivo: Spam, Acoso, etc.

### 5. **Ver como Soporte**

- Ingresa como SUPPORT
- Verás la misma interfaz en `/support/user-reports`

---

## ✅ Checklist de Verificación

- [x] API endpoint `/api/admin/user-reports` creado
- [x] Página `/admin/user-reports` implementada
- [x] Página `/support/user-reports` implementada
- [x] Menú agregado al sidebar de admin
- [x] Menú agregado al sidebar de support
- [x] Filtros de estado funcionando
- [x] Filtros de motivo funcionando
- [x] Modal de detalles funcionando
- [x] Actualización de estado funcionando
- [x] Notas del admin guardándose correctamente
- [x] Seguridad y permisos verificados
- [x] Integración con notificaciones existente

---

## 🎯 Próximos Pasos (Opcionales)

1. **Estadísticas de Reportes:**
   - Agregar dashboard con gráficas de reportes por motivo
   - Mostrar tendencias de usuarios más reportados

2. **Acciones Automáticas:**
   - Suspender usuario automáticamente después de X reportes
   - Enviar email a usuarios reportados
   - Notificar al reportador cuando se resuelva su reporte

3. **Historial de Reportes:**
   - Mostrar historial completo de reportes de un usuario
   - Botón para ver "Todos los reportes de este usuario"

4. **Exportación:**
   - Exportar reportes a PDF o CSV para auditorías

---

## 📝 Notas Importantes

- ⚠️ El código usa `(db as any).userReport` debido a que la migración ya fue aplicada en producción pero el cliente Prisma local puede no estar actualizado
- ✅ La tabla `user_reports` ya existe en producción (migración aplicada)
- ✅ Los reportes creados desde la mensajería ya están llegando correctamente
- ✅ Las notificaciones a admin/support siguen funcionando como antes

---

## 🚀 Estado del Sistema

| Componente     | Estado          | Observaciones                 |
| -------------- | --------------- | ----------------------------- |
| API Endpoint   | ✅ Funcional    | GET y PATCH implementados     |
| Página Admin   | ✅ Funcional    | Interfaz completa con filtros |
| Página Support | ✅ Funcional    | Idéntica a admin              |
| Menú Sidebar   | ✅ Funcional    | Badge "Nuevo" destacado       |
| Seguridad      | ✅ Implementada | Solo admin/support            |
| Filtros        | ✅ Funcionales  | Estado y motivo               |
| Modal Detalles | ✅ Funcional    | Información completa          |
| Actualización  | ✅ Funcional    | Estados y notas               |

---

## 📸 Capturas de Pantalla

**ANTES:** ❌ Los reportes no aparecían en ningún lugar

**DESPUÉS:** ✅ Los reportes son visibles y gestionables desde:

- `/admin/user-reports`
- `/support/user-reports`

---

## 🎉 Resumen

Se ha implementado un **sistema completo** de gestión de reportes de conducta de usuarios que permite a administradores y soporte:

- Ver todos los reportes
- Filtrar por estado y motivo
- Revisar detalles completos
- Actualizar estados y agregar notas
- Gestionar el flujo completo desde la creación hasta la resolución

**¡El sistema está listo para usar en producción!** 🚀
