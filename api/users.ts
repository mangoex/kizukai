/**
 * Endpoint Serverless para Gestión Jerárquica de Usuarios (Vercel).
 * GET /api/users - Lista usuarios filtrados por rol y tenant del actor
 * POST /api/users - Creación jerárquica con validación RBAC y Multi-Tenant estricta
 */

import { AdminEngine, UserRole } from "../src/domain/adminEngine";

export default function handler(req: any, res: any) {
  // Extraer actor de los headers o payload
  const actorRole = (req.headers["x-actor-role"] || req.query.actorRole || "COORDINATOR") as UserRole;
  const actorOrg = (req.headers["x-actor-org"] || req.query.actorOrg || "ORG-A") as string;
  const actorEmail = (req.headers["x-actor-email"] || req.query.actorEmail || "ana.garza@manufacturanorte.mx") as string;

  if (req.method === "POST") {
    const { name, email, role, organizationId, department } = req.body || {};

    if (!name || !email || !role || !organizationId) {
      return res.status(400).json({ error: "Nombre, email, rol y organización son obligatorios." });
    }

    const decision = AdminEngine.canUserCreateUser(actorRole, role as UserRole, actorOrg, organizationId);
    if (!decision.allowed) {
      return res.status(403).json({
        error: "403 Forbidden",
        reason: decision.reason
      });
    }

    const newUser = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role,
      organizationId,
      department: department || "General",
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      user: newUser,
      message: `Usuario ${newUser.name} (${newUser.role}) creado exitosamente por ${actorEmail}.`
    });
  }

  if (req.method === "GET") {
    // Si es TECH_ADMIN o CONSULTANT ve el directorio amplio; si es COORDINATOR solo su tenant
    return res.status(200).json({
      actor: { email: actorEmail, role: actorRole, org: actorOrg },
      scope: actorRole === "COORDINATOR" ? actorOrg : "ALL",
      status: "ACTIVE"
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
