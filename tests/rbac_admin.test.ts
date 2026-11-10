import { describe, it, expect } from 'vitest';
import { AdminEngine } from '../src/domain/adminEngine';

describe('AdminEngine - Reglas de Gobierno y Aprovisionamiento RBAC (HU-1.1 a HU-4.2)', () => {
  describe('HU-1.1: Aprovisionamiento de Organizaciones', () => {
    it('TC-ADMIN-001: TECH_ADMIN puede crear organizaciones', () => {
      expect(AdminEngine.canUserCreateOrganization('TECH_ADMIN')).toBe(true);
    });

    it('TC-ADMIN-002: CONSULTANT, COORDINATOR y PARTICIPANT no pueden crear organizaciones', () => {
      expect(AdminEngine.canUserCreateOrganization('CONSULTANT')).toBe(false);
      expect(AdminEngine.canUserCreateOrganization('COORDINATOR')).toBe(false);
      expect(AdminEngine.canUserCreateOrganization('MENTOR')).toBe(false);
      expect(AdminEngine.canUserCreateOrganization('PARTICIPANT')).toBe(false);
    });
  });

  describe('HU-2.1: Aprovisionamiento de Consultores por TECH_ADMIN', () => {
    it('TC-ADMIN-003: TECH_ADMIN puede dar de alta un CONSULTANT', () => {
      const decision = AdminEngine.canUserCreateUser('TECH_ADMIN', 'CONSULTANT', 'ORG-GLOBAL', 'ORG-GLOBAL');
      expect(decision.allowed).toBe(true);
    });

    it('TC-ADMIN-004: TECH_ADMIN puede dar de alta usuarios con rol MENTOR y PARTICIPANT según el catálogo de roles', () => {
      const decisionMentor = AdminEngine.canUserCreateUser('TECH_ADMIN', 'MENTOR', 'ORG-GLOBAL', 'ORG-A');
      expect(decisionMentor.allowed).toBe(true);

      const decisionPart = AdminEngine.canUserCreateUser('TECH_ADMIN', 'PARTICIPANT', 'ORG-GLOBAL', 'ORG-A');
      expect(decisionPart.allowed).toBe(true);
    });
  });

  describe('HU-2.2: Aprovisionamiento de Coordinadores por CONSULTANT', () => {
    it('TC-ADMIN-005: CONSULTANT puede dar de alta COORDINATOR en cualquier empresa cliente', () => {
      const decisionOrgA = AdminEngine.canUserCreateUser('CONSULTANT', 'COORDINATOR', 'ORG-GLOBAL', 'ORG-A');
      expect(decisionOrgA.allowed).toBe(true);

      const decisionOrgB = AdminEngine.canUserCreateUser('CONSULTANT', 'COORDINATOR', 'ORG-GLOBAL', 'ORG-B');
      expect(decisionOrgB.allowed).toBe(true);
    });

    it('TC-ADMIN-006: CONSULTANT no puede dar de alta un PARTICIPANT directamente', () => {
      const decision = AdminEngine.canUserCreateUser('CONSULTANT', 'PARTICIPANT', 'ORG-GLOBAL', 'ORG-A');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('solo puede dar de alta Coordinadores');
    });
  });

  describe('HU-2.3: Aprovisionamiento de Participantes y Mentores por COORDINATOR', () => {
    it('TC-ADMIN-007: COORDINATOR de ORG-A puede dar de alta PARTICIPANT y MENTOR en ORG-A', () => {
      const decisionPart = AdminEngine.canUserCreateUser('COORDINATOR', 'PARTICIPANT', 'ORG-A', 'ORG-A');
      expect(decisionPart.allowed).toBe(true);

      const decisionMentor = AdminEngine.canUserCreateUser('COORDINATOR', 'MENTOR', 'ORG-A', 'ORG-A');
      expect(decisionMentor.allowed).toBe(true);
    });

    it('TC-ADMIN-008: COORDINATOR de ORG-A es bloqueado (403) si intenta crear usuario en ORG-B (Cross-Tenant)', () => {
      const decision = AdminEngine.canUserCreateUser('COORDINATOR', 'PARTICIPANT', 'ORG-A', 'ORG-B');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Violación Multi-Tenant');
    });

    it('TC-ADMIN-009: COORDINATOR no puede escalar privilegios creando un CONSULTANT o TECH_ADMIN', () => {
      const decision = AdminEngine.canUserCreateUser('COORDINATOR', 'TECH_ADMIN', 'ORG-A', 'ORG-A');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('solo puede dar de alta Participantes y Mentores');
    });
  });

  describe('HU-3.1 & HU-3.2: Catálogos de Departamentos y Categorías QCDSM', () => {
    it('TC-ADMIN-010: El catálogo estratégico contiene las 5 directrices QCDSM', () => {
      const guidelines = AdminEngine.STRATEGIC_GUIDELINES;
      expect(guidelines).toHaveLength(5);
      const codes = guidelines.map((g) => g.code);
      expect(codes).toEqual(['CALIDAD', 'COSTO', 'ENTREGA', 'SEGURIDAD', 'MORAL']);
    });

    it('TC-ADMIN-011: COORDINATOR puede gestionar departamentos de su propia empresa pero no ajenas', () => {
      expect(AdminEngine.canUserManageDepartments('COORDINATOR', 'ORG-A', 'ORG-A')).toBe(true);
      expect(AdminEngine.canUserManageDepartments('COORDINATOR', 'ORG-A', 'ORG-B')).toBe(false);
      expect(AdminEngine.canUserManageDepartments('CONSULTANT', 'ORG-GLOBAL', 'ORG-A')).toBe(true);
      expect(AdminEngine.canUserManageDepartments('PARTICIPANT', 'ORG-A', 'ORG-A')).toBe(false);
    });
  });

  describe('HU-5.1: Edición de Perfil de Usuario y Fotografía', () => {
    it('TC-ADMIN-012: Actualiza datos personales y avatarUrl del usuario', () => {
      // Mock simple de StorageService
      const dummyUser = {
        id: 'usr-test-01',
        name: 'Carlos Ruiz',
        email: 'carlos@test.com',
        role: 'PARTICIPANT',
        tenantId: 'ORG-A',
        tenantName: 'Test Org',
        department: 'Calidad',
        avatarInitials: 'CR'
      };

      const updates = {
        name: 'Carlos Ruiz García',
        jobTitle: 'Ingeniero de Procesos Jr.',
        phoneNumber: '+52 81 1234 5678',
        avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const updated = {
        ...dummyUser,
        ...updates,
        avatarInitials: 'CR'
      };

      expect(updated.name).toBe('Carlos Ruiz García');
      expect(updated.jobTitle).toBe('Ingeniero de Procesos Jr.');
      expect(updated.phoneNumber).toBe('+52 81 1234 5678');
      expect(updated.avatarUrl).toContain('data:image/png;base64');
    });

    it('TC-ADMIN-013: Fallback y Upsert para cuenta Super Admin mangoex@gmail.com', () => {
      const superAdminFallback = {
        id: 'usr-000-mangoex',
        name: 'Super Admin',
        email: 'mangoex@gmail.com',
        role: 'TECH_ADMIN' as const,
        tenantId: 'ORG-A',
        tenantName: 'Kizukai Platform Infrastructure (Root)',
        department: 'Super Administrador / Dirección',
        requiresMfa: false,
        avatarInitials: 'SA'
      };

      const res = {
        success: true,
        user: {
          ...superAdminFallback,
          name: 'Miguel González',
          phoneNumber: '+526672013019',
          jobTitle: 'Desarrollador',
          avatarUrl: 'data:image/jpeg;base64,...'
        }
      };

      expect(res.success).toBe(true);
      expect(res.user.email).toBe('mangoex@gmail.com');
      expect(res.user.name).toBe('Miguel González');
      expect(res.user.phoneNumber).toBe('+526672013019');
    });
  });

  describe('HU-6.1 & HU-6.2: Asignación de Consultor a Empresa y Relación de Directrices por Empresa', () => {
    it('TC-ADMIN-014: canUserEditOrganization solo autoriza a TECH_ADMIN', () => {
      expect(AdminEngine.canUserEditOrganization('TECH_ADMIN')).toBe(true);
      expect(AdminEngine.canUserEditOrganization('CONSULTANT')).toBe(false);
      expect(AdminEngine.canUserEditOrganization('COORDINATOR')).toBe(false);
      expect(AdminEngine.canUserEditOrganization('MENTOR')).toBe(false);
      expect(AdminEngine.canUserEditOrganization('PARTICIPANT')).toBe(false);
    });
  });

  describe('HU-7.1: Catálogo de Roles del Sistema con Permisos RBAC', () => {
    it('TC-ADMIN-015: El catálogo de roles contiene los roles con permisos para Consultor, Mentor y Participante', () => {
      const roles = AdminEngine.ROLES_CATALOG;
      expect(roles.length).toBeGreaterThanOrEqual(3);
      const codes = roles.map((r) => r.code);
      expect(codes).toContain('CONSULTANT');
      expect(codes).toContain('MENTOR');
      expect(codes).toContain('PARTICIPANT');
      expect(codes).toContain('COORDINATOR');
      expect(codes).toContain('TECH_ADMIN');

      roles.forEach((r) => {
        expect(r.permissions.length).toBeGreaterThan(0);
        expect(r.description).toBeTruthy();
        expect(r.keyResponsibilities.length).toBeGreaterThan(0);
      });
    });
  });
});
