-- =============================================================================
-- KIZUKAI PROJECT HUB - SEED DATA (CATÁLOGOS OFICIALES Y ESCENARIOS MULTI-TENANT)
-- =============================================================================

-- 1. Catálogo de 12 Estados de Negocio (business_states)
INSERT INTO business_states (id, label, sequence_order) VALUES
('BORRADOR', 'Borrador en Redacción', 1),
('POR_APROBAR', 'Por Aprobar (Filtro Técnico)', 2),
('PENDIENTE_ASIGNACION_MENTOR', 'Pendiente de Asignación de Mentor', 3),
('PENDIENTE_PLAN_IMPLEMENTACION', 'Pendiente de Plan de Implementación', 4),
('EN_IMPLEMENTACION', 'En Implementación en Campo (8 Semanas)', 5),
('PENDIENTE_RESULTADOS', 'Pendiente de Carga de Resultados y Evidencias', 6),
('POR_EVALUAR', 'Por Evaluar (Gemba 5S y Costos K3)', 7),
('POR_DOCUMENTAR', 'Por Documentar Estándar POE', 8),
('FINALIZADA', 'Finalizada y Estandarizada', 9),
('DEVUELTA_PARA_AJUSTES', 'Devuelta para Ajustes y Subsanación', 10),
('RECHAZADA', 'Rechazada en Filtro Técnico', 11),
('CANCELADA', 'Cancelada Justificadamente', 12)
ON CONFLICT (id) DO NOTHING;

-- 2. Catálogo de 6 Etapas Metodológicas (methodology_stages)
INSERT INTO methodology_stages (id, step_number, name, standard_duration_weeks) VALUES
('STAGE_1_FILTER', 1, 'Paso 1: Filtro Técnico Riguroso', 1),
('STAGE_2_LEADERSHIP', 2, 'Paso 2: Liderazgo del Proponente', 7),
('STAGE_3_GEMBA', 3, 'Paso 3: Auditoría Presencial en el Gemba', 1),
('STAGE_4_HARD_DATA', 4, 'Paso 4: Datos Duros Comparativos (K0 vs K3)', 2),
('STAGE_5_ALIGNMENT', 5, 'Paso 5: Alineación Directiva', 1),
('STAGE_6_STANDARD', 6, 'Paso 6: Estándar Corporativo (POE)', 2)
ON CONFLICT (id) DO NOTHING;

-- 3. Catálogo de 5 Roles RBAC (roles)
INSERT INTO roles (id, name, description) VALUES
('PARTICIPANT', 'Participante (Colaborador)', 'Colaborador operativo proponente de iniciativas K2 bajo principio de Cero Inversión.'),
('MENTOR', 'Mentor de Mejora', 'Responsable de acompañamiento técnico, validación de plan de 8 semanas, auditoría presencial Gemba 5S y revisión de evidencias.'),
('COORDINATOR', 'Coordinador de Empresa', 'Gestor corporativo del tenant: aprueba filtro técnico, asigna mentores, supervisa rezagos y publica POE.'),
('CONSULTANT', 'Consultor Kizukai', 'Auditor metodológico multiempresa con visibilidad global de cohortes y validación de mejores prácticas K2/K3.'),
('TECH_ADMIN', 'Administrador Técnico', 'Operador de infraestructura, parámetros globales, seguridad y almacenamiento sin acceso a contenido funcional.')
ON CONFLICT (id) DO NOTHING;

-- 4. Catálogo de Entregables Obligatorios (deliverables)
INSERT INTO deliverables (id, stage_id, name, is_mandatory) VALUES
('DELIV_FEASIBILITY_BASELINE', 'STAGE_1_FILTER', 'Dictamen de factibilidad y registro de línea base K0/K1', TRUE),
('DELIV_WORK_PLAN_PHOTOS', 'STAGE_2_LEADERSHIP', 'Cronograma de actividades y registros fotográficos de implementación', TRUE),
('DELIV_CHECKLIST_5S', 'STAGE_3_GEMBA', 'Lista de verificación 5S auditada y firmada digitalmente en sitio por el mentor', TRUE),
('DELIV_ROI_MATRIX', 'STAGE_4_HARD_DATA', 'Matriz comparativa de rendimientos y cálculo auditado de ROI', TRUE),
('DELIV_DIRECTIVE_ACT', 'STAGE_5_ALIGNMENT', 'Acta de reconocimiento directivo y puntuación en perfil de proactividad', TRUE),
('DELIV_NEW_SOP', 'STAGE_6_STANDARD', 'Nuevo Procedimiento Operativo Estandarizado (POE) catalogado y publicado', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Catálogo de Métricas Operativas Auditables (metrics)
INSERT INTO metrics (id, name, unit_of_measure) VALUES
('MINUTOS_BUSQUEDA', 'Tiempo de búsqueda o localización de herramental', 'min'),
('HORAS_HOMBRE', 'Horas-hombre liberadas en proceso operativo', 'hrs'),
('MERMA_KG', 'Reducción de desperdicio físico o merma de materia prima', 'kg'),
('COSTO_MXN', 'Ahorro financiero directo anualizado en Pesos Mexicanos', 'MXN'),
('COSTO_USD', 'Ahorro financiero directo anualizado en Dólares', 'USD')
ON CONFLICT (id) DO NOTHING;

-- 6. Empresas Cliente Multi-Tenant (organizations)
INSERT INTO organizations (id, business_name, commercial_name, tax_id, industry_sector, is_active) VALUES
('11111111-1111-4111-8111-111111111111', 'Manufactura Eléctrica del Norte S.A.', 'Manufactura Eléctrica del Norte', 'MEN890123A1A', 'Eléctrico', TRUE),
('22222222-2222-4222-8222-222222222222', 'Alimentos Industriales del Bajío S.A.', 'Alimentos del Bajío', 'AIB940510B2B', 'Alimentos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Departamentos (departments)
INSERT INTO departments (id, organization_id, name, branch_office) VALUES
('d1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Mantenimiento Eléctrico', 'Planta 1 - Monterrey'),
('d1111112-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Ensamble de Transformadores', 'Planta 1 - Monterrey'),
('d2222221-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Línea de Envasado Aséptico', 'Planta Querétaro')
ON CONFLICT (id) DO NOTHING;

-- 8. Programas / Cohortes (programs)
INSERT INTO programs (id, organization_id, name, start_date, end_date, target_ideas_count, status) VALUES
('c1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Top Companies 2026', '2026-01-15', '2026-12-15', 50, 'ACTIVO'),
('c2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Top Companies 2026 - Bajío', '2026-02-01', '2026-11-30', 40, 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- 9. Usuarios para los 5 roles (users)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, employee_number, phone_number, is_active, mfa_enabled) VALUES
('a0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'juan.perez@empresa.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt1$hashparticipant', 'Juan', 'Pérez', 'EMP-1001', '+528110001001', TRUE, FALSE),
('a0000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'carlos.mentor@empresa.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt2$hashmentor1', 'Carlos', 'Mendoza', 'EMP-2001', '+528110002001', TRUE, FALSE),
('a0000003-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'roberto.mentor@empresa.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt3$hashmentor2', 'Roberto', 'Salazar', 'EMP-2002', '+528110002002', TRUE, FALSE),
('a0000004-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'ana.coord@empresa.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt4$hashcoord', 'Ana', 'Gómez', 'EMP-3001', '+528110003001', TRUE, TRUE),
('a0000005-0000-4000-8000-000000000005', NULL, 'kasuga.consultor@kizukai.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt5$hashconsult', 'Alejandro', 'Kasuga', 'KIZ-001', '+525510000001', TRUE, TRUE),
('a0000006-0000-4000-8000-000000000006', NULL, 'admin.tech@kizukai.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt6$hashtech', 'Soporte', 'Técnico', 'KIZ-999', '+525510000999', TRUE, TRUE),
('a0000007-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'laura.operadora@bajio.com', '$argon2id$v=19$m=65536,t=3,p=4$kizukaisalt7$hashbajio', 'Laura', 'Vázquez', 'BAJ-101', '+524420001001', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 10. Asociación de Roles por Organización (user_organization_roles)
INSERT INTO user_organization_roles (user_id, organization_id, role_id) VALUES
('a0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'PARTICIPANT'),
('a0000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'MENTOR'),
('a0000003-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'MENTOR'),
('a0000004-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'COORDINATOR'),
('a0000005-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'CONSULTANT'),
('a0000005-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'CONSULTANT'),
('a0000006-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'TECH_ADMIN'),
('a0000007-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'PARTICIPANT')
ON CONFLICT DO NOTHING;

-- 11. Iniciativas de Ejemplo (KIZ-2026-0001, KIZ-2026-0015, KIZ-2026-0022)
INSERT INTO initiatives (
    id, organization_id, program_id, department_id, tracking_code, title,
    k0_baseline, k1_job_function, k2_proactivity, k3_expected_impact,
    strategic_guideline, zero_investment_confirmed, current_state_id, return_target_state_id,
    created_by_user_id, active_mentor_id
) VALUES
(
    'f0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'd1111111-1111-4111-8111-111111111111',
    'KIZ-2026-0001',
    'Reducción de tiempo de localización de zapatas en furgoneta',
    'Se pierden 8.5 minutos buscando zapatas por falta de orden',
    'Mantenimiento preventivo en subestaciones eléctricas',
    'Montaje de tablero de sombra utilizando perfiles sobrantes',
    'Localización en menos de 30 segundos y cero errores de kit',
    'Reducción de Tiempos',
    TRUE,
    'POR_APROBAR',
    NULL,
    'a0000001-0000-4000-8000-000000000001',
    NULL
),
(
    'f0000015-0000-4000-8000-000000000015',
    '11111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'd1111111-1111-4111-8111-111111111111',
    'KIZ-2026-0015',
    'Estandarización de boquillas de calibración en banco dieléctrico',
    'Se extravían 3 boquillas por turno generando 25 minutos de paro operativo',
    'Calibración dieléctrica de transformadores de distribución',
    'Base magnética rotulada con espuma reciclada de empaque',
    'Cero extravíos y reducción del tiempo de preparación a 2 minutos',
    'Tiempos',
    TRUE,
    'POR_EVALUAR',
    NULL,
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000002'
),
(
    'f0000022-0000-4000-8000-000000000022',
    '11111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'd1111112-1111-4111-8111-111111111111',
    'KIZ-2026-0022',
    'Guía física de bobinado con retacería de nylamid',
    'Desalineación del cable de cobre en el 12% de las bobinas primarias',
    'Bobinado primario de transformadores trifásicos',
    'Fabricación de guía deslizante con bloques sobrantes de nylamid en taller',
    'Reducción del retrabajo de bobinado al 0.5%',
    'Calidad',
    TRUE,
    'PENDIENTE_ASIGNACION_MENTOR',
    NULL,
    'a0000001-0000-4000-8000-000000000001',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 12. Participantes Líderes (initiative_participants)
INSERT INTO initiative_participants (initiative_id, user_id, is_lead) VALUES
('f0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', TRUE),
('f0000015-0000-4000-8000-000000000015', 'a0000001-0000-4000-8000-000000000001', TRUE),
('f0000022-0000-4000-8000-000000000022', 'a0000001-0000-4000-8000-000000000001', TRUE)
ON CONFLICT DO NOTHING;

-- 13. Instancias de Etapa Iniciales (initiative_stage_instances)
INSERT INTO initiative_stage_instances (id, initiative_id, stage_id, is_current) VALUES
('e0000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000001', 'STAGE_1_FILTER', TRUE),
('e0000015-0000-4000-8000-000000000015', 'f0000015-0000-4000-8000-000000000015', 'STAGE_4_HARD_DATA', TRUE),
('e0000022-0000-4000-8000-000000000022', 'f0000022-0000-4000-8000-000000000022', 'STAGE_1_FILTER', TRUE)
ON CONFLICT (id) DO NOTHING;
