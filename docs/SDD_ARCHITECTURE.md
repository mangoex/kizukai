# Especificación de Diseño de Software (SDD): Kizukai Project Hub

## 1. Modelo Matemático y Metodológico Kizukai
El motor de dominio modela las cuatro variables operativas creadas por Alejandro Kasuga Sakai:
- **$K0$ (Estado Deficiente):** Anomalía, desperdicio (*muda*), merma o retrabajo cuantificado en línea base.
- **$K1$ (Funciones Básicas):** Cumplimiento del Procedimiento Operativo Estandarizado (POE) contractual.
- **$K2$ (Proactividad *Ki Wo Tsukau*):** Mejora voluntaria sujeta a dos invariantes duras de backend: **Cero Inversión** (`zero_investment_confirmed = true`) y ventana máxima improrrogable de **8 semanas (56 días)**.
- **$K3$ (Impacto y Beneficio):** Resultado auditado en el *Gemba* (5S) y validado por Finanzas/Costos confrontando $K0$ vs $K3$.

$$V_E = \sum_{i=1}^{n} \left( K1_i + (K2_i \cdot K3_i) \right) - K0$$

## 2. Diagrama de Componentes (Clean / Hexagonal Architecture)

```mermaid
flowchart TD
    subgraph Client["Frontend Web (React 18 + TypeScript + CSS Design System WCAG 2.1 AA)"]
        UI_Workspace["Espacio de Trabajo Unificado"]
        UI_Trays["4 Bandejas Especializadas por Rol"]
        SDK_Client["Kizukai TypeScript SDK (IKizukaiSDK)"]
    end

    subgraph API_Gateway["Capa de Entrada & Seguridad (Vercel Serverless API)"]
        AuthGuard["OIDC / JWT Guard (60m TTL) + MFA Enforcer"]
        TenantGuard["Multi-Tenant Isolation Middleware (organization_id)"]
        RBACGuard["RBAC Authorization Guard (5 Roles)"]
    end

    subgraph Core_Domain["Núcleo de Dominio Kizukai"]
        SME["StateMachineEngine (12 Estados & Guards)"]
        WAV["WorkActivityValidator (<= 56 días & Cero Inversión)"]
        EVS["EvidenceVersioningService (Inmutabilidad v1..vN)"]
        RPT["ExcelReportGenerator (Reportes A, B, C < 3.0s)"]
    end

    subgraph Infrastructure["Infraestructura y Persistencia"]
        PG[("PostgreSQL 16 / Serverless Store (22 Entidades + Índices Compuestos)")]
        S3[("Blob Storage / S3 (URLs Firmadas)")]
        Audit["Transactional AuditLogger (audit_logs JSONB)"]
    end

    UI_Workspace --> SDK_Client
    UI_Trays --> SDK_Client
    SDK_Client --> AuthGuard
    AuthGuard --> TenantGuard
    TenantGuard --> RBACGuard
    RBACGuard --> SME
    RBACGuard --> WAV
    RBACGuard --> EVS
    RBACGuard --> RPT
    SME --> PG
    SME --> Audit
    EVS --> S3
    EVS --> PG
    RPT --> PG
```

## 3. Diagrama de Flujo de Datos Multi-Tenant

```mermaid
flowchart LR
    Req["Solicitud HTTP + JWT + X-Organization-Id"] --> VerifyJWT["Verificar Firma JWT y MFA"]
    VerifyJWT --> CheckTenant{"¿Rol Global (CONSULTANT/TECH_ADMIN) o Coincide organization_id?"}
    CheckTenant -- "No" --> Deny403["HTTP 403 TenantIsolationViolationException"]
    CheckTenant -- "Sí" --> InjectFilter["Inyectar Filtro Global WHERE organization_id = :orgId"]
    InjectFilter --> ExecuteUseCase["Ejecutar Caso de Uso y Reglas de Guarda"]
    ExecuteUseCase --> WriteHistory["Insertar state_transition_history + audit_logs"]
    WriteHistory --> Resp["Respuesta Tipada (< 3.0s)"]
```

## 4. Diagrama de Secuencia: Devolución Inmutable y Subsanación Incremental

```mermaid
sequenceDiagram
    actor M as Mentor (carlos.mentor)
    participant SDK as KizukaiSDK
    participant SME as StateMachineEngine
    participant DB as PostgreSQL 16
    actor P as Participante (juan.perez)

    M->>SDK: returnWithFeedback(KIZ-2026-0015, "Falta anexar lista 5S firmada en Gemba")
    SDK->>SME: Validar rol MENTOR y longitud de comentario (>= 20 chars)
    SME->>DB: UPDATE initiatives SET current_state_id='DEVUELTA_PARA_AJUSTES', return_target_state_id='PENDIENTE_RESULTADOS'
    SME->>DB: UPDATE evidences SET is_frozen = TRUE WHERE initiative_id = KIZ-2026-0015
    SME->>DB: INSERT INTO reviews (decision='DEVUELTO', feedback_comments=...)
    SME->>DB: INSERT INTO state_transition_history (from='POR_EVALUAR', to='DEVUELTA_PARA_AJUSTES')
    SME->>DB: INSERT INTO notifications (recipient=juan.perez, event_type='FEEDBACK_REQUIRED')
    SME-->>M: Estado DEVUELTA_PARA_AJUSTES (Evidencias v1 congeladas)

    P->>SDK: submitCorrection(KIZ-2026-0015, nuevaEvidenciaChecklist5S)
    SDK->>SME: Calcular siguiente version_number = MAX(version_number) + 1 (v2)
    SME->>DB: INSERT INTO evidences (version_number=2, is_frozen=FALSE)
    SME->>DB: UPDATE initiatives SET current_state_id = return_target_state_id ('PENDIENTE_RESULTADOS'), return_target_state_id = NULL
    SME->>DB: INSERT INTO state_transition_history (from='DEVUELTA_PARA_AJUSTES', to='PENDIENTE_RESULTADOS')
    SME-->>P: Iniciativa restaurada a etapa origen con historial intacto
```

## 5. Máquina de 12 Estados de Negocio

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> POR_APROBAR: ENVIAR_A_REVISION (Participante)
    POR_APROBAR --> PENDIENTE_ASIGNACION_MENTOR: APROBAR_FILTRO_TECNICO (Coord/Consultor)
    POR_APROBAR --> RECHAZADA: RECHAZAR_IDEA (Coord/Consultor)
    PENDIENTE_ASIGNACION_MENTOR --> PENDIENTE_PLAN_IMPLEMENTACION: ASIGNAR_MENTOR (Coordinador)
    PENDIENTE_PLAN_IMPLEMENTACION --> EN_IMPLEMENTACION: VALIDAR_PLAN (Mentor, <= 8 sem)
    PENDIENTE_PLAN_IMPLEMENTACION --> DEVUELTA_PARA_AJUSTES: SOLICITAR_AJUSTE_PLAN (Mentor)
    EN_IMPLEMENTACION --> PENDIENTE_RESULTADOS: NOTIFICAR_TERMINO_OBRA (Participante, 100% tareas)
    PENDIENTE_RESULTADOS --> POR_EVALUAR: ENVIAR_A_EVALUACION (Participante, >= 2 evidencias K0/K3)
    POR_EVALUAR --> DEVUELTA_PARA_AJUSTES: DEVOLVER_EVIDENCIA (Mentor)
    POR_EVALUAR --> POR_DOCUMENTAR: APROBAR_EVALUACION_K3 (Mentor/Coord, Gemba 5S firmado)
    POR_DOCUMENTAR --> FINALIZADA: PUBLICAR_ESTANDAR_POE (Coord/Consultor)
    DEVUELTA_PARA_AJUSTES --> PENDIENTE_PLAN_IMPLEMENTACION: REMITIR_CORRECCION (Participante, nueva versión)
    DEVUELTA_PARA_AJUSTES --> PENDIENTE_RESULTADOS: REMITIR_CORRECCION (Participante, nueva versión)
    POR_APROBAR --> CANCELADA: CANCELAR_INICIATIVA (Coord/Consultor)
    EN_IMPLEMENTACION --> CANCELADA: CANCELAR_INICIATIVA (Coord/Consultor)
    RECHAZADA --> [*]
    CANCELADA --> [*]
    FINALIZADA --> [*]
```

## 6. Matriz RBAC Completa

| Módulo / Funcionalidad | `PARTICIPANT` | `MENTOR` | `COORDINATOR` | `CONSULTANT` | `TECH_ADMIN` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Registro de Iniciativa | Creación y Edición propia | Solo Lectura | Lectura en su empresa | Lectura global de cohorte | Sin acceso a contenido |
| Aprobación Filtro Técnico | Sin permiso | Solo Lectura | Aprobación / Rechazo | Aprobación / Auditoría | Sin permiso funcional |
| Asignación de Mentor | Sin permiso | Sin permiso | Asignación directa | Asignación / Supervisión | Solo soporte técnico |
| Plan y Actividades | Creación y Edición propia | Revisión y Acompañamiento | Supervisión | Supervisión metodológica | Sin acceso |
| Carga de Evidencias | Carga y Nueva Versión | Solo Lectura | Solo Lectura | Solo Lectura | Gestión de almacenamiento |
| Revisión y Devolución | Recepción y Corrección | Devolución con nota (>=20 chars) | Notificado | Supervisión | Sin acceso |
| Auditoría en Sitio (Gemba 5S) | Firma de conformidad | Carga checklist 5S firmado | Visualización | Validación técnica | Sin acceso |
| Validación Resultados y ROI | Captura de datos duros | Validación técnica | Aprobación con Costos | Aprobación final | Sin acceso |
| Estandarización y Cierre (POE)| Consulta de POE final | Consulta de POE final | Publicación en repositorio | Validación metodológica | Sin acceso |
| Descarga de Reportes Excel | Solo sus iniciativas | Reporte de asignadas | Reportes de su empresa | Consolidados multiempresa | Auditoría técnica |

## 7. Decisiones Arquitectónicas (ADRs)
- **ADR-001 (Aislamiento Multi-Tenant):** Todas las consultas de repositorio exigen `organization_id` validado contra el contexto del actor; cualquier cruce dispara `TenantIsolationViolationException` / `CrossTenantAccessDeniedException` (HTTP 403).
- **ADR-002 (No Regresión Destructiva):** Las devoluciones nunca ejecutan `DELETE` sobre `initiative_stage_instances`, `reviews` ni `evidences`. Se congela la evidencia (`is_frozen = TRUE`) y se guarda `return_target_state_id` para restaurar el flujo exacto tras `REMITIR_CORRECCION`.
- **ADR-003 (Índices Compuestos para SLA < 3.0s):** Se indexan `(organization_id, program_id, current_state_id, created_by_user_id)` para garantizar que las bandejas y la exportación de 5,000 filas del Reporte C respondan en `< 3.0 segundos`.
