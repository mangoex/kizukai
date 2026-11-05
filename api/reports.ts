/**
 * Endpoint Serverless de Exportación de Reportes A, B y C (Vercel).
 * GET /api/reports?type=REPORT_C&format=xlsx
 * POST /api/reports
 */

import {
  KizukaiEngine,
  UserContext,
  Role,
  KizukaiDomainException,
} from "../src/domain/engine";

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
          roles: parsed.roles || [Role.PROGRAM_COORDINATOR],
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

  const orgHeader = req.headers["x-organization-id"] || "ORG-A";
  const emailHeader = req.headers["x-actor-email"] || "ana.coord@empresa.com";
  const rolesHeader = req.headers["x-actor-roles"];
  const mfaHeader = req.headers["x-mfa-verified"] !== "false";

  let roles: Role[] = [Role.PROGRAM_COORDINATOR];
  if (rolesHeader) {
    roles = String(rolesHeader).split(",").map((r) => r.trim() as Role);
  }

  return {
    userId: "usr-coord-default",
    email: emailHeader,
    organizationId: String(orgHeader),
    roles,
    mfaVerified: mfaHeader,
  };
}

export default function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const actor = extractActor(req);
  const query = req.query || {};
  const body = req.body || {};

  const reportType = query.type || body.type || "REPORT_C";
  const format = String(query.format || body.format || "xlsx").toLowerCase();

  try {
    if (format === "csv") {
      const csvData = globalEngine.exportReportCsv({ actor });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${reportType}_${actor.organizationId}.csv"`
      );
      return res.status(200).send(csvData);
    }

    if (format === "xlsx") {
      const report = globalEngine.exportReportCXlsx({ actor });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${report.fileName}"`
      );
      return res.status(200).send(Buffer.from(report.payloadBytes));
    }

    // Formato JSON por defecto
    const report = globalEngine.exportReportCXlsx({ actor });
    return res.status(200).json({
      reportType,
      fileName: report.fileName,
      totalRecords: report.totalRecords,
      organizationId: report.organizationId,
      requestedBy: report.requestedBy,
      generatedAtUtc: report.generatedAtUtc,
      rows: report.rows,
    });
  } catch (err: any) {
    if (err instanceof KizukaiDomainException) {
      return res.status(err.httpStatus).json({
        error: err.message,
        code: err.code,
      });
    }
    return res.status(500).json({
      error: err.message || "Error al exportar reporte.",
    });
  }
}
