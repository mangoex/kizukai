export type TenantId = 'ORG-A' | 'ORG-B' | 'ORG-GLOBAL' | string;

export type BusinessState =
  | 'BORRADOR'
  | 'POR_APROBAR'
  | 'RECHAZADA'
  | 'PENDIENTE_ASIGNACION_MENTOR'
  | 'PENDIENTE_PLAN_IMPLEMENTACION'
  | 'EN_IMPLEMENTACION'
  | 'DEVUELTA_PARA_AJUSTES'
  | 'PENDIENTE_RESULTADOS'
  | 'POR_EVALUAR'
  | 'POR_DOCUMENTAR'
  | 'FINALIZADA'
  | 'CANCELADA';

export type Role =
  | 'PARTICIPANT'
  | 'MENTOR'
  | 'COORDINATOR'
  | 'CONSULTANT'
  | 'TECH_ADMIN';

export type StrategicGuideline =
  | 'CALIDAD'
  | 'COSTO'
  | 'ENTREGA'
  | 'SEGURIDAD'
  | 'MORAL';

export type MethodologicalStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: TenantId;
  tenantName: string;
  department?: string;
  requiresMfa: boolean;
  avatarInitials: string;
  avatarUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface Diagnostic {
  k0_deficient: string;
  k1_basic_function: string;
  k2_proactivity: string;
  k3_expected_impact: string;
  zero_investment_verified: boolean;
  ve_annual_value: number; // USD / año estimado
  currency: 'USD' | 'MXN';
}

export interface Task {
  id: string;
  title: string;
  week: number;
  step: MethodologicalStep;
  completed: boolean;
  completedAt?: string;
}

export interface Evidence {
  id: string;
  title: string;
  type: 'FOTO_ANTES' | 'FOTO_DESPUES' | 'MEDICION_GEMBA' | 'GRAFICA_CONTROL';
  version: 'v1.0' | 'v2.0';
  status: 'ACTIVA' | 'CONGELADA_DEVUELTA';
  urlOrDescription: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Gemba5SChecklist {
  seiri_clasificar: boolean;
  seiton_ordenar: boolean;
  seiso_limpiar: boolean;
  seiketsu_estandarizar: boolean;
  shitsuke_disciplina: boolean;
  score: number; // 0 a 100
  evaluatedBy: string;
  evaluatedAt: string;
  digitalSignature: string;
  financeValidated: boolean;
}

export interface MentorFeedback {
  id: string;
  mentorName: string;
  comment: string;
  createdAt: string;
  type: 'OBSERVACION' | 'APROBACION' | 'DEVOLUCION';
}

export interface StateTransition {
  id: string;
  fromState: BusinessState;
  toState: BusinessState;
  action: string;
  performedBy: string;
  performedRole: Role;
  timestamp: string;
  justification?: string;
  returnTargetStateId?: BusinessState;
}

export interface StandardizationSop {
  id: string;
  code: string;
  title: string;
  publishedAt: string;
  documentUrl: string;
}

export interface OrganizationRecord {
  id: string;
  businessName: string;
  commercialName: string;
  taxId?: string;
  industrySector: string;
  isActive: boolean;
  createdAt: string;
}

export interface DepartmentRecord {
  id: string;
  organizationId: string;
  name: string;
  branchOffice?: string;
}

export interface Initiative {
  id: string;
  folio: string; // Ej: KIZ-2026-0012
  title: string;
  tenantId: TenantId;
  tenantName: string;
  program: string; // 'Top Companies 2026'
  department: string;
  guideline: StrategicGuideline;
  state: BusinessState;
  currentStep: MethodologicalStep;
  progressPercent: number;
  proponentId: string;
  proponentName: string;
  mentorId?: string;
  mentorName?: string;
  returnTargetStateId?: BusinessState;
  deadlineDate: string; // ISO string (ventana 8 semanas / 56 días)
  createdAt: string;
  updatedAt: string;
  diagnostic: Diagnostic;
  tasks: Task[];
  evidences: Evidence[];
  checklist5s?: Gemba5SChecklist;
  feedbackList: MentorFeedback[];
  transitionHistory: StateTransition[];
  sop?: StandardizationSop;
  isStagnant: boolean; // > 7 días sin avance
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  performedBy: string;
  tenantId: string;
  timestamp: string;
  payloadSnapshot: Record<string, unknown>;
  ipAddress?: string;
}

export interface DemoProfile {
  user: User;
  description: string;
  requiresMfa: boolean;
  tag: string;
}

export interface DatabaseEntitySummary {
  name: string;
  displayName: string;
  count: number;
  description: string;
  primaryKey: string;
  tenantScoped: boolean;
}
