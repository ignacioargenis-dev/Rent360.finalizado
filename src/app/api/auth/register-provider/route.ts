import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleError } from '@/lib/errors';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { validateRut, validateEmail, validatePhone, validatePassword  } from '@/lib/validations';

// Schema de validación para registro de maintenance provider
const maintenanceProviderSchema = z.object({
  // Datos del usuario
  email: z.string().email('Email inválido').refine(validateEmail, 'Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine(
      (password) => validatePassword(password).isValid,
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
    ),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos').refine(validatePhone, 'Teléfono inválido'),
  
  // Datos del negocio
  businessName: z.string().min(2, 'El nombre del negocio es requerido'),
  rut: z.string().min(8, 'RUT inválido').refine(validateRut, 'RUT inválido'),
  specialty: z.string().min(2, 'La especialidad es requerida'),
  specialties: z.array(z.string()).min(1, 'Debe tener al menos una especialidad'),
  hourlyRate: z.number().positive('La tarifa por hora debe ser positiva'),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  
  // Datos bancarios
  bankAccount: z.object({
    bank: z.string().min(1, 'El banco es requerido'),
    accountType: z.enum(['CHECKING', 'SAVINGS']),
    accountNumber: z.string().min(1, 'El número de cuenta es requerido'),
    holderName: z.string().min(1, 'El nombre del titular es requerido'),
    rut: z.string().min(8, 'RUT inválido'),
  }),
  
  // Documentos (URLs)
  documents: z.object({
    criminalRecord: z.string().url('URL de antecedentes penales inválida'),
    idFront: z.string().url('URL de carnet frontal inválida'),
    idBack: z.string().url('URL de carnet reverso inválida'),
    businessCertificate: z.string().url('URL de certificado de inicio de actividades inválida'),
  }),
});

// Schema de validación para registro de service provider
const serviceProviderSchema = z.object({
  // Datos del usuario
  email: z.string().email('Email inválido').refine(validateEmail, 'Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine(
      (password) => validatePassword(password).isValid,
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
    ),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos').refine(validatePhone, 'Teléfono inválido'),
  
  // Datos del negocio
  businessName: z.string().min(2, 'El nombre del negocio es requerido'),
  rut: z.string().min(8, 'RUT inválido').refine(validateRut, 'RUT inválido'),
  serviceType: z.enum(['MOVING', 'CLEANING', 'GARDENING', 'PACKING', 'STORAGE', 'OTHER']),
  serviceTypes: z.array(z.string()).min(1, 'Debe tener al menos un tipo de servicio'),
  basePrice: z.number().positive('El precio base debe ser positivo'),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  
  // Datos bancarios
  bankAccount: z.object({
    bank: z.string().min(1, 'El banco es requerido'),
    accountType: z.enum(['CHECKING', 'SAVINGS']),
    accountNumber: z.string().min(1, 'El número de cuenta es requerido'),
    holderName: z.string().min(1, 'El nombre del titular es requerido'),
    rut: z.string().min(8, 'RUT inválido'),
  }),
  
  // Documentos (URLs)
  documents: z.object({
    criminalRecord: z.string().url('URL de antecedentes penales inválida'),
    idFront: z.string().url('URL de carnet frontal inválida'),
    idBack: z.string().url('URL de carnet reverso inválida'),
    businessCertificate: z.string().url('URL de certificado de inicio de actividades inválida'),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerType, ...data } = body;

    if (!providerType || !['maintenance', 'service'].includes(providerType)) {
      return NextResponse.json(
        { error: 'Tipo de proveedor inválido. Debe ser "maintenance" o "service"' },
        { status: 400 },
      );
    }

    // Validar datos según el tipo de proveedor
    let validatedData;
    if (providerType === 'maintenance') {
      validatedData = maintenanceProviderSchema.parse(data);
    } else {
      validatedData = serviceProviderSchema.parse(data);
    }

    // Verificar si el email ya existe
         const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 },
      );
    }

    // Verificar si el RUT ya está registrado
         const existingProvider = await db.$queryRaw`
      SELECT id FROM maintenance_providers WHERE rut = ${validatedData.rut}
      UNION
      SELECT id FROM service_providers WHERE rut = ${validatedData.rut}
    `;

    if (Array.isArray(existingProvider) && existingProvider.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor registrado con este RUT' },
        { status: 400 },
      );
    }

    // Crear usuario y proveedor en una transacción
         const result = await db.$transaction(async (tx) => {
      // Crear usuario
      const hashedPassword = await hash(validatedData.password, 12);
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: providerType === 'maintenance' ? 'MAINTENANCE_PROVIDER' : 'SERVICE_PROVIDER',
          isActive: false, // Pendiente de verificación
          emailVerified: false,
        },
      });

      // Crear cuenta bancaria
      const bankAccount = await tx.bankAccount.create({
        data: {
          userId: user.id,
          bank: validatedData.bankAccount.bank,
          accountType: validatedData.bankAccount.accountType,
          accountNumber: validatedData.bankAccount.accountNumber,
          holderName: validatedData.bankAccount.holderName,
          rut: validatedData.bankAccount.rut,
          isVerified: false,
        },
      });

      // Crear documentos
      const documents = await tx.providerDocuments.create({
        data: {
          criminalRecord: validatedData.documents.criminalRecord,
          idFront: validatedData.documents.idFront,
          idBack: validatedData.documents.idBack,
          businessCertificate: validatedData.documents.businessCertificate,
          isVerified: false,
        },
      });

      // Crear proveedor según el tipo
      if (providerType === 'maintenance') {
        const maintenanceProvider = await tx.maintenanceProvider.create({
          data: {
            userId: user.id,
            businessName: validatedData.businessName,
            rut: validatedData.rut,
            specialty: validatedData.specialty,
            specialties: JSON.stringify(validatedData.specialties),
            hourlyRate: validatedData.hourlyRate,
            address: validatedData.address,
            city: validatedData.city,
            region: validatedData.region,
            description: validatedData.description,
            status: 'PENDING_VERIFICATION',
            isVerified: false,
            availability: JSON.stringify({}), // Horarios vacíos por defecto
          },
        });

        // Vincular documentos
        await tx.providerDocuments.update({
          where: { id: documents.id },
          data: { maintenanceProviderId: maintenanceProvider.id },
        });

        return { user, maintenanceProvider, bankAccount, documents };
      } else {
        const serviceProvider = await tx.serviceProvider.create({
          data: {
            userId: user.id,
            businessName: validatedData.businessName,
            rut: validatedData.rut,
            serviceType: validatedData.serviceType,
            serviceTypes: JSON.stringify(validatedData.serviceTypes),
            basePrice: validatedData.basePrice,
            address: validatedData.address,
            city: validatedData.city,
            region: validatedData.region,
            description: validatedData.description,
            status: 'PENDING_VERIFICATION',
            isVerified: false,
            availability: JSON.stringify({}), // Horarios vacíos por defecto
          },
        });

        // Vincular documentos
        await tx.providerDocuments.update({
          where: { id: documents.id },
          data: { serviceProviderId: serviceProvider.id },
        });

        return { user, serviceProvider, bankAccount, documents };
      }
    });

    return NextResponse.json({
      message: 'Proveedor registrado exitosamente. Pendiente de verificación.',
      provider: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        status: 'PENDING_VERIFICATION',
      },
    }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}
