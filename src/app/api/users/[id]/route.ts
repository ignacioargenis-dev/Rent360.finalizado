import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import sqlite3 from 'sqlite3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;
    
    // Solo admin puede ver otros usuarios, los usuarios solo pueden verse a sí mismos
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este usuario' },
        { status: 403 },
      );
    }
    
    const targetUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      
      db.get(
        'SELECT id, name, email, role, isActive, avatar, createdAt FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        },
      );
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }
    
    return NextResponse.json({ user: targetUser });
  } catch (error) {
    logger.error('Error al obtener usuario:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;
    
    // Verificar permisos
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este usuario' },
        { status: 403 },
      );
    }
    
    const data = await request.json();
    
    const {
      name,
      email,
      isActive,
    } = data;
    
    // Verificar si el usuario existe
    const existingUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      
      db.get(
        'SELECT id FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        },
      );
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }
    
    // Actualizar usuario base
    const updatedUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      const updateFields: any[] = [];
      const updateValues: any[] = [];
      
      if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (typeof isActive === 'boolean') {
        updateFields.push('isActive = ?');
        updateValues.push(isActive);
      }
      
      if (updateFields.length === 0) {
        db.close();
        resolve(existingUser);
        return;
      }
      
      updateFields.push('updatedAt = datetime("now")');
      updateValues.push(userId);
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.run(query, updateValues, function(err) {
        if (err) {
          db.close();
          reject(err);
        } else {
          db.get(
            'SELECT id, name, email, role, isActive, avatar, createdAt FROM users WHERE id = ?',
            [userId],
            (err, row) => {
              db.close();
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            },
          );
        }
      });
    });
    
    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireRole(request, 'admin');
    const userId = params.id;
    
    const data = await request.json();
    
    // Verificar si el usuario existe
    const targetUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      
      db.get(
        'SELECT id FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        },
      );
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }
    
    // No permitir modificar al propio usuario admin
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'No puedes modificar tu propio usuario' },
        { status: 400 },
      );
    }
    
    const updatedUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      const updateFields: any[] = [];
      const updateValues: any[] = [];
      
      Object.keys(data).forEach(key => {
        if (['name', 'email', 'role', 'isActive'].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      });
      
      if (updateFields.length === 0) {
        db.close();
        resolve(targetUser);
        return;
      }
      
      updateFields.push('updatedAt = datetime("now")');
      updateValues.push(userId);
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.run(query, updateValues, function(err) {
        if (err) {
          db.close();
          reject(err);
        } else {
          db.get(
            'SELECT id, name, email, role, isActive, avatar, createdAt FROM users WHERE id = ?',
            [userId],
            (err, row) => {
              db.close();
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            },
          );
        }
      });
    });
    
    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireRole(request, 'admin');
    const userId = params.id;
    
    // Verificar si el usuario existe
    const targetUser = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      
      db.get(
        'SELECT id FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        },
      );
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }
    
    // No permitir eliminar al propio usuario admin
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 },
      );
    }
    
    // Eliminar usuario
    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('/home/z/my-project/dev.db');
      
      db.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        function(err) {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        },
      );
    });
    
    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar usuario:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}