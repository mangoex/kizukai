/**
 * Suite de Pruebas Unitarias TDD / BDD — Mejoras y Correcciones del MVP (Revisión Alejandra Monge).
 * Específicamente cubre:
 * - UA-FUN-001: Aislamiento estricto multi-tenant de directrices estratégicas en StorageService.
 * - COOR-UX-001 a COOR-UX-005: Nomenclatura profesional de bandejas del Coordinador sin emojis informales.
 * - COOR-FUN-001 / COOR-FUN-002 / COOR-UX-009 / COOR-UX-010: Asignación explícita de mentor e indicador "+7 días".
 * - WS-UX-001 a WS-UX-005: Las 5 pestañas simplificadas del Workspace ("Diagnóstico y línea base", "Plan de trabajo", "Evidencias", "Observaciones", "Bitácora").
 * - WS-FUN-001: Desacople de la auditoría 5S del Workspace en favor de retroalimentación formativa.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/storageService';
import * as mobileEngine from '../src/domain/mobileUxEngine';
import {
  getMobileRoleProfile,
  getMobileQuickActionForInitiative,
} from '../src/domain/mobileUxEngine';
import { User, Initiative } from '../src/types/index';

// Polyfill in-memory localStorage para entorno de pruebas Node / Vitest
if (typeof globalThis.localStorage === 'undefined') {
  let inMemoryStore: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (key in inMemoryStore ? inMemoryStore[key] : null),
    setItem: (key: string, value: string) => {
      inMemoryStore[key] = String(value);
    },
    removeItem: (key: string) => {
      delete inMemoryStore[key];
    },
    clear: () => {
      inMemoryStore = {};
    },
    key: (index: number) => Object.keys(inMemoryStore)[index] || null,
    length: 0,
  } as Storage;
}

describe('TDD Suite: Propuesta de Mejoras MVP Alejandra Monge (Noviembre 2026)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // UA-FUN-001: AISLAMIENTO MULTI-TENANT DE DIRECTRICES ESTRATÉGICAS
  // ==========================================================================
  describe('UA-FUN-001: Aislamiento Estricto Multi-Tenant de Directrices Estratégicas en StorageService', () => {
    const adminOrgA: User = {
      id: 'usr-admin-org-a',
      name: 'Admin Planta A',
      email: 'admin@plantanorte.com',
      role: 'TECH_ADMIN',
      tenantId: 'ORG-A',
      tenantName: 'Manufactura Norte (ORG-A)',
      requiresMfa: false,
      avatarInitials: 'AN',
    };

    const adminOrgB: User = {
      id: 'usr-admin-org-b',
      name: 'Admin Planta B',
      email: 'admin@alimentosbajio.com',
      role: 'TECH_ADMIN',
      tenantId: 'ORG-B',
      tenantName: 'Alimentos Bajío (ORG-B)',
      requiresMfa: false,
      avatarInitials: 'AB',
    };

    /**
     * Criterio Gherkin:
     *   Dado que se consultan las directrices estratégicas para un tenant específico 'ORG-A'
     *   Cuando StorageService.getGuidelines('ORG-A') es invocado
     *   Entonces todas las directrices retornadas deben pertenecer exclusivamente al tenant 'ORG-A'
     */
    it('TC-EXP-001 (UA-FUN-001): getGuidelines("ORG-A") sólo retorna directrices asociadas a ORG-A con tenantId explícito', () => {
      const guidelinesOrgA = StorageService.getGuidelines('ORG-A');
      expect(guidelinesOrgA).toBeDefined();
      expect(guidelinesOrgA.length).toBeGreaterThan(0);

      // Cada directriz debe tener su tenantId explícito 'ORG-A'
      const allBelongToOrgA = guidelinesOrgA.every(
        (g: any) => g.tenantId === 'ORG-A'
      );
      expect(allBelongToOrgA).toBe(true);
    });

    /**
     * Criterio Gherkin:
     *   Dado que se consultan directrices de 'ORG-B'
     *   Cuando StorageService.getGuidelines('ORG-B') es invocado
     *   Entonces sólo retorna directrices de 'ORG-B' y no contiene directrices exclusivas de 'ORG-A'
     */
    it('TC-EXP-002 (UA-FUN-001): getGuidelines("ORG-B") retorna catálogo aislado de ORG-B sin contaminación de ORG-A', () => {
      const guidelinesOrgB = StorageService.getGuidelines('ORG-B');
      expect(guidelinesOrgB).toBeDefined();
      expect(guidelinesOrgB.length).toBeGreaterThan(0);

      const allBelongToOrgB = guidelinesOrgB.every(
        (g: any) => g.tenantId === 'ORG-B'
      );
      expect(allBelongToOrgB).toBe(true);
    });

    /**
     * Criterio Gherkin:
     *   Dado un usuario administrador autenticado en 'ORG-A'
     *   Cuando crea una nueva directriz estratégica
     *   Entonces la directriz es persistida con tenantId 'ORG-A' y queda visible para 'ORG-A'
     */
    it('TC-EXP-003 (UA-FUN-001): createGuideline asocia automáticamente el tenantId del actor a la directriz', () => {
      const result = StorageService.createGuideline(adminOrgA, {
        code: 'INNOVACION_GEMBA_A',
        letter: 'I',
        name: 'Innovación Gemba Planta Norte',
        description: 'Directriz propia de Manufactura Norte',
        tenantId: 'ORG-A',
      } as any);

      expect(result.success).toBe(true);
      expect(result.guideline).toBeDefined();
      expect(result.guideline.tenantId).toBe('ORG-A');

      const orgAList = StorageService.getGuidelines('ORG-A');
      const foundInA = orgAList.some((g: any) => g.code === 'INNOVACION_GEMBA_A');
      expect(foundInA).toBe(true);
    });

    /**
     * Criterio Gherkin:
     *   Dado que una directriz fue creada en 'ORG-A'
     *   Cuando un usuario de 'ORG-B' consulta las directrices de su empresa
     *   Entonces la directriz de 'ORG-A' NO debe aparecer en el listado de 'ORG-B'
     */
    it('TC-EXP-004 (UA-FUN-001): Un tenant no puede consultar directrices configuradas por otro tenant', () => {
      // Crear en ORG-A
      StorageService.createGuideline(adminOrgA, {
        code: 'SEGURIDAD_CRITICA_A',
        letter: 'S',
        name: 'Seguridad Crítica Línea Prensa',
        description: 'Exclusiva de Planta A',
        tenantId: 'ORG-A',
      } as any);

      // Consultar desde ORG-B
      const orgBList = StorageService.getGuidelines('ORG-B');
      const leakedIntoB = orgBList.some((g: any) => g.code === 'SEGURIDAD_CRITICA_A');
      expect(leakedIntoB).toBe(false);
    });

    /**
     * Criterio Gherkin:
     *   Dado una directriz existente en 'ORG-A'
     *   Cuando un usuario de 'ORG-B' intenta modificarla o eliminarla
     *   Entonces la operación es rechazada con un error de aislamiento multi-tenant
     */
    it('TC-EXP-005 (UA-FUN-001): Prevención estricta de modificación o eliminación cross-tenant', () => {
      // Crear directriz en ORG-A
      const createRes = StorageService.createGuideline(adminOrgA, {
        code: 'CALIDAD_MOTOR_A',
        letter: 'Q',
        name: 'Calidad Ensamble Motores',
        description: 'Control de par de apriete',
        tenantId: 'ORG-A',
      } as any);
      expect(createRes.success).toBe(true);

      // Intentar modificar desde ORG-B
      const updateFn = (StorageService as any).updateGuideline;
      expect(updateFn).toBeDefined();

      const updateResult = updateFn.call(
        StorageService,
        adminOrgB,
        'CALIDAD_MOTOR_A',
        { name: 'Modificación no autorizada por Planta B' }
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toMatch(/multi-tenant|403|aislamiento|no autorizado/i);
    });
  });

  // ==========================================================================
  // COOR-UX-001 A COOR-UX-005: BANDEJAS DEL COORDINADOR
  // ==========================================================================
  describe('COOR-UX-001 a COOR-UX-005: Nomenclatura Profesional de Bandejas del Coordinador', () => {
    /**
     * Criterio Gherkin:
     *   Dado el perfil móvil del Coordinador de Empresa
     *   Cuando se recupera getMobileRoleProfile("COORDINATOR")
     *   Entonces el modo y la acción primaria deben sustituir "Triage Operativo" por "Revisión y asignación de iniciativas"
     */
    it('TC-EXP-006 (COOR-UX-001): Elimina el término "Triage Operativo" en favor de "Revisión y asignación de iniciativas"', () => {
      const profile = getMobileRoleProfile('COORDINATOR');

      expect(profile.modeTitle).not.toMatch(/triage/i);
      expect(profile.primaryCtaLabel).toBe('Revisión y asignación de iniciativas');
      expect(profile.bottomNavItems[0].label).not.toMatch(/triage/i);
    });

    /**
     * Criterio Gherkin:
     *   Dado el perfil del Coordinador
     *   Cuando se evalúan las píldoras de navegación rápida
     *   Entonces deben incluirse las denominaciones simplificadas:
     *     - "Pendientes de revisión técnica"
     *     - "Pendientes de asignar mentor"
     *     - "Sin avances en más de 7 días"
     *     - "Grupo 2026"
     */
    it('TC-EXP-007 (COOR-UX-002 a COOR-UX-005): Píldoras de bandeja usan etiquetas simplificadas y humanas', () => {
      const profile = getMobileRoleProfile('COORDINATOR');

      // COOR-UX-002: En lugar de "Filtro Técnico"
      expect(profile.quickPills).toContain('Pendientes de revisión técnica');

      // COOR-UX-003: En lugar de "Sin Mentor"
      expect(profile.quickPills).toContain('Pendientes de asignar mentor');

      // COOR-UX-004: En lugar de "Estancadas (>7d)" o "Alerta > 7d"
      expect(profile.quickPills).toContain('Sin avances en más de 7 días');

      // COOR-UX-005: En lugar de "Cohorte 2026"
      expect(profile.quickPills).toContain('Grupo 2026');
    });

    /**
     * Criterio Gherkin:
     *   Dado las etiquetas de las bandejas del Coordinador
     *   Cuando se analiza el texto de sus labels primarios
     *   Entonces no deben contener emojis informales
     */
    it('TC-EXP-008 (COOR-UI-001): Ausencia de emojis informales en los labels primarios de las bandejas', () => {
      const coordinatorQueues = (mobileEngine as any).COORDINATOR_QUEUES;
      expect(coordinatorQueues).toBeDefined();

      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

      coordinatorQueues.forEach((q: any) => {
        expect(emojiRegex.test(q.label)).toBe(false);
        if (q.icon) {
          expect(emojiRegex.test(q.icon)).toBe(false);
        }
      });
    });

    /**
     * Criterio Gherkin:
     *   Dado el motor de bandejas del Coordinador
     *   Cuando se consulta la definición de bandejas COORDINATOR_QUEUES
     *   Entonces expone las 4 bandejas canónicas con sus identificadores, labels y descripciones estandarizadas
     */
    it('TC-EXP-009 (COOR-UX-001 a COOR-UX-005): Catálogo COORDINATOR_QUEUES expone las bandejas canónicas', () => {
      const coordinatorQueues = (mobileEngine as any).COORDINATOR_QUEUES;
      expect(coordinatorQueues).toBeDefined();
      expect(Array.isArray(coordinatorQueues)).toBe(true);
      expect(coordinatorQueues).toHaveLength(4);

      const labels = coordinatorQueues.map((q: any) => q.label);
      expect(labels).toContain('Pendientes de revisión técnica');
      expect(labels).toContain('Pendientes de asignar mentor');
      expect(labels).toContain('Sin avances en más de 7 días');
      expect(labels).toContain('Grupo 2026');
    });
  });

  // ==========================================================================
  // COOR-FUN-001 / COOR-FUN-002 / COOR-UX-009 / COOR-UX-010: ACCIONES Y DÍAS
  // ==========================================================================
  describe('COOR-FUN-001 / COOR-FUN-002 / COOR-UX-009 / COOR-UX-010: Asignación Explícita e Indicador +7 Días', () => {
    /**
     * Criterio Gherkin:
     *   Dado que una iniciativa requiere asignación de mentor ('PENDIENTE_ASIGNACION_MENTOR')
     *   Cuando el coordinador consulta la acción rápida disponible
     *   Entonces la etiqueta debe ser explícitamente "Asignar mentor"
     */
    it('TC-EXP-010 (COOR-FUN-001 / COOR-UX-009): La acción rápida comunica explícitamente "Asignar mentor"', () => {
      const action = getMobileQuickActionForInitiative(
        'COORDINATOR',
        'PENDIENTE_ASIGNACION_MENTOR'
      );

      expect(action.isAvailable).toBe(true);
      expect(action.label).toBe('Asignar mentor');
      expect(action.label).not.toMatch(/en 1 toque/i);
    });

    /**
     * Criterio Gherkin:
     *   Dado que el estado es 'PENDIENTE_ASIGNACION_MENTOR'
     *   Cuando se activa la acción de asignar mentor
     *   Entonces debe exigir hoja de confirmación y selección de mentor en lugar de asignar a ciegas a Carlos Mendoza
     */
    it('TC-EXP-011 (COOR-FUN-002): La asignación exige confirmación explícita y selección de mentor, no asignación a ciegas', () => {
      const action = getMobileQuickActionForInitiative(
        'COORDINATOR',
        'PENDIENTE_ASIGNACION_MENTOR'
      );

      // Debe requerir selección/confirmación del coordinador
      expect(action.requiresConfirmationSheet).toBe(true);

      // Si existe helper de validación de asignación, no debe aceptar asignación implícita por defecto
      const validateAssignment = (mobileEngine as any).validateMentorAssignment;
      expect(validateAssignment).toBeDefined();

      const blindResult = validateAssignment.call(mobileEngine, {
        mentorId: undefined,
        confirmed: false,
      });
      expect(blindResult.valid).toBe(false);
      expect(blindResult.error).toMatch(/seleccionar|confirmar|explícit/i);
    });

    /**
     * Criterio Gherkin:
     *   Dado que una iniciativa supera los 7 días sin registrar avances
     *   Cuando se formatea la etiqueta o badge de estancamiento
     *   Entonces debe expresarse exactamente con "+7 días" (signo +) sin usar ">" o "<"
     */
    it('TC-EXP-012 (COOR-UX-010): El indicador de estancamiento expresa "+7 días" con signo "+" y sin símbolos < o >', () => {
      const formatStagnantBadge = (mobileEngine as any).formatStagnantBadge;
      expect(formatStagnantBadge).toBeDefined();

      const badgeText = formatStagnantBadge(8);
      expect(badgeText).toContain('+7 días');
      expect(badgeText).not.toContain('>');
      expect(badgeText).not.toContain('<');
    });
  });

  // ==========================================================================
  // WS-UX-001 A WS-UX-005: DEFINICIÓN DE LAS 5 PESTAÑAS DEL WORKSPACE
  // ==========================================================================
  describe('WS-UX-001 a WS-UX-005: Definición y Simplificación de las 5 Pestañas del Workspace', () => {
    /**
     * Criterio Gherkin:
     *   Dado el Workspace de una iniciativa
     *   Cuando se configuran las pestañas de navegación
     *   Entonces deben definirse exactamente 5 pestañas con nombres limpios:
     *     1. "Diagnóstico y línea base"
     *     2. "Plan de trabajo"
     *     3. "Evidencias"
     *     4. "Observaciones"
     *     5. "Bitácora"
     */
    it('TC-EXP-013 (WS-UX-001 a WS-UX-005): WORKSPACE_TABS define exactamente las 5 pestañas limpias', () => {
      const tabs = (mobileEngine as any).WORKSPACE_TABS;
      expect(tabs).toBeDefined();
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs).toHaveLength(5);

      const labels = tabs.map((t: any) => t.label);
      expect(labels).toEqual([
        'Diagnóstico y línea base',
        'Plan de trabajo',
        'Evidencias',
        'Observaciones',
        'Bitácora',
      ]);
    });

    /**
     * Criterio Gherkin:
     *   Dado los títulos de navegación del Workspace
     *   Cuando se verifica cada nombre de pestaña
     *   Entonces ninguno debe incluir conteos entre paréntesis ni códigos metodológicos que saturen la UI
     */
    it('TC-EXP-014 (WS-UX-001 a WS-UX-005): Ninguna pestaña contiene conteos o referencias metodológicas crípticas', () => {
      const tabs = (mobileEngine as any).WORKSPACE_TABS;
      expect(tabs).toBeDefined();

      tabs.forEach((tab: any) => {
        expect(tab.label).not.toMatch(/\(K0-K3\)/i);
        expect(tab.label).not.toMatch(/\(8 Semanas/i);
        expect(tab.label).not.toMatch(/Checklist 5S/i);
        expect(tab.label).not.toMatch(/\(\d+\)/); // Sin conteos dinámicos en el label de pestaña
      });
    });
  });

  // ==========================================================================
  // WS-FUN-001: DESACOPLE DE CHECKLIST 5S DEL WORKSPACE
  // ==========================================================================
  describe('WS-FUN-001: Desacople de Auditoría 5S Gemba del Workspace', () => {
    /**
     * Criterio Gherkin:
     *   Dado el Workspace de la iniciativa
     *   Cuando se evalúa el propósito de la pestaña 'Observaciones'
     *   Entonces debe estar enfocada en notas y retroalimentación formativa sin depender de una auditoría 5S
     */
    it('TC-EXP-015 (WS-FUN-001): La pestaña "Observaciones" se enfoca en notas formativas sin checklist de auditoría 5S', () => {
      const tabs = (mobileEngine as any).WORKSPACE_TABS;
      expect(tabs).toBeDefined();

      const observationsTab = tabs.find(
        (t: any) => t.id === 'observations' || t.label === 'Observaciones'
      );
      expect(observationsTab).toBeDefined();
      expect(observationsTab.label).toBe('Observaciones');
      expect(observationsTab.requires5SAudit).toBe(false);
      expect(observationsTab.focus).toMatch(/formativ|notas|observaciones/i);
    });

    /**
     * Criterio Gherkin:
     *   Dado que un mentor o coordinador registra observaciones en el Workspace
     *   Cuando envía la retroalimentación
     *   Entonces la operación no debe requerir ni bloquearse por inputs de checklist 5S ni firmas 5S
     */
    it('TC-EXP-016 (WS-FUN-001): El registro de observaciones en Workspace no depende de datos del checklist 5S', () => {
      const validateWorkspaceObservation = (mobileEngine as any).validateWorkspaceObservation;
      expect(validateWorkspaceObservation).toBeDefined();

      const observationInput = {
        authorRole: 'COORDINATOR',
        comment: 'Se recomienda validar el tiempo de ciclo en el turno vespertino.',
        type: 'OBSERVACION',
      };

      const result = validateWorkspaceObservation.call(mobileEngine, observationInput);
      expect(result.valid).toBe(true);
      expect(result.checklist5sRequired).toBe(false);
    });
  });
});
