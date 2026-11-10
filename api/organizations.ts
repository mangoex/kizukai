/**
 * Endpoint Serverless para Gestión de Organizaciones / Empresas (Vercel).
 * GET /api/organizations - Lista empresas clientes activas
 * POST /api/organizations - Creación de nueva empresa (exclusivo TECH_ADMIN)
 * PUT/PATCH /api/organizations - Edición de empresa cliente (exclusivo TECH_ADMIN)
 */

import { AdminEngine, UserRole } from "../src/domain/adminEngine";

export default function handler(req: any, res: any) {
  const actorRole = (req.headers["x-actor-role"] || req.query.actorRole || "TECH_ADMIN") as UserRole;
  const actorEmail = (req.headers["x-actor-email"] || req.query.actorEmail || "david.tech@kizukai.com") as string;

  if (req.method === "POST") {
    if (!AdminEngine.canUserCreateOrganization(actorRole)) {
      return res.status(403).json({
        error: "403 Forbidden",
        reason: "Solo el Administrador Técnico (TECH_ADMIN) puede crear nuevas empresas clientes."
      });
    }

    const { businessName, commercialName, taxId, industrySector, consultantId, consultantName } = req.body || {};
    if (!businessName || !commercialName) {
      return res.status(400).json({ error: "Razón social y nombre comercial son obligatorios." });
    }

    const newOrg = {
      id: `ORG-${Date.now().toString().slice(-4)}`,
      businessName: String(businessName).trim(),
      commercialName: String(commercialName).trim(),
      taxId: taxId ? String(taxId).trim() : "XAXX010101000",
      industrySector: industrySector || "Industrial",
      consultantId: consultantId ? String(consultantId).trim() : "usr-004-kasuga",
      consultantName: consultantName ? String(consultantName).trim() : "Carlos Kasuga",
      isActive: true,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      organization: newOrg,
      message: `Empresa ${newOrg.commercialName} creada exitosamente.`
    });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    if (!AdminEngine.canUserEditOrganization(actorRole)) {
      return res.status(403).json({
        error: "403 Forbidden",
        reason: "Solo el Administrador Técnico (TECH_ADMIN) puede editar empresas clientes."
      });
    }

    const { id, businessName, commercialName, taxId, industrySector, consultantId, consultantName, isActive } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "El ID de la empresa es obligatorio para actualizar." });
    }

    const updatedOrg = {
      id: String(id),
      businessName: businessName ? String(businessName).trim() : undefined,
      commercialName: commercialName ? String(commercialName).trim() : undefined,
      taxId: taxId ? String(taxId).trim() : undefined,
      industrySector: industrySector || undefined,
      consultantId: consultantId || undefined,
      consultantName: consultantName || undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      updatedBy: actorEmail,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      organization: updatedOrg,
      message: `Empresa ${id} actualizada exitosamente.`
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      total: 2,
      organizations: [
        {
          id: "ORG-A",
          businessName: "Manufactura Eléctrica del Norte S.A. de C.V.",
          commercialName: "Manufactura Norte",
          industrySector: "Automotriz y Eléctrico",
          consultantId: "usr-004-kasuga",
          consultantName: "Carlos Kasuga",
          isActive: true
        },
        {
          id: "ORG-B",
          businessName: "Alimentos y Bebidas del Bajío S.A.P.I. de C.V.",
          commercialName: "Alimentos Bajío",
          industrySector: "Alimentos y Bebidas",
          consultantId: "usr-004-kasuga",
          consultantName: "Carlos Kasuga",
          isActive: true
        }
      ]
    });
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
