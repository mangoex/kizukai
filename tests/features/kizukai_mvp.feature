# language: es
Característica: Kizukai Project Hub MVP - Motor de Ciclo de Vida de Iniciativas Kaizen y Gobernanza Multi-Tenant
  Como plataforma SaaS B2B de Mejora Continua e Innovación Operativa (Kizukai)
  Quiero gestionar el flujo de vida determinístico de iniciativas (K1, K2, K3), entregables versionados, mentorías y reportes ejecutivos
  Para asegurar trazabilidad completa, retornos no destructivos, validación de Cero Inversión y aislamiento estricto por organización

  Antecedentes:
    Dado que la organización "ORG-A" se encuentra activa en Kizukai Project Hub
    Y existen los programas configurados "K1", "K2" y "K3" con su flujo de 12 estados determinísticos

  @HU-01 @K2 @CeroInversion
  Escenario: HU-01 Registro exitoso de Iniciativa Proactiva K2 con validación de Cero Inversión
    Dado que el empleado "juan.perez@empresa.com" autenticado en "ORG-A" inicia una iniciativa en estado "BORRADOR"
    Y selecciona el programa "K2" para el departamento "Operaciones Planta Norte"
    Cuando completa el formulario con título "Reducción de tiempos de cambio de molde SMED"
    Y confirma explícitamente la declaración de "Cero Inversión" (`zero_investment_confirmed = true` y `capex_amount = 0`)
    Y envía la iniciativa para aprobación del patrocinador
    Entonces el sistema asigna un folio único con formato "KIZ-2026-0001"
    Y el estado de la iniciativa transiciona de "BORRADOR" a "POR_APROBAR"
    Y se registra un evento inmutable en "initiative_state_history" con el actor "juan.perez@empresa.com"
    Y se encola una notificación para el aprobador del departamento "Operaciones Planta Norte"

  @HU-02 @DevolucionNoDestructiva @VersionadoEvidencia
  Escenario: HU-02 Devolución de Entregable por Evidencia Insuficiente sin pérdida de historial
    Dado que la iniciativa con folio "KIZ-2026-0015" en "ORG-A" se encuentra en estado "POR_EVALUAR"
    Y su estado operativo previo antes de enviar a evaluación era "PENDIENTE_RESULTADOS"
    Y cuenta con un entregable de evidencia en "Versión 1.0" adjunto por el líder de iniciativa
    Cuando el mentor asignado "carlos.mentor@empresa.com" rechaza temporalmente la evaluación para solicitar ajustes
    Y proporciona el comentario obligatorio "La evidencia fotográfica del antes y después no muestra el tacómetro calibrado ni la hoja estándar firmada."
    Entonces el estado de la iniciativa transiciona a "DEVUELTA_PARA_AJUSTES"
    Y el campo "return_target_state_id" preserva exactamente el valor "PENDIENTE_RESULTADOS"
    Y el entregable previo queda congelado de forma inmutable como "Versión 1.0 (Devuelta)"
    Y se conservan íntegras todas las instancias de etapa ("initiative_stage_instances") y el historial de estados
    Y se emite una notificación de prioridad "HIGH" al autor de la iniciativa con el feedback del mentor

  @HU-03 @Mentoria @RBAC
  Escenario: HU-03 Asignación y Reasignación de Mentor de Mejora Continua
    Dado que la iniciativa con folio "KIZ-2026-0022" en "ORG-A" se encuentra en estado "PENDIENTE_ASIGNACION_MENTOR"
    Y la coordinadora de mejora continua "ana.coord@empresa.com" tiene rol activo "PROGRAM_COORDINATOR" en "ORG-A"
    Y el usuario "roberto.mentor@empresa.com" tiene un perfil activo con rol "MENTOR" en la misma organización "ORG-A"
    Cuando "ana.coord@empresa.com" asigna a "roberto.mentor@empresa.com" como mentor titular de la iniciativa "KIZ-2026-0022"
    Entonces el estado de la iniciativa transiciona automáticamente a "PENDIENTE_PLAN_IMPLEMENTACION"
    Y se crea un registro activo en "mentorship_assignments" vinculando a "roberto.mentor@empresa.com" con "KIZ-2026-0022"
    Y la iniciativa "KIZ-2026-0022" aparece inmediatamente en la bandeja de mentoría de "roberto.mentor@empresa.com"

  @HU-04 @UXNextAction @Ventana8Semanas
  Escenario: HU-04 Consulta de Tarjeta de Próxima Acción Requerida y Bloqueo de Ventana de Implementación mayor a 8 semanas
    Dado que la iniciativa con folio "KIZ-2026-0030" en "ORG-A" se encuentra en estado "PENDIENTE_PLAN_IMPLEMENTACION"
    Cuando el propietario consulta la vista de detalle de la iniciativa
    Entonces el sistema presenta la Tarjeta de Próxima Acción Requerida indicando "Registrar Plan de Actividades (Máximo 8 semanas / 56 días)" y el rol responsable "LEADER"
    Cuando el propietario intenta registrar un plan de trabajo con fecha de inicio "2026-03-01" y fecha de fin "2026-05-05" (65 días naturales)
    Entonces el motor de dominio rechaza el plan lanzando la excepción "MaxImplementationWindowExceededException"
    Y la iniciativa permanece en estado "PENDIENTE_PLAN_IMPLEMENTACION"

  @HU-05 @Reportes @MultiTenant @Excel
  Escenario: HU-05 Exportación del Reporte C a Excel (.xlsx) respetando aislamiento Multi-Tenant y metadatos de auditoría
    Dado que existen 3 iniciativas registradas en "ORG-A" y 2 iniciativas confidenciales registradas en "ORG-B"
    Cuando la coordinadora "ana.coord@empresa.com" de "ORG-A" solicita la exportación del "Reporte C - Sabana Ejecutiva de Iniciativas" en formato ".xlsx"
    Entonces el archivo generado contiene exclusivamente las 3 iniciativas pertenecientes a "ORG-A" y ninguna de "ORG-B"
    Y los metadatos de auditoría del reporte incluyen el timestamp en formato UTC ISO-8601, el usuario solicitante "ana.coord@empresa.com", el tenant "ORG-A" y el total de registros igual a 3
