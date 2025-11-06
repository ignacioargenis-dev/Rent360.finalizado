import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';
import { ensurePropertyDirectory } from '@/lib/property-directory';
import { getCloudStorageService, generateFileKey } from '@/lib/cloud-storage';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Validation schema
const propertySchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres'),
  address: z
    .string()
    .min(5, 'La dirección es requerida')
    .max(300, 'La dirección no puede exceder 300 caracteres'),
  city: z
    .string()
    .min(2, 'La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
  commune: z
    .string()
    .min(2, 'La comuna es requerida')
    .max(100, 'La comuna no puede exceder 100 caracteres'),
  region: z
    .string()
    .min(2, 'La región es requerida')
    .max(100, 'La región no puede exceder 100 caracteres'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  deposit: z.number().min(0, 'El depósito no puede ser negativo'),
  bedrooms: z
    .number()
    .int()
    .min(0, 'Los dormitorios no pueden ser negativos')
    .max(20, 'Máximo 20 dormitorios'),
  bathrooms: z
    .number()
    .int()
    .min(0, 'Los baños no pueden ser negativos')
    .max(20, 'Máximo 20 baños'),
  area: z
    .number()
    .min(1, 'El área debe ser mayor a 0')
    .max(10000, 'El área no puede exceder 10000 m²'),
  type: z.string().min(1, 'El tipo es requerido'),
  status: z.string().optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🏠 [PROPERTIES] Iniciando POST /api/properties');

    // Verificar autenticación y roles permitidos (OWNER, ADMIN, BROKER)
    const decoded = await requireAnyRole(request, ['OWNER', 'ADMIN', 'BROKER']);

    console.log('✅ [PROPERTIES] Usuario autenticado:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    const startTime = Date.now();

    // Parsear FormData para archivos
    console.log('📋 [PROPERTIES] Parseando FormData...');
    const formData = await request.formData();
    console.log('✅ [PROPERTIES] FormData parseado correctamente');

    // Extraer datos del formulario
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const commune = formData.get('commune') as string;
    const region = formData.get('region') as string;
    const price = parseFloat(formData.get('price') as string);
    const deposit = parseFloat((formData.get('deposit') as string) || '0');
    const bedrooms = parseInt(formData.get('bedrooms') as string);
    const bathrooms = parseInt(formData.get('bathrooms') as string);
    const area = parseFloat(formData.get('area') as string);
    const type = formData.get('type') as string;

    // Campos opcionales que pueden no estar en el esquema
    const featuresStr = formData.get('features') as string;
    const features = featuresStr ? JSON.parse(featuresStr) : [];

    // Nuevos campos de características
    const furnished = formData.get('furnished') === 'true';
    const petFriendly = formData.get('petFriendly') === 'true';
    const parkingSpaces = parseInt(formData.get('parkingSpaces') as string) || 0;
    const availableFrom = formData.get('availableFrom')
      ? new Date(formData.get('availableFrom') as string)
      : undefined;
    const floor = formData.get('floor') ? parseInt(formData.get('floor') as string) : undefined;
    const buildingName = (formData.get('buildingName') as string) || undefined;
    const yearBuilt = formData.get('yearBuilt')
      ? parseInt(formData.get('yearBuilt') as string)
      : undefined;

    // Características del edificio/servicios
    const heating = formData.get('heating') === 'true';
    const cooling = formData.get('cooling') === 'true';
    const internet = formData.get('internet') === 'true';
    const elevator = formData.get('elevator') === 'true';
    const balcony = formData.get('balcony') === 'true';
    const terrace = formData.get('terrace') === 'true';
    const garden = formData.get('garden') === 'true';
    const pool = formData.get('pool') === 'true';
    const gym = formData.get('gym') === 'true';
    const security = formData.get('security') === 'true';
    const concierge = formData.get('concierge') === 'true';

    // Validar datos con Zod
    console.log('🔍 [PROPERTIES] Validando datos con Zod...');
    const propertyData = {
      title,
      description,
      address,
      city,
      commune,
      region,
      price,
      deposit,
      bedrooms,
      bathrooms,
      area,
      type,
      status: 'PENDING' as const, // Todas las nuevas propiedades empiezan como pendientes
      features,
      // Nuevos campos
      furnished,
      petFriendly,
      parkingSpaces,
      availableFrom,
      floor,
      buildingName,
      yearBuilt,
      heating,
      cooling,
      internet,
      elevator,
      balcony,
      terrace,
      garden,
      pool,
      gym,
      security,
      concierge,
    };

    console.log('📝 [PROPERTIES] Datos a validar:', {
      title,
      type,
      price,
      bedrooms,
      bathrooms,
      area,
      city,
      commune,
    });

    const validationResult = propertySchema.safeParse(propertyData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message);
      console.error('❌ [PROPERTIES] Error de validación:', errorMessages);
      return NextResponse.json({ error: errorMessages.join(', ') }, { status: 400 });
    }

    console.log('✅ [PROPERTIES] Validación exitosa');

    // Determinar el ownerId basado en el rol del usuario
    let ownerId: string | null;
    let brokerId: string | null = null;

    if (decoded.role === 'OWNER') {
      // Si es OWNER, él mismo es el propietario
      ownerId = decoded.id;
    } else if (decoded.role === 'BROKER') {
      // Si es BROKER, puede especificar el propietario real o crear propiedades propias
      const specifiedOwnerId = formData.get('ownerId') as string;
      if (specifiedOwnerId && specifiedOwnerId.trim()) {
        // Verificar que el propietario especificado existe
        const ownerExists = await db.user.findUnique({
          where: { id: specifiedOwnerId.trim() },
          select: { id: true, role: true },
        });

        if (!ownerExists) {
          return NextResponse.json(
            { error: 'El propietario especificado no existe en el sistema' },
            { status: 400 }
          );
        }

        if (ownerExists.role !== 'OWNER') {
          return NextResponse.json(
            { error: 'El usuario especificado no tiene rol de propietario' },
            { status: 400 }
          );
        }

        ownerId = specifiedOwnerId.trim();
      } else {
        // ✅ CORREGIDO: Si no se especifica ownerId, la propiedad es propia del broker
        // Esto asegura que aparezca en el dashboard del broker como propiedad propia
        ownerId = decoded.id;
        logger.info('Broker creating own property', {
          brokerId: decoded.id,
          propertyTitle: title,
          ownerId: decoded.id,
        });
      }
      brokerId = decoded.id; // El broker se asigna como broker
    } else if (decoded.role === 'ADMIN') {
      // Si es ADMIN, puede crear propiedades para cualquier propietario
      const specifiedOwnerId = formData.get('ownerId') as string;
      if (specifiedOwnerId && specifiedOwnerId.trim()) {
        ownerId = specifiedOwnerId.trim();
      } else {
        // Admin puede crear propiedades sin propietario especificado (para testing)
        ownerId = decoded.id;
      }
      // Admin no se asigna como broker a menos que lo especifique
      const specifiedBrokerId = formData.get('brokerId') as string;
      brokerId = specifiedBrokerId && specifiedBrokerId.trim() ? specifiedBrokerId.trim() : null;
    } else {
      ownerId = decoded.id;
    }

    // ✅ CORREGIDO: Verificar configuración de aprobación automática
    // Buscar ambas claves posibles (la que usa el admin es 'autoApproveProperties' en categoría 'properties')
    const [autoApprovalSetting1, autoApprovalSetting2] = await Promise.all([
      db.systemSetting.findFirst({
        where: {
          category: 'property_approval',
          key: 'auto_approval_enabled',
        },
      }),
      db.systemSetting.findFirst({
        where: {
          category: 'properties',
          key: 'autoApproveProperties',
        },
      }),
    ]);

    const autoApprovalSetting = autoApprovalSetting1 || autoApprovalSetting2;
    // Verificar si está habilitado (value es string, puede ser 'true' o '1')
    const isAutoApprovalEnabled =
      autoApprovalSetting?.value === 'true' || autoApprovalSetting?.value === '1';

    console.log('✅ [PROPERTIES] Configuración de aprobación automática:', {
      found: !!autoApprovalSetting,
      key: autoApprovalSetting?.key,
      category: autoApprovalSetting?.category,
      value: autoApprovalSetting?.value,
      isEnabled: isAutoApprovalEnabled,
    });

    // Crear propiedad en la base de datos
    console.log('💾 [PROPERTIES] Creando propiedad en la base de datos...');
    console.log('📊 [PROPERTIES] OwnerId:', ownerId, 'BrokerId:', brokerId);

    const newProperty = await db.property.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        commune: commune.trim(),
        region: region.trim(),
        price,
        deposit,
        bedrooms,
        bathrooms,
        area,
        type,
        status: isAutoApprovalEnabled ? 'AVAILABLE' : 'PENDING',
        features: features ? JSON.stringify(features) : null,
        ownerId,
        brokerId,
        createdBy: decoded.id,
        // Nuevos campos - convertir undefined a null para compatibilidad con Prisma
        furnished,
        petFriendly,
        parkingSpaces,
        availableFrom: availableFrom || null,
        floor: floor || null,
        buildingName: buildingName || null,
        yearBuilt: yearBuilt || null,
        heating,
        cooling,
        internet,
        elevator,
        balcony,
        terrace,
        garden,
        pool,
        gym,
        security,
        concierge,
      },
    });

    console.log('✅ [PROPERTIES] Propiedad creada exitosamente:', {
      propertyId: newProperty.id,
      title: newProperty.title,
      status: newProperty.status,
    });

    // Procesar imágenes si existen usando cloud storage
    const images = formData.getAll('images') as File[];
    if (images && images.length > 0) {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const cloudStorage = getCloudStorageService();
      const uploadedImages: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        if (image instanceof File) {
          try {
            // Validar archivo
            if (image.size > maxFileSize) {
              logger.warn('Image file too large, skipping', {
                propertyId: newProperty.id,
                fileName: image.name,
                fileSize: image.size,
                maxSize: maxFileSize,
              });
              continue;
            }

            if (!allowedTypes.includes(image.type)) {
              logger.warn('Invalid image type, skipping', {
                propertyId: newProperty.id,
                fileName: image.name,
                fileType: image.type,
                allowedTypes,
              });
              continue;
            }

            // Generar nombre único para la imagen
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 15);
            const fileNameParts = image.name.split('.');
            const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
            const filename = `image_${i + 1}_${timestamp}_${randomId}.${extension}`;

            // Generar key para cloud storage
            const cloudKey = generateFileKey(newProperty.id, filename);

            logger.info('Uploading image to cloud storage', {
              propertyId: newProperty.id,
              cloudKey,
              originalName: image.name,
              fileSize: image.size,
            });

            // Subir a cloud storage
            const result = await cloudStorage.uploadFile(image, cloudKey, image.type);

            // Agregar URL a la lista de imágenes subidas
            uploadedImages.push(result.url);

            logger.info('Image uploaded successfully to cloud storage', {
              propertyId: newProperty.id,
              cloudKey,
              url: result.url,
              fileSize: image.size,
            });
          } catch (imageError) {
            logger.error('Error uploading image to cloud storage', {
              error: imageError instanceof Error ? imageError.message : String(imageError),
              propertyId: newProperty.id,
              imageName: image.name,
            });
            // Continuar sin esta imagen en lugar de fallar completamente
          }
        }
      }

      // Actualizar propiedad con URLs de imágenes de cloud storage
      if (uploadedImages.length > 0) {
        await db.property.update({
          where: { id: newProperty.id },
          data: { images: JSON.stringify(uploadedImages) },
        });

        logger.info('Property updated with cloud storage image URLs', {
          propertyId: newProperty.id,
          uploadedCount: uploadedImages.length,
          totalImages: uploadedImages.length,
        });
      }
    }

    // TODO: Agregar logs de auditoría y notificaciones cuando los servicios estén disponibles

    const endTime = Date.now();
    logger.info('Property created successfully', {
      propertyId: newProperty.id,
      ownerId: decoded.id,
      responseTime: endTime - startTime,
    });

    return NextResponse.json({
      success: true,
      property: {
        id: newProperty.id,
        title: newProperty.title,
        status: newProperty.status,
        createdAt: newProperty.createdAt,
      },
      message:
        'Propiedad creada exitosamente. Será revisada por nuestro equipo antes de ser publicada.',
    });
  } catch (error) {
    console.error('❌ [PROPERTIES] Error crítico:', error);

    logger.error('Error creating property:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Retornar error detallado para debug
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : String(error),
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ CORREGIDO: Autenticación opcional para acceso público
    let user: { id: string; role: string } | null = null;
    try {
      const authenticatedUser = await requireAuth(request);
      user = { id: authenticatedUser.id, role: authenticatedUser.role };
    } catch {
      // Si no hay autenticación, continuar sin usuario (acceso público)
      user = null;
    }

    const startTime = Date.now();

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const commune = searchParams.get('commune');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const includeManaged = searchParams.get('includeManaged') === 'true';

    // Construir filtros para la base de datos
    const where: any = {};

    // Filtros de búsqueda
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      if (includeManaged && status === 'AVAILABLE') {
        // Si includeManaged=true y status=AVAILABLE, incluir tanto AVAILABLE como MANAGED
        where.status = { in: ['AVAILABLE', 'MANAGED'] };
      } else {
        where.status = status;
      }
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (commune) {
      where.commune = { contains: commune, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms);
    }

    if (bathrooms) {
      where.bathrooms = parseInt(bathrooms);
    }

    if (minArea || maxArea) {
      where.area = {};
      if (minArea) {
        where.area.gte = parseFloat(minArea);
      }
      if (maxArea) {
        where.area.lte = parseFloat(maxArea);
      }
    }

    const skip = (page - 1) * limit;

    // Ejecutar consulta con paginación
    const [properties, totalCount] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          contracts: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.property.count({ where }),
    ]);

    // Formatear respuesta
    const formattedProperties = properties.map(property => ({
      id: property.id,
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      commune: property.commune,
      region: property.region,
      price: property.price,
      deposit: property.deposit,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      type: property.type,
      status: property.status,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images
        ? (Array.isArray(property.images) ? property.images : JSON.parse(property.images))
            .map((img: string) => {
              // Todas las imágenes ahora usan cloud storage - mantener URLs tal como están
              const imgStr = String(img ?? '');
              // Remover cualquier query parameter de cache busting anterior
              return (imgStr.split('?')[0] ?? '') as string;
            })
            .filter((imgPath: string) => imgPath && imgPath.trim().length > 0)
        : [],
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner,
      currentTenant: property.contracts[0]?.tenant || null,
      averageRating:
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0,
      totalReviews: property.reviews.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }));

    const paginatedProperties = formattedProperties;

    // Log performance (simulado)
    const endTime = Date.now();
    logger.info('Properties fetched successfully', {
      count: paginatedProperties.length,
      totalCount,
      page,
      limit,
      responseTime: endTime - startTime,
    });

    return NextResponse.json({
      properties: paginatedProperties,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      success: true,
    });
  } catch (error) {
    logger.error('Error fetching properties', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
