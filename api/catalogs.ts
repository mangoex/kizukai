/**
 * Endpoint Serverless para Catálogos Corporativos (Vercel).
 * GET /api/catalogs?type=departments|guidelines
 * POST /api/catalogs (Alta de nuevos departamentos por Coordinador/Admin)
 */

import { AdminEngine, UserRole } from "../src/domain/adminEngine";

export default function handler(req: any, res: any) {
  const actorRole = (req.headers["x-actor-role"] || req.query.actorRole || "COORDINATOR") as UserRole;
  const actorOrg = (req.headers["x-actor-org"] || req.query.actorOrg || "ORG-A") as string;

  if (req.method === "GET") {
    const { type, organizationId } = req.query || {};
    const orgTarget = organizationId || actorOrg;

    if (type === "guidelines") {
      return res.status(200).json({
        total: AdminEngine.STRATEGIC_GUIDELINES.length,
        guidelines: AdminEngine.STRATEGIC_GUIDELINES
      });
    }

    // Por defecto retorna departamentos prellenados
    const depts = [
      { id: "dept-01", organizationId: "ORG-A", name: "Ensamble y Troquelado", branchOffice: "Planta Norte" },
      { id: "dept-02", organizationId: "ORG-A", name: "Troquelado y Prensas", branchOffice: "Planta Norte" },
      { id: "dept-03", organizationId: "ORG-A", name: "Mantenimiento y Servicios", branchOffice: "Planta Norte" },
      { id: "dept-04", organizationId: "ORG-A", name: "Devanado y Bobinado", branchOffice: "Planta Norte" },
      { id: "dept-05", organizationId: "ORG-A", name: "Empaque y Almacén", branchOffice: "Planta Norte" },
      { id: "dept-06", organizationId: "ORG-A", name: "Pintura y Acabados", branchOffice: "Planta Norte" },
      { id: "dept-07", organizationId: "ORG-B", name: "Línea de Envasado Aséptico", branchOffice: "Planta Bajío" },
      { id: "dept-08", organizationId: "ORG-B", name: "Silos y Granos", branchOffice: "Planta Bajío" },
      { id: "dept-09", organizationId: "ORG-B", name: "Mantenimiento General", branchOffice: "Planta Bajío" }
    ];

    const filtered = orgTarget === "ALL" ? depts : depts.filter((d) => d.organizationId === orgTarget);

    return res.status(200).json({
      organizationId: orgTarget,
      total: filtered.length,
      departments: filtered,
      guidelines: AdminEngine.STRATEGIC_GUIDELINES
    });
  }

  if (req.method === "POST") {
    const { organizationId, name, branchOffice } = req.body || {};
    const orgTarget = organizationId || actorOrg;

    if (!AdminEngine.canUserManageDepartments(actorRole, actorOrg, orgTarget)) {
      return res.status(403).json({
        error: "403 Forbidden",
        reason: "No tienes autorización para agregar departamentos a esta organización."
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "El nombre del departamento es obligatorio." });
    }

    const newDept = {
      id: `dept-${Date.now().toString().slice(-5)}`,
      organizationId: orgTarget,
      name: String(name).trim(),
      branchOffice: branchOffice ? String(branchOffice).trim() : "Planta Principal"
    };

    return res.status(201).json({
      success: true,
      department: newDept,
      message: `Departamento ${newDept.name} creado exitosamente.`
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
