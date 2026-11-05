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

export interface RbacDecision {
  allowed: boolean;
  reason?: string;
}

export class AdminEngine {
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

    // 2. Administrador Técnico
    if (actorRole === 'TECH_ADMIN') {
      if (targetRole === 'CONSULTANT' || targetRole === 'TECH_ADMIN') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'El Administrador Técnico solo da de alta Consultores Globales y administradores de plataforma.',
      };
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
