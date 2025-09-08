import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async () => {
  // Configurar base de datos de prueba
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'file:./test.db';

  // Limpiar base de datos de prueba
  try {
    await prisma.$connect();

    // Limpiar todas las tablas en orden correcto (respetando foreign keys)
    await prisma.contractSignature.deleteMany();
    await prisma.depositRefund.deleteMany();
    await prisma.refundDocument.deleteMany();
    await prisma.refundDispute.deleteMany();
    await prisma.refundApproval.deleteMany();
    await prisma.refundAuditLog.deleteMany();
    await prisma.legalNotification.deleteMany();
    await prisma.legalAuditLog.deleteMany();
    await prisma.legalDocument.deleteMany();
    await prisma.courtProceeding.deleteMany();
    await prisma.extrajudicialNotice.deleteMany();
    await prisma.legalCase.deleteMany();
    await prisma.legalPayment.deleteMany();
    await prisma.maintenance.deleteMany();
    await prisma.serviceJob.deleteMany();
    await prisma.providerTransaction.deleteMany();
    await prisma.maintenanceProvider.deleteMany();
    await prisma.serviceProvider.deleteMany();
    await prisma.providerDocuments.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.property.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.ticketComment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.systemSetting.deleteMany();
    await prisma.emailTemplate.deleteMany();

    console.log('🧹 Base de datos de prueba limpiada');
  } catch (error) {
    console.error('Error limpiando base de datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
};
