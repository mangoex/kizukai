/**
 * Suite Espejo en TypeScript (Vitest) — Kizukai Project Hub MVP.
 * Paridad 1:1 con `tests/test_kizukai_tdd.py` para los 15 casos de prueba críticos
 * (TC-TDD-001 a TC-TDD-015) y los 5 escenarios BDD (HU-01 a HU-05) evaluando
 * `../src/domain/engine` y el SDK `../src/sdk/client`.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
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
} from "../src/domain/engine";
import { KizukaiClient } from "../src/sdk/client";

describe("Kizukai Project Hub MVP — TDD & BDD Suite (TypeScript / Vitest)", () => {
  let engine: KizukaiEngine;
  let sdkClient: KizukaiClient;

  beforeEach(() => {
    engine = new KizukaiEngine();
    sdkClient = new KizukaiClient(engine);
  });

  // ==========================================================================
  // 15 CASOS DE PRUEBA CRÍTICOS (TC-TDD-001 A TC-TDD-015)
  // ==========================================================================

  it("test_tc_tdd_001_valid_transition_draft_to_por_aprobar", () => {
    const user: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    const initiative = engine.createInitiative({
      actor: user,
      title: "Optimización de layout en línea de empaque",
      department: "Empaque",
      program: ProgramType.K2,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
    });
    expect(initiative.state).toBe(InitiativeState.BORRADOR);

    const updated = engine.submitForApproval({
      actor: user,
      initiativeId: initiative.id,
    });
    expect(updated.state).toBe(InitiativeState.POR_APROBAR);
    expect(updated.folio).toMatch(/^KIZ-2026-\d{4}$/);
    expect(updated.stateHistory.length).toBeGreaterThanOrEqual(2);
    expect(updated.stateHistory.at(-1)?.fromState).toBe(InitiativeState.BORRADOR);
    expect(updated.stateHistory.at(-1)?.toState).toBe(InitiativeState.POR_APROBAR);
  });

  it("test_tc_tdd_002_invalid_transition_draft_to_finalizada_raises_error", () => {
    const user: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    const initiative = engine.createInitiative({
      actor: user,
      title: "Mejora rápida poka-yoke en prensa",
      department: "Estampado",
      program: ProgramType.K1,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
    });

    expect(() =>
      engine.transitionState({
        actor: user,
        initiativeId: initiative.id,
        targetState: InitiativeState.FINALIZADA,
      })
    ).toThrow(InvalidStateTransitionException);
  });

  it("test_tc_tdd_003_multi_tenant_isolation_blocks_cross_org_access", () => {
    const userOrgA: UserContext = {
      userId: "usr-a",
      email: "lider.a@orga.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };
    const userOrgB: UserContext = {
      userId: "usr-b",
      email: "coord.b@orgb.com",
      organizationId: "ORG-B",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: true,
    };

    const initiativeA = engine.createInitiative({
      actor: userOrgA,
      title: "Reducción de scrap en inyección",
      department: "Plásticos",
      program: ProgramType.K2,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
    });

    expect(() =>
      engine.getInitiative({
        actor: userOrgB,
        initiativeId: initiativeA.id,
      })
    ).toThrow(CrossTenantAccessDeniedException);
  });

  it("test_tc_tdd_004_zero_investment_required_on_k2_submission", () => {
    const user: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    expect(() =>
      engine.createInitiative({
        actor: user,
        title: "Compra de robot colaborativo nuevo",
        department: "Ensamble",
        program: ProgramType.K2,
        zeroInvestmentConfirmed: false,
        capexAmount: 15000,
      })
    ).toThrow(ZeroInvestmentRequiredException);
  });

  it("test_tc_tdd_005_evidence_replacement_after_return_increments_version_and_preserves_v1", () => {
    const leader: UserContext = {
      userId: "usr-leader",
      email: "lider@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };
    const mentor: UserContext = {
      userId: "usr-mentor",
      email: "carlos.mentor@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.MENTOR],
    };

    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0015",
      state: InitiativeState.PENDIENTE_RESULTADOS,
      ownerEmail: leader.email,
      mentorEmail: mentor.email,
    });

    const v1 = engine.uploadEvidence({
      actor: leader,
      initiativeId: initiative.id,
      fileName: "medicion_inicial.pdf",
      contentHash: "sha256-v1",
    });
    expect(v1.versionLabel).toBe("Versión 1.0");

    engine.submitForEvaluation({ actor: leader, initiativeId: initiative.id });
    engine.returnForAdjustments({
      actor: mentor,
      initiativeId: initiative.id,
      feedbackComment:
        "Falta firma del supervisor de turno y evidencia fotográfica con fecha en el reporte.",
    });

    const v2 = engine.uploadEvidence({
      actor: leader,
      initiativeId: initiative.id,
      fileName: "medicion_corregida_firmada.pdf",
      contentHash: "sha256-v2",
    });

    const deliverables = engine.listEvidenceVersions({
      actor: leader,
      initiativeId: initiative.id,
    });
    expect(deliverables).toHaveLength(2);
    expect(deliverables[0].versionLabel).toBe("Versión 1.0 (Devuelta)");
    expect(deliverables[0].frozen).toBe(true);
    expect(v2.versionLabel).toBe("Versión 2.0");
    expect(v2.frozen).toBe(false);
  });

  it("test_tc_tdd_006_work_activity_plan_exceeding_8_weeks_raises_error", () => {
    const leader: UserContext = {
      userId: "usr-leader",
      email: "lider@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };
    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0030",
      state: InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
      ownerEmail: leader.email,
    });

    expect(() =>
      engine.registerImplementationPlan({
        actor: leader,
        initiativeId: initiative.id,
        startDate: "2026-03-01",
        endDate: "2026-04-27", // 57 días (> 56 días)
        activities: ["Análisis causa raíz", "Estandarización"],
      })
    ).toThrow(MaxImplementationWindowExceededException);
  });

  it("test_tc_tdd_007_excel_report_c_stress_5000_records_under_3_seconds", () => {
    const coordinator: UserContext = {
      userId: "usr-coord",
      email: "ana.coord@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: true,
    };

    engine.bulkSeedInitiatives({ organizationId: "ORG-A", count: 5000 });

    const start = performance.now();
    const report = engine.exportReportCXlsx({ actor: coordinator });
    const elapsedSeconds = (performance.now() - start) / 1000;

    expect(elapsedSeconds).toBeLessThan(3.0);
    expect(report.totalRecords).toBe(5000);
    expect(report.fileName.endsWith(".xlsx")).toBe(true);
    expect(report.payloadBytes[0]).toBe(0x50); // 'P'
    expect(report.payloadBytes[1]).toBe(0x4b); // 'K'
  });

  it("test_tc_tdd_008_non_destructive_return_restores_exact_previous_state_and_keeps_stage_instances", () => {
    const leader: UserContext = {
      userId: "usr-leader",
      email: "lider@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };
    const mentor: UserContext = {
      userId: "usr-mentor",
      email: "carlos.mentor@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.MENTOR],
    };

    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0018",
      state: InitiativeState.PENDIENTE_RESULTADOS,
      ownerEmail: leader.email,
      mentorEmail: mentor.email,
    });

    engine.uploadEvidence({
      actor: leader,
      initiativeId: initiative.id,
      fileName: "resultados_preliminares.pdf",
      contentHash: "sha256-init",
    });
    engine.submitForEvaluation({ actor: leader, initiativeId: initiative.id });
    const stagesBefore = initiative.stageInstances.length;

    const returned = engine.returnForAdjustments({
      actor: mentor,
      initiativeId: initiative.id,
      feedbackComment:
        "Los indicadores de OEE requieren adjuntar la corrida de 7 días completos.",
    });

    expect(returned.state).toBe(InitiativeState.DEVUELTA_PARA_AJUSTES);
    expect(returned.returnTargetStateId).toBe(InitiativeState.PENDIENTE_RESULTADOS);
    expect(returned.stageInstances.length).toBe(stagesBefore);

    const resumed = engine.resumeFromAdjustments({
      actor: leader,
      initiativeId: initiative.id,
    });
    expect(resumed.state).toBe(InitiativeState.PENDIENTE_RESULTADOS);
  });

  it("test_tc_tdd_009_return_feedback_requires_minimum_20_characters", () => {
    const mentor: UserContext = {
      userId: "usr-mentor",
      email: "carlos.mentor@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.MENTOR],
    };
    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0019",
      state: InitiativeState.POR_EVALUAR,
      ownerEmail: "lider@empresa.com",
      mentorEmail: mentor.email,
    });

    expect(() =>
      engine.returnForAdjustments({
        actor: mentor,
        initiativeId: initiative.id,
        feedbackComment: "Incompleto",
      })
    ).toThrow(InsufficientReturnFeedbackException);
  });

  it("test_tc_tdd_010_mentor_assignment_requires_same_org_and_active_profile", () => {
    const coordinator: UserContext = {
      userId: "usr-coord",
      email: "ana.coord@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: true,
    };
    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0022",
      state: InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
      ownerEmail: "lider@empresa.com",
    });

    engine.registerMentorProfile({
      email: "externo.mentor@orgb.com",
      organizationId: "ORG-B",
      isActive: true,
    });

    expect(() =>
      engine.assignMentor({
        actor: coordinator,
        initiativeId: initiative.id,
        mentorEmail: "externo.mentor@orgb.com",
      })
    ).toThrow(InvalidMentorAssignmentException);
  });

  it("test_tc_tdd_011_approve_evaluation_k3_requires_gemba_5s_checklist_and_finance_validation", () => {
    const evaluator: UserContext = {
      userId: "usr-eval",
      email: "comite.evaluador@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EVALUATOR],
      mfaVerified: true,
    };
    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0040",
      state: InitiativeState.POR_EVALUAR,
      ownerEmail: "lider@empresa.com",
      program: ProgramType.K3,
    });

    expect(() =>
      engine.approveEvaluation({
        actor: evaluator,
        initiativeId: initiative.id,
        gemba5sCompleted: false,
        financeValidated: false,
      })
    ).toThrow(EvaluationPrerequisitesNotMetException);
  });

  it("test_tc_tdd_012_roi_and_enterprise_value_formula_calculation", () => {
    const metrics = engine.calculateFinancialImpact({
      annualGrossSavings: 120_000,
      implementationOperationalCost: 20_000,
      capexAmount: 0,
      sustainabilityFactor: 0.9,
    });

    expect(metrics.netAnnualSavings).toBeCloseTo(100_000, 2);
    expect(metrics.enterpriseValue).toBeCloseTo(90_000, 2);
    expect(metrics.roiPercentage).toBeCloseTo(500.0, 2);
  });

  it("test_tc_tdd_013_duplicate_initiative_prevention_same_title_dept_program", () => {
    const user: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    engine.createInitiative({
      actor: user,
      title: "Reducción de tiempos de cambio de molde SMED",
      department: "Operaciones Planta Norte",
      program: ProgramType.K2,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
    });

    expect(() =>
      engine.createInitiative({
        actor: user,
        title: "  reducción de tiempos de cambio de molde smed ",
        department: "Operaciones Planta Norte",
        program: ProgramType.K2,
        zeroInvestmentConfirmed: true,
        capexAmount: 0,
      })
    ).toThrow(DuplicateInitiativeException);
  });

  it("test_tc_tdd_014_rbac_tech_admin_blocked_from_content_and_mfa_enforced_for_privileged_roles", () => {
    const techAdmin: UserContext = {
      userId: "usr-tech",
      email: "soporte.ti@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.TECH_ADMIN],
      mfaVerified: true,
    };
    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0050",
      state: InitiativeState.POR_EVALUAR,
      ownerEmail: "lider@empresa.com",
    });

    expect(() =>
      engine.approveEvaluation({
        actor: techAdmin,
        initiativeId: initiative.id,
        gemba5sCompleted: true,
        financeValidated: true,
      })
    ).toThrow(PrivilegeViolationException);

    const coordWithoutMfa: UserContext = {
      userId: "usr-coord-nomfa",
      email: "ana.coord@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: false,
    };

    expect(() => engine.exportReportCXlsx({ actor: coordWithoutMfa })).toThrow(
      MFARequiredException
    );
  });

  it("test_tc_tdd_015_transactional_audit_log_immutability_and_snapshots", () => {
    const user: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    const initiative = engine.createInitiative({
      actor: user,
      title: "Estandarización de carros kanban",
      department: "Logística Interna",
      program: ProgramType.K1,
      zeroInvestmentConfirmed: true,
      capexAmount: 0,
    });
    engine.submitForApproval({ actor: user, initiativeId: initiative.id });

    const logs = engine.getAuditLogs({
      organizationId: "ORG-A",
      initiativeId: initiative.id,
    });
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.at(-1)?.beforeSnapshot.state).toBe(InitiativeState.BORRADOR);
    expect(logs.at(-1)?.afterSnapshot.state).toBe(InitiativeState.POR_APROBAR);

    expect(() =>
      engine.deleteOrMutateAuditLog({ logId: logs.at(-1)!.id })
    ).toThrow(AuditLogTamperingException);
  });

  // ==========================================================================
  // 5 ESCENARIOS BDD DE HISTORIAS DE USUARIO (HU-01 A HU-05) VÍA SDK & ENGINE
  // ==========================================================================

  it("test_bdd_hu01_register_initiative_scenario", () => {
    const juan: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.EMPLOYEE],
    };

    const submitted = sdkClient.registerAndSubmitK2Initiative({
      actor: juan,
      title: "Reducción de tiempos de cambio de molde SMED",
      department: "Operaciones Planta Norte",
      zeroInvestmentConfirmed: true,
    });

    expect(submitted.folio).toBe("KIZ-2026-0001");
    expect(submitted.state).toBe(InitiativeState.POR_APROBAR);
    expect(submitted.zeroInvestmentConfirmed).toBe(true);
    expect(submitted.stateHistory.at(-1)?.actorEmail).toBe("juan.perez@empresa.com");
  });

  it("test_bdd_hu02_mentor_returns_deliverable_scenario", () => {
    const leader: UserContext = {
      userId: "usr-leader",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };
    const carlos: UserContext = {
      userId: "usr-carlos",
      email: "carlos.mentor@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.MENTOR],
    };

    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0015",
      state: InitiativeState.PENDIENTE_RESULTADOS,
      ownerEmail: leader.email,
      mentorEmail: carlos.email,
    });
    engine.uploadEvidence({
      actor: leader,
      initiativeId: initiative.id,
      fileName: "evidencia_antes_despues.pdf",
      contentHash: "sha256-hu02-v1",
    });
    engine.submitForEvaluation({ actor: leader, initiativeId: initiative.id });

    const returned = sdkClient.returnDeliverableForAdjustments({
      actor: carlos,
      initiativeId: initiative.id,
      feedbackComment:
        "La evidencia fotográfica del antes y después no muestra el tacómetro calibrado ni la hoja estándar firmada.",
    });

    expect(returned.state).toBe(InitiativeState.DEVUELTA_PARA_AJUSTES);
    expect(returned.returnTargetStateId).toBe(InitiativeState.PENDIENTE_RESULTADOS);
    const versions = engine.listEvidenceVersions({
      actor: leader,
      initiativeId: initiative.id,
    });
    expect(versions[0].versionLabel).toBe("Versión 1.0 (Devuelta)");
    expect(versions[0].frozen).toBe(true);
  });

  it("test_bdd_hu03_assign_mentor_scenario", () => {
    const ana: UserContext = {
      userId: "usr-ana",
      email: "ana.coord@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: true,
    };
    const roberto: UserContext = {
      userId: "usr-roberto",
      email: "roberto.mentor@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.MENTOR],
    };

    engine.registerMentorProfile({
      email: roberto.email,
      organizationId: "ORG-A",
      isActive: true,
    });

    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0022",
      state: InitiativeState.PENDIENTE_ASIGNACION_MENTOR,
      ownerEmail: "juan.perez@empresa.com",
    });

    const updated = sdkClient.assignMentor({
      actor: ana,
      initiativeId: initiative.id,
      mentorEmail: roberto.email,
    });

    expect(updated.state).toBe(InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION);
    expect(updated.mentorshipAssignments[0].mentorEmail).toBe(
      "roberto.mentor@empresa.com"
    );
    const inbox = engine.getMentorInbox({ actor: roberto });
    expect(inbox.some((i) => i.folio === "KIZ-2026-0022")).toBe(true);
  });

  it("test_bdd_hu04_next_action_card_and_8_week_limit_scenario", () => {
    const leader: UserContext = {
      userId: "usr-juan",
      email: "juan.perez@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.LEADER],
    };

    const initiative = engine.seedInitiativeInState({
      organizationId: "ORG-A",
      folio: "KIZ-2026-0030",
      state: InitiativeState.PENDIENTE_PLAN_IMPLEMENTACION,
      ownerEmail: leader.email,
    });

    const card = sdkClient.getNextActionCard({
      actor: leader,
      initiativeId: initiative.id,
    });
    expect(card.responsibleRole).toBe(Role.LEADER);

    expect(() =>
      engine.registerImplementationPlan({
        actor: leader,
        initiativeId: initiative.id,
        startDate: "2026-03-01",
        endDate: "2026-05-05",
        activities: ["Actividad 1", "Actividad 2"],
      })
    ).toThrow(MaxImplementationWindowExceededException);
  });

  it("test_bdd_hu05_export_report_multi_tenant_audit_metadata_scenario", () => {
    const ana: UserContext = {
      userId: "usr-ana",
      email: "ana.coord@empresa.com",
      organizationId: "ORG-A",
      roles: [Role.PROGRAM_COORDINATOR],
      mfaVerified: true,
    };

    engine.bulkSeedInitiatives({ organizationId: "ORG-A", count: 3 });
    engine.bulkSeedInitiatives({ organizationId: "ORG-B", count: 2 });

    const report = sdkClient.exportReportCXlsx({ actor: ana });
    expect(report.organizationId).toBe("ORG-A");
    expect(report.requestedBy).toBe("ana.coord@empresa.com");
    expect(report.totalRecords).toBe(3);
    expect(report.generatedAtUtc.endsWith("Z")).toBe(true);
    expect(report.rows.every((r) => r.organizationId === "ORG-A")).toBe(true);
  });
});
