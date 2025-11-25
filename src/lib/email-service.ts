/**
 * Email Service
 *
 * Servicio para envío de emails transaccionales y marketing
 * Configurable para usar diferentes proveedores (SendGrid, Mailgun, Amazon SES, SMTP)
 *
 * ✅ ACTUALIZADO: Ahora lee configuraciones desde el admin con fallback a process.env
 */

import { logger } from './logger-minimal';
import { IntegrationConfigService } from './integration-config-service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * ✅ ACTUALIZADO: Obtiene configuración de email desde el admin o env vars
   */
  private static async getEmailConfig() {
    // Intentar cargar configuración de SMTP desde admin
    const smtpIntegration = await IntegrationConfigService.getIntegrationConfig('smtp');

    if (smtpIntegration && smtpIntegration.isEnabled && smtpIntegration.isConfigured) {
      return {
        provider: 'smtp',
        from: smtpIntegration.config.from || 'noreply@rent360.cl',
        config: smtpIntegration.config,
        source: 'admin',
      };
    }

    // Intentar SendGrid
    const sendgridIntegration = await IntegrationConfigService.getIntegrationConfig('sendgrid');
    if (sendgridIntegration && sendgridIntegration.isEnabled && sendgridIntegration.isConfigured) {
      return {
        provider: 'sendgrid',
        from: sendgridIntegration.config.from || 'noreply@rent360.cl',
        config: sendgridIntegration.config,
        source: 'admin',
      };
    }

    // Fallback a variables de entorno
    const provider = process.env.EMAIL_PROVIDER || 'console';

    logger.warn('⚠️ Email usando fallback de variables de entorno', {
      provider,
      hint: 'Configure SMTP o SendGrid en /admin/settings/enhanced > Integraciones',
    });

    return {
      provider,
      from: process.env.EMAIL_FROM || 'noreply@rent360.cl',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        apiKey: process.env.SENDGRID_API_KEY,
      },
      source: 'env',
    };
  }

  /**
   * Envía un email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Validar opciones
      if (!options.to || !options.subject || !options.html) {
        throw new Error('Faltan campos requeridos: to, subject, html');
      }

      // ✅ Obtener configuración dinámica
      const emailConfig = await this.getEmailConfig();

      // Agregar from por defecto si no está especificado
      const emailOptions = {
        ...options,
        from: options.from || emailConfig.from,
      };

      logger.info(
        `📧 Enviando email usando ${emailConfig.provider} (fuente: ${emailConfig.source})`,
        {
          to: Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to,
          subject: emailOptions.subject,
        }
      );

      // Enviar según el proveedor configurado
      switch (emailConfig.provider) {
        case 'smtp':
          return await this.sendWithSMTP(emailOptions, emailConfig.config);
        case 'sendgrid':
          return await this.sendWithSendGrid(emailOptions, emailConfig.config);
        case 'mailgun':
          return await this.sendWithMailgun(emailOptions, emailConfig.config);
        case 'ses':
          return await this.sendWithAmazonSES(emailOptions, emailConfig.config);
        case 'console':
        default:
          return await this.sendToConsole(emailOptions);
      }
    } catch (error) {
      logger.error('Error enviando email', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  /**
   * Envía un email usando una plantilla
   */
  static async sendTemplateEmail(
    to: string | string[],
    templateName: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const template = this.getTemplate(templateName, data);

    return await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      ...(template.text && { text: template.text }),
    });
  }

  // ============================================================================
  // PLANTILLAS DE EMAIL
  // ============================================================================

  /**
   * Obtiene y renderiza una plantilla de email
   */
  private static getTemplate(templateName: string, data: Record<string, any>): EmailTemplate {
    switch (templateName) {
      case 'shared-property':
        return this.sharedPropertyTemplate(data as any);
      case 'prospect-welcome':
        return this.prospectWelcomeTemplate(data as any);
      case 'follow-up':
        return this.followUpTemplate(data as any);
      case 'meeting-confirmation':
        return this.meetingConfirmationTemplate(data as any);
      default:
        throw new Error(`Plantilla no encontrada: ${templateName}`);
    }
  }

  /**
   * Plantilla: Propiedad Compartida
   */
  private static sharedPropertyTemplate(data: {
    prospectName: string;
    brokerName: string;
    property: {
      title: string;
      address: string;
      price: number;
      bedrooms?: number;
      bathrooms?: number;
      area?: number;
      images?: string[];
    };
    shareLink: string;
    message?: string;
  }): EmailTemplate {
    const { prospectName, brokerName, property, shareLink, message } = data;

    const subject = `${brokerName} te recomienda: ${property.title}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .property { background: white; border-radius: 10px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .property-image { width: 100%; height: 300px; object-fit: cover; }
    .property-details { padding: 20px; }
    .property-title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: #333; }
    .property-address { color: #666; margin: 0 0 15px 0; }
    .property-price { font-size: 28px; font-weight: bold; color: #667eea; margin: 15px 0; }
    .property-features { display: flex; gap: 15px; margin: 15px 0; }
    .feature { display: flex; align-items: center; gap: 5px; color: #666; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .cta-button:hover { background: #5568d3; }
    .message-box { background: #e8f4f8; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Nueva Propiedad para Ti</h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${prospectName}</strong>,</p>
      
      ${
        message
          ? `
        <div class="message-box">
          <p><strong>Mensaje de ${brokerName}:</strong></p>
          <p>${message}</p>
        </div>
      `
          : `
        <p>Tu asesor <strong>${brokerName}</strong> ha encontrado una propiedad que podría interesarte:</p>
      `
      }
      
      <div class="property">
        ${
          property.images && property.images.length > 0
            ? `
          <img src="${property.images[0]}" alt="${property.title}" class="property-image" />
        `
            : ''
        }
        
        <div class="property-details">
          <h2 class="property-title">${property.title}</h2>
          <p class="property-address">📍 ${property.address}</p>
          
          <div class="property-price">
            $${property.price.toLocaleString('es-CL')} /mes
          </div>
          
          ${
            property.bedrooms || property.bathrooms || property.area
              ? `
            <div class="property-features">
              ${property.bedrooms ? `<div class="feature">🛏️ ${property.bedrooms} dormitorios</div>` : ''}
              ${property.bathrooms ? `<div class="feature">🚿 ${property.bathrooms} baños</div>` : ''}
              ${property.area ? `<div class="feature">📐 ${property.area} m²</div>` : ''}
            </div>
          `
              : ''
          }
          
          <a href="${shareLink}" class="cta-button">
            Ver Propiedad Completa 👉
          </a>
          
          <p style="color: #666; font-size: 14px; margin-top: 15px;">
            Haz click en el botón para ver más fotos, detalles y agendar una visita.
          </p>
        </div>
      </div>
      
      <p>Si tienes alguna pregunta o quieres agendar una visita, no dudes en contactarme.</p>
      
      <p>Saludos,<br><strong>${brokerName}</strong></p>
    </div>
    
    <div class="footer">
      <p>Rent360 - Plataforma de Gestión Inmobiliaria</p>
      <p>Este email fue enviado porque ${brokerName} te compartió una propiedad.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Hola ${prospectName},

${message || `Tu asesor ${brokerName} ha encontrado una propiedad que podría interesarte:`}

${property.title}
📍 ${property.address}
💰 $${property.price.toLocaleString('es-CL')} /mes

${property.bedrooms ? `🛏️ ${property.bedrooms} dormitorios` : ''}
${property.bathrooms ? `🚿 ${property.bathrooms} baños` : ''}
${property.area ? `📐 ${property.area} m²` : ''}

Ver propiedad completa: ${shareLink}

Si tienes alguna pregunta o quieres agendar una visita, no dudes en contactarme.

Saludos,
${brokerName}

---
Rent360 - Plataforma de Gestión Inmobiliaria
    `.trim();

    return { subject, html, text };
  }

  /**
   * Plantilla: Bienvenida a Prospect
   */
  private static prospectWelcomeTemplate(data: {
    prospectName: string;
    brokerName: string;
  }): EmailTemplate {
    const { prospectName, brokerName } = data;

    return {
      subject: `Bienvenido/a ${prospectName} - ${brokerName}`,
      html: `
        <p>Hola <strong>${prospectName}</strong>,</p>
        <p>Gracias por tu interés. Soy <strong>${brokerName}</strong> y seré tu asesor inmobiliario.</p>
        <p>Estoy aquí para ayudarte a encontrar la propiedad perfecta para ti.</p>
        <p>Saludos,<br>${brokerName}</p>
      `,
      text: `Hola ${prospectName},\n\nGracias por tu interés. Soy ${brokerName} y seré tu asesor inmobiliario.\n\nEstoy aquí para ayudarte a encontrar la propiedad perfecta para ti.\n\nSaludos,\n${brokerName}`,
    };
  }

  /**
   * Plantilla: Seguimiento
   */
  private static followUpTemplate(data: {
    prospectName: string;
    brokerName: string;
    message: string;
  }): EmailTemplate {
    const { prospectName, brokerName, message } = data;

    return {
      subject: `Seguimiento - ${brokerName}`,
      html: `
        <p>Hola <strong>${prospectName}</strong>,</p>
        <p>${message}</p>
        <p>Saludos,<br>${brokerName}</p>
      `,
      text: `Hola ${prospectName},\n\n${message}\n\nSaludos,\n${brokerName}`,
    };
  }

  /**
   * Plantilla: Confirmación de Reunión
   */
  private static meetingConfirmationTemplate(data: {
    prospectName: string;
    brokerName: string;
    meetingDate: string;
    meetingTime: string;
    location: string;
  }): EmailTemplate {
    const { prospectName, brokerName, meetingDate, meetingTime, location } = data;

    return {
      subject: `Confirmación de Reunión - ${meetingDate}`,
      html: `
        <p>Hola <strong>${prospectName}</strong>,</p>
        <p>Confirmamos nuestra reunión:</p>
        <ul>
          <li><strong>Fecha:</strong> ${meetingDate}</li>
          <li><strong>Hora:</strong> ${meetingTime}</li>
          <li><strong>Lugar:</strong> ${location}</li>
        </ul>
        <p>Nos vemos pronto,<br>${brokerName}</p>
      `,
      text: `Hola ${prospectName},\n\nConfirmamos nuestra reunión:\n- Fecha: ${meetingDate}\n- Hora: ${meetingTime}\n- Lugar: ${location}\n\nNos vemos pronto,\n${brokerName}`,
    };
  }

  // ============================================================================
  // PROVEEDORES DE EMAIL
  // ============================================================================

  /**
   * Envía email por consola (desarrollo)
   */
  private static async sendToConsole(options: EmailOptions): Promise<boolean> {
    console.log('\n📧 ===== EMAIL (CONSOLE MODE) =====');
    console.log('From:', options.from);
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('---');
    console.log(options.text || 'No text version');
    console.log('===================================\n');

    logger.info('Email enviado (console mode)', {
      to: options.to,
      subject: options.subject,
    });

    return true;
  }

  /**
   * ✅ Envía email con SMTP (Nodemailer)
   */
  private static async sendWithSMTP(
    options: EmailOptions,
    config: Record<string, any>
  ): Promise<boolean> {
    try {
      // Nota: En producción, esto requiere npm install nodemailer
      // Por ahora simulamos el envío pero con la configuración correcta

      logger.info('📧 SMTP Email configurado (simulado)', {
        host: config.host || 'No configurado',
        port: config.port || 'No configurado',
        user: config.user || 'No configurado',
        from: options.from,
        to: options.to,
        subject: options.subject,
      });

      // TODO: Implementar con Nodemailer cuando se agregue la dependencia
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransporter({
      //   host: config.host,
      //   port: parseInt(config.port || '587'),
      //   secure: config.port === '465',
      //   auth: {
      //     user: config.user,
      //     pass: config.password,
      //   },
      // });
      // await transporter.sendMail({
      //   from: options.from,
      //   to: options.to,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // });

      return await this.sendToConsole(options);
    } catch (error) {
      logger.error('Error enviando email con SMTP', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * ✅ Envía email con SendGrid
   */
  private static async sendWithSendGrid(
    options: EmailOptions,
    config: Record<string, any>
  ): Promise<boolean> {
    try {
      logger.info('📧 SendGrid Email configurado (simulado)', {
        apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : 'No configurado',
        from: options.from,
        to: options.to,
        subject: options.subject,
      });

      // TODO: Implementar con SendGrid SDK cuando se agregue la dependencia
      // Requiere: npm install @sendgrid/mail
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(config.apiKey);
      // await sgMail.send({
      //   from: options.from,
      //   to: options.to,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      // });

      return await this.sendToConsole(options);
    } catch (error) {
      logger.error('Error enviando email con SendGrid', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Envía email con Mailgun
   */
  private static async sendWithMailgun(
    options: EmailOptions,
    config: Record<string, any>
  ): Promise<boolean> {
    // TODO: Implementar con Mailgun SDK
    // Requiere: npm install mailgun-js
    logger.warn('Mailgun no implementado, usando console mode');
    return await this.sendToConsole(options);
  }

  /**
   * Envía email con Amazon SES
   */
  private static async sendWithAmazonSES(
    options: EmailOptions,
    config: Record<string, any>
  ): Promise<boolean> {
    // TODO: Implementar con AWS SDK
    // Requiere: npm install @aws-sdk/client-ses
    logger.warn('Amazon SES no implementado, usando console mode');
    return await this.sendToConsole(options);
  }
}
