import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'TENANT' | 'OWNER' | 'BROKER' | 'RUNNER' | 'SUPPORT' | 'ADMIN';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    required: true,
    enum: ['TENANT', 'OWNER', 'BROKER', 'RUNNER', 'SUPPORT', 'ADMIN'],
    default: 'TENANT'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Índices para optimización
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Método para obtener información pública del usuario
UserSchema.methods.toPublic = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

// Método para verificar si el usuario tiene un rol específico
UserSchema.methods.hasRole = function(role: string): boolean {
  return this.role === role;
};

// Método para verificar si el usuario tiene permisos administrativos
UserSchema.methods.isAdmin = function(): boolean {
  return ['ADMIN', 'SUPPORT'].includes(this.role);
};

// Método para verificar si el usuario puede acceder a recursos específicos
UserSchema.methods.canAccess = function(resource: string, action: string): boolean {
  const permissions: Record<string, Record<string, string[]>> = {
    ADMIN: {
      users: ['read', 'write', 'delete'],
      properties: ['read', 'write', 'delete'],
      contracts: ['read', 'write', 'delete'],
      payments: ['read', 'write', 'delete'],
      system: ['read', 'write', 'delete']
    },
    SUPPORT: {
      users: ['read'],
      properties: ['read', 'write'],
      contracts: ['read', 'write'],
      payments: ['read'],
      system: ['read']
    },
    OWNER: {
      properties: ['read', 'write'],
      contracts: ['read', 'write'],
      payments: ['read']
    },
    BROKER: {
      properties: ['read'],
      contracts: ['read', 'write'],
      payments: ['read']
    },
    TENANT: {
      properties: ['read'],
      contracts: ['read'],
      payments: ['read', 'write']
    },
    RUNNER: {
      properties: ['read'],
      contracts: ['read']
    }
  };

  const userPermissions = permissions[this.role] || {};
  const resourcePermissions = userPermissions[resource] || [];

  return resourcePermissions.includes(action);
};

// Pre-save middleware para hashear contraseña
UserSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) return next();

  try {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método estático para buscar usuarios por rol
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

// Método estático para obtener estadísticas de usuarios
UserSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc: any, stat: any) => {
    acc[stat._id.toLowerCase()] = stat.count;
    return acc;
  }, {});
};

export const User = mongoose.model<IUser>('User', UserSchema);
