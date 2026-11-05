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
