const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando corrección de AuthProviderSimpleSimple...');

const filesToUpdate = [
  'src/hooks/useUserState.ts',
  'src/components/header.tsx',
  'src/components/refunds/RefundManagement.tsx',
  'src/components/legal/LegalCasesManagement.tsx',
  'src/components/ai/Chatbot.tsx',
  'src/app/layout.tsx',
  'src/app/tenant/reports/page.tsx',
  'src/app/tenant/reports/maintenance/page.tsx',
  'src/app/tenant/messages/page.tsx',
  'src/app/support/properties/page.tsx',
  'src/app/support/dashboard/page.tsx',
  'src/app/runner/visits/page.tsx',
  'src/app/runner/visits/new/page.tsx',
  'src/app/runner/tasks/new/page.tsx',
  'src/app/runner/reports/new/page.tsx',
  'src/app/runner/profile/edit/page.tsx',
  'src/app/runner/photos/page.tsx',
  'src/app/runner/messages/new/page.tsx',
  'src/app/runner/earnings/page.tsx',
  'src/app/runner/dashboard/page.tsx',
  'src/app/runner/clients/new/page.tsx',
  'src/app/provider/services/new/page.tsx',
  'src/app/provider/requests/new/page.tsx',
  'src/app/provider/profile/page.tsx',
  'src/app/provider/earnings/page.tsx',
  'src/app/provider/dashboard/page.tsx',
  'src/app/provider/clients/page.tsx',
  'src/app/owner/reports/page.tsx',
  'src/app/owner/properties/new/page.tsx',
  'src/app/owner/payments/page.tsx',
  'src/app/owner/maintenance/page.tsx',
  'src/app/owner/dashboard/page.tsx',
  'src/app/owner/contracts/page.tsx',
  'src/app/maintenance/page.tsx',
  'src/app/maintenance/jobs/new/page.tsx',
  'src/app/error-test/page.tsx',
  'src/app/documents/page.tsx',
  'src/app/client/services/page.tsx',
  'src/app/client/providers/top-rated/page.tsx',
  'src/app/broker/viewings/new/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/settings/enhanced/page.tsx',
  'src/app/admin/settings/database/page.tsx',
  'src/app/admin/security/page.tsx',
  'src/app/admin/reports/providers/page.tsx',
  'src/app/admin/reports/payments/page.tsx',
  'src/app/admin/reports/maintenance/page.tsx',
  'src/app/admin/reports/integrations/page.tsx',
  'src/app/admin/providers/new/page.tsx',
  'src/app/admin/payments/page.tsx',
  'src/app/admin/payments/providers/new/page.tsx',
  'src/app/admin/payments/owners/new/page.tsx',
  'src/app/admin/payments/maintenance/page.tsx',
  'src/app/admin/payments/brokers/new/page.tsx',
  'src/app/admin/maintenance/new/page.tsx',
  'src/app/admin/integrations/page.tsx',
  'src/app/admin/integrations/new/page.tsx',
  'src/app/admin/database-stats/page.tsx',
  'src/app/tenant/payments/[paymentId]/pay/page.tsx',
  'src/app/tenant/payments/[paymentId]/page.tsx',
  'src/app/support/properties/[propertyId]/page.tsx',
  'src/app/runner/tasks/[taskId]/page.tsx',
  'src/app/runner/payments/[paymentId]/page.tsx',
  'src/app/provider/services/[id]/page.tsx',
  'src/app/provider/services/[id]/edit/page.tsx',
  'src/app/provider/requests/[id]/page.tsx',
  'src/app/provider/payments/[paymentId]/page.tsx',
  'src/app/owner/tenants/[tenantId]/page.tsx',
  'src/app/owner/tenants/[tenantId]/edit/page.tsx',
  'src/app/owner/properties/[propertyId]/page.tsx',
  'src/app/owner/properties/[propertyId]/edit/page.tsx',
  'src/app/broker/properties/[propertyId]/page.tsx',
  'src/app/broker/contracts/[contractId]/page.tsx',
  'src/app/broker/clients/[clientId]/page.tsx',
  'src/app/broker/clients/[clientId]/edit/page.tsx',
  'src/app/admin/maintenance/[requestId]/page.tsx',
  'src/app/[locale]/layout.tsx',
];

let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes('@/components/auth/AuthProvider')) {
        console.log(`📝 Procesando: ${filePath}`);

        const newContent = content
          .replace('@/components/auth/AuthProvider', '@/components/auth/AuthProviderSimple')
          .replace(
            '@/components/auth/AuthProviderSimpleSimple',
            '@/components/auth/AuthProviderSimple'
          );

        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          updatedFiles++;
          console.log(`✅ Actualizado: ${path.basename(filePath)}`);
        }
      }
    } else {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
});

console.log(`🎉 Proceso completado. Archivos actualizados: ${updatedFiles}`);
