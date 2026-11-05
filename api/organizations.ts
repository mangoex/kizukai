/**
 * Endpoint Serverless para Gestión de Organizaciones / Empresas (Vercel).
 * GET /api/organizations - Lista empresas clientes activas
 * POST /api/organizations - Creación de nueva empresa (exclusivo TECH_ADMIN)
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

    const { businessName, commercialName, taxId, industrySector } = req.body || {};
    if (!businessName || !commercialName) {
      return res.status(400).json({ error: "Razón social y nombre comercial son obligatorios." });
    }

    const newOrg = {
      id: `ORG-${Date.now().toString().slice(-4)}`,
      businessName: String(businessName).trim(),
      commercialName: String(commercialName).trim(),
      taxId: taxId ? String(taxId).trim() : "XAXX010101000",
      industrySector: industrySector || "Industrial",
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

  if (req.method === "GET") {
    return res.status(200).json({
      total: 2,
      organizations: [
        {
          id: "ORG-A",
          businessName: "Manufactura Eléctrica del Norte S.A. de C.V.",
          commercialName: "Manufactura Norte",
          industrySector: "Automotriz y Eléctrico",
          isActive: true
        },
        {
          id: "ORG-B",
          businessName: "Alimentos y Bebidas del Bajío S.A.P.I. de C.V.",
          commercialName: "Alimentos Bajío",
          industrySector: "Alimentos y Bebidas",
          isActive: true
        }
      ]
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}
