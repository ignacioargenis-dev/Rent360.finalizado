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
        'Rent360 es una plataforma integral de gestión inmobiliaria que conecta propietarios, inquilinos, corredores y proveedores de servicios. Ofrecemos herramientas completas para la gestión de propiedades, contratos, pagos y mantenimiento, todo en un solo lugar.\n\n**¿Qué puedes hacer en Rent360?**\n\n🏠 **Si eres Propietario:**\n- Gestionar tus propiedades y contratos\n- Recibir pagos automáticos\n- Solicitar servicios de mantenimiento\n- Gestionar inquilinos y corredores\n\n🏡 **Si eres Inquilino:**\n- Buscar y arrendar propiedades\n- Pagar tu arriendo de forma segura\n- Solicitar mantenimiento\n- Gestionar tu contrato digital\n\n🔧 **Si eres Proveedor de Servicios:**\n- Ofrecer tus servicios (jardinería, plomería, electricidad, etc.)\n- Recibir solicitudes de trabajo\n- Gestionar tus pagos y ganancias\n\n🏢 **Si eres Corredor:**\n- Gestionar propiedades de tus clientes\n- Obtener comisiones automáticas\n- Gestionar contratos y clientes\n\n¿En qué te gustaría que te ayude?',
      intent: 'platform_info',
      category: 'general',
      context: 'user_asking_about_platform',
      confidence: 0.95,
    },
    {
      input: '¿Cómo funciona el sistema de pagos?',
      output:
        'El sistema de pagos de Rent360 es seguro y automatizado:\n\n**Para Inquilinos:**\n- Puedes pagar tu arriendo con múltiples métodos (Khipu, Stripe, PayPal, WebPay)\n- Los pagos se procesan automáticamente\n- Puedes configurar pagos recurrentes\n- Recibes confirmación inmediata\n\n**Para Propietarios:**\n- Recibes los pagos directamente en tu cuenta bancaria\n- Puedes ver el historial completo de pagos\n- Recibes notificaciones cuando hay pagos\n- Puedes exportar reportes financieros\n\n**Para Proveedores:**\n- Recibes pagos automáticos después de completar trabajos\n- La plataforma retiene una comisión (configurable por el admin)\n- Puedes ver tus ganancias en tiempo real\n- Los pagos se procesan de forma segura\n\n**Seguridad:**\n- Todos los pagos están encriptados\n- No se almacenan datos de tarjetas\n- Cumplimos con estándares de seguridad internacionales\n\n¿Tienes alguna pregunta específica sobre pagos?',
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
    {
      input: '¿Cómo busco propiedades?',
      output:
        'Para buscar propiedades en Rent360:\n\n1. **Usa el buscador principal** en la página de inicio\n2. **Filtra por:**\n   - Ubicación (comuna, ciudad, región)\n   - Tipo de propiedad (casa, departamento, etc.)\n   - Rango de precio\n   - Número de habitaciones y baños\n   - Características (estacionamiento, mascotas, etc.)\n\n3. **Explora resultados:**\n   - Ve fotos y detalles de cada propiedad\n   - Revisa la ubicación en el mapa\n   - Lee descripciones y características\n   - Contacta al propietario o corredor\n\n4. **Agenda visitas:**\n   - Solicita una visita directamente desde la plataforma\n   - El sistema te conecta con el propietario o corredor\n   - Recibe confirmación de la visita\n\n**Tip:** Puedes guardar propiedades como favoritas para revisarlas después.\n\n¿Buscas alguna propiedad específica?',
      intent: 'search_properties',
      category: 'properties',
      context: 'user_searching_properties',
      confidence: 0.92,
    },
    {
      input: '¿Cuánto cuesta usar Rent360?',
      output:
        'Rent360 es **gratuito** para usuarios básicos. Solo se cobran comisiones cuando hay transacciones exitosas:\n\n**Comisiones (solo cuando hay transacciones):**\n\n📊 **Corredores:** 3% - 5% del valor del contrato (configurable)\n🔧 **Proveedores de Servicios:** Generalmente 8% del monto del servicio\n🏃 **Runners:** Variable según tipo de visita ($15.000 - $25.000 por visita)\n\n**Lo que es GRATIS:**\n- Registrarse y crear cuenta\n- Buscar propiedades\n- Publicar propiedades (para propietarios)\n- Gestionar contratos\n- Usar el sistema de mensajería\n- Solicitar servicios\n\n**Solo pagas cuando:**\n- Se firma un contrato (comisión al corredor)\n- Se completa un servicio (comisión al proveedor)\n- Se realiza una visita (pago al runner)\n\n**No hay costos ocultos ni suscripciones mensuales.**\n\n¿Tienes más preguntas sobre costos?',
      intent: 'platform_costs',
      category: 'general',
      context: 'user_asking_about_costs',
      confidence: 0.93,
    },
  ],
  patterns: [
    '¿Qué es Rent360?',
    '¿Cómo funciona?',
    '¿Qué puedo hacer aquí?',
    '¿Cuáles son las funcionalidades?',
    '¿Cómo empiezo?',
    'qué es rent360',
    'cómo funciona rent360',
    'qué ofrece rent360',
    'para qué sirve rent360',
    'cómo usar rent360',
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
 * DATASET ESPECIALIZADO - PROPIETARIOS
 */
export const ownerDataset: TrainingDataset = {
  category: 'owner_specialized',
  examples: [
    {
      input:
        'si tengo una casa para arrendar puedo comunicarme con un corredor para que la administre?',
      output:
        '¡Sí, absolutamente! Puedes contratar un corredor inmobiliario en Rent360 para que administre tu propiedad. Te explico cómo:\n\n**Cómo contratar un corredor en Rent360:**\n\n1. **Regístrate como Propietario**: Si aún no tienes cuenta, crea una cuenta como "Propietario"\n2. **Ve a "Servicios de Corredor"**: En tu panel de propietario, busca la sección "Servicios de Corredor" o "Broker Services"\n3. **Busca corredores disponibles**:\n   - Verás una lista de corredores verificados en tu zona\n   - Cada corredor muestra su experiencia, calificaciones y servicios ofrecidos\n   - Puedes ver sus calificaciones y comentarios de otros propietarios\n4. **Selecciona propiedades**: Elige qué propiedades quieres que el corredor administre\n5. **Envía solicitud**: Contacta directamente al corredor desde la plataforma\n6. **Negocia términos**: El corredor te enviará una propuesta con:\n   - Comisión (generalmente entre 3% y 5% del valor del contrato)\n   - Servicios incluidos (publicación, visitas, gestión de contratos, etc.)\n   - Términos y condiciones\n7. **Acepta la propuesta**: Una vez aceptada, el corredor comenzará a gestionar tu propiedad\n\n**Servicios que puede ofrecer el corredor:**\n- Publicar tu propiedad en múltiples plataformas\n- Gestionar visitas y mostrar la propiedad\n- Negociar con inquilinos potenciales\n- Preparar y gestionar contratos de arriendo\n- Realizar verificaciones de antecedentes\n- Gestionar renovaciones y terminaciones\n- Asesoría en precios de mercado\n\n**Beneficios:**\n- Ahorras tiempo en la gestión\n- Acceso a más inquilinos potenciales\n- Gestión profesional de contratos\n- Mayor seguridad en las transacciones\n\n¿Tienes alguna pregunta específica sobre el proceso o los servicios de corredores?',
      intent: 'hire_broker',
      category: 'broker_services',
      context: 'owner_wanting_to_hire_broker',
      confidence: 0.98,
    },
    {
      input: 'pero puedo contratar a un corredor de propiedades?',
      output:
        '¡Sí, por supuesto! Puedes contratar un corredor inmobiliario en Rent360 para que administre y gestione tu propiedad. Te explico el proceso:\n\n**Cómo contratar un corredor:**\n\n1. **Regístrate como Propietario** (si aún no tienes cuenta)\n2. **Ve a "Servicios de Corredor"** en tu panel\n3. **Busca corredores disponibles** en tu zona\n4. **Revisa sus perfiles**: Verás experiencia, calificaciones y servicios\n5. **Contacta al corredor** directamente desde la plataforma\n6. **Recibe una propuesta** con comisión y servicios incluidos\n7. **Acepta la propuesta** y el corredor comenzará a gestionar tu propiedad\n\n**El corredor puede ayudarte con:**\n- Publicar tu propiedad\n- Gestionar visitas\n- Negociar con inquilinos\n- Preparar contratos\n- Verificaciones de antecedentes\n- Renovaciones y terminaciones\n\n**Comisión típica:** Entre 3% y 5% del valor del contrato (configurable)\n\n¿Quieres más detalles sobre algún paso específico?',
      intent: 'hire_broker',
      category: 'broker_services',
      context: 'owner_asking_about_hiring_broker',
      confidence: 0.98,
    },
    {
      input: '¿Cómo agrego una nueva propiedad?',
      output:
        'Para agregar una nueva propiedad, ve al panel de propietario y haz clic en "Agregar Propiedad". Completa la información básica (dirección, tipo, precio), sube fotos y especifica las características. Una vez guardada, podrás gestionar contratos y pagos.',
      intent: 'add_property',
      category: 'properties',
      context: 'owner_adding_property',
      confidence: 0.92,
    },
    {
      input: '¿Cómo veo mis ingresos mensuales?',
      output:
        'En el dashboard de propietario puedes ver tus ingresos mensuales en tiempo real. La sección de pagos muestra el total recibido, pagos pendientes y un desglose por propiedad. También puedes exportar reportes financieros.',
      intent: 'view_earnings',
      category: 'finances',
      context: 'owner_checking_earnings',
      confidence: 0.89,
    },
    {
      input: '¿Cómo manejo solicitudes de mantenimiento?',
      output:
        'Las solicitudes de mantenimiento aparecen en tu panel de propietario. Puedes aprobar, rechazar o solicitar más información. El sistema te conecta automáticamente con proveedores de servicios calificados en tu área.',
      intent: 'maintenance_requests',
      category: 'maintenance',
      context: 'owner_handling_maintenance',
      confidence: 0.87,
    },
    {
      input: '¿Puedo configurar pagos automáticos?',
      output:
        'Sí, puedes configurar pagos automáticos para tus inquilinos. Ve a la configuración de cada contrato y activa la opción de débito automático. Los inquilinos recibirán notificaciones antes de cada cobro.',
      intent: 'automatic_payments',
      category: 'payments',
      context: 'owner_setting_autopay',
      confidence: 0.91,
    },
  ],
  patterns: [
    '¿Cómo agrego una propiedad?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo manejo mantenimiento?',
    '¿Puedo configurar pagos automáticos?',
    '¿Cómo gestiono mis inquilinos?',
  ],
  responses: [
    'Te ayudo a agregar una nueva propiedad.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico cómo manejar solicitudes de mantenimiento.',
    'Sí, puedes configurar pagos automáticos.',
    'Te guío en la gestión de inquilinos.',
  ],
};

/**
 * DATASET ESPECIALIZADO - INQUILINOS
 */
export const tenantDataset: TrainingDataset = {
  category: 'tenant_specialized',
  examples: [
    {
      input: '¿Cómo pago mi arriendo?',
      output:
        'Puedes pagar tu arriendo de forma fácil y segura:\n\n**Pasos para pagar:**\n1. Ve a tu panel de inquilino → Sección "Pagos"\n2. Verás tus pagos pendientes con fechas de vencimiento\n3. Selecciona el pago que quieres realizar\n4. Elige tu método de pago:\n   - **Khipu**: Transferencias y tarjetas (Chile)\n   - **Stripe**: Tarjetas internacionales\n   - **PayPal**: Billetera digital\n   - **WebPay**: Tarjetas (Chile)\n5. Completa el pago y recibirás confirmación inmediata\n\n**Pagos automáticos:**\n- Puedes configurar pagos recurrentes para que se cobren automáticamente\n- Recibirás recordatorios antes de cada pago\n- Puedes cancelar o modificar los pagos automáticos en cualquier momento\n\n**Seguridad:**\n- Todos los pagos están encriptados\n- No almacenamos datos de tarjetas\n- Recibes comprobante por email\n\n¿Necesitas ayuda con algún paso específico?',
      intent: 'pay_rent',
      category: 'payments',
      context: 'tenant_paying_rent',
      confidence: 0.94,
    },
    {
      input: '¿Cómo solicito mantenimiento?',
      output:
        'Para solicitar mantenimiento en tu propiedad:\n\n**Pasos:**\n1. Ve a tu panel de inquilino → "Mantenimiento" o "Solicitar Mantenimiento"\n2. Haz clic en "Nueva Solicitud"\n3. Completa el formulario:\n   - **Tipo de problema**: Reparación, mantenimiento, emergencia, inspección\n   - **Descripción detallada**: Explica qué necesita arreglo\n   - **Urgencia**: Baja, Media, Alta, Crítica\n   - **Fotos**: Adjunta fotos del problema (opcional pero recomendado)\n4. Envía la solicitud\n\n**¿Qué pasa después?**\n- Tu propietario recibe una notificación\n- El sistema busca proveedores disponibles en tu zona\n- El propietario puede aprobar y asignar un proveedor\n- Recibirás actualizaciones del estado\n- Puedes comunicarte con el proveedor asignado\n\n**Tipos de urgencia:**\n- **Crítica**: Problemas de seguridad o que impiden habitar (ej: fuga de gas, sin electricidad)\n- **Alta**: Problemas que afectan el uso normal (ej: sin agua caliente, calefacción rota)\n- **Media**: Problemas que pueden esperar (ej: grifo que gotea, puerta que no cierra bien)\n- **Baja**: Mantenimiento preventivo o mejoras\n\n¿Qué tipo de problema necesitas reportar?',
      intent: 'request_maintenance',
      category: 'maintenance',
      context: 'tenant_requesting_maintenance',
      confidence: 0.9,
    },
    {
      input: '¿Dónde veo mi contrato?',
      output:
        'Tu contrato está disponible en la sección "Mis Contratos" de tu panel de inquilino. Puedes ver todos los detalles, fechas importantes, términos y condiciones. También puedes descargar una copia en PDF.',
      intent: 'view_contract',
      category: 'contracts',
      context: 'tenant_viewing_contract',
      confidence: 0.93,
    },
    {
      input: '¿Cómo contacto a mi propietario?',
      output:
        'Puedes contactar a tu propietario a través del sistema de mensajería integrado en tu panel. También puedes usar el chat en tiempo real o enviar notificaciones sobre temas específicos como mantenimiento o pagos.',
      intent: 'contact_owner',
      category: 'communication',
      context: 'tenant_contacting_owner',
      confidence: 0.88,
    },
  ],
  patterns: [
    '¿Cómo pago mi arriendo?',
    '¿Cómo solicito mantenimiento?',
    '¿Dónde veo mi contrato?',
    '¿Cómo contacto a mi propietario?',
    '¿Cuándo vence mi pago?',
  ],
  responses: [
    'Te ayudo con el proceso de pago.',
    'Te guío para solicitar mantenimiento.',
    'Te muestro dónde encontrar tu contrato.',
    'Te explico cómo contactar a tu propietario.',
    'Te informo sobre las fechas de vencimiento.',
  ],
};

/**
 * DATASET ESPECIALIZADO - CORREDORES
 */
export const brokerDataset: TrainingDataset = {
  category: 'broker_specialized',
  examples: [
    {
      input: '¿Cómo gestiono mis clientes?',
      output:
        'En el panel de corredor puedes ver todos tus clientes, sus propiedades y contratos activos. Puedes agregar nuevos clientes, actualizar información y hacer seguimiento de comisiones. El sistema te ayuda a mantener un historial completo de cada cliente.',
      intent: 'manage_clients',
      category: 'clients',
      context: 'broker_managing_clients',
      confidence: 0.91,
    },
    {
      input: '¿Cómo calculo mis comisiones?',
      output:
        'El sistema calcula automáticamente tus comisiones basándose en los contratos celebrados. Puedes ver el desglose en la sección de comisiones, que incluye porcentajes por tipo de servicio, fechas de pago y estados de cobro.',
      intent: 'calculate_commissions',
      category: 'commissions',
      context: 'broker_calculating_commissions',
      confidence: 0.89,
    },
    {
      input: '¿Cómo agrego nuevas propiedades para mis clientes?',
      output:
        'Puedes agregar propiedades para tus clientes desde el panel de corredor. Selecciona el cliente propietario, completa la información de la propiedad y el sistema la asociará automáticamente. También puedes gestionar múltiples propiedades por cliente.',
      intent: 'add_property_for_client',
      category: 'properties',
      context: 'broker_adding_property',
      confidence: 0.87,
    },
  ],
  patterns: [
    '¿Cómo gestiono mis clientes?',
    '¿Cómo calculo comisiones?',
    '¿Cómo agrego propiedades?',
    '¿Dónde veo mis ingresos?',
    '¿Cómo contacto a mis clientes?',
  ],
  responses: [
    'Te ayudo a gestionar tus clientes.',
    'Te explico el cálculo de comisiones.',
    'Te guío para agregar propiedades.',
    'Te muestro dónde ver tus ingresos.',
    'Te explico las opciones de contacto.',
  ],
};

/**
 * DATASET ESPECIALIZADO - PROVEEDORES DE SERVICIOS
 */
export const providerDataset: TrainingDataset = {
  category: 'provider_specialized',
  examples: [
    {
      input: '¿Cómo creo mi cuenta para ofrecer servicios?',
      output:
        'Para crear tu cuenta como proveedor de servicios en Rent360, sigue estos pasos:\n\n1. Haz clic en "Registrarse" o "Crear cuenta" en la página principal\n2. Selecciona el tipo de usuario "Proveedor de Servicios" o "Provider"\n3. Completa el formulario con tus datos personales (nombre, email, teléfono)\n4. Crea una contraseña segura\n5. Verifica tu email\n6. Completa tu perfil con información sobre tus servicios (especialidad, experiencia, áreas de cobertura)\n7. Sube documentos requeridos (cédula, certificaciones si las tienes)\n8. Espera la verificación del administrador\n\nUna vez verificado, podrás recibir solicitudes de trabajo y comenzar a ofrecer tus servicios. ¿Necesitas ayuda con algún paso específico?',
      intent: 'register_as_provider',
      category: 'registration',
      context: 'guest_registering_as_provider',
      confidence: 0.95,
    },
    {
      input: 'soy jardinero y quiero ofrecer mis servicios',
      output:
        '¡Perfecto! Como jardinero puedes ofrecer tus servicios en Rent360. Aquí te explico cómo:\n\n**Para registrarte como proveedor de jardinería:**\n\n1. **Crea tu cuenta**: Ve a "Registrarse" y selecciona "Proveedor de Servicios"\n2. **Completa tu perfil**: Incluye tu especialidad (jardinería, paisajismo, mantenimiento de jardines)\n3. **Define tus servicios**: Especifica qué servicios ofreces (poda, diseño, riego, fertilización, etc.)\n4. **Establece tu cobertura**: Indica en qué zonas trabajas\n5. **Configura precios**: Define tus tarifas por hora o por servicio\n6. **Sube documentos**: Cédula, certificaciones (si las tienes), fotos de trabajos anteriores\n\n**Una vez verificado, podrás:**\n- Recibir solicitudes de trabajo de propietarios\n- Ver detalles de cada solicitud (ubicación, urgencia, descripción)\n- Aceptar o rechazar trabajos\n- Comunicarte directamente con clientes\n- Recibir pagos automáticos después de completar trabajos\n- Ver tus ganancias y comisiones\n\n¿Quieres que te guíe en el proceso de registro?',
      intent: 'register_gardener',
      category: 'registration',
      context: 'guest_registering_gardener',
      confidence: 0.95,
    },
    {
      input: 'quiero ofrecer servicios de jardinería',
      output:
        'Excelente, puedes ofrecer servicios de jardinería en Rent360. Para comenzar:\n\n**Pasos para registrarte:**\n1. Crea una cuenta seleccionando "Proveedor de Servicios"\n2. En tu perfil, especifica que tu especialidad es jardinería\n3. Describe los servicios que ofreces (poda, diseño, mantenimiento, etc.)\n4. Indica tus zonas de cobertura\n5. Sube fotos de trabajos anteriores para mostrar tu experiencia\n6. Configura tus precios\n\nUna vez verificado, recibirás solicitudes de trabajo de propietarios que necesiten servicios de jardinería. El sistema te conecta automáticamente con clientes en tu área.\n\n¿Tienes alguna pregunta sobre el proceso de registro?',
      intent: 'offer_gardening_services',
      category: 'registration',
      context: 'guest_offering_gardening',
      confidence: 0.93,
    },
    {
      input: 'como puedo crear mi cuenta para ofrecer servicio de jardineria',
      output:
        'Para crear tu cuenta y ofrecer servicios de jardinería en Rent360:\n\n**Proceso de registro:**\n\n1. **Ir a Registrarse**: En la página principal, haz clic en "Registrarse" o "Crear cuenta"\n2. **Seleccionar tipo de usuario**: Elige "Proveedor de Servicios" o "Provider"\n3. **Datos básicos**: Completa nombre, email, teléfono y crea una contraseña\n4. **Verificar email**: Revisa tu correo y confirma tu cuenta\n5. **Completar perfil**:\n   - Especialidad: Jardinería\n   - Servicios que ofreces (poda, diseño, mantenimiento, riego, etc.)\n   - Zonas donde trabajas\n   - Precios por hora o por servicio\n   - Fotos de trabajos anteriores\n6. **Documentos**: Sube tu cédula y certificaciones si las tienes\n7. **Esperar verificación**: El administrador revisará tu perfil\n\n**Después de ser verificado:**\n- Recibirás solicitudes de trabajo de propietarios\n- Podrás aceptar trabajos que te interesen\n- El sistema procesará los pagos automáticamente\n- Verás tus ganancias y comisiones en tu panel\n\n¿Necesitas ayuda con algún paso específico?',
      intent: 'register_gardening_provider',
      category: 'registration',
      context: 'guest_registering_gardening',
      confidence: 0.95,
    },
    {
      input: '¿Cómo veo las solicitudes de servicio?',
      output:
        'En tu panel de proveedor puedes ver todas las solicitudes de servicio disponibles y asignadas. Filtra por tipo de servicio, ubicación y urgencia. Puedes aceptar solicitudes, ver detalles completos y comunicarte directamente con los clientes.',
      intent: 'view_service_requests',
      category: 'services',
      context: 'provider_viewing_requests',
      confidence: 0.9,
    },
    {
      input: '¿Cómo actualizo el estado de un servicio?',
      output:
        'Puedes actualizar el estado de tus servicios desde la sección "Mis Servicios". Marca como en progreso, completado o si necesitas más información. El sistema notificará automáticamente al cliente y propietario sobre los cambios.',
      intent: 'update_service_status',
      category: 'services',
      context: 'provider_updating_status',
      confidence: 0.88,
    },
    {
      input: '¿Cómo configuro mis servicios?',
      output:
        'En la configuración de servicios puedes definir qué tipos de servicios ofreces, precios, áreas de cobertura y disponibilidad. También puedes subir fotos de trabajos anteriores y establecer términos de servicio.',
      intent: 'configure_services',
      category: 'configuration',
      context: 'provider_configuring_services',
      confidence: 0.86,
    },
  ],
  patterns: [
    '¿Cómo veo solicitudes?',
    '¿Cómo actualizo estado?',
    '¿Cómo configuro servicios?',
    '¿Dónde veo mis pagos?',
    '¿Cómo contacto clientes?',
  ],
  responses: [
    'Te muestro las solicitudes disponibles.',
    'Te ayudo a actualizar el estado.',
    'Te guío en la configuración.',
    'Te explico dónde ver tus pagos.',
    'Te muestro las opciones de contacto.',
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
 * DATASET ESPECIALIZADO - REGISTRO DE USUARIOS (GUEST)
 */
export const registrationDataset: TrainingDataset = {
  category: 'user_registration',
  examples: [
    {
      input: '¿Cómo me registro?',
      output:
        'Para registrarte en Rent360, sigue estos pasos:\n\n1. Haz clic en "Registrarse" o "Crear cuenta" en la página principal\n2. Selecciona el tipo de usuario que mejor te describe:\n   - **Propietario**: Si tienes propiedades para arrendar\n   - **Inquilino**: Si buscas una propiedad para arrendar\n   - **Proveedor de Servicios**: Si ofreces servicios (jardinería, plomería, electricidad, etc.)\n   - **Corredor**: Si eres corredor inmobiliario\n   - **Runner**: Si quieres realizar visitas a propiedades\n3. Completa el formulario con tus datos personales\n4. Verifica tu email\n5. Completa tu perfil según tu tipo de usuario\n\n¿Qué tipo de usuario quieres ser?',
      intent: 'general_registration',
      category: 'registration',
      context: 'guest_asking_registration',
      confidence: 0.95,
    },
    {
      input: 'quiero registrarme como proveedor',
      output:
        '¡Perfecto! Para registrarte como proveedor de servicios:\n\n**Pasos para registrarte:**\n1. Ve a "Registrarse" y selecciona "Proveedor de Servicios"\n2. Completa tus datos básicos (nombre, email, teléfono)\n3. Crea una contraseña segura\n4. Verifica tu email\n5. Completa tu perfil:\n   - Especialidad (jardinería, plomería, electricidad, etc.)\n   - Servicios que ofreces\n   - Zonas donde trabajas\n   - Precios\n   - Fotos de trabajos anteriores\n6. Sube documentos (cédula, certificaciones)\n7. Espera la verificación del administrador\n\n**Una vez verificado podrás:**\n- Recibir solicitudes de trabajo\n- Aceptar trabajos que te interesen\n- Comunicarte con clientes\n- Recibir pagos automáticos\n- Ver tus ganancias\n\n¿Qué tipo de servicios ofreces?',
      intent: 'register_as_provider',
      category: 'registration',
      context: 'guest_registering_provider',
      confidence: 0.95,
    },
    {
      input: 'soy plomero y quiero ofrecer mis servicios',
      output:
        'Excelente, como plomero puedes ofrecer tus servicios en Rent360. Para registrarte:\n\n**Proceso de registro:**\n1. Crea tu cuenta seleccionando "Proveedor de Servicios"\n2. En tu perfil, especifica que tu especialidad es plomería\n3. Describe tus servicios (instalaciones, reparaciones, mantenimiento, etc.)\n4. Indica tus zonas de cobertura\n5. Configura tus precios (por hora o por servicio)\n6. Sube fotos de trabajos anteriores\n7. Sube tu cédula y certificaciones si las tienes\n\n**Después de ser verificado:**\n- Recibirás solicitudes de trabajo de propietarios e inquilinos\n- Podrás ver detalles de cada solicitud (ubicación, urgencia, descripción)\n- Aceptar o rechazar trabajos según tu disponibilidad\n- Comunicarte directamente con clientes\n- Recibir pagos automáticos después de completar trabajos\n- Ver tus ganancias y comisiones en tu panel\n\n¿Tienes alguna pregunta sobre el proceso?',
      intent: 'register_plumber',
      category: 'registration',
      context: 'guest_registering_plumber',
      confidence: 0.95,
    },
    {
      input: 'soy electricista y quiero trabajar',
      output:
        'Perfecto, como electricista puedes trabajar en Rent360. Para comenzar:\n\n**Registro como proveedor:**\n1. Crea tu cuenta seleccionando "Proveedor de Servicios"\n2. Especifica que tu especialidad es electricidad\n3. Describe tus servicios (instalaciones, reparaciones, mantenimiento eléctrico, etc.)\n4. Define tus zonas de cobertura\n5. Establece tus precios\n6. Sube fotos de trabajos anteriores y certificaciones\n7. Sube tu cédula\n\n**Una vez verificado:**\n- Recibirás solicitudes de trabajo de propietarios e inquilinos\n- Podrás aceptar trabajos que te interesen\n- El sistema te conecta automáticamente con clientes\n- Los pagos se procesan automáticamente\n- Verás tus ganancias en tu panel\n\n¿Necesitas ayuda con algún paso?',
      intent: 'register_electrician',
      category: 'registration',
      context: 'guest_registering_electrician',
      confidence: 0.95,
    },
    {
      input: 'quiero ofrecer servicios de mantenimiento',
      output:
        'Excelente, puedes ofrecer servicios de mantenimiento en Rent360. Para registrarte:\n\n**Pasos:**\n1. Crea tu cuenta como "Proveedor de Servicios"\n2. Especifica tu especialidad (mantenimiento general, específico, etc.)\n3. Describe los servicios que ofreces\n4. Indica tus zonas de cobertura\n5. Configura tus precios\n6. Sube fotos de trabajos anteriores\n7. Sube documentos (cédula, certificaciones)\n\n**Después de ser verificado:**\n- Recibirás solicitudes de mantenimiento de propietarios\n- Podrás ver detalles y aceptar trabajos\n- Comunicarte con clientes\n- Recibir pagos automáticos\n- Ver tus ganancias\n\n¿Qué tipo de mantenimiento ofreces?',
      intent: 'register_maintenance',
      category: 'registration',
      context: 'guest_registering_maintenance',
      confidence: 0.93,
    },
    {
      input: 'necesito ayuda para registrarme',
      output:
        '¡Te ayudo con el registro! El proceso es simple:\n\n**Pasos generales:**\n1. Haz clic en "Registrarse" o "Crear cuenta" en la página principal\n2. Selecciona tu tipo de usuario:\n   - **Propietario**: Si tienes propiedades para arrendar\n   - **Inquilino**: Si buscas una propiedad\n   - **Proveedor de Servicios**: Si ofreces servicios (jardinería, plomería, etc.)\n   - **Corredor**: Si eres corredor inmobiliario\n   - **Runner**: Si quieres realizar visitas a propiedades\n\n3. Completa el formulario con tus datos básicos\n4. Verifica tu email (revisa tu bandeja de entrada)\n5. Completa tu perfil según tu tipo de usuario\n\n**Documentos que necesitarás:**\n- Cédula de identidad\n- Email válido\n- Teléfono de contacto\n- (Opcional) Certificaciones profesionales si eres proveedor\n\n**¿Qué tipo de usuario quieres ser?** Puedo darte información más específica según tu caso.',
      intent: 'general_registration_help',
      category: 'registration',
      context: 'guest_needing_registration_help',
      confidence: 0.94,
    },
    {
      input: 'no puedo registrarme',
      output:
        'Te ayudo a resolver el problema de registro. Vamos paso a paso:\n\n**Problemas comunes y soluciones:**\n\n1. **"Email ya está en uso"**\n   - El email ya está registrado. Intenta iniciar sesión en su lugar\n   - Si olvidaste tu contraseña, usa "Recuperar contraseña"\n\n2. **"No recibo el email de verificación"**\n   - Revisa tu carpeta de spam/correo no deseado\n   - Verifica que escribiste el email correctamente\n   - Espera unos minutos (puede tardar hasta 5 minutos)\n   - Intenta reenviar el email de verificación\n\n3. **"Error al enviar formulario"**\n   - Verifica que todos los campos requeridos estén completos\n   - Asegúrate de que la contraseña tenga al menos 8 caracteres\n   - Verifica tu conexión a internet\n   - Intenta con otro navegador\n\n4. **"No puedo seleccionar tipo de usuario"**\n   - Asegúrate de hacer clic en la opción correcta\n   - Intenta refrescar la página\n\n**Si el problema persiste:**\n- Contacta al soporte técnico con tu email\n- Describe el error específico que ves\n- Incluye una captura de pantalla si es posible\n\n¿Cuál de estos problemas estás experimentando?',
      intent: 'registration_troubleshooting',
      category: 'registration',
      context: 'guest_having_registration_issues',
      confidence: 0.92,
    },
  ],
  patterns: [
    '¿Cómo me registro?',
    'quiero registrarme',
    'crear cuenta',
    'ofrecer servicios',
    'soy jardinero',
    'soy plomero',
    'soy electricista',
    'quiero trabajar',
    'registrarse como proveedor',
    'cómo crear cuenta',
    'necesito registrarme',
    'quiero ser proveedor',
    'cómo ofrecer servicios',
    'registro de proveedor',
    'crear cuenta proveedor',
    'registrarse para trabajar',
    'cómo me registro como proveedor',
  ],
  responses: [
    'Te guío en el proceso de registro.',
    'Te explico cómo crear tu cuenta.',
    'Te ayudo a registrarte como proveedor.',
    'Te muestro los pasos para ofrecer tus servicios.',
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
  legalDataset,
  registrationDataset,
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
    // 🚀 MEJORADO: Incluir dataset de registro para usuarios guest
    if (role === 'guest' || role === 'GUEST' || role === 'anonymous') {
      const registrationExamples = this.getExamplesByCategory('user_registration');
      const generalExamples = this.getExamplesByCategory('general_knowledge');
      return [...registrationExamples, ...generalExamples];
    }

    const roleDatasetMap: Record<string, string> = {
      OWNER: 'owner_specialized',
      TENANT: 'tenant_specialized',
      BROKER: 'broker_specialized',
      PROVIDER: 'provider_specialized',
      MAINTENANCE: 'provider_specialized',
      ADMIN: 'admin_specialized',
    };

    const category = roleDatasetMap[role] || 'general_knowledge';
    const roleExamples = this.getExamplesByCategory(category);
    const generalExamples = this.getExamplesByCategory('general_knowledge');

    // Combinar ejemplos del rol con conocimiento general
    return [...roleExamples, ...generalExamples];
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
    const inputLower = userInput.toLowerCase();

    // 🚀 MEJORADO: Buscar primero en dataset de registro para usuarios guest
    if (userRole === 'guest' || userRole === 'GUEST' || userRole === 'anonymous') {
      const registrationExamples = this.getExamplesByCategory('user_registration');

      // Buscar coincidencias más flexibles
      const registrationMatch = registrationExamples.find(ex => {
        const exInputLower = ex.input.toLowerCase();
        // Coincidencia exacta o parcial
        if (inputLower.includes(exInputLower) || exInputLower.includes(inputLower)) {
          return true;
        }
        // Buscar palabras clave importantes
        const keywords = [
          'jardinero',
          'jardinería',
          'plomero',
          'electricista',
          'mantenimiento',
          'ofrecer',
          'servicios',
          'registro',
          'registrarse',
          'crear',
          'cuenta',
          'proveedor',
          'provider',
          'trabajar',
        ];
        const exKeywords = keywords.filter(k => exInputLower.includes(k));
        const inputKeywords = keywords.filter(k => inputLower.includes(k));
        return (
          exKeywords.length > 0 &&
          inputKeywords.length > 0 &&
          exKeywords.some(k => inputKeywords.includes(k))
        );
      });

      if (registrationMatch) {
        return registrationMatch.output;
      }
    }

    // Buscar en ejemplos específicos del rol
    const examples = this.getExamplesByRole(userRole);

    // Buscar ejemplo similar con coincidencias más flexibles
    const similarExample = examples.find(ex => {
      const exInputLower = ex.input.toLowerCase();
      // Coincidencia exacta o parcial
      if (inputLower.includes(exInputLower) || exInputLower.includes(inputLower)) {
        return true;
      }
      // Buscar palabras clave importantes en ambos
      const importantWords = inputLower.split(/\s+/).filter(w => w.length > 3);
      const exImportantWords = exInputLower.split(/\s+/).filter(w => w.length > 3);
      const commonWords = importantWords.filter(w => exImportantWords.includes(w));
      return commonWords.length >= 2; // Al menos 2 palabras en común
    });

    if (similarExample) {
      return similarExample.output;
    }

    // Buscar en conocimiento general con búsqueda más flexible
    const generalExamples = this.getExamplesByCategory('general_knowledge');
    const generalMatch = generalExamples.find(ex => {
      const exInputLower = ex.input.toLowerCase();
      return (
        inputLower.includes(exInputLower) ||
        exInputLower.includes(inputLower) ||
        exInputLower.split(/\s+/).some(w => inputLower.includes(w) && w.length > 4)
      );
    });

    if (generalMatch) {
      return generalMatch.output;
    }

    // 🚀 NUEVO: Buscar en todos los datasets si no hay coincidencia específica
    for (const dataset of allTrainingDatasets) {
      const match = dataset.examples.find(ex => {
        const exInputLower = ex.input.toLowerCase();
        // Buscar palabras clave importantes
        const importantWords = inputLower.split(/\s+/).filter(w => w.length > 3);
        const exImportantWords = exInputLower.split(/\s+/).filter(w => w.length > 3);
        const commonWords = importantWords.filter(w => exImportantWords.includes(w));
        return commonWords.length >= 2;
      });

      if (match) {
        return match.output;
      }
    }

    return null;
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
        '¿Cómo veo las solicitudes de servicio?',
        '¿Cómo actualizo el estado de un servicio?',
        '¿Cómo configuro mis servicios?',
        '¿Dónde veo mis pagos?',
      ],
      ADMIN: [
        '¿Cómo gestiono usuarios del sistema?',
        '¿Cómo veo las estadísticas del sistema?',
        '¿Cómo configuro las comisiones?',
        '¿Cómo genero reportes?',
      ],
    };

    return (
      roleSuggestionsMap[role] || [
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
