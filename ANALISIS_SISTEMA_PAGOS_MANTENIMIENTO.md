# Análisis del Sistema de Pagos para Mantenimiento

## Resumen Ejecutivo

Este documento analiza el sistema de pagos existente para runners y providers, y define la implementación del sistema de pagos para el rol de mantenimiento.

## Flujo Actual de Pagos (Runners y Providers)

### 1. Autorización de Pago

- **Momento**: Cuando se acepta una cotización o se crea un trabajo
- **Servicio**: `ClientPaymentService.authorizePayment()`
- **Proceso**:
  1. Verifica que el trabajo existe
  2. Crea registro en `ProviderTransaction` con estado `PENDING`
  3. Autoriza el pago según método (Stripe, PayPal, Khipu, WebPay)
  4. Actualiza estado a `PROCESSING` si la autorización es exitosa

### 2. Procesamiento de Pago

- **Momento**: Cuando el trabajo se completa
- **Servicio**: `ClientPaymentService.chargePayment()`
- **Proceso**:
  1. Busca el pago autorizado
  2. Verifica que el trabajo esté completado
  3. Procesa el cobro según método de pago
  4. Calcula comisión desde configuración del admin
  5. Retiene comisión y calcula `netAmount`
  6. Verifica cuenta bancaria del provider
  7. Actualiza transacción con comisión y netAmount
  8. Crea notificaciones

### 3. Payouts

- **Servicio**: `ProviderPayoutsService`
- **Proceso**:
  1. Calcula payouts pendientes desde trabajos completados
  2. Aplica período de gracia si corresponde
  3. Calcula comisión desde configuración del admin
  4. Crea transacciones de payout en estado `PENDING`
  5. Admin aprueba y ejecuta payouts
  6. Se transfiere a cuenta bancaria del provider

## Métodos de Pago Soportados

### Métodos Digitales (Permitidos)

- **Khipu**: Pasarela chilena (transferencias, tarjetas)
- **Stripe**: Internacional (tarjetas, transferencias)
- **PayPal**: Internacional (digital wallet)
- **WebPay**: Pasarela chilena (tarjetas)

### Métodos NO Permitidos

- **Efectivo (CASH)**: ❌ No se permite
- **Cheque (CHECK)**: ❌ No se permite

## Configuración de Comisiones

### Fuente de Configuración

- **SystemSetting**: `maintenanceProviderCommissionPercentage`
- **Fallback**: `PlatformConfig`
- **Valor por defecto**: 8%

### Cálculo de Comisión

```typescript
commissionPercentage = await getMaintenanceProviderCommissionPercentage();
commission = amount * (commissionPercentage / 100);
netAmount = amount - commission;
```

## Puntos de Integración para Mantenimiento

### 1. Aprobación de Cotización

**Archivo**: `src/app/api/maintenance/[id]/quote/approve/route.ts`

- **Acción**: Cuando owner/broker aprueba cotización
- **Integración**: Llamar a `MaintenancePaymentService.authorizePayment()`
- **Datos necesarios**:
  - `maintenanceId`
  - `clientId` (owner/broker que aprueba)
  - `amount` (desde `estimatedCost` o `actualCost`)
  - `paymentMethod` (seleccionado por el cliente)

### 2. Confirmación de Finalización

**Archivo**: `src/app/api/maintenance/[id]/confirm-completion/route.ts`

- **Acción**: Cuando owner/broker confirma que el trabajo está completado
- **Integración**: Llamar a `MaintenancePaymentService.chargePayment()`
- **Datos necesarios**:
  - `maintenanceId`
  - El pago ya debe estar autorizado

## Estructura de Datos

### ProviderTransaction

```typescript
{
  providerType: 'MAINTENANCE',
  maintenanceProviderId: string,
  maintenanceId: string,
  amount: number,
  commission: number,
  netAmount: number,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  paymentMethod: 'KHIPU' | 'STRIPE' | 'PAYPAL' | 'WEBPAY',
  reference: string,
  notes: string (JSON metadata),
  processedAt: Date | null,
}
```

## Validaciones Requeridas

### 1. Método de Pago

- ✅ Solo métodos digitales permitidos
- ❌ Rechazar `CASH` y `CHECK`
- Validar que el método esté configurado por el admin

### 2. Cuenta Bancaria

- Verificar que el usuario de mantenimiento tenga cuenta bancaria
- Verificar que la cuenta esté verificada (`isVerified: true`)
- Si no tiene cuenta, crear payout pendiente y notificar

### 3. Monto

- Verificar que `estimatedCost` o `actualCost` exista
- Verificar que el monto sea positivo

## Notificaciones

### Al Autorizar Pago

- Notificar al owner/broker: "Pago autorizado, se procesará al completar el trabajo"
- Notificar al usuario de mantenimiento: "Cotización aprobada, pago pendiente"

### Al Procesar Pago

- Notificar al owner/broker: "Pago procesado exitosamente"
- Notificar al usuario de mantenimiento:
  - Si tiene cuenta bancaria: "Pago recibido, será depositado en tu cuenta"
  - Si no tiene cuenta: "Pago pendiente, configura tu cuenta bancaria"

### Al Crear Payout

- Notificar al usuario de mantenimiento: "Payout creado, pendiente de aprobación"

## Endpoints API Necesarios

### 1. Autorizar Pago

```
POST /api/maintenance/[id]/payment/authorize
Body: {
  paymentMethod: 'khipu' | 'stripe' | 'paypal' | 'webpay',
  paymentMethodId?: string
}
```

### 2. Obtener Estado de Pago

```
GET /api/maintenance/[id]/payment/status
```

### 3. Procesar Pago (automático al confirmar)

```
POST /api/maintenance/[id]/payment/charge
```

## Integración con Khipu

### Crear Pago

- Usar endpoint existente: `/api/payments/khipu/create`
- Incluir `maintenanceId` en `custom` data
- Configurar `return_url` y `cancel_url`

### Webhook

- Actualizar `/api/payments/khipu/notify` para manejar pagos de mantenimiento
- Buscar `maintenanceId` en `custom` data
- Actualizar `ProviderTransaction` cuando el pago se complete

## Flujo Completo

```
1. Owner/Broker solicita mantenimiento
   ↓
2. Usuario de mantenimiento envía cotización
   ↓
3. Owner/Broker aprueba cotización
   → MaintenancePaymentService.authorizePayment()
   → Crea ProviderTransaction (PENDING)
   → Autoriza pago con método seleccionado
   ↓
4. Usuario de mantenimiento completa trabajo
   → Estado: PENDING_CONFIRMATION
   ↓
5. Owner/Broker confirma finalización
   → MaintenancePaymentService.chargePayment()
   → Procesa cobro
   → Calcula comisión
   → Actualiza ProviderTransaction (PROCESSING/COMPLETED)
   ↓
6. Sistema crea payout automático
   → ProviderPayoutsService.calculateMaintenanceProviderPayouts()
   → Crea transacción de payout (PENDING)
   ↓
7. Admin aprueba payout
   → ProviderPayoutsService.approveProviderPayout()
   → Transfiere a cuenta bancaria del usuario de mantenimiento
```

## Estado Actual del Sistema

### ✅ Ya Existe

1. **`src/lib/provider-payouts-service.ts`** - ✅ Ya calcula payouts de mantenimiento
2. **`src/app/api/payments/provider/route.ts`** - ✅ Ya puede crear pagos de mantenimiento (pero es para pagos manuales)
3. **`src/app/api/payments/khipu/create/route.ts`** - ✅ Ya existe para crear pagos Khipu
4. **`src/app/api/payments/khipu/notify/route.ts`** - ✅ Ya existe pero solo maneja `Payment`, no `ProviderTransaction`

### ❌ Falta Implementar

1. **Servicio de pagos automáticos** - Similar a `ClientPaymentService` pero para mantenimiento
2. **Integración en flujo de aprobación** - Cuando se aprueba cotización, autorizar pago
3. **Integración en flujo de confirmación** - Cuando se confirma finalización, procesar cobro
4. **Actualizar webhook Khipu** - Para manejar `ProviderTransaction` de mantenimiento además de `Payment`

## Archivos a Crear/Modificar

### Nuevos Archivos

1. `src/lib/maintenance-payment-service.ts` - Servicio principal de pagos automáticos (similar a ClientPaymentService)

### Archivos a Modificar

1. `src/app/api/maintenance/[id]/quote/approve/route.ts` - Integrar autorización de pago
2. `src/app/api/maintenance/[id]/confirm-completion/route.ts` - Integrar procesamiento de cobro
3. `src/app/api/payments/khipu/notify/route.ts` - Manejar ProviderTransaction de mantenimiento además de Payment
4. `src/lib/provider-payouts-service.ts` - ✅ Ya funciona con mantenimiento, no requiere cambios

## Consideraciones de Seguridad

1. **Validación de Permisos**: Solo owner/broker puede autorizar y confirmar pagos
2. **Validación de Métodos**: Rechazar efectivo y cheque
3. **Validación de Montos**: Verificar que el monto coincida con la cotización
4. **Idempotencia**: Evitar procesar el mismo pago múltiples veces
5. **Logging**: Registrar todas las operaciones de pago

## Pruebas Requeridas

1. ✅ Autorización de pago al aprobar cotización
2. ✅ Procesamiento de pago al confirmar finalización
3. ✅ Cálculo correcto de comisión
4. ✅ Rechazo de métodos no permitidos (efectivo, cheque)
5. ✅ Creación de payouts automáticos (ya existe ProviderPayoutsService)
6. ✅ Notificaciones a usuarios
7. ✅ Integración con Khipu
8. ✅ Manejo de errores

## Estado de Implementación

### ✅ Completado

1. **`src/lib/maintenance-payment-service.ts`** - ✅ Creado
   - Autorización de pagos
   - Procesamiento de cobros
   - Validación de métodos (rechaza efectivo y cheque)
   - Cálculo de comisión desde configuración del admin
   - Verificación de cuentas bancarias
   - Notificaciones

2. **`src/app/api/maintenance/[id]/quote/approve/route.ts`** - ✅ Modificado
   - Integración opcional de autorización de pago
   - Acepta `paymentMethod` y `paymentMethodId` en el body
   - No bloquea la aprobación si falla la autorización del pago

3. **`src/app/api/maintenance/[id]/confirm-completion/route.ts`** - ✅ Modificado
   - Procesamiento automático del pago al confirmar finalización
   - Calcula comisión y crea payout pendiente
   - Envía notificaciones al provider

4. **`src/app/api/payments/khipu/notify/route.ts`** - ✅ Modificado
   - Maneja ProviderTransaction de mantenimiento
   - Actualiza estado cuando Khipu notifica
   - Procesa cobro automáticamente cuando el pago se completa

### ⏳ Pendiente (Frontend)

1. **UI para seleccionar método de pago al aprobar cotización**
   - Agregar selector de método de pago en `/owner/maintenance`
   - Mostrar opciones: Khipu, Stripe, PayPal, WebPay
   - Enviar `paymentMethod` al endpoint de aprobación

2. **UI para mostrar estado de pago**
   - Mostrar estado del pago en la lista de mantenimientos
   - Mostrar URL de pago si es Khipu
   - Mostrar mensajes de éxito/error

### ✅ Ya Existe (No Requiere Cambios)

1. **`src/lib/provider-payouts-service.ts`** - ✅ Ya calcula payouts de mantenimiento
2. **`src/app/api/payments/provider/route.ts`** - ✅ Ya maneja pagos de mantenimiento (manuales)
3. **`src/app/api/payments/khipu/create/route.ts`** - ✅ Ya crea pagos Khipu

## Notas de Implementación

- El pago se puede autorizar opcionalmente al aprobar la cotización (si se envía `paymentMethod`)
- El pago se procesa automáticamente al confirmar la finalización del trabajo
- Los payouts se crean automáticamente mediante `ProviderPayoutsService` (ya existe)
- El webhook de Khipu maneja tanto `Payment` como `ProviderTransaction`
- Se rechazan métodos de pago en efectivo y cheque
- La comisión se calcula desde la configuración del admin (`maintenanceProviderCommissionPercentage`)
