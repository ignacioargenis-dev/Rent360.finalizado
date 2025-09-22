import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { cacheManager, createCacheKey } from '@/lib/cache-manager';

// GET /api/support/legal-cases/[id] - Obtener detalles completos de un caso legal
async function getLegalCaseDetails(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // Verificar que el usuario sea de soporte o admin
    if (!['SUPPORT', 'ADMIN'].includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo usuarios de soporte pueden acceder a esta información.' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del caso es requerido' },
        { status: 400 }
      );
    }

    // Crear clave de cache
    const cacheKey = createCacheKey('support:legal-case-details', { id });
    
    // Intentar obtener del cache primero
    let legalCase = cacheManager.get(cacheKey);
    
    if (!legalCase) {
      // Obtener caso legal con todas las relaciones
      legalCase = await db.legalCase.findUnique({
        where: { id },
        include: {
          contract: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  commune: true,
                  region: true,
                  // postalCode: true, // Campo no existe en el esquema
                  // propertyType: true, // Campo no existe en el esquema
                  bedrooms: true,
                  bathrooms: true,
                  area: true,
                  images: true
                }
              },
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  // identificationNumber: true, // Campo no existe en el esquema
                  // dateOfBirth: true, // Campo no existe en el esquema
                  // emergencyContact: true, // Campo no existe en el esquema
                  // bankAccount: true // Campo no existe en el esquema
                }
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  // identificationNumber: true, // Campo no existe en el esquema
                  // bankAccount: true, // Campo no existe en el esquema
                  // address: true // Campo no existe en el esquema
                }
              },
              broker: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  // licenseNumber: true, // Campo no existe en el esquema
                  // company: true // Campo no existe en el esquema
                }
              },
              payments: {
                where: {
                  status: 'PENDING' // Cambiado de 'OVERDUE' que no existe en PaymentStatus
                },
                orderBy: { dueDate: 'asc' },
                select: {
                  id: true,
                  amount: true,
                  dueDate: true,
                  status: true,
                  // lateFees: true // Campo no existe en el esquema
                }
              }
            }
          },
          extrajudicialNotices: {
            orderBy: { createdAt: 'desc' },
            // include: {
            //   documents: { // Campo no existe en el esquema
            //     select: {
            //       id: true,
            //       fileName: true,
            //       fileType: true,
            //       fileSize: true,
            //       uploadedAt: true,
            //       documentType: true
            //     }
            //   }
            // }
          },
          legalDocuments: {
            orderBy: { createdAt: 'desc' },
            include: {
              // uploadedBy: { // Campo no existe en el esquema
              //   select: {
              //     id: true,
              //     name: true,
              //     email: true,
              //     role: true
              //   }
              // }
            }
          },
          courtProceedings: {
            orderBy: { createdAt: 'desc' },
            include: {
              // documents: { // Campo no existe en el esquema
              //   select: {
              //     id: true,
              //     fileName: true,
              //     fileType: true,
              //     fileSize: true,
              //     uploadedAt: true,
              //     documentType: true
              //     }
              //   }
            }
          },
          legalPayments: {
            orderBy: { createdAt: 'desc' },
            include: {
              // paymentMethod: true // Campo no existe en el esquema
            }
          },
          legalAuditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          legalNotifications: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!legalCase) {
        return NextResponse.json(
          { error: 'Caso legal no encontrado' },
          { status: 404 }
        );
      }

      // Guardar en cache por 10 minutos
      cacheManager.set(cacheKey, legalCase, 10 * 60 * 1000);
    }

    logger.info('Detalles de caso legal obtenidos por soporte', {
      context: 'support.legal-cases.details',
      userId: user.id,
      userRole: user.role,
      caseId: id
    });

    return NextResponse.json({
      success: true,
      data: legalCase
    });

  } catch (error) {
    logger.error('Error al obtener detalles del caso legal para soporte', {
      context: 'support.legal-cases.details',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/support/legal-cases/[id]/add-note - Agregar nota interna
async function updateLegalCase(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // Verificar que el usuario sea de soporte o admin
    if (!['SUPPORT', 'ADMIN'].includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo usuarios de soporte pueden agregar notas.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { note, isInternal = true } = body;

    if (!id || !note) {
      return NextResponse.json(
        { error: 'ID del caso y nota son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el caso existe
    const existingCase = await db.legalCase.findUnique({
      where: { id },
      select: { id: true, internalNotes: true }
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Preparar la nueva nota
    const timestamp = new Date().toISOString();
    const userInfo = `${user.name} (${user.role})`;
    const newNoteEntry = `[${timestamp}] ${userInfo}: ${note}\n`;
    
    const updatedNotes = existingCase.internalNotes 
      ? existingCase.internalNotes + '\n' + newNoteEntry
      : newNoteEntry;

    // Actualizar el caso con la nueva nota
    const updatedCase = await db.legalCase.update({
      where: { id },
      data: {
        internalNotes: updatedNotes
      }
    });

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: id,
        userId: user.id,
        action: 'INTERNAL_NOTE_ADDED',
        details: `Nota interna agregada: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        previousValue: existingCase.internalNotes || '',
        newValue: updatedNotes
      }
    });

    // Limpiar cache relacionado
    cacheManager.invalidateByTag('legal-cases');

    logger.info('Nota interna agregada al caso legal', {
      context: 'support.legal-cases.add-note',
      userId: user.id,
      userRole: user.role,
      caseId: id,
      noteLength: note.length,
      isInternal
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        internalNotes: updatedNotes
      },
      message: 'Nota interna agregada exitosamente'
    });

  } catch (error) {
    logger.error('Error al agregar nota interna al caso legal', {
      context: 'support.legal-cases.add-note',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers con rate limiting
// Wrapper para compatibilidad con withRateLimit
const getLegalCaseDetailsWrapper = async (request: NextRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json({ error: 'ID no encontrado' }, { status: 400 });
  }
  return getLegalCaseDetails(request, { params: { id } });
};

const updateLegalCaseWrapper = async (request: NextRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  if (!id) {
    return NextResponse.json({ error: 'ID no encontrado' }, { status: 400 });
  }
  return updateLegalCase(request, { params: { id } });
};

export const GET = withRateLimit(getLegalCaseDetailsWrapper, 'api');
export const POST = withRateLimit(updateLegalCaseWrapper, 'api');
