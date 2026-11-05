"""
Pool de Pruebas Automatizadas en Fase Roja (TDD / BDD) — Kizukai Project Hub MVP.
Cubre los 15 casos de prueba críticos (TC-TDD-001 a TC-TDD-015) y los 5 escenarios
de negocio Gherkin (HU-01 a HU-05) contra el motor de dominio `kizukai_py.engine`.
"""

import time
from datetime import date, timedelta
import pytest

from kizukai_py.engine import (
    KizukaiEngine,
    InitiativeState,
    ProgramType,
    Role,
    UserContext,
    InvalidStateTransitionException,
    CrossTenantAccessDeniedException,
    ZeroInvestmentRequiredException,
    MaxImplementationWindowExceededException,
    InsufficientReturnFeedbackException,
    InvalidMentorAssignmentException,
    EvaluationPrerequisitesNotMetException,
    DuplicateInitiativeException,
    PrivilegeViolationException,
    MFARequiredException,
    AuditLogTamperingException,
    classify_viewport,
    get_mobile_role_profile,
    validate_mobile_wizard_step,
    get_mobile_quick_action_for_initiative,
)


@pytest.fixture
def engine() -> KizukaiEngine:
    """Instancia limpia del motor de dominio Kizukai para cada caso de prueba."""
    return KizukaiEngine()


# ============================================================================
# 15 CASOS DE PRUEBA CRÍTICOS (TC-TDD-001 A TC-TDD-015)
# ============================================================================


def test_tc_tdd_001_valid_transition_draft_to_por_aprobar(engine: KizukaiEngine):
    """TC-TDD-001: Transición válida de BORRADOR a POR_APROBAR genera folio e historial."""
    user = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    initiative = engine.create_initiative(
        actor=user,
        title="Optimización de layout en línea de empaque",
        department="Empaque",
        program=ProgramType.K2,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    assert initiative.state == InitiativeState.BORRADOR

    updated = engine.submit_for_approval(actor=user, initiative_id=initiative.id)
    assert updated.state == InitiativeState.POR_APROBAR
    assert updated.folio.startswith("KIZ-2026-")
    assert len(updated.state_history) >= 2
    assert updated.state_history[-1].from_state == InitiativeState.BORRADOR
    assert updated.state_history[-1].to_state == InitiativeState.POR_APROBAR


def test_tc_tdd_002_invalid_transition_draft_to_finalizada_raises_error(engine: KizukaiEngine):
    """TC-TDD-002: Transición ilegal directa de BORRADOR a FINALIZADA lanza excepción."""
    user = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    initiative = engine.create_initiative(
        actor=user,
        title="Mejora rápida poka-yoke en prensa",
        department="Estampado",
        program=ProgramType.K1,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    with pytest.raises(InvalidStateTransitionException):
        engine.transition_state(
            actor=user,
            initiative_id=initiative.id,
            target_state=InitiativeState.FINALIZADA,
        )


def test_tc_tdd_003_multi_tenant_isolation_blocks_cross_org_access(engine: KizukaiEngine):
    """TC-TDD-003: Aislamiento Multi-Tenant impide que un usuario de ORG-B acceda a ORG-A."""
    user_org_a = UserContext(
        user_id="usr-a",
        email="lider.a@orga.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    user_org_b = UserContext(
        user_id="usr-b",
        email="coord.b@orgb.com",
        organization_id="ORG-B",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=True,
    )
    initiative_a = engine.create_initiative(
        actor=user_org_a,
        title="Reducción de scrap en inyección",
        department="Plásticos",
        program=ProgramType.K2,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    with pytest.raises(CrossTenantAccessDeniedException):
        engine.get_initiative(actor=user_org_b, initiative_id=initiative_a.id)


def test_tc_tdd_004_zero_investment_required_on_k2_submission(engine: KizukaiEngine):
    """TC-TDD-004: Iniciativa K2 requiere confirmación explícita de Cero Inversión y CAPEX = 0."""
    user = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    with pytest.raises(ZeroInvestmentRequiredException):
        engine.create_initiative(
            actor=user,
            title="Compra de robot colaborativo nuevo",
            department="Ensamble",
            program=ProgramType.K2,
            zero_investment_confirmed=False,
            capex_amount=15000.0,
        )


def test_tc_tdd_005_evidence_replacement_after_return_increments_version_and_preserves_v1(
    engine: KizukaiEngine,
):
    """TC-TDD-005: Reemplazo de evidencia tras devolución crea Versión 2.0 y congela Versión 1.0 (Devuelta)."""
    leader = UserContext(
        user_id="usr-leader",
        email="lider@empresa.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    mentor = UserContext(
        user_id="usr-mentor",
        email="carlos.mentor@empresa.com",
        organization_id="ORG-A",
        roles=[Role.MENTOR],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0015",
        state=InitiativeState.PENDIENTE_RESULTADOS,
        owner_email=leader.email,
        mentor_email=mentor.email,
    )
    v1 = engine.upload_evidence(
        actor=leader,
        initiative_id=initiative.id,
        file_name="medicion_inicial.pdf",
        content_hash="sha256-v1",
    )
    assert v1.version_label == "Versión 1.0"

    engine.submit_for_evaluation(actor=leader, initiative_id=initiative.id)
    engine.return_for_adjustments(
        actor=mentor,
        initiative_id=initiative.id,
        feedback_comment="Falta firma del supervisor de turno y evidencia fotográfica con fecha en el reporte.",
    )

    v2 = engine.upload_evidence(
        actor=leader,
        initiative_id=initiative.id,
        file_name="medicion_corregida_firmada.pdf",
        content_hash="sha256-v2",
    )
    deliverables = engine.list_evidence_versions(actor=leader, initiative_id=initiative.id)
    assert len(deliverables) == 2
    assert deliverables[0].version_label == "Versión 1.0 (Devuelta)"
    assert deliverables[0].frozen is True
    assert v2.version_label == "Versión 2.0"
    assert v2.frozen is False


def test_tc_tdd_006_work_activity_plan_exceeding_8_weeks_raises_error(engine: KizukaiEngine):
    """TC-TDD-006: Plan de actividades que excede 8 semanas (56 días) lanza MaxImplementationWindowExceededException."""
    leader = UserContext(
        user_id="usr-leader",
        email="lider@empresa.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0030",
        state=InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
        owner_email=leader.email,
    )
    start = date(2026, 3, 1)
    end_exceeded = start + timedelta(days=57)

    with pytest.raises(MaxImplementationWindowExceededException):
        engine.register_implementation_plan(
            actor=leader,
            initiative_id=initiative.id,
            start_date=start,
            end_date=end_exceeded,
            activities=["Análisis causa raíz", "Estandarización"],
        )


def test_tc_tdd_007_excel_report_c_stress_5000_records_under_3_seconds(engine: KizukaiEngine):
    """TC-TDD-007: Exportación de Reporte C con 5,000 registros se completa en menos de 3.0 segundos."""
    coordinator = UserContext(
        user_id="usr-coord",
        email="ana.coord@empresa.com",
        organization_id="ORG-A",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=True,
    )
    engine.bulk_seed_initiatives(organization_id="ORG-A", count=5000)

    t0 = time.perf_counter()
    report = engine.export_report_c_xlsx(actor=coordinator)
    elapsed = time.perf_counter() - t0

    assert elapsed < 3.0
    assert report.total_records == 5000
    assert report.file_name.endswith(".xlsx")
    assert report.payload_bytes[:2] == b"PK"  # Firma ZIP/OOXML válida (.xlsx)


def test_tc_tdd_008_non_destructive_return_restores_exact_previous_state_and_keeps_stage_instances(
    engine: KizukaiEngine,
):
    """TC-TDD-008: Devolución no destructiva preserva return_target_state_id e instancias de etapa."""
    leader = UserContext(
        user_id="usr-leader",
        email="lider@empresa.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    mentor = UserContext(
        user_id="usr-mentor",
        email="carlos.mentor@empresa.com",
        organization_id="ORG-A",
        roles=[Role.MENTOR],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0018",
        state=InitiativeState.PENDIENTE_RESULTADOS,
        owner_email=leader.email,
        mentor_email=mentor.email,
    )
    engine.upload_evidence(
        actor=leader,
        initiative_id=initiative.id,
        file_name="resultados_preliminares.pdf",
        content_hash="sha256-init",
    )
    engine.submit_for_evaluation(actor=leader, initiative_id=initiative.id)
    stages_before = len(initiative.stage_instances)

    returned = engine.return_for_adjustments(
        actor=mentor,
        initiative_id=initiative.id,
        feedback_comment="Los indicadores de OEE requieren adjuntar la corrida de 7 días completos.",
    )
    assert returned.state == InitiativeState.DEVUELTA_PARA_AJUSTES
    assert returned.return_target_state_id == InitiativeState.PENDIENTE_RESULTADOS
    assert len(returned.stage_instances) == stages_before

    # Al subsanar y reanudar, vuelve exactamente al estado objetivo guardado
    resumed = engine.resume_from_adjustments(actor=leader, initiative_id=initiative.id)
    assert resumed.state == InitiativeState.PENDIENTE_RESULTADOS


def test_tc_tdd_009_return_feedback_requires_minimum_20_characters(engine: KizukaiEngine):
    """TC-TDD-009: Comentario de devolución menor a 20 caracteres lanza InsufficientReturnFeedbackException."""
    mentor = UserContext(
        user_id="usr-mentor",
        email="carlos.mentor@empresa.com",
        organization_id="ORG-A",
        roles=[Role.MENTOR],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0019",
        state=InitiativeState.POR_EVALUAR,
        owner_email="lider@empresa.com",
        mentor_email=mentor.email,
    )
    with pytest.raises(InsufficientReturnFeedbackException):
        engine.return_for_adjustments(
            actor=mentor,
            initiative_id=initiative.id,
            feedback_comment="Incompleto",  # < 20 caracteres
        )


def test_tc_tdd_010_mentor_assignment_requires_same_org_and_active_profile(engine: KizukaiEngine):
    """TC-TDD-010: Asignación de mentor falla si el mentor pertenece a otra organización o está inactivo."""
    coordinator = UserContext(
        user_id="usr-coord",
        email="ana.coord@empresa.com",
        organization_id="ORG-A",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=True,
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0022",
        state=InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
        owner_email="lider@empresa.com",
    )
    engine.register_mentor_profile(
        email="externo.mentor@orgb.com",
        organization_id="ORG-B",
        is_active=True,
    )
    with pytest.raises(InvalidMentorAssignmentException):
        engine.assign_mentor(
            actor=coordinator,
            initiative_id=initiative.id,
            mentor_email="externo.mentor@orgb.com",
        )


def test_tc_tdd_011_approve_evaluation_k3_requires_gemba_5s_checklist_and_finance_validation(
    engine: KizukaiEngine,
):
    """TC-TDD-011: Aprobación de evaluación K3 exige checklist Gemba 5S y validación financiera."""
    evaluator = UserContext(
        user_id="usr-eval",
        email="comite.evaluador@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EVALUATOR],
        mfa_verified=True,
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0040",
        state=InitiativeState.POR_EVALUAR,
        owner_email="lider@empresa.com",
        program=ProgramType.K3,
    )
    with pytest.raises(EvaluationPrerequisitesNotMetException):
        engine.approve_evaluation(
            actor=evaluator,
            initiative_id=initiative.id,
            gemba_5s_completed=False,
            finance_validated=False,
        )


def test_tc_tdd_012_roi_and_enterprise_value_formula_calculation(engine: KizukaiEngine):
    """TC-TDD-012: Cálculo determinístico de Ahorro Anualizado Neto, ROI y Valor Empresarial."""
    metrics = engine.calculate_financial_impact(
        annual_gross_savings=120_000.0,
        implementation_operational_cost=20_000.0,
        capex_amount=0.0,
        sustainability_factor=0.90,
    )
    # Ahorro Neto = 120,000 - 20,000 = 100,000
    # Enterprise Value ponderado por factor de sostenibilidad (0.90) = 90,000
    assert metrics.net_annual_savings == pytest.approx(100_000.0)
    assert metrics.enterprise_value == pytest.approx(90_000.0)
    assert metrics.roi_percentage == pytest.approx(500.0)


def test_tc_tdd_013_duplicate_initiative_prevention_same_title_dept_program(engine: KizukaiEngine):
    """TC-TDD-013: Bloqueo de iniciativas duplicadas con mismo título normalizado, departamento y programa."""
    user = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    engine.create_initiative(
        actor=user,
        title="Reducción de tiempos de cambio de molde SMED",
        department="Operaciones Planta Norte",
        program=ProgramType.K2,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    with pytest.raises(DuplicateInitiativeException):
        engine.create_initiative(
            actor=user,
            title="  reducción de tiempos de cambio de molde smed ",
            department="Operaciones Planta Norte",
            program=ProgramType.K2,
            zero_investment_confirmed=True,
            capex_amount=0.0,
        )


def test_tc_tdd_014_rbac_tech_admin_blocked_from_content_and_mfa_enforced_for_privileged_roles(
    engine: KizukaiEngine,
):
    """TC-TDD-014: TECH_ADMIN no puede alterar contenido operativo de iniciativas y roles privilegiados exigen MFA."""
    tech_admin = UserContext(
        user_id="usr-tech",
        email="soporte.ti@empresa.com",
        organization_id="ORG-A",
        roles=[Role.TECH_ADMIN],
        mfa_verified=True,
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0050",
        state=InitiativeState.POR_EVALUAR,
        owner_email="lider@empresa.com",
    )
    with pytest.raises(PrivilegeViolationException):
        engine.approve_evaluation(
            actor=tech_admin,
            initiative_id=initiative.id,
            gemba_5s_completed=True,
            finance_validated=True,
        )

    coord_without_mfa = UserContext(
        user_id="usr-coord-nomfa",
        email="ana.coord@empresa.com",
        organization_id="ORG-A",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=False,
    )
    with pytest.raises(MFARequiredException):
        engine.export_report_c_xlsx(actor=coord_without_mfa)


def test_tc_tdd_015_transactional_audit_log_immutability_and_snapshots(engine: KizukaiEngine):
    """TC-TDD-015: Bitácora de auditoría transaccional registra snapshots antes/después e impide mutación."""
    user = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    initiative = engine.create_initiative(
        actor=user,
        title="Estandarización de carros kanban",
        department="Logística Interna",
        program=ProgramType.K1,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    engine.submit_for_approval(actor=user, initiative_id=initiative.id)
    logs = engine.get_audit_logs(organization_id="ORG-A", initiative_id=initiative.id)
    assert len(logs) >= 2
    assert logs[-1].before_snapshot["state"] == InitiativeState.BORRADOR.value
    assert logs[-1].after_snapshot["state"] == InitiativeState.POR_APROBAR.value

    with pytest.raises(AuditLogTamperingException):
        engine.delete_or_mutate_audit_log(log_id=logs[-1].id)


# ============================================================================
# 5 ESCENARIOS BDD DE HISTORIAS DE USUARIO (HU-01 A HU-05)
# ============================================================================


def test_bdd_hu01_register_initiative_scenario(engine: KizukaiEngine):
    """BDD HU-01: Registro de Iniciativa Proactiva K2, Cero Inversión, folio KIZ-2026-XXXX y notificación."""
    juan = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.EMPLOYEE],
    )
    draft = engine.create_initiative(
        actor=juan,
        title="Reducción de tiempos de cambio de molde SMED",
        department="Operaciones Planta Norte",
        program=ProgramType.K2,
        zero_investment_confirmed=True,
        capex_amount=0.0,
    )
    submitted = engine.submit_for_approval(actor=juan, initiative_id=draft.id)

    assert submitted.folio == "KIZ-2026-0001"
    assert submitted.state == InitiativeState.POR_APROBAR
    assert submitted.zero_investment_confirmed is True
    assert submitted.state_history[-1].actor_email == "juan.perez@empresa.com"
    notifications = engine.get_outbox_notifications(organization_id="ORG-A")
    assert any(n.initiative_id == submitted.id and n.event_type == "INITIATIVE_SUBMITTED" for n in notifications)


def test_bdd_hu02_mentor_returns_deliverable_scenario(engine: KizukaiEngine):
    """BDD HU-02: Devolución de entregable congela Versión 1.0 (Devuelta), preserva return_target_state_id y notifica."""
    leader = UserContext(
        user_id="usr-leader",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    carlos = UserContext(
        user_id="usr-carlos",
        email="carlos.mentor@empresa.com",
        organization_id="ORG-A",
        roles=[Role.MENTOR],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0015",
        state=InitiativeState.PENDIENTE_RESULTADOS,
        owner_email=leader.email,
        mentor_email=carlos.email,
    )
    engine.upload_evidence(
        actor=leader,
        initiative_id=initiative.id,
        file_name="evidencia_antes_despues.pdf",
        content_hash="sha256-hu02-v1",
    )
    engine.submit_for_evaluation(actor=leader, initiative_id=initiative.id)
    assert initiative.state == InitiativeState.POR_EVALUAR

    returned = engine.return_for_adjustments(
        actor=carlos,
        initiative_id=initiative.id,
        feedback_comment=(
            "La evidencia fotográfica del antes y después no muestra el tacómetro calibrado "
            "ni la hoja estándar firmada."
        ),
    )
    assert returned.state == InitiativeState.DEVUELTA_PARA_AJUSTES
    assert returned.return_target_state_id == InitiativeState.PENDIENTE_RESULTADOS
    versions = engine.list_evidence_versions(actor=leader, initiative_id=initiative.id)
    assert versions[0].version_label == "Versión 1.0 (Devuelta)"
    assert versions[0].frozen is True

    notifications = engine.get_outbox_notifications(organization_id="ORG-A")
    assert any(
        n.initiative_id == initiative.id and n.priority == "HIGH" and n.recipient_email == leader.email
        for n in notifications
    )


def test_bdd_hu03_assign_mentor_scenario(engine: KizukaiEngine):
    """BDD HU-03: Asignación de mentor en KIZ-2026-0022 transiciona a PENDIENTE_PLAN_IMPLEMENTACION y puebla bandeja."""
    ana = UserContext(
        user_id="usr-ana",
        email="ana.coord@empresa.com",
        organization_id="ORG-A",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=True,
    )
    roberto = UserContext(
        user_id="usr-roberto",
        email="roberto.mentor@empresa.com",
        organization_id="ORG-A",
        roles=[Role.MENTOR],
    )
    engine.register_mentor_profile(
        email=roberto.email,
        organization_id="ORG-A",
        is_active=True,
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0022",
        state=InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
        owner_email="juan.perez@empresa.com",
    )

    updated = engine.assign_mentor(
        actor=ana,
        initiative_id=initiative.id,
        mentor_email=roberto.email,
    )
    assert updated.state == InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION
    assert len(updated.mentorship_assignments) == 1
    assert updated.mentorship_assignments[0].mentor_email == "roberto.mentor@empresa.com"
    assert updated.mentorship_assignments[0].is_active is True

    inbox = engine.get_mentor_inbox(actor=roberto)
    assert any(item.folio == "KIZ-2026-0022" for item in inbox)


def test_bdd_hu04_next_action_card_and_8_week_limit_scenario(engine: KizukaiEngine):
    """BDD HU-04: Consulta de Tarjeta de Próxima Acción Requerida y rechazo de plan > 8 semanas (56 días)."""
    leader = UserContext(
        user_id="usr-juan",
        email="juan.perez@empresa.com",
        organization_id="ORG-A",
        roles=[Role.LEADER],
    )
    initiative = engine.seed_initiative_in_state(
        organization_id="ORG-A",
        folio="KIZ-2026-0030",
        state=InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
        owner_email=leader.email,
    )
    card = engine.get_next_required_action_card(actor=leader, initiative_id=initiative.id)
    assert card.responsible_role == Role.LEADER
    assert "56" in card.action_title or "8 semanas" in card.action_title

    with pytest.raises(MaxImplementationWindowExceededException):
        engine.register_implementation_plan(
            actor=leader,
            initiative_id=initiative.id,
            start_date=date(2026, 3, 1),
            end_date=date(2026, 5, 5),  # 65 días (> 56 días)
            activities=["Actividad 1", "Actividad 2"],
        )
    assert initiative.state == InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION


def test_bdd_hu05_export_report_multi_tenant_audit_metadata_scenario(engine: KizukaiEngine):
    """BDD HU-05: Exportación de Reporte C (.xlsx) filtra estrictamente por tenant e incluye metadatos UTC."""
    ana = UserContext(
        user_id="usr-ana",
        email="ana.coord@empresa.com",
        organization_id="ORG-A",
        roles=[Role.PROGRAM_COORDINATOR],
        mfa_verified=True,
    )
    engine.bulk_seed_initiatives(organization_id="ORG-A", count=3)
    engine.bulk_seed_initiatives(organization_id="ORG-B", count=2)

    report = engine.export_report_c_xlsx(actor=ana)
    assert report.organization_id == "ORG-A"
    assert report.requested_by == "ana.coord@empresa.com"
    assert report.total_records == 3
    assert report.generated_at_utc.endswith("Z")
    assert all(row["organization_id"] == "ORG-A" for row in report.rows)


# ============================================================================
# ESPECIFICACIÓN MOBILE WEB APP POR ROL (CA-MOB-01 A CA-MOB-05)
# ============================================================================


def test_ca_mob_01_viewport_classification_and_desktop_intangibility():
    """CA-MOB-01: Clasificación determinista de viewport (<768 MOBILE, 768..1023 TABLET, >=1024 DESKTOP)."""
    mob = classify_viewport(390)
    assert mob.mode == "MOBILE"
    assert mob.isMobile is True
    assert mob.showBottomNav is True
    assert mob.useBottomSheetModals is True
    assert mob.useCardTables is True

    tab = classify_viewport(820)
    assert tab.mode == "TABLET"
    assert tab.isTablet is True
    assert tab.showBottomNav is True

    desk = classify_viewport(1280)
    assert desk.mode == "DESKTOP"
    assert desk.isDesktop is True
    assert desk.showBottomNav is False
    assert desk.useBottomSheetModals is False
    assert desk.useCardTables is False


def test_ca_mob_02_role_profiles_for_all_5_roles():
    """CA-MOB-02: Configuración simplificada de vista móvil para los 5 roles."""
    p = get_mobile_role_profile("PARTICIPANT")
    m = get_mobile_role_profile("MENTOR")
    c = get_mobile_role_profile("COORDINATOR")
    k = get_mobile_role_profile("CONSULTANT")
    t = get_mobile_role_profile("TECH_ADMIN")

    assert p.modeTitle == "Modo Gemba Express"
    assert m.modeTitle == "Modo Gemba Walk & 5S"
    assert c.modeTitle == "Modo Triage & Asignación"
    assert k.modeTitle == "Modo Pulso Ejecutivo"
    assert t.modeTitle == "Modo Pocket Control & RBAC"
    assert t.allowQuickCardActions is False


def test_ca_mob_03_mobile_wizard_3_steps_validation():
    """CA-MOB-03: Validación paso a paso del wizard móvil de 3 pasos para crear iniciativas K2."""
    s1_fail = validate_mobile_wizard_step(1, {"title": "abc", "department": "", "guideline": ""})
    assert s1_fail.valid is False

    s1_ok = validate_mobile_wizard_step(
        1,
        {
            "title": "Poka-Yoke en guía de empaque",
            "department": "Empaque",
            "guideline": "Calidad",
        },
    )
    assert s1_ok.valid is True

    s2_ok = validate_mobile_wizard_step(
        2,
        {
            "k0_deficient": "Etiquetas desalineadas constantemente en lote",
            "k1_basic_function": "Guía lateral fija",
            "k2_proactivity": "Fabricar tope con sobrante de nylamid en taller",
        },
    )
    assert s2_ok.valid is True

    s3_fail = validate_mobile_wizard_step(
        3,
        {
            "k3_expected_impact": "Cero defectos de etiquetado",
            "zero_investment_verified": False,
            "asDraft": False,
        },
    )
    assert s3_fail.valid is False

    s3_ok = validate_mobile_wizard_step(
        3,
        {
            "k3_expected_impact": "Cero defectos de etiquetado",
            "zero_investment_verified": True,
            "asDraft": False,
        },
    )
    assert s3_ok.valid is True


def test_ca_mob_04_and_05_mobile_quick_actions_and_rbac_enforcement():
    """CA-MOB-04 y CA-MOB-05: Acciones rápidas de 1 toque por rol/estado y bloqueo RBAC de TECH_ADMIN."""
    act_part = get_mobile_quick_action_for_initiative("PARTICIPANT", "DEVUELTA_PARA_AJUSTES")
    assert act_part.actionCode == "REMITIR_CORRECCION_RAPIDA"
    assert act_part.isAvailable is True

    act_coord_1 = get_mobile_quick_action_for_initiative("COORDINATOR", "POR_APROBAR")
    assert act_coord_1.actionCode == "APROBAR_FILTRO_1TAP"

    act_coord_2 = get_mobile_quick_action_for_initiative("COORDINATOR", "PENDIENTE_ASIGNACION_MENTOR")
    assert act_coord_2.actionCode == "ASIGNAR_MENTOR_RAPIDO"

    act_mentor_1 = get_mobile_quick_action_for_initiative("MENTOR", "PENDIENTE_PLAN_IMPLEMENTACION")
    assert act_mentor_1.actionCode == "VALIDAR_PLAN_RAPIDO"

    act_mentor_2 = get_mobile_quick_action_for_initiative("MENTOR", "POR_EVALUAR")
    assert act_mentor_2.actionCode == "FIRMAR_5S_Y_APROBAR_K3"

    act_tech = get_mobile_quick_action_for_initiative("TECH_ADMIN", "POR_EVALUAR")
    assert act_tech.actionCode == "NINGUNA_ACCION_OPERATIVA"
    assert act_tech.isAvailable is False

