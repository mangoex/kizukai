/**
 * Motor de Dominio Kizukai Project Hub (TypeScript).
 * Reglas de negocio para las 22 entidades, 12 estados de negocio,
 * 6 etapas metodológicas, control Multi-Tenant, bitácora de auditoría inmutable
 * y exportación de reportes A, B y C.
 */

// ============================================================================
// ENUMS Y TIPOS DE CATÁLOGO
// ============================================================================

export enum InitiativeState {
  BORRADOR = "BORRADOR",
  POR_APROBAR = "POR_APROBAR",
  PENDIENTE_ASIGNACION_MENTOR = "PENDIENTE_ASIGNACION_MENTOR",
  PENDIENTE_PLAN_IMPLEMENTACION = "PENDIENTE_PLAN_IMPLEMENTACION",
  EN_IMPLEMENTACION = "EN_IMPLEMENTACION",
  PENDIENTE_RESULTADOS = "PENDIENTE_RESULTADOS",
  POR_EVALUAR = "POR_EVALUAR",
  POR_DOCUMENTAR = "POR_DOCUMENTAR",
  FINALIZADA = "FINALIZADA",
  DEVUELTA_PARA_AJUSTES = "DEVUELTA_PARA_AJUSTES",
  RECHAZADA = "RECHAZADA",
  CANCELADA = "CANCELADA",
}

export enum ProgramType {
  K0 = "K0",
  K1 = "K1",
  K2 = "K2",
  K3 = "K3",
}

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  LEADER = "LEADER",
  MENTOR = "MENTOR",
  PROGRAM_COORDINATOR = "PROGRAM_COORDINATOR",
  EVALUATOR = "EVALUATOR",
  TECH_ADMIN = "TECH_ADMIN",
  CONSULTANT = "CONSULTANT",
}

// ============================================================================
// EXCEPCIONES DE DOMINIO TIPADAS
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
  constructor(message?: string) {
    super(
      message || "Transición de estado ilegal en el ciclo de vida de la iniciativa.",
      "INVALID_STATE_TRANSITION",
      422
    );
  }
}

export class CrossTenantAccessDeniedException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "Acceso denegado por violación de aislamiento Multi-Tenant.",
      "CROSS_TENANT_ACCESS_DENIED",
      403
    );
  }
}

export class ZeroInvestmentRequiredException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "La metodología Kizukai K2 exige Cero Inversión económica (CAPEX = 0).",
      "ZERO_INVESTMENT_REQUIRED",
      422
    );
  }
}

export class MaxImplementationWindowExceededException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "El plan de implementación excede el límite improrrogable de 8 semanas (56 días).",
      "MAX_IMPLEMENTATION_WINDOW_EXCEEDED",
      422
    );
  }
}

export class InsufficientReturnFeedbackException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "El comentario técnico de devolución requiere un mínimo de 20 caracteres.",
      "INSUFFICIENT_RETURN_FEEDBACK",
      422
    );
  }
}

export class InvalidMentorAssignmentException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "El mentor no pertenece a la misma organización o está inactivo.",
      "INVALID_MENTOR_ASSIGNMENT",
      422
    );
  }
}

export class EvaluationPrerequisitesNotMetException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "No cumple los prerequisitos de auditoría Gemba 5S o validación financiera.",
      "EVALUATION_PREREQUISITES_NOT_MET",
      422
    );
  }
}

export class DuplicateInitiativeException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "Ya existe una iniciativa con el mismo título, departamento y programa.",
      "DUPLICATE_INITIATIVE",
      409
    );
  }
}

export class PrivilegeViolationException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "El rol no tiene autorización para realizar operaciones funcionales u operativas.",
      "PRIVILEGE_VIOLATION",
      403
    );
  }
}

export class MFARequiredException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "Operación restringida que exige verificación multifactor (MFA).",
      "MFA_REQUIRED",
      401
    );
  }
}

export class AuditLogTamperingException extends KizukaiDomainException {
  constructor(message?: string) {
    super(
      message || "Intento de mutación o borrado de la bitácora inmutable de auditoría.",
      "AUDIT_LOG_TAMPERING",
      403
    );
  }
}

// ============================================================================
// CONTRATOS E INTERFACES DE ENTIDADES
// ============================================================================

export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  roles: Role[];
  mfaVerified?: boolean;
}

export interface StateTransitionRecord {
  fromState: InitiativeState | null;
  toState: InitiativeState;
  actorEmail: string;
  timestamp: string;
  notes?: string;
}

export interface EvidenceRecord {
  id: string;
  fileName: string;
  contentHash: string;
  versionNumber: number;
  versionLabel: string;
  frozen: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MentorshipAssignmentRecord {
  mentorEmail: string;
  isActive: boolean;
  assignedAt: string;
}

export interface StageInstanceRecord {
  stageId: string;
  name: string;
  isCurrent: boolean;
}

export interface AuditLogRecord {
  id: string;
  organizationId: string;
  initiativeId?: string;
  action: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  organizationId: string;
  initiativeId?: string;
  eventType: string;
  priority: string;
  recipientEmail: string;
  message: string;
  createdAt: string;
}

export interface FinancialMetrics {
  netAnnualSavings: number;
  enterpriseValue: number;
  roiPercentage: number;
}

export interface NextActionCard {
  actionTitle: string;
  responsibleRole: Role;
  dueDate: string | null;
  isOverdue: boolean;
  ctaLabel: string;
}

export interface ReportResult {
  fileName: string;
  totalRecords: number;
  payloadBytes: Uint8Array;
  organizationId: string;
  requestedBy: string;
  generatedAtUtc: string;
  rows: Array<Record<string, unknown>>;
}

export interface Initiative {
  id: string;
  folio: string;
  organizationId: string;
  title: string;
  department: string;
  program: ProgramType;
  state: InitiativeState;
  zeroInvestmentConfirmed: boolean;
  capexAmount: number;
  createdBy: string;
  returnTargetStateId?: InitiativeState | null;
  previousStateBeforeEvaluation?: InitiativeState | null;
  stateHistory: StateTransitionRecord[];
  evidences: EvidenceRecord[];
  stageInstances: StageInstanceRecord[];
  mentorshipAssignments: MentorshipAssignmentRecord[];
  activities: Array<{ activity: string; start: string; end: string }>;
  createdAt: string;
}

export interface MentorProfile {
  email: string;
  organizationId: string;
  isActive: boolean;
}

// ============================================================================
// CONSTRUCTOR ZIP LIGERO EN MEMORIA PARA ARCHIVOS OOXML .XLSX
// ============================================================================

// Tabla CRC32 estándar precomputada
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function createZipArchive(entries: ZipEntry[]): Uint8Array {
  const textEncoder = new TextEncoder();
  const fileRecords: Array<{
    pathBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  let currentOffset = 0;
  const parts: Uint8Array[] = [];

  for (const entry of entries) {
    const pathBytes = textEncoder.encode(entry.path);
    const crc = calculateCrc32(entry.data);
    const offset = currentOffset;

    // Header local (30 bytes + pathBytes.length + data.length)
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature 'PK\x03\x04'
    view.setUint16(4, 20, true); // Version needed (2.0)
    view.setUint16(6, 0, true); // Flags
    view.setUint16(8, 0, true); // Compression method (0 = Stored)
    view.setUint16(10, 0, true); // Last mod time
    view.setUint16(12, 0, true); // Last mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, entry.data.length, true); // Compressed size
    view.setUint32(22, entry.data.length, true); // Uncompressed size
    view.setUint16(26, pathBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(pathBytes, 30);

    parts.push(localHeader);
    parts.push(entry.data);

    currentOffset += localHeader.length + entry.data.length;
    fileRecords.push({ pathBytes, data: entry.data, crc, offset });
  }

  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const rec of fileRecords) {
    // Header directorio central (46 bytes + pathBytes.length)
    const cdHeader = new Uint8Array(46 + rec.pathBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory header 'PK\x01\x02'
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0, true); // Flags
    view.setUint16(10, 0, true); // Compression
    view.setUint16(12, 0, true); // Mod time
    view.setUint16(14, 0, true); // Mod date
    view.setUint32(16, rec.crc, true); // CRC32
    view.setUint32(20, rec.data.length, true); // Comp size
    view.setUint32(24, rec.data.length, true); // Uncomp size
    view.setUint16(28, rec.pathBytes.length, true); // Name len
    view.setUint16(30, 0, true); // Extra len
    view.setUint16(32, 0, true); // Comment len
    view.setUint16(34, 0, true); // Disk start
    view.setUint16(36, 0, true); // Internal attr
    view.setUint32(38, 0, true); // External attr
    view.setUint32(42, rec.offset, true); // Offset of local header
    cdHeader.set(rec.pathBytes, 46);

    parts.push(cdHeader);
    centralDirSize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const viewEocd = new DataView(eocd.buffer);
  viewEocd.setUint32(0, 0x06054b50, true); // EOCD signature 'PK\x05\x06'
  viewEocd.setUint16(4, 0, true); // Disk number
  viewEocd.setUint16(6, 0, true); // Start disk
  viewEocd.setUint16(8, fileRecords.length, true); // Entries on disk
  viewEocd.setUint16(10, fileRecords.length, true); // Total entries
  viewEocd.setUint32(12, centralDirSize, true); // CD size
  viewEocd.setUint32(16, centralDirStartOffset, true); // CD offset
  viewEocd.setUint16(20, 0, true); // Comment length

  parts.push(eocd);

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

// ============================================================================
// MOTOR DE DOMINIO KIZUKAI (KizukaiEngine)
// ============================================================================

export class KizukaiEngine {
  private initiatives: Map<string, Initiative> = new Map();
  private mentorProfiles: Map<string, MentorProfile> = new Map();
  private auditLogs: AuditLogRecord[] = [];
  private notifications: NotificationRecord[] = [];
  private folioCounters: Map<string, number> = new Map();

  constructor() {}

  /**
   * Crea una instancia de KizukaiEngine pre-poblada con las 22 entidades semilla
   * para demostraciones interactivas y API endpoints.
   */
  public static createWithDemoSeed(): KizukaiEngine {
    const engine = new KizukaiEngine();

    // 1. Mentores en Catálogo
    engine.registerMentorProfile({
      email: "carlos.mentor@empresa.com",
      organizationId: "ORG-A",
      isActive: true,
    });
    engine.registerMentorProfile({
      email: "roberto.mentor@empresa.com",
      organizationId: "ORG-A",
      isActive: true,
    });
    engine.registerMentorProfile({
      email: "externo.mentor@orgb.com",
      organizationId: "ORG-B",
      isActive: true,
    });

    // 2. Iniciativas en varios estados representativos
    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0001",
      state: InitiativeState.POR_APROBAR,
      ownerEmail: "juan.perez@empresa.com",
      program: ProgramType.K2,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0015",
      state: InitiativeState.POR_EVALUAR,
      ownerEmail: "juan.perez@empresa.com",
      mentorEmail: "carlos.mentor@empresa.com",
      program: ProgramType.K2,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0022",
      state: InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
      ownerEmail: "juan.perez@empresa.com",
      program: ProgramType.K2,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0030",
      state: InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
      ownerEmail: "juan.perez@empresa.com",
      program: ProgramType.K2,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0040",
      state: InitiativeState.POR_EVALUAR,
      ownerEmail: "juan.perez@empresa.com",
      mentorEmail: "roberto.mentor@empresa.com",
      program: ProgramType.K3,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0050",
      state: InitiativeState.FINALIZADA,
      ownerEmail: "juan.perez@empresa.com",
      mentorEmail: "carlos.mentor@empresa.com",
      program: ProgramType.K2,
    });

    engine.seedInitiativeInState({
      organizationId: "ORG-B",
      folio: "KIZ-2026-0101",
      state: InitiativeState.EN_IMPLEMENTACION,
      ownerEmail: "laura.operadora@bajio.com",
      mentorEmail: "externo.mentor@orgb.com",
      program: ProgramType.K2,
    });

    return engine;
  }

  private nowUtc(): string {
    return new Date().toISOString();
  }

  private nextFolio(organizationId: string): string {
    const current = (this.folioCounters.get(organizationId) || 0) + 1;
    this.folioCounters.set(organizationId, current);
    const padded = String(current).padStart(4, "0");
    return `KIZ-2026-${padded}`;
  }

  private checkTenant(actor: UserContext, resourceOrgId: string): void {
    if (actor.roles.includes(Role.CONSULTANT)) {
      return;
    }
    if (actor.organizationId !== resourceOrgId) {
      throw new CrossTenantAccessDeniedException(
        `El usuario de la organización '${actor.organizationId}' no puede acceder a recursos de '${resourceOrgId}'.`
      );
    }
  }

  private recordAudit(
    organizationId: string,
    initiativeId: string | undefined,
    action: string,
    beforeSnapshot: Record<string, unknown>,
    afterSnapshot: Record<string, unknown>
  ): AuditLogRecord {
    const record: AuditLogRecord = {
      id: "log-" + Math.random().toString(36).substring(2, 10),
      organizationId,
      initiativeId,
      action,
      beforeSnapshot,
      afterSnapshot,
      timestamp: this.nowUtc(),
    };
    this.auditLogs.push(record);
    return record;
  }

  private enqueueNotification(
    organizationId: string,
    initiativeId: string | undefined,
    eventType: string,
    recipientEmail: string,
    priority = "NORMAL",
    message = ""
  ): NotificationRecord {
    const notif: NotificationRecord = {
      id: "notif-" + Math.random().toString(36).substring(2, 10),
      organizationId,
      initiativeId,
      eventType,
      priority,
      recipientEmail,
      message,
      createdAt: this.nowUtc(),
    };
    this.notifications.push(notif);
    return notif;
  }

  // --------------------------------------------------------------------------
  // CASOS DE USO DE INICIATIVAS
  // --------------------------------------------------------------------------

  public createInitiative(params: {
    actor: UserContext;
    title: string;
    department: string;
    program: ProgramType;
    zeroInvestmentConfirmed: boolean;
    capexAmount: number;
  }): Initiative {
    const { actor, title, department, program, zeroInvestmentConfirmed, capexAmount } = params;

    // Regla K2 Cero Inversión
    if (program === ProgramType.K2) {
      if (!zeroInvestmentConfirmed || capexAmount > 0) {
        throw new ZeroInvestmentRequiredException();
      }
    }

    // Regla de duplicados por título normalizado, depto y programa dentro del tenant
    const normTitle = title.trim().toLowerCase().replace(/\s+/g, " ");
    const normDept = department.trim().toLowerCase().replace(/\s+/g, " ");

    for (const init of this.initiatives.values()) {
      if (init.organizationId === actor.organizationId && init.program === program) {
        const otherTitle = init.title.trim().toLowerCase().replace(/\s+/g, " ");
        const otherDept = init.department.trim().toLowerCase().replace(/\s+/g, " ");
        if (otherTitle === normTitle && otherDept === normDept) {
          throw new DuplicateInitiativeException(
            `Iniciativa duplicada con el título '${title}' en el departamento '${department}'.`
          );
        }
      }
    }

    const now = this.nowUtc();
    const id = "init-" + Math.random().toString(36).substring(2, 11);
    const initialHistory: StateTransitionRecord[] = [
      {
        fromState: null,
        toState: InitiativeState.BORRADOR,
        actorEmail: actor.email,
        timestamp: now,
        notes: "Creación de iniciativa en borrador",
      },
    ];

    const initialStages: StageInstanceRecord[] = [
      { stageId: "STAGE_1_FILTER", name: "Paso 1: Filtro Técnico", isCurrent: true },
    ];

    const initiative: Initiative = {
      id,
      folio: "",
      organizationId: actor.organizationId,
      title: title.trim(),
      department: department.trim(),
      program,
      state: InitiativeState.BORRADOR,
      zeroInvestmentConfirmed,
      capexAmount,
      createdBy: actor.email,
      stateHistory: initialHistory,
      evidences: [],
      stageInstances: initialStages,
      mentorshipAssignments: [],
      activities: [],
      createdAt: now,
    };

    this.initiatives.set(id, initiative);

    this.recordAudit(
      actor.organizationId,
      id,
      "CREATE_INITIATIVE",
      { state: null },
      { state: InitiativeState.BORRADOR, title: initiative.title }
    );

    return initiative;
  }

  public getInitiative(params: { actor: UserContext; initiativeId: string }): Initiative {
    const { actor, initiativeId } = params;
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) {
      throw new Error(`Iniciativa ${initiativeId} no encontrada.`);
    }
    this.checkTenant(actor, initiative.organizationId);
    return initiative;
  }

  public listInitiatives(params: { actor: UserContext }): Initiative[] {
    const { actor } = params;
    const result: Initiative[] = [];
    for (const init of this.initiatives.values()) {
      if (actor.roles.includes(Role.CONSULTANT) || init.organizationId === actor.organizationId) {
        result.push(init);
      }
    }
    return result;
  }

  public submitForApproval(params: { actor: UserContext; initiativeId: string }): Initiative {
    const { actor, initiativeId } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    if (initiative.state !== InitiativeState.BORRADOR) {
      throw new InvalidStateTransitionException(
        `No es posible enviar a revisión desde el estado ${initiative.state}.`
      );
    }

    const beforeState = initiative.state;
    if (!initiative.folio) {
      initiative.folio = this.nextFolio(initiative.organizationId);
    }

    initiative.state = InitiativeState.POR_APROBAR;
    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: InitiativeState.POR_APROBAR,
      actorEmail: actor.email,
      timestamp: now,
      notes: "Envío a filtro técnico",
    });

    this.recordAudit(
      initiative.organizationId,
      initiative.id,
      "SUBMIT_FOR_APPROVAL",
      { state: beforeState },
      { state: InitiativeState.POR_APROBAR, folio: initiative.folio }
    );

    this.enqueueNotification(
      initiative.organizationId,
      initiative.id,
      "INITIATIVE_SUBMITTED",
      initiative.createdBy,
      "NORMAL",
      `Iniciativa ${initiative.folio} enviada para aprobación.`
    );

    return initiative;
  }

  public transitionState(params: {
    actor: UserContext;
    initiativeId: string;
    targetState: InitiativeState;
    notes?: string;
  }): Initiative {
    const { actor, initiativeId, targetState, notes } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    const allowedTransitions: Record<InitiativeState, InitiativeState[]> = {
      [InitiativeState.BORRADOR]: [InitiativeState.POR_APROBAR, InitiativeState.CANCELADA],
      [InitiativeState.POR_APROBAR]: [
        InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
        InitiativeState.RECHAZADA,
        InitiativeState.CANCELADA,
        InitiativeState.DEVUELTA_PARA_AJUSTES,
      ],
      [InitiativeState.PENDIENTE_ASIGNACION_MENTOR]: [
        InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION]: [
        InitiativeState.EN_IMPLEMENTACION,
        InitiativeState.DEVUELTA_PARA_AJUSTES,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.EN_IMPLEMENTACION]: [
        InitiativeState.PENDIENTE_RESULTADOS,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.PENDIENTE_RESULTADOS]: [
        InitiativeState.POR_EVALUAR,
        InitiativeState.DEVUELTA_PARA_AJUSTES,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.POR_EVALUAR]: [
        InitiativeState.POR_DOCUMENTAR,
        InitiativeState.DEVUELTA_PARA_AJUSTES,
        InitiativeState.RECHAZADA,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.POR_DOCUMENTAR]: [
        InitiativeState.FINALIZADA,
        InitiativeState.DEVUELTA_PARA_AJUSTES,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.DEVUELTA_PARA_AJUSTES]: [
        initiative.returnTargetStateId || InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
        InitiativeState.CANCELADA,
      ],
      [InitiativeState.FINALIZADA]: [],
      [InitiativeState.RECHAZADA]: [],
      [InitiativeState.CANCELADA]: [],
    };

    const validTargets = allowedTransitions[initiative.state] || [];
    if (!validTargets.includes(targetState)) {
      throw new InvalidStateTransitionException(
        `Transición ilegal de '${initiative.state}' a '${targetState}'.`
      );
    }

    const beforeState = initiative.state;
    initiative.state = targetState;
    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: targetState,
      actorEmail: actor.email,
      timestamp: now,
      notes,
    });

    this.recordAudit(
      initiative.organizationId,
      initiative.id,
      "STATE_TRANSITION",
      { state: beforeState },
      { state: targetState }
    );

    return initiative;
  }

  public seedInitiativeInState(params: {
    organizationId: string;
    folio: string;
    state: InitiativeState;
    ownerEmail: string;
    mentorEmail?: string;
    program?: ProgramType;
  }): Initiative {
    const { organizationId, folio, state, ownerEmail, mentorEmail, program = ProgramType.K2 } = params;
    const id = "seed-" + Math.random().toString(36).substring(2, 10);
    const now = this.nowUtc();

    const mentorshipAssignments: MentorshipAssignmentRecord[] = [];
    if (mentorEmail) {
      mentorshipAssignments.push({
        mentorEmail,
        isActive: true,
        assignedAt: now,
      });
    }

    const stages: StageInstanceRecord[] = [
      { stageId: "STAGE_1_FILTER", name: "Paso 1: Filtro Técnico", isCurrent: false },
      { stageId: "STAGE_2_LEADERSHIP", name: "Paso 2: Liderazgo", isCurrent: false },
      { stageId: "STAGE_3_GEMBA", name: "Paso 3: Gemba", isCurrent: false },
      { stageId: "STAGE_4_HARD_DATA", name: "Paso 4: Datos Duros", isCurrent: true },
    ];

    const initiative: Initiative = {
      id,
      folio,
      organizationId,
      title: `Iniciativa Semilla ${folio}`,
      department: "Operaciones",
      program,
      state,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
      createdBy: ownerEmail,
      stateHistory: [
        {
          fromState: null,
          toState: state,
          actorEmail: ownerEmail,
          timestamp: now,
          notes: "Iniciativa sembrada para pruebas de dominio",
        },
      ],
      evidences: [],
      stageInstances: stages,
      mentorshipAssignments,
      activities: [],
      createdAt: now,
    };

    this.initiatives.set(id, initiative);
    return initiative;
  }

  public uploadEvidence(params: {
    actor: UserContext;
    initiativeId: string;
    fileName: string;
    contentHash: string;
  }): EvidenceRecord {
    const { actor, initiativeId, fileName, contentHash } = params;
    const initiative = this.getInitiative({ actor, initiativeId });
    const now = this.nowUtc();

    const nextVer = initiative.evidences.length + 1;
    const label = `Versión ${nextVer}.0`;

    const evidence: EvidenceRecord = {
      id: "ev-" + Math.random().toString(36).substring(2, 10),
      fileName,
      contentHash,
      versionNumber: nextVer,
      versionLabel: label,
      frozen: false,
      uploadedBy: actor.email,
      uploadedAt: now,
    };

    initiative.evidences.push(evidence);
    return evidence;
  }

  public listEvidenceVersions(params: {
    actor: UserContext;
    initiativeId: string;
  }): EvidenceRecord[] {
    const { actor, initiativeId } = params;
    const initiative = this.getInitiative({ actor, initiativeId });
    return [...initiative.evidences];
  }

  public submitForEvaluation(params: { actor: UserContext; initiativeId: string }): Initiative {
    const { actor, initiativeId } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    initiative.previousStateBeforeEvaluation = initiative.state;
    initiative.state = InitiativeState.POR_EVALUAR;
    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: initiative.previousStateBeforeEvaluation,
      toState: InitiativeState.POR_EVALUAR,
      actorEmail: actor.email,
      timestamp: now,
      notes: "Resultados enviados a evaluación técnica",
    });
    return initiative;
  }

  public returnForAdjustments(params: {
    actor: UserContext;
    initiativeId: string;
    feedbackComment: string;
  }): Initiative {
    const { actor, initiativeId, feedbackComment } = params;
    if (feedbackComment.trim().length < 20) {
      throw new InsufficientReturnFeedbackException(
        `El comentario de devolución debe tener al menos 20 caracteres (actual: ${feedbackComment.trim().length}).`
      );
    }

    const initiative = this.getInitiative({ actor, initiativeId });

    // Preserva estado objetivo original (ej. PENDIENTE_RESULTADOS)
    if (initiative.previousStateBeforeEvaluation) {
      initiative.returnTargetStateId = initiative.previousStateBeforeEvaluation;
    } else {
      initiative.returnTargetStateId = initiative.state;
    }

    const beforeState = initiative.state;
    initiative.state = InitiativeState.DEVUELTA_PARA_AJUSTES;

    // Congela versiones de evidencia activas
    for (const ev of initiative.evidences) {
      if (!ev.frozen) {
        ev.frozen = true;
        if (!ev.versionLabel.endsWith("(Devuelta)")) {
          ev.versionLabel = `${ev.versionLabel} (Devuelta)`;
        }
      }
    }

    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: InitiativeState.DEVUELTA_PARA_AJUSTES,
      actorEmail: actor.email,
      timestamp: now,
      notes: feedbackComment,
    });

    this.enqueueNotification(
      initiative.organizationId,
      initiative.id,
      "DELIVERABLE_RETURNED",
      initiative.createdBy,
      "HIGH",
      feedbackComment
    );

    return initiative;
  }

  public resumeFromAdjustments(params: { actor: UserContext; initiativeId: string }): Initiative {
    const { actor, initiativeId } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    if (initiative.state !== InitiativeState.DEVUELTA_PARA_AJUSTES) {
      throw new InvalidStateTransitionException(
        "La iniciativa no se encuentra en estado DEVUELTA_PARA_AJUSTES."
      );
    }

    const target = initiative.returnTargetStateId || InitiativeState.PENDIENTE_RESULTADOS;
    const beforeState = initiative.state;
    initiative.state = target;
    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: target,
      actorEmail: actor.email,
      timestamp: now,
      notes: "Reanudación tras solventar observaciones del mentor",
    });

    return initiative;
  }

  public registerImplementationPlan(params: {
    actor: UserContext;
    initiativeId: string;
    startDate: string;
    endDate: string;
    activities: string[];
  }): Initiative {
    const { actor, initiativeId, startDate, endDate, activities } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 56) {
      throw new MaxImplementationWindowExceededException(
        `El plan de ${diffDays} días excede el plazo máximo de 8 semanas (56 días).`
      );
    }

    initiative.activities = activities.map((act) => ({
      activity: act,
      start: startDate,
      end: endDate,
    }));

    return initiative;
  }

  public registerMentorProfile(params: {
    email: string;
    organizationId: string;
    isActive: boolean;
  }): MentorProfile {
    const { email, organizationId, isActive } = params;
    const profile: MentorProfile = { email, organizationId, isActive };
    this.mentorProfiles.set(email, profile);
    return profile;
  }

  public assignMentor(params: {
    actor: UserContext;
    initiativeId: string;
    mentorEmail: string;
  }): Initiative {
    const { actor, initiativeId, mentorEmail } = params;
    const initiative = this.getInitiative({ actor, initiativeId });
    const mentor = this.mentorProfiles.get(mentorEmail);

    if (!mentor || !mentor.isActive || mentor.organizationId !== initiative.organizationId) {
      throw new InvalidMentorAssignmentException(
        `El mentor '${mentorEmail}' no pertenece a la organización ${initiative.organizationId} o no está activo.`
      );
    }

    const now = this.nowUtc();
    initiative.mentorshipAssignments.push({
      mentorEmail,
      isActive: true,
      assignedAt: now,
    });

    const beforeState = initiative.state;
    initiative.state = InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION;
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
      actorEmail: actor.email,
      timestamp: now,
      notes: `Asignación de mentor: ${mentorEmail}`,
    });

    return initiative;
  }

  public getMentorInbox(params: { actor: UserContext }): Initiative[] {
    const { actor } = params;
    const results: Initiative[] = [];
    for (const init of this.initiatives.values()) {
      if (init.organizationId === actor.organizationId) {
        for (const ass of init.mentorshipAssignments) {
          if (ass.mentorEmail === actor.email && ass.isActive) {
            results.push(init);
            break;
          }
        }
      }
    }
    return results;
  }

  public approveEvaluation(params: {
    actor: UserContext;
    initiativeId: string;
    gemba5sCompleted: boolean;
    financeValidated: boolean;
  }): Initiative {
    const { actor, initiativeId, gemba5sCompleted, financeValidated } = params;

    if (actor.roles.includes(Role.TECH_ADMIN)) {
      throw new PrivilegeViolationException(
        "TECH_ADMIN no tiene permisos para evaluar o alterar contenido funcional."
      );
    }

    const initiative = this.getInitiative({ actor, initiativeId });

    if (!gemba5sCompleted || !financeValidated) {
      throw new EvaluationPrerequisitesNotMetException(
        "La evaluación K3 exige lista de verificación Gemba 5S y validación financiera."
      );
    }

    const beforeState = initiative.state;
    initiative.state = InitiativeState.POR_DOCUMENTAR;
    const now = this.nowUtc();
    initiative.stateHistory.push({
      fromState: beforeState,
      toState: InitiativeState.POR_DOCUMENTAR,
      actorEmail: actor.email,
      timestamp: now,
      notes: "Evaluación K3 aprobada por comité",
    });

    return initiative;
  }

  public calculateFinancialImpact(params: {
    annualGrossSavings: number;
    implementationOperationalCost: number;
    capexAmount?: number;
    sustainabilityFactor?: number;
  }): FinancialMetrics {
    const {
      annualGrossSavings,
      implementationOperationalCost,
      capexAmount = 0,
      sustainabilityFactor = 1.0,
    } = params;

    const netSavings = annualGrossSavings - implementationOperationalCost;
    const enterpriseValue = netSavings * sustainabilityFactor;
    const totalCost = implementationOperationalCost + capexAmount;
    const roiPercentage = totalCost > 0 ? (netSavings / totalCost) * 100 : 0;

    return {
      netAnnualSavings: netSavings,
      enterpriseValue,
      roiPercentage,
    };
  }

  public getNextActionCard(params: { actor: UserContext; initiativeId: string }): NextActionCard {
    const { actor, initiativeId } = params;
    const initiative = this.getInitiative({ actor, initiativeId });

    if (initiative.state === InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION) {
      return {
        actionTitle: "Registro de plan de implementación (máximo 56 días / 8 semanas)",
        responsibleRole: Role.LEADER,
        dueDate: null,
        isOverdue: false,
        ctaLabel: "Registrar Plan",
      };
    }

    return {
      actionTitle: `Acción requerida para estado ${initiative.state}`,
      responsibleRole: Role.LEADER,
      dueDate: null,
      isOverdue: false,
      ctaLabel: "Ver Detalle",
    };
  }

  public getAuditLogs(params: { organizationId: string; initiativeId?: string }): AuditLogRecord[] {
    const { organizationId, initiativeId } = params;
    return this.auditLogs.filter(
      (log) =>
        log.organizationId === organizationId &&
        (!initiativeId || log.initiativeId === initiativeId)
    );
  }

  public deleteOrMutateAuditLog(_params: { logId: string }): void {
    throw new AuditLogTamperingException("La bitácora de auditoría es estrictamente inmutable.");
  }

  public getOutboxNotifications(organizationId: string): NotificationRecord[] {
    return this.notifications.filter((n) => n.organizationId === organizationId);
  }

  public bulkSeedInitiatives(params: { organizationId: string; count: number }): void {
    const { organizationId, count } = params;
    const now = this.nowUtc();
    for (let i = 1; i <= count; i++) {
      const id = `bulk-${organizationId}-${i}`;
      const folio = `KIZ-2026-${String(i).padStart(4, "0")}`;
      const init: Initiative = {
        id,
        folio,
        organizationId,
        title: `Iniciativa masiva ${i}`,
        department: "Operaciones",
        program: ProgramType.K2,
        state: InitiativeState.EN_IMPLEMENTACION,
        zeroInvestmentConfirmed: true,
        capexAmount: 0,
        createdBy: "bulk.seed@empresa.com",
        stateHistory: [],
        evidences: [],
        stageInstances: [],
        mentorshipAssignments: [],
        activities: [],
        createdAt: now,
      };
      this.initiatives.set(id, init);
    }
  }

  public exportReportCXlsx(params: { actor: UserContext }): ReportResult {
    const { actor } = params;

    if (actor.roles.includes(Role.PROGRAM_COORDINATOR) && !actor.mfaVerified) {
      throw new MFARequiredException("La exportación de reportes requiere verificación MFA activa.");
    }

    const now = this.nowUtc();
    const rows: Array<Record<string, unknown>> = [];

    for (const init of this.initiatives.values()) {
      if (init.organizationId === actor.organizationId) {
        rows.push({
          folio: init.folio,
          title: init.title,
          organizationId: init.organizationId,
          department: init.department,
          state: init.state,
        });
      }
    }

    // Construcción rápida de XML para OpenXML / Excel (.xlsx)
    const textEncoder = new TextEncoder();
    const sheetXmlRows = rows.map((r, i) => {
      const rowIdx = i + 1;
      return `<row r="${rowIdx}"><c r="A${rowIdx}" t="inlineStr"><is><t>${r.folio}</t></is></c><c r="B${rowIdx}" t="inlineStr"><is><t>${r.title}</t></is></c><c r="C${rowIdx}" t="inlineStr"><is><t>${r.organizationId}</t></is></c><c r="D${rowIdx}" t="inlineStr"><is><t>${r.state}</t></is></c></row>`;
    });

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetXmlRows.join(
      ""
    )}</sheetData></worksheet>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="ReporteC" sheetId="1" r:id="rId1"/></sheets></workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;

    const zipBytes = createZipArchive([
      { path: "[Content_Types].xml", data: textEncoder.encode(contentTypesXml) },
      { path: "_rels/.rels", data: textEncoder.encode(relsXml) },
      { path: "xl/workbook.xml", data: textEncoder.encode(workbookXml) },
      { path: "xl/_rels/workbook.xml.rels", data: textEncoder.encode(workbookRelsXml) },
      { path: "xl/worksheets/sheet1.xml", data: textEncoder.encode(sheetXml) },
    ]);

    return {
      fileName: `Reporte_C_Seguimiento_${actor.organizationId}.xlsx`,
      totalRecords: rows.length,
      payloadBytes: zipBytes,
      organizationId: actor.organizationId,
      requestedBy: actor.email,
      generatedAtUtc: now,
      rows,
    };
  }

  public exportReportCsv(params: { actor: UserContext }): string {
    const { actor } = params;
    const lines: string[] = ["Folio,Titulo,Organizacion,Departamento,Estado"];
    for (const init of this.initiatives.values()) {
      if (init.organizationId === actor.organizationId) {
        lines.push(`"${init.folio}","${init.title}","${init.organizationId}","${init.department}","${init.state}"`);
      }
    }
    return lines.join("\n");
  }
}

export * from "./mobileUxEngine";

