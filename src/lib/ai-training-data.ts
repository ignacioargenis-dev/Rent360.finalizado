/**
 * DATOS DE ENTRENAMIENTO AVANZADOS PARA EL CHATBOT IA
 * Sistema de conocimiento especializado para Rent360
 */

export interface TrainingExample {
  input: string;
  output: string;
  intent: string;
  category: string;
  context: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface TrainingDataset {
  category: string;
  examples: TrainingExample[];
  patterns: string[];
  responses: string[];
}

/**
 * DATASET PRINCIPAL - CONOCIMIENTO GENERAL DE RENT360
 */
export const generalKnowledgeDataset: TrainingDataset = {
  category: 'general_knowledge',
  examples: [
    {
      input: '¿Qué es Rent360?',
      output:
        'Rent360 es una plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos, corredores y proveedores de servicios. Ofrecemos herramientas completas para la gestión de propiedades, contratos, pagos y mantenimiento, todo en un solo lugar.',
      intent: 'platform_info',
      category: 'general',
      context: 'user_asking_about_platform',
      confidence: 0.95,
    },
    {
      input: '¿Cómo funciona el sistema de pagos?',
      output:
        'El sistema de pagos de Rent360 permite a los inquilinos pagar su arriendo de forma segura y automática. Los propietarios reciben los pagos directamente en su cuenta bancaria registrada. El sistema también maneja comisiones para corredores y proveedores de servicios.',
      intent: 'payment_system',
      category: 'payments',
      context: 'user_asking_about_payments',
      confidence: 0.9,
    },
    {
      input: '¿Puedo ver mis propiedades?',
      output:
        'Sí, como propietario puedes ver todas tus propiedades en el panel de propietario. Allí encontrarás información detallada de cada propiedad, contratos activos, historial de pagos y solicitudes de mantenimiento.',
      intent: 'view_properties',
      category: 'properties',
      context: 'owner_asking_about_properties',
      confidence: 0.88,
    },
  ],
  patterns: [
    '¿Qué es Rent360?',
    '¿Cómo funciona?',
    '¿Qué puedo hacer aquí?',
    '¿Cuáles son las funcionalidades?',
    '¿Cómo empiezo?',
  ],
  responses: [
    'Rent360 es tu plataforma integral de gestión inmobiliaria.',
    'Te ayudo a entender cómo funciona Rent360.',
    'Puedes gestionar propiedades, contratos y pagos desde aquí.',
    'Las funcionalidades incluyen gestión completa de propiedades.',
    'Te guío paso a paso para comenzar.',
  ],
};

/**
 * DATASET ESPECIALIZADO - PROPIETARIOS (AMPLIADO CON TODAS LAS FUNCIONALIDADES)
 */
export const ownerDataset: TrainingDataset = {
  category: 'owner_specialized',
  examples: [
    {
      input: '¿Cómo agrego una nueva propiedad?',
      output:
        'Para agregar una nueva propiedad: 1) Ve a "Mis Propiedades" → "Nueva Propiedad" 2) Completa información básica (dirección, tipo, precio, habitaciones, baños) 3) Sube fotos profesionales (mínimo 5) 4) Especifica características y amenities 5) Define términos de arriendo. Una vez guardada, podrás gestionar contratos, pagos y mantenimiento. También puedes usar Runner360 para visitas profesionales.',
      intent: 'add_property',
      category: 'properties',
      context: 'owner_adding_property',
      confidence: 0.92,
    },
    {
      input: '¿Cómo veo mis ingresos mensuales?',
      output:
        'En "Pagos" puedes ver: ingresos mensuales en tiempo real, total recibido, pagos pendientes, desglose por propiedad, historial completo de transacciones, y reportes financieros exportables. También puedes ver analytics detallados en "Analytics" con gráficos y tendencias.',
      intent: 'view_earnings',
      category: 'finances',
      context: 'owner_checking_earnings',
      confidence: 0.89,
    },
    {
      input: '¿Cómo manejo solicitudes de mantenimiento?',
      output:
        'En "Mantenimiento" puedes: ver todas las solicitudes de tus propiedades, aprobar o rechazar solicitudes, solicitar más información, asignar proveedores de servicios, aprobar presupuestos, ver seguimiento en tiempo real, y gestionar costos. El sistema te conecta automáticamente con proveedores verificados.',
      intent: 'maintenance_requests',
      category: 'maintenance',
      context: 'owner_handling_maintenance',
      confidence: 0.87,
    },
    {
      input: '¿Cómo gestiono mis inquilinos?',
      output:
        'En "Mis Inquilinos" puedes: ver lista completa de inquilinos activos, ver detalles de cada inquilino (contratos, pagos, historial), comunicarte directamente por mensajería, ver calificaciones y feedback, gestionar renovaciones de contratos, y ver reportes de cada inquilino.',
      intent: 'manage_tenants',
      category: 'tenants',
      context: 'owner_managing_tenants',
      confidence: 0.9,
    },
    {
      input: '¿Cómo creo un contrato?',
      output:
        'Para crear un contrato: 1) Ve a "Contratos" → "Nuevo Contrato" 2) Selecciona la propiedad e inquilino 3) Completa términos (precio, duración, garantía) 4) Revisa plantilla legal 5) Envía para firma electrónica. El sistema genera automáticamente el contrato con firma TrustFactory válida legalmente.',
      intent: 'create_contract',
      category: 'contracts',
      context: 'owner_creating_contract',
      confidence: 0.91,
    },
    {
      input: '¿Cómo inicio un caso legal?',
      output:
        'En "Casos Legales" puedes: iniciar procesos legales (mora, desahucio), documentar casos con evidencia, seguir el estado del proceso, coordinar con abogados, y ver historial legal. El sistema te guía paso a paso según la legislación chilena (Ley 18.101, Ley 21.461).',
      intent: 'legal_cases',
      category: 'legal',
      context: 'owner_legal_case',
      confidence: 0.88,
    },
    {
      input: '¿Cómo uso servicios de corredores?',
      output:
        'En "Servicios de Corredores" puedes: buscar corredores certificados, solicitar servicios de gestión, asignar propiedades a corredores (gestión completa o parcial), ver propuestas de corredores, gestionar comisiones, y ver reportes de rendimiento. Puedes mantener control total o delegar gestión completa.',
      intent: 'broker_services',
      category: 'services',
      context: 'owner_using_broker',
      confidence: 0.86,
    },
    {
      input: '¿Cómo uso Runner360?',
      output:
        'Runner360 ofrece visitas profesionales a tus propiedades. Puedes: agendar visitas para propiedades disponibles, recibir fotos profesionales y videos, obtener reportes detallados con medidas, verificar estado de propiedades, y acelerar el proceso de arriendo. Los inquilinos pueden usar este servicio gratis.',
      intent: 'runner360',
      category: 'services',
      context: 'owner_using_runner',
      confidence: 0.87,
    },
    {
      input: '¿Cómo veo analytics de mis propiedades?',
      output:
        'En "Analytics" puedes ver: ocupación de propiedades, ingresos por período, tendencias de mercado, comparación de propiedades, tiempo promedio de arriendo, tasas de renovación, y predicciones de ingresos. Todo con gráficos interactivos y reportes exportables.',
      intent: 'view_analytics',
      category: 'analytics',
      context: 'owner_viewing_analytics',
      confidence: 0.89,
    },
    {
      input: '¿Cómo envío recordatorios de pago?',
      output:
        'En "Recordatorios" puedes: configurar recordatorios automáticos, enviar recordatorios manuales, personalizar mensajes, ver historial de recordatorios enviados, y configurar fechas de recordatorio. El sistema también envía recordatorios automáticos antes del vencimiento.',
      intent: 'payment_reminders',
      category: 'payments',
      context: 'owner_sending_reminders',
      confidence: 0.88,
    },
    {
      input: '¿Cómo comparo mis propiedades?',
      output:
        'En "Comparación de Propiedades" puedes: comparar múltiples propiedades lado a lado, ver métricas comparativas (ingresos, ocupación, costos), identificar propiedades de mejor rendimiento, y tomar decisiones basadas en datos. Útil para optimizar tu portafolio.',
      intent: 'compare_properties',
      category: 'analytics',
      context: 'owner_comparing_properties',
      confidence: 0.85,
    },
    {
      input: '¿Cómo gestiono disputas?',
      output:
        'En "Disputas" puedes: crear disputas con inquilinos, documentar problemas, comunicarte con la otra parte, hacer seguimiento del estado, y resolver conflictos. El sistema te ayuda a mantener un registro completo y profesional de todas las disputas.',
      intent: 'manage_disputes',
      category: 'legal',
      context: 'owner_managing_disputes',
      confidence: 0.84,
    },
    {
      input: '¿Cómo veo reportes financieros?',
      output:
        'En "Reportes" puedes generar: reportes financieros mensuales/anuales, reportes de ingresos por propiedad, reportes de gastos de mantenimiento, reportes de mora, reportes fiscales, y más. Todos exportables en PDF o Excel para tu contador.',
      intent: 'financial_reports',
      category: 'reports',
      context: 'owner_viewing_reports',
      confidence: 0.9,
    },
  ],
  patterns: [
    '¿Cómo agrego una propiedad?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo manejo mantenimiento?',
    '¿Puedo configurar pagos automáticos?',
    '¿Cómo gestiono mis inquilinos?',
    '¿Cómo creo un contrato?',
    '¿Cómo inicio un caso legal?',
    '¿Cómo uso servicios de corredores?',
    '¿Cómo uso Runner360?',
    '¿Cómo veo analytics?',
    '¿Cómo envío recordatorios?',
    '¿Cómo comparo propiedades?',
    '¿Cómo gestiono disputas?',
    '¿Cómo veo reportes financieros?',
  ],
  responses: [
    'Te ayudo a agregar una nueva propiedad.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico cómo manejar solicitudes de mantenimiento.',
    'Sí, puedes configurar pagos automáticos.',
    'Te guío en la gestión de inquilinos.',
    'Te explico cómo crear contratos.',
    'Te guío para iniciar casos legales.',
    'Te explico cómo usar servicios de corredores.',
    'Te muestro cómo usar Runner360.',
    'Te explico cómo ver analytics.',
    'Te guío para enviar recordatorios.',
    'Te explico cómo comparar propiedades.',
    'Te ayudo a gestionar disputas.',
    'Te muestro cómo generar reportes financieros.',
  ],
};

/**
 * DATASET ESPECIALIZADO - INQUILINOS (AMPLIADO CON TODAS LAS FUNCIONALIDADES)
 */
export const tenantDataset: TrainingDataset = {
  category: 'tenant_specialized',
  examples: [
    {
      input: '¿Cómo pago mi arriendo?',
      output:
        'Puedes pagar tu arriendo desde la sección "Mis Pagos" en tu panel. El sistema acepta transferencias bancarias, tarjetas de crédito/débito, y pasarelas como Khipu. También puedes configurar pagos automáticos para no preocuparte por las fechas de vencimiento. Ve a "Mis Pagos" → "Configurar método de pago" para comenzar.',
      intent: 'pay_rent',
      category: 'payments',
      context: 'tenant_paying_rent',
      confidence: 0.94,
    },
    {
      input: '¿Cómo configuro pagos automáticos?',
      output:
        'Para configurar pagos automáticos: 1) Ve a "Mis Pagos" → "Métodos de Pago" 2) Agrega tu tarjeta o cuenta bancaria 3) Activa "Débito Automático" 4) Selecciona la fecha de pago preferida. El sistema te enviará recordatorios antes de cada cobro y recibirás comprobantes automáticos.',
      intent: 'automatic_payments',
      category: 'payments',
      context: 'tenant_configuring_autopay',
      confidence: 0.92,
    },
    {
      input: '¿Cómo solicito mantenimiento?',
      output:
        'Para solicitar mantenimiento: 1) Ve a "Mantenimiento" → "Nueva Solicitud" 2) Selecciona la propiedad 3) Describe el problema con detalles 4) Adjunta fotos/videos si es necesario 5) Selecciona la urgencia (baja/media/alta/urgente) 6) Envía. El sistema notificará automáticamente a tu propietario y asignará un proveedor de servicios.',
      intent: 'request_maintenance',
      category: 'maintenance',
      context: 'tenant_requesting_maintenance',
      confidence: 0.9,
    },
    {
      input: '¿Cómo busco propiedades?',
      output:
        'Usa la "Búsqueda Avanzada" en tu panel para encontrar propiedades. Puedes filtrar por: ubicación, precio, habitaciones, baños, tipo (casa/departamento/oficina), amenities, y más. Guarda búsquedas favoritas y recibe notificaciones cuando aparezcan propiedades que coincidan. También puedes usar Runner360 para visitas profesionales gratuitas.',
      intent: 'property_search',
      category: 'properties',
      context: 'tenant_searching_properties',
      confidence: 0.93,
    },
    {
      input: '¿Dónde veo mi contrato?',
      output:
        'Tu contrato está disponible en "Mis Contratos" de tu panel. Puedes ver: detalles completos, fechas importantes, términos y condiciones, estado del contrato, y descargar una copia en PDF. Los contratos son digitales con firma electrónica válida legalmente.',
      intent: 'view_contract',
      category: 'contracts',
      context: 'tenant_viewing_contract',
      confidence: 0.93,
    },
    {
      input: '¿Cómo contacto a mi propietario?',
      output:
        'Puedes contactar a tu propietario a través de "Mensajes" en tu panel. El sistema de mensajería integrado permite: chat en tiempo real, envío de archivos, notificaciones automáticas, y seguimiento de conversaciones. También puedes contactar sobre temas específicos como mantenimiento o pagos directamente desde esas secciones.',
      intent: 'contact_owner',
      category: 'communication',
      context: 'tenant_contacting_owner',
      confidence: 0.88,
    },
    {
      input: '¿Cómo veo mis pagos pendientes?',
      output:
        'En "Mis Pagos" puedes ver: pagos pendientes con fechas de vencimiento, historial completo de pagos realizados, próximos pagos programados, y recibos digitales. También puedes configurar recordatorios y ver el estado de cada transacción en tiempo real.',
      intent: 'view_payments',
      category: 'payments',
      context: 'tenant_viewing_payments',
      confidence: 0.91,
    },
    {
      input: '¿Cómo califico servicios?',
      output:
        'Después de que un servicio de mantenimiento se complete, puedes calificarlo en "Calificaciones". Puedes calificar: proveedores de servicios, propietarios, y corredores. Incluye: calificación de 1-5 estrellas, comentarios detallados, y feedback sobre calidad del servicio. Esto ayuda a mejorar el sistema para todos.',
      intent: 'rate_services',
      category: 'ratings',
      context: 'tenant_rating_services',
      confidence: 0.89,
    },
    {
      input: '¿Cómo solicito servicios de corredores?',
      output:
        'En "Servicios de Corredores" puedes: buscar corredores certificados, solicitar ayuda para encontrar propiedades, recibir propuestas de corredores, y gestionar tus solicitudes. Los corredores pueden ayudarte a encontrar la propiedad perfecta y gestionar todo el proceso de arriendo.',
      intent: 'broker_services',
      category: 'services',
      context: 'tenant_requesting_broker',
      confidence: 0.87,
    },
    {
      input: '¿Cómo reporto un problema o disputa?',
      output:
        'Si tienes un problema o disputa, puedes: 1) Crear un ticket en "Mis Tickets" 2) Reportar una disputa en "Disputas" 3) Contactar soporte directamente. El sistema te permite documentar el problema, adjuntar evidencia, y hacer seguimiento del estado de tu caso.',
      intent: 'report_issue',
      category: 'support',
      context: 'tenant_reporting_issue',
      confidence: 0.85,
    },
    {
      input: '¿Cómo veo reportes de mantenimiento?',
      output:
        'En "Reportes" → "Mantenimiento" puedes ver: historial completo de solicitudes, costos de mantenimiento, tiempos de respuesta, calificaciones de proveedores, y estadísticas de mantenimiento de tus propiedades. Esto te ayuda a entender los patrones y costos.',
      intent: 'view_reports',
      category: 'reports',
      context: 'tenant_viewing_reports',
      confidence: 0.86,
    },
    {
      input: '¿Cómo configuro mis notificaciones?',
      output:
        'En "Configuración" puedes personalizar tus notificaciones: recibir alertas de pagos pendientes, notificaciones de mantenimiento, mensajes nuevos, actualizaciones de contratos, y más. Puedes elegir recibirlas por email, push, o SMS según tu preferencia.',
      intent: 'configure_notifications',
      category: 'settings',
      context: 'tenant_configuring_notifications',
      confidence: 0.88,
    },
  ],
  patterns: [
    '¿Cómo pago mi arriendo?',
    '¿Cómo solicito mantenimiento?',
    '¿Dónde veo mi contrato?',
    '¿Cómo contacto a mi propietario?',
    '¿Cuándo vence mi pago?',
    '¿Cómo busco propiedades?',
    '¿Cómo configuro pagos automáticos?',
    '¿Cómo califico servicios?',
    '¿Cómo solicito servicios de corredores?',
    '¿Cómo reporto un problema?',
    '¿Cómo veo mis pagos pendientes?',
    '¿Cómo veo reportes?',
    '¿Cómo configuro notificaciones?',
  ],
  responses: [
    'Te ayudo con el proceso de pago.',
    'Te guío para solicitar mantenimiento.',
    'Te muestro dónde encontrar tu contrato.',
    'Te explico cómo contactar a tu propietario.',
    'Te informo sobre las fechas de vencimiento.',
    'Te ayudo a buscar propiedades.',
    'Te explico cómo configurar pagos automáticos.',
    'Te guío para calificar servicios.',
    'Te explico cómo solicitar servicios de corredores.',
    'Te ayudo a reportar un problema.',
    'Te muestro dónde ver tus pagos.',
    'Te explico cómo ver reportes.',
    'Te guío para configurar notificaciones.',
  ],
};

/**
 * DATASET ESPECIALIZADO - CORREDORES (AMPLIADO CON TODAS LAS FUNCIONALIDADES)
 */
export const brokerDataset: TrainingDataset = {
  category: 'broker_specialized',
  examples: [
    {
      input: '¿Cómo gestiono mis clientes?',
      output:
        'En "Clientes" puedes gestionar: todos tus clientes activos, clientes potenciales (prospects), conversión de prospects a clientes, historial completo de cada cliente, propiedades gestionadas por cliente, contratos activos, y métricas de rendimiento. También puedes usar "Captación de Clientes" para descubrir nuevos leads.',
      intent: 'manage_clients',
      category: 'clients',
      context: 'broker_managing_clients',
      confidence: 0.91,
    },
    {
      input: '¿Cómo gestiono prospects?',
      output:
        'En "Potenciales" puedes: agregar nuevos prospects, hacer seguimiento del pipeline de ventas, programar actividades (llamadas, emails, reuniones), compartir propiedades con prospects, hacer seguimiento de engagement, convertir prospects a clientes, y ver scoring automático de cada prospect.',
      intent: 'manage_prospects',
      category: 'prospects',
      context: 'broker_managing_prospects',
      confidence: 0.92,
    },
    {
      input: '¿Cómo calculo mis comisiones?',
      output:
        'En "Comisiones" puedes ver: cálculo automático de comisiones por contrato, desglose por tipo de servicio, fechas de pago programadas, estados de cobro (pendiente/procesado), historial completo de comisiones, y reportes de ingresos. El sistema calcula automáticamente según los contratos celebrados.',
      intent: 'calculate_commissions',
      category: 'commissions',
      context: 'broker_calculating_commissions',
      confidence: 0.89,
    },
    {
      input: '¿Cómo agrego nuevas propiedades?',
      output:
        'Para agregar propiedades: 1) Ve a "Propiedades" → "Nueva Propiedad" 2) Selecciona el cliente propietario 3) Completa información completa (fotos, características, precio) 4) Define términos de gestión (completa/parcial/marketing/arriendo) 5) Configura comisiones. El sistema la asociará automáticamente y aparecerá en búsquedas.',
      intent: 'add_property',
      category: 'properties',
      context: 'broker_adding_property',
      confidence: 0.87,
    },
    {
      input: '¿Cómo gestiono citas y visitas?',
      output:
        'En "Citas" puedes: programar citas con clientes, coordinar visitas a propiedades, integrar con Runner360 para visitas profesionales, ver calendario de citas, enviar recordatorios automáticos, y hacer seguimiento de resultados de visitas. Todo sincronizado con tu calendario.',
      intent: 'manage_appointments',
      category: 'appointments',
      context: 'broker_managing_appointments',
      confidence: 0.88,
    },
    {
      input: '¿Cómo creo contratos?',
      output:
        'Para crear contratos: 1) Ve a "Contratos" → "Nuevo Contrato" 2) Selecciona propiedad e inquilino 3) Completa términos comerciales 4) Configura comisión 5) Envía para firma electrónica. El sistema genera automáticamente el contrato legal y calcula tu comisión. Puedes hacer seguimiento del estado de firma.',
      intent: 'create_contract',
      category: 'contracts',
      context: 'broker_creating_contract',
      confidence: 0.9,
    },
    {
      input: '¿Cómo gestiono casos legales?',
      output:
        'En "Casos Legales" puedes: iniciar procesos legales para tus clientes, documentar casos con evidencia, hacer seguimiento del estado, coordinar con abogados, ver historial legal, y gestionar múltiples casos simultáneamente. El sistema te guía según la legislación chilena.',
      intent: 'legal_cases',
      category: 'legal',
      context: 'broker_legal_cases',
      confidence: 0.86,
    },
    {
      input: '¿Cómo gestiono disputas?',
      output:
        'En "Disputas" puedes: crear disputas entre propietarios e inquilinos, documentar problemas, facilitar comunicación, hacer seguimiento del estado, y ayudar a resolver conflictos. Útil para mantener relaciones profesionales y resolver problemas rápidamente.',
      intent: 'manage_disputes',
      category: 'legal',
      context: 'broker_managing_disputes',
      confidence: 0.85,
    },
    {
      input: '¿Cómo veo analytics y reportes?',
      output:
        'En "Analytics" y "Reportes" puedes ver: rendimiento de propiedades gestionadas, tasa de conversión de prospects, ingresos por período, análisis de mercado, comparación con otros corredores, predicciones de ventas, y reportes personalizados exportables. Todo con gráficos interactivos.',
      intent: 'view_analytics',
      category: 'analytics',
      context: 'broker_viewing_analytics',
      confidence: 0.89,
    },
    {
      input: '¿Cómo comparto propiedades con prospects?',
      output:
        'Puedes compartir propiedades con prospects desde su perfil: 1) Selecciona la propiedad 2) Haz clic en "Compartir con Prospect" 3) Personaliza el mensaje 4) Envía. El prospect recibe un link único rastreable, puedes ver si lo abrió, y hacer seguimiento de interés.',
      intent: 'share_properties',
      category: 'prospects',
      context: 'broker_sharing_properties',
      confidence: 0.87,
    },
    {
      input: '¿Cómo gestiono mantenimiento para propiedades de clientes?',
      output:
        'En "Mantenimiento" puedes: ver solicitudes de propiedades que gestionas, asignar proveedores de servicios, aprobar presupuestos, coordinar entre inquilinos y propietarios, hacer seguimiento de trabajos, y ver reportes de mantenimiento. Todo centralizado para propiedades gestionadas.',
      intent: 'manage_maintenance',
      category: 'maintenance',
      context: 'broker_managing_maintenance',
      confidence: 0.86,
    },
    {
      input: '¿Cómo veo mi rendimiento?',
      output:
        'En tu dashboard y "Analytics" puedes ver: propiedades gestionadas, contratos celebrados, comisiones generadas, tasa de conversión, tiempo promedio de cierre, satisfacción de clientes, y ranking comparativo. Todo actualizado en tiempo real para que veas tu progreso.',
      intent: 'view_performance',
      category: 'analytics',
      context: 'broker_viewing_performance',
      confidence: 0.88,
    },
    {
      input: '¿Cómo descubro nuevos clientes?',
      output:
        'En "Captación de Clientes" puedes: buscar propietarios e inquilinos potenciales, ver propiedades disponibles para gestionar, contactar directamente, hacer seguimiento de leads, y convertir prospects en clientes. El sistema te ayuda a encontrar oportunidades de negocio.',
      intent: 'discover_clients',
      category: 'clients',
      context: 'broker_discovering_clients',
      confidence: 0.87,
    },
  ],
  patterns: [
    '¿Cómo gestiono mis clientes?',
    '¿Cómo gestiono prospects?',
    '¿Cómo calculo comisiones?',
    '¿Cómo agrego propiedades?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo contacto a mis clientes?',
    '¿Cómo gestiono citas?',
    '¿Cómo creo contratos?',
    '¿Cómo gestiono casos legales?',
    '¿Cómo veo analytics?',
    '¿Cómo comparto propiedades?',
    '¿Cómo gestiono mantenimiento?',
    '¿Cómo veo mi rendimiento?',
    '¿Cómo descubro nuevos clientes?',
  ],
  responses: [
    'Te ayudo a gestionar tus clientes.',
    'Te explico cómo gestionar prospects.',
    'Te explico el cálculo de comisiones.',
    'Te guío para agregar propiedades.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico las opciones de contacto.',
    'Te guío para gestionar citas.',
    'Te explico cómo crear contratos.',
    'Te ayudo con casos legales.',
    'Te muestro cómo ver analytics.',
    'Te explico cómo compartir propiedades.',
    'Te guío para gestionar mantenimiento.',
    'Te muestro cómo ver tu rendimiento.',
    'Te explico cómo descubrir nuevos clientes.',
  ],
};

/**
 * DATASET ESPECIALIZADO - PROVEEDORES DE SERVICIOS (AMPLIADO - FUENTE DE TRABAJO)
 */
export const providerDataset: TrainingDataset = {
  category: 'provider_specialized',
  examples: [
    {
      input: '¿Cómo recibo trabajos?',
      output:
        'Los trabajos llegan automáticamente a tu panel según tus servicios ofrecidos y zona de cobertura. Puedes ver trabajos disponibles en "Trabajos" → "Disponibles". El sistema te notifica por email y notificaciones push cuando hay trabajos que coinciden con tu perfil. Acepta rápidamente para aumentar tus oportunidades.',
      intent: 'receive_jobs',
      category: 'jobs',
      context: 'provider_receiving_jobs',
      confidence: 0.93,
    },
    {
      input: '¿Cómo veo las solicitudes de servicio?',
      output:
        'En "Trabajos" puedes ver: solicitudes disponibles filtradas por tipo de servicio y ubicación, trabajos asignados a ti, historial de trabajos completados, y detalles completos de cada solicitud (descripción, urgencia, presupuesto, fotos). Acepta trabajos que coincidan con tu especialidad y zona.',
      intent: 'view_service_requests',
      category: 'services',
      context: 'provider_viewing_requests',
      confidence: 0.9,
    },
    {
      input: '¿Cómo acepto un trabajo?',
      output:
        'Para aceptar un trabajo: 1) Ve a "Trabajos" → "Disponibles" 2) Revisa los detalles del trabajo 3) Si te interesa, haz clic en "Aceptar Trabajo" 4) El sistema te conectará con el cliente 5) Coordina fecha y hora. Una vez aceptado, aparecerá en "Mis Trabajos" para hacer seguimiento.',
      intent: 'accept_job',
      category: 'jobs',
      context: 'provider_accepting_job',
      confidence: 0.91,
    },
    {
      input: '¿Cómo actualizo el estado de un trabajo?',
      output:
        'En "Mis Trabajos" puedes actualizar el estado: "En Progreso" cuando comiences, "Completado" cuando termines, o "Necesita Información" si requieres más detalles. El sistema notificará automáticamente al cliente y propietario. Sube fotos del trabajo para evidencia y mejor calificación.',
      intent: 'update_service_status',
      category: 'services',
      context: 'provider_updating_status',
      confidence: 0.88,
    },
    {
      input: '¿Cómo configuro mis servicios ofrecidos?',
      output:
        'En "Servicios" puedes: definir qué tipos de servicios ofreces (plomería, electricidad, jardinería, etc.), establecer precios por servicio, definir áreas de cobertura (zonas donde trabajas), configurar disponibilidad horaria, subir fotos de trabajos anteriores, y establecer términos de servicio. Esto determina qué trabajos recibes.',
      intent: 'configure_services',
      category: 'configuration',
      context: 'provider_configuring_services',
      confidence: 0.86,
    },
    {
      input: '¿Cómo veo mis ganancias?',
      output:
        'En "Ganancias" puedes ver: ingresos totales, pagos pendientes, pagos procesados, desglose por trabajo, comisiones de plataforma, y pagos netos. Los pagos se procesan automáticamente cuando completas un trabajo y se depositan en tu cuenta bancaria registrada. Verifica que tengas tu cuenta bancaria configurada.',
      intent: 'view_earnings',
      category: 'earnings',
      context: 'provider_viewing_earnings',
      confidence: 0.89,
    },
    {
      input: '¿Cómo configuro mi cuenta bancaria para recibir pagos?',
      output:
        'Para recibir pagos: 1) Ve a "Configuración" → "Pagos" 2) Agrega tu cuenta bancaria (número de cuenta, banco, tipo de cuenta) 3) Verifica los datos 4) Guarda. Una vez configurada, los pagos se depositarán automáticamente cuando completes trabajos. La plataforma retiene una comisión (generalmente 8%) y el resto va a tu cuenta.',
      intent: 'configure_bank_account',
      category: 'payments',
      context: 'provider_configuring_bank',
      confidence: 0.92,
    },
    {
      input: '¿Cómo mejoro mis calificaciones?',
      output:
        'Para mejorar tus calificaciones: completa trabajos a tiempo, comunícate claramente con clientes, entrega trabajos de calidad, sube fotos del antes y después, responde rápido a solicitudes, y solicita calificaciones después de completar trabajos. Las buenas calificaciones atraen más trabajos y mejores precios.',
      intent: 'improve_ratings',
      category: 'ratings',
      context: 'provider_improving_ratings',
      confidence: 0.87,
    },
    {
      input: '¿Cómo veo mi perfil público?',
      output:
        'Tu perfil público es visible para clientes potenciales. Incluye: servicios ofrecidos, zona de cobertura, calificación promedio, número de trabajos completados, documentos aprobados (si están verificados), y fotos de trabajos anteriores. Mantén tu perfil actualizado para atraer más clientes.',
      intent: 'view_profile',
      category: 'profile',
      context: 'provider_viewing_profile',
      confidence: 0.85,
    },
    {
      input: '¿Cómo gestiono mi calendario?',
      output:
        'En "Calendario" puedes: ver tus trabajos programados, bloquear fechas no disponibles, ver disponibilidad, y coordinar horarios con clientes. Mantén tu calendario actualizado para que el sistema te asigne trabajos en tus horarios disponibles.',
      intent: 'manage_calendar',
      category: 'calendar',
      context: 'provider_managing_calendar',
      confidence: 0.84,
    },
    {
      input: '¿Cómo veo estadísticas de mis trabajos?',
      output:
        'En "Estadísticas" puedes ver: número de trabajos completados, ingresos totales, calificación promedio, trabajos por tipo de servicio, tasa de aceptación, tiempo promedio de respuesta, y tendencias de ingresos. Esto te ayuda a entender tu rendimiento y optimizar tu estrategia.',
      intent: 'view_statistics',
      category: 'analytics',
      context: 'provider_viewing_stats',
      confidence: 0.86,
    },
    {
      input: '¿Cómo contacto a mis clientes?',
      output:
        'Puedes contactar a clientes a través de "Mensajes" en tu panel. El sistema de mensajería permite: chat en tiempo real, envío de fotos y documentos, coordinación de horarios, y seguimiento de conversaciones. También puedes contactar desde la página de cada trabajo específico.',
      intent: 'contact_clients',
      category: 'communication',
      context: 'provider_contacting_clients',
      confidence: 0.88,
    },
    {
      input: '¿Cuánto tiempo tengo para aceptar un trabajo?',
      output:
        'Los trabajos están disponibles hasta que alguien los acepte o el cliente los cancele. Sin embargo, mientras más rápido aceptes, más probabilidades tienes de obtenerlo. Los trabajos urgentes tienen prioridad y se asignan más rápido. Revisa tu panel regularmente para no perder oportunidades.',
      intent: 'job_acceptance_time',
      category: 'jobs',
      context: 'provider_job_timing',
      confidence: 0.83,
    },
    {
      input: '¿Cómo subo fotos de mis trabajos?',
      output:
        'Puedes subir fotos: 1) Al actualizar el estado de un trabajo a "Completado" 2) Desde la página del trabajo específico 3) En "Mis Trabajos" → selecciona el trabajo → "Agregar Fotos". Las fotos ayudan a demostrar la calidad de tu trabajo y mejoran tus calificaciones.',
      intent: 'upload_photos',
      category: 'jobs',
      context: 'provider_uploading_photos',
      confidence: 0.85,
    },
  ],
  patterns: [
    '¿Cómo recibo trabajos?',
    '¿Cómo veo solicitudes?',
    '¿Cómo acepto un trabajo?',
    '¿Cómo actualizo estado?',
    '¿Cómo configuro servicios?',
    '¿Dónde veo mis pagos?',
    '¿Cómo configuro cuenta bancaria?',
    '¿Cómo mejoro calificaciones?',
    '¿Cómo veo mi perfil?',
    '¿Cómo gestiono calendario?',
    '¿Cómo veo estadísticas?',
    '¿Cómo contacto clientes?',
    '¿Cuánto tiempo tengo para aceptar?',
    '¿Cómo subo fotos?',
  ],
  responses: [
    'Te explico cómo recibir trabajos.',
    'Te muestro las solicitudes disponibles.',
    'Te guío para aceptar trabajos.',
    'Te ayudo a actualizar el estado.',
    'Te guío en la configuración.',
    'Te explico dónde ver tus pagos.',
    'Te guío para configurar cuenta bancaria.',
    'Te explico cómo mejorar calificaciones.',
    'Te muestro tu perfil público.',
    'Te guío para gestionar calendario.',
    'Te muestro tus estadísticas.',
    'Te explico cómo contactar clientes.',
    'Te informo sobre tiempos de aceptación.',
    'Te guío para subir fotos.',
  ],
};

/**
 * DATASET ESPECIALIZADO - ADMINISTRADORES
 */
export const adminDataset: TrainingDataset = {
  category: 'admin_specialized',
  examples: [
    {
      input: '¿Cómo gestiono usuarios del sistema?',
      output:
        'En el panel de administración puedes ver todos los usuarios registrados, sus roles y estados. Puedes activar/desactivar cuentas, cambiar roles, ver historial de actividad y gestionar permisos. También puedes enviar notificaciones masivas.',
      intent: 'manage_users',
      category: 'user_management',
      context: 'admin_managing_users',
      confidence: 0.93,
    },
    {
      input: '¿Cómo veo las estadísticas del sistema?',
      output:
        'El dashboard de administración muestra estadísticas completas: usuarios activos, propiedades registradas, contratos activos, ingresos totales y métricas de uso. Puedes filtrar por períodos y exportar reportes detallados.',
      intent: 'view_system_stats',
      category: 'analytics',
      context: 'admin_viewing_stats',
      confidence: 0.91,
    },
    {
      input: '¿Cómo configuro las comisiones del sistema?',
      output:
        'En la configuración del sistema puedes establecer porcentajes de comisión para corredores, proveedores y la retención de la plataforma. También puedes configurar diferentes tipos de comisión según el tipo de servicio o propiedad.',
      intent: 'configure_commissions',
      category: 'system_config',
      context: 'admin_configuring_commissions',
      confidence: 0.89,
    },
  ],
  patterns: [
    '¿Cómo gestiono usuarios?',
    '¿Cómo veo estadísticas?',
    '¿Cómo configuro comisiones?',
    '¿Cómo manejo reportes?',
    '¿Cómo configuro el sistema?',
  ],
  responses: [
    'Te ayudo a gestionar usuarios.',
    'Te muestro las estadísticas del sistema.',
    'Te guío en la configuración de comisiones.',
    'Te explico cómo generar reportes.',
    'Te ayudo con la configuración del sistema.',
  ],
};

/**
 * DATASET DE SOPORTE TÉCNICO
 */
export const supportDataset: TrainingDataset = {
  category: 'technical_support',
  examples: [
    {
      input: 'No puedo iniciar sesión',
      output:
        'Para problemas de inicio de sesión, verifica que tu email y contraseña sean correctos. Si olvidaste tu contraseña, usa la opción "Recuperar contraseña". Si el problema persiste, contacta al soporte técnico con tu email registrado.',
      intent: 'login_issue',
      category: 'authentication',
      context: 'user_login_problem',
      confidence: 0.92,
    },
    {
      input: 'No se cargan las imágenes',
      output:
        'Si las imágenes no se cargan, verifica tu conexión a internet y actualiza la página. Asegúrate de que las imágenes estén en formato JPG, PNG o WebP y no excedan 10MB. Si el problema persiste, contacta al soporte.',
      intent: 'image_loading_issue',
      category: 'technical',
      context: 'user_image_problem',
      confidence: 0.87,
    },
    {
      input: '¿Cómo cambio mi contraseña?',
      output:
        'Para cambiar tu contraseña, ve a tu perfil de usuario y selecciona "Cambiar contraseña". Ingresa tu contraseña actual y la nueva contraseña. Asegúrate de que tenga al menos 8 caracteres, incluya mayúsculas, minúsculas y números.',
      intent: 'change_password',
      category: 'account_management',
      context: 'user_changing_password',
      confidence: 0.94,
    },
  ],
  patterns: [
    'No puedo iniciar sesión',
    'No se cargan las imágenes',
    '¿Cómo cambio mi contraseña?',
    'La página no carga',
    'Error en el sistema',
  ],
  responses: [
    'Te ayudo con el problema de inicio de sesión.',
    'Te guío para resolver el problema de imágenes.',
    'Te explico cómo cambiar tu contraseña.',
    'Te ayudo a resolver el problema de carga.',
    'Te conecto con soporte técnico.',
  ],
};

/**
 * DATASET ESPECIALIZADO - RUNNERS (AMPLIADO - FUENTE DE TRABAJO)
 */
export const runnerDataset: TrainingDataset = {
  category: 'runner_specialized',
  examples: [
    {
      input: '¿Cómo recibo tareas de visita?',
      output:
        'Las tareas de visita llegan automáticamente a tu panel según tu zona de cobertura y disponibilidad. Ve a "Tareas" para ver visitas disponibles. El sistema te notifica por email y push cuando hay nuevas tareas. Acepta rápidamente para aumentar tus oportunidades de trabajo.',
      intent: 'receive_tasks',
      category: 'tasks',
      context: 'runner_receiving_tasks',
      confidence: 0.94,
    },
    {
      input: '¿Cómo acepto una visita?',
      output:
        'Para aceptar una visita: 1) Ve a "Tareas" → "Disponibles" 2) Revisa los detalles (dirección, fecha, tipo de propiedad) 3) Si puedes hacerla, haz clic en "Aceptar Tarea" 4) Confirma tu disponibilidad. Una vez aceptada, aparecerá en "Mis Visitas" con toda la información necesaria.',
      intent: 'accept_visit',
      category: 'visits',
      context: 'runner_accepting_visit',
      confidence: 0.92,
    },
    {
      input: '¿Cómo hago una visita profesional?',
      output:
        'Para hacer una visita profesional: 1) Ve a la propiedad en la fecha/hora acordada 2) Toma mínimo 15 fotos profesionales (exterior, interior, detalles, servicios) 3) Mide ambientes principales 4) Verifica servicios (agua, luz, gas) 5) Completa el formulario de visita con observaciones. Sube fotos y completa el reporte desde "Visitas" → selecciona la visita → "Completar Reporte".',
      intent: 'complete_visit',
      category: 'visits',
      context: 'runner_completing_visit',
      confidence: 0.91,
    },
    {
      input: '¿Cómo subo fotos de mis visitas?',
      output:
        'Puedes subir fotos: 1) Durante la visita usando la app móvil 2) Después desde "Fotos" → "Subir Fotos" 3) Desde la página de cada visita específica. Sube mínimo 15 fotos de calidad: exterior, entrada, living, cocina, dormitorios, baños, detalles, y servicios. Las fotos profesionales aumentan tu calificación y ganancias.',
      intent: 'upload_photos',
      category: 'photos',
      context: 'runner_uploading_photos',
      confidence: 0.89,
    },
    {
      input: '¿Cuánto gano por visita?',
      output:
        'Ganas entre $15.000 y $25.000 por visita completada, dependiendo de la zona y tipo de propiedad. Además, puedes ganar incentivos por: completar muchas visitas semanales, mantener alta calificación, ser rápido en aceptar tareas, y alcanzar metas de rendimiento. Ve a "Ganancias" para ver tus ingresos detallados.',
      intent: 'earnings_per_visit',
      category: 'earnings',
      context: 'runner_asking_earnings',
      confidence: 0.9,
    },
    {
      input: '¿Cómo veo mis ganancias?',
      output:
        'En "Ganancias" puedes ver: ingresos totales, pagos por visita, incentivos ganados, pagos pendientes, pagos procesados, desglose por período, y tendencias de ingresos. Los pagos se procesan semanalmente y se depositan en tu cuenta bancaria registrada.',
      intent: 'view_earnings',
      category: 'earnings',
      context: 'runner_viewing_earnings',
      confidence: 0.91,
    },
    {
      input: '¿Cómo gano incentivos?',
      output:
        'Puedes ganar incentivos por: completar 20+ visitas semanales (Super Runner), generar más de $100.000 semanales (Top Earner), mantener calificación 4.9+ (Perfectionist), y más. Los incentivos incluyen bonos en efectivo, badges en tu perfil, y prioridad en asignación de visitas. Ve a "Incentivos" para ver todos los disponibles.',
      intent: 'earn_incentives',
      category: 'incentives',
      context: 'runner_earning_incentives',
      confidence: 0.88,
    },
    {
      input: '¿Cómo gestiono mi horario?',
      output:
        'En "Horario" puedes: bloquear fechas no disponibles, definir horarios de trabajo preferidos, ver tu disponibilidad, y coordinar con el sistema. Mantén tu horario actualizado para que el sistema te asigne visitas solo en tus horarios disponibles.',
      intent: 'manage_schedule',
      category: 'schedule',
      context: 'runner_managing_schedule',
      confidence: 0.87,
    },
    {
      input: '¿Cómo mejoro mi calificación?',
      output:
        'Para mejorar tu calificación: completa visitas a tiempo, toma fotos profesionales de calidad, completa reportes detallados, comunícate claramente con clientes, y responde rápido a solicitudes. Las buenas calificaciones te dan prioridad en asignación de visitas y acceso a incentivos.',
      intent: 'improve_rating',
      category: 'ratings',
      context: 'runner_improving_rating',
      confidence: 0.86,
    },
    {
      input: '¿Cómo veo mi rendimiento?',
      output:
        'En "Reportes" → "Rendimiento" puedes ver: número de visitas completadas, calificación promedio, tiempo promedio de respuesta, ingresos por período, ranking comparativo, y métricas de calidad. Esto te ayuda a entender tu progreso y optimizar tu estrategia.',
      intent: 'view_performance',
      category: 'reports',
      context: 'runner_viewing_performance',
      confidence: 0.88,
    },
    {
      input: '¿Cómo contacto a clientes?',
      output:
        'Puedes contactar a clientes a través de "Mensajes" en tu panel. El sistema de mensajería permite: coordinar horarios de visita, confirmar direcciones, enviar fotos, y hacer seguimiento. También puedes contactar desde la página de cada tarea específica.',
      intent: 'contact_clients',
      category: 'communication',
      context: 'runner_contacting_clients',
      confidence: 0.85,
    },
    {
      input: '¿Cuántas visitas puedo hacer por semana?',
      output:
        'No hay límite de visitas por semana. Puedes aceptar tantas como puedas completar. Los runners más activos pueden hacer 20+ visitas semanales y ganar incentivos especiales. El sistema te asigna visitas según tu disponibilidad y zona de cobertura.',
      intent: 'visits_per_week',
      category: 'tasks',
      context: 'runner_visits_limit',
      confidence: 0.84,
    },
    {
      input: '¿Cómo configuro mi zona de trabajo?',
      output:
        'En "Configuración" → "Zona de Trabajo" puedes: seleccionar comunas donde trabajas, definir radio de cobertura, y actualizar tu ubicación. El sistema te asignará visitas solo en tu zona configurada. Mantén tu zona actualizada para recibir las mejores oportunidades.',
      intent: 'configure_zone',
      category: 'settings',
      context: 'runner_configuring_zone',
      confidence: 0.86,
    },
  ],
  patterns: [
    '¿Cómo recibo tareas?',
    '¿Cómo acepto una visita?',
    '¿Cómo hago una visita?',
    '¿Cómo subo fotos?',
    '¿Cuánto gano por visita?',
    '¿Cómo veo mis ganancias?',
    '¿Cómo gano incentivos?',
    '¿Cómo gestiono horario?',
    '¿Cómo mejoro calificación?',
    '¿Cómo veo mi rendimiento?',
    '¿Cómo contacto clientes?',
    '¿Cuántas visitas puedo hacer?',
    '¿Cómo configuro mi zona?',
  ],
  responses: [
    'Te explico cómo recibir tareas.',
    'Te guío para aceptar visitas.',
    'Te explico cómo hacer visitas profesionales.',
    'Te guío para subir fotos.',
    'Te informo sobre ganancias por visita.',
    'Te muestro dónde ver tus ganancias.',
    'Te explico cómo ganar incentivos.',
    'Te guío para gestionar horario.',
    'Te explico cómo mejorar calificación.',
    'Te muestro tu rendimiento.',
    'Te explico cómo contactar clientes.',
    'Te informo sobre límites de visitas.',
    'Te guío para configurar zona de trabajo.',
  ],
};

/**
 * DATASET DE CONOCIMIENTO LEGAL Y REGULATORIO
 */
export const legalDataset: TrainingDataset = {
  category: 'legal_knowledge',
  examples: [
    {
      input: '¿Cuáles son los derechos del inquilino?',
      output:
        'Los inquilinos tienen derecho a: vivienda habitable, privacidad, notificación previa para visitas, devolución del depósito al finalizar el contrato, y a no ser discriminados. El contrato debe especificar claramente estos derechos y obligaciones.',
      intent: 'tenant_rights',
      category: 'legal',
      context: 'user_asking_about_rights',
      confidence: 0.88,
    },
    {
      input: '¿Cómo funciona el depósito de garantía?',
      output:
        'El depósito de garantía es un monto que el inquilino entrega al propietario como garantía del cumplimiento del contrato. Debe ser devuelto al finalizar el contrato, descontando daños no causados por uso normal. El monto máximo es equivalente a un mes de arriendo.',
      intent: 'security_deposit',
      category: 'legal',
      context: 'user_asking_about_deposit',
      confidence: 0.9,
    },
    {
      input: '¿Qué pasa si no pago el arriendo?',
      output:
        'Si no pagas el arriendo en la fecha acordada, el propietario puede cobrar intereses de mora (máximo 1.5% mensual). Después de 30 días de atraso, puede iniciar un proceso de desalojo. Es importante comunicar cualquier dificultad financiera al propietario.',
      intent: 'late_payment',
      category: 'legal',
      context: 'tenant_late_payment',
      confidence: 0.85,
    },
  ],
  patterns: [
    '¿Cuáles son mis derechos?',
    '¿Cómo funciona el depósito?',
    '¿Qué pasa si no pago?',
    '¿Puedo terminar el contrato?',
    '¿Qué dice la ley?',
  ],
  responses: [
    'Te explico tus derechos como inquilino.',
    'Te ayudo a entender el depósito de garantía.',
    'Te informo sobre las consecuencias del atraso.',
    'Te explico cómo terminar el contrato.',
    'Te proporciono información legal relevante.',
  ],
};

/**
 * DATASET PARA USUARIOS NO REGISTRADOS (GUEST) - CONOCIMIENTO TÉCNICO
 */
export const guestTechnicalDataset: TrainingDataset = {
  category: 'guest_technical',
  examples: [
    {
      input: '¿Cómo creo una cuenta?',
      output:
        'Para crear una cuenta en Rent360, ve a "Registrarse" y selecciona tu rol: Inquilino, Propietario, Corredor, Proveedor de Servicios o Runner360. Completa tus datos básicos (nombre, email, teléfono), verifica tu email y completa tu perfil. El registro es gratuito y rápido.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_about_registration',
      confidence: 0.95,
    },
    {
      input: '¿Qué tipos de servicios puedo ofrecer como proveedor?',
      output:
        'Como proveedor puedes ofrecer servicios de: mantenimiento general, jardinería, plomería, electricidad, limpieza, pintura, carpintería, seguridad, y otros servicios relacionados con propiedades. Puedes registrar múltiples tipos de servicios en tu perfil.',
      intent: 'provider_services',
      category: 'services',
      context: 'guest_asking_about_services',
      confidence: 0.92,
    },
    {
      input: '¿Cuál es el porcentaje de comisión para proveedores?',
      output:
        'La plataforma retiene un porcentaje configurable (generalmente 8%) del monto total del servicio como comisión. El resto se deposita directamente en tu cuenta bancaria registrada. El porcentaje exacto puede variar según configuración del administrador.',
      intent: 'commission_info',
      category: 'commissions',
      context: 'guest_asking_about_commissions',
      confidence: 0.9,
    },
    {
      input: '¿Qué documentos necesito para registrarme como proveedor?',
      output:
        'Para registrarte como proveedor necesitas: Cédula de Identidad (frente y reverso), Certificado de Antecedentes Penales (vigente), Certificado de Empresa (opcional, si tienes empresa), y Certificaciones profesionales (opcional pero recomendado, ej: plomero, electricista). Una vez aprobados, los documentos verificados son visibles para clientes.',
      intent: 'provider_documents',
      category: 'documents',
      context: 'guest_asking_about_documents',
      confidence: 0.94,
    },
    {
      input: '¿Cómo funciona el sistema de pagos?',
      output:
        'Rent360 maneja pagos seguros mediante múltiples métodos: transferencias bancarias, tarjetas de crédito/débito, y pasarelas de pago como Khipu. Los pagos son automáticos, seguros y rastreables. Los propietarios reciben pagos directamente, y las comisiones se calculan automáticamente.',
      intent: 'payment_system',
      category: 'payments',
      context: 'guest_asking_about_payments',
      confidence: 0.88,
    },
    {
      input: '¿Cuánto cobra Rent360 por sus servicios?',
      output:
        'Rent360 es gratuito para usuarios básicos. La plataforma cobra comisiones solo cuando hay transacciones exitosas: Corredores (3-5% del contrato), Proveedores de servicios (generalmente 8% del servicio), Runners (variable por visita). No hay costos de registro ni mensualidades.',
      intent: 'platform_fees',
      category: 'pricing',
      context: 'guest_asking_about_fees',
      confidence: 0.91,
    },
    {
      input: '¿Puedo ver propiedades sin registrarme?',
      output:
        'Sí, puedes explorar propiedades disponibles sin registrarte. Sin embargo, para contactar propietarios, corredores, agendar visitas con Runner360, o realizar acciones como guardar favoritos, necesitas crear una cuenta gratuita.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_about_properties',
      confidence: 0.89,
    },
    {
      input: '¿Cómo funciona Runner360?',
      output:
        'Runner360 es un servicio de visitas profesionales a propiedades. Los Runners hacen inspecciones presenciales, toman fotos profesionales, videos y generan reportes detallados. Los inquilinos pueden usar este servicio gratis, mientras que los propietarios pagan por cada visita. Los Runners ganan dinero flexiblemente por cada visita completada.',
      intent: 'runner360',
      category: 'services',
      context: 'guest_asking_about_runner360',
      confidence: 0.93,
    },
    {
      input: '¿Es seguro usar Rent360?',
      output:
        'Sí, Rent360 es completamente seguro. Todos los documentos son verificados por el equipo administrativo, los pagos se procesan mediante pasarelas seguras (Khipu, Stripe, PayPal), los contratos son legales con firma electrónica válida, y la información personal está protegida. Solo información aprobada y verificada es visible para otros usuarios.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_about_security',
      confidence: 0.9,
    },
    {
      input: '¿Qué diferencia a Rent360 de otras plataformas?',
      output:
        'Rent360 ofrece: gestión completa de propiedades y contratos, sistema de pagos integrado, Runner360 para visitas profesionales, proveedores de servicios verificados, casos legales integrados, contratos digitales con firma electrónica válida, y soporte 24/7. Todo en una sola plataforma diseñada específicamente para el mercado chileno.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_about_platform',
      confidence: 0.87,
    },
  ],
  patterns: [
    '¿Cómo creo una cuenta?',
    '¿Qué servicios puedo ofrecer?',
    '¿Cuál es la comisión?',
    '¿Qué documentos necesito?',
    '¿Cómo funciona el pago?',
    '¿Cuánto cuesta?',
    '¿Es seguro?',
    '¿Qué es Runner360?',
  ],
  responses: [
    'Te explico cómo crear tu cuenta.',
    'Te informo sobre los servicios disponibles.',
    'Te detallo los porcentajes de comisión.',
    'Te indico los documentos requeridos.',
    'Te explico el sistema de pagos.',
    'Te informo sobre los costos.',
    'Te explico las medidas de seguridad.',
    'Te detallo cómo funciona Runner360.',
  ],
};

/**
 * COMBINACIÓN DE TODOS LOS DATASETS
 */
export const allTrainingDatasets: TrainingDataset[] = [
  generalKnowledgeDataset,
  ownerDataset,
  tenantDataset,
  brokerDataset,
  providerDataset,
  runnerDataset,
  adminDataset,
  supportDataset,
  legalDataset,
  guestTechnicalDataset,
];

/**
 * FUNCIONES DE UTILIDAD PARA EL ENTRENAMIENTO
 */
export class TrainingDataManager {
  /**
   * Busca ejemplos de entrenamiento por categoría
   */
  static getExamplesByCategory(category: string): TrainingExample[] {
    const dataset = allTrainingDatasets.find(d => d.category === category);
    return dataset ? dataset.examples : [];
  }

  /**
   * Busca ejemplos por rol de usuario
   */
  static getExamplesByRole(role: string): TrainingExample[] {
    const roleDatasetMap: Record<string, string> = {
      OWNER: 'owner_specialized',
      TENANT: 'tenant_specialized',
      BROKER: 'broker_specialized',
      PROVIDER: 'provider_specialized',
      MAINTENANCE: 'provider_specialized',
      ADMIN: 'admin_specialized',
      GUEST: 'guest_technical',
      guest: 'guest_technical',
    };

    const category = roleDatasetMap[role.toUpperCase()] || 'general_knowledge';
    return this.getExamplesByCategory(category);
  }

  /**
   * Busca ejemplos por intención
   */
  static getExamplesByIntent(intent: string): TrainingExample[] {
    const allExamples: TrainingExample[] = [];
    allTrainingDatasets.forEach(dataset => {
      allExamples.push(...dataset.examples.filter(ex => ex.intent === intent));
    });
    return allExamples;
  }

  /**
   * Genera respuestas contextuales basadas en el entrenamiento (MEJORADO)
   */
  static generateContextualResponse(
    userInput: string,
    userRole: string,
    context: string
  ): string | null {
    const inputLower = userInput.toLowerCase();

    // 🚀 MEJORADO: Buscar por palabras clave específicas primero
    const keywords = inputLower.split(/\s+/);

    // Buscar ejemplos específicos del rol
    const roleExamples = this.getExamplesByRole(userRole);

    // Buscar coincidencia exacta o muy similar
    let bestMatch = roleExamples.find(ex => {
      const exInputLower = ex.input.toLowerCase();
      // Coincidencia exacta
      if (exInputLower === inputLower) {
        return true;
      }
      // Coincidencia de palabras clave importantes
      const importantKeywords = keywords.filter(k => k.length > 3);
      const exKeywords = exInputLower.split(/\s+/).filter(k => k.length > 3);
      const matchingKeywords = importantKeywords.filter(k => exKeywords.includes(k));
      return matchingKeywords.length >= Math.min(2, importantKeywords.length);
    });

    if (bestMatch) {
      return bestMatch.output;
    }

    // Buscar por intención si no hay coincidencia directa
    const intentKeywords: Record<string, string[]> = {
      documents_visibility: ['documento', 'ver', 'visible', 'acceso', 'otros', 'usuarios'],
      provider_documents: ['documento', 'proveedor', 'necesito', 'requiero', 'certificado'],
      commission_info: ['comisión', 'porcentaje', 'retención', 'cobran', 'gano'],
      register: ['registro', 'crear', 'cuenta', 'registrarme', 'darme de alta'],
      payment_system: ['pago', 'pagos', 'sistema', 'funciona', 'método'],
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(k => inputLower.includes(k))) {
        const intentExamples = this.getExamplesByIntent(intent);
        const match = intentExamples.find(ex =>
          keywords.some(k => ex.input.toLowerCase().includes(k))
        );
        if (match) {
          return match.output;
        }
      }
    }

    // Buscar en conocimiento general como último recurso
    const generalExamples = this.getExamplesByCategory('general_knowledge');
    const generalMatch = generalExamples.find(ex => {
      const exInputLower = ex.input.toLowerCase();
      return exInputLower.includes(inputLower) || inputLower.includes(exInputLower);
    });

    return generalMatch ? generalMatch.output : null;
  }

  /**
   * Obtiene sugerencias basadas en el rol
   */
  static getSuggestionsByRole(role: string): string[] {
    const roleSuggestionsMap: Record<string, string[]> = {
      OWNER: [
        '¿Cómo agrego una nueva propiedad?',
        '¿Dónde veo mis ingresos mensuales?',
        '¿Cómo manejo solicitudes de mantenimiento?',
        '¿Puedo configurar pagos automáticos?',
      ],
      TENANT: [
        '¿Cómo pago mi arriendo?',
        '¿Cómo solicito mantenimiento?',
        '¿Dónde veo mi contrato?',
        '¿Cómo contacto a mi propietario?',
      ],
      BROKER: [
        '¿Cómo gestiono mis clientes?',
        '¿Cómo calculo mis comisiones?',
        '¿Cómo agrego propiedades para mis clientes?',
        '¿Dónde veo mis ingresos?',
      ],
      PROVIDER: [
        '¿Cómo recibo trabajos?',
        '¿Cómo acepto un trabajo?',
        '¿Cómo veo mis ganancias?',
        '¿Cómo configuro cuenta bancaria?',
        '¿Cómo mejoro mis calificaciones?',
        '¿Cómo configuro mis servicios?',
      ],
      RUNNER: [
        '¿Cómo recibo tareas?',
        '¿Cómo acepto una visita?',
        '¿Cómo hago una visita profesional?',
        '¿Cuánto gano por visita?',
        '¿Cómo gano incentivos?',
        '¿Cómo veo mis ganancias?',
        '¿Cómo mejoro mi calificación?',
      ],
      ADMIN: [
        '¿Cómo gestiono usuarios del sistema?',
        '¿Cómo veo las estadísticas del sistema?',
        '¿Cómo configuro las comisiones?',
        '¿Cómo genero reportes?',
      ],
      GUEST: [
        '¿Cómo creo una cuenta?',
        '¿Qué servicios puedo ofrecer como proveedor?',
        '¿Cuál es el porcentaje de comisión?',
        '¿Qué documentos necesito para registrarme?',
        '¿Cómo funciona el sistema de pagos?',
        '¿Es seguro usar Rent360?',
      ],
      guest: [
        '¿Cómo creo una cuenta?',
        '¿Qué servicios puedo ofrecer como proveedor?',
        '¿Cuál es el porcentaje de comisión?',
        '¿Qué documentos necesito para registrarme?',
        '¿Cómo funciona el sistema de pagos?',
        '¿Es seguro usar Rent360?',
      ],
    };

    return (
      roleSuggestionsMap[role.toUpperCase()] || [
        '¿Qué es Rent360?',
        '¿Cómo funciona el sistema de pagos?',
        '¿Cómo puedo obtener ayuda?',
        '¿Cuáles son las funcionalidades principales?',
      ]
    );
  }

  /**
   * Calcula la confianza de una respuesta basada en el entrenamiento
   */
  static calculateConfidence(userInput: string, response: string, userRole: string): number {
    const examples = this.getExamplesByRole(userRole);
    const exactMatch = examples.find(ex => ex.input === userInput);

    if (exactMatch) {
      return exactMatch.confidence;
    }

    // Buscar coincidencias parciales
    const partialMatches = examples.filter(
      ex =>
        ex.input.toLowerCase().includes(userInput.toLowerCase()) ||
        userInput.toLowerCase().includes(ex.input.toLowerCase())
    );

    if (partialMatches.length > 0) {
      return Math.max(...partialMatches.map(m => m.confidence)) * 0.8;
    }

    // Confianza base para respuestas generales
    return 0.6;
  }
}

export default allTrainingDatasets;
