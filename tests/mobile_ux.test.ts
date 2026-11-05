/**
 * Suite de Pruebas Unitarias TDD — Mobile Web App UX por Rol (`CA-MOB-01` a `CA-MOB-05`).
 * Verifica el motor determinista `src/domain/mobileUxEngine.ts` (y su re-exportación en `src/domain/engine.ts`).
 */

import { describe, it, expect } from "vitest";
import {
  classifyViewport,
  getMobileRoleProfile,
  validateMobileWizardStep,
  getMobileQuickActionForInitiative,
} from "../src/domain/mobileUxEngine";
import {
  classifyViewport as engineClassifyViewport,
  getMobileRoleProfile as engineGetMobileRoleProfile,
} from "../src/domain/engine";

describe("Mobile Web App UX Engine — Especificación SBD CA-MOB-01 a CA-MOB-05", () => {
  it("TC-MOB-001 (CA-MOB-01): classifyViewport(390) activa modo MOBILE con Bottom Nav, Bottom Sheet y Card Tables", () => {
    const vp = classifyViewport(390);
    expect(vp.mode).toBe("MOBILE");
    expect(vp.isMobile).toBe(true);
    expect(vp.isTablet).toBe(false);
    expect(vp.isDesktop).toBe(false);
    expect(vp.showBottomNav).toBe(true);
    expect(vp.useBottomSheetModals).toBe(true);
    expect(vp.useCardTables).toBe(true);
  });

  it("TC-MOB-002 (CA-MOB-01): classifyViewport(768) y classifyViewport(1023) activan modo TABLET", () => {
    const vp768 = classifyViewport(768);
    const vp1023 = classifyViewport(1023);
    expect(vp768.mode).toBe("TABLET");
    expect(vp768.isTablet).toBe(true);
    expect(vp1023.mode).toBe("TABLET");
    expect(vp1023.showBottomNav).toBe(true);
    expect(vp1023.useCardTables).toBe(true);
  });

  it("TC-MOB-003 (CA-MOB-01): classifyViewport(1024) y classifyViewport(1440) garantizan intangibilidad DESKTOP", () => {
    const vp1024 = classifyViewport(1024);
    const vp1440 = engineClassifyViewport(1440);
    expect(vp1024.mode).toBe("DESKTOP");
    expect(vp1024.isDesktop).toBe(true);
    expect(vp1024.showBottomNav).toBe(false);
    expect(vp1024.useBottomSheetModals).toBe(false);
    expect(vp1024.useCardTables).toBe(false);
    expect(vp1440.mode).toBe("DESKTOP");
  });

  it("TC-MOB-004 (CA-MOB-02): getMobileRoleProfile retorna los 5 modos móviles simplificados por rol", () => {
    const participant = getMobileRoleProfile("PARTICIPANT");
    const mentor = getMobileRoleProfile("MENTOR");
    const coordinator = getMobileRoleProfile("COORDINATOR");
    const consultant = getMobileRoleProfile("CONSULTANT");
    const techAdmin = engineGetMobileRoleProfile("TECH_ADMIN");

    expect(participant.modeTitle).toBe("Modo Gemba Express");
    expect(participant.allowQuickCardActions).toBe(true);

    expect(mentor.modeTitle).toBe("Modo Gemba Walk & 5S");
    expect(mentor.quickPills.length).toBeGreaterThanOrEqual(3);

    expect(coordinator.modeTitle).toBe("Modo Triage & Asignación");
    expect(coordinator.allowQuickCardActions).toBe(true);

    expect(consultant.modeTitle).toBe("Modo Pulso Ejecutivo");
    expect(consultant.primaryCtaLabel).toContain(".xlsx");

    expect(techAdmin.modeTitle).toBe("Modo Pocket Control & RBAC");
    expect(techAdmin.allowQuickCardActions).toBe(false);
  });

  it("TC-MOB-005 (CA-MOB-03): validateMobileWizardStep Paso 1 exige título >= 5 chars, departamento y directriz", () => {
    const invalidStep1 = validateMobileWizardStep(1, {
      title: "K2",
      department: "",
      guideline: "",
    });
    expect(invalidStep1.valid).toBe(false);
    expect(invalidStep1.canAdvance).toBe(false);
    expect(invalidStep1.errors).toHaveLength(3);

    const validStep1 = validateMobileWizardStep(1, {
      title: "Guía Poka-Yoke en mesa de empaque",
      department: "Empaque Planta 1",
      guideline: "Calidad y Cero Defectos",
    });
    expect(validStep1.valid).toBe(true);
    expect(validStep1.canAdvance).toBe(true);
  });

  it("TC-MOB-006 (CA-MOB-03): validateMobileWizardStep Paso 2 valida diagnóstico K0, condición K1 y proactividad K2", () => {
    const invalidStep2 = validateMobileWizardStep(2, {
      k0_deficient: "Corto",
      k1_basic_function: "Mal",
      k2_proactivity: "Nada",
    });
    expect(invalidStep2.valid).toBe(false);
    expect(invalidStep2.errors).toHaveLength(3);

    const validStep2 = validateMobileWizardStep(2, {
      k0_deficient: "Desalineación recurrente de etiquetas en cajas de exportación",
      k1_basic_function: "Alineación mecánica mediante tope fijo",
      k2_proactivity: "Fabricar tope guía con retazo de nylamid disponible en taller interno",
    });
    expect(validStep2.valid).toBe(true);
  });

  it("TC-MOB-007 (CA-MOB-03 / CA-MOB-05): validateMobileWizardStep Paso 3 exige Cero Inversión para envío formal pero permite guardar Borrador", () => {
    const blockedSubmit = validateMobileWizardStep(3, {
      k3_expected_impact: "Reducción del 80% en retrabajo de etiquetado",
      zero_investment_verified: false,
      asDraft: false,
    });
    expect(blockedSubmit.valid).toBe(false);
    expect(blockedSubmit.errors[0]).toContain("Cero Inversión");

    const allowedDraft = validateMobileWizardStep(3, {
      k3_expected_impact: "Reducción del 80% en retrabajo de etiquetado",
      zero_investment_verified: false,
      asDraft: true,
    });
    expect(allowedDraft.valid).toBe(true);

    const allowedSubmit = validateMobileWizardStep(3, {
      k3_expected_impact: "Reducción del 80% en retrabajo de etiquetado",
      zero_investment_verified: true,
      asDraft: false,
    });
    expect(allowedSubmit.valid).toBe(true);
  });

  it("TC-MOB-008 (CA-MOB-04): getMobileQuickActionForInitiative para PARTICIPANT en DEVUELTA_PARA_AJUSTES habilita REMITIR_CORRECCION_RAPIDA", () => {
    const action = getMobileQuickActionForInitiative("PARTICIPANT", "DEVUELTA_PARA_AJUSTES");
    expect(action.actionCode).toBe("REMITIR_CORRECCION_RAPIDA");
    expect(action.isAvailable).toBe(true);
    expect(action.requiresConfirmationSheet).toBe(true);
    expect(action.thumbZonePriority).toBe("PRIMARY");
  });

  it("TC-MOB-009 (CA-MOB-04): getMobileQuickActionForInitiative para COORDINATOR en POR_APROBAR y PENDIENTE_ASIGNACION_MENTOR", () => {
    const approveAction = getMobileQuickActionForInitiative("COORDINATOR", "POR_APROBAR");
    expect(approveAction.actionCode).toBe("APROBAR_FILTRO_1TAP");
    expect(approveAction.isAvailable).toBe(true);

    const assignAction = getMobileQuickActionForInitiative(
      "COORDINATOR",
      "PENDIENTE_ASIGNACION_MENTOR"
    );
    expect(assignAction.actionCode).toBe("ASIGNAR_MENTOR_RAPIDO");
    expect(assignAction.requiresConfirmationSheet).toBe(true);
  });

  it("TC-MOB-010 (CA-MOB-04): getMobileQuickActionForInitiative para MENTOR en PENDIENTE_PLAN_IMPLEMENTACION y POR_EVALUAR", () => {
    const planAction = getMobileQuickActionForInitiative(
      "MENTOR",
      "PENDIENTE_PLAN_IMPLEMENTACION"
    );
    expect(planAction.actionCode).toBe("VALIDAR_PLAN_RAPIDO");
    expect(planAction.isAvailable).toBe(true);

    const evalAction = getMobileQuickActionForInitiative("MENTOR", "POR_EVALUAR");
    expect(evalAction.actionCode).toBe("FIRMAR_5S_Y_APROBAR_K3");
    expect(evalAction.requiresConfirmationSheet).toBe(true);
  });

  it("TC-MOB-011 (CA-MOB-05): getMobileQuickActionForInitiative bloquea a TECH_ADMIN de toda acción operativa en celular", () => {
    const techAction = getMobileQuickActionForInitiative("TECH_ADMIN", "POR_EVALUAR");
    expect(techAction.actionCode).toBe("NINGUNA_ACCION_OPERATIVA");
    expect(techAction.isAvailable).toBe(false);
    expect(techAction.thumbZonePriority).toBe("READ_ONLY");
  });
});
