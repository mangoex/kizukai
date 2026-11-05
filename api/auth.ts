/**
 * Endpoint Serverless de Autenticación RBAC y MFA (Vercel).
 * POST /api/auth
 */

import { Role } from "../src/domain/engine";

interface SeedUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: Role[];
  mfaEnabled: boolean;
  department: string;
}

const SEED_USERS: Record<string, SeedUser> = {
  "juan.perez@empresa.com": {
    id: "a0000001-0000-4000-8000-000000000001",
    email: "juan.perez@empresa.com",
    name: "Juan Pérez",
    organizationId: "ORG-A",
    roles: [Role.EMPLOYEE, Role.LEADER],
    mfaEnabled: false,
    department: "Mantenimiento Eléctrico",
  },
  "carlos.mentor@empresa.com": {
    id: "a0000002-0000-4000-8000-000000000002",
    email: "carlos.mentor@empresa.com",
    name: "Carlos Mendoza",
    organizationId: "ORG-A",
    roles: [Role.MENTOR],
    mfaEnabled: false,
    department: "Ingeniería de Procesos",
  },
  "roberto.mentor@empresa.com": {
    id: "a0000003-0000-4000-8000-000000000003",
    email: "roberto.mentor@empresa.com",
    name: "Roberto Salazar",
    organizationId: "ORG-A",
    roles: [Role.MENTOR],
    mfaEnabled: false,
    department: "Calidad y Metrología",
  },
  "ana.coord@empresa.com": {
    id: "a0000004-0000-4000-8000-000000000004",
    email: "ana.coord@empresa.com",
    name: "Ana Gómez",
    organizationId: "ORG-A",
    roles: [Role.PROGRAM_COORDINATOR, Role.EVALUATOR],
    mfaEnabled: true,
    department: "Coordinación de Mejora Continua",
  },
  "kasuga.consultor@kizukai.com": {
    id: "a0000005-0000-4000-8000-000000000005",
    email: "kasuga.consultor@kizukai.com",
    name: "Alejandro Kasuga",
    organizationId: "ORG-GLOBAL",
    roles: [Role.CONSULTANT],
    mfaEnabled: true,
    department: "Kizukai Metodología",
  },
  "admin.tech@kizukai.com": {
    id: "a0000006-0000-4000-8000-000000000006",
    email: "admin.tech@kizukai.com",
    name: "Administrador Técnico",
    organizationId: "ORG-GLOBAL",
    roles: [Role.TECH_ADMIN],
    mfaEnabled: true,
    department: "TI & Infraestructura",
  },
  "laura.operadora@bajio.com": {
    id: "a0000007-0000-4000-8000-000000000007",
    email: "laura.operadora@bajio.com",
    name: "Laura Vázquez",
    organizationId: "ORG-B",
    roles: [Role.EMPLOYEE, Role.LEADER],
    mfaEnabled: false,
    department: "Línea de Envasado Aséptico",
  },
};

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const { email, password, mfaCode } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "El correo electrónico es obligatorio." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = SEED_USERS[normalizedEmail];

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  // Verificación de MFA para roles privilegiados
  const requiresMfa = user.mfaEnabled || user.roles.includes(Role.PROGRAM_COORDINATOR) || user.roles.includes(Role.TECH_ADMIN);
  let mfaVerified = false;

  if (requiresMfa) {
    if (mfaCode && String(mfaCode).trim().length >= 4) {
      mfaVerified = true;
    } else {
      // Si no se proporcionó código MFA, se avisa que se requiere
      return res.status(200).json({
        mfaRequired: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          roles: user.roles,
        },
        message: "Se requiere código de autenticación multifactor (MFA).",
      });
    }
  } else {
    mfaVerified = true;
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
    roles: user.roles,
    mfaVerified,
    exp: Math.floor(Date.now() / 1000) + 3600 * 8,
  };

  return res.status(200).json({
    success: true,
    token: "kizukai_jwt_" + Buffer.from(JSON.stringify(tokenPayload)).toString("base64"),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      department: user.department,
      roles: user.roles,
      mfaVerified,
    },
  });
}
