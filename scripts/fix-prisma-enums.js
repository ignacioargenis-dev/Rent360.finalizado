const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function fixPrismaEnums() {
  console.log('🔧 Convirtiendo enums de Prisma para SQLite...');

  try {
    let content = fs.readFileSync(schemaPath, 'utf8');

    // Enums principales que se usan en los modelos
    const enumsToReplace = [
      'PaymentStatus',
      'PaymentMethod',
      'MessageStatus',
      'TicketPriority',
      'TicketStatus',
      'VisitStatus',
      'MaintenancePriority',
      'MaintenanceStatus',
      'NotificationType',
      'AccountType',
      'ServiceType',
      'ProviderStatus',
      'ServiceJobStatus',
      'ProviderType',
      'TransactionStatus',
      'RefundStatus',
      'DocumentType',
      'DisputeType',
      'DisputeStatus',
      'ApprovalType',
      'LegalCaseType',
      'LegalCaseStatus',
      'LegalPriority',
      'LegalPhase',
      'ExtrajudicialNoticeType',
      'DeliveryMethod',
      'DeliveryStatus',
      'LegalDocumentType',
      'DocumentStatus',
      'CourtProceedingType',
      'ProceedingStatus',
      'ProceedingOutcome',
      'LegalPaymentType',
      'LegalNotificationType'
    ];

    // Eliminar todas las definiciones de enum
    content = content.replace(/enum\s+\w+\s*\{[\s\S]*?\}/g, '');

    // Reemplazar usos de enums por String en los modelos
    enumsToReplace.forEach(enumName => {
      const regex = new RegExp(`\\b${enumName}\\b`, 'g');
      content = content.replace(regex, 'String');
    });

    // Limpiar líneas vacías extras
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    fs.writeFileSync(schemaPath, content, 'utf8');

    console.log('✅ Enums convertidos exitosamente a String para SQLite');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPrismaEnums();
