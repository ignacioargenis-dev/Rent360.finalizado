import express from 'express';
import { z } from 'zod';
import { Property } from '../models/Property';
import { authenticate } from '../middleware/auth';
import { validateOwnership } from '../middleware/ownership';
import logger from '../logger';

const router = express.Router();

// Esquemas de validación
const createPropertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  commune: z.string().min(2).max(100),
  region: z.string().min(2).max(100),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  price: z.number().positive(),
  deposit: z.number().min(0),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area: z.number().positive(),
  type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']),
  images: z.array(z.string().url()).default([]),
  features: z.array(z.string().max(100)).default([]),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 1).optional(),
  parking: z.number().int().min(0).default(0),
  furnished: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  brokerId: z.string().optional()
});

const updatePropertySchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().min(5).max(300).optional(),
  city: z.string().min(2).max(100).optional(),
  commune: z.string().min(2).max(100).optional(),
  region: z.string().min(2).max(100).optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  price: z.number().positive().optional(),
  deposit: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  area: z.number().positive().optional(),
  type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']).optional(),
  images: z.array(z.string().url()).optional(),
  features: z.array(z.string().max(100)).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 1).optional(),
  parking: z.number().int().min(0).optional(),
  furnished: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'PENDING', 'MAINTENANCE', 'INACTIVE']).optional(),
  brokerId: z.string().optional()
});

const searchQuerySchema = z.object({
  search: z.string().max(100).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  city: z.string().min(2).max(100).optional(),
  commune: z.string().min(2).max(100).optional(),
  type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']).optional(),
  furnished: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  sortBy: z.enum(['price', 'area', 'bedrooms', 'createdAt', 'views']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
});

// GET /api/v1/properties - Listar propiedades
router.get('/', async (req, res) => {
  try {
    const queryParams = searchQuerySchema.parse({
      ...req.query,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minArea: req.query.minArea ? parseFloat(req.query.minArea as string) : undefined,
      maxArea: req.query.maxArea ? parseFloat(req.query.maxArea as string) : undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      features: req.query.features ? (req.query.features as string).split(',') : undefined
    });

    const skip = (queryParams.page - 1) * queryParams.limit;

    const filters = {
      search: queryParams.search,
      minPrice: queryParams.minPrice,
      maxPrice: queryParams.maxPrice,
      minArea: queryParams.minArea,
      maxArea: queryParams.maxArea,
      bedrooms: queryParams.bedrooms,
      bathrooms: queryParams.bathrooms,
      city: queryParams.city,
      commune: queryParams.commune,
      type: queryParams.type,
      furnished: queryParams.furnished,
      petsAllowed: queryParams.petsAllowed,
      features: queryParams.features
    };

    const sort: any = {};
    sort[queryParams.sortBy] = queryParams.sortOrder === 'asc' ? 1 : -1;

    const options = {
      sort,
      skip,
      limit: queryParams.limit
    };

    const properties = await Property.find(filters, null, options);
    const total = await Property.countDocuments(filters);

    const result = properties.map(property => ({
      ...property,
      id: property._id
    }));

    logger.info('Properties listed successfully', {
      count: result.length,
      total,
      filters
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        pages: Math.ceil(total / queryParams.limit)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros de búsqueda inválidos',
        details: error.errors
      });
    }

    logger.error('Error listing properties:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/v1/properties/:id - Obtener propiedad específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    // TODO: Implementar contador de vistas
    // await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });

    logger.info('Property retrieved successfully', {
      propertyId: id,
      title: property.title
    });

    res.json({
      success: true,
      data: {
        ...property.toObject(),
        id: property._id
      }
    });

  } catch (error) {
    logger.error('Error retrieving property:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/v1/properties - Crear nueva propiedad
router.post('/', authenticate, async (req: any, res) => {
  try {
    const parsedData = createPropertySchema.parse(req.body);
    const propertyData: any = { ...parsedData };

    // Verificar permisos (solo OWNER o BROKER pueden crear propiedades)
    if (!['OWNER', 'BROKER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear propiedades'
      });
    }

    // Para OWNER, el ownerId debe ser el usuario actual
    if (req.user.role === 'OWNER') {
      propertyData.ownerId = req.user.userId;
    }

    // Para BROKER, puede especificar el ownerId o usar el suyo
    if (req.user.role === 'BROKER') {
      propertyData.brokerId = req.user.userId;
    }

    const property = new Property(propertyData);
    await property.save();

    logger.info('Property created successfully', {
      propertyId: property._id,
      ownerId: property.ownerId,
      title: property.title,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Propiedad creada exitosamente',
      data: {
        ...property.toObject(),
        id: property._id
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de propiedad inválidos',
        details: error.errors
      });
    }

    logger.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/v1/properties/:id - Actualizar propiedad
router.put('/:id', authenticate, validateOwnership, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = updatePropertySchema.parse(req.body);

    const property = await Property.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    logger.info('Property updated successfully', {
      propertyId: id,
      title: property.title,
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Propiedad actualizada exitosamente',
      data: {
        ...property.toObject(),
        id: property._id
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de actualización inválidos',
        details: error.errors
      });
    }

    logger.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/v1/properties/:id - Eliminar propiedad
router.delete('/:id', authenticate, validateOwnership, async (req: any, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    logger.info('Property deleted successfully', {
      propertyId: id,
      title: property.title,
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Propiedad eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/v1/properties/:id/stats - Obtener estadísticas de propiedad
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    // Aquí podríamos calcular estadísticas más complejas
    // Por ahora devolvemos datos básicos
    const stats = {
      views: property.views,
      favorites: property.favorites,
      daysSinceCreation: Math.floor((Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      lastViewed: property.lastViewed
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting property stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export { router as propertyRoutes };
