/**
 * Kizukai Client SDK (TypeScript).
 * Facilita la interacción con el motor de dominio y la API Serverless,
 * implementando las historias de usuario de alto nivel (HU-01 a HU-05)
 * y operaciones del ciclo de vida de iniciativas de mejora continua.
 */

import {
  KizukaiEngine,
  Initiative,
  InitiativeState,
  ProgramType,
  Role,
  UserContext,
  NextActionCard,
  ReportResult,
  EvidenceRecord,
  FinancialMetrics,
} from "../domain/engine";

export class KizukaiClient {
  private engine: KizukaiEngine;

  constructor(engine?: KizukaiEngine) {
    this.engine = engine || KizukaiEngine.createWithDemoSeed();
  }

  public getEngine(): KizukaiEngine {
    return this.engine;
  }

  /**
   * HU-01: Registro y envío inmediato de iniciativa proactiva K2 (Cero Inversión).
   */
  public registerAndSubmitK2Initiative(params: {
    actor: UserContext;
    title: string;
    department: string;
    zeroInvestmentConfirmed: boolean;
    capexAmount?: number;
  }): Initiative {
    const draft = this.engine.createInitiative({
      actor: params.actor,
      title: params.title,
      department: params.department,
      program: ProgramType.K2,
      zeroInvestmentConfirmed: params.zeroInvestmentConfirmed,
      capexAmount: params.capexAmount ?? 0,
    });

    return this.engine.submitForApproval({
      actor: params.actor,
      initiativeId: draft.id,
    });
  }

  /**
   * HU-02: Devolución no destructiva de entregable para ajustes técnicos.
   */
  public returnDeliverableForAdjustments(params: {
    actor: UserContext;
    initiativeId: string;
    feedbackComment: string;
  }): Initiative {
    return this.engine.returnForAdjustments({
      actor: params.actor,
      initiativeId: params.initiativeId,
      feedbackComment: params.feedbackComment,
    });
  }

  /**
   * HU-03: Asignación de mentor calificado dentro del mismo tenant.
   */
  public assignMentor(params: {
    actor: UserContext;
    initiativeId: string;
    mentorEmail: string;
  }): Initiative {
    return this.engine.assignMentor({
      actor: params.actor,
      initiativeId: params.initiativeId,
      mentorEmail: params.mentorEmail,
    });
  }

  /**
   * HU-04: Consulta de Tarjeta de Próxima Acción Requerida.
   */
  public getNextActionCard(params: {
    actor: UserContext;
    initiativeId: string;
  }): NextActionCard {
    return this.engine.getNextActionCard({
      actor: params.actor,
      initiativeId: params.initiativeId,
    });
  }

  /**
   * HU-05: Exportación de Reporte C con auditoría y aislamiento de tenant.
   */
  public exportReportCXlsx(params: { actor: UserContext }): ReportResult {
    return this.engine.exportReportCXlsx({
      actor: params.actor,
    });
  }

  // --------------------------------------------------------------------------
  // Métodos enriquecidos para la aplicación web y Vercel Serverless
  // --------------------------------------------------------------------------

  public listInitiatives(actor: UserContext): Initiative[] {
    return this.engine.listInitiatives({ actor });
  }

  public getInitiative(actor: UserContext, initiativeId: string): Initiative {
    return this.engine.getInitiative({ actor, initiativeId });
  }

  public uploadEvidence(params: {
    actor: UserContext;
    initiativeId: string;
    fileName: string;
    contentHash: string;
  }): EvidenceRecord {
    return this.engine.uploadEvidence(params);
  }

  public submitForEvaluation(actor: UserContext, initiativeId: string): Initiative {
    return this.engine.submitForEvaluation({ actor, initiativeId });
  }

  public approveEvaluation(params: {
    actor: UserContext;
    initiativeId: string;
    gemba5sCompleted: boolean;
    financeValidated: boolean;
  }): Initiative {
    return this.engine.approveEvaluation(params);
  }

  public calculateRoi(params: {
    annualGrossSavings: number;
    implementationOperationalCost: number;
    capexAmount?: number;
    sustainabilityFactor?: number;
  }): FinancialMetrics {
    return this.engine.calculateFinancialImpact(params);
  }

  public exportReportCsv(actor: UserContext): string {
    return this.engine.exportReportCsv({ actor });
  }
}
