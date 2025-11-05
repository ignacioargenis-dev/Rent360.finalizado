import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
// import { handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/bank-account
 * Obtiene la configuración bancaria del proveedor autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Buscar cuenta bancaria asociada al usuario
    const bankAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!bankAccount) {
      return NextResponse.json({
        success: true,
        bankAccount: null,
      });
    }

    // Retornar datos bancarios (sin información sensible completa)
    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bankName: bankAccount.bank,
        accountType: bankAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
        accountNumber: bankAccount.accountNumber,
        routingNumber: '', // No existe en el schema actual
        accountHolderName: bankAccount.holderName || '',
        rut: bankAccount.rut || '',
        email: fullUser.email,
        phone: fullUser.phone || '',
      },
    });
  } catch (error) {
    logger.error('Error obteniendo cuenta bancaria del proveedor', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/provider/bank-account
 * Actualiza o crea la configuración bancaria del proveedor autenticado
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      bankName,
      accountType,
      accountNumber,
      routingNumber,
      accountHolderName,
      rut,
      email,
      phone,
    } = body;

    // Validación básica
    if (!bankName || !accountNumber || !accountHolderName || !rut) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: banco, número de cuenta, titular y RUT' },
        { status: 400 }
      );
    }

    // Validar formato de RUT chileno básico
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    if (!rutRegex.test(rut)) {
      return NextResponse.json(
        { error: 'Formato de RUT inválido. Debe ser: 12.345.678-9' },
        { status: 400 }
      );
    }

    // Buscar cuenta bancaria existente
    const existingAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (existingAccount) {
      // Actualizar cuenta existente
      const updatedAccount = await db.bankAccount.update({
        where: { id: existingAccount.id },
        data: {
          bank: bankName,
          accountType: accountType === 'checking' ? 'CHECKING' : 'SAVINGS',
          accountNumber: accountNumber,
          holderName: accountHolderName,
          rut: rut,
        },
      });

      // Actualizar email y teléfono del usuario si se proporcionaron
      if (email || phone) {
        await db.user.update({
          where: { id: user.id },
          data: {
            ...(email && { email }),
            ...(phone && { phone }),
          },
        });
      }

      logger.info('Cuenta bancaria actualizada', {
        userId: user.id,
        bankAccountId: updatedAccount.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración bancaria actualizada exitosamente',
        bankAccount: {
          id: updatedAccount.id,
          bankName: updatedAccount.bank,
          accountType: updatedAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: updatedAccount.accountNumber,
          routingNumber: '',
          accountHolderName: updatedAccount.holderName || '',
          rut: updatedAccount.rut || '',
        },
      });
    } else {
      // Crear nueva cuenta bancaria
      const newAccount = await db.bankAccount.create({
        data: {
          userId: user.id,
          bank: bankName,
          accountType: accountType === 'checking' ? 'CHECKING' : 'SAVINGS',
          accountNumber: accountNumber,
          holderName: accountHolderName,
          rut: rut,
        },
      });

      // Actualizar email y teléfono del usuario si se proporcionaron
      if (email || phone) {
        await db.user.update({
          where: { id: user.id },
          data: {
            ...(email && { email }),
            ...(phone && { phone }),
          },
        });
      }

      logger.info('Cuenta bancaria creada', {
        userId: user.id,
        bankAccountId: newAccount.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración bancaria guardada exitosamente',
        bankAccount: {
          id: newAccount.id,
          bankName: newAccount.bank,
          accountType: newAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: newAccount.accountNumber,
          routingNumber: '',
          accountHolderName: newAccount.holderName || '',
          rut: newAccount.rut || '',
        },
      });
    }
  } catch (error) {
    logger.error('Error guardando cuenta bancaria del proveedor', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
