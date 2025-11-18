import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { z } from 'zod';
import { generateTokens, setAuthCookies, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = registerSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        // Crear mensajes de error más específicos
        const errorMessages = validationError.issues.map(issue => {
          const field = issue.path.join('.');
          switch (field) {
            case 'name':
              return 'El nombre es obligatorio y debe tener al menos 2 caracteres';
            case 'email':
              return 'El email debe tener un formato válido';
            case 'password':
              return 'La contraseña debe tener al menos 8 caracteres';
            case 'rut':
              return 'El RUT debe tener un formato válido (ej: 12.345.678-9)';
            case 'phone':
              return 'El teléfono debe tener formato chileno válido';
            default:
              return `${field}: ${issue.message}`;
          }
        });

        return NextResponse.json({ error: errorMessages.join('. ') }, { status: 400 });
      }
      throw validationError;
    }

    const {
      name,
      email,
      password,
      role,
      rut,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      commune,
      region,
      phoneSecondary,
      emergencyContact,
      emergencyPhone,
    } = validatedData;

    if (!name || !email || !password || !role || !rut) {
      return NextResponse.json(
        { error: 'Los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    // Roles permitidos para registro público
    const allowedPublicRoles = ['TENANT', 'OWNER', 'BROKER', 'RUNNER', 'PROVIDER', 'MAINTENANCE'];

    // Evitar que los usuarios se registren con roles no permitidos
    if (!allowedPublicRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol de usuario no permitido para registro público' },
        { status: 403 }
      );
    }

    // Verificar si el usuario ya existe por email
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 409 });
    }

    // Verificar si el RUT ya existe
    const existingUserByRut = await db.user.findUnique({
      where: { rut },
    });

    if (existingUserByRut) {
      return NextResponse.json({ error: 'Ya existe un usuario con este RUT' }, { status: 409 });
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);
    const normalizedRole = role.toUpperCase();

    // Crear usuario y perfil de proveedor si corresponde en una transacción
    const result = await db.$transaction(async tx => {
      // Crear usuario con todos los campos
      const userData = {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole,
        avatar: null,
        // Campos obligatorios
        rut,
        // Campos opcionales
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        commune: commune || null,
        region: region || null,
        // Campos adicionales de contacto
        phoneSecondary: phoneSecondary || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      };

      const user = await tx.user.create({
        data: userData,
      });

      // Verificar configuración de aprobación automática
      const [userApprovalSetting, autoApproveMaintenanceSetting, autoApproveServiceSetting] =
        await Promise.all([
          tx.systemSetting.findFirst({
            where: {
              category: 'users',
              key: 'userApprovalRequired',
              isActive: true,
            },
          }),
          tx.systemSetting.findFirst({
            where: {
              OR: [
                { category: 'providers', key: 'autoApproveMaintenanceProviders' },
                { category: 'system', key: 'autoApproveMaintenanceProviders' },
              ],
              isActive: true,
            },
          }),
          tx.systemSetting.findFirst({
            where: {
              OR: [
                { category: 'providers', key: 'autoApproveServiceProviders' },
                { category: 'system', key: 'autoApproveServiceProviders' },
              ],
              isActive: true,
            },
          }),
        ]);

      const userApprovalRequired =
        userApprovalSetting?.value === 'true' || userApprovalSetting?.value === '1';
      const autoApproveMaintenance =
        autoApproveMaintenanceSetting?.value === 'true' ||
        autoApproveMaintenanceSetting?.value === '1';
      const autoApproveService =
        autoApproveServiceSetting?.value === 'true' || autoApproveServiceSetting?.value === '1';

      // Determinar si el usuario debe estar activo
      let shouldBeActive = !userApprovalRequired;

      // Si el usuario se registra como PROVIDER o MAINTENANCE, crear perfil automáticamente
      if (normalizedRole === 'PROVIDER') {
        const shouldAutoApprove = autoApproveService;
        const initialStatus = shouldAutoApprove ? 'ACTIVE' : 'PENDING_VERIFICATION';
        const initialIsVerified = shouldAutoApprove;

        // Crear perfil de ServiceProvider
        await tx.serviceProvider.create({
          data: {
            userId: user.id,
            businessName: name,
            rut: rut || '00000000-0',
            serviceType: 'OTHER',
            serviceTypes: JSON.stringify([]),
            basePrice: 0,
            status: initialStatus,
            isVerified: initialIsVerified,
            responseTime: 2,
            availability: JSON.stringify({
              weekdays: true,
              weekends: false,
              emergencies: false,
            }),
            address: address || null,
            city: city || null,
            region: region || null,
            description: null,
          },
        });

        // Si está configurado para auto-aprobar, activar el usuario
        if (shouldAutoApprove) {
          shouldBeActive = true;
        }

        logger.info('Perfil de ServiceProvider creado automáticamente durante registro', {
          userId: user.id,
          email: user.email,
          autoApproved: shouldAutoApprove,
        });
      } else if (normalizedRole === 'MAINTENANCE') {
        const shouldAutoApprove = autoApproveMaintenance;
        const initialStatus = shouldAutoApprove ? 'ACTIVE' : 'PENDING_VERIFICATION';
        const initialIsVerified = shouldAutoApprove;

        // Crear perfil de MaintenanceProvider
        await tx.maintenanceProvider.create({
          data: {
            userId: user.id,
            businessName: name,
            rut: rut || '00000000-0',
            specialty: 'Mantenimiento General',
            specialties: JSON.stringify([]),
            hourlyRate: 0,
            status: initialStatus,
            isVerified: initialIsVerified,
            responseTime: 2,
            availability: JSON.stringify({
              weekdays: true,
              weekends: false,
              emergencies: true,
            }),
            address: address || null,
            city: city || null,
            region: region || null,
            description: null,
          },
        });

        // Si está configurado para auto-aprobar, activar el usuario
        if (shouldAutoApprove) {
          shouldBeActive = true;
        }

        logger.info('Perfil de MaintenanceProvider creado automáticamente durante registro', {
          userId: user.id,
          email: user.email,
          autoApproved: shouldAutoApprove,
        });
      }

      // Actualizar estado activo del usuario según configuración
      if (shouldBeActive !== user.isActive) {
        await tx.user.update({
          where: { id: user.id },
          data: { isActive: shouldBeActive },
        });
        user.isActive = shouldBeActive;
      }

      return user;
    });

    // Generar tokens con rol normalizado a MAYÚSCULAS
    const { accessToken, refreshToken } = generateTokens(
      result.id,
      result.email,
      result.role.toUpperCase(),
      result.name
    );

    // Crear respuesta con cookies
    const response = NextResponse.json({
      message: 'Registro exitoso',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role.toUpperCase(),
        avatar: result.avatar,
      },
    });

    // Establecer cookies HTTP-only
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    logger.error('Error en registro:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
