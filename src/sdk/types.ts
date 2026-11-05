/**
 * KIZUKAI PROJECT HUB - CONTRATO DE TIPOS DEL SDK Y DOMINIO (FASE 2)
 * Basado estrictamente en el PRD de Kizukai Project Hub (22 Entidades, 12 Estados, 6 Etapas, 5 Roles)
 */

export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;

// ============================================================================
// 1. ENUMS Y UNIONES LITERALES DE CATÁLOGOS OFICIALES
// ============================================================================

export type BusinessStateId =
  | 'BORRADOR'
  | 'POR_APROBAR'
  | 'PENDIENTE_ASIGNACION_MENTOR'
  | 'PENDIENTE_PLAN_IMPLEMENTACION'
  | 'EN_IMPLEMENTACION'
  | 'PENDIENTE_RESULTADOS'
  | 'POR_EVALUAR'
  | 'POR_DOCUMENTAR'
  | 'FINALIZADA'
  | 'DEVUELTA_PARA_AJUSTES'
  | 'RECHAZADA'
  | 'CANCELADA';

export type RoleId =
  | 'PARTICIPANT'
  | 'MENTOR'
  | 'COORDINATOR'
  | 'CONSULTANT'
  | 'TECH_ADMIN';

export type MethodologyStageId =
  | 'STAGE_1_FILTER'
  | 'STAGE_2_LEADERSHIP'
  | 'STAGE_3_GEMBA'
  | 'STAGE_4_HARD_DATA'
  | 'STAGE_5_ALIGNMENT'
  | 'STAGE_6_STANDARD';

export type DeliverableId =
  | 'DELIV_FEASIBILITY_BASELINE'
  | 'DELIV_WORK_PLAN_PHOTOS'
  | 'DELIV_CHECKLIST_5S'
  | 'DELIV_ROI_MATRIX'
  | 'DELIV_DIRECTIVE_ACT'
  | 'DELIV_NEW_SOP';

export type MetricId =
  | 'MINUTOS_BUSQUEDA'
  | 'HORAS_HOMBRE'
  | 'MERMA_KG'
  | 'COSTO_MXN'
  | 'COSTO_USD';

export type ProgramStatus = 'PLANIFICADO' | 'ACTIVO' | 'CERRADO';

export type ReviewDecision = 'APROBADO' | 'DEVUELTO' | 'RECHAZADO';

export type NotificationEventType =
  | 'ASSIGNMENT'
  | 'FEEDBACK_REQUIRED'
  | 'OVERDUE_ALERT'
  | 'STATE_TRANSITION'
  | 'GEMBA_AUDIT_SCHEDULED'
  | 'POE_PUBLISHED';

export type ReportType =
  | 'REPORT_A_PARTICIPANT_PERFORMANCE'
  | 'REPORT_B_COHORT_GOALS'
  | 'REPORT_C_IN_PROGRESS_TRACKING';

export type ExportFormat = 'XLSX' | 'CSV';

export type StateTransitionEvent =
  | 'ENVIAR_A_REVISION'
  | 'APROBAR_FILTRO_TECNICO'
  | 'RECHAZAR_IDEA'
  | 'ASIGNAR_MENTOR'
  | 'VALIDAR_PLAN'
  | 'SOLICITAR_AJUSTE_PLAN'
  | 'NOTIFICAR_TERMINO_OBRA'
  | 'ENVIAR_A_EVALUACION'
  | 'DEVOLVER_EVIDENCIA'
  | 'APROBAR_EVALUACION_K3'
  | 'PUBLICAR_ESTANDAR_POE'
  | 'REMITIR_CORRECCION'
  | 'CANCELAR_INICIATIVA';

// ============================================================================
// 2. INTERFACES DE LAS 22 ENTIDADES DEL MODELO RELACIONAL
// ============================================================================

/** Entidad 1: organizations */
export interface Organization {
  id: UUID;
  business_name: string;
  commercial_name: string;
  tax_id: string | null;
  industry_sector: string;
  is_active: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

/** Entidad 2: programs */
export interface Program {
  id: UUID;
  organization_id: UUID;
  name: string;
  start_date: ISODateString;
  end_date: ISODateString;
  target_ideas_count: number;
  status: ProgramStatus;
}

/** Entidad 3: users */
export interface User {
  id: UUID;
  organization_id: UUID | null;
  email: string;
  password_hash?: string | null;
  first_name: string;
  last_name: string;
  employee_number: string | null;
  phone_number: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
}

/** Entidad 4: roles */
export interface Role {
  id: RoleId;
  name: string;
  description: string | null;
}

/** Entidad 5: user_organization_roles */
export interface UserOrganizationRole {
  id: UUID;
  user_id: UUID;
  organization_id: UUID;
  role_id: RoleId;
}

/** Entidad 6: departments */
export interface Department {
  id: UUID;
  organization_id: UUID;
  name: string;
  branch_office: string | null;
}

/** Entidad 7: initiatives */
export interface Initiative {
  id: UUID;
  organization_id: UUID;
  program_id: UUID;
  department_id: UUID;
  tracking_code: string;
  title: string;
  k0_baseline: string;
  k1_job_function: string;
  k2_proactivity: string;
  k3_expected_impact: string;
  strategic_guideline: string;
  zero_investment_confirmed: boolean;
  current_state_id: BusinessStateId;
  return_target_state_id: BusinessStateId | null;
  created_by_user_id: UUID;
  active_mentor_id: UUID | null;
  created_at: ISODateTimeString;
  closed_at: ISODateTimeString | null;
}

/** Entidad 8: initiative_participants */
export interface InitiativeParticipant {
  id: UUID;
  initiative_id: UUID;
  user_id: UUID;
  is_lead: boolean;
}

/** Entidad 9: mentorship_assignments */
export interface MentorshipAssignment {
  id: UUID;
  initiative_id: UUID;
  mentor_user_id: UUID;
  assigned_by_id: UUID;
  assigned_at: ISODateTimeString;
  unassigned_at: ISODateTimeString | null;
  reassignment_reason: string | null;
}

/** Entidad 10: methodology_stages */
export interface MethodologyStage {
  id: MethodologyStageId;
  step_number: number;
  name: string;
  standard_duration_weeks: number;
}

/** Entidad 11: initiative_stage_instances */
export interface InitiativeStageInstance {
  id: UUID;
  initiative_id: UUID;
  stage_id: MethodologyStageId;
  started_at: ISODateTimeString;
  completed_at: ISODateTimeString | null;
  is_current: boolean;
}

/** Entidad 12: work_activities */
export interface WorkActivity {
  id: UUID;
  initiative_id: UUID;
  description: string;
  assigned_user_id: UUID;
  planned_start_date: ISODateString;
  planned_end_date: ISODateString;
  completion_percent: number;
}

/** Entidad 13: deliverables */
export interface Deliverable {
  id: DeliverableId;
  stage_id: MethodologyStageId;
  name: string;
  is_mandatory: boolean;
}

/** Entidad 14: evidences */
export interface Evidence {
  id: UUID;
  initiative_id: UUID;
  deliverable_id: DeliverableId | null;
  file_name: string;
  storage_url: string;
  mime_type: string;
  file_size_bytes: number;
  version_number: number;
  is_frozen: boolean;
  uploaded_by_id: UUID;
  uploaded_at: ISODateTimeString;
}

/** Entidad 15: reviews */
export interface Review {
  id: UUID;
  initiative_id: UUID;
  stage_instance_id: UUID;
  reviewer_user_id: UUID;
  decision: ReviewDecision;
  feedback_comments: string;
  reviewed_at: ISODateTimeString;
}

/** Entidad 16: comments */
export interface Comment {
  id: UUID;
  initiative_id: UUID;
  author_user_id: UUID;
  message: string;
  created_at: ISODateTimeString;
}

/** Entidad 17: business_states */
export interface BusinessState {
  id: BusinessStateId;
  label: string;
  sequence_order: number;
}

/** Entidad 18: state_transition_history */
export interface StateTransitionHistory {
  id: UUID;
  initiative_id: UUID;
  from_state_id: BusinessStateId | null;
  to_state_id: BusinessStateId;
  changed_by_user_id: UUID;
  transition_notes: string | null;
  transitioned_at: ISODateTimeString;
}

/** Entidad 19: metrics */
export interface Metric {
  id: MetricId | string;
  name: string;
  unit_of_measure: string;
}

/** Entidad 20: initiative_results */
export interface InitiativeResult {
  id: UUID;
  initiative_id: UUID;
  metric_id: MetricId | string;
  baseline_k0_value: number;
  achieved_k3_value: number;
  financial_saving_annual: number | null;
  is_validated_by_finance: boolean;
}

/** Entidad 21: notifications */
export interface Notification {
  id: UUID;
  recipient_user_id: UUID;
  initiative_id: UUID | null;
  event_type: NotificationEventType | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: ISODateTimeString;
}

/** Entidad 22: audit_logs */
export interface AuditLog {
  id: number;
  organization_id: UUID | null;
  user_id: UUID | null;
  action: string;
  entity_name: string;
  record_id: string;
  ip_address: string | null;
  user_agent: string | null;
  payload_before: Record<string, unknown> | null;
  payload_after: Record<string, unknown> | null;
  timestamp: ISODateTimeString;
}

// ============================================================================
// 3. CONTEXTO DE SEGURIDAD, ESPACIO DE TRABAJO Y REPORTES PRIORITARIOS
// ============================================================================

export interface TenantActorContext {
  userId: UUID;
  organizationId: UUID | null;
  roles: RoleId[];
  mfaVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface NextRequiredActionCard {
  actionTitle: string;
  actionCode: StateTransitionEvent | 'SUBIR_EVIDENCIA' | 'NINGUNA';
  responsibleUserId: UUID | null;
  responsibleUserName: string;
  responsibleRole: RoleId;
  dueDate: ISODateString | null;
  isOverdue: boolean;
  ctaLabel: string;
}

export interface InitiativeWorkspaceView {
  header: {
    initiativeId: UUID;
    trackingCode: string;
    title: string;
    organizationName: string;
    departmentName: string;
    proponentFullName: string;
    activeMentorFullName: string | null;
    overallProgressPercent: number;
    currentState: BusinessState;
    currentStageDeadline: ISODateString | null;
  };
  nextRequiredAction: NextRequiredActionCard;
  diagnosisAndBaseline: {
    k0Baseline: string;
    k1JobFunction: string;
    k2Proactivity: string;
    k3ExpectedImpact: string;
    strategicGuideline: string;
    zeroInvestmentConfirmed: boolean;
  };
  workPlanAndDeliverables: {
    activities: WorkActivity[];
    requiredDeliverables: Deliverable[];
    stageInstances: InitiativeStageInstance[];
  };
  evidenceVault: Evidence[];
  mentorshipAndFeedback: {
    reviews: Review[];
    comments: Comment[];
    mentorshipHistory: MentorshipAssignment[];
  };
  traceabilityLog: StateTransitionHistory[];
  resultsComparison: InitiativeResult[];
}

/** Reporte A: Desempeño e Ideas por Participante */
export interface ReportAParticipantRow {
  employeeNumber: string | null;
  fullName: string;
  email: string;
  organizationName: string;
  branchOffice: string | null;
  departmentName: string;
  habitualMentorName: string | null;
  totalRegisteredIdeas: number;
  draftIdeasCount: number;
  inImplementationIdeasCount: number;
  finalizedIdeasCount: number;
  accumulatedProactivityPoints: number;
}

/** Reporte B: Estadísticas de Iniciativas vs. Metas de Cohorte */
export interface ReportBCohortStatsRow {
  organizationName: string;
  programName: string;
  departmentName: string;
  activeParticipantsCount: number;
  committedTargetIdeas: number;
  actualRegisteredIdeas: number;
  progressVsTargetPercent: number;
  onTimeInitiativesCount: number;
  delayedInitiativesCount: number;
  totalValidatedFinancialSavingK3: number;
}

/** Reporte C: Iniciativas en Proceso y Seguimiento de Etapas */
export interface ReportCInProgressRow {
  consecutiveNumber: number;
  trackingCode: string;
  title: string;
  proponentFullName: string;
  departmentName: string;
  branchOffice: string | null;
  k0BaselineSummary: string;
  k2ProactivitySummary: string;
  k3ExpectedImpactSummary: string;
  currentStateId: BusinessStateId;
  activeStageId: MethodologyStageId;
  assignedMentorName: string | null;
  createdAt: ISODateTimeString;
  implementationDeadline: ISODateString | null;
  remainingOrDelayedDays: number;
  isDelayed: boolean;
  strategicGuideline: string;
  primaryMetricId: string | null;
}

export interface ReportExportResult {
  fileName: string;
  mimeType: string;
  buffer: Uint8Array;
  generatedAtUtc: ISODateTimeString;
  requestedByUserFullName: string;
  totalRecordsProcessed: number;
}

// ============================================================================
// 4. DTOs DE ENTRADA Y SALIDA DEL SDK
// ============================================================================

export interface RegisterInitiativeInput {
  organizationId: UUID;
  programId: UUID;
  departmentId: UUID;
  title: string;
  k0Baseline: string;
  k1JobFunction: string;
  k2Proactivity: string;
  k3ExpectedImpact: string;
  strategicGuideline: string;
  zeroInvestmentConfirmed: boolean;
  submitImmediately?: boolean;
}

export interface ApproveTechnicalFilterInput {
  initiativeId: UUID;
  zeroInvestmentVerified: boolean;
  safetyNormsCompliant: boolean;
  notes?: string;
}

export interface RejectInitiativeInput {
  initiativeId: UUID;
  technicalJustification: string;
}

export interface AssignMentorInput {
  initiativeId: UUID;
  mentorUserId: UUID;
  reassignmentReason?: string;
}

export interface WorkActivityDraftInput {
  description: string;
  assignedUserId: UUID;
  plannedStartDate: ISODateString;
  plannedEndDate: ISODateString;
  completionPercent?: number;
}

export interface SubmitPlanInput {
  initiativeId: UUID;
  activities: WorkActivityDraftInput[];
}

export interface ReviewPlanInput {
  initiativeId: UUID;
  approved: boolean;
  feedbackComments: string;
}

export interface NotifyWorkCompletionInput {
  initiativeId: UUID;
  notes?: string;
}

export interface UploadEvidenceInput {
  initiativeId: UUID;
  deliverableId: DeliverableId | null;
  fileName: string;
  storageUrl: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface SubmitForEvaluationInput {
  initiativeId: UUID;
  results: Array<{
    metricId: MetricId | string;
    baselineK0Value: number;
    achievedK3Value: number;
    financialSavingAnnual?: number;
  }>;
  notes?: string;
}

export interface ReviewDeliverableInput {
  initiativeId: UUID;
  stageInstanceId: UUID;
  decision: ReviewDecision;
  feedbackComments: string;
}

export interface ReturnWithFeedbackInput {
  initiativeId: UUID;
  feedbackComments: string;
}

export interface SubmitCorrectionInput {
  initiativeId: UUID;
  newEvidence: UploadEvidenceInput;
  correctionNotes?: string;
}

export interface ApproveEvaluationK3Input {
  initiativeId: UUID;
  gemba5sChecklistSigned: boolean;
  financeValidated: boolean;
  feedbackComments: string;
}

export interface PublishStandardPOEInput {
  initiativeId: UUID;
  poeDocumentCode: string;
  poeEvidence: UploadEvidenceInput;
  notes?: string;
}

export interface CancelInitiativeInput {
  initiativeId: UUID;
  managementCancellationDictum: string;
}

export interface ExportReportInput {
  reportType: ReportType;
  format: ExportFormat;
  filters: {
    organizationId?: UUID;
    programId?: UUID;
    departmentId?: UUID;
    branchOffice?: string;
    mentorUserId?: UUID;
    stateId?: BusinessStateId;
    stageId?: MethodologyStageId;
    strategicGuideline?: string;
    delayedOnly?: boolean;
    startDate?: ISODateString;
    endDate?: ISODateString;
  };
}

// ============================================================================
// 5. EXCEPCIONES DE DOMINIO TIPADAS (ERRORES DE REGLAS DE NEGOCIO Y TDD)
// ============================================================================

export class KizukaiDomainException extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus = 422) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidStateTransitionException extends KizukaiDomainException {
  constructor(fromState: BusinessStateId, toState: BusinessStateId, reason?: string) {
    super(
      `Transición de estado inválida de '${fromState}' a '${toState}'${reason ? `: ${reason}` : '.'}`,
      'INVALID_STATE_TRANSITION',
      422
    );
  }
}

export class ZeroInvestmentRequiredException extends KizukaiDomainException {
  constructor() {
    super(
      'La metodología Kizukai exige confirmar explícitamente el principio de Cero Inversión económica para registrar o aprobar la iniciativa K2.',
      'ZERO_INVESTMENT_REQUIRED',
      422
    );
  }
}

export class MaxImplementationWindowExceededException extends KizukaiDomainException {
  constructor(totalDays: number) {
    super(
      `El plan de implementación excede el límite improrrogable de 8 semanas (56 días). Plazo calculado: ${totalDays} días.`,
      'MAX_IMPLEMENTATION_WINDOW_EXCEEDED',
      422
    );
  }
}

export class InsufficientFeedbackCommentException extends KizukaiDomainException {
  constructor(minLength = 20) {
    super(
      `Toda devolución o solicitud de ajuste requiere un comentario técnico obligatorio de al menos ${minLength} caracteres.`,
      'INSUFFICIENT_FEEDBACK_COMMENT',
      422
    );
  }
}

export class TenantIsolationViolationException extends KizukaiDomainException {
  constructor(actorOrgId: UUID | null, resourceOrgId: UUID) {
    super(
      `Violación de aislamiento Multi-Tenant: el actor (${actorOrgId ?? 'SIN_ORG'}) no tiene autorización sobre recursos de la organización (${resourceOrgId}).`,
      'TENANT_ISOLATION_VIOLATION',
      403
    );
  }
}

export class InvalidMentorAssignmentException extends KizukaiDomainException {
  constructor(reason: string) {
    super(
      `Asignación de mentor inválida: ${reason}`,
      'INVALID_MENTOR_ASSIGNMENT',
      422
    );
  }
}

export class MissingGembaAuditChecklistException extends KizukaiDomainException {
  constructor() {
    super(
      'Bloqueo metodológico Paso 3: No es posible aprobar la evaluación K3 sin la Lista de Verificación 5S firmada presencialmente en el Gemba.',
      'MISSING_GEMBA_AUDIT_CHECKLIST',
      422
    );
  }
}

export class DuplicateInitiativeException extends KizukaiDomainException {
  constructor(trackingCodeOrTitle: string) {
    super(
      `Ya existe una iniciativa registrada con el identificador o título '${trackingCodeOrTitle}'.`,
      'DUPLICATE_INITIATIVE',
      409
    );
  }
}

export class MfaRequiredException extends KizukaiDomainException {
  constructor(role: RoleId) {
    super(
      `El rol '${role}' exige autenticación multifactor (MFA) verificada para ejecutar esta operación.`,
      'MFA_REQUIRED',
      401
    );
  }
}

export class ForbiddenRoleException extends KizukaiDomainException {
  constructor(action: string, requiredRoles: RoleId[]) {
    super(
      `Permiso denegado para ejecutar '${action}'. Roles autorizados: ${requiredRoles.join(', ')}.`,
      'FORBIDDEN_ROLE',
      403
    );
  }
}

// ============================================================================
// 6. CONTRATO PRINCIPAL DEL SDK (IKizukaiSDK)
// ============================================================================

export interface IKizukaiSDK {
  registerInitiative(
    actor: TenantActorContext,
    input: RegisterInitiativeInput
  ): Promise<Initiative>;

  approveTechnicalFilter(
    actor: TenantActorContext,
    input: ApproveTechnicalFilterInput
  ): Promise<Initiative>;

  rejectInitiative(
    actor: TenantActorContext,
    input: RejectInitiativeInput
  ): Promise<Initiative>;

  assignMentor(
    actor: TenantActorContext,
    input: AssignMentorInput
  ): Promise<{ initiative: Initiative; assignment: MentorshipAssignment }>;

  submitPlan(
    actor: TenantActorContext,
    input: SubmitPlanInput
  ): Promise<{ initiative: Initiative; activities: WorkActivity[] }>;

  reviewPlan(
    actor: TenantActorContext,
    input: ReviewPlanInput
  ): Promise<{ initiative: Initiative; review: Review }>;

  notifyWorkCompletion(
    actor: TenantActorContext,
    input: NotifyWorkCompletionInput
  ): Promise<Initiative>;

  uploadEvidence(
    actor: TenantActorContext,
    input: UploadEvidenceInput
  ): Promise<Evidence>;

  submitForEvaluation(
    actor: TenantActorContext,
    input: SubmitForEvaluationInput
  ): Promise<{ initiative: Initiative; results: InitiativeResult[] }>;

  reviewDeliverable(
    actor: TenantActorContext,
    input: ReviewDeliverableInput
  ): Promise<{ initiative: Initiative; review: Review }>;

  returnWithFeedback(
    actor: TenantActorContext,
    input: ReturnWithFeedbackInput
  ): Promise<{ initiative: Initiative; review: Review; frozenEvidences: Evidence[] }>;

  submitCorrection(
    actor: TenantActorContext,
    input: SubmitCorrectionInput
  ): Promise<{ initiative: Initiative; newEvidence: Evidence }>;

  approveEvaluationK3(
    actor: TenantActorContext,
    input: ApproveEvaluationK3Input
  ): Promise<{ initiative: Initiative; review: Review }>;

  publishStandardPOE(
    actor: TenantActorContext,
    input: PublishStandardPOEInput
  ): Promise<{ initiative: Initiative; poeEvidence: Evidence }>;

  cancelInitiative(
    actor: TenantActorContext,
    input: CancelInitiativeInput
  ): Promise<Initiative>;

  exportReportToExcel(
    actor: TenantActorContext,
    input: ExportReportInput
  ): Promise<ReportExportResult>;
}
