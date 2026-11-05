/**
 * Motor Determinista de Experiencia Web Móvil por Rol (Mobile-First Web App / PWA)
 * Cumple con los criterios de aceptación SBD CA-MOB-01 a CA-MOB-05:
 * - CA-MOB-01: Intangibilidad de escritorio (>= 1024px) y clasificación determinista de viewport.
 * - CA-MOB-02: Simplificación progresiva por rol (5 perfiles móviles dedicados).
 * - CA-MOB-03: Wizard móvil de 3 pasos para captura K2 en Gemba sin saturación cognitiva.
 * - CA-MOB-04: Acciones rápidas de 1 toque (Thumb-Zone Sticky Action Bar / Quick Card Actions).
 * - CA-MOB-05: Paridad de invariantes de negocio (Cero Inversión, 8 semanas, Gemba 5S, RBAC).
 */

export type MobileUserRole =
  | "PARTICIPANT"
  | "MENTOR"
  | "COORDINATOR"
  | "CONSULTANT"
  | "TECH_ADMIN"
  | "EMPLOYEE"
  | "LEADER"
  | "PROGRAM_COORDINATOR"
  | "EVALUATOR";

export type CanonicalMobileRole =
  | "PARTICIPANT"
  | "MENTOR"
  | "COORDINATOR"
  | "CONSULTANT"
  | "TECH_ADMIN";

export type ViewportMode = "MOBILE" | "TABLET" | "DESKTOP";

export interface ViewportClassification {
  mode: ViewportMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  showBottomNav: boolean;
  useBottomSheetModals: boolean;
  useCardTables: boolean;
}

export interface MobileRoleProfile {
  role: CanonicalMobileRole;
  modeTitle: string;
  subtitle: string;
  primaryCtaLabel: string;
  quickPills: string[];
  allowQuickCardActions: boolean;
  bottomNavItems: Array<{ id: string; label: string; badgeKey?: string }>;
}

export interface MobileWizardPayload {
  title?: string;
  department?: string;
  guideline?: string;
  k0_deficient?: string;
  k1_basic_function?: string;
  k2_proactivity?: string;
  k3_expected_impact?: string;
  zero_investment_verified?: boolean;
  asDraft?: boolean;
}

export interface MobileWizardValidationResult {
  valid: boolean;
  step: 1 | 2 | 3;
  errors: string[];
  canAdvance: boolean;
}

export type MobileQuickActionCode =
  | "ENVIAR_A_REVISION_RAPIDA"
  | "REMITIR_CORRECCION_RAPIDA"
  | "NOTIFICAR_TERMINO_OBRA_RAPIDA"
  | "ENVIAR_EVIDENCIA_K3_RAPIDA"
  | "APROBAR_FILTRO_1TAP"
  | "ASIGNAR_MENTOR_RAPIDO"
  | "PUBLICAR_POE_RAPIDO"
  | "VALIDAR_PLAN_RAPIDO"
  | "FIRMAR_5S_Y_APROBAR_K3"
  | "CONSULTAR_DETALLE_EJECUTIVO"
  | "NINGUNA_ACCION_OPERATIVA";

export interface MobileQuickActionDescriptor {
  actionCode: MobileQuickActionCode;
  label: string;
  requiresConfirmationSheet: boolean;
  isAvailable: boolean;
  thumbZonePriority: "PRIMARY" | "SECONDARY" | "READ_ONLY";
}

function normalizeRole(role: MobileUserRole | string): CanonicalMobileRole {
  switch (role) {
    case "PARTICIPANT":
    case "EMPLOYEE":
    case "LEADER":
      return "PARTICIPANT";
    case "MENTOR":
    case "EVALUATOR":
      return "MENTOR";
    case "COORDINATOR":
    case "PROGRAM_COORDINATOR":
      return "COORDINATOR";
    case "CONSULTANT":
      return "CONSULTANT";
    case "TECH_ADMIN":
      return "TECH_ADMIN";
    default:
      return "PARTICIPANT";
  }
}

/**
 * CA-MOB-01: Clasifica el ancho de pantalla garantizando intangibilidad total en Desktop (>= 1024px).
 * - `< 768`: MOBILE
 * - `768..1023`: TABLET
 * - `>= 1024`: DESKTOP (`showBottomNav: false, useBottomSheetModals: false, useCardTables: false`)
 */
export function classifyViewport(width: number): ViewportClassification {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1280;

  if (safeWidth < 768) {
    return {
      mode: "MOBILE",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      showBottomNav: true,
      useBottomSheetModals: true,
      useCardTables: true,
    };
  }

  if (safeWidth < 1024) {
    return {
      mode: "TABLET",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      showBottomNav: true,
      useBottomSheetModals: true,
      useCardTables: true,
    };
  }

  return {
    mode: "DESKTOP",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    showBottomNav: false,
    useBottomSheetModals: false,
    useCardTables: false,
  };
}

/**
 * CA-MOB-02: Devuelve el perfil de interfaz móvil simplificada según el rol activo.
 */
export function getMobileRoleProfile(role: MobileUserRole | string): MobileRoleProfile {
  const canonical = normalizeRole(role);

  switch (canonical) {
    case "PARTICIPANT":
      return {
        role: "PARTICIPANT",
        modeTitle: "Modo Gemba Express",
        subtitle: "Captura rápida K2 Cero Inversión y seguimiento de mis mejoras en piso",
        primaryCtaLabel: "+ Nueva Idea K2 (3 Pasos)",
        quickPills: [" Requieren Ajuste", "En Implementación", "Borradores", "Finalizadas"],
        allowQuickCardActions: true,
        bottomNavItems: [
          { id: "INBOX", label: "Mis Ideas" },
          { id: "NEW_IDEA", label: "+ Capturar K2" },
          { id: "WORKSPACE", label: "Espacio" },
          { id: "PROFILE", label: "Rol" },
        ],
      };

    case "MENTOR":
      return {
        role: "MENTOR",
        modeTitle: "Modo Gemba Walk & 5S",
        subtitle: "Auditoría en sitio, validación de planes <= 8 semanas y dictamen K3",
        primaryCtaLabel: "Evaluar Entregable / 5S",
        quickPills: ["Por Evaluar K3", "Validar Plan 8 Sem", "Próximas a Vencer", "Todas"],
        allowQuickCardActions: true,
        bottomNavItems: [
          { id: "INBOX", label: "Por Evaluar" },
          { id: "WORKSPACE", label: "Auditoría 5S" },
          { id: "REPORTS", label: "Métricas" },
          { id: "PROFILE", label: "Rol" },
        ],
      };

    case "COORDINATOR":
      return {
        role: "COORDINATOR",
        modeTitle: "Modo Triage & Asignación",
        subtitle: "Filtro técnico Cero Inversión de 1 toque y asignación ágil de mentores",
        primaryCtaLabel: "Triage de Bandeja",
        quickPills: ["Filtro Técnico (Por Aprobar)", "Sin Mentor", "Por Documentar POE", "Alerta > 7d"],
        allowQuickCardActions: true,
        bottomNavItems: [
          { id: "INBOX", label: "Triage" },
          { id: "WORKSPACE", label: "Asignar" },
          { id: "REPORTS", label: "Reportes" },
          { id: "PROFILE", label: "Rol" },
        ],
      };

    case "CONSULTANT":
      return {
        role: "CONSULTANT",
        modeTitle: "Modo Pulso Ejecutivo",
        subtitle: "Supervisión multiempresa, ahorros K3 validados y exportación móvil",
        primaryCtaLabel: "Exportar Sabana C (.xlsx)",
        quickPills: ["Consolidado Global", "Top Prácticas K3", "Por Documentar POE", "En Riesgo"],
        allowQuickCardActions: true,
        bottomNavItems: [
          { id: "INBOX", label: "Portafolio" },
          { id: "REPORTS", label: "Sabana .XLSX" },
          { id: "WORKSPACE", label: "Detalle" },
          { id: "PROFILE", label: "Rol" },
        ],
      };

    case "TECH_ADMIN":
      return {
        role: "TECH_ADMIN",
        modeTitle: "Modo Pocket Control & RBAC",
        subtitle: "Gobernanza Multi-Tenant, verificación MFA y auditoría sin acceso a contenido",
        primaryCtaLabel: "Verificar Estado MFA & Tenants",
        quickPills: [" Estado MFA", "Aislamiento Tenant", "Logs Inmutables"],
        allowQuickCardActions: false,
        bottomNavItems: [
          { id: "INBOX", label: "Seguridad" },
          { id: "REPORTS", label: "Auditoría" },
          { id: "PROFILE", label: "Rol" },
        ],
      };
  }
}

/**
 * CA-MOB-03: Valida paso a paso el wizard móvil de 3 pasos para crear iniciativas K2.
 * - Paso 1 (Identificación en Gemba): `title`, `department`, `guideline`
 * - Paso 2 (Diagnóstico K0/K1 y Propuesta K2): `k0_deficient`, `k1_basic_function`, `k2_proactivity`
 * - Paso 3 (Impacto K3 y Declaración Cero Inversión): `k3_expected_impact`, `zero_investment_verified` (obligatorio salvo `asDraft: true`)
 */
export function validateMobileWizardStep(
  step: 1 | 2 | 3,
  payload: Partial<MobileWizardPayload>
): MobileWizardValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    if (!payload.title || payload.title.trim().length < 5) {
      errors.push("El título de la mejora requiere al menos 5 caracteres.");
    }
    if (!payload.department || payload.department.trim().length === 0) {
      errors.push("Selecciona el departamento o área operativa.");
    }
    if (!payload.guideline || payload.guideline.trim().length === 0) {
      errors.push("Selecciona la directriz estratégica de impacto.");
    }
  } else if (step === 2) {
    if (!payload.k0_deficient || payload.k0_deficient.trim().length < 10) {
      errors.push("Describe la situación deficiente actual (K0) con al menos 10 caracteres.");
    }
    if (!payload.k1_basic_function || payload.k1_basic_function.trim().length < 5) {
      errors.push("Especifica la condición básica (K1) con al menos 5 caracteres.");
    }
    if (!payload.k2_proactivity || payload.k2_proactivity.trim().length < 10) {
      errors.push("Detalla la mejora creativa Cero Inversión (K2) con al menos 10 caracteres.");
    }
  } else if (step === 3) {
    if (!payload.k3_expected_impact || payload.k3_expected_impact.trim().length < 5) {
      errors.push("Indica el beneficio esperado (K3) con al menos 5 caracteres.");
    }
    if (!payload.asDraft && payload.zero_investment_verified !== true) {
      errors.push(
        "Debes confirmar explícitamente que la propuesta K2 cumple Cero Inversión (CAPEX = $0)."
      );
    }
  }

  return {
    valid: errors.length === 0,
    step,
    errors,
    canAdvance: errors.length === 0,
  };
}

/**
 * CA-MOB-04: Retorna la acción rápida de 1 toque para tarjetas móviles y la Sticky Thumb-Zone Action Bar.
 */
export function getMobileQuickActionForInitiative(
  role: MobileUserRole | string,
  state: string
): MobileQuickActionDescriptor {
  const canonical = normalizeRole(role);

  if (canonical === "TECH_ADMIN") {
    return {
      actionCode: "NINGUNA_ACCION_OPERATIVA",
      label: "Bloqueado por RBAC (Solo Metadatos)",
      requiresConfirmationSheet: false,
      isAvailable: false,
      thumbZonePriority: "READ_ONLY",
    };
  }

  if (canonical === "PARTICIPANT") {
    if (state === "BORRADOR") {
      return {
        actionCode: "ENVIAR_A_REVISION_RAPIDA",
        label: "Enviar Idea a Revisión",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "DEVUELTA_PARA_AJUSTES") {
      return {
        actionCode: "REMITIR_CORRECCION_RAPIDA",
        label: "Subir Nueva Versión y Remitir",
        requiresConfirmationSheet: true,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "EN_IMPLEMENTACION") {
      return {
        actionCode: "NOTIFICAR_TERMINO_OBRA_RAPIDA",
        label: "Completar Plan (100%) y Notificar",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "PENDIENTE_RESULTADOS") {
      return {
        actionCode: "ENVIAR_EVIDENCIA_K3_RAPIDA",
        label: "Enviar Evidencias K0/K3 a Evaluación",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
  }

  if (canonical === "COORDINATOR") {
    if (state === "POR_APROBAR") {
      return {
        actionCode: "APROBAR_FILTRO_1TAP",
        label: "Aprobar Filtro Cero Inversión",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "PENDIENTE_ASIGNACION_MENTOR") {
      return {
        actionCode: "ASIGNAR_MENTOR_RAPIDO",
        label: "Asignar Mentor en 1 Toque",
        requiresConfirmationSheet: true,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "POR_DOCUMENTAR") {
      return {
        actionCode: "PUBLICAR_POE_RAPIDO",
        label: "Publicar Estándar POE y Cerrar",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
  }

  if (canonical === "MENTOR") {
    if (state === "PENDIENTE_PLAN_IMPLEMENTACION") {
      return {
        actionCode: "VALIDAR_PLAN_RAPIDO",
        label: "Validar Plan (<= 8 Semanas)",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "POR_EVALUAR") {
      return {
        actionCode: "FIRMAR_5S_Y_APROBAR_K3",
        label: "Firmar Auditoría 5S y Aprobar K3",
        requiresConfirmationSheet: true,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
  }

  if (canonical === "CONSULTANT") {
    if (state === "POR_APROBAR") {
      return {
        actionCode: "APROBAR_FILTRO_1TAP",
        label: "Aprobar Filtro Cero Inversión",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
    if (state === "POR_DOCUMENTAR") {
      return {
        actionCode: "PUBLICAR_POE_RAPIDO",
        label: "Publicar Estándar POE y Cerrar",
        requiresConfirmationSheet: false,
        isAvailable: true,
        thumbZonePriority: "PRIMARY",
      };
    }
  }

  return {
    actionCode: "CONSULTAR_DETALLE_EJECUTIVO",
    label: "Ver Ficha de Iniciativa",
    requiresConfirmationSheet: false,
    isAvailable: false,
    thumbZonePriority: "SECONDARY",
  };
}
