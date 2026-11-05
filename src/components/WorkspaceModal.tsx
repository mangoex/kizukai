import React, { useState } from 'react';
import {
  Initiative,
  User,
  MethodologicalStep,
  Gemba5SChecklist,
  Evidence
} from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface WorkspaceModalProps {
  initiative: Initiative;
  currentUser: User;
  onClose: () => void;
  onInitiativeUpdated: (updated: Initiative) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  initiative: initialInitiative,
  currentUser,
  onClose,
  onInitiativeUpdated
}) => {
  const [initiative, setInitiative] = useState<Initiative>(initialInitiative);
  const [activeTab, setActiveTab] = useState<
    'diagnostic' | 'plan' | 'evidences' | 'mentorship' | 'history'
  >('diagnostic');

  // Estados de formularios para las transiciones
  const [selectedMentor, setSelectedMentor] = useState<{ id: string; name: string }>({
    id: 'usr-002-carlos',
    name: 'Carlos Mendoza'
  });
  const [devolutionJustification, setDevolutionJustification] = useState('');
  const [showDevolutionDialog, setShowDevolutionDialog] = useState(false);
  const [weeksCount, setWeeksCount] = useState<number>(6); // Default dentro de las 8 semanas
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState<
    'FOTO_ANTES' | 'FOTO_DESPUES' | 'MEDICION_GEMBA' | 'GRAFICA_CONTROL'
  >('MEDICION_GEMBA');
  const [newEvidenceText, setNewEvidenceText] = useState('');

  // Checklist 5S
  const [checklist5s, setChecklist5s] = useState<Gemba5SChecklist>(
    initiative.checklist5s || {
      seiri_clasificar: true,
      seiton_ordenar: true,
      seiso_limpiar: true,
      seiketsu_estandarizar: true,
      shitsuke_disciplina: true,
      score: 95,
      evaluatedBy: currentUser.name,
      evaluatedAt: new Date().toISOString(),
      digitalSignature: `SIG-5S-${currentUser.name.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
      financeValidated: true
    }
  );

  const [sopCode, setSopCode] = useState(`POE-2026-${initiative.folio.split('-')[2] || '001'}`);
  const [sopTitle, setSopTitle] = useState(`POE: Estandarización y Buenas Prácticas para ${initiative.title}`);

  const [feedbackInput, setFeedbackInput] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const clearBanners = () => {
    setErrorBanner(null);
    setSuccessBanner(null);
  };

  // Ejecutor de transiciones de la máquina de estados
  const handleExecuteAction = (action: string, customPayload: any = {}) => {
    clearBanners();

    const payload = {
      user: currentUser,
      ...customPayload
    };

    const res = StorageService.transitionInitiative(initiative.id, action, payload);

    if (res.success && res.initiative) {
      setInitiative(res.initiative);
      onInitiativeUpdated(res.initiative);
      setSuccessBanner(`Transición ejecutada exitosamente: ${action} → Estado: ${res.initiative.state}`);
      setShowDevolutionDialog(false);
      setDevolutionJustification('');
    } else {
      setErrorBanner(res.error || 'No se pudo completar la transición.');
    }
  };

  // Toggle de tarea del plan
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = initiative.tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return t;
    });

    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const progressPercent = Math.round((completedCount / updatedTasks.length) * 100);

    const updatedInit: Initiative = {
      ...initiative,
      tasks: updatedTasks,
      progressPercent,
      updatedAt: new Date().toISOString()
    };

    const all = StorageService.getInitiativesRaw();
    const updatedList = all.map((it) => (it.id === updatedInit.id ? updatedInit : it));
    StorageService.saveInitiativesRaw(updatedList);

    setInitiative(updatedInit);
    onInitiativeUpdated(updatedInit);
  };

  // Añadir feedback regular de mentor
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInput.trim()) return;

    const newFeedback = {
      id: `fb-${Date.now()}`,
      mentorName: currentUser.name,
      comment: feedbackInput.trim(),
      createdAt: new Date().toISOString(),
      type: 'OBSERVACION' as const
    };

    const updatedInit = {
      ...initiative,
      feedbackList: [...initiative.feedbackList, newFeedback],
      updatedAt: new Date().toISOString()
    };

    const all = StorageService.getInitiativesRaw();
    const updatedList = all.map((it) => (it.id === updatedInit.id ? updatedInit : it));
    StorageService.saveInitiativesRaw(updatedList);

    setInitiative(updatedInit);
    onInitiativeUpdated(updatedInit);
    setFeedbackInput('');
    setSuccessBanner('Observación formativa registrada correctamente.');
  };

  // Cálculo de Próxima Acción Requerida
  const getNextActionConfig = () => {
    switch (initiative.state) {
      case 'BORRADOR':
        return {
          actionTitle: 'Enviar Iniciativa a Revisión Técnica',
          responsibleRole: 'Participante (Proponente)',
          deadline: initiative.deadlineDate,
          buttonText: '🚀 ENVIAR A REVISIÓN',
          buttonColor: 'var(--kiz-primary)',
          onExecute: () => handleExecuteAction('ENVIAR_A_REVISION')
        };
      case 'POR_APROBAR':
        return {
          actionTitle: 'Evaluar Filtro Técnico y Cero Inversión',
          responsibleRole: 'Coordinador de Empresa / Consultor',
          deadline: 'Inmediata',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExecuteAction('APROBAR_FILTRO_TECNICO', { justification: 'Aprobada por Coordinación.' })}
                className="kiz-btn kiz-btn-success"
              >
                ✓ APROBAR FILTRO TÉCNICO
              </button>
              <button
                onClick={() => handleExecuteAction('RECHAZAR_IDEA', { justification: 'No cumple directrices mínimas.' })}
                className="kiz-btn kiz-btn-danger"
              >
                ✗ RECHAZAR IDEA
              </button>
            </div>
          )
        };
      case 'PENDIENTE_ASIGNACION_MENTOR':
        return {
          actionTitle: 'Asignar Mentor Técnico Especialista',
          responsibleRole: 'Coordinador de Empresa',
          deadline: '48 horas',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="kiz-select"
                style={{ maxWidth: 260 }}
                value={selectedMentor.id}
                onChange={(e) => {
                  const name = e.target.value === 'usr-002-carlos' ? 'Carlos Mendoza' : 'Roberto Sánchez';
                  setSelectedMentor({ id: e.target.value, name });
                }}
              >
                <option value="usr-002-carlos">Carlos Mendoza (Mentor Ensamble)</option>
                <option value="usr-003-roberto">Roberto Sánchez (Mentor Troquelado/5S)</option>
              </select>
              <button
                onClick={() =>
                  handleExecuteAction('ASIGNAR_MENTOR', {
                    mentorId: selectedMentor.id,
                    mentorName: selectedMentor.name,
                    justification: `Asignado por Coordinación a ${selectedMentor.name}`
                  })
                }
                className="kiz-btn kiz-btn-primary"
              >
                🧑‍🏫 ASIGNAR MENTOR
              </button>
            </div>
          )
        };
      case 'PENDIENTE_PLAN_IMPLEMENTACION':
        return {
          actionTitle: 'Validar Cronograma de Trabajo (Máximo 8 Semanas / 56 Días)',
          responsibleRole: 'Mentor de Mejora',
          deadline: '7 días hábiles',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Duración:</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={weeksCount}
                  onChange={(e) => setWeeksCount(Number(e.target.value))}
                  className="kiz-input"
                  style={{ width: 75, padding: '0.3rem 0.5rem', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.78rem', color: weeksCount > 8 ? 'var(--kiz-danger)' : 'var(--kiz-text-muted)' }}>
                  semanas {weeksCount > 8 ? '(¡Excede límite de 8!)' : ''}
                </span>
              </div>
              <button
                onClick={() =>
                  handleExecuteAction('VALIDAR_PLAN', {
                    weeksCount,
                    justification: `Plan validado por mentor para ejecutarse en ${weeksCount} semanas.`
                  })
                }
                className="kiz-btn kiz-btn-success"
              >
                ✓ VALIDAR PLAN IMPLEMENTACIÓN
              </button>
              <button
                onClick={() =>
                  handleExecuteAction('DEVOLVER_EVIDENCIA', {
                    justification: 'El plan de trabajo requiere mayor desglose de tareas en la semana 3 y 4 antes de iniciar.'
                  })
                }
                className="kiz-btn kiz-btn-secondary"
              >
                Solicitar Ajuste
              </button>
            </div>
          )
        };
      case 'EN_IMPLEMENTACION':
        return {
          actionTitle: 'Notificar Término de Tareas de Gemba (100% Ejecutado)',
          responsibleRole: 'Participante (Proponente)',
          deadline: initiative.deadlineDate,
          buttonText: '🏁 NOTIFICAR TÉRMINO DE OBRA',
          buttonColor: 'var(--kiz-primary)',
          onExecute: () => handleExecuteAction('NOTIFICAR_TERMINO_OBRA')
        };
      case 'DEVUELTA_PARA_AJUSTES':
        return {
          actionTitle: 'Remitir Corrección con Versión 2.0 de Evidencias',
          responsibleRole: 'Participante (Proponente)',
          deadline: '72 horas',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <div style={{ fontSize: '0.78rem', color: '#9a3412', fontWeight: 600 }}>
                ⚠️ Iniciativa devuelta. Carga la Versión 2.0 de evidencias para restaurar el estado al flujo regular:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Descripción de la nueva evidencia v2.0 (ej. Hoja de verificación de 5 días)"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  className="kiz-input"
                  style={{ flex: 1, minWidth: 260 }}
                />
                <button
                  onClick={() =>
                    handleExecuteAction('REMITIR_CORRECCION', {
                      evidenceTitle: newEvidenceTitle || 'Evidencia Corregida v2.0 - Validación Gemba',
                      evidenceType: 'MEDICION_GEMBA',
                      evidenceUrlOrText: 'Nueva corrida de 5 días en planta validada con cero defectos.'
                    })
                  }
                  className="kiz-btn kiz-btn-accent"
                >
                  📤 REMITIR CORRECCIÓN (SUBIR v2.0)
                </button>
              </div>
            </div>
          )
        };
      case 'PENDIENTE_RESULTADOS':
        return {
          actionTitle: 'Someter Evidencias K0 y K3 a Evaluación Formal',
          responsibleRole: 'Participante / Mentor',
          deadline: '5 días hábiles',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExecuteAction('ENVIAR_A_EVALUACION')}
                className="kiz-btn kiz-btn-primary"
              >
                📋 ENVIAR A EVALUACIÓN K3
              </button>
              <button
                onClick={() => setShowDevolutionDialog(true)}
                className="kiz-btn kiz-btn-danger"
              >
                ↩ DEVOLVER EVIDENCIA (REGLA ≥20 CARACTERES)
              </button>
            </div>
          )
        };
      case 'POR_EVALUAR':
        return {
          actionTitle: 'Aprobar Evaluación K3 con Firma Digital 5S en Gemba',
          responsibleRole: 'Mentor de Mejora',
          deadline: 'Próxima visita de auditoría',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  handleExecuteAction('APROBAR_EVALUACION_K3', {
                    checklist5s: {
                      ...checklist5s,
                      evaluatedBy: currentUser.name,
                      digitalSignature: `SIG-5S-${currentUser.name.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`
                    }
                  });
                }}
                className="kiz-btn kiz-btn-success"
              >
                ✍️ FIRMAR AUDITORÍA 5S Y APROBAR K3
              </button>
              <button
                onClick={() => setShowDevolutionDialog(true)}
                className="kiz-btn kiz-btn-danger"
              >
                ↩ DEVOLVER POR DEFICIENCIA EN GEMBA
              </button>
            </div>
          )
        };
      case 'POR_DOCUMENTAR':
        return {
          actionTitle: 'Publicar y Catalogar Procedimiento Operativo Estandarizado (POE)',
          responsibleRole: 'Coordinador de Empresa / Mentor',
          deadline: '10 días hábiles',
          isMultiAction: true,
          renderCustom: () => (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Código POE (ej. POE-2026-EM-05)"
                value={sopCode}
                onChange={(e) => setSopCode(e.target.value)}
                className="kiz-input"
                style={{ width: 170 }}
              />
              <button
                onClick={() =>
                  handleExecuteAction('PUBLICAR_ESTANDAR_POE', {
                    sopCode,
                    sopTitle
                  })
                }
                className="kiz-btn kiz-btn-accent"
              >
                📜 PUBLICAR ESTÁNDAR POE Y FINALIZAR
              </button>
            </div>
          )
        };
      case 'FINALIZADA':
        return {
          actionTitle: 'Iniciativa Estandarizada y Consolidada en Plataforma',
          responsibleRole: 'Organización Completa (Mejor Práctica)',
          deadline: 'Completada',
          isMultiAction: true,
          renderCustom: () => (
            <span style={{ color: 'var(--kiz-success)', fontWeight: 700, fontSize: '0.85rem' }}>
              ✓ Iniciativa finalizada con éxito. Ahorro registrado: ${initiative.diagnostic.ve_annual_value.toLocaleString()} USD/año sin inversión.
            </span>
          )
        };
      default:
        return {
          actionTitle: 'Sin acción pendiente',
          responsibleRole: '-',
          deadline: '-',
          buttonText: 'Cerrar',
          buttonColor: 'var(--kiz-primary)',
          onExecute: onClose
        };
    }
  };

  const nextAction = getNextActionConfig();

  return (
    <div className="kiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="workspace-title">
      <div className="kiz-modal" style={{ maxWidth: 1100, maxHeight: '94vh' }}>
        {/* Cabecera de Estado y Línea de Vida */}
        <div className="kiz-modal-header" style={{ borderBottom: '2px solid var(--kiz-border)' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--kiz-font-mono)',
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: 'var(--kiz-surface-muted)',
                color: 'var(--kiz-primary)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--kiz-radius-xs)',
                border: '1px solid var(--kiz-border)'
              }}>
                {initiative.folio}
              </span>

              <span className={`kiz-badge state-${initiative.state}`}>
                <span className="kiz-badge-dot" />
                <span>{initiative.state.replace(/_/g, ' ')}</span>
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--kiz-radius-xs)'
              }}>
                Directriz: {initiative.guideline}
              </span>

              {initiative.isStagnant && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--kiz-radius-full)'
                }}>
                  ⏱️ Alerta de Estancamiento (&gt;7 días)
                </span>
              )}
            </div>

            <h1 id="workspace-title" style={{ fontSize: '1.25rem', lineHeight: 1.3, color: 'var(--kiz-text)' }}>
              {initiative.title}
            </h1>

            <div style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>🏢 {initiative.tenantName} &middot; {initiative.department}</span>
              <span>👤 Proponente: <strong>{initiative.proponentName}</strong></span>
              <span>🧑‍🏫 Mentor: <strong>{initiative.mentorName || 'Sin asignar'}</strong></span>
              <span>📅 Ventana Límite: <strong>{initiative.deadlineDate}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            style={{ fontSize: '1.5rem', padding: '0.25rem 0.6rem' }}
            aria-label="Cerrar Espacio de Trabajo"
          >
            &times;
          </button>
        </div>

        {/* Banners de Notificación de Acciones */}
        {errorBanner && (
          <div className="kiz-alert kiz-alert-danger" role="alert" style={{ margin: '0.75rem 1.5rem 0' }}>
            <span>⚠️</span>
            <div style={{ flex: 1 }}>{errorBanner}</div>
            <button onClick={clearBanners} className="kiz-btn kiz-btn-ghost kiz-btn-sm">&times;</button>
          </div>
        )}

        {successBanner && (
          <div className="kiz-alert kiz-alert-success" role="alert" style={{ margin: '0.75rem 1.5rem 0' }}>
            <span>✓</span>
            <div style={{ flex: 1 }}>{successBanner}</div>
            <button onClick={clearBanners} className="kiz-btn kiz-btn-ghost kiz-btn-sm">&times;</button>
          </div>
        )}

        {/* Tarjeta de Próxima Acción Requerida (Alta Visibilidad - PRD Sección 4 y 5) */}
        <div style={{ padding: '0.75rem 1.5rem 0' }}>
          <div className="kiz-action-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--kiz-accent)', fontWeight: 800 }}>
                  ⚡ PRÓXIMA ACCIÓN OPERACIONAL REQUERIDA
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--kiz-text)', marginTop: '0.15rem' }}>
                  {nextAction.actionTitle}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginTop: '0.2rem' }}>
                  Responsable: <strong>{nextAction.responsibleRole}</strong> &middot; Compromiso: <strong>{nextAction.deadline}</strong>
                </div>
              </div>

              <div>
                {nextAction.isMultiAction && nextAction.renderCustom ? (
                  nextAction.renderCustom()
                ) : (
                  <button
                    onClick={nextAction.onExecute}
                    className="kiz-btn"
                    style={{ backgroundColor: nextAction.buttonColor || 'var(--kiz-primary)', color: '#ffffff', fontWeight: 700 }}
                  >
                    {nextAction.buttonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal / Diálogo de Devolución Metodológica (Regla >= 20 caracteres) */}
        {showDevolutionDialog && (
          <div style={{
            margin: '0.75rem 1.5rem',
            padding: '1rem',
            backgroundColor: '#fff7ed',
            border: '2px solid #ea580c',
            borderRadius: 'var(--kiz-radius)'
          }}>
            <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              ↩ Devolución Metodológica de Evidencias (Regla Crítica: Mínimo 20 Caracteres)
            </div>
            <p style={{ fontSize: '0.78rem', color: '#7c2d12', marginBottom: '0.5rem' }}>
              Al devolver la iniciativa, las evidencias actuales quedarán <strong>congeladas como Versión 1.0 (Devuelta)</strong> y la iniciativa transicionará a <code>DEVUELTA_PARA_AJUSTES</code> con target <code>PENDIENTE_RESULTADOS</code>.
            </p>
            <textarea
              rows={3}
              className="kiz-textarea"
              placeholder="Explica detalladamente la deficiencia observada en Gemba y qué medición o prueba debe anexarse..."
              value={devolutionJustification}
              onChange={(e) => setDevolutionJustification(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: devolutionJustification.trim().length >= 20 ? 'var(--kiz-success)' : 'var(--kiz-danger)', fontWeight: 600 }}>
                Caracteres: {devolutionJustification.trim().length} / 20 requeridos
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowDevolutionDialog(false)}
                  className="kiz-btn kiz-btn-secondary kiz-btn-sm"
                >
                  Cancelar
                </button>
                <button
                  disabled={devolutionJustification.trim().length < 20}
                  onClick={() =>
                    handleExecuteAction('DEVOLVER_EVIDENCIA', {
                      justification: devolutionJustification.trim()
                    })
                  }
                  className="kiz-btn kiz-btn-danger kiz-btn-sm"
                >
                  Confirmar Devolución y Congelar v1.0
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5 Pestañas de Contexto Metodológico (PRD Secciones 4 y 5) */}
        <div style={{ padding: '0.5rem 1.5rem 0' }}>
          <nav className="kiz-tabs" aria-label="Pestañas de Contexto Metodológico" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'diagnostic'}
              onClick={() => setActiveTab('diagnostic')}
              className="kiz-tab-btn"
            >
              <span>1.</span> Diagnóstico & Línea Base (K0&ndash;K3)
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'plan'}
              onClick={() => setActiveTab('plan')}
              className="kiz-tab-btn"
            >
              <span>2.</span> Plan de Trabajo (8 Semanas / 6 Pasos)
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'evidences'}
              onClick={() => setActiveTab('evidences')}
              className="kiz-tab-btn"
            >
              <span>3.</span> Bóveda Evidencias ({initiative.evidences.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'mentorship'}
              onClick={() => setActiveTab('mentorship')}
              className="kiz-tab-btn"
            >
              <span>4.</span> Mentoría & Checklist 5S Gemba
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className="kiz-tab-btn"
            >
              <span>5.</span> Bitácora Inmutable ({initiative.transitionHistory.length})
            </button>
          </nav>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="kiz-modal-body" style={{ overflowY: 'auto' }}>
          {/* TAB 1: DIAGNÓSTICO Y LÍNEA BASE */}
          {activeTab === 'diagnostic' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                {/* K0 */}
                <div className="kiz-card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.35rem' }}>
                    K0 &middot; SITUACIÓN DEFICIENTE (PROBLEMA EN GEMBA)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--kiz-text)' }}>
                    {initiative.diagnostic.k0_deficient}
                  </p>
                </div>

                {/* K1 */}
                <div className="kiz-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.35rem' }}>
                    K1 &middot; FUNCIÓN BÁSICA ESENCIAL
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--kiz-text)' }}>
                    {initiative.diagnostic.k1_basic_function}
                  </p>
                </div>

                {/* K2 */}
                <div className="kiz-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', marginBottom: '0.35rem' }}>
                    K2 &middot; PROACTIVIDAD INGENIOSA (CERO INVERSIÓN)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--kiz-text)' }}>
                    {initiative.diagnostic.k2_proactivity}
                  </p>
                </div>

                {/* K3 */}
                <div className="kiz-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', marginBottom: '0.35rem' }}>
                    K3 &middot; IMPACTO MEDIBLE ESPERADO
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--kiz-text)' }}>
                    {initiative.diagnostic.k3_expected_impact}
                  </p>
                </div>
              </div>

              {/* Cálculo del Valor Económico V_E */}
              <div style={{
                backgroundColor: 'var(--kiz-surface-subtle)',
                border: '1px solid var(--kiz-border)',
                borderRadius: 'var(--kiz-radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--kiz-text-muted)' }}>
                    VALOR ECONÓMICO ANUALIZADO ESTIMADO (V_E)
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--kiz-primary)', fontFamily: 'var(--kiz-font-mono)' }}>
                    ${initiative.diagnostic.ve_annual_value.toLocaleString()} {initiative.diagnostic.currency} / año
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
                    Basado en reducción de scrap, eliminación de horas de paro y eficiencia ergonómica.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    borderRadius: 'var(--kiz-radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <span>✓ Cero Inversión Auditada ($0 Capex)</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)', marginTop: '0.25rem' }}>
                    Retorno de Inversión (ROI): <strong>Infinito (Puro Ingenio)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAN DE TRABAJO (8 SEMANAS / 6 PASOS) */}
          {activeTab === 'plan' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1rem' }}>Cronograma Metodológico (6 Pasos Kizukai &le; 8 Semanas)</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
                    Haz clic en cada tarea para marcar su ejecución en el Gemba.
                  </p>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--kiz-primary)' }}>
                  Avance Global: {initiative.progressPercent}% ({initiative.tasks.filter((t) => t.completed).length} de {initiative.tasks.length} completadas)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {initiative.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--kiz-border)',
                      borderRadius: 'var(--kiz-radius)',
                      backgroundColor: task.completed ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}} // handled by div click
                        style={{ width: 18, height: 18, accentColor: 'var(--kiz-success)' }}
                      />
                      <div>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: task.completed ? '#166534' : 'var(--kiz-text)',
                          textDecoration: task.completed ? 'line-through' : 'none'
                        }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)' }}>
                          Paso {task.step} Metodológico &middot; Semana {task.week}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: task.completed ? '#16a34a' : 'var(--kiz-text-subtle)', fontWeight: 600 }}>
                      {task.completed ? `✓ Completada (${task.completedAt || 'Hoy'})` : 'Pendiente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BÓVEDA DE EVIDENCIAS (v1.0 Congelada / v2.0 Activa) */}
          {activeTab === 'evidences' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1rem' }}>Bóveda de Evidencias de Gemba y Control de Versiones</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
                    Las evidencias devueltas quedan congeladas como histórico inmutable.
                  </p>
                </div>
              </div>

              {initiative.evidences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {initiative.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--kiz-radius)',
                        border: '1px solid var(--kiz-border)',
                        backgroundColor: ev.status === 'CONGELADA_DEVUELTA' ? '#fff7ed' : '#ffffff',
                        borderLeft: ev.status === 'CONGELADA_DEVUELTA' ? '4px solid #ea580c' : '4px solid var(--kiz-success)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--kiz-text)' }}>
                          {ev.title}
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--kiz-radius-xs)',
                            backgroundColor: ev.version === 'v2.0' ? '#dcfce7' : '#f1f5f9',
                            color: ev.version === 'v2.0' ? '#14532d' : '#334155'
                          }}>
                            {ev.version}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--kiz-radius-xs)',
                            backgroundColor: ev.status === 'CONGELADA_DEVUELTA' ? '#fed7aa' : '#bbf7d0',
                            color: ev.status === 'CONGELADA_DEVUELTA' ? '#9a3412' : '#14532d'
                          }}>
                            {ev.status === 'CONGELADA_DEVUELTA' ? 'CONGELADA (DEVUELTA)' : 'ACTIVA'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-muted)', marginBottom: '0.4rem' }}>
                        {ev.urlOrDescription}
                      </p>
                      <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)' }}>
                        Tipo: <strong>{ev.type}</strong> &middot; Subido por: <strong>{ev.uploadedBy}</strong> &middot; Fecha: {ev.uploadedAt.split('T')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="kiz-alert kiz-alert-info">
                  <span>ℹ️</span>
                  <div>No hay evidencias registradas todavía en esta iniciativa.</div>
                </div>
              )}

              {/* Formulario para Cargar Nueva Evidencia */}
              <div style={{
                backgroundColor: 'var(--kiz-surface-subtle)',
                padding: '1rem',
                borderRadius: 'var(--kiz-radius)',
                border: '1px dashed var(--kiz-border)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  + Adjuntar Nuevo Registro Fotográfico o Medición Gemba
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Título de la evidencia (ej. Medición de temperatura pos-instalación)"
                    value={newEvidenceTitle}
                    onChange={(e) => setNewEvidenceTitle(e.target.value)}
                    className="kiz-input"
                  />
                  <select
                    value={newEvidenceType}
                    onChange={(e: any) => setNewEvidenceType(e.target.value)}
                    className="kiz-select"
                  >
                    <option value="MEDICION_GEMBA">Medición Gemba</option>
                    <option value="FOTO_ANTES">Foto Antes K0</option>
                    <option value="FOTO_DESPUES">Foto Después K3</option>
                    <option value="GRAFICA_CONTROL">Gráfica de Control</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Detalles técnicos, notas de inspección presencial y firmas..."
                  value={newEvidenceText}
                  onChange={(e) => setNewEvidenceText(e.target.value)}
                  className="kiz-textarea"
                  style={{ marginBottom: '0.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newEvidenceTitle.trim()) return;
                    const newEv: Evidence = {
                      id: `ev-${Date.now()}`,
                      title: newEvidenceTitle.trim(),
                      type: newEvidenceType,
                      version: initiative.state === 'DEVUELTA_PARA_AJUSTES' ? 'v2.0' : 'v1.0',
                      status: 'ACTIVA',
                      urlOrDescription: newEvidenceText.trim() || 'Medición realizada directamente en línea de producción.',
                      uploadedBy: currentUser.name,
                      uploadedAt: new Date().toISOString()
                    };
                    const updated = {
                      ...initiative,
                      evidences: [...initiative.evidences, newEv],
                      updatedAt: new Date().toISOString()
                    };
                    const all = StorageService.getInitiativesRaw();
                    const updatedList = all.map((it) => (it.id === updated.id ? updated : it));
                    StorageService.saveInitiativesRaw(updatedList);
                    setInitiative(updated);
                    onInitiativeUpdated(updated);
                    setNewEvidenceTitle('');
                    setNewEvidenceText('');
                    setSuccessBanner('Nueva evidencia anexada exitosamente.');
                  }}
                  className="kiz-btn kiz-btn-primary kiz-btn-sm"
                >
                  Guardar Evidencia en Bóveda
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PANEL DE MENTORÍA & CHECKLIST 5S */}
          {activeTab === 'mentorship' && (
            <div>
              {/* Sección de Auditoría 5S en Gemba */}
              <div style={{
                backgroundColor: 'var(--kiz-surface-subtle)',
                border: '1px solid var(--kiz-border)',
                borderRadius: 'var(--kiz-radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)' }}>
                      Auditoría 5S de Gemba (Requisito para Aprobación K3)
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
                      Evaluación presencial en el lugar de trabajo real.
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: '#dcfce7',
                    color: '#14532d',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--kiz-radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    Puntaje 5S: {checklist5s.score} / 100
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <input
                      type="checkbox"
                      checked={checklist5s.seiri_clasificar}
                      onChange={(e) => setChecklist5s({ ...checklist5s, seiri_clasificar: e.target.checked })}
                    />
                    <span>1S &middot; Seiri (Clasificar)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <input
                      type="checkbox"
                      checked={checklist5s.seiton_ordenar}
                      onChange={(e) => setChecklist5s({ ...checklist5s, seiton_ordenar: e.target.checked })}
                    />
                    <span>2S &middot; Seiton (Ordenar)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <input
                      type="checkbox"
                      checked={checklist5s.seiso_limpiar}
                      onChange={(e) => setChecklist5s({ ...checklist5s, seiso_limpiar: e.target.checked })}
                    />
                    <span>3S &middot; Seiso (Limpiar)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <input
                      type="checkbox"
                      checked={checklist5s.seiketsu_estandarizar}
                      onChange={(e) => setChecklist5s({ ...checklist5s, seiketsu_estandarizar: e.target.checked })}
                    />
                    <span>4S &middot; Seiketsu (Estandarizar)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <input
                      type="checkbox"
                      checked={checklist5s.shitsuke_disciplina}
                      onChange={(e) => setChecklist5s({ ...checklist5s, shitsuke_disciplina: e.target.checked })}
                    />
                    <span>5S &middot; Shitsuke (Disciplina)</span>
                  </label>
                </div>

                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--kiz-radius)',
                  border: '1px solid var(--kiz-border-subtle)',
                  fontSize: '0.75rem',
                  color: 'var(--kiz-text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Firma Digital Evaluador: <strong>{checklist5s.digitalSignature}</strong></span>
                  <span>Validado con Contraloría/Finanzas: <strong>{checklist5s.financeValidated ? 'SÍ (Confirmado)' : 'NO'}</strong></span>
                </div>
              </div>

              {/* Hilo de Retroalimentación de Mentor */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Hilo de Retroalimentación Formativa</h3>

                {initiative.feedbackList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {initiative.feedbackList.map((fb) => (
                      <div
                        key={fb.id}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--kiz-radius)',
                          backgroundColor: fb.type === 'DEVOLUCION' ? '#fff7ed' : '#ffffff',
                          border: '1px solid var(--kiz-border)',
                          borderLeft: fb.type === 'DEVOLUCION' ? '4px solid #ea580c' : '4px solid var(--kiz-primary)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <strong>{fb.mentorName}</strong>
                          <span style={{ color: 'var(--kiz-text-subtle)' }}>{fb.createdAt.split('T')[0]}</span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--kiz-text)' }}>
                          {fb.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-subtle)', marginBottom: '1rem' }}>
                    Aún no hay notas de mentoría registradas.
                  </p>
                )}

                {/* Formulario de Comentario de Mentor */}
                <form onSubmit={handleAddFeedback}>
                  <label htmlFor="mentor-comment" className="kiz-label">
                    Agregar Observación o Recomendación Formativa:
                  </label>
                  <textarea
                    id="mentor-comment"
                    rows={2}
                    className="kiz-textarea"
                    placeholder="Escribe tu recomendación de mejora para el participante..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <button type="submit" className="kiz-btn kiz-btn-secondary kiz-btn-sm">
                    Enviar Comentario
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: BITÁCORA INMUTABLE Y TRAZABILIDAD */}
          {activeTab === 'history' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Historial Inmutable de Transiciones (`state_transition_history`)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
                  Registro cronológico auditable con usuario, rol, fecha UTC y justificación de cada paso.
                </p>
              </div>

              <div className="kiz-table-container">
                <table className="kiz-table">
                  <thead>
                    <tr>
                      <th>Transición (De &rarr; A)</th>
                      <th>Acción Ejecutada</th>
                      <th>Actor & Rol</th>
                      <th>Fecha / Hora UTC</th>
                      <th>Justificación / Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiative.transitionHistory.map((tr) => (
                      <tr key={tr.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span style={{ color: 'var(--kiz-text-subtle)' }}>{tr.fromState}</span>
                            <span>&rarr;</span>
                            <span style={{ color: 'var(--kiz-primary)' }}>{tr.toState}</span>
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.72rem', backgroundColor: 'var(--kiz-surface-muted)', padding: '0.15rem 0.35rem', borderRadius: 3 }}>
                            {tr.action}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.78rem' }}>
                            <strong>{tr.performedBy}</strong>
                            <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)' }}>{tr.performedRole}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'var(--kiz-font-mono)' }}>
                          {tr.timestamp.replace('T', ' ').split('.')[0]}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--kiz-text-muted)', maxWidth: 280 }}>
                          {tr.justification || 'Sin justificación adicional'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {initiative.sop && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  backgroundColor: '#ecfeff',
                  border: '1px solid #a5f3fc',
                  borderRadius: 'var(--kiz-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0891b2' }}>
                      PROCEDIMIENTO OPERATIVO ESTANDARIZADO PUBLICADO (POE)
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#155e75' }}>
                      {initiative.sop.code}: {initiative.sop.title}
                    </div>
                  </div>
                  <a
                    href={initiative.sop.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="kiz-btn kiz-btn-primary kiz-btn-sm"
                  >
                    Ver POE Oficial &rarr;
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="kiz-modal-footer">
          <button onClick={onClose} className="kiz-btn kiz-btn-secondary">
            Cerrar Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
