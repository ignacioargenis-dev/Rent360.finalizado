import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Obtener configuraciones del usuario desde el campo bio
    const userWithSettings = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, bio: true, role: true },
    });

    let settings = {};

    if (userWithSettings?.bio) {
      try {
        settings = JSON.parse(userWithSettings.bio);
      } catch (parseError) {
        logger.warn('Error parsing user settings from bio:', { parseError });
        // Usar valores por defecto si hay error de parsing
      }
    }

    // Valores por defecto según el rol
    const defaultSettings = getDefaultSettings(user.role);

    // Merge settings del usuario con valores por defecto
    const userSettings = { ...defaultSettings, ...settings };

    return NextResponse.json({
      success: true,
      settings: userSettings,
    });
  } catch (error) {
    logger.error('Error obteniendo configuraciones de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Obtener configuraciones actuales del usuario
    const userWithSettings = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, bio: true, role: true },
    });

    let currentSettings = {};

    if (userWithSettings?.bio) {
      try {
        currentSettings = JSON.parse(userWithSettings.bio);
      } catch (parseError) {
        logger.warn('Error parsing current user settings:', { parseError });
      }
    }

    // Merge configuraciones actuales con las nuevas (preservar campos existentes)
    const updatedSettings = { ...currentSettings, ...body };

    // Para roles específicos, agregar campos adicionales si no existen
    if (user.role === 'RUNNER') {
      if (!updatedSettings.workArea) {
        updatedSettings.workArea = {
          experience: '',
          specialties: [],
          languages: ['Español'],
          hourlyRate: 0,
          availability: 'available',
          services: [],
          responseTime: '',
          regions: [],
          communes: [],
        };
      }
    }

    // Guardar en el campo bio del usuario
    await db.user.update({
      where: { id: user.id },
      data: {
        bio: JSON.stringify(updatedSettings),
      },
    });

    logger.info('Configuraciones de usuario guardadas:', {
      userId: user.id,
      role: user.role,
      hasNotifications: !!body.notifications,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuraciones guardadas exitosamente',
    });
  } catch (error) {
    logger.error('Error guardando configuraciones de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function getDefaultSettings(role: string) {
  const baseSettings = {
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      jobReminders: true,
      paymentReminders: true,
      ratingUpdates: true,
      newInquiries: true,
      appointmentReminders: true,
      contractUpdates: true,
      paymentNotifications: true,
      marketingEmails: false,
    },
  };

  // Configuraciones específicas por rol
  switch (role) {
    case 'TENANT':
      return {
        ...baseSettings,
        notifications: {
          ...baseSettings.notifications,
          newInquiries: true,
          appointmentReminders: false,
          contractUpdates: true,
          paymentNotifications: true,
        },
      };

    case 'OWNER':
      return {
        ...baseSettings,
        notifications: {
          ...baseSettings.notifications,
          newInquiries: true,
          contractUpdates: true,
          paymentNotifications: true,
        },
      };

    case 'BROKER':
      return {
        ...baseSettings,
        notifications: {
          ...baseSettings.notifications,
          newInquiries: true,
          appointmentReminders: true,
          contractUpdates: true,
          paymentNotifications: true,
        },
      };

    case 'PROVIDER':
      return {
        ...baseSettings,
        notifications: {
          ...baseSettings.notifications,
          jobReminders: true,
          paymentReminders: true,
          ratingUpdates: true,
        },
      };

    case 'MAINTENANCE':
      return {
        ...baseSettings,
        notifications: {
          ...baseSettings.notifications,
          jobReminders: true,
          paymentReminders: true,
          ratingUpdates: true,
        },
      };

    case 'RUNNER':
      return {
        ...baseSettings,
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          jobReminders: true,
          paymentReminders: true,
          ratingUpdates: true,
        },
      };

    default:
      return baseSettings;
  }
}
