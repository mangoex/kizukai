-- =============================================================================
-- KIZUKAI PROJECT HUB - POSTGRESQL 16 DDL SCHEMA (22 ENTIDADES EXACTAS)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Entidad: organizations (Empresas Cliente)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(150) NOT NULL UNIQUE,
    commercial_name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(20) NULL,
    industry_sector VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2. Entidad: programs (Programas y Cohortes de Implementación)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_ideas_count INTEGER NOT NULL DEFAULT 0 CHECK (target_ideas_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PLANIFICADO' CHECK (status IN ('PLANIFICADO', 'ACTIVO', 'CERRADO')),
    CONSTRAINT chk_programs_dates CHECK (end_date >= start_date)
);

-- 3. Entidad: users (Usuarios de la Plataforma)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    employee_number VARCHAR(30) NULL,
    phone_number VARCHAR(25) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Entidad: roles (Roles del Sistema)
CREATE TABLE roles (
    id VARCHAR(30) PRIMARY KEY CHECK (id IN ('PARTICIPANT', 'MENTOR', 'COORDINATOR', 'CONSULTANT', 'TECH_ADMIN')),
    name VARCHAR(50) NOT NULL,
    description TEXT NULL
);

-- 5. Entidad: user_organization_roles (Asociación Multirrol por Empresa)
CREATE TABLE user_organization_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT uq_user_org_role UNIQUE (user_id, organization_id, role_id)
);

-- 6. Entidad: departments (Estructura Organizacional)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(80) NOT NULL,
    branch_office VARCHAR(80) NULL,
    CONSTRAINT uq_department_org_name UNIQUE (organization_id, name, branch_office)
);

-- 17. Entidad: business_states (Catálogo de Estados - creada antes de initiatives por FK)
CREATE TABLE business_states (
    id VARCHAR(30) PRIMARY KEY CHECK (id IN (
        'BORRADOR',
        'POR_APROBAR',
        'PENDIENTE_ASIGNACION_MENTOR',
        'PENDIENTE_PLAN_IMPLEMENTACION',
        'EN_IMPLEMENTACION',
        'PENDIENTE_RESULTADOS',
        'POR_EVALUAR',
        'POR_DOCUMENTAR',
        'FINALIZADA',
        'DEVUELTA_PARA_AJUSTES',
        'RECHAZADA',
        'CANCELADA'
    )),
    label VARCHAR(60) NOT NULL,
    sequence_order INTEGER NOT NULL
);

-- 7. Entidad: initiatives (Iniciativas de Mejora)
CREATE TABLE initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    tracking_code VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    k0_baseline TEXT NOT NULL,
    k1_job_function TEXT NOT NULL,
    k2_proactivity TEXT NOT NULL,
    k3_expected_impact TEXT NOT NULL,
    strategic_guideline VARCHAR(60) NOT NULL,
    zero_investment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    current_state_id VARCHAR(30) NOT NULL REFERENCES business_states(id) ON DELETE RESTRICT,
    return_target_state_id VARCHAR(30) NULL REFERENCES business_states(id) ON DELETE RESTRICT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    active_mentor_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    closed_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_zero_investment_on_submit CHECK (
        current_state_id = 'BORRADOR' OR zero_investment_confirmed = TRUE
    )
);

-- 8. Entidad: initiative_participants (Participantes y Equipo de Trabajo)
CREATE TABLE initiative_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_initiative_participant UNIQUE (initiative_id, user_id)
);

-- 9. Entidad: mentorship_assignments (Historial de Mentoría)
CREATE TABLE mentorship_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    unassigned_at TIMESTAMPTZ NULL,
    reassignment_reason TEXT NULL,
    CONSTRAINT chk_mentorship_dates CHECK (unassigned_at IS NULL OR unassigned_at >= assigned_at)
);

-- 10. Entidad: methodology_stages (Etapas Metodológicas Paramétricas)
CREATE TABLE methodology_stages (
    id VARCHAR(30) PRIMARY KEY CHECK (id IN (
        'STAGE_1_FILTER',
        'STAGE_2_LEADERSHIP',
        'STAGE_3_GEMBA',
        'STAGE_4_HARD_DATA',
        'STAGE_5_ALIGNMENT',
        'STAGE_6_STANDARD'
    )),
    step_number INTEGER NOT NULL UNIQUE CHECK (step_number BETWEEN 1 AND 6),
    name VARCHAR(80) NOT NULL,
    standard_duration_weeks INTEGER NOT NULL CHECK (standard_duration_weeks > 0)
);

-- 11. Entidad: initiative_stage_instances (Instancia de Etapa por Iniciativa)
CREATE TABLE initiative_stage_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    stage_id VARCHAR(30) NOT NULL REFERENCES methodology_stages(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    completed_at TIMESTAMPTZ NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_stage_instance_dates CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- 12. Entidad: work_activities (Plan de Trabajo y Tareas)
CREATE TABLE work_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    completion_percent INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_work_activity_dates CHECK (
        planned_end_date >= planned_start_date
        AND (planned_end_date - planned_start_date) <= 56
    )
);

-- 13. Entidad: deliverables (Definición de Entregables Requeridos)
CREATE TABLE deliverables (
    id VARCHAR(40) PRIMARY KEY,
    stage_id VARCHAR(30) NOT NULL REFERENCES methodology_stages(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE
);

-- 14. Entidad: evidences (Archivos y Respaldos Documentales)
CREATE TABLE evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    deliverable_id VARCHAR(40) NULL REFERENCES deliverables(id) ON DELETE RESTRICT,
    file_name VARCHAR(150) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number >= 1),
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 15. Entidad: reviews (Dictámenes y Revisiones de Mentor)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    stage_instance_id UUID NOT NULL REFERENCES initiative_stage_instances(id) ON DELETE RESTRICT,
    reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision VARCHAR(25) NOT NULL CHECK (decision IN ('APROBADO', 'DEVUELTO', 'RECHAZADO')),
    feedback_comments TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_review_feedback_length CHECK (
        decision <> 'DEVUELTO' OR char_length(trim(feedback_comments)) >= 20
    )
);

-- 16. Entidad: comments (Muro de Retroalimentación y Colaboración)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 18. Entidad: state_transition_history (Trazabilidad Inmutable de Estados)
CREATE TABLE state_transition_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    from_state_id VARCHAR(30) NULL REFERENCES business_states(id) ON DELETE RESTRICT,
    to_state_id VARCHAR(30) NOT NULL REFERENCES business_states(id) ON DELETE RESTRICT,
    changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transition_notes TEXT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 19. Entidad: metrics (Métricas Operativas Auditables)
CREATE TABLE metrics (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    unit_of_measure VARCHAR(25) NOT NULL
);

-- 20. Entidad: initiative_results (Cuantificación de Beneficios y ROI)
CREATE TABLE initiative_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE RESTRICT,
    metric_id VARCHAR(30) NOT NULL REFERENCES metrics(id) ON DELETE RESTRICT,
    baseline_k0_value NUMERIC(14,4) NOT NULL,
    achieved_k3_value NUMERIC(14,4) NOT NULL,
    financial_saving_annual NUMERIC(14,2) NULL,
    is_validated_by_finance BOOLEAN NOT NULL DEFAULT FALSE
);

-- 21. Entidad: notifications (Centro de Avisos Multicanal)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    initiative_id UUID NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    event_type VARCHAR(40) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 22. Entidad: audit_logs (Registro Técnico de Auditoría del Sistema)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(40) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    ip_address INET NULL,
    user_agent VARCHAR(255) NULL,
    payload_before JSONB NULL,
    payload_after JSONB NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- =============================================================================
-- ÍNDICES COMPUESTOS PARA SLA < 3.0 SEGUNDOS Y AISLAMIENTO MULTI-TENANT
-- =============================================================================
CREATE INDEX idx_initiatives_tenant_prog_state_creator
    ON initiatives (organization_id, program_id, current_state_id, created_by_user_id);

CREATE INDEX idx_initiatives_tenant_mentor_state
    ON initiatives (organization_id, active_mentor_id, current_state_id);

CREATE INDEX idx_initiatives_tenant_dept_guideline
    ON initiatives (organization_id, department_id, strategic_guideline);

CREATE INDEX idx_stage_instances_initiative_current
    ON initiative_stage_instances (initiative_id, is_current);

CREATE INDEX idx_evidences_initiative_deliverable_ver
    ON evidences (initiative_id, deliverable_id, version_number DESC);

CREATE INDEX idx_state_history_initiative_time
    ON state_transition_history (initiative_id, transitioned_at DESC);

CREATE INDEX idx_notifications_recipient_unread
    ON notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX idx_audit_logs_org_time
    ON audit_logs (organization_id, timestamp DESC);
