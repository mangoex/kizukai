/**
 * Motor de Gobierno y Aprovisionamiento Jerárquico RBAC y Catálogos (Kizukai Project Hub).
 * Reglas de autorización estricta para HU-1.1 a HU-4.2:
 * - TECH_ADMIN: Puede crear organizaciones y usuarios CONSULTANT.
 * - CONSULTANT: Puede crear usuarios COORDINATOR en cualquier organización cliente.
 * - COORDINATOR: Puede crear usuarios PARTICIPANT y MENTOR exclusivamente en su propia organización.
 * - PARTICIPANT / MENTOR: No pueden aprovisionar usuarios ni organizaciones.
 */

export type UserRole = 'PARTICIPANT' | 'MENTOR' | 'COORDINATOR' | 'CONSULTANT' | 'TECH_ADMIN';

export interface Organization {
  id: string;
  businessName: string;
  commercialName: string;
  taxId?: string;
  industrySector: string;
  isActive: boolean;
  createdAt: string;
  consultantId?: string;
  consultantName?: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  branchOffice?: string;
}

export interface StrategicGuidelineCategory {
  code: 'CALIDAD' | 'COSTO' | 'ENTREGA' | 'SEGURIDAD' | 'MORAL';
  letter: 'Q' | 'C' | 'D' | 'S' | 'M';
  name: string;
  description: string;
}

export interface UserAccountPayload {
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  department?: string;
}

export interface RoleCatalogEntry {
  code: UserRole;
  name: string;
  scope: string;
  description: string;
  permissions: {
    category: string;
    items: string[];
  }[];
  keyResponsibilities: string[];
}

export interface RbacDecision {
  allowed: boolean;
  reason?: string;
}

export class AdminEngine {
  /**
   * Catálogo maestro de roles con permisos RBAC en la plataforma Kizukai.
   */
  public static readonly ROLES_CATALOG: RoleCatalogEntry[] = [
    {
      code: 'CONSULTANT',
      name: 'Consultor Kizukai',
      scope: 'Global / Multi-Empresa',
      description: 'Especialista metodológico y asesor directivo que guía la implementación Kaizen, supervisa comités directivos, audita portafolios multi-planta y replica mejores prácticas.',
      permissions: [
        {
          category: 'Aprovisionamiento y Gobierno',
          items: [
            'Alta y asignación de Coordinadores de Empresa en cualquier organización activa',
            'Gestión y consulta de catálogos de áreas y departamentos por empresa',
            'Supervisión y auditoría de portafolios multi-planta (ORG-A, ORG-B)'
          ]
        },
        {
          category: 'Metodología Kaizen',
          items: [
            'Validación de directrices estratégicas QCDSM y Cero Inversión ($0 Capex)',
            'Monitoreo del semáforo de iniciativas en pasos 1 al 6',
            'Identificación y catalogación de Mejores Prácticas horizontales (> $15,000 USD)'
          ]
        },
        {
          category: 'Reportes y Analítica Directiva',
          items: [
            'Acceso total a Reporte A (Eficiencia y Conversión de Embudo)',
            'Acceso a Reporte B (Ciclos y Estancamiento SLA)',
            'Acceso a Reporte C (Impacto Económico $V_E y ROI Infinito)'
          ]
        }
      ],
      keyResponsibilities: [
        'Acompañar a la alta dirección en la adopción cultural del Gemba Walk.',
        'Facilitar comités de evaluación y homologar criterios entre empresas.',
        'Auditar el cumplimiento del principio Cero Inversión de Capital en todas las plantas.'
      ]
    },
    {
      code: 'MENTOR',
      name: 'Mentor de Mejora Continua',
      scope: 'Planta / Gemba',
      description: 'Especialista técnico en piso que acompaña a los proponentes en la formulación de ideas, valida cronogramas (máximo 8 semanas), audita condiciones 5S y certifica resultados K3.',
      permissions: [
        {
          category: 'Validación Técnica y Cronograma',
          items: [
            'Validación y ajuste de cronogramas de implementación (límite estricto de 8 semanas / 56 días)',
            'Revisión técnica de planes de trabajo y desglose de tareas semanales',
            'Solicitud de ajustes metodológicos en borradores'
          ]
        },
        {
          category: 'Auditoría en Gemba y Evaluación K3',
          items: [
            'Inspección presencial en piso y checklist de auditoría 5S',
            'Firma digital formal de aprobación de proyectos K3',
            'Devolución formativa de evidencias con justificación obligatoria (mínimo 20 caracteres)'
          ]
        },
        {
          category: 'Seguimiento Operativo',
          items: [
            'Bandeja de entregables pendientes de revisión y auditorías programadas',
            'Alertas de aceleración en semanas 6-8 para evitar vencimiento',
            'Supervisión de iniciativas asignadas en piso'
          ]
        }
      ],
      keyResponsibilities: [
        'Verificar en el Gemba que las mejoras se sostengan mediante orden y limpieza 5S.',
        'Asesorar a los proponentes en mediciones antes (K0) y después (K3).',
        'Garantizar que no se incurra en gastos de capital no auditados.'
      ]
    },
    {
      code: 'PARTICIPANT',
      name: 'Participante / Proponente Gemba',
      scope: 'Línea Operativa / Gemba',
      description: 'Operador, técnico o líder de línea que detecta oportunidades de mejora en el Gemba, captura iniciativas K0-K3 de cero inversión y ejecuta las acciones de cambio.',
      permissions: [
        {
          category: 'Captura y Registro',
          items: [
            'Captura ágil de iniciativas Kaizen K2 mediante wizard móvil de 3 pasos',
            'Edición de borradores propios y envío a revisión técnica',
            'Clasificación inicial por directriz QCDSM'
          ]
        },
        {
          category: 'Ejecución y Evidencias',
          items: [
            'Marcado interactivo de avance en tareas del cronograma de trabajo',
            'Carga de evidencias fotográficas y datos de medición K0 (Inicial) y K3 (Mejorado)',
            'Carga y remisión de versión 2.0 de evidencias ante observaciones del mentor'
          ]
        },
        {
          category: 'Cierre y Notificación',
          items: [
            'Notificación de término de obra al completar el 100% de tareas en el Gemba',
            'Envío a evaluación K3 y consulta de Procedimientos Operativos (POE)'
          ]
        }
      ],
      keyResponsibilities: [
        'Identificar desperdicios (muda) en su puesto de trabajo cotidiano.',
        'Resolver problemas con ingenio, creatividad y trabajo en equipo.',
        'Mantener los estándares 5S alcanzados en la estación de trabajo.'
      ]
    },
    {
      code: 'COORDINATOR',
      name: 'Coordinador Kaizen de Empresa',
      scope: 'Empresa / Planta Local',
      description: 'Líder del programa en la planta que gestiona el comité técnico, evalúa el filtro inicial, asigna mentores especializados y cataloga procedimientos POE.',
      permissions: [
        {
          category: 'Filtro Técnico y Asignación',
          items: [
            'Aprobación o rechazo de iniciativas en filtro técnico inicial (Cero Inversión)',
            'Asignación de mentores especialistas a iniciativas aprobadas',
            'Revisión de iniciativas rezagadas con más de 7 días sin avance'
          ]
        },
        {
          category: 'Aprovisionamiento Local y Catálogos',
          items: [
            'Alta y gestión de usuarios Participantes y Mentores de su propia empresa',
            'Administración del catálogo de áreas y departamentos de la planta',
            'Seguimiento al avance contra la meta de la cohorte anual (Grupo 2026)'
          ]
        },
        {
          category: 'Estandarización y POE',
          items: [
            'Publicación y catalogación de Procedimientos Operativos Estandarizados (POE)',
            'Cierre y archivo formal de iniciativas en estado FINALIZADA'
          ]
        }
      ],
      keyResponsibilities: [
        'Asegurar el cumplimiento de la meta anual de proyectos estandarizados.',
        'Remover impedimentos operativos entre áreas y facilitar visitas al Gemba.',
        'Garantizar el aislamiento y la calidad de datos de su empresa.'
      ]
    },
    {
      code: 'TECH_ADMIN',
      name: 'Administrador Técnico de Plataforma',
      scope: 'Infraestructura / Multi-Tenant Global',
      description: 'Administrador de sistemas y seguridad que gestiona la arquitectura multi-inquilino, el catálogo corporativo de empresas, usuarios y roles, y la integridad de bitácoras inmutables.',
      permissions: [
        {
          category: 'Aprovisionamiento y Gobernanza Global',
          items: [
            'Alta y configuración de nuevas Empresas Clientes (tenants) y asignación de consultores',
            'Aprovisionamiento de usuarios con asignación directa de cualquier rol del catálogo',
            'Gestión de directrices estratégicas corporativas por empresa'
          ]
        },
        {
          category: 'Consola de Base de Datos y Seguridad',
          items: [
            'Inspección en vivo de las 22 entidades del esquema relacional PostgreSQL',
            'Simulador de ataques Cross-Tenant y verificación de respuestas 403',
            'Auditoría forense sobre bitácoras inmutables (audit_logs)',
            'Supervisión de segregación de funciones y políticas MFA'
          ]
        }
      ],
      keyResponsibilities: [
        'Salvaguardar el aislamiento estricto de datos entre empresas cliente.',
        'Mantener la disponibilidad, rendimiento e infraestructura de la plataforma.',
        'Garantizar la inmutabilidad de los registros de auditoría y seguridad.'
      ]
    }
  ];

  /**
   * Catálogo maestro de directrices estratégicas QCDSM (K0-K3)
   */
  public static readonly STRATEGIC_GUIDELINES: StrategicGuidelineCategory[] = [
    {
      code: 'CALIDAD',
      letter: 'Q',
      name: 'Calidad (Quality)',
      description: 'Cero defectos, reducción de scrap y control de variabilidad en Gemba.',
    },
    {
      code: 'COSTO',
      letter: 'C',
      name: 'Costo (Cost)',
      description: 'Ahorro de recursos, energía y materiales con CERO INVERSIÓN de capital ($0 Capex).',
    },
    {
      code: 'ENTREGA',
      letter: 'D',
      name: 'Entrega (Delivery)',
      description: 'Reducción de tiempos de ciclo, cambios rápidos de formato (SMED) y flujo continuo.',
    },
    {
      code: 'SEGURIDAD',
      letter: 'S',
      name: 'Seguridad (Safety)',
      description: 'Ergonomía en estaciones de trabajo, eliminación de condiciones inseguras y cero accidentes.',
    },
    {
      code: 'MORAL',
      letter: 'M',
      name: 'Moral (Morale / 5S)',
      description: 'Ambiente laboral digno, orden visual, estandarización y cultura de autodisciplina 5S.',
    },
  ];

  /**
   * Determina si un usuario puede crear una nueva organización cliente.
   * Exclusivo para TECH_ADMIN.
   */
  public static canUserCreateOrganization(actorRole: UserRole): boolean {
    return actorRole === 'TECH_ADMIN';
  }

  /**
   * Determina si un usuario puede editar una organización cliente.
   * Exclusivo para TECH_ADMIN.
   */
  public static canUserEditOrganization(actorRole: UserRole): boolean {
    return actorRole === 'TECH_ADMIN';
  }

  /**
   * Valida la jerarquía estricta de aprovisionamiento de usuarios:
   * - TECH_ADMIN -> solo CONSULTANT (y TECH_ADMIN interno)
   * - CONSULTANT -> solo COORDINATOR (para cualquier organización activa)
   * - COORDINATOR -> PARTICIPANT o MENTOR (estrictamente en su propia organización)
   */
  public static canUserCreateUser(
    actorRole: UserRole,
    targetRole: UserRole,
    actorOrgId: string,
    targetOrgId: string
  ): RbacDecision {
    // 1. Participantes y Mentores nunca pueden crear usuarios
    if (actorRole === 'PARTICIPANT' || actorRole === 'MENTOR') {
      return {
        allowed: false,
        reason: 'Los participantes y mentores no tienen privilegios de aprovisionamiento de usuarios.',
      };
    }

    // 2. Administrador Técnico: Aprovisionamiento de cualquier rol del catálogo corporativo (CONSULTANT, MENTOR, PARTICIPANT, COORDINATOR, TECH_ADMIN)
    if (actorRole === 'TECH_ADMIN') {
      return { allowed: true };
    }

    // 3. Consultor Global
    if (actorRole === 'CONSULTANT') {
      if (targetRole === 'COORDINATOR') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'El Consultor Global solo puede dar de alta Coordinadores de Empresa.',
      };
    }

    // 4. Coordinador de Empresa
    if (actorRole === 'COORDINATOR') {
      // Regla de aislamiento estricto de Tenant
      if (actorOrgId !== targetOrgId) {
        return {
          allowed: false,
          reason: 'Violación Multi-Tenant: Un Coordinador no puede registrar usuarios en otra organización.',
        };
      }

      if (targetRole === 'PARTICIPANT' || targetRole === 'MENTOR') {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: 'Un Coordinador de Empresa solo puede dar de alta Participantes y Mentores para su organización.',
      };
    }

    return { allowed: false, reason: 'Rol no reconocido para aprovisionamiento.' };
  }

  /**
   * Determina si un usuario puede administrar departamentos en una empresa.
   * Permitido para TECH_ADMIN, CONSULTANT o el COORDINATOR de esa misma organización.
   */
  public static canUserManageDepartments(
    actorRole: UserRole,
    actorOrgId: string,
    targetOrgId: string
  ): boolean {
    if (actorRole === 'TECH_ADMIN' || actorRole === 'CONSULTANT') {
      return true;
    }
    if (actorRole === 'COORDINATOR' && actorOrgId === targetOrgId) {
      return true;
    }
    return false;
  }
}
