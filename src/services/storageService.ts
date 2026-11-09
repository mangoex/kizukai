import {
  Initiative,
  User,
  BusinessState,
  AuditLog,
  StateTransition,
  Evidence,
  Gemba5SChecklist,
  StandardizationSop
} from '../types/index.ts';
import {
  INITIAL_INITIATIVES,
  INITIAL_AUDIT_LOGS,
  DATABASE_ENTITIES
} from '../data/seedData.ts';

const STORAGE_KEYS = {
  INITIATIVES: 'kizukai_hub_initiatives_v1',
  AUDIT_LOGS: 'kizukai_hub_audit_logs_v1',
  CURRENT_USER: 'kizukai_hub_active_user_v1',
  ORGANIZATIONS: 'kizukai_hub_organizations_v1',
  DEPARTMENTS: 'kizukai_hub_departments_v1',
  GUIDELINES: 'kizukai_hub_guidelines_v1',
  USERS: 'kizukai_hub_users_v1'
};

export class StorageService {
  public static getInitiativesRaw(): Initiative[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INITIATIVES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INITIATIVES, JSON.stringify(INITIAL_INITIATIVES));
      return INITIAL_INITIATIVES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STORAGE_KEYS.INITIATIVES, JSON.stringify(INITIAL_INITIATIVES));
      return INITIAL_INITIATIVES;
    }
  }

  public static saveInitiativesRaw(list: Initiative[]): void {
    localStorage.setItem(STORAGE_KEYS.INITIATIVES, JSON.stringify(list));
  }

  public static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
  }

  public static logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    return newLog;
  }

  /**
   * Obtiene iniciativas filtradas por el Tenant y Rol del usuario.
   * Regla de segregación: TECH_ADMIN no puede ver contenido funcional de iniciativas.
   */
  public static getInitiativesForUser(user: User): Initiative[] {
    if (user.role === 'TECH_ADMIN') {
      return [];
    }

    const all = this.getInitiativesRaw();

    // Consultor Kizukai Global tiene visión multiempresa (ve ORG-A y ORG-B)
    if (user.role === 'CONSULTANT') {
      return all;
    }

    // El resto de los roles están estrictamente aislados en su propio Tenant
    return all.filter((item) => item.tenantId === user.tenantId);
  }

  /**
   * Obtiene una iniciativa por ID validando seguridad Multi-Tenant y Segregación de Funciones.
   */
  public static getInitiativeByIdSecure(
    id: string,
    user: User
  ): { data?: Initiative; error?: string; errorCode?: string } {
    if (user.role === 'TECH_ADMIN') {
      this.logAudit({
        entity: 'initiatives',
        entityId: id,
        action: 'TECH_ADMIN_ACCESS_BLOCKED',
        performedBy: user.email,
        tenantId: user.tenantId,
        payloadSnapshot: {
          reason: 'Segregación RBAC: TECH_ADMIN bloqueado de contenido funcional',
          attemptedId: id
        }
      });
      return {
        errorCode: '403_TECH_ADMIN_BLOCKED',
        error:
          '403 Forbidden - Segregación RBAC: El Administrador Técnico tiene privilegios de auditoría de infraestructura y parámetros pero tiene bloqueada la inspección del contenido funcional de iniciativas.'
      };
    }

    const all = this.getInitiativesRaw();
    const found = all.find((item) => item.id === id);

    if (!found) {
      return { errorCode: '404_NOT_FOUND', error: 'Iniciativa no encontrada.' };
    }

    // Verificación de aislamiento multi-tenant
    if (user.role !== 'CONSULTANT' && found.tenantId !== user.tenantId) {
      this.logAudit({
        entity: 'initiatives',
        entityId: id,
        action: 'CROSS_TENANT_ACCESS_DENIED',
        performedBy: user.email,
        tenantId: user.tenantId,
        payloadSnapshot: {
          userTenant: user.tenantId,
          resourceTenant: found.tenantId,
          initiativeFolio: found.folio,
          violationType: 'CrossTenantAccessDeniedException'
        }
      });

      return {
        errorCode: '403_CROSS_TENANT_VIOLATION',
        error: `403 Forbidden (CrossTenantAccessDeniedException): Acceso denegado. El usuario '${user.email}' perteneciente a la organización '${user.tenantId}' no tiene autorización para acceder a los datos de '${found.tenantId}'.`
      };
    }

    return { data: found };
  }

  /**
   * Ejecuta transiciones de estado en la máquina de 12 estados de Kizukai.
   */
  public static transitionInitiative(
    initiativeId: string,
    action: string,
    payload: {
      user: User;
      justification?: string;
      mentorId?: string;
      mentorName?: string;
      evidenceTitle?: string;
      evidenceType?: 'FOTO_ANTES' | 'FOTO_DESPUES' | 'MEDICION_GEMBA' | 'GRAFICA_CONTROL';
      evidenceUrlOrText?: string;
      checklist5s?: Gemba5SChecklist;
      sopCode?: string;
      sopTitle?: string;
      weeksCount?: number;
    }
  ): { success: boolean; initiative?: Initiative; error?: string } {
    const check = this.getInitiativeByIdSecure(initiativeId, payload.user);
    if (!check.data) {
      return { success: false, error: check.error || 'No autorizado.' };
    }

    const initiative = { ...check.data };
    const fromState = initiative.state;
    let toState: BusinessState = fromState;
    const nowIso = new Date().toISOString();

    switch (action) {
      case 'ENVIAR_A_REVISION':
        if (fromState !== 'BORRADOR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        toState = 'POR_APROBAR';
        initiative.currentStep = 1;
        initiative.progressPercent = 15;
        break;

      case 'APROBAR_FILTRO_TECNICO':
        if (fromState !== 'POR_APROBAR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        toState = 'PENDIENTE_ASIGNACION_MENTOR';
        initiative.currentStep = 2;
        initiative.progressPercent = 25;
        break;

      case 'RECHAZAR_IDEA':
        if (fromState !== 'POR_APROBAR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        toState = 'RECHAZADA';
        break;

      case 'ASIGNAR_MENTOR':
        if (fromState !== 'PENDIENTE_ASIGNACION_MENTOR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        if (!payload.mentorId || !payload.mentorName) {
          return { success: false, error: 'Debe especificar el mentor asignado.' };
        }
        toState = 'PENDIENTE_PLAN_IMPLEMENTACION';
        initiative.mentorId = payload.mentorId;
        initiative.mentorName = payload.mentorName;
        initiative.currentStep = 3;
        initiative.progressPercent = 35;
        break;

      case 'VALIDAR_PLAN':
        if (fromState !== 'PENDIENTE_PLAN_IMPLEMENTACION') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        // Validación de regla de ventana máxima de 8 semanas (56 días)
        if (payload.weeksCount && payload.weeksCount > 8) {
          return {
            success: false,
            error:
              'MaxImplementationWindowExceededException: El cronograma propuesto excede la ventana máxima permitida de 8 semanas (56 días) de la metodología Kizukai Kaizen.'
          };
        }
        toState = 'EN_IMPLEMENTACION';
        initiative.currentStep = 4;
        initiative.progressPercent = 45;
        break;

      case 'NOTIFICAR_TERMINO_OBRA':
        if (fromState !== 'EN_IMPLEMENTACION') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        // Se marcan todas las tareas como completadas
        initiative.tasks = initiative.tasks.map((t) => ({
          ...t,
          completed: true,
          completedAt: t.completedAt || nowIso.split('T')[0]
        }));
        toState = 'PENDIENTE_RESULTADOS';
        initiative.currentStep = 5;
        initiative.progressPercent = 85;
        break;

      case 'ENVIAR_A_EVALUACION':
        if (fromState !== 'PENDIENTE_RESULTADOS') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        toState = 'POR_EVALUAR';
        initiative.currentStep = 5;
        initiative.progressPercent = 90;
        break;

      case 'DEVOLVER_EVIDENCIA':
        // Regla Crítica de Devolución: Exige justificación >= 20 caracteres
        if (!payload.justification || payload.justification.trim().length < 20) {
          return {
            success: false,
            error:
              'DevolucionJustificationTooShortException: La justificación de devolución debe ser formativa y detallada, con un mínimo obligatorio de 20 caracteres explicando las deficiencias metodológicas.'
          };
        }
        toState = 'DEVUELTA_PARA_AJUSTES';
        initiative.returnTargetStateId = 'PENDIENTE_RESULTADOS';

        // Congela las evidencias previas como Versión 1.0 (Devuelta)
        initiative.evidences = initiative.evidences.map((ev) => ({
          ...ev,
          version: 'v1.0',
          status: 'CONGELADA_DEVUELTA'
        }));

        // Añade feedback al hilo
        initiative.feedbackList.push({
          id: `fb-${Date.now()}`,
          mentorName: payload.user.name,
          comment: payload.justification,
          createdAt: nowIso,
          type: 'DEVOLUCION'
        });
        break;

      case 'REMITIR_CORRECCION':
        if (fromState !== 'DEVUELTA_PARA_AJUSTES') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        // Crea nueva evidencia Versión 2.0 activa
        const newEvidence: Evidence = {
          id: `ev-v2-${Date.now()}`,
          title: payload.evidenceTitle || 'Evidencia Corregida v2.0 - Mediciones y Fotos de Gemba',
          type: payload.evidenceType || 'MEDICION_GEMBA',
          version: 'v2.0',
          status: 'ACTIVA',
          urlOrDescription:
            payload.evidenceUrlOrText ||
            'Corrida estable en Gemba con mediciones de 5 días y reducción de defectos comprobada.',
          uploadedBy: payload.user.name,
          uploadedAt: nowIso
        };
        initiative.evidences.push(newEvidence);

        // Restaura el estado previo exacto (por defecto PENDIENTE_RESULTADOS)
        toState = initiative.returnTargetStateId || 'PENDIENTE_RESULTADOS';
        initiative.returnTargetStateId = undefined;
        break;

      case 'APROBAR_EVALUACION_K3':
        if (fromState !== 'POR_EVALUAR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        if (!payload.checklist5s || !payload.checklist5s.digitalSignature) {
          return {
            success: false,
            error:
              'GembaAuditChecklistSignatureRequiredException: Se requiere la firma digital del auditor de Gemba y la validación de Finanzas para aprobar la evaluación K3.'
          };
        }
        initiative.checklist5s = payload.checklist5s;
        toState = 'POR_DOCUMENTAR';
        initiative.currentStep = 6;
        initiative.progressPercent = 95;
        break;

      case 'PUBLICAR_ESTANDAR_POE':
        if (fromState !== 'POR_DOCUMENTAR') {
          return { success: false, error: `Transición no permitida desde ${fromState}` };
        }
        const sopCode = payload.sopCode || `POE-2026-${initiative.folio.split('-')[2]}`;
        const sopTitle =
          payload.sopTitle || `POE Estandarización Kaizen: ${initiative.title}`;

        initiative.sop = {
          id: `sop-${Date.now()}`,
          code: sopCode,
          title: sopTitle,
          publishedAt: nowIso,
          documentUrl: `https://docs.kizukai.internal/poe/${sopCode}.pdf`
        };
        toState = 'FINALIZADA';
        initiative.currentStep = 6;
        initiative.progressPercent = 100;
        break;

      case 'CANCELAR_INICIATIVA':
        toState = 'CANCELADA';
        break;

      default:
        return { success: false, error: `Acción desconocida: ${action}` };
    }

    initiative.state = toState;
    initiative.updatedAt = nowIso;

    // Registra la transición en la historia inmutable de la iniciativa
    const transitionRecord: StateTransition = {
      id: `tr-${Date.now()}`,
      fromState,
      toState,
      action,
      performedBy: payload.user.name,
      performedRole: payload.user.role,
      timestamp: nowIso,
      justification: payload.justification,
      returnTargetStateId: initiative.returnTargetStateId
    };
    initiative.transitionHistory.push(transitionRecord);

    // Actualiza en almacenamiento
    const all = this.getInitiativesRaw();
    const updatedList = all.map((it) => (it.id === initiative.id ? initiative : it));
    this.saveInitiativesRaw(updatedList);

    // Registra auditoría global
    this.logAudit({
      entity: 'initiatives',
      entityId: initiative.id,
      action: `STATE_TRANSITION_${action}`,
      performedBy: payload.user.email,
      tenantId: initiative.tenantId,
      payloadSnapshot: {
        fromState,
        toState,
        action,
        initiativeFolio: initiative.folio,
        justification: payload.justification
      }
    });

    return { success: true, initiative };
  }

  /**
   * Crea una nueva iniciativa Kaizen K2 con verificación de Cero Inversión.
   */
  public static createInitiative(
    user: User,
    data: {
      title: string;
      department: string;
      guideline: 'CALIDAD' | 'COSTO' | 'ENTREGA' | 'SEGURIDAD' | 'MORAL';
      k0_deficient: string;
      k1_basic_function: string;
      k2_proactivity: string;
      k3_expected_impact: string;
      zero_investment_verified: boolean;
      ve_annual_value: number;
      asDraft: boolean;
    }
  ): { success: boolean; initiative?: Initiative; error?: string } {
    if (!data.zero_investment_verified) {
      return {
        success: false,
        error:
          'ZeroInvestmentRuleViolationException: La iniciativa debe cumplir estrictamente con el principio Kaizen de CERO INVERSIÓN de capital.'
      };
    }

    const all = this.getInitiativesRaw();
    const nextNum = all.length + 1;
    const folio = `KIZ-2026-${String(nextNum).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const initialState: BusinessState = data.asDraft ? 'BORRADOR' : 'POR_APROBAR';

    // Fecha límite calculada a 8 semanas (56 días) desde hoy
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 56);

    const newInit: Initiative = {
      id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      folio,
      title: data.title,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
      program: 'Top Companies 2026',
      department: data.department,
      guideline: data.guideline,
      state: initialState,
      currentStep: 1,
      progressPercent: data.asDraft ? 5 : 15,
      proponentId: user.id,
      proponentName: user.name,
      deadlineDate: deadline.toISOString().split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso,
      isStagnant: false,
      diagnostic: {
        k0_deficient: data.k0_deficient,
        k1_basic_function: data.k1_basic_function,
        k2_proactivity: data.k2_proactivity,
        k3_expected_impact: data.k3_expected_impact,
        zero_investment_verified: true,
        ve_annual_value: data.ve_annual_value || 0,
        currency: 'USD'
      },
      tasks: [
        { id: `t1-${Date.now()}`, title: 'Inspección en Gemba y medición K0', week: 1, step: 1, completed: true, completedAt: nowIso.split('T')[0] },
        { id: `t2-${Date.now()}`, title: 'Mapeo de la función básica K1 y lluvia de ideas K2', week: 2, step: 2, completed: false },
        { id: `t3-${Date.now()}`, title: 'Fabricación de contramedida con recursos existentes', week: 3, step: 3, completed: false },
        { id: `t4-${Date.now()}`, title: 'Prueba piloto en Gemba y ajuste fino', week: 4, step: 4, completed: false },
        { id: `t5-${Date.now()}`, title: 'Medición de impacto K3 y corrida de control', week: 5, step: 5, completed: false },
        { id: `t6-${Date.now()}`, title: 'Estandarización POE y difusión en equipo', week: 6, step: 6, completed: false }
      ],
      evidences: [],
      feedbackList: [],
      transitionHistory: [
        {
          id: `tr-init-${Date.now()}`,
          fromState: 'BORRADOR',
          toState: initialState,
          action: data.asDraft ? 'GUARDAR_BORRADOR' : 'CREAR_Y_ENVIAR_A_REVISION',
          performedBy: user.name,
          performedRole: user.role,
          timestamp: nowIso,
          justification: 'Registro inicial de iniciativa en plataforma.'
        }
      ]
    };

    all.unshift(newInit);
    this.saveInitiativesRaw(all);

    this.logAudit({
      entity: 'initiatives',
      entityId: newInit.id,
      action: 'INITIATIVE_CREATED',
      performedBy: user.email,
      tenantId: user.tenantId,
      payloadSnapshot: {
        folio: newInit.folio,
        title: newInit.title,
        state: newInit.state,
        guideline: newInit.guideline,
        veAnnualValue: newInit.diagnostic.ve_annual_value
      }
    });

    return { success: true, initiative: newInit };
  }

  /**
   * Genera el contenido CSV exportable de los reportes prioritarios con metadatos de auditoría obligatorios.
   */
  public static generateReportCSV(
    reportType: 'A' | 'B' | 'C',
    user: User,
    initiatives: Initiative[]
  ): string {
    const timestamp = new Date().toISOString();
    const orgScope = user.role === 'CONSULTANT' ? 'TODAS_LAS_ORGANIZACIONES (CONSOLIDADO)' : user.tenantId;

    let title = '';
    let headers: string[] = [];
    const rows: string[][] = [];

    if (reportType === 'A') {
      title = 'Reporte A - Eficiencia del Embudo por Cohorte y Tasa de Conversión';
      headers = ['Folio', 'Título', 'Organización', 'Departamento', 'Directriz', 'Estado Actual', 'Paso Metodológico', 'Avance %', 'Mentor Asignado'];
      initiatives.forEach((i) => {
        rows.push([
          i.folio,
          `"${i.title.replace(/"/g, '""')}"`,
          i.tenantName,
          i.department,
          i.guideline,
          i.state,
          `Paso ${i.currentStep}`,
          `${i.progressPercent}%`,
          i.mentorName || 'Sin asignar'
        ]);
      });
    } else if (reportType === 'B') {
      title = 'Reporte B - Tiempos de Ciclo, Ventana de 8 Semanas y Estancamiento';
      headers = ['Folio', 'Título', 'Organización', 'Fecha Registro', 'Fecha Límite (8 Semanas)', 'Estado', 'Alerta Estancamiento (>7 Días)', 'Días Transcurridos'];
      initiatives.forEach((i) => {
        const createdDate = new Date(i.createdAt);
        const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 3600 * 24));
        rows.push([
          i.folio,
          `"${i.title.replace(/"/g, '""')}"`,
          i.tenantName,
          i.createdAt.split('T')[0],
          i.deadlineDate,
          i.state,
          i.isStagnant ? 'SI (ESTANCADA)' : 'NO (EN FLUJO)',
          `${diffDays} días`
        ]);
      });
    } else {
      title = 'Reporte C - Impacto Económico Acumulado K3 vs Inversión Cero';
      headers = ['Folio', 'Título', 'Organización', 'Directriz QCDSM', 'Ahorro Anual Estimado (V_E USD)', 'Inversión Real', 'ROI Kaizen', 'Estado'];
      initiatives.forEach((i) => {
        rows.push([
          i.folio,
          `"${i.title.replace(/"/g, '""')}"`,
          i.tenantName,
          i.guideline,
          `$${i.diagnostic.ve_annual_value.toLocaleString()} USD`,
          '$0 USD (Cero Inversión)',
          'Infinito (Puro Ingenio)',
          i.state
        ]);
      });
    }

    // Cabecera de Auditoría Obligatoria (PRD)
    const auditHeader = [
      `# ==============================================================================`,
      `# KIZUKAI PROJECT HUB - EXPORTACIÓN OFICIAL DE REPORTE PRIORITARIO`,
      `# Reporte: ${title}`,
      `# Fecha y Hora UTC: ${timestamp}`,
      `# Usuario Solicitante: ${user.name} (${user.email}) - Rol: ${user.role}`,
      `# Organización / Tenant Filtrado: ${orgScope}`,
      `# Total de Registros: ${rows.length}`,
      `# Metodología: Kizukai Kaizen (Cero Inversión de Capital)`,
      `# ==============================================================================`,
      ''
    ].join('\n');

    const csvData = [
      headers.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\n');

    return `\uFEFF${auditHeader}${csvData}`;
  }

  /**
   * Dispara la descarga del archivo en el navegador.
   */
  public static triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static getDatabaseEntitiesSummary() {
    return DATABASE_ENTITIES;
  }

  // =========================================================================
  // MÓDULO DE PERSISTENCIA Y APROVISIONAMIENTO JERÁRQUICO (HU-1.1 A HU-4.2)
  // =========================================================================

  public static getOrganizations(): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
    if (!raw) {
      const initialOrgs = [
        {
          id: 'ORG-A',
          businessName: 'Manufactura Eléctrica del Norte S.A. de C.V.',
          commercialName: 'Manufactura Norte',
          taxId: 'MEN920315AB1',
          industrySector: 'Automotriz y Eléctrico',
          isActive: true,
          createdAt: '2026-01-10T08:00:00Z'
        },
        {
          id: 'ORG-B',
          businessName: 'Alimentos y Bebidas del Bajío S.A.P.I. de C.V.',
          commercialName: 'Alimentos Bajío',
          taxId: 'ABB180422CD3',
          industrySector: 'Alimentos y Bebidas',
          isActive: true,
          createdAt: '2026-02-01T09:30:00Z'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(initialOrgs));
      return initialOrgs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static createOrganization(
    actor: User,
    data: { businessName: string; commercialName: string; taxId?: string; industrySector: string }
  ): { success: boolean; organization?: any; error?: string } {
    if (actor.role !== 'TECH_ADMIN') {
      return {
        success: false,
        error: '403 Forbidden: Solo el Administrador Técnico (TECH_ADMIN) puede crear nuevas empresas clientes.'
      };
    }

    if (!data.businessName || !data.commercialName) {
      return { success: false, error: 'La razón social y el nombre comercial son obligatorios.' };
    }

    const orgs = this.getOrganizations();
    const newId = `ORG-${String.fromCharCode(65 + (orgs.length % 26))}${orgs.length > 25 ? orgs.length : ''}`;
    const newOrg = {
      id: newId,
      businessName: data.businessName.trim(),
      commercialName: data.commercialName.trim(),
      taxId: data.taxId?.trim() || 'XAXX010101000',
      industrySector: data.industrySector || 'Industrial',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    orgs.push(newOrg);
    localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(orgs));

    this.logAudit({
      entity: 'organizations',
      entityId: newId,
      action: 'ORGANIZATION_CREATED',
      performedBy: actor.email,
      tenantId: newId,
      payloadSnapshot: newOrg
    });

    return { success: true, organization: newOrg };
  }

  public static getDepartments(): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!raw) {
      const initialDepts = [
        { id: 'dept-01', organizationId: 'ORG-A', name: 'Ensamble y Troquelado', branchOffice: 'Planta Norte' },
        { id: 'dept-02', organizationId: 'ORG-A', name: 'Troquelado y Prensas', branchOffice: 'Planta Norte' },
        { id: 'dept-03', organizationId: 'ORG-A', name: 'Mantenimiento y Servicios', branchOffice: 'Planta Norte' },
        { id: 'dept-04', organizationId: 'ORG-A', name: 'Devanado y Bobinado', branchOffice: 'Planta Norte' },
        { id: 'dept-05', organizationId: 'ORG-A', name: 'Empaque y Almacén', branchOffice: 'Planta Norte' },
        { id: 'dept-06', organizationId: 'ORG-A', name: 'Pintura y Acabados', branchOffice: 'Planta Norte' },
        { id: 'dept-07', organizationId: 'ORG-B', name: 'Línea de Envasado Aséptico', branchOffice: 'Planta Bajío' },
        { id: 'dept-08', organizationId: 'ORG-B', name: 'Silos y Granos', branchOffice: 'Planta Bajío' },
        { id: 'dept-09', organizationId: 'ORG-B', name: 'Mantenimiento General', branchOffice: 'Planta Bajío' }
      ];
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(initialDepts));
      return initialDepts;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static createDepartment(
    actor: User,
    data: { organizationId: string; name: string; branchOffice?: string }
  ): { success: boolean; department?: any; error?: string } {
    if (actor.role === 'PARTICIPANT' || actor.role === 'MENTOR') {
      return { success: false, error: '403 Forbidden: No tienes privilegios para crear departamentos.' };
    }

    if (actor.role === 'COORDINATOR' && actor.tenantId !== data.organizationId) {
      return { success: false, error: '403 Forbidden: Un Coordinador no puede registrar departamentos en otra empresa.' };
    }

    if (!data.name.trim()) {
      return { success: false, error: 'El nombre del departamento es obligatorio.' };
    }

    const depts = this.getDepartments();
    const newDept = {
      id: `dept-${Date.now().toString().slice(-5)}`,
      organizationId: data.organizationId,
      name: data.name.trim(),
      branchOffice: data.branchOffice?.trim() || 'Planta Principal'
    };

    depts.push(newDept);
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));

    this.logAudit({
      entity: 'departments',
      entityId: newDept.id,
      action: 'DEPARTMENT_CREATED',
      performedBy: actor.email,
      tenantId: data.organizationId,
      payloadSnapshot: newDept
    });

    return { success: true, department: newDept };
  }

  public static getGuidelines(tenantId?: string): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GUIDELINES);
    if (!raw) {
      const initialGuidelines = [
        { code: 'CALIDAD', letter: 'Q', name: 'Calidad (Quality)', description: 'Cero defectos, reducción de scrap y control de variabilidad en Gemba.', tenantId: 'ORG-A' },
        { code: 'COSTO', letter: 'C', name: 'Costo (Cost)', description: 'Ahorro de recursos, energía y materiales con CERO INVERSIÓN de capital ($0 Capex).', tenantId: 'ORG-A' },
        { code: 'ENTREGA', letter: 'D', name: 'Entrega (Delivery)', description: 'Reducción de tiempos de ciclo, cambios rápidos de formato (SMED) y flujo continuo.', tenantId: 'ORG-A' },
        { code: 'SEGURIDAD', letter: 'S', name: 'Seguridad (Safety)', description: 'Ergonomía en estaciones de trabajo, eliminación de condiciones inseguras y cero accidentes.', tenantId: 'ORG-A' },
        { code: 'MORAL', letter: 'M', name: 'Moral (Morale / 5S)', description: 'Ambiente laboral digno, orden visual, estandarización y cultura de autodisciplina 5S.', tenantId: 'ORG-A' },
        { code: 'CALIDAD_B', letter: 'Q', name: 'Calidad e Inocuidad', description: 'Cumplimiento HACCP y cero defectos en envasado aséptico.', tenantId: 'ORG-B' },
        { code: 'COSTO_B', letter: 'C', name: 'Eficiencia y Rendimiento', description: 'Reducción de mermas y optimización de insumos sin inversión de capital.', tenantId: 'ORG-B' },
        { code: 'ENTREGA_B', letter: 'D', name: 'Cumplimiento de Embarques', description: 'Tiempos de entrega a cedis y cumplimiento de nivel de servicio OTIF.', tenantId: 'ORG-B' },
        { code: 'SEGURIDAD_B', letter: 'S', name: 'Seguridad Operacional', description: 'Cero accidentes e incidentes en líneas de envasado.', tenantId: 'ORG-B' },
        { code: 'MORAL_B', letter: 'M', name: 'Cultura 5S y Disciplina', description: 'Estandarización visual, orden y disciplina en áreas operativas.', tenantId: 'ORG-B' }
      ];
      localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(initialGuidelines));
      if (tenantId) {
        return initialGuidelines.filter((g: any) => g.tenantId === tenantId);
      }
      return initialGuidelines;
    }

    try {
      const parsed: any[] = JSON.parse(raw);
      const normalized = parsed.map((g: any) => ({
        ...g,
        tenantId: g.tenantId || 'ORG-A'
      }));
      if (tenantId) {
        return normalized.filter((g: any) => g.tenantId === tenantId);
      }
      return normalized;
    } catch {
      return [];
    }
  }

  public static createGuideline(
    actor: User,
    data: { code: string; letter: string; name: string; description: string; tenantId?: string }
  ): { success: boolean; guideline?: any; error?: string } {
    if (actor.role !== 'TECH_ADMIN' && actor.role !== 'CONSULTANT') {
      return { success: false, error: '403 Forbidden: Solo el Administrador Técnico o Consultor pueden agregar directrices estratégicas.' };
    }

    if (!data.code || !data.name) {
      return { success: false, error: 'El código y nombre de la directriz son obligatorios.' };
    }

    const assignedTenantId = data.tenantId || actor.tenantId || 'ORG-A';

    if (actor.role === 'TECH_ADMIN' && actor.tenantId && data.tenantId && actor.tenantId !== data.tenantId) {
      return { success: false, error: 'Violación de aislamiento multi-tenant: 403 Forbidden' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.GUIDELINES);
    let list: any[] = [];
    if (!raw) {
      list = this.getGuidelines();
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    const upperCode = data.code.trim().toUpperCase();
    if (list.some((g: any) => g.code === upperCode && (g.tenantId || 'ORG-A') === assignedTenantId)) {
      return { success: false, error: `Ya existe una directriz con el código ${upperCode} para el tenant ${assignedTenantId}.` };
    }

    const newGuideline = {
      code: upperCode,
      letter: data.letter?.trim().toUpperCase() || upperCode[0],
      name: data.name.trim(),
      description: data.description?.trim() || '',
      tenantId: assignedTenantId
    };

    list.push(newGuideline);
    localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(list));

    this.logAudit({
      entity: 'catalogs',
      entityId: upperCode,
      action: 'STRATEGIC_GUIDELINE_CREATED',
      performedBy: actor.email,
      tenantId: assignedTenantId,
      payloadSnapshot: newGuideline
    });

    return { success: true, guideline: newGuideline };
  }

  public static updateGuideline(
    actor: User,
    code: string,
    data: { name?: string; description?: string; letter?: string; [key: string]: any }
  ): { success: boolean; guideline?: any; error?: string } {
    if (actor.role !== 'TECH_ADMIN' && actor.role !== 'CONSULTANT') {
      return { success: false, error: '403 Forbidden: No autorizado para modificar directrices.' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.GUIDELINES);
    let list: any[] = [];
    if (!raw) {
      list = this.getGuidelines();
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    const upperCode = code.trim().toUpperCase();
    const idx = list.findIndex((g: any) => g.code === upperCode);
    if (idx === -1) {
      return { success: false, error: `Directriz ${upperCode} no encontrada.` };
    }

    const existing = list[idx];
    const guidelineTenant = existing.tenantId || 'ORG-A';

    if (actor.role === 'TECH_ADMIN' && actor.tenantId && actor.tenantId !== guidelineTenant) {
      return { success: false, error: 'Violación de aislamiento multi-tenant: 403 Forbidden' };
    }

    const updated = {
      ...existing,
      tenantId: guidelineTenant,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      letter: data.letter !== undefined ? data.letter.trim().toUpperCase() : existing.letter
    };

    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(list));

    this.logAudit({
      entity: 'catalogs',
      entityId: upperCode,
      action: 'STRATEGIC_GUIDELINE_UPDATED',
      performedBy: actor.email,
      tenantId: guidelineTenant,
      payloadSnapshot: updated
    });

    return { success: true, guideline: updated };
  }

  public static deleteGuideline(
    actor: User,
    code: string
  ): { success: boolean; error?: string } {
    if (actor.role !== 'TECH_ADMIN' && actor.role !== 'CONSULTANT') {
      return { success: false, error: '403 Forbidden: No autorizado para eliminar directrices.' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.GUIDELINES);
    let list: any[] = [];
    if (!raw) {
      list = this.getGuidelines();
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    const upperCode = code.trim().toUpperCase();
    const idx = list.findIndex((g: any) => g.code === upperCode);
    if (idx === -1) {
      return { success: false, error: `Directriz ${upperCode} no encontrada.` };
    }

    const existing = list[idx];
    const guidelineTenant = existing.tenantId || 'ORG-A';

    if (actor.role === 'TECH_ADMIN' && actor.tenantId && actor.tenantId !== guidelineTenant) {
      return { success: false, error: 'Violación de aislamiento multi-tenant: 403 Forbidden' };
    }

    list.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(list));

    this.logAudit({
      entity: 'catalogs',
      entityId: upperCode,
      action: 'STRATEGIC_GUIDELINE_DELETED',
      performedBy: actor.email,
      tenantId: guidelineTenant,
      payloadSnapshot: existing
    });

    return { success: true };
  }

  public static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: User[] = [];
    if (!raw) {
      users = [
        {
          id: 'usr-000-mangoex',
          name: 'Super Admin (Mangoex)',
          email: 'mangoex@gmail.com',
          role: 'TECH_ADMIN',
          tenantId: 'ORG-GLOBAL',
          tenantName: 'Kizukai Platform Infrastructure (Root)',
          department: 'Super Administrador / Dirección',
          requiresMfa: false,
          avatarInitials: 'SA'
        },
        {
          id: 'usr-001-juan',
          name: 'Juan Pérez',
          email: 'juan.perez@manufacturanorte.mx',
          role: 'PARTICIPANT',
          tenantId: 'ORG-A',
          tenantName: 'Manufactura Eléctrica del Norte',
          department: 'Ensamble y Troquelado',
          requiresMfa: false,
          avatarInitials: 'JP'
        },
        {
          id: 'usr-002-carlos',
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@manufacturanorte.mx',
          role: 'MENTOR',
          tenantId: 'ORG-A',
          tenantName: 'Manufactura Eléctrica del Norte',
          department: 'Ensamble y Troquelado',
          requiresMfa: false,
          avatarInitials: 'CM'
        },
        {
          id: 'usr-003-ana',
          name: 'Ana Sofía Garza',
          email: 'ana.garza@manufacturanorte.mx',
          role: 'COORDINATOR',
          tenantId: 'ORG-A',
          tenantName: 'Manufactura Eléctrica del Norte',
          department: 'Coordinación de Mejora Continua',
          requiresMfa: true,
          avatarInitials: 'AG'
        },
        {
          id: 'usr-004-kasuga',
          name: 'Carlos Kasuga',
          email: 'carlos.kasuga@kizukai.com',
          role: 'CONSULTANT',
          tenantId: 'ORG-GLOBAL',
          tenantName: 'Kizukai Consulting Global',
          department: 'Metodología Kaizen',
          requiresMfa: true,
          avatarInitials: 'CK'
        },
        {
          id: 'usr-005-david',
          name: 'David Villarreal',
          email: 'david.tech@kizukai.com',
          role: 'TECH_ADMIN',
          tenantId: 'ORG-GLOBAL',
          tenantName: 'Kizukai Consulting Global',
          department: 'TI & Ciberseguridad',
          requiresMfa: true,
          avatarInitials: 'DV'
        },
        {
          id: 'usr-006-laura',
          name: 'Laura Gómez',
          email: 'laura.gomez@alimentosbajio.mx',
          role: 'COORDINATOR',
          tenantId: 'ORG-B',
          tenantName: 'Alimentos y Bebidas del Bajío',
          department: 'Calidad e Inocuidad',
          requiresMfa: true,
          avatarInitials: 'LG'
        }
      ];
    } else {
      try {
        users = JSON.parse(raw);
      } catch {
        users = [];
      }
    }

    // Asegurar que la cuenta Super Admin (mangoex@gmail.com) siempre exista en users
    const hasMangoex = users.some(
      (u) => u.email.toLowerCase() === 'mangoex@gmail.com' || u.id === 'usr-000-mangoex'
    );

    if (!hasMangoex) {
      users.unshift({
        id: 'usr-000-mangoex',
        name: 'Super Admin (Mangoex)',
        email: 'mangoex@gmail.com',
        role: 'TECH_ADMIN',
        tenantId: 'ORG-GLOBAL',
        tenantName: 'Kizukai Platform Infrastructure (Root)',
        department: 'Super Administrador / Dirección',
        requiresMfa: false,
        avatarInitials: 'SA'
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return users;
  }

  public static createUser(
    actor: User,
    data: { name: string; email: string; role: any; organizationId: string; department?: string }
  ): { success: boolean; user?: User; error?: string } {
    // 1. Validaciones RBAC con AdminEngine
    const role = actor.role;
    const targetRole = data.role;
    const actorOrg = actor.tenantId;
    const targetOrg = data.organizationId;

    if (role === 'PARTICIPANT' || role === 'MENTOR') {
      return { success: false, error: '403 Forbidden: No tienes privilegios para dar de alta usuarios.' };
    }

    if (role === 'TECH_ADMIN' && targetRole !== 'CONSULTANT' && targetRole !== 'TECH_ADMIN') {
      return { success: false, error: '403 Forbidden: El Administrador Técnico solo da de alta Consultores Globales.' };
    }

    if (role === 'CONSULTANT' && targetRole !== 'COORDINATOR') {
      return { success: false, error: '403 Forbidden: El Consultor Global solo puede dar de alta Coordinadores de Empresa.' };
    }

    if (role === 'COORDINATOR') {
      if (actorOrg !== targetOrg) {
        return { success: false, error: '403 Forbidden (MultiTenantViolation): Un Coordinador no puede registrar usuarios en otra empresa.' };
      }
      if (targetRole !== 'PARTICIPANT' && targetRole !== 'MENTOR') {
        return { success: false, error: '403 Forbidden: Un Coordinador solo puede registrar Participantes y Mentores.' };
      }
    }

    if (!data.name || !data.email) {
      return { success: false, error: 'Nombre y correo electrónico son obligatorios.' };
    }

    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Ya existe un usuario registrado con este correo electrónico.' };
    }

    const orgs = this.getOrganizations();
    const targetOrgRecord = orgs.find((o) => o.id === targetOrg);
    const orgName = targetOrg === 'ORG-GLOBAL' ? 'Kizukai Consulting Global' : (targetOrgRecord?.commercialName || targetOrg);

    const initials = data.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: targetRole,
      tenantId: targetOrg,
      tenantName: orgName,
      department: data.department?.trim() || 'General',
      requiresMfa: targetRole === 'TECH_ADMIN' || targetRole === 'CONSULTANT' || targetRole === 'COORDINATOR',
      avatarInitials: initials
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.logAudit({
      entity: 'users',
      entityId: newUser.id,
      action: 'USER_CREATED',
      performedBy: actor.email,
      tenantId: targetOrg,
      payloadSnapshot: {
        userId: newUser.id,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId
      }
    });

    return { success: true, user: newUser };
  }

  public static updateUserProfile(
    userId: string,
    updates: { name?: string; email?: string; department?: string; phoneNumber?: string; jobTitle?: string; avatarUrl?: string },
    fallbackUser?: User
  ): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    
    // 1. Buscar por ID de usuario
    let idx = users.findIndex((u) => u.id === userId);

    // 2. Fallback: buscar por email si el ID difiere (p. ej. cuentas super admin migradas)
    if (idx === -1 && updates.email) {
      idx = users.findIndex((u) => u.email.toLowerCase() === updates.email!.trim().toLowerCase());
    }

    // 3. Fallback: buscar por email del fallbackUser
    if (idx === -1 && fallbackUser?.email) {
      idx = users.findIndex((u) => u.email.toLowerCase() === fallbackUser.email.toLowerCase());
    }

    let current: User;

    if (idx === -1) {
      // Si el usuario no estaba en la tabla, lo añadimos (Upsert seguro)
      const baseUser = fallbackUser || {
        id: userId || 'usr-000-mangoex',
        name: updates.name || 'Super Admin (Mangoex)',
        email: updates.email || 'mangoex@gmail.com',
        role: 'TECH_ADMIN' as const,
        tenantId: 'ORG-A',
        tenantName: 'Kizukai Platform Infrastructure (Root)',
        department: updates.department || 'Super Administrador / Dirección',
        requiresMfa: false,
        avatarInitials: 'SA'
      };

      current = {
        ...baseUser,
        id: userId || baseUser.id
      };
      users.unshift(current);
      idx = 0;
    } else {
      current = users[idx];
    }

    const newName = updates.name !== undefined ? updates.name.trim() : current.name;
    const initials = newName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || current.avatarInitials;

    const updatedUser: User = {
      ...current,
      name: newName,
      email: updates.email !== undefined ? updates.email.trim().toLowerCase() : current.email,
      department: updates.department !== undefined ? updates.department.trim() : current.department,
      phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber.trim() : current.phoneNumber,
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle.trim() : current.jobTitle,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : current.avatarUrl,
      avatarInitials: initials
    };

    users[idx] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Mantener sincronizado inmediatamente el active user en sesión
    localStorage.setItem('kizukai_active_user', JSON.stringify(updatedUser));

    this.logAudit({
      entity: 'users',
      entityId: updatedUser.id,
      action: 'USER_PROFILE_UPDATED',
      performedBy: updatedUser.email,
      tenantId: updatedUser.tenantId,
      payloadSnapshot: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasAvatar: Boolean(updatedUser.avatarUrl)
      }
    });

    return { success: true, user: updatedUser };
  }
}
