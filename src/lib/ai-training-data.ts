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
      output: 'Rent360 es una plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos, corredores y proveedores de servicios. Ofrecemos herramientas completas para la gestión de propiedades, contratos, pagos y mantenimiento, todo en un solo lugar.',
      intent: 'platform_info',
      category: 'general',
      context: 'user_asking_about_platform',
      confidence: 0.95
    },
    {
      input: '¿Cómo funciona el sistema de pagos?',
      output: 'El sistema de pagos de Rent360 permite a los inquilinos pagar su arriendo de forma segura y automática. Los propietarios reciben los pagos directamente en su cuenta bancaria registrada. El sistema también maneja comisiones para corredores y proveedores de servicios.',
      intent: 'payment_system',
      category: 'payments',
      context: 'user_asking_about_payments',
      confidence: 0.90
    },
    {
      input: '¿Puedo ver mis propiedades?',
      output: 'Sí, como propietario puedes ver todas tus propiedades en el panel de propietario. Allí encontrarás información detallada de cada propiedad, contratos activos, historial de pagos y solicitudes de mantenimiento.',
      intent: 'view_properties',
      category: 'properties',
      context: 'owner_asking_about_properties',
      confidence: 0.88
    }
  ],
  patterns: [
    '¿Qué es Rent360?',
    '¿Cómo funciona?',
    '¿Qué puedo hacer aquí?',
    '¿Cuáles son las funcionalidades?',
    '¿Cómo empiezo?'
  ],
  responses: [
    'Rent360 es tu plataforma integral de gestión inmobiliaria.',
    'Te ayudo a entender cómo funciona Rent360.',
    'Puedes gestionar propiedades, contratos y pagos desde aquí.',
    'Las funcionalidades incluyen gestión completa de propiedades.',
    'Te guío paso a paso para comenzar.'
  ]
};

/**
 * DATASET ESPECIALIZADO - PROPIETARIOS
 */
export const ownerDataset: TrainingDataset = {
  category: 'owner_specialized',
  examples: [
    {
      input: '¿Cómo agrego una nueva propiedad?',
      output: 'Para agregar una nueva propiedad, ve al panel de propietario y haz clic en "Agregar Propiedad". Completa la información básica (dirección, tipo, precio), sube fotos y especifica las características. Una vez guardada, podrás gestionar contratos y pagos.',
      intent: 'add_property',
      category: 'properties',
      context: 'owner_adding_property',
      confidence: 0.92
    },
    {
      input: '¿Cómo veo mis ingresos mensuales?',
      output: 'En el dashboard de propietario puedes ver tus ingresos mensuales en tiempo real. La sección de pagos muestra el total recibido, pagos pendientes y un desglose por propiedad. También puedes exportar reportes financieros.',
      intent: 'view_earnings',
      category: 'finances',
      context: 'owner_checking_earnings',
      confidence: 0.89
    },
    {
      input: '¿Cómo manejo solicitudes de mantenimiento?',
      output: 'Las solicitudes de mantenimiento aparecen en tu panel de propietario. Puedes aprobar, rechazar o solicitar más información. El sistema te conecta automáticamente con proveedores de servicios calificados en tu área.',
      intent: 'maintenance_requests',
      category: 'maintenance',
      context: 'owner_handling_maintenance',
      confidence: 0.87
    },
    {
      input: '¿Puedo configurar pagos automáticos?',
      output: 'Sí, puedes configurar pagos automáticos para tus inquilinos. Ve a la configuración de cada contrato y activa la opción de débito automático. Los inquilinos recibirán notificaciones antes de cada cobro.',
      intent: 'automatic_payments',
      category: 'payments',
      context: 'owner_setting_autopay',
      confidence: 0.91
    }
  ],
  patterns: [
    '¿Cómo agrego una propiedad?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo manejo mantenimiento?',
    '¿Puedo configurar pagos automáticos?',
    '¿Cómo gestiono mis inquilinos?'
  ],
  responses: [
    'Te ayudo a agregar una nueva propiedad.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico cómo manejar solicitudes de mantenimiento.',
    'Sí, puedes configurar pagos automáticos.',
    'Te guío en la gestión de inquilinos.'
  ]
};

/**
 * DATASET ESPECIALIZADO - INQUILINOS
 */
export const tenantDataset: TrainingDataset = {
  category: 'tenant_specialized',
  examples: [
    {
      input: '¿Cómo pago mi arriendo?',
      output: 'Puedes pagar tu arriendo desde la sección de pagos en tu panel de inquilino. El sistema acepta transferencias bancarias, tarjetas de crédito y débito. También puedes configurar pagos automáticos para no preocuparte por las fechas de vencimiento.',
      intent: 'pay_rent',
      category: 'payments',
      context: 'tenant_paying_rent',
      confidence: 0.94
    },
    {
      input: '¿Cómo solicito mantenimiento?',
      output: 'Para solicitar mantenimiento, ve a la sección de "Solicitar Mantenimiento" en tu panel. Describe el problema, adjunta fotos si es necesario y selecciona la urgencia. El sistema notificará automáticamente a tu propietario y proveedores de servicios.',
      intent: 'request_maintenance',
      category: 'maintenance',
      context: 'tenant_requesting_maintenance',
      confidence: 0.90
    },
    {
      input: '¿Dónde veo mi contrato?',
      output: 'Tu contrato está disponible en la sección "Mis Contratos" de tu panel de inquilino. Puedes ver todos los detalles, fechas importantes, términos y condiciones. También puedes descargar una copia en PDF.',
      intent: 'view_contract',
      category: 'contracts',
      context: 'tenant_viewing_contract',
      confidence: 0.93
    },
    {
      input: '¿Cómo contacto a mi propietario?',
      output: 'Puedes contactar a tu propietario a través del sistema de mensajería integrado en tu panel. También puedes usar el chat en tiempo real o enviar notificaciones sobre temas específicos como mantenimiento o pagos.',
      intent: 'contact_owner',
      category: 'communication',
      context: 'tenant_contacting_owner',
      confidence: 0.88
    }
  ],
  patterns: [
    '¿Cómo pago mi arriendo?',
    '¿Cómo solicito mantenimiento?',
    '¿Dónde veo mi contrato?',
    '¿Cómo contacto a mi propietario?',
    '¿Cuándo vence mi pago?'
  ],
  responses: [
    'Te ayudo con el proceso de pago.',
    'Te guío para solicitar mantenimiento.',
    'Te muestro dónde encontrar tu contrato.',
    'Te explico cómo contactar a tu propietario.',
    'Te informo sobre las fechas de vencimiento.'
  ]
};

/**
 * DATASET ESPECIALIZADO - CORREDORES
 */
export const brokerDataset: TrainingDataset = {
  category: 'broker_specialized',
  examples: [
    {
      input: '¿Cómo gestiono mis clientes?',
      output: 'En el panel de corredor puedes ver todos tus clientes, sus propiedades y contratos activos. Puedes agregar nuevos clientes, actualizar información y hacer seguimiento de comisiones. El sistema te ayuda a mantener un historial completo de cada cliente.',
      intent: 'manage_clients',
      category: 'clients',
      context: 'broker_managing_clients',
      confidence: 0.91
    },
    {
      input: '¿Cómo calculo mis comisiones?',
      output: 'El sistema calcula automáticamente tus comisiones basándose en los contratos celebrados. Puedes ver el desglose en la sección de comisiones, que incluye porcentajes por tipo de servicio, fechas de pago y estados de cobro.',
      intent: 'calculate_commissions',
      category: 'commissions',
      context: 'broker_calculating_commissions',
      confidence: 0.89
    },
    {
      input: '¿Cómo agrego nuevas propiedades para mis clientes?',
      output: 'Puedes agregar propiedades para tus clientes desde el panel de corredor. Selecciona el cliente propietario, completa la información de la propiedad y el sistema la asociará automáticamente. También puedes gestionar múltiples propiedades por cliente.',
      intent: 'add_property_for_client',
      category: 'properties',
      context: 'broker_adding_property',
      confidence: 0.87
    }
  ],
  patterns: [
    '¿Cómo gestiono mis clientes?',
    '¿Cómo calculo comisiones?',
    '¿Cómo agrego propiedades?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo contacto a mis clientes?'
  ],
  responses: [
    'Te ayudo a gestionar tus clientes.',
    'Te explico el cálculo de comisiones.',
    'Te guío para agregar propiedades.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico las opciones de contacto.'
  ]
};

/**
 * DATASET ESPECIALIZADO - PROVEEDORES DE SERVICIOS
 */
export const providerDataset: TrainingDataset = {
  category: 'provider_specialized',
  examples: [
    {
      input: '¿Cómo veo las solicitudes de servicio?',
      output: 'En tu panel de proveedor puedes ver todas las solicitudes de servicio disponibles y asignadas. Filtra por tipo de servicio, ubicación y urgencia. Puedes aceptar solicitudes, ver detalles completos y comunicarte directamente con los clientes.',
      intent: 'view_service_requests',
      category: 'services',
      context: 'provider_viewing_requests',
      confidence: 0.90
    },
    {
      input: '¿Cómo actualizo el estado de un servicio?',
      output: 'Puedes actualizar el estado de tus servicios desde la sección "Mis Servicios". Marca como en progreso, completado o si necesitas más información. El sistema notificará automáticamente al cliente y propietario sobre los cambios.',
      intent: 'update_service_status',
      category: 'services',
      context: 'provider_updating_status',
      confidence: 0.88
    },
    {
      input: '¿Cómo configuro mis servicios?',
      output: 'En la configuración de servicios puedes definir qué tipos de servicios ofreces, precios, áreas de cobertura y disponibilidad. También puedes subir fotos de trabajos anteriores y establecer términos de servicio.',
      intent: 'configure_services',
      category: 'configuration',
      context: 'provider_configuring_services',
      confidence: 0.86
    }
  ],
  patterns: [
    '¿Cómo veo solicitudes?',
    '¿Cómo actualizo estado?',
    '¿Cómo configuro servicios?',
    '¿Dónde veo mis pagos?',
    '¿Cómo contacto clientes?'
  ],
  responses: [
    'Te muestro las solicitudes disponibles.',
    'Te ayudo a actualizar el estado.',
    'Te guío en la configuración.',
    'Te explico dónde ver tus pagos.',
    'Te muestro las opciones de contacto.'
  ]
};

/**
 * DATASET ESPECIALIZADO - ADMINISTRADORES
 */
export const adminDataset: TrainingDataset = {
  category: 'admin_specialized',
  examples: [
    {
      input: '¿Cómo gestiono usuarios del sistema?',
      output: 'En el panel de administración puedes ver todos los usuarios registrados, sus roles y estados. Puedes activar/desactivar cuentas, cambiar roles, ver historial de actividad y gestionar permisos. También puedes enviar notificaciones masivas.',
      intent: 'manage_users',
      category: 'user_management',
      context: 'admin_managing_users',
      confidence: 0.93
    },
    {
      input: '¿Cómo veo las estadísticas del sistema?',
      output: 'El dashboard de administración muestra estadísticas completas: usuarios activos, propiedades registradas, contratos activos, ingresos totales y métricas de uso. Puedes filtrar por períodos y exportar reportes detallados.',
      intent: 'view_system_stats',
      category: 'analytics',
      context: 'admin_viewing_stats',
      confidence: 0.91
    },
    {
      input: '¿Cómo configuro las comisiones del sistema?',
      output: 'En la configuración del sistema puedes establecer porcentajes de comisión para corredores, proveedores y la retención de la plataforma. También puedes configurar diferentes tipos de comisión según el tipo de servicio o propiedad.',
      intent: 'configure_commissions',
      category: 'system_config',
      context: 'admin_configuring_commissions',
      confidence: 0.89
    }
  ],
  patterns: [
    '¿Cómo gestiono usuarios?',
    '¿Cómo veo estadísticas?',
    '¿Cómo configuro comisiones?',
    '¿Cómo manejo reportes?',
    '¿Cómo configuro el sistema?'
  ],
  responses: [
    'Te ayudo a gestionar usuarios.',
    'Te muestro las estadísticas del sistema.',
    'Te guío en la configuración de comisiones.',
    'Te explico cómo generar reportes.',
    'Te ayudo con la configuración del sistema.'
  ]
};

/**
 * DATASET DE SOPORTE TÉCNICO
 */
export const supportDataset: TrainingDataset = {
  category: 'technical_support',
  examples: [
    {
      input: 'No puedo iniciar sesión',
      output: 'Para problemas de inicio de sesión, verifica que tu email y contraseña sean correctos. Si olvidaste tu contraseña, usa la opción "Recuperar contraseña". Si el problema persiste, contacta al soporte técnico con tu email registrado.',
      intent: 'login_issue',
      category: 'authentication',
      context: 'user_login_problem',
      confidence: 0.92
    },
    {
      input: 'No se cargan las imágenes',
      output: 'Si las imágenes no se cargan, verifica tu conexión a internet y actualiza la página. Asegúrate de que las imágenes estén en formato JPG, PNG o WebP y no excedan 10MB. Si el problema persiste, contacta al soporte.',
      intent: 'image_loading_issue',
      category: 'technical',
      context: 'user_image_problem',
      confidence: 0.87
    },
    {
      input: '¿Cómo cambio mi contraseña?',
      output: 'Para cambiar tu contraseña, ve a tu perfil de usuario y selecciona "Cambiar contraseña". Ingresa tu contraseña actual y la nueva contraseña. Asegúrate de que tenga al menos 8 caracteres, incluya mayúsculas, minúsculas y números.',
      intent: 'change_password',
      category: 'account_management',
      context: 'user_changing_password',
      confidence: 0.94
    }
  ],
  patterns: [
    'No puedo iniciar sesión',
    'No se cargan las imágenes',
    '¿Cómo cambio mi contraseña?',
    'La página no carga',
    'Error en el sistema'
  ],
  responses: [
    'Te ayudo con el problema de inicio de sesión.',
    'Te guío para resolver el problema de imágenes.',
    'Te explico cómo cambiar tu contraseña.',
    'Te ayudo a resolver el problema de carga.',
    'Te conecto con soporte técnico.'
  ]
};

/**
 * DATASET DE CONOCIMIENTO LEGAL Y REGULATORIO
 */
export const legalDataset: TrainingDataset = {
  category: 'legal_knowledge',
  examples: [
    {
      input: '¿Cuáles son los derechos del inquilino?',
      output: 'Los inquilinos tienen derecho a: vivienda habitable, privacidad, notificación previa para visitas, devolución del depósito al finalizar el contrato, y a no ser discriminados. El contrato debe especificar claramente estos derechos y obligaciones.',
      intent: 'tenant_rights',
      category: 'legal',
      context: 'user_asking_about_rights',
      confidence: 0.88
    },
    {
      input: '¿Cómo funciona el depósito de garantía?',
      output: 'El depósito de garantía es un monto que el inquilino entrega al propietario como garantía del cumplimiento del contrato. Debe ser devuelto al finalizar el contrato, descontando daños no causados por uso normal. El monto máximo es equivalente a un mes de arriendo.',
      intent: 'security_deposit',
      category: 'legal',
      context: 'user_asking_about_deposit',
      confidence: 0.90
    },
    {
      input: '¿Qué pasa si no pago el arriendo?',
      output: 'Si no pagas el arriendo en la fecha acordada, el propietario puede cobrar intereses de mora (máximo 1.5% mensual). Después de 30 días de atraso, puede iniciar un proceso de desalojo. Es importante comunicar cualquier dificultad financiera al propietario.',
      intent: 'late_payment',
      category: 'legal',
      context: 'tenant_late_payment',
      confidence: 0.85
    }
  ],
  patterns: [
    '¿Cuáles son mis derechos?',
    '¿Cómo funciona el depósito?',
    '¿Qué pasa si no pago?',
    '¿Puedo terminar el contrato?',
    '¿Qué dice la ley?'
  ],
  responses: [
    'Te explico tus derechos como inquilino.',
    'Te ayudo a entender el depósito de garantía.',
    'Te informo sobre las consecuencias del atraso.',
    'Te explico cómo terminar el contrato.',
    'Te proporciono información legal relevante.'
  ]
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
  adminDataset,
  supportDataset,
  legalDataset
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
      'OWNER': 'owner_specialized',
      'TENANT': 'tenant_specialized',
      'BROKER': 'broker_specialized',
      'PROVIDER': 'provider_specialized',
      'MAINTENANCE': 'provider_specialized',
      'ADMIN': 'admin_specialized'
    };

    const category = roleDatasetMap[role] || 'general_knowledge';
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
   * Genera respuestas contextuales basadas en el entrenamiento
   */
  static generateContextualResponse(
    userInput: string,
    userRole: string,
    context: string
  ): string | null {
    const examples = this.getExamplesByRole(userRole);
    
    // Buscar ejemplo similar
    const similarExample = examples.find(ex => 
      ex.input.toLowerCase().includes(userInput.toLowerCase()) ||
      userInput.toLowerCase().includes(ex.input.toLowerCase())
    );

    if (similarExample) {
      return similarExample.output;
    }

    // Buscar en conocimiento general
    const generalExamples = this.getExamplesByCategory('general_knowledge');
    const generalMatch = generalExamples.find(ex => 
      ex.input.toLowerCase().includes(userInput.toLowerCase())
    );

    return generalMatch ? generalMatch.output : null;
  }

  /**
   * Obtiene sugerencias basadas en el rol
   */
  static getSuggestionsByRole(role: string): string[] {
    const roleSuggestionsMap: Record<string, string[]> = {
      'OWNER': [
        '¿Cómo agrego una nueva propiedad?',
        '¿Dónde veo mis ingresos mensuales?',
        '¿Cómo manejo solicitudes de mantenimiento?',
        '¿Puedo configurar pagos automáticos?'
      ],
      'TENANT': [
        '¿Cómo pago mi arriendo?',
        '¿Cómo solicito mantenimiento?',
        '¿Dónde veo mi contrato?',
        '¿Cómo contacto a mi propietario?'
      ],
      'BROKER': [
        '¿Cómo gestiono mis clientes?',
        '¿Cómo calculo mis comisiones?',
        '¿Cómo agrego propiedades para mis clientes?',
        '¿Dónde veo mis ingresos?'
      ],
      'PROVIDER': [
        '¿Cómo veo las solicitudes de servicio?',
        '¿Cómo actualizo el estado de un servicio?',
        '¿Cómo configuro mis servicios?',
        '¿Dónde veo mis pagos?'
      ],
      'ADMIN': [
        '¿Cómo gestiono usuarios del sistema?',
        '¿Cómo veo las estadísticas del sistema?',
        '¿Cómo configuro las comisiones?',
        '¿Cómo genero reportes?'
      ]
    };

    return roleSuggestionsMap[role] || [
      '¿Qué es Rent360?',
      '¿Cómo funciona el sistema de pagos?',
      '¿Cómo puedo obtener ayuda?',
      '¿Cuáles son las funcionalidades principales?'
    ];
  }

  /**
   * Calcula la confianza de una respuesta basada en el entrenamiento
   */
  static calculateConfidence(
    userInput: string,
    response: string,
    userRole: string
  ): number {
    const examples = this.getExamplesByRole(userRole);
    const exactMatch = examples.find(ex => ex.input === userInput);
    
    if (exactMatch) {
      return exactMatch.confidence;
    }

    // Buscar coincidencias parciales
    const partialMatches = examples.filter(ex => 
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
