import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description?: string;
  address: string;
  city: string;
  commune: string;
  region: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  price: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  area: number; // m²
  type: 'HOUSE' | 'APARTMENT' | 'OFFICE' | 'WAREHOUSE' | 'LAND' | 'COMMERCIAL';
  status: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'MAINTENANCE' | 'INACTIVE';
  images: string[];
  features: string[];
  yearBuilt?: number;
  parking?: number;
  furnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  ownerId: string;
  brokerId?: string;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
  lastViewed?: Date;
}

const PropertySchema = new Schema<IProperty>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  city: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  commune: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  region: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  deposit: {
    type: Number,
    required: true,
    min: 0
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    index: true
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  area: {
    type: Number,
    required: true,
    min: 1,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['AVAILABLE', 'RENTED', 'PENDING', 'MAINTENANCE', 'INACTIVE'],
    default: 'AVAILABLE',
    index: true
  },
  images: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  yearBuilt: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear() + 1
  },
  parking: {
    type: Number,
    min: 0,
    default: 0
  },
  furnished: {
    type: Boolean,
    default: false,
    index: true
  },
  petsAllowed: {
    type: Boolean,
    default: false,
    index: true
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  brokerId: {
    type: String,
    index: true
  },
  views: {
    type: Number,
    default: 0,
    index: true
  },
  favorites: {
    type: Number,
    default: 0,
    index: true
  },
  lastViewed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'properties'
});

// Índices compuestos para búsquedas eficientes
PropertySchema.index({ city: 1, status: 1 });
PropertySchema.index({ type: 1, status: 1 });
PropertySchema.index({ price: 1, status: 1 });
PropertySchema.index({ area: 1, status: 1 });
PropertySchema.index({ bedrooms: 1, status: 1 });
PropertySchema.index({ ownerId: 1, status: 1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ updatedAt: -1 });
PropertySchema.index({ lastViewed: -1 });

// Índice geoespacial para búsquedas por ubicación
PropertySchema.index({ 'coordinates': '2dsphere' });

// Método para obtener información pública de la propiedad
PropertySchema.methods.toPublic = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    address: this.address,
    city: this.city,
    commune: this.commune,
    region: this.region,
    coordinates: this.coordinates,
    price: this.price,
    deposit: this.deposit,
    bedrooms: this.bedrooms,
    bathrooms: this.bathrooms,
    area: this.area,
    type: this.type,
    status: this.status,
    images: this.images,
    features: this.features,
    yearBuilt: this.yearBuilt,
    parking: this.parking,
    furnished: this.furnished,
    petsAllowed: this.petsAllowed,
    smokingAllowed: this.smokingAllowed,
    ownerId: this.ownerId,
    brokerId: this.brokerId,
    views: this.views,
    favorites: this.favorites,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Método para incrementar vistas
PropertySchema.methods.incrementViews = async function() {
  this.views += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Método para verificar si la propiedad está disponible
PropertySchema.methods.isAvailable = function(): boolean {
  return this.status === 'AVAILABLE';
};

// Método para verificar si el usuario puede editar la propiedad
PropertySchema.methods.canBeEditedBy = function(userId: string, userRole: string): boolean {
  if (userRole === 'ADMIN' || userRole === 'SUPPORT') return true;
  if (userRole === 'OWNER' && this.ownerId === userId) return true;
  if (userRole === 'BROKER' && this.brokerId === userId) return true;
  return false;
};

// Método estático para búsqueda avanzada
PropertySchema.statics.advancedSearch = function(filters: any, options: any = {}) {
  const query: any = { status: 'AVAILABLE' };

  // Filtros de precio
  if (filters.minPrice) query.price = { ...query.price, $gte: filters.minPrice };
  if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };

  // Filtros de área
  if (filters.minArea) query.area = { ...query.area, $gte: filters.minArea };
  if (filters.maxArea) query.area = { ...query.area, $lte: filters.maxArea };

  // Filtros de habitaciones y baños
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };

  // Filtros de texto
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { address: { $regex: filters.search, $options: 'i' } },
      { city: { $regex: filters.search, $options: 'i' } },
      { commune: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Filtros específicos
  if (filters.city) query.city = { $regex: filters.city, $options: 'i' };
  if (filters.commune) query.commune = { $regex: filters.commune, $options: 'i' };
  if (filters.type) query.type = filters.type;
  if (filters.furnished !== undefined) query.furnished = filters.furnished;
  if (filters.petsAllowed !== undefined) query.petsAllowed = filters.petsAllowed;

  // Características
  if (filters.features && filters.features.length > 0) {
    query.features = { $in: filters.features };
  }

  // Opciones de consulta
  const queryOptions = {
    sort: options.sort || { createdAt: -1 },
    limit: Math.min(options.limit || 20, 100),
    skip: options.skip || 0,
    lean: true
  };

  return this.find(query, null, queryOptions);
};

// Método estático para obtener estadísticas
PropertySchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgArea: { $avg: '$area' },
        totalViews: { $sum: '$views' },
        totalFavorites: { $sum: '$favorites' }
      }
    }
  ]);

  const result: any = {};
  stats.forEach(stat => {
    result[stat._id.toLowerCase()] = {
      count: stat.count,
      avgPrice: Math.round(stat.avgPrice),
      avgArea: Math.round(stat.avgArea),
      totalViews: stat.totalViews,
      totalFavorites: stat.totalFavorites
    };
  });

  return result;
};

// Método estático para propiedades populares
PropertySchema.statics.getPopular = function(limit: number = 10) {
  return this.find({ status: 'AVAILABLE' })
    .sort({ views: -1, favorites: -1 })
    .limit(limit)
    .lean();
};

// Método estático para propiedades recientes
PropertySchema.statics.getRecent = function(limit: number = 10) {
  return this.find({ status: 'AVAILABLE' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const Property = mongoose.model<IProperty>('Property', PropertySchema);
