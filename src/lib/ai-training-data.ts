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
      input: '¿Cuál es la comisión que se le paga a un corredor?',
      output:
        'Los corredores inmobiliarios en Rent360 reciben una comisión del 3% al 5% del valor total del contrato de arriendo celebrado. Esta comisión se calcula automáticamente cuando se firma un contrato y se paga al corredor una vez que el contrato está activo. El porcentaje exacto puede variar según el acuerdo entre el corredor y el propietario, pero típicamente está en ese rango. La plataforma facilita el cálculo y pago automático de estas comisiones.',
      intent: 'commission_info',
      category: 'pricing',
      context: 'guest_asking_broker_commission',
      confidence: 0.95,
    },
    {
      input: '¿Cuánto cobra un corredor?',
      output:
        'Los corredores en Rent360 cobran entre el 3% y el 5% del valor total del contrato de arriendo. Por ejemplo, si un contrato es de $500.000 mensuales por 12 meses, la comisión sería entre $180.000 y $300.000 (3-5% de $6.000.000). Esta comisión se paga una vez que el contrato está firmado y activo. El porcentaje exacto se acuerda entre el corredor y el propietario al momento de asignar la gestión de la propiedad.',
      intent: 'commission_info',
      category: 'pricing',
      context: 'guest_asking_broker_fee',
      confidence: 0.94,
    },
    {
      input: '¿Cuánto es la comisión de corredores?',
      output:
        'La comisión de corredores en Rent360 es del 3% al 5% del valor total del contrato de arriendo. Esta comisión se calcula sobre el monto total del contrato (por ejemplo, si es $500.000 mensuales por 12 meses = $6.000.000, la comisión sería entre $180.000 y $300.000). El sistema calcula y procesa el pago automáticamente cuando el contrato se activa. No hay costos adicionales ni mensualidades para corredores.',
      intent: 'commission_info',
      category: 'pricing',
      context: 'guest_asking_broker_commission_rate',
      confidence: 0.95,
    },
    {
      input: 'comision corredor',
      output:
        'Los corredores en Rent360 reciben una comisión del 3% al 5% del valor total del contrato de arriendo. Esta comisión se paga automáticamente cuando el contrato está firmado y activo. El sistema calcula y procesa el pago sin intervención manual. El porcentaje exacto se acuerda entre el corredor y el propietario al asignar la gestión de la propiedad.',
      intent: 'commission_info',
      category: 'pricing',
      context: 'guest_asking_broker_commission_short',
      confidence: 0.93,
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
    // REGISTRO Y CUENTAS
    {
      input: '¿Necesito pagar para registrarme?',
      output:
        'No, el registro en Rent360 es completamente gratuito. No hay costos de registro, mensualidades ni tarifas ocultas. Solo se cobran comisiones cuando hay transacciones exitosas (contratos firmados, servicios completados). Puedes crear tu cuenta gratis y comenzar a usar la plataforma inmediatamente.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_about_registration_cost',
      confidence: 0.95,
    },
    {
      input: '¿Qué información necesito para registrarme?',
      output:
        'Para registrarte necesitas: nombre completo, email válido, número de teléfono, y seleccionar tu rol (Inquilino, Propietario, Corredor, Proveedor o Runner). Dependiendo del rol, después del registro inicial podrás completar tu perfil con documentos adicionales para verificación.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_registration_info',
      confidence: 0.93,
    },
    {
      input: '¿Puedo tener múltiples cuentas?',
      output:
        'No recomendamos tener múltiples cuentas. Cada usuario debe tener una sola cuenta con su información real y verificada. Si necesitas cambiar de rol o actualizar tu información, puedes hacerlo desde la configuración de tu cuenta. Esto asegura la seguridad y transparencia de la plataforma.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_multiple_accounts',
      confidence: 0.9,
    },
    {
      input: '¿Cómo recupero mi contraseña si la olvidé?',
      output:
        'Si olvidaste tu contraseña, ve a "Iniciar Sesión" y haz clic en "¿Olvidaste tu contraseña?". Ingresa tu email registrado y recibirás un enlace para restablecer tu contraseña. El enlace es válido por un tiempo limitado por seguridad.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_password_recovery',
      confidence: 0.94,
    },
    // ROLES Y TIPOS DE USUARIOS
    {
      input: '¿Qué roles existen en Rent360?',
      output:
        'Rent360 tiene 5 roles principales: Inquilino (busca y arrienda propiedades), Propietario (gestiona propiedades y recibe pagos), Corredor (intermedia entre propietarios e inquilinos), Proveedor de Servicios (ofrece servicios de mantenimiento), y Runner360 (realiza visitas profesionales a propiedades). Cada rol tiene funcionalidades específicas diseñadas para sus necesidades.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_about_roles',
      confidence: 0.92,
    },
    {
      input: '¿Puedo cambiar de rol después de registrarme?',
      output:
        'Sí, puedes actualizar tu información de rol desde la configuración de tu cuenta. Sin embargo, algunos cambios pueden requerir verificación adicional de documentos dependiendo del nuevo rol. Por ejemplo, para ser corredor necesitarás certificación profesional válida.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_role_change',
      confidence: 0.88,
    },
    {
      input: '¿Qué es un corredor certificado?',
      output:
        'Un corredor certificado es un profesional inmobiliario que ha completado la certificación requerida y está autorizado para ejercer como corredor de propiedades. En Rent360, los corredores certificados pueden gestionar propiedades de clientes, cerrar contratos y recibir comisiones. Deben subir su certificación vigente durante el registro.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_about_brokers',
      confidence: 0.91,
    },
    // FUNCIONALIDADES DE LA PLATAFORMA
    {
      input: '¿Qué puedo hacer en Rent360 sin registrarme?',
      output:
        'Sin registrarte puedes: explorar propiedades disponibles, ver información pública de propiedades, leer sobre las funcionalidades de la plataforma, y usar el chatbot para hacer preguntas. Para acciones como contactar propietarios, agendar visitas, crear contratos o realizar pagos, necesitas crear una cuenta gratuita.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_public_features',
      confidence: 0.89,
    },
    {
      input: '¿Cómo busco propiedades en Rent360?',
      output:
        'Puedes buscar propiedades usando filtros avanzados: ubicación (comuna, sector), precio (rango mensual), tipo (casa, departamento, oficina, local), habitaciones, baños, y características especiales. También puedes usar Runner360 para visitas profesionales gratuitas si eres inquilino. La búsqueda está disponible sin registro, pero para contactar necesitas cuenta.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_how_to_search',
      confidence: 0.93,
    },
    {
      input: '¿Cómo funciona el sistema de calificaciones?',
      output:
        'Rent360 tiene un sistema de calificaciones mutuas donde usuarios pueden calificarse entre sí después de transacciones. Las calificaciones van de 1 a 5 estrellas e incluyen comentarios. Esto ayuda a construir confianza en la comunidad. Solo usuarios que han tenido interacciones reales pueden calificarse.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_about_ratings',
      confidence: 0.9,
    },
    {
      input: '¿Cómo funcionan los contratos digitales?',
      output:
        'Los contratos en Rent360 son digitales con firma electrónica válida legalmente (TrustFactory). Incluyen todas las cláusulas legales estándar, se pueden personalizar según necesidades, y ambas partes firman electrónicamente. Los contratos se almacenan de forma segura y están disponibles 24/7. Son tan válidos como contratos en papel según la legislación chilena.',
      intent: 'contracts',
      category: 'contracts',
      context: 'guest_asking_about_contracts',
      confidence: 0.92,
    },
    // COMISIONES Y COSTOS (AMPLIADO)
    {
      input: '¿Cuánto cuesta usar Rent360?',
      output:
        'Rent360 es gratuito para usuarios básicos. No hay costos de registro, mensualidades ni tarifas ocultas. La plataforma cobra comisiones solo cuando hay transacciones exitosas: Corredores (3-5% del contrato), Proveedores (generalmente 8% del servicio), Runners (variable por visita). Los inquilinos y propietarios no pagan comisiones por usar la plataforma básica.',
      intent: 'platform_fees',
      category: 'pricing',
      context: 'guest_asking_total_cost',
      confidence: 0.94,
    },
    {
      input: '¿Los inquilinos pagan comisiones?',
      output:
        'No, los inquilinos no pagan comisiones a Rent360. El sistema es gratuito para inquilinos. Solo pagas el arriendo acordado con el propietario. Las comisiones de corredores son pagadas por los propietarios, no por los inquilinos.',
      intent: 'platform_fees',
      category: 'pricing',
      context: 'guest_asking_tenant_fees',
      confidence: 0.95,
    },
    {
      input: '¿Los propietarios pagan comisiones?',
      output:
        'Los propietarios no pagan comisiones a Rent360 por usar la plataforma básica. Si contratas un corredor para gestionar tu propiedad, pagas la comisión acordada con el corredor (típicamente 3-5% del contrato). Si usas Runner360 para visitas profesionales, pagas por cada visita realizada. Pero la plataforma en sí es gratuita para propietarios.',
      intent: 'platform_fees',
      category: 'pricing',
      context: 'guest_asking_owner_fees',
      confidence: 0.94,
    },
    {
      input: '¿Cuánto gana un Runner por visita?',
      output:
        'Los Runners ganan entre $15.000 y $25.000 por visita completada, dependiendo de la zona y tipo de propiedad. Además, pueden ganar incentivos por volumen (completar 20+ visitas semanales), calidad (mantener alta calificación), y rendimiento. Los pagos se procesan semanalmente y se depositan en su cuenta bancaria.',
      intent: 'runner360',
      category: 'services',
      context: 'guest_asking_runner_earnings',
      confidence: 0.91,
    },
    // SEGURIDAD Y PRIVACIDAD
    {
      input: '¿Mis datos están seguros en Rent360?',
      output:
        'Sí, Rent360 implementa múltiples medidas de seguridad: encriptación de datos, verificación de identidad, documentos verificados por administradores, pagos seguros mediante pasarelas certificadas (Khipu, Stripe, PayPal), y cumplimiento con normativas de protección de datos. Tu información personal solo es visible para usuarios autorizados según tu configuración de privacidad.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_data_security',
      confidence: 0.93,
    },
    {
      input: '¿Quién puede ver mi información personal?',
      output:
        'Tu información personal está protegida. Solo información aprobada y verificada es visible para otros usuarios según tu rol y configuración. Por ejemplo: propietarios pueden ver información básica de inquilinos con contratos activos, pero no datos sensibles como números de cuenta. Los documentos personales solo los ve el equipo administrativo para verificación.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_privacy',
      confidence: 0.92,
    },
    {
      input: '¿Cómo protege Rent360 mis pagos?',
      output:
        'Rent360 usa pasarelas de pago certificadas y seguras: Khipu, Stripe, PayPal, y WebPay. Todas las transacciones están encriptadas, no almacenamos información de tarjetas de crédito, y cumplimos con estándares PCI DSS. Los pagos se procesan directamente entre las partes, Rent360 solo facilita la transacción de forma segura.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_payment_security',
      confidence: 0.94,
    },
    // DOCUMENTOS Y VERIFICACIÓN
    {
      input: '¿Qué documentos necesito como propietario?',
      output:
        'Como propietario necesitas: Cédula de Identidad (frente y reverso), Certificado de Antecedentes Penales (vigente), y documentos de propiedad (escritura, título de dominio) para verificar que eres el dueño. También puedes subir información bancaria para recibir pagos. Todos los documentos son verificados por el equipo administrativo.',
      intent: 'provider_documents',
      category: 'documents',
      context: 'guest_asking_owner_documents',
      confidence: 0.93,
    },
    {
      input: '¿Qué documentos necesito como inquilino?',
      output:
        'Como inquilino necesitas: Cédula de Identidad (frente y reverso) y Certificado de Antecedentes Penales (vigente). Opcionalmente puedes subir comprobantes de ingresos o referencias. Los documentos son verificados por el equipo administrativo y solo información aprobada es visible para propietarios cuando hay contratos activos.',
      intent: 'provider_documents',
      category: 'documents',
      context: 'guest_asking_tenant_documents',
      confidence: 0.92,
    },
    {
      input: '¿Cuánto tarda la verificación de documentos?',
      output:
        'La verificación de documentos generalmente toma entre 24 y 48 horas hábiles. El equipo administrativo revisa cada documento manualmente para asegurar autenticidad. Recibirás una notificación cuando tu verificación esté completa. Mientras tanto, puedes usar la plataforma con funcionalidades limitadas.',
      intent: 'provider_documents',
      category: 'documents',
      context: 'guest_asking_verification_time',
      confidence: 0.9,
    },
    {
      input: '¿Qué pasa si mis documentos son rechazados?',
      output:
        'Si tus documentos son rechazados, recibirás una notificación explicando el motivo. Puedes corregir el problema y volver a subirlos. Los motivos comunes incluyen: documentos vencidos, calidad de imagen insuficiente, o información no coincidente. El equipo de soporte puede ayudarte a resolver cualquier problema.',
      intent: 'provider_documents',
      category: 'documents',
      context: 'guest_asking_document_rejection',
      confidence: 0.88,
    },
    // SERVICIOS ESPECÍFICOS
    {
      input: '¿Qué servicios ofrece Runner360?',
      output:
        'Runner360 ofrece visitas profesionales a propiedades: fotos de alta calidad (mínimo 15 por propiedad), videos detallados, reportes completos con medidas exactas, verificación de servicios (agua, luz, gas), y evaluación del estado general. Los inquilinos pueden usar este servicio gratis, mientras que los propietarios pagan por cada visita. Los Runners son profesionales verificados.',
      intent: 'runner360',
      category: 'services',
      context: 'guest_asking_runner_services',
      confidence: 0.93,
    },
    {
      input: '¿Cómo me convierto en Runner360?',
      output:
        'Para ser Runner360: 1) Regístrate seleccionando el rol "Runner360" 2) Completa tu perfil con información personal 3) Sube documentos de identidad y antecedentes 4) Define tu zona de cobertura (comunas donde trabajas) 5) Configura tu disponibilidad horaria. Una vez verificado, comenzarás a recibir tareas de visita automáticamente según tu zona.',
      intent: 'runner360',
      category: 'services',
      context: 'guest_asking_become_runner',
      confidence: 0.91,
    },
    {
      input: '¿Qué tipos de servicios puedo contratar como propietario?',
      output:
        'Como propietario puedes contratar servicios de: mantenimiento general, plomería, electricidad, jardinería, limpieza, pintura, carpintería, seguridad, y más. Todos los proveedores están verificados por el equipo administrativo. Puedes ver calificaciones, precios y disponibilidad antes de contratar. El sistema coordina automáticamente la asignación de servicios.',
      intent: 'provider_services',
      category: 'services',
      context: 'guest_asking_owner_services',
      confidence: 0.92,
    },
    {
      input: '¿Cómo funciona el servicio de corredores?',
      output:
        'Los corredores en Rent360 pueden gestionar tus propiedades de forma completa o parcial. Puedes asignar propiedades específicas a un corredor, definir el tipo de gestión (completa, parcial, solo marketing, solo arriendo), y acordar la comisión (típicamente 3-5%). El corredor se encarga de publicar, mostrar, y cerrar contratos. Puedes mantener control total o delegar completamente.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_broker_service',
      confidence: 0.9,
    },
    // SISTEMA DE PAGOS (AMPLIADO)
    {
      input: '¿Qué métodos de pago acepta Rent360?',
      output:
        'Rent360 acepta múltiples métodos de pago: transferencias bancarias directas, tarjetas de crédito y débito, y pasarelas de pago como Khipu, Stripe, PayPal, y WebPay. Los inquilinos pueden configurar pagos automáticos para no preocuparse por fechas de vencimiento. Todos los métodos son seguros y certificados.',
      intent: 'payment_system',
      category: 'payments',
      context: 'guest_asking_payment_methods',
      confidence: 0.93,
    },
    {
      input: '¿Cómo reciben el dinero los propietarios?',
      output:
        'Los propietarios reciben pagos directamente en su cuenta bancaria registrada. El sistema procesa pagos automáticamente cuando los inquilinos pagan, y transfiere el dinero directamente sin intermediarios. Puedes configurar tu cuenta bancaria en la configuración de tu perfil. Los pagos son seguros y rastreables.',
      intent: 'payment_system',
      category: 'payments',
      context: 'guest_asking_owner_payments',
      confidence: 0.92,
    },
    {
      input: '¿Puedo pagar con débito automático?',
      output:
        'Sí, puedes configurar débito automático para pagar tu arriendo automáticamente cada mes. Ve a "Mis Pagos" → "Métodos de Pago" y configura tu tarjeta o cuenta bancaria. El sistema te enviará recordatorios antes de cada cobro y recibirás comprobantes automáticos. Puedes cancelar el débito automático en cualquier momento.',
      intent: 'payment_system',
      category: 'payments',
      context: 'guest_asking_automatic_payment',
      confidence: 0.91,
    },
    {
      input: '¿Hay algún costo adicional por usar métodos de pago?',
      output:
        'Rent360 no cobra comisiones adicionales por usar métodos de pago. Sin embargo, algunas pasarelas de pago (como tarjetas de crédito) pueden tener sus propias comisiones que se deducen del monto. Estas comisiones son estándar del mercado y son transparentes antes de realizar el pago.',
      intent: 'payment_system',
      category: 'payments',
      context: 'guest_asking_payment_fees',
      confidence: 0.89,
    },
    // PROPIEDADES Y BÚSQUEDA (AMPLIADO)
    {
      input: '¿Puedo publicar mi propiedad sin pagar?',
      output:
        'Sí, publicar propiedades es completamente gratuito. Puedes crear tu cuenta como propietario, agregar tus propiedades con fotos y detalles, y publicarlas sin costo. Solo pagas comisiones si contratas un corredor para gestionar la propiedad o si usas servicios adicionales como Runner360 para visitas profesionales.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_publish_property',
      confidence: 0.94,
    },
    {
      input: '¿Cuántas propiedades puedo publicar?',
      output:
        'No hay límite en el número de propiedades que puedes publicar como propietario. Puedes gestionar todas tus propiedades desde un solo panel, ver estadísticas de cada una, y gestionar contratos e inquilinos de forma centralizada. La plataforma está diseñada para propietarios con una o múltiples propiedades.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_property_limit',
      confidence: 0.92,
    },
    {
      input: '¿Cómo contacto a un propietario o corredor?',
      output:
        'Para contactar a un propietario o corredor, necesitas crear una cuenta gratuita. Una vez registrado, puedes usar el sistema de mensajería integrado para comunicarte directamente, hacer preguntas sobre propiedades, agendar visitas, y negociar términos. El sistema de mensajería es seguro y mantiene un registro de todas las conversaciones.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_contact_owner',
      confidence: 0.91,
    },
    {
      input: '¿Puedo guardar propiedades favoritas?',
      output:
        'Sí, una vez que tengas una cuenta, puedes guardar propiedades como favoritas para revisarlas después. Esto te permite comparar opciones y tomar decisiones informadas. También puedes recibir notificaciones cuando propiedades favoritas cambien de precio o disponibilidad.',
      intent: 'property_search',
      category: 'properties',
      context: 'guest_asking_favorites',
      confidence: 0.9,
    },
    // CONTRATOS (AMPLIADO)
    {
      input: '¿Los contratos son legalmente válidos?',
      output:
        'Sí, los contratos digitales de Rent360 son completamente válidos legalmente. Usan firma electrónica certificada (TrustFactory) que cumple con la legislación chilena. Son tan válidos como contratos en papel y pueden usarse en procesos legales si es necesario. Incluyen todas las cláusulas legales estándar requeridas por la ley.',
      intent: 'contracts',
      category: 'contracts',
      context: 'guest_asking_contract_validity',
      confidence: 0.94,
    },
    {
      input: '¿Puedo personalizar un contrato?',
      output:
        'Sí, los contratos pueden personalizarse según las necesidades específicas de ambas partes. Puedes agregar cláusulas adicionales, modificar términos estándar (con acuerdo mutuo), y definir condiciones especiales. Sin embargo, todas las modificaciones deben cumplir con la legislación chilena y ser aceptadas por ambas partes.',
      intent: 'contracts',
      category: 'contracts',
      context: 'guest_asking_contract_customization',
      confidence: 0.91,
    },
    {
      input: '¿Cómo funciona el depósito de garantía?',
      output:
        'El depósito de garantía es un monto que el inquilino entrega al propietario como garantía del cumplimiento del contrato. En Rent360, el depósito se puede gestionar digitalmente y debe ser devuelto al finalizar el contrato, descontando daños no causados por uso normal. El monto máximo legalmente permitido es equivalente a un mes de arriendo.',
      intent: 'contracts',
      category: 'contracts',
      context: 'guest_asking_security_deposit',
      confidence: 0.92,
    },
    // CASOS DE USO Y BENEFICIOS
    {
      input: '¿Qué beneficios tiene Rent360 para propietarios?',
      output:
        'Rent360 ofrece a propietarios: gestión completa de propiedades desde un solo lugar, pagos automáticos y seguros, contratos digitales legales, sistema de mantenimiento integrado, analytics y reportes financieros, gestión de inquilinos centralizada, casos legales integrados, y acceso a corredores certificados. Todo diseñado para maximizar tus ingresos y simplificar la gestión.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_owner_benefits',
      confidence: 0.93,
    },
    {
      input: '¿Qué beneficios tiene Rent360 para inquilinos?',
      output:
        'Rent360 ofrece a inquilinos: búsqueda avanzada de propiedades con filtros detallados, acceso a Runner360 para visitas profesionales gratis, contratos digitales seguros, sistema de pagos integrado con recordatorios, solicitud de mantenimiento fácil, comunicación directa con propietarios, y sistema de calificaciones para elegir mejor. Todo para encontrar y gestionar tu arriendo de forma fácil.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_tenant_benefits',
      confidence: 0.93,
    },
    {
      input: '¿Por qué debería usar Rent360 en lugar de otras opciones?',
      output:
        'Rent360 es la única plataforma integral que combina: búsqueda de propiedades, gestión de contratos legales, sistema de pagos integrado, servicios de mantenimiento, casos legales, y visitas profesionales (Runner360), todo en un solo lugar. Está diseñada específicamente para el mercado chileno, con soporte en español y cumplimiento de legislación local.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_why_rent360',
      confidence: 0.9,
    },
    // SOPORTE Y AYUDA
    {
      input: '¿Cómo puedo contactar soporte?',
      output:
        'Puedes contactar soporte de múltiples formas: usando el chatbot de la plataforma (disponible 24/7), creando un ticket de soporte desde tu panel, enviando un email al equipo de soporte, o llamando al número de contacto. El equipo responde generalmente en menos de 24 horas. También hay una base de conocimientos con respuestas a preguntas frecuentes.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_support',
      confidence: 0.92,
    },
    {
      input: '¿Hay tutoriales o guías disponibles?',
      output:
        'Sí, Rent360 ofrece: tutoriales paso a paso para cada funcionalidad, guías de uso por rol, videos explicativos, base de conocimientos actualizada, y el chatbot de IA que puede responder preguntas en tiempo real. Todo está diseñado para que puedas usar la plataforma fácilmente, incluso si es tu primera vez.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_tutorials',
      confidence: 0.91,
    },
    {
      input: '¿Qué hago si tengo un problema técnico?',
      output:
        'Si tienes un problema técnico: 1) Intenta refrescar la página o cerrar y abrir tu navegador 2) Verifica tu conexión a internet 3) Usa el chatbot para buscar soluciones comunes 4) Crea un ticket de soporte desde tu panel describiendo el problema 5) El equipo técnico te responderá con una solución. Incluye capturas de pantalla si es posible.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_technical_help',
      confidence: 0.89,
    },
    // TÉRMINOS Y POLÍTICAS
    {
      input: '¿Dónde puedo ver los términos y condiciones?',
      output:
        'Los términos y condiciones de Rent360 están disponibles en el footer del sitio web y también puedes accederlos desde la configuración de tu cuenta una vez registrado. Incluyen información sobre uso de la plataforma, responsabilidades de usuarios, políticas de privacidad, y términos de servicio. Es importante leerlos antes de usar la plataforma.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_terms',
      confidence: 0.9,
    },
    {
      input: '¿Cómo funciona la política de privacidad?',
      output:
        'La política de privacidad de Rent360 protege tu información personal. Solo compartimos información necesaria para el funcionamiento de la plataforma, nunca vendemos datos a terceros, y toda la información está encriptada. Puedes ver qué información es visible para otros usuarios desde la configuración de privacidad de tu cuenta.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_privacy_policy',
      confidence: 0.91,
    },
    // REQUISITOS TÉCNICOS
    {
      input: '¿Qué navegadores son compatibles?',
      output:
        'Rent360 es compatible con los navegadores modernos más comunes: Google Chrome (recomendado), Mozilla Firefox, Microsoft Edge, Safari, y Opera. Funciona mejor en versiones actualizadas de estos navegadores. También está optimizado para dispositivos móviles y tablets, con una aplicación web responsive que se adapta a cualquier tamaño de pantalla.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_browser_compatibility',
      confidence: 0.9,
    },
    {
      input: '¿Funciona en dispositivos móviles?',
      output:
        'Sí, Rent360 está completamente optimizado para dispositivos móviles y tablets. Puedes acceder desde cualquier smartphone o tablet usando el navegador móvil. La interfaz se adapta automáticamente al tamaño de tu pantalla. También puedes agregar Rent360 a la pantalla de inicio de tu móvil para acceso rápido como una app.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_mobile_support',
      confidence: 0.93,
    },
    {
      input: '¿Necesito instalar algo para usar Rent360?',
      output:
        'No, Rent360 es una aplicación web que funciona directamente desde tu navegador. No necesitas instalar software adicional. Solo necesitas un navegador moderno y conexión a internet. Opcionalmente puedes agregar Rent360 a la pantalla de inicio de tu móvil para acceso rápido, pero no es necesario.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_installation',
      confidence: 0.94,
    },
    // DISPONIBILIDAD GEOGRÁFICA
    {
      input: '¿En qué países funciona Rent360?',
      output:
        'Rent360 está diseñado específicamente para el mercado chileno. Funciona en todo Chile y está optimizado para la legislación y prácticas inmobiliarias locales. Si estás fuera de Chile, puedes acceder a la plataforma pero algunas funcionalidades pueden estar limitadas según tu ubicación.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_geographic_availability',
      confidence: 0.92,
    },
    {
      input: '¿Funciona en todas las ciudades de Chile?',
      output:
        'Sí, Rent360 funciona en todas las ciudades y comunas de Chile. Puedes buscar propiedades en cualquier ubicación, y los servicios como Runner360 y proveedores de mantenimiento están disponibles según su zona de cobertura. La plataforma está diseñada para ser accesible en todo el territorio nacional.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_cities',
      confidence: 0.91,
    },
    // PREGUNTAS FRECUENTES GENERALES
    {
      input: '¿Qué es Rent360?',
      output:
        'Rent360 es una plataforma integral de gestión inmobiliaria diseñada para el mercado chileno. Conecta propietarios, inquilinos, corredores y proveedores de servicios en un solo lugar. Ofrece herramientas completas para buscar propiedades, gestionar contratos legales, procesar pagos seguros, coordinar mantenimiento, y más. Todo diseñado para simplificar el proceso de arriendo.',
      intent: 'platform_info',
      category: 'general',
      context: 'guest_asking_what_is_rent360',
      confidence: 0.95,
    },
    {
      input: '¿Rent360 es confiable?',
      output:
        'Sí, Rent360 es completamente confiable. Todos los usuarios son verificados, los documentos son revisados por administradores, los pagos son seguros mediante pasarelas certificadas, los contratos son legales con firma electrónica válida, y hay un sistema de calificaciones para construir confianza. La plataforma cumple con todas las normativas de seguridad y protección de datos.',
      intent: 'security',
      category: 'security',
      context: 'guest_asking_reliability',
      confidence: 0.93,
    },
    {
      input: '¿Cuánto tiempo lleva registrarse?',
      output:
        'El registro básico toma menos de 5 minutos. Solo necesitas: nombre, email, teléfono y seleccionar tu rol. Después puedes completar tu perfil y subir documentos para verificación (esto puede tomar unos minutos más). Una vez registrado, puedes comenzar a usar la plataforma inmediatamente, aunque algunas funcionalidades requieren verificación completa.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_registration_time',
      confidence: 0.94,
    },
    {
      input: '¿Puedo cancelar mi cuenta en cualquier momento?',
      output:
        'Sí, puedes cancelar o desactivar tu cuenta en cualquier momento desde la configuración de tu perfil. Sin embargo, si tienes contratos activos o transacciones pendientes, deberás completarlas primero. Una vez cancelada, tu información se mantiene según nuestras políticas de retención de datos, pero ya no podrás acceder a la plataforma.',
      intent: 'register',
      category: 'registration',
      context: 'guest_asking_account_cancellation',
      confidence: 0.9,
    },
    {
      input: '¿Hay una aplicación móvil?',
      output:
        'Rent360 es una aplicación web progresiva (PWA) que funciona como una app móvil. Puedes agregarla a la pantalla de inicio de tu móvil desde el navegador y funcionará como una app nativa. No necesitas descargar nada de tiendas de aplicaciones. Funciona en iOS y Android a través del navegador móvil.',
      intent: 'support',
      category: 'support',
      context: 'guest_asking_mobile_app',
      confidence: 0.92,
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
    '¿Necesito pagar para registrarme?',
    '¿Qué información necesito para registrarme?',
    '¿Puedo tener múltiples cuentas?',
    '¿Cómo recupero mi contraseña?',
    '¿Qué roles existen?',
    '¿Puedo cambiar de rol?',
    '¿Qué es un corredor certificado?',
    '¿Qué puedo hacer sin registrarme?',
    '¿Cómo busco propiedades?',
    '¿Cómo funciona el sistema de calificaciones?',
    '¿Cómo funcionan los contratos digitales?',
    '¿Cuánto cuesta usar Rent360?',
    '¿Los inquilinos pagan comisiones?',
    '¿Los propietarios pagan comisiones?',
    '¿Cuánto gana un Runner?',
    '¿Mis datos están seguros?',
    '¿Quién puede ver mi información?',
    '¿Cómo protege Rent360 mis pagos?',
    '¿Qué documentos necesito como propietario?',
    '¿Qué documentos necesito como inquilino?',
    '¿Cuánto tarda la verificación?',
    '¿Qué pasa si mis documentos son rechazados?',
    '¿Qué servicios ofrece Runner360?',
    '¿Cómo me convierto en Runner360?',
    '¿Qué tipos de servicios puedo contratar?',
    '¿Cómo funciona el servicio de corredores?',
    '¿Qué métodos de pago acepta?',
    '¿Cómo reciben el dinero los propietarios?',
    '¿Puedo pagar con débito automático?',
    '¿Hay costos adicionales por métodos de pago?',
    '¿Puedo publicar mi propiedad sin pagar?',
    '¿Cuántas propiedades puedo publicar?',
    '¿Cómo contacto a un propietario?',
    '¿Puedo guardar propiedades favoritas?',
    '¿Los contratos son legalmente válidos?',
    '¿Puedo personalizar un contrato?',
    '¿Cómo funciona el depósito de garantía?',
    '¿Qué beneficios tiene para propietarios?',
    '¿Qué beneficios tiene para inquilinos?',
    '¿Por qué debería usar Rent360?',
    '¿Cómo puedo contactar soporte?',
    '¿Hay tutoriales disponibles?',
    '¿Qué hago si tengo un problema técnico?',
    '¿Dónde puedo ver los términos y condiciones?',
    '¿Cómo funciona la política de privacidad?',
    '¿Qué navegadores son compatibles?',
    '¿Funciona en dispositivos móviles?',
    '¿Necesito instalar algo?',
    '¿En qué países funciona?',
    '¿Funciona en todas las ciudades de Chile?',
    '¿Rent360 es confiable?',
    '¿Cuánto tiempo lleva registrarse?',
    '¿Puedo cancelar mi cuenta?',
    '¿Hay una aplicación móvil?',
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
    'Te informo que el registro es gratuito.',
    'Te indico qué información necesitas.',
    'Te explico la política de cuentas.',
    'Te guío para recuperar tu contraseña.',
    'Te explico los roles disponibles.',
    'Te informo sobre cambios de rol.',
    'Te explico qué es un corredor certificado.',
    'Te detallo las funcionalidades públicas.',
    'Te guío para buscar propiedades.',
    'Te explico el sistema de calificaciones.',
    'Te detallo cómo funcionan los contratos.',
    'Te informo sobre los costos totales.',
    'Te explico las comisiones para inquilinos.',
    'Te explico las comisiones para propietarios.',
    'Te informo sobre ganancias de Runners.',
    'Te explico las medidas de seguridad.',
    'Te informo sobre privacidad de datos.',
    'Te explico la seguridad de pagos.',
    'Te indico documentos para propietarios.',
    'Te indico documentos para inquilinos.',
    'Te informo sobre tiempos de verificación.',
    'Te explico qué hacer si son rechazados.',
    'Te detallo servicios de Runner360.',
    'Te guío para convertirte en Runner.',
    'Te informo sobre servicios disponibles.',
    'Te explico el servicio de corredores.',
    'Te detallo métodos de pago aceptados.',
    'Te explico cómo reciben pagos.',
    'Te guío para configurar débito automático.',
    'Te informo sobre costos de métodos de pago.',
    'Te explico cómo publicar propiedades.',
    'Te informo sobre límites de propiedades.',
    'Te guío para contactar propietarios.',
    'Te explico cómo guardar favoritos.',
    'Te confirmo la validez legal de contratos.',
    'Te explico la personalización de contratos.',
    'Te detallo el depósito de garantía.',
    'Te explico beneficios para propietarios.',
    'Te explico beneficios para inquilinos.',
    'Te explico las ventajas de Rent360.',
    'Te guío para contactar soporte.',
    'Te informo sobre tutoriales disponibles.',
    'Te ayudo con problemas técnicos.',
    'Te indico dónde ver términos y condiciones.',
    'Te explico la política de privacidad.',
    'Te informo sobre compatibilidad de navegadores.',
    'Te explico el soporte móvil.',
    'Te informo sobre instalación.',
    'Te explico disponibilidad geográfica.',
    'Te confirmo disponibilidad en Chile.',
    'Te explico la confiabilidad de Rent360.',
    'Te informo sobre tiempo de registro.',
    'Te explico cómo cancelar cuenta.',
    'Te informo sobre la aplicación móvil.',
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
      commission_info: [
        'comisión',
        'comision',
        'porcentaje',
        'retención',
        'cobran',
        'gano',
        'cobra',
        'corredor',
        'broker',
      ],
      register: ['registro', 'crear', 'cuenta', 'registrarme', 'darme de alta'],
      payment_system: ['pago', 'pagos', 'sistema', 'funciona', 'método'],
    };

    // 🚀 MEJORADO: Buscar específicamente preguntas sobre comisiones de corredores
    if (
      (inputLower.includes('comisión') || inputLower.includes('comision')) &&
      (inputLower.includes('corredor') || inputLower.includes('broker'))
    ) {
      const brokerCommissionExamples = roleExamples.filter(
        ex =>
          ex.intent === 'commission_info' &&
          (ex.context?.includes('broker') || ex.input.toLowerCase().includes('corredor'))
      );
      if (brokerCommissionExamples.length > 0) {
        // Retornar el ejemplo más específico
        const specificExample = brokerCommissionExamples.find(
          ex =>
            ex.input.toLowerCase().includes('corredor') || ex.input.toLowerCase().includes('broker')
        );
        if (specificExample) {
          return specificExample.output;
        }
        return brokerCommissionExamples[0]!.output;
      }
    }

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
