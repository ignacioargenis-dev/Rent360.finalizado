import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

interface RouteParams {
  params: {
    accountId: string;
  };
}

/**
 * POST /api/user/bank-accounts/[accountId]/verify
 * Verifica una cuenta bancaria
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { accountId } = params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId es requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { microDepositAmounts } = body;

    // Verificar la cuenta bancaria
    const verificationResult = await BankAccountService.verifyBankAccount(
      accountId,
      microDepositAmounts ? { microDepositAmounts } : undefined
    );

    logger.info('Verificación de cuenta bancaria completada', {
      userId: user.id,
      accountId,
      status: verificationResult.status,
      success: verificationResult.success
    });

    return NextResponse.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    logger.error('Error verificando cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
