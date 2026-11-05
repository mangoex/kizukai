import {
  User,
  Initiative,
  AuditLog,
  DatabaseEntitySummary,
  DemoProfile
} from '../types/index.ts';

export const DEMO_USERS: Record<string, User> = {
  juan_perez: {
    id: 'usr-001-juan',
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    role: 'PARTICIPANT',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    department: 'Ensamble y Troquelado',
    requiresMfa: false,
    avatarInitials: 'JP'
  },
  carlos_mentor: {
    id: 'usr-002-carlos',
    name: 'Carlos Mendoza',
    email: 'carlos.mentor@empresa.com',
    role: 'MENTOR',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    department: 'Ingeniería Kaizen',
    requiresMfa: false,
    avatarInitials: 'CM'
  },
  roberto_mentor: {
    id: 'usr-003-roberto',
    name: 'Roberto Sánchez',
    email: 'roberto.mentor@empresa.com',
    role: 'MENTOR',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    department: 'Excelencia Operacional',
    requiresMfa: false,
    avatarInitials: 'RS'
  },
  ana_coord: {
    id: 'usr-004-ana',
    name: 'Ana Sofía Garza',
    email: 'ana.coord@empresa.com',
    role: 'COORDINATOR',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    department: 'Dirección de Mejora Continua',
    requiresMfa: true,
    avatarInitials: 'AG'
  },
  kasuga_consultor: {
    id: 'usr-005-kasuga',
    name: 'Carlos Kasuga K.',
    email: 'kasuga.consultor@kizukai.com',
    role: 'CONSULTANT',
    tenantId: 'ORG-A', // Contexto global (ve todas las organizaciones)
    tenantName: 'Kizukai Consulting Global',
    department: 'Metodología Kizukai Kaizen',
    requiresMfa: true,
    avatarInitials: 'CK'
  },
  laura_operadora: {
    id: 'usr-006-laura',
    name: 'Laura Gómez',
    email: 'laura.operadora@bajio.com',
    role: 'PARTICIPANT',
    tenantId: 'ORG-B',
    tenantName: 'Alimentos Industriales del Bajío',
    department: 'Línea de Envasado Aséptico',
    requiresMfa: false,
    avatarInitials: 'LG'
  },
  super_admin: {
    id: 'usr-000-mangoex',
    name: 'Super Admin',
    email: 'mangoex@gmail.com',
    role: 'TECH_ADMIN',
    tenantId: 'ORG-A',
    tenantName: 'Kizukai Platform Infrastructure (Root)',
    department: 'Super Administrador / Dirección',
    requiresMfa: false,
    avatarInitials: 'SA'
  },
  admin_tech: {
    id: 'usr-007-admin',
    name: 'David Villarreal (SysAdmin)',
    email: 'admin.tech@kizukai.com',
    role: 'TECH_ADMIN',
    tenantId: 'ORG-A',
    tenantName: 'Kizukai Platform Infrastructure',
    department: 'Seguridad y DevOps',
    requiresMfa: true,
    avatarInitials: 'DV'
  }
};

export const DEMO_PROFILES: DemoProfile[] = [
  {
    user: DEMO_USERS.super_admin,
    description: 'Super Administrador | Control total de empresas, consultores y catálogos',
    requiresMfa: false,
    tag: 'Super Admin (mangoex@gmail.com)'
  },
  {
    user: DEMO_USERS.juan_perez,
    description: 'Participante (Colaborador) | Operador de planta en Gemba',
    requiresMfa: false,
    tag: 'Participante (ORG-A)'
  },
  {
    user: DEMO_USERS.carlos_mentor,
    description: 'Mentor de Mejora | Revisa planes, tareas y auditorías de campo',
    requiresMfa: false,
    tag: 'Mentor 1 (ORG-A)'
  },
  {
    user: DEMO_USERS.roberto_mentor,
    description: 'Mentor de Mejora Senior | Auditor Gemba 5S y validación técnica',
    requiresMfa: false,
    tag: 'Mentor 2 (ORG-A)'
  },
  {
    user: DEMO_USERS.ana_coord,
    description: 'Coordinadora de Empresa | Filtro técnico, asignación y metas',
    requiresMfa: true,
    tag: 'Coordinadora (ORG-A, MFA)'
  },
  {
    user: DEMO_USERS.kasuga_consultor,
    description: 'Consultor Kizukai Global | Visión Multiempresa (ORG-A + ORG-B)',
    requiresMfa: true,
    tag: 'Consultor Global (MFA)'
  },
  {
    user: DEMO_USERS.laura_operadora,
    description: 'Participante | Planta Alimentos Industriales del Bajío',
    requiresMfa: false,
    tag: 'Participante (ORG-B)'
  },
  {
    user: DEMO_USERS.admin_tech,
    description: 'Administrador Técnico | Solo auditoría y BD (bloqueado de iniciativas)',
    requiresMfa: true,
    tag: 'SysAdmin (MFA)'
  }
];

export const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: 'init-001-devuelta',
    folio: 'KIZ-2026-0001',
    title: 'Dispositivo Poka-Yoke por Gravedad para Inserción de Conectores Molex',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Ensamble y Troquelado',
    guideline: 'CALIDAD',
    state: 'DEVUELTA_PARA_AJUSTES',
    currentStep: 5,
    progressPercent: 75,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-002-carlos',
    mentorName: 'Carlos Mendoza',
    returnTargetStateId: 'PENDIENTE_RESULTADOS',
    deadlineDate: '2026-11-28',
    createdAt: '2026-10-01T08:30:00Z',
    updatedAt: '2026-11-04T16:20:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Operadores invertían conectores Molex de 12 pines provocando corto en prueba final (18 defectos/semana).',
      k1_basic_function: 'Guiar el conector con orientación unívoca antes del engaste sin detener el flujo de línea.',
      k2_proactivity: 'Guía inclinada 15° con canaleta acrílica reciclada que solo permite el paso si la muesca polarizada coincide.',
      k3_expected_impact: 'Eliminación del 100% de inserciones invertidas y ahorro de $18,400 USD anuales en retrabajo.',
      zero_investment_verified: true,
      ve_annual_value: 18400,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-1', title: 'Gemba Walk y conteo de scrap en estación 4', week: 1, step: 1, completed: true, completedAt: '2026-10-05' },
      { id: 'tsk-2', title: 'Dibujo a mano alzada de muesca física polarizada', week: 2, step: 2, completed: true, completedAt: '2026-10-12' },
      { id: 'tsk-3', title: 'Fabricación de rampa con acrílico de desecho de almacén', week: 3, step: 3, completed: true, completedAt: '2026-10-19' },
      { id: 'tsk-4', title: 'Prueba piloto 500 ciclos en turno 1 y 2', week: 4, step: 4, completed: true, completedAt: '2026-10-26' },
      { id: 'tsk-5', title: 'Corrida de 5 días con medición de tasa de defecto', week: 5, step: 5, completed: true, completedAt: '2026-11-02' },
      { id: 'tsk-6', title: 'Estandarizar hoja de proceso e instruir al personal', week: 6, step: 6, completed: false }
    ],
    evidences: [
      {
        id: 'ev-01',
        title: 'Fotografía Antes K0 - Acumulación de conectores dañados',
        type: 'FOTO_ANTES',
        version: 'v1.0',
        status: 'CONGELADA_DEVUELTA',
        urlOrDescription: 'Registro fotográfico v1.0 congelado por devolución metodológica. Conectores doblados en contenedor rojo.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-10-06T10:15:00Z'
      },
      {
        id: 'ev-02',
        title: 'Medición de Scrap Inicial (Semana 40) - 18 piezas defectuosas',
        type: 'MEDICION_GEMBA',
        version: 'v1.0',
        status: 'CONGELADA_DEVUELTA',
        urlOrDescription: 'Hoja de verificación Gemba con firmas de inspector de calidad del turno matutino.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-10-07T11:00:00Z'
      }
    ],
    feedbackList: [
      {
        id: 'fb-01',
        mentorName: 'Carlos Mendoza (Mentor)',
        comment: 'La muestra fotográfica de resultados no muestra la medición comparativa contra el estándar K0. Se requiere gráfica de control de 5 días consecutivos.',
        createdAt: '2026-11-04T16:20:00Z',
        type: 'DEVOLUCION'
      }
    ],
    transitionHistory: [
      {
        id: 'tr-1',
        fromState: 'BORRADOR',
        toState: 'POR_APROBAR',
        action: 'ENVIAR_A_REVISION',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-10-02T09:00:00Z',
        justification: 'Iniciativa lista con cero inversión y diagnóstico completo.'
      },
      {
        id: 'tr-2',
        fromState: 'POR_APROBAR',
        toState: 'PENDIENTE_ASIGNACION_MENTOR',
        action: 'APROBAR_FILTRO_TECNICO',
        performedBy: 'Ana Sofía Garza',
        performedRole: 'COORDINATOR',
        timestamp: '2026-10-03T14:30:00Z',
        justification: 'Cumple criterios de ingenio, Cero Inversión y alineación con directriz CALIDAD.'
      },
      {
        id: 'tr-3',
        fromState: 'PENDIENTE_ASIGNACION_MENTOR',
        toState: 'PENDIENTE_PLAN_IMPLEMENTACION',
        action: 'ASIGNAR_MENTOR',
        performedBy: 'Ana Sofía Garza',
        performedRole: 'COORDINATOR',
        timestamp: '2026-10-04T11:15:00Z',
        justification: 'Asignado a Carlos Mendoza por experiencia en líneas de ensamble.'
      },
      {
        id: 'tr-4',
        fromState: 'PENDIENTE_PLAN_IMPLEMENTACION',
        toState: 'EN_IMPLEMENTACION',
        action: 'VALIDAR_PLAN',
        performedBy: 'Carlos Mendoza',
        performedRole: 'MENTOR',
        timestamp: '2026-10-05T16:00:00Z',
        justification: 'Cronograma validado en 6 semanas (inferior a la ventana límite de 8 semanas).'
      },
      {
        id: 'tr-5',
        fromState: 'EN_IMPLEMENTACION',
        toState: 'PENDIENTE_RESULTADOS',
        action: 'NOTIFICAR_TERMINO_OBRA',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-11-03T18:00:00Z',
        justification: 'Pruebas físicas concluidas en Gemba.'
      },
      {
        id: 'tr-6',
        fromState: 'PENDIENTE_RESULTADOS',
        toState: 'DEVUELTA_PARA_AJUSTES',
        action: 'DEVOLVER_EVIDENCIA',
        performedBy: 'Carlos Mendoza',
        performedRole: 'MENTOR',
        timestamp: '2026-11-04T16:20:00Z',
        justification: 'Falta evidencia estadística de 5 días de corrida estable en Gemba para validar el paso 5.',
        returnTargetStateId: 'PENDIENTE_RESULTADOS'
      }
    ]
  },
  {
    id: 'init-002-borrador',
    folio: 'KIZ-2026-0002',
    title: 'Organizador Visual con Código de Color para Herramentales de Prensa 04',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Troquelado y Prensas',
    guideline: 'ENTREGA',
    state: 'BORRADOR',
    currentStep: 1,
    progressPercent: 10,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    deadlineDate: '2026-12-15',
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Tiempos de cambio de dados de troquelado demoran 42 min debido a búsqueda dispersa de llaves Allen y calzas.',
      k1_basic_function: 'Tener a mano exacta y visible cada herramienta del setup sin desplazamientos innecesarios (Muda de movimiento).',
      k2_proactivity: 'Tablero de sombras de madera reciclada montado directamente sobre el bastidor inerte de la prensa.',
      k3_expected_impact: 'Reducción del setup de 42 min a 18 min (-57%), aumentando disponibilidad de máquina en 3.5 hrs/semana.',
      zero_investment_verified: true,
      ve_annual_value: 12500,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-201', title: 'Cronometrar tiempos de búsqueda de llaves con espagueti chart', week: 1, step: 1, completed: true, completedAt: '2026-11-04' },
      { id: 'tsk-202', title: 'Siluetear herramientas en tablero de madera sobrante', week: 2, step: 2, completed: false },
      { id: 'tsk-203', title: 'Fijar tablero a prensa sin perforar estructura crítica', week: 3, step: 3, completed: false }
    ],
    evidences: [],
    feedbackList: [],
    transitionHistory: []
  },
  {
    id: 'init-003-por-aprobar',
    folio: 'KIZ-2026-0003',
    title: 'Recuperador de Condensados por Gravedad para Caldera Auxiliar',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Mantenimiento y Servicios',
    guideline: 'COSTO',
    state: 'POR_APROBAR',
    currentStep: 1,
    progressPercent: 15,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    deadlineDate: '2026-12-20',
    createdAt: '2026-11-02T11:00:00Z',
    updatedAt: '2026-11-02T11:45:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Purga de condensado de vapor se descargaba al drenaje perdiendo agua precalentada a 85°C.',
      k1_basic_function: 'Reutilizar la energía térmica y volumen hídrico en la alimentación de la caldera.',
      k2_proactivity: 'Redirección de tubería existente mediante bypass con codos en desuso hacia el tanque de agua desmineralizada.',
      k3_expected_impact: 'Ahorro de $9,200 USD anuales en consumo de gas LP y reducción de 450 m³ de agua tratada.',
      zero_investment_verified: true,
      ve_annual_value: 9200,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-301', title: 'Medir temperatura y flujo de purga con termografía', week: 1, step: 1, completed: true, completedAt: '2026-11-02' }
    ],
    evidences: [],
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-301',
        fromState: 'BORRADOR',
        toState: 'POR_APROBAR',
        action: 'ENVIAR_A_REVISION',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-11-02T11:45:00Z',
        justification: 'Iniciativa enviada para filtro técnico de Coordinación de Mejora.'
      }
    ]
  },
  {
    id: 'init-004-pendiente-mentor',
    folio: 'KIZ-2026-0004',
    title: 'Sensor Óptico Reutilizado para Detección de Fin de Carrete de Cobre',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Devanado y Bobinado',
    guideline: 'SEGURIDAD',
    state: 'PENDIENTE_ASIGNACION_MENTOR',
    currentStep: 2,
    progressPercent: 20,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    deadlineDate: '2026-12-22',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-03T15:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'El cable de cobre salía intempestivamente al vaciarse el carrete, latigueando y golpeando protectores acrílicos.',
      k1_basic_function: 'Detener la máquina 1.5 metros antes de que se agote la última vuelta del carrete.',
      k2_proactivity: 'Instalación de sensor retroreflectivo recuperado de máquina dada de baja colocado a la altura del diámetro residual.',
      k3_expected_impact: 'Cero incidentes por chicotazo de alambre y ahorro de $6,500 USD en paros no programados.',
      zero_investment_verified: true,
      ve_annual_value: 6500,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-401', title: 'Inventario de sensores funcionales en refacciones obsoletas', week: 1, step: 1, completed: true }
    ],
    evidences: [],
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-401',
        fromState: 'BORRADOR',
        toState: 'POR_APROBAR',
        action: 'ENVIAR_A_REVISION',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-11-01T09:00:00Z'
      },
      {
        id: 'tr-402',
        fromState: 'POR_APROBAR',
        toState: 'PENDIENTE_ASIGNACION_MENTOR',
        action: 'APROBAR_FILTRO_TECNICO',
        performedBy: 'Ana Sofía Garza',
        performedRole: 'COORDINATOR',
        timestamp: '2026-11-03T15:00:00Z',
        justification: 'Aprobada con alta prioridad por impacto directo en seguridad de operadores.'
      }
    ]
  },
  {
    id: 'init-005-pendiente-plan',
    folio: 'KIZ-2026-0005',
    title: 'Dispensador Ergonómico de Tornillería por Gravedad en Banco de Ensamblado',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Ensamble y Troquelado',
    guideline: 'MORAL',
    state: 'PENDIENTE_PLAN_IMPLEMENTACION',
    currentStep: 2,
    progressPercent: 25,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-002-carlos',
    mentorName: 'Carlos Mendoza',
    deadlineDate: '2026-12-25',
    createdAt: '2026-10-25T09:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
    isStagnant: true, // Marcada como estancada (> 7 días) para alertas de Coordinador
    diagnostic: {
      k0_deficient: 'Operadoras adoptan posturas forzadas de muñeca para extraer tornillos M3 de cubetas profundas.',
      k1_basic_function: 'Presentar el tornillo a la altura natural de la mano sin flexión articular.',
      k2_proactivity: 'Tolva inclinada hecha con canaleta plástica de cableado que despacha 5 tornillos a la vez por gravedad.',
      k3_expected_impact: 'Reducción de fatiga ergonómica RULA de nivel 5 a nivel 2 y 1.2 segundos ahorrados por ciclo.',
      zero_investment_verified: true,
      ve_annual_value: 8100,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-501', title: 'Evaluación ergonómica inicial método RULA', week: 1, step: 1, completed: true }
    ],
    evidences: [],
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-501',
        fromState: 'PENDIENTE_ASIGNACION_MENTOR',
        toState: 'PENDIENTE_PLAN_IMPLEMENTACION',
        action: 'ASIGNAR_MENTOR',
        performedBy: 'Ana Sofía Garza',
        performedRole: 'COORDINATOR',
        timestamp: '2026-10-26T10:00:00Z'
      }
    ]
  },
  {
    id: 'init-006-en-implementacion',
    folio: 'KIZ-2026-0006',
    title: 'Sistema de Arrastre por Contrapeso para Cambio Rápido de Rollos de Etiqueta',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Empaque y Almacén',
    guideline: 'ENTREGA',
    state: 'EN_IMPLEMENTACION',
    currentStep: 4,
    progressPercent: 65,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-003-roberto',
    mentorName: 'Roberto Sánchez',
    deadlineDate: '2026-12-10',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-11-04T12:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Cada cambio de bobina requería aflojar 4 pernos mariposa manuales perdiendo 8 minutos de etiquetado.',
      k1_basic_function: 'Fijar el eje central con sujeción instantánea mediante trinquete por gravedad.',
      k2_proactivity: 'Mecanismo de trinquete oscilante fabricado con solera sobrante de herrería y resorte de compresión.',
      k3_expected_impact: 'Tiempo de cambio reducido a 45 segundos y 62 horas hombre ahorradas al año.',
      zero_investment_verified: true,
      ve_annual_value: 11200,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-601', title: 'Análisis de tiempos de amarre de pernos', week: 1, step: 1, completed: true, completedAt: '2026-10-18' },
      { id: 'tsk-602', title: 'Prototipo de trinquete de madera', week: 2, step: 2, completed: true, completedAt: '2026-10-25' },
      { id: 'tsk-603', title: 'Soldado de solera en taller de mantenimiento', week: 3, step: 3, completed: true, completedAt: '2026-11-01' },
      { id: 'tsk-604', title: 'Pruebas de fatiga y resistencia de carga', week: 4, step: 4, completed: false }
    ],
    evidences: [],
    feedbackList: [
      {
        id: 'fb-601',
        mentorName: 'Roberto Sánchez (Mentor)',
        comment: 'Excelente diseño de contrapeso. Asegúrate de redondear los cantos de la solera para cumplir la norma de seguridad.',
        createdAt: '2026-11-02T16:00:00Z',
        type: 'OBSERVACION'
      }
    ],
    transitionHistory: [
      {
        id: 'tr-601',
        fromState: 'PENDIENTE_PLAN_IMPLEMENTACION',
        toState: 'EN_IMPLEMENTACION',
        action: 'VALIDAR_PLAN',
        performedBy: 'Roberto Sánchez',
        performedRole: 'MENTOR',
        timestamp: '2026-10-17T11:00:00Z'
      }
    ]
  },
  {
    id: 'init-007-pendiente-resultados',
    folio: 'KIZ-2026-0007',
    title: 'Deflector de Flujo de Aire para Secado Homogéneo en Túnel de Pintura',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Pintura y Acabados',
    guideline: 'CALIDAD',
    state: 'PENDIENTE_RESULTADOS',
    currentStep: 4,
    progressPercent: 100,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-002-carlos',
    mentorName: 'Carlos Mendoza',
    deadlineDate: '2026-11-20',
    createdAt: '2026-09-20T08:00:00Z',
    updatedAt: '2026-11-03T17:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Corrientes turbulentas en túnel provocaban escurrimiento de barniz en caras inferiores de gabinetes metálicos.',
      k1_basic_function: 'Laminar el flujo de aire caliente hacia la parte baja de la pieza.',
      k2_proactivity: 'Álabes deflectores curvos reutilizando lámina galvanizada de ducto desmantelado.',
      k3_expected_impact: 'Reducción de piezas con piel de naranja en 94% y ahorro de pintura por reproceso.',
      zero_investment_verified: true,
      ve_annual_value: 23600,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-701', title: 'Medición de velocidad de aire anemómetro', week: 1, step: 1, completed: true },
      { id: 'tsk-702', title: 'Diseño aerodinámico de deflectores', week: 2, step: 2, completed: true },
      { id: 'tsk-703', title: 'Instalación y anclaje seguro', week: 3, step: 3, completed: true },
      { id: 'tsk-704', title: 'Prueba de adhesión y espesor de película seca', week: 4, step: 4, completed: true }
    ],
    evidences: [
      {
        id: 'ev-701',
        title: 'Medición de espesor de pintura en 30 muestras',
        type: 'MEDICION_GEMBA',
        version: 'v1.0',
        status: 'ACTIVA',
        urlOrDescription: 'Reporte de laboratorio de pintura: Cero defectos por escurrimiento.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-11-03T16:30:00Z'
      }
    ],
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-701',
        fromState: 'EN_IMPLEMENTACION',
        toState: 'PENDIENTE_RESULTADOS',
        action: 'NOTIFICAR_TERMINO_OBRA',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-11-03T17:00:00Z',
        justification: 'Todas las tareas del plan al 100%. Listo para someter a evaluación formal K3.'
      }
    ]
  },
  {
    id: 'init-008-por-evaluar',
    folio: 'KIZ-2026-0008',
    title: 'Guía Autocentrante de Bobinas de Chapa en Troquel Progresivo B-02',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Troquelado y Prensas',
    guideline: 'CALIDAD',
    state: 'POR_EVALUAR',
    currentStep: 5,
    progressPercent: 90,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-003-roberto',
    mentorName: 'Roberto Sánchez',
    deadlineDate: '2026-11-15',
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-11-01T15:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Desalineamiento de tira metálica causaba rebaba excesiva y desportillado de punzones.',
      k1_basic_function: 'Mantener la tira en el centro geométrico del troquel con rodillos laterales.',
      k2_proactivity: 'Rodamientos blindados 608 de patín en desuso montados en brazos pivotantes con resorte helicoidal.',
      k3_expected_impact: 'Prolongación de vida útil de punzones de 40,000 a 160,000 golpes (4x) y ahorro de $29,000 USD.',
      zero_investment_verified: true,
      ve_annual_value: 29000,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-801', title: 'Inspección de filo de punzones con lupa comparadora', week: 1, step: 1, completed: true },
      { id: 'tsk-802', title: 'Adaptación de baleros en eje roscado', week: 2, step: 2, completed: true },
      { id: 'tsk-803', title: 'Montaje en mesa de entrada de prensa', week: 3, step: 3, completed: true },
      { id: 'tsk-804', title: 'Corrida de 150,000 golpes sin desgaste prematuro', week: 4, step: 4, completed: true }
    ],
    evidences: [
      {
        id: 'ev-801',
        title: 'Foto Antes: Punzón fracturado por desalineamiento',
        type: 'FOTO_ANTES',
        version: 'v1.0',
        status: 'ACTIVA',
        urlOrDescription: 'Microfotografía óptica del punzón dañado con grietas por cizallamiento asimétrico.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-09-12T09:00:00Z'
      },
      {
        id: 'ev-802',
        title: 'Foto Después: Tira centrada con rodillos autocentrantes',
        type: 'FOTO_DESPUES',
        version: 'v1.0',
        status: 'ACTIVA',
        urlOrDescription: 'Prensa trabajando a 90 golpes/minuto con alineamiento milimétrico estable.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-10-28T14:00:00Z'
      }
    ],
    feedbackList: [
      {
        id: 'fb-801',
        mentorName: 'Roberto Sánchez (Mentor)',
        comment: 'Evidencias K0 y K3 completas. Agendando auditoría Gemba 5S y verificación con Finanzas.',
        createdAt: '2026-11-01T15:30:00Z',
        type: 'OBSERVACION'
      }
    ],
    transitionHistory: [
      {
        id: 'tr-801',
        fromState: 'PENDIENTE_RESULTADOS',
        toState: 'POR_EVALUAR',
        action: 'ENVIAR_A_EVALUACION',
        performedBy: 'Juan Pérez',
        performedRole: 'PARTICIPANT',
        timestamp: '2026-11-01T15:00:00Z'
      }
    ]
  },
  {
    id: 'init-009-por-documentar',
    folio: 'KIZ-2026-0009',
    title: 'Dispositivo Andon Sonoro-Visual Pasivo para Alerta de Falla en Compresor',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Mantenimiento y Servicios',
    guideline: 'COSTO',
    state: 'POR_DOCUMENTAR',
    currentStep: 6,
    progressPercent: 95,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-002-carlos',
    mentorName: 'Carlos Mendoza',
    deadlineDate: '2026-11-12',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-11-02T16:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Caída de presión neumática no era advertida hasta que los robots de ensamble se bloqueaban en paro.',
      k1_basic_function: 'Emitir señal acústica inmediata cuando la presión baje de 85 PSI antes del umbral de paro robot.',
      k2_proactivity: 'Válvula de alivio mecánico con silbato de locomotora a escala calibrado a 88 PSI.',
      k3_expected_impact: 'Eliminación de 4 eventos de paro robot por trimestre ($32,000 USD ahorrados).',
      zero_investment_verified: true,
      ve_annual_value: 32000,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-901', title: 'Prueba de sonido en ambiente de planta', week: 1, step: 1, completed: true },
      { id: 'tsk-902', title: 'Calibración manométrica a 88 PSI', week: 2, step: 2, completed: true }
    ],
    evidences: [],
    checklist5s: {
      seiri_clasificar: true,
      seiton_ordenar: true,
      seiso_limpiar: true,
      seiketsu_estandarizar: true,
      shitsuke_disciplina: true,
      score: 98,
      evaluatedBy: 'Carlos Mendoza (Mentor)',
      evaluatedAt: '2026-11-02T15:00:00Z',
      digitalSignature: 'SIG-VERIFIED-5S-CMENDOZA-20261102',
      financeValidated: true
    },
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-901',
        fromState: 'POR_EVALUAR',
        toState: 'POR_DOCUMENTAR',
        action: 'APROBAR_EVALUACION_K3',
        performedBy: 'Carlos Mendoza',
        performedRole: 'MENTOR',
        timestamp: '2026-11-02T16:00:00Z',
        justification: 'Auditoría Gemba 5S aprobada con 98/100 y ahorro validado por Contraloría.'
      }
    ]
  },
  {
    id: 'init-010-finalizada',
    folio: 'KIZ-2026-0010',
    title: 'Mesa de Empaque en Cascada con Gravedad para Empaque de Transformadores',
    tenantId: 'ORG-A',
    tenantName: 'Manufactura Eléctrica del Norte',
    program: 'Top Companies 2026',
    department: 'Empaque y Almacén',
    guideline: 'COSTO',
    state: 'FINALIZADA',
    currentStep: 6,
    progressPercent: 100,
    proponentId: 'usr-001-juan',
    proponentName: 'Juan Pérez',
    mentorId: 'usr-002-carlos',
    mentorName: 'Carlos Mendoza',
    deadlineDate: '2026-10-30',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-10-25T17:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Operador levantaba transformadores de 14 kg desde el piso a la tarima 120 veces por turno (Sobreesfuerzo físico).',
      k1_basic_function: 'Deslizar el producto terminado directamente a la altura de la tarima sin levantamiento.',
      k2_proactivity: 'Plataforma con rodillos locos de transportador en desuso con declive de 3 grados.',
      k3_expected_impact: 'Cero lesiones lumbares, incremento de cadencia de empaque en 35% y ahorro anualizado de $34,800 USD.',
      zero_investment_verified: true,
      ve_annual_value: 34800,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-1001', title: 'Diseño biomecánico y ergonomía de carga', week: 1, step: 1, completed: true },
      { id: 'tsk-1002', title: 'Armado de mesa con rodillos reciclados', week: 2, step: 2, completed: true },
      { id: 'tsk-1003', title: 'Certificación médica de esfuerzo', week: 3, step: 3, completed: true },
      { id: 'tsk-1004', title: 'Publicación de Procedimiento POE-2026-EM-04', week: 4, step: 4, completed: true }
    ],
    evidences: [
      {
        id: 'ev-1001',
        title: 'Antes: Carga manual repetitiva desde tarima inferior',
        type: 'FOTO_ANTES',
        version: 'v1.0',
        status: 'ACTIVA',
        urlOrDescription: 'Registro fotográfico de postura con flexión lumbar de 70 grados.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-07-05T10:00:00Z'
      },
      {
        id: 'ev-1002',
        title: 'Después: Deslizamiento suave sin flexión de columna',
        type: 'FOTO_DESPUES',
        version: 'v1.0',
        status: 'ACTIVA',
        urlOrDescription: 'Estación de empaque rediseñada operando con flujo continuo.',
        uploadedBy: 'Juan Pérez',
        uploadedAt: '2026-10-15T11:00:00Z'
      }
    ],
    checklist5s: {
      seiri_clasificar: true,
      seiton_ordenar: true,
      seiso_limpiar: true,
      seiketsu_estandarizar: true,
      shitsuke_disciplina: true,
      score: 100,
      evaluatedBy: 'Carlos Mendoza (Mentor)',
      evaluatedAt: '2026-10-20T11:00:00Z',
      digitalSignature: 'SIG-VERIFIED-5S-CMENDOZA-FINAL',
      financeValidated: true
    },
    sop: {
      id: 'sop-001',
      code: 'POE-2026-EM-04',
      title: 'Procedimiento Operativo Estandarizado: Empaque Ergonómico de Transformadores en Cascada',
      publishedAt: '2026-10-25T17:00:00Z',
      documentUrl: 'https://docs.kizukai.internal/poe/POE-2026-EM-04.pdf'
    },
    feedbackList: [],
    transitionHistory: [
      {
        id: 'tr-1001',
        fromState: 'POR_DOCUMENTAR',
        toState: 'FINALIZADA',
        action: 'PUBLICAR_ESTANDAR_POE',
        performedBy: 'Ana Sofía Garza',
        performedRole: 'COORDINATOR',
        timestamp: '2026-10-25T17:00:00Z',
        justification: 'POE-2026-EM-04 catalogado y distribuido a las 3 plantas filiales.'
      }
    ]
  },
  {
    id: 'init-011-org-b-activa',
    folio: 'KIZ-2026-0011',
    title: 'Separador Magnético Reutilizado para Retención de Partículas en Envasado',
    tenantId: 'ORG-B',
    tenantName: 'Alimentos Industriales del Bajío',
    program: 'Top Companies 2026',
    department: 'Línea de Envasado Aséptico',
    guideline: 'CALIDAD',
    state: 'EN_IMPLEMENTACION',
    currentStep: 4,
    progressPercent: 55,
    proponentId: 'usr-006-laura',
    proponentName: 'Laura Gómez',
    deadlineDate: '2026-12-18',
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-11-03T14:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Riesgo de contaminación cruzada por fragmentos metálicos de desgaste en tolva de cereales.',
      k1_basic_function: 'Atrapar cualquier elemento ferromagnético en la caída libre previa a la selladora.',
      k2_proactivity: 'Parrilla magnética de neodimio rescatada de línea de molienda en desuso.',
      k3_expected_impact: 'Garantía 100% de inocuidad alimentaria y ahorro de $41,000 USD en posibles retiros de lote.',
      zero_investment_verified: true,
      ve_annual_value: 41000,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-1101', title: 'Prueba de Gauss de la barra magnética', week: 1, step: 1, completed: true },
      { id: 'tsk-1102', title: 'Aislamiento en acero inoxidable sanitario', week: 2, step: 2, completed: true }
    ],
    evidences: [],
    feedbackList: [],
    transitionHistory: []
  },
  {
    id: 'init-012-org-b-finalizada',
    folio: 'KIZ-2026-0012',
    title: 'Sistema de Enfriamiento por Evaporación Natural en Silos de Almacenamiento',
    tenantId: 'ORG-B',
    tenantName: 'Alimentos Industriales del Bajío',
    program: 'Top Companies 2026',
    department: 'Silos y Granos',
    guideline: 'COSTO',
    state: 'FINALIZADA',
    currentStep: 6,
    progressPercent: 100,
    proponentId: 'usr-006-laura',
    proponentName: 'Laura Gómez',
    deadlineDate: '2026-10-15',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-10-14T12:00:00Z',
    isStagnant: false,
    diagnostic: {
      k0_deficient: 'Sobrecalentamiento estacional del grano provocaba mermas de fermentación ($2,800 USD/semana en chillers).',
      k1_basic_function: 'Disipar calor acumulado en la corona del silo durante la noche.',
      k2_proactivity: 'Ventilas eólicas estáticas con deflectores de hojalata que aprovechan la brisa nocturna sin energía eléctrica.',
      k3_expected_impact: 'Reducción de temperatura en 4.5°C promedio y ahorro anual de $28,500 USD en energía.',
      zero_investment_verified: true,
      ve_annual_value: 28500,
      currency: 'USD'
    },
    tasks: [
      { id: 'tsk-1201', title: 'Medición de temperatura día/noche con dataloggers', week: 1, step: 1, completed: true },
      { id: 'tsk-1202', title: 'Instalación de ventilas eólicas mecánicas', week: 2, step: 2, completed: true }
    ],
    evidences: [],
    sop: {
      id: 'sop-002',
      code: 'POE-2026-BAJ-01',
      title: 'POE: Mantenimiento y Calibración de Ventilación Natural en Silos',
      publishedAt: '2026-10-14T12:00:00Z',
      documentUrl: 'https://docs.kizukai.internal/poe/POE-2026-BAJ-01.pdf'
    },
    feedbackList: [],
    transitionHistory: []
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    entity: 'initiatives',
    entityId: 'init-001-devuelta',
    action: 'STATE_TRANSITION',
    performedBy: 'carlos.mentor@empresa.com',
    tenantId: 'ORG-A',
    timestamp: '2026-11-04T16:20:00Z',
    payloadSnapshot: {
      fromState: 'PENDIENTE_RESULTADOS',
      toState: 'DEVUELTA_PARA_AJUSTES',
      returnTargetStateId: 'PENDIENTE_RESULTADOS',
      justification: 'Falta evidencia estadística de 5 días de corrida estable en Gemba para validar el paso 5.',
      evidenceCountFrozen: 2
    },
    ipAddress: '192.168.10.45'
  },
  {
    id: 'aud-002',
    entity: 'initiatives',
    entityId: 'init-009-por-documentar',
    action: '5S_GEMBA_AUDIT_APPROVED',
    performedBy: 'carlos.mentor@empresa.com',
    tenantId: 'ORG-A',
    timestamp: '2026-11-02T16:00:00Z',
    payloadSnapshot: {
      score5S: 98,
      financeValidated: true,
      veAnnualValue: 32000,
      digitalSignature: 'SIG-VERIFIED-5S-CMENDOZA-20261102'
    },
    ipAddress: '192.168.10.45'
  },
  {
    id: 'aud-003',
    entity: 'users',
    entityId: 'usr-004-ana',
    action: 'MFA_AUTH_SUCCESS',
    performedBy: 'ana.coord@empresa.com',
    tenantId: 'ORG-A',
    timestamp: '2026-11-05T07:12:00Z',
    payloadSnapshot: {
      challengeCodeUsed: '202600',
      role: 'COORDINATOR',
      method: 'TOTP_CHALLENGE'
    },
    ipAddress: '10.0.4.12'
  }
];

export const DATABASE_ENTITIES: DatabaseEntitySummary[] = [
  { name: 'tenants', displayName: '1. Tenants (Empresas / Organizaciones)', count: 2, description: 'Catálogo de organizaciones multi-tenant aisladas (ORG-A y ORG-B)', primaryKey: 'tenant_id (UUID)', tenantScoped: false },
  { name: 'users', displayName: '2. Users (Usuarios del Sistema)', count: 7, description: 'Cuentas de usuario con segregación por empresa y estado de MFA', primaryKey: 'id (UUID)', tenantScoped: true },
  { name: 'roles', displayName: '3. Roles (Definición RBAC)', count: 5, description: 'Definición de roles: PARTICIPANT, MENTOR, COORDINATOR, CONSULTANT, TECH_ADMIN', primaryKey: 'role_code (VARCHAR)', tenantScoped: false },
  { name: 'user_roles', displayName: '4. User Roles (Asignaciones RBAC)', count: 7, description: 'Relación ternaria usuario-rol-organización con fechas de vigencia', primaryKey: 'user_id + role_code', tenantScoped: true },
  { name: 'cohorts', displayName: '5. Cohorts (Cohortes de Acompañamiento)', count: 2, description: 'Programas de mejora continua (ej. Top Companies 2026)', primaryKey: 'cohort_id (UUID)', tenantScoped: true },
  { name: 'initiatives', displayName: '6. Initiatives (Iniciativas Kaizen)', count: 12, description: 'Entidad central con máquina de 12 estados de negocio y regla de 8 semanas', primaryKey: 'id (UUID)', tenantScoped: true },
  { name: 'kizukai_diagnostic', displayName: '7. Kizukai Diagnostic (Diagnóstico K0-K3)', count: 12, description: 'Matriz metodológica: K0 Problema, K1 Función Básica, K2 Proactividad, K3 Impacto', primaryKey: 'initiative_id', tenantScoped: true },
  { name: 'strategic_guidelines', displayName: '8. Strategic Guidelines (Directrices QCDSM)', count: 5, description: 'Calidad, Costo, Entrega, Seguridad y Moral (QCDSM)', primaryKey: 'guideline_code', tenantScoped: false },
  { name: 'departments', displayName: '9. Departments (Departamentos de Planta)', count: 8, description: 'Áreas operativas y líneas de producción del Gemba', primaryKey: 'dept_id', tenantScoped: true },
  { name: 'implementation_plans', displayName: '10. Implementation Plans (Planes de Trabajo)', count: 12, description: 'Cronograma metodológico de 6 pasos con ventana máxima de 56 días', primaryKey: 'plan_id', tenantScoped: true },
  { name: 'implementation_tasks', displayName: '11. Implementation Tasks (Tareas de Gemba)', count: 38, description: 'Actividades concretas asignadas a semanas 1-8 con estado de completitud', primaryKey: 'task_id', tenantScoped: true },
  { name: 'evidences', displayName: '12. Evidences (Bóveda de Evidencias v1/v2)', count: 7, description: 'Fotos antes/después, hojas de verificación y control de versiones con congelamiento', primaryKey: 'evidence_id', tenantScoped: true },
  { name: 'gemba_audits', displayName: '13. Gemba Audits (Auditorías de Planta)', count: 4, description: 'Verificaciones presenciales en línea de producción', primaryKey: 'audit_id', tenantScoped: true },
  { name: 'five_s_evaluations', displayName: '14. Five S Evaluations (Evaluaciones 5S Gemba)', count: 2, description: 'Checklist Seiri, Seiton, Seiso, Seiketsu, Shitsuke con firma digital', primaryKey: 'eval_5s_id', tenantScoped: true },
  { name: 'mentor_assignments', displayName: '15. Mentor Assignments (Asignaciones de Mentores)', count: 10, description: 'Emparejamiento de iniciativas con mentores técnicos activos', primaryKey: 'assignment_id', tenantScoped: true },
  { name: 'mentor_feedback', displayName: '16. Mentor Feedback (Retroalimentación)', count: 5, description: 'Comentarios, observaciones formativas y justificaciones de devolución', primaryKey: 'feedback_id', tenantScoped: true },
  { name: 'economic_validations', displayName: '17. Economic Validations (Validaciones Financieras)', count: 4, description: 'Cálculo auditado de Valor Económico Anualizado (V_E) contra Cero Inversión', primaryKey: 'validation_id', tenantScoped: true },
  { name: 'standardization_sops', displayName: '18. Standardization SOPs (Catálogo POE)', count: 2, description: 'Procedimientos Operativos Estandarizados publicados para consolidación K3', primaryKey: 'sop_id', tenantScoped: true },
  { name: 'state_transition_history', displayName: '19. State Transition History (Línea de Vida)', count: 21, description: 'Historial inmutable con estados origen, destino, actor, justificación y timestamp', primaryKey: 'transition_id', tenantScoped: true },
  { name: 'audit_logs', displayName: '20. Audit Logs (Bitácora de Seguridad Inmutable)', count: 3, description: 'Eventos de seguridad, bloqueos 403, transiciones de estado y snapshots JSON', primaryKey: 'log_id', tenantScoped: false },
  { name: 'security_mfa_tokens', displayName: '21. Security MFA Tokens (Desafíos MFA)', count: 3, description: 'Control de tokens TOTP de 6 dígitos para roles Coordinator, Consultant y Admin', primaryKey: 'token_id', tenantScoped: true },
  { name: 'system_parameters', displayName: '22. System Parameters (Parámetros Globales)', count: 6, description: 'Límites de tiempo (56 días max), umbral de estancamiento (7 días), códigos demo', primaryKey: 'param_key', tenantScoped: false }
];
