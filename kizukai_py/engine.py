"""Motor de Dominio Kizukai Project Hub (Python).

Implementa las reglas de negocio, ciclo de vida de 12 estados, 6 etapas,
control multi-tenant, bitácora inmutable de auditoría y reportes.
"""

from __future__ import annotations

import io
import time
import uuid
import zipfile
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


# ============================================================================
# ENUMS
# ============================================================================

class InitiativeState(str, Enum):
    BORRADOR = "BORRADOR"
    POR_APROBAR = "POR_APROBAR"
    PENDIENTE_ASIGNACION_MENTOR = "PENDIENTE_ASIGNACION_MENTOR"
    PENDIENTE_PLAN_IMPLEMENTACION = "PENDIENTE_PLAN_IMPLEMENTACION"
    EN_IMPLEMENTACION = "EN_IMPLEMENTACION"
    PENDIENTE_RESULTADOS = "PENDIENTE_RESULTADOS"
    POR_EVALUAR = "POR_EVALUAR"
    POR_DOCUMENTAR = "POR_DOCUMENTAR"
    FINALIZADA = "FINALIZADA"
    DEVUELTA_PARA_AJUSTES = "DEVUELTA_PARA_AJUSTES"
    RECHAZADA = "RECHAZADA"
    CANCELADA = "CANCELADA"


class ProgramType(str, Enum):
    K0 = "K0"
    K1 = "K1"
    K2 = "K2"
    K3 = "K3"


class Role(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    LEADER = "LEADER"
    MENTOR = "MENTOR"
    PROGRAM_COORDINATOR = "PROGRAM_COORDINATOR"
    EVALUATOR = "EVALUATOR"
    TECH_ADMIN = "TECH_ADMIN"
    CONSULTANT = "CONSULTANT"


# ============================================================================
# EXCEPCIONES DE DOMINIO
# ============================================================================

class KizukaiDomainException(Exception):
    """Excepción base del dominio Kizukai."""


class InvalidStateTransitionException(KizukaiDomainException):
    """Transición de estado ilegal en el ciclo de vida de la iniciativa."""


class CrossTenantAccessDeniedException(KizukaiDomainException):
    """Acceso denegado por violación de aislamiento Multi-Tenant."""


class ZeroInvestmentRequiredException(KizukaiDomainException):
    """La iniciativa K2 exige confirmar explícitamente Cero Inversión económica."""


class MaxImplementationWindowExceededException(KizukaiDomainException):
    """El plan de implementación excede el límite improrrogable de 8 semanas (56 días)."""


class InsufficientReturnFeedbackException(KizukaiDomainException):
    """El comentario técnico de devolución requiere un mínimo de 20 caracteres."""


class InvalidMentorAssignmentException(KizukaiDomainException):
    """El mentor no pertenece a la misma organización o está inactivo."""


class EvaluationPrerequisitesNotMetException(KizukaiDomainException):
    """No cumple los prerequisitos de auditoría Gemba 5S o validación financiera."""


class DuplicateInitiativeException(KizukaiDomainException):
    """Ya existe una iniciativa con el mismo título, departamento y programa en la organización."""


class PrivilegeViolationException(KizukaiDomainException):
    """El rol no tiene autorización para realizar operaciones funcionales u operativas."""


class MFARequiredException(KizukaiDomainException):
    """Operación restringida que exige verificación multifactor (MFA)."""


class AuditLogTamperingException(KizukaiDomainException):
    """Intento de mutación o borrado de la bitácora inmutable de auditoría."""


# ============================================================================
# ENTIDADES Y REGISTROS
# ============================================================================

@dataclass
class UserContext:
    user_id: str
    email: str
    organization_id: str
    roles: List[Role] = field(default_factory=list)
    mfa_verified: bool = False


@dataclass
class StateTransitionRecord:
    from_state: Optional[InitiativeState]
    to_state: InitiativeState
    actor_email: str
    timestamp: str
    notes: Optional[str] = None


@dataclass
class EvidenceRecord:
    id: str
    file_name: str
    content_hash: str
    version_number: int
    version_label: str
    frozen: bool = False
    uploaded_by: str = ""
    uploaded_at: str = ""


@dataclass
class MentorshipAssignmentRecord:
    mentor_email: str
    is_active: bool = True
    assigned_at: str = ""


@dataclass
class StageInstanceRecord:
    stage_id: str
    name: str = ""
    is_current: bool = True


@dataclass
class AuditLogRecord:
    id: str
    organization_id: str
    initiative_id: Optional[str]
    action: str
    before_snapshot: Dict[str, Any]
    after_snapshot: Dict[str, Any]
    timestamp: str


@dataclass
class NotificationRecord:
    id: str
    organization_id: str
    initiative_id: Optional[str]
    event_type: str
    priority: str = "NORMAL"
    recipient_email: str = ""
    message: str = ""
    created_at: str = ""


@dataclass
class FinancialMetrics:
    net_annual_savings: float
    enterprise_value: float
    roi_percentage: float


@dataclass
class NextActionCard:
    action_title: str
    responsible_role: Role
    due_date: Optional[str] = None
    is_overdue: bool = False
    cta_label: str = ""


@dataclass
class ReportResult:
    file_name: str
    total_records: int
    payload_bytes: bytes
    organization_id: str
    requested_by: str
    generated_at_utc: str
    rows: List[Dict[str, Any]]


@dataclass
class Initiative:
    id: str
    organization_id: str
    title: str
    department: str
    program: ProgramType
    state: InitiativeState
    zero_investment_confirmed: bool
    capex_amount: float
    created_by: str
    folio: str = ""
    return_target_state_id: Optional[InitiativeState] = None
    previous_state_before_evaluation: Optional[InitiativeState] = None
    state_history: List[StateTransitionRecord] = field(default_factory=list)
    evidences: List[EvidenceRecord] = field(default_factory=list)
    stage_instances: List[StageInstanceRecord] = field(default_factory=list)
    mentorship_assignments: List[MentorshipAssignmentRecord] = field(default_factory=list)
    activities: List[Dict[str, Any]] = field(default_factory=list)
    created_at: str = ""


@dataclass
class MentorProfile:
    email: str
    organization_id: str
    is_active: bool = True


# ============================================================================
# MOTOR DE DOMINIO KIZUKAI
# ============================================================================

class KizukaiEngine:
    """Motor de dominio central para la gestión del ciclo de vida Kizukai."""

    def __init__(self) -> None:
        self._initiatives: Dict[str, Initiative] = {}
        self._mentor_profiles: Dict[str, MentorProfile] = {}
        self._audit_logs: List[AuditLogRecord] = []
        self._notifications: List[NotificationRecord] = []
        self._folio_counters: Dict[str, int] = {}

    def _now_utc(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _next_folio(self, organization_id: str) -> str:
        current = self._folio_counters.get(organization_id, 0) + 1
        self._folio_counters[organization_id] = current
        return f"KIZ-2026-{current:04d}"

    def _check_tenant(self, actor: UserContext, resource_org_id: str) -> None:
        # Consultores o superadmins globales pueden ver otros tenants si aplica,
        # pero en aislamiento estándar de tenant debe coincidir la org.
        if Role.CONSULTANT in actor.roles:
            return
        if actor.organization_id != resource_org_id:
            raise CrossTenantAccessDeniedException(
                f"El usuario de {actor.organization_id} no puede acceder a recursos de {resource_org_id}."
            )

    def _record_audit(
        self,
        organization_id: str,
        initiative_id: Optional[str],
        action: str,
        before_snapshot: Dict[str, Any],
        after_snapshot: Dict[str, Any],
    ) -> AuditLogRecord:
        record = AuditLogRecord(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            initiative_id=initiative_id,
            action=action,
            before_snapshot=before_snapshot,
            after_snapshot=after_snapshot,
            timestamp=self._now_utc(),
        )
        self._audit_logs.append(record)
        return record

    def _enqueue_notification(
        self,
        organization_id: str,
        initiative_id: Optional[str],
        event_type: str,
        recipient_email: str,
        priority: str = "NORMAL",
        message: str = "",
    ) -> NotificationRecord:
        notif = NotificationRecord(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            initiative_id=initiative_id,
            event_type=event_type,
            priority=priority,
            recipient_email=recipient_email,
            message=message,
            created_at=self._now_utc(),
        )
        self._notifications.append(notif)
        return notif

    # ------------------------------------------------------------------------
    # Casos de uso de Iniciativa
    # ------------------------------------------------------------------------

    def create_initiative(
        self,
        actor: UserContext,
        title: str,
        department: str,
        program: ProgramType,
        zero_investment_confirmed: bool,
        capex_amount: float = 0.0,
    ) -> Initiative:
        # Validación de Cero Inversión para K2
        if program == ProgramType.K2:
            if not zero_investment_confirmed or capex_amount > 0:
                raise ZeroInvestmentRequiredException(
                    "La metodología Kizukai K2 exige Cero Inversión económica (CAPEX = 0)."
                )

        # Chequeo de duplicados por título normalizado, departamento y programa dentro del tenant
        norm_title = " ".join(title.strip().lower().split())
        norm_dept = " ".join(department.strip().lower().split())
        for init in self._initiatives.values():
            if init.organization_id == actor.organization_id and init.program == program:
                if (
                    " ".join(init.title.strip().lower().split()) == norm_title
                    and " ".join(init.department.strip().lower().split()) == norm_dept
                ):
                    raise DuplicateInitiativeException(
                        f"Ya existe la iniciativa '{title}' en el departamento '{department}'."
                    )

        now = self._now_utc()
        init_id = str(uuid.uuid4())
        initial_history = [
            StateTransitionRecord(
                from_state=None,
                to_state=InitiativeState.BORRADOR,
                actor_email=actor.email,
                timestamp=now,
                notes="Creación de iniciativa en estado borrador",
            )
        ]
        initial_stages = [
            StageInstanceRecord(stage_id="STAGE_1_FILTER", name="Paso 1: Filtro Técnico", is_current=True)
        ]

        initiative = Initiative(
            id=init_id,
            organization_id=actor.organization_id,
            title=title.strip(),
            department=department.strip(),
            program=program,
            state=InitiativeState.BORRADOR,
            zero_investment_confirmed=zero_investment_confirmed,
            capex_amount=capex_amount,
            created_by=actor.email,
            folio="",
            state_history=initial_history,
            stage_instances=initial_stages,
            created_at=now,
        )

        self._initiatives[init_id] = initiative

        self._record_audit(
            organization_id=actor.organization_id,
            initiative_id=init_id,
            action="CREATE_INITIATIVE",
            before_snapshot={"state": None},
            after_snapshot={"state": InitiativeState.BORRADOR.value, "title": initiative.title},
        )

        return initiative

    def get_initiative(self, actor: UserContext, initiative_id: str) -> Initiative:
        initiative = self._initiatives.get(initiative_id)
        if not initiative:
            raise KeyError(f"Iniciativa {initiative_id} no encontrada.")
        self._check_tenant(actor, initiative.organization_id)
        return initiative

    def submit_for_approval(self, actor: UserContext, initiative_id: str) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        if initiative.state != InitiativeState.BORRADOR:
            raise InvalidStateTransitionException(
                f"No se puede enviar a aprobación desde el estado {initiative.state}."
            )

        before_state = initiative.state
        if not initiative.folio:
            initiative.folio = self._next_folio(initiative.organization_id)

        initiative.state = InitiativeState.POR_APROBAR
        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=InitiativeState.POR_APROBAR,
                actor_email=actor.email,
                timestamp=now,
                notes="Envío de iniciativa a filtro técnico",
            )
        )

        self._record_audit(
            organization_id=initiative.organization_id,
            initiative_id=initiative.id,
            action="SUBMIT_FOR_APPROVAL",
            before_snapshot={"state": before_state.value},
            after_snapshot={"state": InitiativeState.POR_APROBAR.value, "folio": initiative.folio},
        )

        self._enqueue_notification(
            organization_id=initiative.organization_id,
            initiative_id=initiative.id,
            event_type="INITIATIVE_SUBMITTED",
            recipient_email=initiative.created_by,
            priority="NORMAL",
            message=f"Iniciativa {initiative.folio} enviada a revisión técnica.",
        )

        return initiative

    def transition_state(
        self,
        actor: UserContext,
        initiative_id: str,
        target_state: InitiativeState,
        notes: Optional[str] = None,
    ) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        allowed_transitions = {
            InitiativeState.BORRADOR: {InitiativeState.POR_APROBAR, InitiativeState.CANCELADA},
            InitiativeState.POR_APROBAR: {
                InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
                InitiativeState.RECHAZADA,
                InitiativeState.CANCELADA,
                InitiativeState.DEVUELTA_PARA_AJUSTES,
            },
            InitiativeState.PENDIENTE_ASIGNACION_MENTOR: {
                InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
                InitiativeState.CANCELADA,
            },
            InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION: {
                InitiativeState.EN_IMPLEMENTACION,
                InitiativeState.DEVUELTA_PARA_AJUSTES,
                InitiativeState.CANCELADA,
            },
            InitiativeState.EN_IMPLEMENTACION: {
                InitiativeState.PENDIENTE_RESULTADOS,
                InitiativeState.CANCELADA,
            },
            InitiativeState.PENDIENTE_RESULTADOS: {
                InitiativeState.POR_EVALUAR,
                InitiativeState.DEVUELTA_PARA_AJUSTES,
                InitiativeState.CANCELADA,
            },
            InitiativeState.POR_EVALUAR: {
                InitiativeState.POR_DOCUMENTAR,
                InitiativeState.DEVUELTA_PARA_AJUSTES,
                InitiativeState.RECHAZADA,
                InitiativeState.CANCELADA,
            },
            InitiativeState.POR_DOCUMENTAR: {
                InitiativeState.FINALIZADA,
                InitiativeState.DEVUELTA_PARA_AJUSTES,
                InitiativeState.CANCELADA,
            },
            InitiativeState.DEVUELTA_PARA_AJUSTES: {
                initiative.return_target_state_id or InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
                InitiativeState.CANCELADA,
            },
        }

        valid_targets = allowed_transitions.get(initiative.state, set())
        if target_state not in valid_targets:
            raise InvalidStateTransitionException(
                f"Transición ilegal de '{initiative.state.value}' a '{target_state.value}'."
            )

        before_state = initiative.state
        initiative.state = target_state
        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=target_state,
                actor_email=actor.email,
                timestamp=now,
                notes=notes,
            )
        )

        self._record_audit(
            organization_id=initiative.organization_id,
            initiative_id=initiative.id,
            action="STATE_TRANSITION",
            before_snapshot={"state": before_state.value},
            after_snapshot={"state": target_state.value},
        )

        return initiative

    def seed_initiative_in_state(
        self,
        organization_id: str,
        folio: str,
        state: InitiativeState,
        owner_email: str,
        mentor_email: Optional[str] = None,
        program: ProgramType = ProgramType.K2,
    ) -> Initiative:
        init_id = str(uuid.uuid4())
        now = self._now_utc()
        mentorship = []
        if mentor_email:
            mentorship.append(
                MentorshipAssignmentRecord(
                    mentor_email=mentor_email,
                    is_active=True,
                    assigned_at=now,
                )
            )

        stages = [
            StageInstanceRecord(stage_id="STAGE_1_FILTER", name="Paso 1: Filtro Técnico", is_current=False),
            StageInstanceRecord(stage_id="STAGE_2_LEADERSHIP", name="Paso 2: Liderazgo", is_current=False),
            StageInstanceRecord(stage_id="STAGE_3_GEMBA", name="Paso 3: Gemba", is_current=False),
            StageInstanceRecord(stage_id="STAGE_4_HARD_DATA", name="Paso 4: Datos Duros", is_current=True),
        ]

        initiative = Initiative(
            id=init_id,
            organization_id=organization_id,
            folio=folio,
            title=f"Iniciativa Semilla {folio}",
            department="Operaciones",
            program=program,
            state=state,
            zero_investment_confirmed=True,
            capex_amount=0.0,
            created_by=owner_email,
            state_history=[
                StateTransitionRecord(
                    from_state=None,
                    to_state=state,
                    actor_email=owner_email,
                    timestamp=now,
                    notes="Iniciativa sembrada para pruebas de dominio",
                )
            ],
            stage_instances=stages,
            mentorship_assignments=mentorship,
            created_at=now,
        )

        self._initiatives[init_id] = initiative
        return initiative

    def upload_evidence(
        self,
        actor: UserContext,
        initiative_id: str,
        file_name: str,
        content_hash: str,
    ) -> EvidenceRecord:
        initiative = self.get_initiative(actor, initiative_id)
        now = self._now_utc()

        next_version_num = len(initiative.evidences) + 1
        label = f"Versión {next_version_num}.0"

        evidence = EvidenceRecord(
            id=str(uuid.uuid4()),
            file_name=file_name,
            content_hash=content_hash,
            version_number=next_version_num,
            version_label=label,
            frozen=False,
            uploaded_by=actor.email,
            uploaded_at=now,
        )

        initiative.evidences.append(evidence)
        return evidence

    def list_evidence_versions(self, actor: UserContext, initiative_id: str) -> List[EvidenceRecord]:
        initiative = self.get_initiative(actor, initiative_id)
        return list(initiative.evidences)

    def submit_for_evaluation(self, actor: UserContext, initiative_id: str) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        initiative.previous_state_before_evaluation = initiative.state
        initiative.state = InitiativeState.POR_EVALUAR
        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=initiative.previous_state_before_evaluation,
                to_state=InitiativeState.POR_EVALUAR,
                actor_email=actor.email,
                timestamp=now,
                notes="Envío de resultados y evidencias a evaluación",
            )
        )
        return initiative

    def return_for_adjustments(
        self,
        actor: UserContext,
        initiative_id: str,
        feedback_comment: str,
    ) -> Initiative:
        if len(feedback_comment.strip()) < 20:
            raise InsufficientReturnFeedbackException(
                f"El comentario de devolución debe contener al menos 20 caracteres (longitud actual: {len(feedback_comment.strip())})."
            )

        initiative = self.get_initiative(actor, initiative_id)

        # Guarda estado objetivo de retorno (el estado anterior a evaluación o el estado de procedencia)
        if initiative.previous_state_before_evaluation:
            initiative.return_target_state_id = initiative.previous_state_before_evaluation
        else:
            initiative.return_target_state_id = initiative.state

        before_state = initiative.state
        initiative.state = InitiativeState.DEVUELTA_PARA_AJUSTES

        # Congelar evidencias previas y marcar como (Devuelta)
        for ev in initiative.evidences:
            if not ev.frozen:
                ev.frozen = True
                if not ev.version_label.endswith("(Devuelta)"):
                    ev.version_label = f"{ev.version_label} (Devuelta)"

        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=InitiativeState.DEVUELTA_PARA_AJUSTES,
                actor_email=actor.email,
                timestamp=now,
                notes=feedback_comment,
            )
        )

        self._enqueue_notification(
            organization_id=initiative.organization_id,
            initiative_id=initiative.id,
            event_type="DELIVERABLE_RETURNED",
            recipient_email=initiative.created_by,
            priority="HIGH",
            message=feedback_comment,
        )

        return initiative

    def resume_from_adjustments(self, actor: UserContext, initiative_id: str) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        if initiative.state != InitiativeState.DEVUELTA_PARA_AJUSTES:
            raise InvalidStateTransitionException("La iniciativa no está en estado DEVUELTA_PARA_AJUSTES.")

        target = initiative.return_target_state_id or InitiativeState.PENDIENTE_RESULTADOS
        before_state = initiative.state
        initiative.state = target
        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=target,
                actor_email=actor.email,
                timestamp=now,
                notes="Reanudación tras subsanar observaciones",
            )
        )
        return initiative

    def register_implementation_plan(
        self,
        actor: UserContext,
        initiative_id: str,
        start_date: date,
        end_date: date,
        activities: List[str],
    ) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        diff_days = (end_date - start_date).days
        if diff_days > 56:
            raise MaxImplementationWindowExceededException(
                f"El plan de {diff_days} días excede el plazo máximo de 8 semanas (56 días)."
            )

        initiative.activities = [
            {"activity": act, "start": str(start_date), "end": str(end_date)}
            for act in activities
        ]
        return initiative

    def register_mentor_profile(
        self,
        email: str,
        organization_id: str,
        is_active: bool = True,
    ) -> MentorProfile:
        profile = MentorProfile(email=email, organization_id=organization_id, is_active=is_active)
        self._mentor_profiles[email] = profile
        return profile

    def assign_mentor(
        self,
        actor: UserContext,
        initiative_id: str,
        mentor_email: str,
    ) -> Initiative:
        initiative = self.get_initiative(actor, initiative_id)
        mentor = self._mentor_profiles.get(mentor_email)
        if not mentor or not mentor.is_active or mentor.organization_id != initiative.organization_id:
            raise InvalidMentorAssignmentException(
                f"Mentor '{mentor_email}' inválido o no pertenece a la organización {initiative.organization_id}."
            )

        now = self._now_utc()
        initiative.mentorship_assignments.append(
            MentorshipAssignmentRecord(mentor_email=mentor_email, is_active=True, assigned_at=now)
        )
        before_state = initiative.state
        initiative.state = InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
                actor_email=actor.email,
                timestamp=now,
                notes=f"Asignación de mentor: {mentor_email}",
            )
        )
        return initiative

    def get_mentor_inbox(self, actor: UserContext) -> List[Initiative]:
        results = []
        for init in self._initiatives.values():
            if init.organization_id == actor.organization_id:
                for assignment in init.mentorship_assignments:
                    if assignment.mentor_email == actor.email and assignment.is_active:
                        results.append(init)
                        break
        return results

    def approve_evaluation(
        self,
        actor: UserContext,
        initiative_id: str,
        gemba_5s_completed: bool,
        finance_validated: bool,
    ) -> Initiative:
        # Tech admin no puede evaluar
        if Role.TECH_ADMIN in actor.roles:
            raise PrivilegeViolationException("TECH_ADMIN no tiene permisos para aprobar evaluaciones.")

        initiative = self.get_initiative(actor, initiative_id)

        # Regla K3: Gemba 5S y validación de finanzas
        if not gemba_5s_completed or not finance_validated:
            raise EvaluationPrerequisitesNotMetException(
                "La evaluación K3 exige checklist Gemba 5S completado y validación de finanzas."
            )

        before_state = initiative.state
        initiative.state = InitiativeState.POR_DOCUMENTAR
        now = self._now_utc()
        initiative.state_history.append(
            StateTransitionRecord(
                from_state=before_state,
                to_state=InitiativeState.POR_DOCUMENTAR,
                actor_email=actor.email,
                timestamp=now,
                notes="Evaluación K3 aprobada satisfactoriamente",
            )
        )
        return initiative

    def calculate_financial_impact(
        self,
        annual_gross_savings: float,
        implementation_operational_cost: float,
        capex_amount: float = 0.0,
        sustainability_factor: float = 1.0,
    ) -> FinancialMetrics:
        net_savings = annual_gross_savings - implementation_operational_cost
        enterprise_val = net_savings * sustainability_factor
        total_inv = implementation_operational_cost + capex_amount
        roi = (net_savings / total_inv * 100.0) if total_inv > 0 else 0.0
        return FinancialMetrics(
            net_annual_savings=net_savings,
            enterprise_value=enterprise_val,
            roi_percentage=roi,
        )

    def get_next_required_action_card(self, actor: UserContext, initiative_id: str) -> NextActionCard:
        initiative = self.get_initiative(actor, initiative_id)
        if initiative.state == InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION:
            return NextActionCard(
                action_title="Registro de plan de implementación (máximo 56 días / 8 semanas)",
                responsible_role=Role.LEADER,
                due_date=None,
                is_overdue=False,
                cta_label="Registrar Plan",
            )
        return NextActionCard(
            action_title=f"Acción pendiente para estado {initiative.state.value}",
            responsible_role=Role.LEADER,
            due_date=None,
            is_overdue=False,
            cta_label="Ver Detalle",
        )

    def get_audit_logs(self, organization_id: str, initiative_id: Optional[str] = None) -> List[AuditLogRecord]:
        return [
            log for log in self._audit_logs
            if log.organization_id == organization_id
            and (initiative_id is None or log.initiative_id == initiative_id)
        ]

    def delete_or_mutate_audit_log(self, log_id: str) -> None:
        raise AuditLogTamperingException("La bitácora de auditoría es estrictamente inmutable.")

    def get_outbox_notifications(self, organization_id: str) -> List[NotificationRecord]:
        return [n for n in self._notifications if n.organization_id == organization_id]

    def bulk_seed_initiatives(self, organization_id: str, count: int) -> None:
        now = self._now_utc()
        for i in range(1, count + 1):
            init_id = f"bulk-{organization_id}-{i}"
            folio = f"KIZ-2026-{i:04d}"
            init = Initiative(
                id=init_id,
                organization_id=organization_id,
                title=f"Iniciativa masiva {i}",
                department="Operaciones",
                program=ProgramType.K2,
                state=InitiativeState.EN_IMPLEMENTACION,
                zero_investment_confirmed=True,
                capex_amount=0.0,
                created_by="bulk.seed@empresa.com",
                folio=folio,
                created_at=now,
            )
            self._initiatives[init_id] = init

    def export_report_c_xlsx(self, actor: UserContext) -> ReportResult:
        # Exige MFA a coordinadores
        if Role.PROGRAM_COORDINATOR in actor.roles and not actor.mfa_verified:
            raise MFARequiredException("La exportación de reportes requiere MFA activo para coordinadores.")

        now = self._now_utc()
        filtered = [
            init for init in self._initiatives.values()
            if init.organization_id == actor.organization_id
        ]

        rows = [
            {
                "folio": init.folio,
                "title": init.title,
                "organization_id": init.organization_id,
                "department": init.department,
                "state": init.state.value,
            }
            for init in filtered
        ]

        # Generador de archivo OOXML (.xlsx) ultrarrápido en memoria
        sheet_rows = [
            f"<row r=\"{idx+1}\"><c r=\"A{idx+1}\" t=\"inlineStr\"><is><t>{row['folio']}</t></is></c>"
            f"<c r=\"B{idx+1}\" t=\"inlineStr\"><is><t>{row['title']}</t></is></c>"
            f"<c r=\"C{idx+1}\" t=\"inlineStr\"><is><t>{row['organization_id']}</t></is></c>"
            f"<c r=\"D{idx+1}\" t=\"inlineStr\"><is><t>{row['state']}</t></is></c></row>"
            for idx, row in enumerate(rows)
        ]
        sheet_xml = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">"
            "<sheetData>" + "".join(sheet_rows) + "</sheetData></worksheet>"
        )

        content_types = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
            "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
            "</Types>"
        )

        rels = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
            "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>"
            "</Relationships>"
        )

        workbook = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" "
            "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">"
            "<sheets><sheet name=\"ReporteC\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>"
        )

        workbook_rels = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
            "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>"
            "</Relationships>"
        )

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_STORED) as zf:
            zf.writestr("[Content_Types].xml", content_types)
            zf.writestr("_rels/.rels", rels)
            zf.writestr("xl/workbook.xml", workbook)
            zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
            zf.writestr("xl/worksheets/sheet1.xml", sheet_xml)

        payload = buf.getvalue()

        return ReportResult(
            file_name=f"Reporte_C_Seguimiento_{actor.organization_id}.xlsx",
            total_records=len(filtered),
            payload_bytes=payload,
            organization_id=actor.organization_id,
            requested_by=actor.email,
            generated_at_utc=now,
            rows=rows,
        )


# ============================================================================
# MOTOR DETERMINISTA DE EXPERIENCIA MÓVIL POR ROL (CA-MOB-01 A CA-MOB-05)
# ============================================================================


@dataclass
class ViewportClassification:
    mode: str
    isMobile: bool
    isTablet: bool
    isDesktop: bool
    showBottomNav: bool
    useBottomSheetModals: bool
    useCardTables: bool


@dataclass
class MobileRoleProfile:
    role: str
    modeTitle: str
    subtitle: str
    primaryCtaLabel: str
    quickPills: List[str]
    allowQuickCardActions: bool
    bottomNavItems: List[Dict[str, str]]


@dataclass
class MobileWizardValidationResult:
    valid: bool
    step: int
    errors: List[str]
    canAdvance: bool


@dataclass
class MobileQuickActionDescriptor:
    actionCode: str
    label: str
    requiresConfirmationSheet: bool
    isAvailable: bool
    thumbZonePriority: str


def _normalize_mobile_role(role: Any) -> str:
    val = role.value if isinstance(role, Enum) else str(role)
    if val in ("PARTICIPANT", "EMPLOYEE", "LEADER"):
        return "PARTICIPANT"
    if val in ("MENTOR", "EVALUATOR"):
        return "MENTOR"
    if val in ("COORDINATOR", "PROGRAM_COORDINATOR"):
        return "COORDINATOR"
    if val == "CONSULTANT":
        return "CONSULTANT"
    if val == "TECH_ADMIN":
        return "TECH_ADMIN"
    return "PARTICIPANT"


def classify_viewport(width: int) -> ViewportClassification:
    """CA-MOB-01: Clasifica el viewport garantizando intangibilidad en Desktop (>= 1024px)."""
    safe_width = width if isinstance(width, (int, float)) and width > 0 else 1280
    if safe_width < 768:
        return ViewportClassification(
            mode="MOBILE",
            isMobile=True,
            isTablet=False,
            isDesktop=False,
            showBottomNav=True,
            useBottomSheetModals=True,
            useCardTables=True,
        )
    if safe_width < 1024:
        return ViewportClassification(
            mode="TABLET",
            isMobile=False,
            isTablet=True,
            isDesktop=False,
            showBottomNav=True,
            useBottomSheetModals=True,
            useCardTables=True,
        )
    return ViewportClassification(
        mode="DESKTOP",
        isMobile=False,
        isTablet=False,
        isDesktop=True,
        showBottomNav=False,
        useBottomSheetModals=False,
        useCardTables=False,
    )


def get_mobile_role_profile(role: Any) -> MobileRoleProfile:
    """CA-MOB-02: Configuración simplificada de la vista móvil para cada uno de los 5 roles."""
    canonical = _normalize_mobile_role(role)
    if canonical == "PARTICIPANT":
        return MobileRoleProfile(
            role="PARTICIPANT",
            modeTitle="Modo Gemba Express",
            subtitle="Captura rápida K2 Cero Inversión y seguimiento de mis mejoras en piso",
            primaryCtaLabel="+ Nueva Idea K2 (3 Pasos)",
            quickPills=[" Requieren Ajuste", "En Implementación", "Borradores", "Finalizadas"],
            allowQuickCardActions=True,
            bottomNavItems=[
                {"id": "INBOX", "label": "Mis Ideas"},
                {"id": "NEW_IDEA", "label": "+ Capturar K2"},
                {"id": "WORKSPACE", "label": "Espacio"},
                {"id": "PROFILE", "label": "Rol"},
            ],
        )
    if canonical == "MENTOR":
        return MobileRoleProfile(
            role="MENTOR",
            modeTitle="Modo Gemba Walk & 5S",
            subtitle="Auditoría en sitio, validación de planes <= 8 semanas y dictamen K3",
            primaryCtaLabel="Evaluar Entregable / 5S",
            quickPills=["Por Evaluar K3", "Validar Plan 8 Sem", "Próximas a Vencer", "Todas"],
            allowQuickCardActions=True,
            bottomNavItems=[
                {"id": "INBOX", "label": "Por Evaluar"},
                {"id": "WORKSPACE", "label": "Auditoría 5S"},
                {"id": "REPORTS", "label": "Métricas"},
                {"id": "PROFILE", "label": "Rol"},
            ],
        )
    if canonical == "COORDINATOR":
        return MobileRoleProfile(
            role="COORDINATOR",
            modeTitle="Modo Triage & Asignación",
            subtitle="Filtro técnico Cero Inversión de 1 toque y asignación ágil de mentores",
            primaryCtaLabel="Triage de Bandeja",
            quickPills=["Filtro Técnico (Por Aprobar)", "Sin Mentor", "Por Documentar POE", "Alerta > 7d"],
            allowQuickCardActions=True,
            bottomNavItems=[
                {"id": "INBOX", "label": "Triage"},
                {"id": "WORKSPACE", "label": "Asignar"},
                {"id": "REPORTS", "label": "Reportes"},
                {"id": "PROFILE", "label": "Rol"},
            ],
        )
    if canonical == "CONSULTANT":
        return MobileRoleProfile(
            role="CONSULTANT",
            modeTitle="Modo Pulso Ejecutivo",
            subtitle="Supervisión multiempresa, ahorros K3 validados y exportación móvil",
            primaryCtaLabel="Exportar Sabana C (.xlsx)",
            quickPills=["Consolidado Global", "Top Prácticas K3", "Por Documentar POE", "En Riesgo"],
            allowQuickCardActions=True,
            bottomNavItems=[
                {"id": "INBOX", "label": "Portafolio"},
                {"id": "REPORTS", "label": "Sabana .XLSX"},
                {"id": "WORKSPACE", "label": "Detalle"},
                {"id": "PROFILE", "label": "Rol"},
            ],
        )
    return MobileRoleProfile(
        role="TECH_ADMIN",
        modeTitle="Modo Pocket Control & RBAC",
        subtitle="Gobernanza Multi-Tenant, verificación MFA y auditoría sin acceso a contenido",
        primaryCtaLabel="Verificar Estado MFA & Tenants",
        quickPills=[" Estado MFA", "Aislamiento Tenant", "Logs Inmutables"],
        allowQuickCardActions=False,
        bottomNavItems=[
            {"id": "INBOX", "label": "Seguridad"},
            {"id": "REPORTS", "label": "Auditoría"},
            {"id": "PROFILE", "label": "Rol"},
        ],
    )


def validate_mobile_wizard_step(step: int, payload: Dict[str, Any]) -> MobileWizardValidationResult:
    """CA-MOB-03: Valida paso a paso el wizard móvil de 3 pasos para crear iniciativas K2."""
    errors: List[str] = []
    if step == 1:
        if len(str(payload.get("title", "")).strip()) < 5:
            errors.append("El título de la mejora requiere al menos 5 caracteres.")
        if not str(payload.get("department", "")).strip():
            errors.append("Selecciona el departamento o área operativa.")
        if not str(payload.get("guideline", "")).strip():
            errors.append("Selecciona la directriz estratégica de impacto.")
    elif step == 2:
        if len(str(payload.get("k0_deficient", "")).strip()) < 10:
            errors.append("Describe la situación deficiente actual (K0) con al menos 10 caracteres.")
        if len(str(payload.get("k1_basic_function", "")).strip()) < 5:
            errors.append("Especifica la condición básica (K1) con al menos 5 caracteres.")
        if len(str(payload.get("k2_proactivity", "")).strip()) < 10:
            errors.append("Detalla la mejora creativa Cero Inversión (K2) con al menos 10 caracteres.")
    elif step == 3:
        if len(str(payload.get("k3_expected_impact", "")).strip()) < 5:
            errors.append("Indica el beneficio esperado (K3) con al menos 5 caracteres.")
        if not payload.get("asDraft", False) and payload.get("zero_investment_verified") is not True:
            errors.append("Debes confirmar explícitamente que la propuesta K2 cumple Cero Inversión (CAPEX = $0).")

    return MobileWizardValidationResult(
        valid=len(errors) == 0,
        step=step,
        errors=errors,
        canAdvance=len(errors) == 0,
    )


def get_mobile_quick_action_for_initiative(role: Any, state: Any) -> MobileQuickActionDescriptor:
    """CA-MOB-04: Retorna la acción rápida de 1 toque para tarjetas móviles y Sticky Thumb-Zone Action Bar."""
    canonical = _normalize_mobile_role(role)
    st = state.value if isinstance(state, Enum) else str(state)

    if canonical == "TECH_ADMIN":
        return MobileQuickActionDescriptor(
            actionCode="NINGUNA_ACCION_OPERATIVA",
            label="Bloqueado por RBAC (Solo Metadatos)",
            requiresConfirmationSheet=False,
            isAvailable=False,
            thumbZonePriority="READ_ONLY",
        )

    if canonical == "PARTICIPANT":
        if st == "BORRADOR":
            return MobileQuickActionDescriptor(
                actionCode="ENVIAR_A_REVISION_RAPIDA",
                label="Enviar Idea a Revisión",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "DEVUELTA_PARA_AJUSTES":
            return MobileQuickActionDescriptor(
                actionCode="REMITIR_CORRECCION_RAPIDA",
                label="Subir Nueva Versión y Remitir",
                requiresConfirmationSheet=True,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "EN_IMPLEMENTACION":
            return MobileQuickActionDescriptor(
                actionCode="NOTIFICAR_TERMINO_OBRA_RAPIDA",
                label="Completar Plan (100%) y Notificar",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "PENDIENTE_RESULTADOS":
            return MobileQuickActionDescriptor(
                actionCode="ENVIAR_EVIDENCIA_K3_RAPIDA",
                label="Enviar Evidencias K0/K3 a Evaluación",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )

    if canonical == "COORDINATOR":
        if st == "POR_APROBAR":
            return MobileQuickActionDescriptor(
                actionCode="APROBAR_FILTRO_1TAP",
                label="Aprobar Filtro Cero Inversión",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "PENDIENTE_ASIGNACION_MENTOR":
            return MobileQuickActionDescriptor(
                actionCode="ASIGNAR_MENTOR_RAPIDO",
                label="Asignar Mentor en 1 Toque",
                requiresConfirmationSheet=True,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "POR_DOCUMENTAR":
            return MobileQuickActionDescriptor(
                actionCode="PUBLICAR_POE_RAPIDO",
                label="Publicar Estándar POE y Cerrar",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )

    if canonical == "MENTOR":
        if st == "PENDIENTE_PLAN_IMPLEMENTACION":
            return MobileQuickActionDescriptor(
                actionCode="VALIDAR_PLAN_RAPIDO",
                label="Validar Plan (<= 8 Semanas)",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "POR_EVALUAR":
            return MobileQuickActionDescriptor(
                actionCode="FIRMAR_5S_Y_APROBAR_K3",
                label="Firmar Auditoría 5S y Aprobar K3",
                requiresConfirmationSheet=True,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )

    if canonical == "CONSULTANT":
        if st == "POR_APROBAR":
            return MobileQuickActionDescriptor(
                actionCode="APROBAR_FILTRO_1TAP",
                label="Aprobar Filtro Cero Inversión",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )
        if st == "POR_DOCUMENTAR":
            return MobileQuickActionDescriptor(
                actionCode="PUBLICAR_POE_RAPIDO",
                label="Publicar Estándar POE y Cerrar",
                requiresConfirmationSheet=False,
                isAvailable=True,
                thumbZonePriority="PRIMARY",
            )

    return MobileQuickActionDescriptor(
        actionCode="CONSULTAR_DETALLE_EJECUTIVO",
        label="Ver Ficha de Iniciativa",
        requiresConfirmationSheet=False,
        isAvailable=False,
        thumbZonePriority="SECONDARY",
    )


# Alias en camelCase para paridad 1:1 con TypeScript
classifyViewport = classify_viewport
getMobileRoleProfile = get_mobile_role_profile
validateMobileWizardStep = validate_mobile_wizard_step
getMobileQuickActionForInitiative = get_mobile_quick_action_for_initiative

