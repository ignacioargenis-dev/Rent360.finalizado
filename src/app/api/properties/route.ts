import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

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
    // Verificar autenticación y roles permitidos (OWNER, ADMIN, BROKER)
    const decoded = await requireAnyRole(request, ['OWNER', 'ADMIN', 'BROKER']);

    const startTime = Date.now();

    // Parsear FormData para archivos
    const formData = await request.formData();

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

    const validationResult = propertySchema.safeParse(propertyData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message);
      return NextResponse.json({ error: errorMessages.join(', ') }, { status: 400 });
    }

    // Determinar el ownerId basado en el rol del usuario
    let ownerId: string;
    let brokerId: string | null = null;

    if (decoded.role === 'OWNER') {
      // Si es OWNER, él mismo es el propietario
      ownerId = decoded.id;
    } else if (decoded.role === 'BROKER' || decoded.role === 'ADMIN') {
      // Si es BROKER o ADMIN, debe especificar el propietario (o usar su propio ID como fallback)
      ownerId = decoded.id; // Por ahora usar el ID del usuario, pero esto debería cambiarse para permitir especificar otro propietario
      brokerId = decoded.role === 'BROKER' ? decoded.id : null;
    } else {
      ownerId = decoded.id;
    }

    // Verificar configuración de aprobación automática
    const autoApprovalSetting = await db.systemSetting.findFirst({
      where: {
        category: 'property_approval',
        key: 'auto_approval_enabled',
      },
    });

    const isAutoApprovalEnabled = autoApprovalSetting?.value === 'true';

    // Crear propiedad en la base de datos
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

    // Procesar imágenes si existen
    const images = formData.getAll('images') as File[];
    if (images && images.length > 0) {
      const imageUrls: string[] = [];

      for (const image of images) {
        if (image instanceof File) {
          try {
            // Generar nombre único para la imagen
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 15);
            const extension = image.name.split('.').pop() || 'jpg';
            const filename = `${timestamp}-${randomId}.${extension}`;

            // Crear directorio específico para la propiedad si no existe
            const propertyUploadDir = `public/uploads/properties/${newProperty.id}`;
            const fs = require('fs').promises;
            const path = require('path');

            try {
              await fs.mkdir(propertyUploadDir, { recursive: true });
            } catch (error) {
              // El directorio ya existe o hay otro error
            }

            const filepath = path.join(propertyUploadDir, filename);

            // Convertir File a Buffer y guardar
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await fs.writeFile(filepath, buffer);

            // Crear URL accesible desde el navegador
            const imageUrl = `/uploads/properties/${newProperty.id}/${filename}`;
            imageUrls.push(imageUrl);

            logger.info('Image saved successfully', {
              propertyId: newProperty.id,
              filename,
              originalName: image.name,
              size: image.size,
            });
          } catch (imageError) {
            logger.error('Error saving image', {
              error: imageError instanceof Error ? imageError.message : String(imageError),
              propertyId: newProperty.id,
              imageName: image.name,
            });
            // Continuar sin esta imagen en lugar de fallar completamente
          }
        }
      }

      // Actualizar propiedad con URLs de imágenes
      if (imageUrls.length > 0) {
        await db.property.update({
          where: { id: newProperty.id },
          data: { images: JSON.stringify(imageUrls) },
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
    logger.error('Error creating property:', {
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

export async function GET(request: NextRequest) {
  try {
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
      where.status = status;
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
        ? (Array.isArray(property.images) ? property.images : JSON.parse(property.images)).map(
            (img: string) => {
              // Si la imagen ya tiene la ruta correcta de API, no hacer nada
              if (img.startsWith('/api/uploads/')) {
                return img;
              }
              // Si empieza con /images/, convertir a /api/uploads/
              if (img.startsWith('/images/')) {
                return img.replace('/images/', '/api/uploads/');
              }
              // Si empieza con /uploads/, convertir a /api/uploads/
              if (img.startsWith('/uploads/')) {
                return img.replace('/uploads/', '/api/uploads/');
              }
              // Si es una ruta relativa, asumir que está en uploads
              if (!img.startsWith('http') && !img.startsWith('/')) {
                return `/api/uploads/${img}`;
              }
              // Para cualquier otro caso, devolver tal como está
              return img;
            }
          )
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
