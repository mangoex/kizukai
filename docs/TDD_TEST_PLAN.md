# Plan Maestro de Pruebas Automatizadas (SBD / BDD & TDD) — Kizukai Project Hub MVP

> **Estado del Ciclo TDD:** 🟢 **FASE VERDE VERIFICADA (CORE + MOBILE WEB APP UX)**  
> **Fecha de Ejecución:** `2026-11-05`  
> **Responsable:** `qa-tdd-engineer` (Gemini 4 Argon)  
> **Artefactos del Pool de Pruebas:**
> - Especificación Gherkin (SBD): [`tests/features/kizukai_mvp.feature`](../tests/features/kizukai_mvp.feature)
> - Suite Python (`pytest`): [`tests/test_kizukai_tdd.py`](../tests/test_kizukai_tdd.py) (`24 passed`)
> - Suite Espejo TypeScript (`Vitest`): [`tests/kizukai.spec.ts`](../tests/kizukai.spec.ts) (`20 passed`)
> - Suite Mobile Web App UX (`Vitest`): [`tests/mobile_ux.test.ts`](../tests/mobile_ux.test.ts) (`11 passed`)

---

## 1. Matriz de Trazabilidad de Historias de Usuario (BDD / Gherkin)

| ID Historia | Escenario Gherkin (`# language: es`) | Función Python (`pytest`) | Función TypeScript (`Vitest`) | Reglas de Negocio Verificadas |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Registro exitoso de Iniciativa Proactiva K2 con validación de Cero Inversión | `test_bdd_hu01_register_initiative_scenario` | `test_bdd_hu01_register_initiative_scenario` | Usuario `juan.perez@empresa.com`, confirmación explícita `zero_investment_confirmed = true` y `capex_amount = 0`, asignación de folio `KIZ-2026-0001`, transición `BORRADOR -> POR_APROBAR`, registro en `initiative_state_history` y notificación en bandeja de salida. |
| **HU-02** | Devolución de Entregable por Evidencia Insuficiente sin pérdida de historial | `test_bdd_hu02_mentor_returns_deliverable_scenario` | `test_bdd_hu02_mentor_returns_deliverable_scenario` | Folio `KIZ-2026-0015` en `POR_EVALUAR`, mentor `carlos.mentor@empresa.com`, comentario obligatorio $\ge 20$ caracteres, transición a `DEVUELTA_PARA_AJUSTES`, preservación de `return_target_state_id = PENDIENTE_RESULTADOS`, congelamiento de `Versión 1.0 (Devuelta)` y notificación de prioridad `HIGH`. |
| **HU-03** | Asignación y Reasignación de Mentor de Mejora Continua | `test_bdd_hu03_assign_mentor_scenario` | `test_bdd_hu03_assign_mentor_scenario` | Folio `KIZ-2026-0022` en `PENDIENTE_ASIGNACION_MENTOR`, coordinadora `ana.coord@empresa.com`, asignación de `roberto.mentor@empresa.com` (activo en `ORG-A`), transición automática a `PENDIENTE_PLAN_IMPLEMENTACION`, registro en `mentorship_assignments` y visibilidad en bandeja del mentor. |
| **HU-04** | Consulta de Tarjeta de Próxima Acción Requerida y Bloqueo de Ventana $> 8$ semanas | `test_bdd_hu04_next_action_card_and_8_week_limit_scenario` | `test_bdd_hu04_next_action_card_and_8_week_limit_scenario` | Folio `KIZ-2026-0030` en `PENDIENTE_PLAN_IMPLEMENTACION`, consulta de tarjeta UX (`LEADER`, límite 56 días / 8 semanas) y bloqueo determinístico con `MaxImplementationWindowExceededException` ante plan de 65 días. |
| **HU-05** | Exportación del Reporte C a Excel (`.xlsx`) respetando aislamiento Multi-Tenant | `test_bdd_hu05_export_report_multi_tenant_audit_metadata_scenario` | `test_bdd_hu05_export_report_multi_tenant_audit_metadata_scenario` | Aislamiento estricto `ORG-A` (3 registros) vs `ORG-B` (2 registros), metadatos de auditoría UTC ISO-8601 (`Z`), usuario solicitante `ana.coord@empresa.com` y conteo exacto. |

---

## 2. Catálogo de 15 Casos de Prueba Críticos (TC-TDD-001 a TC-TDD-015)

| ID Caso | Nombre del Test | Precondiciones | Aserciones Principales | Excepción / Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **TC-TDD-001** | `test_tc_tdd_001_valid_transition_draft_to_por_aprobar` | Iniciativa creada en `BORRADOR` en `ORG-A`. | Estado cambia a `POR_APROBAR`, folio `KIZ-2026-XXXX`, entrada en `state_history`. | Transición exitosa e historial inmutable. |
| **TC-TDD-002** | `test_tc_tdd_002_invalid_transition_draft_to_finalizada_raises_error` | Iniciativa en `BORRADOR`. | Intento de salto directo a `FINALIZADA`. | Lanza `InvalidStateTransitionException`. |
| **TC-TDD-003** | `test_tc_tdd_003_multi_tenant_isolation_blocks_cross_org_access` | Iniciativa registrada en `ORG-A`, actor autenticado en `ORG-B`. | Intento de lectura cruzada por `initiative_id`. | Lanza `CrossTenantAccessDeniedException`. |
| **TC-TDD-004** | `test_tc_tdd_004_zero_investment_required_on_k2_submission` | Actor intenta crear iniciativa `K2` con `zero_investment_confirmed=False` y `capex_amount=15000`. | Validación de regla de negocio K2 de Cero Inversión. | Lanza `ZeroInvestmentRequiredException`. |
| **TC-TDD-005** | `test_tc_tdd_005_evidence_replacement_after_return_increments_version_and_preserves_v1` | Iniciativa con `Versión 1.0` devuelta a `DEVUELTA_PARA_AJUSTES`. | Carga de nueva evidencia genera `Versión 2.0` activa y conserva `Versión 1.0 (Devuelta)` con `frozen=True`. | Coexistencia inmutable de ambas versiones. |
| **TC-TDD-006** | `test_tc_tdd_006_work_activity_plan_exceeding_8_weeks_raises_error` | Iniciativa en `PENDIENTE_PLAN_IMPLEMENTACION`. | Plan con duración de 57 días ($> 56$ días / 8 semanas). | Lanza `MaxImplementationWindowExceededException`. |
| **TC-TDD-007** | `test_tc_tdd_007_excel_report_c_stress_5000_records_under_3_seconds` | 5,000 iniciativas sembradas en `ORG-A`. | Generación de archivo `.xlsx` con cabecera binaria `PK` en $< 3.0\text{ s}$. | SLA de rendimiento cumplido ($< 3\text{ s}$). |
| **TC-TDD-008** | `test_tc_tdd_008_non_destructive_return_restores_exact_previous_state_and_keeps_stage_instances` | Iniciativa enviada desde `PENDIENTE_RESULTADOS` a `POR_EVALUAR`. | Devolución guarda `return_target_state_id = PENDIENTE_RESULTADOS`, preserva `stage_instances` y al reanudar restaura `PENDIENTE_RESULTADOS`. | Retorno no destructivo verificado. |
| **TC-TDD-009** | `test_tc_tdd_009_return_feedback_requires_minimum_20_characters` | Iniciativa en `POR_EVALUAR`. | Mentor intenta devolver con comentario `"Incompleto"` ($< 20$ caracteres). | Lanza `InsufficientReturnFeedbackException`. |
| **TC-TDD-010** | `test_tc_tdd_010_mentor_assignment_requires_same_org_and_active_profile` | Iniciativa en `PENDIENTE_ASIGNACION_MENTOR` en `ORG-A`; mentor en `ORG-B`. | Coordinadora intenta asignar mentor de otro tenant o inactivo. | Lanza `InvalidMentorAssignmentException`. |
| **TC-TDD-011** | `test_tc_tdd_011_approve_evaluation_k3_requires_gemba_5s_checklist_and_finance_validation` | Iniciativa `K3` en `POR_EVALUAR`. | Evaluador intenta aprobar con `gemba_5s_completed=False` o `finance_validated=False`. | Lanza `EvaluationPrerequisitesNotMetException`. |
| **TC-TDD-012** | `test_tc_tdd_012_roi_and_enterprise_value_formula_calculation` | Ahorro bruto anual $\$120,000$, costo operativo $\$20,000$, factor sostenibilidad $0.90$. | `net_annual_savings == 100000`, `enterprise_value == 90000`, `roi_percentage == 500.0`. | Precisión matemática financiera. |
| **TC-TDD-013** | `test_tc_tdd_013_duplicate_initiative_prevention_same_title_dept_program` | Iniciativa existente con mismo título, departamento y programa en `ORG-A`. | Intento de registro duplicado (con espacios/minúsculas). | Lanza `DuplicateInitiativeException`. |
| **TC-TDD-014** | `test_tc_tdd_014_rbac_tech_admin_blocked_from_content_and_mfa_enforced_for_privileged_roles` | Usuario `TECH_ADMIN` y coordinadora sin MFA (`mfa_verified=False`). | `TECH_ADMIN` bloqueado de aprobar evaluación; coordinadora sin MFA bloqueada de exportar Reporte C. | Lanza `PrivilegeViolationException` y `MFARequiredException`. |
| **TC-TDD-015** | `test_tc_tdd_015_transactional_audit_log_immutability_and_snapshots` | Iniciativa transicionada a `POR_APROBAR`. | Registro de `before_snapshot` y `after_snapshot`; intento de borrado o mutación de log. | Lanza `AuditLogTamperingException`. |

---

## 3. Especificación Mobile Web App por Rol (`CA-MOB-01` a `CA-MOB-05`)

Módulo de dominio probado: [`src/domain/mobileUxEngine.ts`](../src/domain/mobileUxEngine.ts) y [`kizukai_py/engine.py`](../kizukai_py/engine.py).

| Criterio SBD | Test Vitest (`tests/mobile_ux.test.ts`) | Test Pytest (`tests/test_kizukai_tdd.py`) | Regla y Contrato Determinista Verificado |
| :--- | :--- | :--- | :--- |
| **`CA-MOB-01`** | `TC-MOB-001`, `TC-MOB-002`, `TC-MOB-003` | `test_ca_mob_01_viewport_classification_and_desktop_intangibility` | `classifyViewport(width)`: `< 768` (`MOBILE`), `768..1023` (`TABLET`), `>= 1024` (`DESKTOP`). En `DESKTOP`, `showBottomNav=false, useBottomSheetModals=false, useCardTables=false` (intangibilidad del diseño de escritorio). |
| **`CA-MOB-02`** | `TC-MOB-004` | `test_ca_mob_02_role_profiles_for_all_5_roles` | `getMobileRoleProfile(role)`: Configura los 5 modos móviles (`Modo Gemba Express`, `Modo Gemba Walk & 5S`, `Modo Triage & Asignación`, `Modo Pulso Ejecutivo`, `Modo Pocket Control & RBAC`). |
| **`CA-MOB-03`** | `TC-MOB-005`, `TC-MOB-006`, `TC-MOB-007` | `test_ca_mob_03_mobile_wizard_3_steps_validation` | `validateMobileWizardStep(step, payload)`: Wizard móvil de 3 pasos para iniciativas K2 sin saturar al operador en Gemba, exigiendo `zero_investment_verified = true` en el Paso 3 salvo borrador (`asDraft = true`). |
| **`CA-MOB-04`** | `TC-MOB-008`, `TC-MOB-009`, `TC-MOB-010` | `test_ca_mob_04_and_05_mobile_quick_actions_and_rbac_enforcement` | `getMobileQuickActionForInitiative(role, state)`: Acciones de 1 toque en tarjeta móvil / Sticky Thumb-Zone (`REMITIR_CORRECCION_RAPIDA`, `APROBAR_FILTRO_1TAP`, `ASIGNAR_MENTOR_RAPIDO`, `VALIDAR_PLAN_RAPIDO`, `FIRMAR_5S_Y_APROBAR_K3`). |
| **`CA-MOB-05`** | `TC-MOB-007`, `TC-MOB-011` | `test_ca_mob_04_and_05_mobile_quick_actions_and_rbac_enforcement` | Paridad de invariantes Kizukai en móvil y bloqueo estricto de `TECH_ADMIN` (`NINGUNA_ACCION_OPERATIVA`, `isAvailable = false`). |

---

## 4. Evidencia Real de Ejecución en Fase Roja y Fase Verde

### 4.1 Fase Roja Inicial (Pre-implementación)
```text
tests\test_kizukai_tdd.py:11: in <module>
    from kizukai_py.engine import (
E   ModuleNotFoundError: No module named 'kizukai_py'
============================== 1 error in 0.68s ===============================
```

### 4.2 Fase Verde Verificada (`pytest` — 24/24 Passed)
```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\Miguel Gonzalez\Downloads\Kizukai
configfile: pytest.ini
collected 24 items

tests\test_kizukai_tdd.py ........................                       [100%]

============================= 24 passed in 0.62s ==============================
```

### 4.3 Fase Verde Verificada (`Vitest` — 31/31 Passed: 20 Core + 11 Mobile UX)
```text
 RUN  v2.1.8 C:/Users/Miguel Gonzalez/Downloads/Kizukai

 ✓ tests/mobile_ux.test.ts (11 tests) 22ms
 ✓ tests/kizukai.spec.ts (20 tests) 101ms

 Test Files  2 passed (2)
      Tests  31 passed (31)
```


