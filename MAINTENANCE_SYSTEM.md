# Sistema de Mantenimiento y Prestadores de Servicios - Rent360

## 📋 Resumen Ejecutivo

El sistema de mantenimiento de Rent360 permite a los **inquilinos** solicitar servicios de mantenimiento, a los **propietarios** gestionar estas solicitudes, y a los **administradores** gestionar una red de prestadores de servicios profesionales. El sistema incluye asignación automática, seguimiento de trabajos, calificaciones y pagos.

## 🔄 Flujo del Sistema

### 1. **Solicitud de Mantenimiento (Inquilino)**
```
Inquilino → Solicita mantenimiento → Sistema crea registro → Notifica a propietario
```

### 2. **Gestión de Solicitud (Propietario/Broker)**
```
Propietario revisa → Asigna prestador → Aprueba costo → Trabajo comienza
```

### 3. **Ejecución del Trabajo (Prestador de Servicios)**
```
Prestador recibe asignación → Ejecuta trabajo → Reporta completado → Recibe pago
```

### 4. **Evaluación y Cierre (Inquilino)**
```
Inquilino evalúa trabajo → Sistema actualiza calificaciones → Cierra solicitud
```

## 🏗️ Arquitectura del Sistema

### Base de Datos

#### Modelo `Maintenance`
```prisma
model Maintenance {
  id             String           @id @default(cuid())
  propertyId     String
  title          String
  description    String
  category       String
  priority       MaintenancePriority @default(MEDIUM)
  status         MaintenanceStatus   @default(OPEN)
  estimatedCost  Float?
  actualCost     Float?
  requestedBy    String
  assignedTo     String?
  contractorId   String?          // Relación con prestador
  scheduledDate  DateTime?
  completedDate  DateTime?
  rating         Int?             // Calificación del trabajo
  feedback       String?          // Comentarios del cliente
  images         String?          // JSON array de URLs
  notes          String?          // Notas adicionales
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  // Relaciones
  property       Property         @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  contractor     Contractor?      @relation(fields: [contractorId], references: [id], onDelete: SetNull)
}
```

#### Modelo `Contractor` (Prestador de Servicios)
```prisma
model Contractor {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  phone           String
  specialty       String   // Especialidad principal
  specialties     String   // JSON array de especialidades
  rating          Float    @default(0)
  totalRatings    Int      @default(0)
  completedJobs   Int      @default(0)
  totalEarnings   Float    @default(0)
  status          ContractorStatus @default(AVAILABLE)
  verified        Boolean  @default(false)
  responseTime    Float    @default(0) // Tiempo promedio de respuesta
  hourlyRate      Float?   // Tarifa por hora
  address         String?
  city            String?
  region          String?
  description     String?
  profileImage    String?
  documents       String?  // JSON array de documentos
  joinDate        DateTime @default(now())
  lastActive      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relaciones
  maintenanceJobs Maintenance[]
}
```

### APIs Implementadas

#### 1. **Gestión de Prestadores de Servicios**
- `GET /api/contractors` - Listar prestadores con filtros
- `POST /api/contractors` - Crear nuevo prestador
- `GET /api/contractors/[id]` - Obtener prestador específico
- `PUT /api/contractors/[id]` - Actualizar prestador
- `DELETE /api/contractors/[id]` - Eliminar prestador

#### 2. **Gestión de Solicitudes de Mantenimiento**
- `GET /api/maintenance` - Listar solicitudes con filtros
- `POST /api/maintenance` - Crear nueva solicitud
- `GET /api/maintenance/[id]` - Obtener solicitud específica
- `PUT /api/maintenance/[id]` - Actualizar solicitud
- `DELETE /api/maintenance/[id]` - Eliminar solicitud

## 👥 Roles y Permisos

### **Inquilino**
- ✅ Crear solicitudes de mantenimiento
- ✅ Ver sus propias solicitudes
- ✅ Calificar trabajos completados
- ✅ Agregar comentarios y feedback
- ❌ Asignar prestadores de servicios
- ❌ Ver costos detallados

### **Propietario**
- ✅ Ver solicitudes de sus propiedades
- ✅ Asignar prestadores de servicios
- ✅ Aprobar costos estimados
- ✅ Ver reportes de mantenimiento
- ✅ Gestionar programación de trabajos
- ❌ Crear solicitudes

### **Broker**
- ✅ Ver solicitudes de propiedades que maneja
- ✅ Asignar prestadores de servicios
- ✅ Coordinar entre inquilinos y propietarios
- ✅ Ver reportes de mantenimiento
- ❌ Crear solicitudes

### **Administrador**
- ✅ Gestión completa de prestadores de servicios
- ✅ Ver todas las solicitudes del sistema
- ✅ Gestionar calificaciones y verificación
- ✅ Configurar categorías y especialidades
- ✅ Generar reportes completos

## 🎯 Funcionalidades Principales

### **Para Inquilinos**

#### 1. **Crear Solicitud de Mantenimiento**
```typescript
// Ejemplo de solicitud
{
  propertyId: "prop_123",
  title: "Fuga en grifo de cocina",
  description: "El grifo de la cocina tiene una fuga constante que necesita reparación urgente",
  category: "Plomería",
  priority: "HIGH",
  images: ["url1", "url2"]
}
```

#### 2. **Seguimiento de Solicitudes**
- Estado en tiempo real
- Notificaciones de actualizaciones
- Comunicación con prestador asignado

#### 3. **Evaluación de Trabajos**
- Calificación de 1-5 estrellas
- Comentarios detallados
- Feedback sobre calidad del servicio

### **Para Propietarios/Brokers**

#### 1. **Panel de Gestión**
- Vista consolidada de todas las solicitudes
- Filtros por estado, prioridad, categoría
- Estadísticas de costos y tiempos

#### 2. **Asignación de Prestadores**
```typescript
// Asignar prestador a solicitud
{
  contractorId: "contractor_456",
  estimatedCost: 25000,
  scheduledDate: "2024-01-20T10:00:00Z",
  notes: "Prestador especializado en plomería"
}
```

#### 3. **Aprobación de Costos**
- Revisión de estimaciones
- Aprobación de trabajos urgentes
- Control de presupuesto

### **Para Administradores**

#### 1. **Gestión de Prestadores de Servicios**
- Crear y editar perfiles
- Verificar credenciales y documentos
- Gestionar especialidades y tarifas

#### 2. **Sistema de Calificaciones**
- Monitoreo de calificaciones promedio
- Identificación de prestadores problemáticos
- Incentivos para prestadores destacados

#### 3. **Reportes y Analytics**
- Tiempos promedio de resolución
- Costos por categoría
- Satisfacción del cliente
- Utilización de prestadores

## 📊 Categorías de Mantenimiento

### **Categorías Principales**
1. **Plomería** - Fugas, desagües, grifos, calefont
2. **Electricidad** - Instalaciones, interruptores, iluminación
3. **HVAC** - Aire acondicionado, calefacción, ventilación
4. **Estructural** - Techos, paredes, cimientos
5. **Electrodomésticos** - Refrigerador, lavadora, secadora
6. **Carpintería** - Puertas, ventanas, muebles
7. **Pintura** - Interior, exterior, acabados
8. **Jardinería** - Mantenimiento de áreas verdes
9. **Limpieza** - Limpieza profunda, desinfección
10. **Otros** - Servicios especializados

### **Niveles de Prioridad**
- **URGENT** - Riesgo de seguridad o daño mayor
- **HIGH** - Afecta habitabilidad
- **MEDIUM** - Inconveniente pero no crítico
- **LOW** - Mejora o mantenimiento preventivo

## 🔧 Estados de Solicitud

### **Flujo de Estados**
```
OPEN → IN_PROGRESS → COMPLETED
  ↓         ↓           ↓
CANCELLED ← ← ← ← ← ← ← ←
```

1. **OPEN** - Solicitud creada, pendiente de asignación
2. **IN_PROGRESS** - Prestador asignado, trabajo en curso
3. **COMPLETED** - Trabajo finalizado, pendiente evaluación
4. **CANCELLED** - Solicitud cancelada por cualquier parte

## 💰 Sistema de Costos

### **Tipos de Costos**
- **Costo Estimado** - Calculado por el prestador
- **Costo Real** - Costo final después del trabajo
- **Tarifa por Hora** - Tarifa base del prestador
- **Costos Adicionales** - Materiales, repuestos, etc.

### **Proceso de Aprobación**
1. Prestador envía estimación
2. Propietario revisa y aprueba
3. Trabajo se ejecuta
4. Costo real se registra
5. Diferencia se ajusta si es necesario

## ⭐ Sistema de Calificaciones

### **Criterios de Evaluación**
- **Calidad del trabajo** (1-5 estrellas)
- **Puntualidad** (1-5 estrellas)
- **Profesionalismo** (1-5 estrellas)
- **Comunicación** (1-5 estrellas)
- **Limpieza** (1-5 estrellas)

### **Impacto en Prestadores**
- Calificación promedio visible en perfil
- Algoritmo de asignación prioriza prestadores con mejor calificación
- Suspensión automática si calificación baja de 2.0
- Incentivos para calificaciones superiores a 4.5

## 📱 Interfaces de Usuario

### **Página de Administración**
- `/admin/contractors` - Gestión de prestadores
- `/admin/maintenance` - Gestión de solicitudes
- Filtros avanzados y búsqueda
- Estadísticas en tiempo real

### **Página de Propietarios**
- `/owner/maintenance` - Solicitudes de sus propiedades
- Asignación de prestadores
- Aprobación de costos

### **Página de Inquilinos**
- `/tenant/maintenance` - Sus solicitudes
- Creación de nuevas solicitudes
- Evaluación de trabajos

### **Página de Brokers**
- `/broker/maintenance` - Solicitudes de propiedades que maneja
- Coordinación entre partes

## 🔐 Seguridad y Validación

### **Validaciones de Entrada**
- Esquemas Zod para todas las APIs
- Sanitización de datos
- Validación de permisos por rol

### **Protección de Datos**
- Acceso basado en roles
- Auditoría de cambios
- Encriptación de datos sensibles

## 📈 Métricas y KPIs

### **Métricas de Rendimiento**
- Tiempo promedio de resolución
- Tasa de satisfacción del cliente
- Utilización de prestadores
- Costos promedio por categoría

### **Métricas de Negocio**
- Ingresos por mantenimiento
- Retención de prestadores
- Crecimiento de la red
- Eficiencia operacional

## 🚀 Próximas Funcionalidades

### **Fase 2 - Automatización**
- Asignación automática de prestadores
- Notificaciones push en tiempo real
- Integración con sistemas de pago
- Chat en vivo entre partes

### **Fase 3 - Inteligencia Artificial**
- Predicción de costos
- Detección de patrones de mantenimiento
- Recomendaciones preventivas
- Optimización de rutas de prestadores

### **Fase 4 - Expansión**
- App móvil para prestadores
- Integración con proveedores de materiales
- Sistema de garantías
- Marketplace de servicios

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre el sistema de mantenimiento:
- Email: soporte@rent360.cl
- Teléfono: +56 2 2345 6789
- Horario: Lunes a Viernes 9:00 - 18:00

---

**Rent360 - Sistema de Mantenimiento y Prestadores de Servicios**
*Versión 1.0 - Enero 2024*
