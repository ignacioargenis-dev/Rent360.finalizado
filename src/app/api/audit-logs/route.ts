import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/lib/audit';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden ver logs de auditoría
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Usar el servicio de auditoría para consultar logs
    const query = {
      userId: userId || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      startDate,
      endDate,
      limit,
      offset: (page - 1) * limit
    };

    const logs = await auditService.queryLogs(query);

    // Obtener estadísticas para el total
    const stats = await auditService.getAuditStats('30d');
    const totalCount = stats.totalLogs;

    // Formatear respuesta
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      category: getCategory(log.action),
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      userRole: getRoleFromAction(log.action),
      description: generateDescription(log),
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      device: parseUserAgent(log.userAgent),
      location: 'Unknown', // Podría implementarse con geolocalización
      severity: getSeverity(log.action),
      status: getStatus(log.action)
    }));

    logger.info('Logs de auditoría consultados', {
      userId: user.id,
      filters: query,
      count: formattedLogs.length
    });

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error obteniendo logs de auditoría:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
function generateDescription(log: any): string {
  const userName = log.userName || 'Sistema';

  switch (log.action) {
    case 'login':
      return `${userName} inició sesión exitosamente`;
    case 'logout':
      return `${userName} cerró sesión`;
    case 'create':
      return `${userName} creó ${log.entityType}: ${log.entityId || 'N/A'}`;
    case 'update':
      return `${userName} actualizó ${log.entityType}: ${log.entityId || 'N/A'}`;
    case 'delete':
      return `${userName} eliminó ${log.entityType}: ${log.entityId || 'N/A'}`;
    case 'unauthorized_login_failed':
      return `Intento de login fallido - contraseña incorrecta`;
    case 'unauthorized_login_user_not_found':
      return `Intento de login con usuario inexistente`;
    case 'unauthorized_login_account_inactive':
      return `Intento de login con cuenta inactiva`;
    case 'password_change':
      return `${userName} cambió su contraseña`;
    default:
      return `${userName} realizó acción: ${log.action}`;
  }
}

function getCategory(action: string): string {
  if (action.includes('login') || action.includes('logout') || action.includes('password')) {
    return 'user';
  }
  if (action.includes('create') || action.includes('update') || action.includes('delete')) {
    return action.split('_')[1] || 'system'; // property, contract, payment, etc.
  }
  if (action.includes('unauthorized')) {
    return 'security';
  }
  return 'system';
}

function getRoleFromAction(action: string): string {
  // Para acciones de sistema o unknown users
  if (action.includes('unauthorized') || !action.includes('login')) {
    return '';
  }
  // Podría expandirse para obtener el rol real del usuario
  return 'user';
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';

  if (userAgent.includes('Chrome') && userAgent.includes('Mobile')) {
    return 'Chrome Mobile';
  }
  if (userAgent.includes('Chrome')) {
    return 'Chrome Desktop';
  }
  if (userAgent.includes('Firefox')) {
    return 'Firefox';
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  }
  if (userAgent.includes('Edge')) {
    return 'Edge';
  }

  return 'Unknown Browser';
}

function getSeverity(action: string): string {
  if (action.includes('unauthorized') || action.includes('failed')) {
    return 'critical';
  }
  if (action.includes('delete') || action.includes('password_change')) {
    return 'warning';
  }
  return 'info';
}

function getStatus(action: string): string {
  if (action.includes('failed') || action.includes('unauthorized')) {
    return 'failed';
  }
  return 'success';
}
