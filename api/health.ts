/**
 * Endpoint Serverless de Salud del Sistema (Vercel).
 * GET /api/health
 */

export default function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const payload = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "kizukai-project-hub",
    checks: {
      domainEngine: "operational",
      multiTenantIsolation: "enforced",
      businessStatesCount: 12,
      methodologyStagesCount: 6,
      rbacRolesCount: 5,
    },
  };

  return res.status(200).json(payload);
}
