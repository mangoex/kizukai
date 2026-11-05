# Especificaciones Basadas en Diseño (SBD): Kizukai Project Hub

## 1. Reglas de Negocio Innegociables (Invariantes Kizukai)
1. **RN-01 (Cero Inversión en K2):** Ninguna iniciativa puede transitar de `BORRADOR` a `POR_APROBAR` ni superar el Filtro Técnico si `zero_investment_confirmed` es `false` (`ZeroInvestmentRequiredException`).
2. **RN-02 (Ventana Improrrogable de 8 Semanas):** El plan de trabajo (`work_activities`) no puede superar 56 días calendario entre la fecha de inicio más temprana y la fecha de término más tardía (`MaxImplementationWindowExceededException`).
3. **RN-03 (Auditoría Presencial Gemba 5S):** El avance de `POR_EVALUAR` a `POR_DOCUMENTAR` se bloquea si no existe evidencia del entregable `DELIV_CHECKLIST_5S` firmada en sitio y validación de Finanzas (`EvaluationPrerequisitesNotMetException` / `MissingGembaAuditChecklistException`).
4. **RN-04 (Devolución No Destructiva y Versionamiento):** Toda devolución exige comentario técnico $\ge 20$ caracteres (`InsufficientReturnFeedbackException` / `InsufficientFeedbackCommentException`), transita a `DEVUELTA_PARA_AJUSTES`, congela las evidencias previas (`is_frozen = true`) y exige que la corrección incremente `version_number` (`v1` $\rightarrow$ `v2`).
5. **RN-05 (Seguridad Multi-Tenant y MFA):** Roles privilegiados (`COORDINATOR`, `CONSULTANT`, `TECH_ADMIN`) requieren `mfaVerified = true` (`MFARequiredException`). Ningún usuario de un tenant puede leer o mutar recursos de otro tenant (`CrossTenantAccessDeniedException` / `TenantIsolationViolationException`).

## 2. Matriz de Transiciones y Condiciones de Guarda

| Estado Origen | Evento Desencadenante | Estado Destino | Rol Autorizado | Condición de Guarda (Backend Guard) |
| :--- | :--- | :--- | :--- | :--- |
| `BORRADOR` | `ENVIAR_A_REVISION` | `POR_APROBAR` | `PARTICIPANT` | Campos `k0`, `k1`, `k2`, `k3` completos + `zero_investment_confirmed = true`; genera folio `KIZ-YYYY-XXXX`. |
| `POR_APROBAR` | `APROBAR_FILTRO_TECNICO` | `PENDIENTE_ASIGNACION_MENTOR` | `COORDINATOR`, `CONSULTANT` | Validación afirmativa de Cero Inversión y normativas de seguridad (NOM/ISO). |
| `POR_APROBAR` | `RECHAZAR_IDEA` | `RECHAZADA` | `COORDINATOR`, `CONSULTANT` | Justificación técnica obligatoria en bitácora de auditoría. |
| `PENDIENTE_ASIGNACION_MENTOR` | `ASIGNAR_MENTOR` | `PENDIENTE_PLAN_IMPLEMENTACION` | `COORDINATOR` | El mentor pertenece a la misma `organization_id`, tiene rol `MENTOR` y `is_active = true`. |
| `PENDIENTE_PLAN_IMPLEMENTACION` | `VALIDAR_PLAN` | `EN_IMPLEMENTACION` | `MENTOR` | Actividades desglosadas con duración total $\le 8$ semanas (56 días). |
| `PENDIENTE_PLAN_IMPLEMENTACION` | `SOLICITAR_AJUSTE_PLAN` | `DEVUELTA_PARA_AJUSTES` | `MENTOR` | Comentario obligatorio $\ge 20$ caracteres; guarda `return_target_state_id = 'PENDIENTE_PLAN_IMPLEMENTACION'`. |
| `EN_IMPLEMENTACION` | `NOTIFICAR_TERMINO_OBRA` | `PENDIENTE_RESULTADOS` | `PARTICIPANT` | Todas las tareas en `work_activities` tienen `completion_percent = 100`. |
| `PENDIENTE_RESULTADOS` | `ENVIAR_A_EVALUACION` | `POR_EVALUAR` | `PARTICIPANT` | Al menos 2 evidencias obligatorias adjuntas (registro K0 previo y registro K3 actual). |
| `POR_EVALUAR` | `DEVOLVER_EVIDENCIA` | `DEVUELTA_PARA_AJUSTES` | `MENTOR` | Nota obligatoria $\ge 20$ caracteres; congela evidencias previas; `return_target_state_id = 'PENDIENTE_RESULTADOS'`. |
| `POR_EVALUAR` | `APROBAR_EVALUACION_K3` | `POR_DOCUMENTAR` | `MENTOR`, `COORDINATOR` | Lista de verificación 5S del *Gemba* (`DELIV_CHECKLIST_5S`) firmada y validada + visto bueno de Costos. |
| `POR_DOCUMENTAR` | `PUBLICAR_ESTANDAR_POE` | `FINALIZADA` | `COORDINATOR`, `CONSULTANT` | Archivo de nuevo POE (`DELIV_NEW_SOP`) subido y catalogado; asigna `closed_at`. |
| `DEVUELTA_PARA_AJUSTES` | `REMITIR_CORRECCION` | Estado Previo Origen | `PARTICIPANT` | Nueva versión de entregable (`version_number + 1`) cargada sin sobreescribir historial. |
| Cualquier estado activo | `CANCELAR_INICIATIVA` | `CANCELADA` | `COORDINATOR`, `CONSULTANT` | Dictamen formal de cancelación justificada firmado por gerencia. |

## 3. Especificación del Espacio de Trabajo Unificado (`InitiativeWorkspaceView`)
- **Cabecera de Estado y Línea de Vida:** Muestra permanentemente `tracking_code` (ej. `KIZ-2026-0042`), `title`, empresa, departamento, proponente líder, mentor activo, `%` de avance general, estado actual y fecha límite de la etapa.
- **Tarjeta de Próxima Acción Requerida (`NextRequiredActionCard`):** Identifica de forma inequívoca la acción inmediata, el nombre y rol del usuario responsable actual, la fecha de vencimiento y el botón de acción directa.
- **5 Pestañas de Contexto Metodológico:**
  1. *Diagnóstico y Línea Base:* Desglose K0, K1, K2 (Cero Inversión) y K3 proyectado.
  2. *Plan de Trabajo y Entregables:* Cronograma semanal (`work_activities`) y entregables por etapa (`deliverables`).
  3. *Bóveda de Evidencias:* Archivos en S3/Blob Storage con `version_number` e indicador `is_frozen`.
  4. *Panel de Mentoría y Retroalimentación:* Muro cronológico de `comments`, `reviews` y dictámenes *Gemba*.
  5. *Bitácora de Trazabilidad Histórica:* Eventos inmutables de `state_transition_history`.

## 4. Especificación de las 4 Bandejas por Rol
1. **Bandeja del Participante (`PARTICIPANT`):** Subgrupos: *Borradores pendientes de envío*, *Iniciativas con observaciones por corregir (`DEVUELTA_PARA_AJUSTES`)*, *Iniciativas en implementación activa* e *Iniciativas finalizadas y estandarizadas*.
2. **Bandeja del Mentor (`MENTOR`):** Priorizada por urgencia cronológica: *Entregables pendientes de revisión*, *Auditorías de Gemba programadas*, *Iniciativas próximas a vencer en la ventana de 8 semanas* e *Iniciativas rezagadas*.
3. **Bandeja del Coordinador (`COORDINATOR`):** Orientada a control de gestión: *Ideas nuevas pendientes de filtro técnico (`POR_APROBAR`)*, *Iniciativas aprobadas sin mentor asignado (`PENDIENTE_ASIGNACION_MENTOR`)*, *Iniciativas con alerta de estancamiento (> 7 días sin actividad)* y *Resumen de avance contra metas de la cohorte*.
4. **Bandeja del Consultor Kizukai (`CONSULTANT`):** Visión global multiempresa: *Consolidado de empresas cliente*, *Semáforo de cumplimiento metodológico por cohorte* y *Directorio de mejores prácticas K2/K3 elegibles para replicación corporativa*.

## 5. Especificación de los 3 Reportes Prioritarios y Reglas de Exportación
- **Reporte A (Desempeño e Ideas por Participante):** Columnas: Número de Empleado, Nombre Completo, Correo Electrónico, Empresa, Sucursal/Planta, Departamento, Mentor Habitual Asignado, Total Ideas Registradas, Ideas en Borrador, Ideas en Implementación, Ideas Finalizadas, Puntos de Proactividad Acumulados.
- **Reporte B (Estadísticas de Iniciativas vs. Metas de Cohorte):** Columnas: Empresa Cliente, Programa/Cohorte, Departamento/Área, Cantidad de Participantes Activos, Meta Comprometida de Iniciativas, Iniciativas Registradas Reales, Porcentaje de Avance vs Meta, Iniciativas en Tiempo, Iniciativas con Retraso (> 8 semanas), Total de Ahorro Económico Validado (K3).
- **Reporte C (Iniciativas en Proceso y Seguimiento de Etapas):** Columnas: Consecutivo, Folio de Iniciativa, Título de la Mejora, Nombre del Proponente, Departamento, Sucursal, Situación Deficiente K0 (Resumen), Propuesta Proactiva K2 (Resumen), Beneficio K3 Proyectado, Estado de Negocio Actual, Etapa Metodológica Activa, Nombre del Mentor Asignado, Fecha de Registro, Fecha Límite de Implementación, Días Restantes/Retraso, Directriz Estratégica, Métrica Primaria.
- **Invariantes de Exportación:** Filtro automático por `organization_id` para `COORDINATOR` (extracción multiempresa exclusiva para `CONSULTANT` y `TECH_ADMIN`), generación en `< 3.0 segundos` (hasta 5,000 registros en Reporte C) e inclusión obligatoria de metadatos de auditoría (marca de tiempo UTC, nombre del usuario solicitante y total de registros procesados).

## 6. Especificación Mobile Web App por Rol (`CA-MOB-01` a `CA-MOB-05`)

La arquitectura **Mobile-First Web App / PWA** de Kizukai adapta la ergonomía táctil (*Thumb-Zone*) y simplifica los flujos por rol en dispositivos móviles y tablets sin alterar la experiencia de escritorio:

- **`CA-MOB-01` (Intangibilidad de Escritorio y Cortes Deterministas de Viewport):**
  - `width < 768px` $\rightarrow$ `MOBILE` (`showBottomNav: true`, `useBottomSheetModals: true`, `useCardTables: true`).
  - `768px <= width <= 1023px` $\rightarrow$ `TABLET` (`showBottomNav: true`, `useBottomSheetModals: true`, `useCardTables: true`).
  - `width >= 1024px` $\rightarrow$ `DESKTOP` (`showBottomNav: false`, `useBottomSheetModals: false`, `useCardTables: false`), preservando intactos el Sidebar fijo, Topbar y tablas densas de escritorio.
- **`CA-MOB-02` (Divulgación Progresiva por Rol — 5 Modos Móviles Dedicados):**
  - `PARTICIPANT`: **"Modo Gemba Express"** — CTA `+ Nueva Idea K2 (3 Pasos)`, píldoras rápidas de ajuste e implementación.
  - `MENTOR`: **"Modo Gemba Walk & 5S"** — CTA `Evaluar Entregable / 5S`, píldoras de evaluación K3 y planes $\le 8$ semanas.
  - `COORDINATOR`: **"Modo Triage & Asignación"** — CTA `Triage de Bandeja`, aprobación de filtro técnico de 1 toque y asignación rápida de mentor.
  - `CONSULTANT`: **"Modo Pulso Ejecutivo"** — CTA `Exportar Sabana C (.xlsx)`, lectura ejecutiva multiempresa y mejores prácticas K3.
  - `TECH_ADMIN`: **"Modo Pocket Control & RBAC"** — CTA `Verificar Estado MFA & Tenants`, `allowQuickCardActions = false` (bloqueado de contenido funcional).
- **`CA-MOB-03` (Wizard Móvil de 3 Pasos para Captura K2 en Gemba):**
  - Divide el formulario en 3 pasos secuenciales validados (`validateMobileWizardStep(step, payload)`):
    1. *Identificación en Gemba:* Título ($\ge 5$ caracteres), Departamento y Directriz estratégica.
    2. *Diagnóstico K0/K1 y Propuesta K2:* Situación deficiente K0 ($\ge 10$ caracteres), Condición básica K1 ($\ge 5$ caracteres) y Proactividad K2 ($\ge 10$ caracteres).
    3. *Impacto K3 y Declaración Cero Inversión:* Beneficio esperado K3 ($\ge 5$ caracteres) y check obligatorio `zero_investment_verified = true` para envío formal (permitiendo guardar borrador con `asDraft = true`).
- **`CA-MOB-04` (Acciones Rápidas de 1 Toque en Tarjeta Móvil y Sticky Thumb-Zone Bar):**
  - `PARTICIPANT` en `DEVUELTA_PARA_AJUSTES` $\rightarrow$ `REMITIR_CORRECCION_RAPIDA` (con Bottom Sheet de confirmación).
  - `COORDINATOR` en `POR_APROBAR` $\rightarrow$ `APROBAR_FILTRO_1TAP`.
  - `COORDINATOR` en `PENDIENTE_ASIGNACION_MENTOR` $\rightarrow$ `ASIGNAR_MENTOR_RAPIDO`.
  - `MENTOR` en `PENDIENTE_PLAN_IMPLEMENTACION` $\rightarrow$ `VALIDAR_PLAN_RAPIDO`.
  - `MENTOR` en `POR_EVALUAR` $\rightarrow$ `FIRMAR_5S_Y_APROBAR_K3`.
- **`CA-MOB-05` (Paridad de Invariantes y Gobernanza RBAC en Móvil):**
  - Todas las acciones rápidas móviles respetan las invariantes del motor de dominio (Cero Inversión, ventana de 8 semanas / 56 días, comentario mínimo de 20 caracteres en devolución, checklist Gemba 5S y bloqueo total de acciones operativas para `TECH_ADMIN` con `NINGUNA_ACCION_OPERATIVA`).

