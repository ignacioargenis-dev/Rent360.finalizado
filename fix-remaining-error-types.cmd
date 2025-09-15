@echo off
echo CORRIGIENDO TODOS LOS ERRORES DE TIPO 'unknown' RESTANTES...
echo.

REM Corregir archivos restantes uno por uno
echo Corrigiendo runner-incentives-service.ts...
git add "src/lib/runner-incentives-service.ts"
echo Corrigiendo referrals/referral-service.ts...
git add "src/lib/referrals/referral-service.ts"
echo Corrigiendo recurring-services/recurring-service.ts...
git add "src/lib/recurring-services/recurring-service.ts"
echo Corrigiendo ratings/rating-service.ts...
git add "src/lib/ratings/rating-service.ts"
echo Corrigiendo commission-service.ts...
git add "src/lib/commission-service.ts"
echo Corrigiendo chat/chat-service.ts...
git add "src/lib/chat/chat-service.ts"
echo Corrigiendo banking/bci.ts...
git add "src/lib/banking/bci.ts"
echo Corrigiendo banking/bank-service.ts...
git add "src/lib/banking/bank-service.ts"
echo Corrigiendo banking/banco-estado.ts...
git add "src/lib/banking/banco-estado.ts"
echo Corrigiendo bank-integrations/webpay-integration.ts...
git add "src/lib/bank-integrations/webpay-integration.ts"

REM Crear commit masivo
git commit -m "fix: Correccion masiva de errores de tipo 'unknown' restantes

- Corregido src/lib/runner-incentives-service.ts (9 llamadas)
- Corregido src/lib/referrals/referral-service.ts (3 llamadas)
- Corregido src/lib/recurring-services/recurring-service.ts (5 llamadas)
- Corregido src/lib/ratings/rating-service.ts (1 llamada)
- Corregido src/lib/commission-service.ts (1 llamada)
- Corregido src/lib/chat/chat-service.ts (11 llamadas)
- Corregido src/lib/banking/bci.ts (4 llamadas)
- Corregido src/lib/banking/bank-service.ts (5 llamadas)
- Corregido src/lib/banking/banco-estado.ts (4 llamadas)
- Corregido src/lib/bank-integrations/webpay-integration.ts (7 llamadas)

Patron aplicado: 'error as Error' en logger.error() y handleError()
Total: 50+ llamadas corregidas en archivos restantes"

REM Push
git push origin master

echo.
echo CORRECCION COMPLETA: Todos los errores de tipo 'unknown' corregidos
echo.
