/**
 * Prospect Hooks
 *
 * Hooks automáticos que se ejecutan cuando hay cambios en prospects
 * para mantener datos actualizados y disparar acciones automáticas
 */

import { LeadScoringService } from './lead-scoring-service';
import { logger } from './logger-minimal';
import { db } from './db';

export class ProspectHooks {
  /**
   * Hook que se ejecuta después de cualquier actividad de un prospect
   * Recalcula automáticamente el lead score
   */
  static async onProspectActivity(prospectId: string): Promise<void> {
    try {
      logger.info('Ejecutando hook onProspectActivity', { prospectId });

      // Recalcular lead score de forma asíncrona
      LeadScoringService.updateProspectScore(prospectId)
        .then(() => {
          logger.info('Lead score actualizado automáticamente', { prospectId });
        })
        .catch(error => {
          logger.error('Error actualizando lead score en hook', {
            error: error instanceof Error ? error.message : String(error),
            prospectId,
          });
        });
    } catch (error) {
      logger.error('Error en hook onProspectActivity', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando un prospect ve una propiedad
   */
  static async onPropertyViewed(
    prospectId: string,
    propertyId: string,
    brokerId: string
  ): Promise<void> {
    try {
      logger.info('Ejecutando hook onPropertyViewed', {
        prospectId,
        propertyId,
      });

      // Actualizar última fecha de contacto
      await db.brokerProspect.update({
        where: { id: prospectId },
        data: {
          lastContactDate: new Date(),
        },
      });

      // Recalcular lead score
      await this.onProspectActivity(prospectId);

      // Crear actividad
      await db.prospectActivity.create({
        data: {
          prospectId,
          brokerId,
          activityType: 'property_view',
          title: `Vio la propiedad`,
          description: `Vio la propiedad`,
          metadata: JSON.stringify({
            propertyId,
            viewedAt: new Date(),
          }),
        },
      });

      logger.info('Hook onPropertyViewed completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onPropertyViewed', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
        propertyId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando se comparte una propiedad con un prospect
   */
  static async onPropertyShared(
    prospectId: string,
    propertyId: string,
    brokerId: string
  ): Promise<void> {
    try {
      logger.info('Ejecutando hook onPropertyShared', {
        prospectId,
        propertyId,
      });

      // Incrementar contador de propiedades compartidas
      await db.brokerProspect.update({
        where: { id: prospectId },
        data: {
          propertiesShared: {
            increment: 1,
          },
          lastContactDate: new Date(),
        },
      });

      // Recalcular lead score
      await this.onProspectActivity(prospectId);

      logger.info('Hook onPropertyShared completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onPropertyShared', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
        propertyId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando se envía un email a un prospect
   */
  static async onEmailSent(prospectId: string): Promise<void> {
    try {
      logger.info('Ejecutando hook onEmailSent', { prospectId });

      // Incrementar contador de emails enviados
      await db.brokerProspect.update({
        where: { id: prospectId },
        data: {
          emailsSent: {
            increment: 1,
          },
        },
      });

      // Recalcular lead score
      await this.onProspectActivity(prospectId);

      logger.info('Hook onEmailSent completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onEmailSent', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando un prospect abre un email
   */
  static async onEmailOpened(prospectId: string): Promise<void> {
    try {
      logger.info('Ejecutando hook onEmailOpened', { prospectId });

      // Incrementar contador de emails abiertos
      await db.brokerProspect.update({
        where: { id: prospectId },
        data: {
          emailsOpened: {
            increment: 1,
          },
          lastContactDate: new Date(),
        },
      });

      // Recalcular lead score
      await this.onProspectActivity(prospectId);

      logger.info('Hook onEmailOpened completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onEmailOpened', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando se crea una nueva actividad
   */
  static async onActivityCreated(prospectId: string, activityType: string): Promise<void> {
    try {
      logger.info('Ejecutando hook onActivityCreated', {
        prospectId,
        activityType,
      });

      // Actualizar contador de contactos si es una actividad de contacto
      const contactActivities = ['call', 'meeting', 'email', 'message'];
      if (contactActivities.includes(activityType)) {
        await db.brokerProspect.update({
          where: { id: prospectId },
          data: {
            contactCount: {
              increment: 1,
            },
            lastContactDate: new Date(),
          },
        });
      }

      // Recalcular lead score
      await this.onProspectActivity(prospectId);

      logger.info('Hook onActivityCreated completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onActivityCreated', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
        activityType,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando cambia el estado de un prospect
   */
  static async onStatusChanged(
    prospectId: string,
    oldStatus: string,
    newStatus: string,
    brokerId: string
  ): Promise<void> {
    try {
      logger.info('Ejecutando hook onStatusChanged', {
        prospectId,
        oldStatus,
        newStatus,
      });

      // Crear actividad del cambio de estado
      await db.prospectActivity.create({
        data: {
          prospectId,
          brokerId,
          activityType: 'status_change',
          title: `Estado cambió de ${oldStatus} a ${newStatus}`,
          description: `Estado cambió de ${oldStatus} a ${newStatus}`,
          metadata: JSON.stringify({
            oldStatus,
            newStatus,
            changedAt: new Date(),
          }),
        },
      });

      // Recalcular lead score (el estado afecta el score)
      await this.onProspectActivity(prospectId);

      // Si se convirtió, crear notificación especial
      if (newStatus === 'CONVERTED') {
        const prospect = await db.brokerProspect.findUnique({
          where: { id: prospectId },
          select: { name: true },
        });

        const { NotificationService } = await import('./notification-service');
        await NotificationService.create({
          userId: brokerId,
          type: 'PROSPECT_CONVERTED',
          title: '🎉 ¡Prospect Convertido!',
          message: `${prospect?.name || 'El prospect'} se ha convertido en cliente`,
          link: `/broker/prospects/${prospectId}`,
          metadata: {
            prospectId,
            convertedAt: new Date(),
          },
          priority: 'high',
        });
      }

      logger.info('Hook onStatusChanged completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onStatusChanged', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
    }
  }

  /**
   * Hook que se ejecuta cuando un prospect se crea
   */
  static async onProspectCreated(prospectId: string, brokerId: string): Promise<void> {
    try {
      logger.info('Ejecutando hook onProspectCreated', { prospectId });

      // Calcular lead score inicial
      await LeadScoringService.updateProspectScore(prospectId);

      // Crear notificación para el broker
      const prospect = await db.brokerProspect.findUnique({
        where: { id: prospectId },
        select: { name: true, prospectType: true },
      });

      const { NotificationService } = await import('./notification-service');
      await NotificationService.create({
        userId: brokerId,
        type: 'PROSPECT_ACTIVITY',
        title: '✨ Nuevo Prospect',
        message: `Nuevo prospect agregado: ${prospect?.name || 'Sin nombre'}`,
        link: `/broker/prospects/${prospectId}`,
        metadata: {
          prospectId,
          prospectType: prospect?.prospectType,
          createdAt: new Date(),
        },
        priority: 'medium',
      });

      logger.info('Hook onProspectCreated completado', { prospectId });
    } catch (error) {
      logger.error('Error en hook onProspectCreated', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
    }
  }
}
