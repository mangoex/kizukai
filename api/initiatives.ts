/**
 * Endpoint Serverless de Gestión de Iniciativas y Flujo de Estados (Vercel).
 * GET /api/initiatives
 * POST /api/initiatives
 */

import {
  KizukaiEngine,
  UserContext,
  Role,
  ProgramType,
  InitiativeState,
  KizukaiDomainException,
} from "../src/domain/engine";

// Singleton en memoria para ambiente Serverless con datos semilla
const globalEngine = KizukaiEngine.createWithDemoSeed();

function extractActor(req: any): UserContext {
  const authHeader = req.headers["authorization"] || req.headers["x-kizukai-actor"];
  if (authHeader) {
    try {
      if (authHeader.startsWith("Bearer kizukai_jwt_")) {
        const b64 = authHeader.replace("Bearer kizukai_jwt_", "");
        const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
        return {
          userId: parsed.sub || parsed.userId,
          email: parsed.email,
          organizationId: parsed.organizationId,
          roles: parsed.roles || [Role.EMPLOYEE],
          mfaVerified: Boolean(parsed.mfaVerified),
        };
      }
      if (typeof authHeader === "string" && authHeader.startsWith("{")) {
        return JSON.parse(authHeader);
      }
    } catch {
      // fallback
    }
  }

  // Actor por defecto para conveniencia en pruebas / demo
  const orgHeader = req.headers["x-organization-id"] || "ORG-A";
  const emailHeader = req.headers["x-actor-email"] || "juan.perez@empresa.com";
  const rolesHeader = req.headers["x-actor-roles"];
  const mfaHeader = req.headers["x-mfa-verified"] === "true";

  let roles: Role[] = [Role.EMPLOYEE, Role.LEADER];
  if (rolesHeader) {
    roles = String(rolesHeader).split(",").map((r) => r.trim() as Role);
  }

  return {
    userId: "usr-default",
    email: emailHeader,
    organizationId: String(orgHeader),
    roles,
    mfaVerified: mfaHeader,
  };
}

export default function handler(req: any, res: any) {
  const actor = extractActor(req);

  try {
    if (req.method === "GET") {
      const { id, action } = req.query || {};

      if (id) {
        if (action === "next_action_card") {
          const card = globalEngine.getNextActionCard({ actor, initiativeId: String(id) });
          return res.status(200).json(card);
        }
        const initiative = globalEngine.getInitiative({ actor, initiativeId: String(id) });
        return res.status(200).json(initiative);
      }

      // Listar iniciativas del tenant
      const initiatives = globalEngine.listInitiatives({ actor });
      return res.status(200).json({
        total: initiatives.length,
        organizationId: actor.organizationId,
        initiatives,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const action = body.action || req.query.action;

      switch (action) {
        case "create": {
          const { title, department, program, zeroInvestmentConfirmed, capexAmount } = body;
          const created = globalEngine.createInitiative({
            actor,
            title,
            department,
            program: program || ProgramType.K2,
            zeroInvestmentConfirmed: Boolean(zeroInvestmentConfirmed),
            capexAmount: Number(capexAmount || 0),
          });
          return res.status(201).json(created);
        }

        case "submit_for_approval": {
          const { initiativeId } = body;
          const updated = globalEngine.submitForApproval({ actor, initiativeId });
          return res.status(200).json(updated);
        }

        case "transition_state": {
          const { initiativeId, targetState, notes } = body;
          const updated = globalEngine.transitionState({
            actor,
            initiativeId,
            targetState: targetState as InitiativeState,
            notes,
          });
          return res.status(200).json(updated);
        }

        case "assign_mentor": {
          const { initiativeId, mentorEmail } = body;
          const updated = globalEngine.assignMentor({ actor, initiativeId, mentorEmail });
          return res.status(200).json(updated);
        }

        case "upload_evidence": {
          const { initiativeId, fileName, contentHash } = body;
          const evidence = globalEngine.uploadEvidence({
            actor,
            initiativeId,
            fileName,
            contentHash: contentHash || "hash-" + Date.now(),
          });
          return res.status(201).json(evidence);
        }

        case "submit_for_evaluation": {
          const { initiativeId } = body;
          const updated = globalEngine.submitForEvaluation({ actor, initiativeId });
          return res.status(200).json(updated);
        }

        case "return_for_adjustments": {
          const { initiativeId, feedbackComment } = body;
          const updated = globalEngine.returnForAdjustments({
            actor,
            initiativeId,
            feedbackComment,
          });
          return res.status(200).json(updated);
        }

        case "resume_from_adjustments": {
          const { initiativeId } = body;
          const updated = globalEngine.resumeFromAdjustments({ actor, initiativeId });
          return res.status(200).json(updated);
        }

        case "approve_evaluation": {
          const { initiativeId, gemba5sCompleted, financeValidated } = body;
          const updated = globalEngine.approveEvaluation({
            actor,
            initiativeId,
            gemba5sCompleted: Boolean(gemba5sCompleted),
            financeValidated: Boolean(financeValidated),
          });
          return res.status(200).json(updated);
        }

        case "register_plan": {
          const { initiativeId, startDate, endDate, activities } = body;
          const updated = globalEngine.registerImplementationPlan({
            actor,
            initiativeId,
            startDate,
            endDate,
            activities: activities || [],
          });
          return res.status(200).json(updated);
        }

        default:
          return res.status(400).json({ error: `Acción '${action}' no reconocida.` });
      }
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  } catch (err: any) {
    if (err instanceof KizukaiDomainException) {
      return res.status(err.httpStatus).json({
        error: err.message,
        code: err.code,
      });
    }
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
}
