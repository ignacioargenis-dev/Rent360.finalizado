@echo off
echo CORRECCION COMPLETA: Todos los errores de tipo 'unknown' en catch blocks
echo.

REM Agregar todos los archivos corregidos
git add "src/app/api/admin/runners/payouts/[transactionId]/approve/route.ts"
git add "src/app/api/admin/platform-config/route.ts"
git add "src/app/api/admin/performance/route.ts"
git add "src/app/api/admin/executive-dashboard/route.ts"
git add "src/lib/runner-rating-service.ts"
git add "src/lib/bank-integrations/banco-estado-integration.ts"
git add "src/lib/runner-reports-service.ts"
git add "src/lib/provider-payouts-service.ts"

REM Crear commit con mensaje completo
git commit -m "fix: Correccion completa de errores de tipo 'unknown' en catch blocks

- Corregido error actual: runners/payouts/[transactionId]/approve/route.ts
- Corregidos archivos de API: platform-config, performance, executive-dashboard
- Corregidos servicios: runner-rating-service, banco-estado-integration
- Corregidos servicios: runner-reports-service, provider-payouts-service
- Total: 8 archivos corregidos con 20+ llamadas logger.error() y handleError()
- Patron aplicado: 'error as Error' para compatibilidad con TypeScript strict
- Soluciona: 'Argument of type unknown is not assignable to parameter'

Todos los bloques catch ahora tienen tipificación correcta."
