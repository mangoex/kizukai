import React, { useState } from 'react';
import { Initiative, User } from '../types/index.ts';
import { getMobileQuickActionForInitiative, MobileQuickActionCode, formatStagnantBadge } from '../domain/mobileUxEngine.ts';
import { StorageService } from '../services/storageService.ts';

interface InitiativeCardProps {
  initiative: Initiative;
  currentUser?: User;
  onOpenWorkspace: (initiative: Initiative) => void;
  onQuickActionUpdated?: (initiative: Initiative) => void;
}

export const InitiativeCard: React.FC<InitiativeCardProps> = ({
  initiative,
  currentUser,
  onOpenWorkspace,
  onQuickActionUpdated,
}) => {
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const getGuidelineColor = (guideline: string) => {
    switch (guideline) {
      case 'CALIDAD': return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
      case 'COSTO': return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 'ENTREGA': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
      case 'SEGURIDAD': return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      case 'MORAL': return { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' };
      default: return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  const gStyle = getGuidelineColor(initiative.guideline);

  // Consulta de Acción Rápida Móvil (1-Tap)
  const quickActionDesc = currentUser && currentUser.role !== 'TECH_ADMIN'
    ? getMobileQuickActionForInitiative(currentUser.role, initiative.state)
    : null;

  const hasQuickAction =
    Boolean(quickActionDesc?.isAvailable) &&
    quickActionDesc?.actionCode !== 'NINGUNA_ACCION_OPERATIVA' &&
    quickActionDesc?.actionCode !== 'CONSULTAR_DETALLE_EJECUTIVO';

  const getQuickActionUi = (code: MobileQuickActionCode) => {
    switch (code) {
      case 'APROBAR_FILTRO_1TAP':
        return {
          label: '✓ Aprobar Filtro 1-Tap',
          bg: '#16a34a',
          hoverBg: '#15803d',
        };
      case 'ASIGNAR_MENTOR_RAPIDO':
        return {
          label: 'Asignar mentor',
          bg: '#2563eb',
          hoverBg: '#1d4ed8',
        };
      case 'VALIDAR_PLAN_RAPIDO':
        return {
          label: '✓ Validar Plan 8 Sem.',
          bg: '#0891b2',
          hoverBg: '#0e7490',
        };
      case 'FIRMAR_5S_Y_APROBAR_K3':
        return {
          label: '✍️ Firmar 5S y Aprobar K3',
          bg: '#7c3aed',
          hoverBg: '#6d28d9',
        };
      case 'REMITIR_CORRECCION_RAPIDA':
        return {
          label: '📤 Subir Evidencia v2.0 Rápida',
          bg: '#ea580c',
          hoverBg: '#c2410c',
        };
      case 'ENVIAR_A_REVISION_RAPIDA':
        return {
          label: '🚀 Enviar a Revisión',
          bg: '#2563eb',
          hoverBg: '#1d4ed8',
        };
      case 'NOTIFICAR_TERMINO_OBRA_RAPIDA':
        return {
          label: '✓ Notificar Término (100%)',
          bg: '#059669',
          hoverBg: '#047857',
        };
      case 'ENVIAR_EVIDENCIA_K3_RAPIDA':
        return {
          label: '📋 Enviar a Evaluación K3',
          bg: '#4f46e5',
          hoverBg: '#4338ca',
        };
      case 'PUBLICAR_POE_RAPIDO':
        return {
          label: '📜 Publicar Estándar POE',
          bg: '#0f766e',
          hoverBg: '#115e59',
        };
      default:
        return {
          label: quickActionDesc?.label || 'Ejecutar Acción',
          bg: 'var(--kiz-primary)',
          hoverBg: 'var(--kiz-primary-dark)',
        };
    }
  };

  const handleExecute1TapAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || !quickActionDesc || isProcessingAction) return;

    setIsProcessingAction(true);
    setActionFeedback(null);

    let transitionAction = '';
    let payloadData: any = { user: currentUser };

    switch (quickActionDesc.actionCode) {
      case 'APROBAR_FILTRO_1TAP':
        transitionAction = 'APROBAR_FILTRO_TECNICO';
        break;
      case 'ASIGNAR_MENTOR_RAPIDO':
        onOpenWorkspace(initiative);
        setIsProcessingAction(false);
        return;
      case 'VALIDAR_PLAN_RAPIDO':
        transitionAction = 'VALIDAR_PLAN';
        payloadData = {
          user: currentUser,
          weeksCount: 8,
          justification: 'Plan validado en 8 semanas (ventana máxima) en 1 toque',
        };
        break;
      case 'FIRMAR_5S_Y_APROBAR_K3':
        transitionAction = 'APROBAR_EVALUACION_K3';
        payloadData = {
          user: currentUser,
          checklist5s: {
            seiri: true,
            seiton: true,
            seiso: true,
            seiketsu: true,
            shitsuke: true,
            digitalSignature: `Firma-Gemba-${currentUser.name.replace(/\s+/g, '')}`,
            score: 100,
          },
        };
        break;
      case 'REMITIR_CORRECCION_RAPIDA':
        transitionAction = 'REMITIR_CORRECCION';
        payloadData = {
          user: currentUser,
          evidenceTitle: 'Evidencia Corregida v2.0 - Validación Gemba',
          evidenceType: 'MEDICION_GEMBA',
          evidenceUrlOrText: 'Nueva corrida estable en Gemba con mediciones corregidas.',
        };
        break;
      case 'ENVIAR_A_REVISION_RAPIDA':
        transitionAction = 'ENVIAR_A_REVISION';
        break;
      case 'NOTIFICAR_TERMINO_OBRA_RAPIDA':
        transitionAction = 'NOTIFICAR_TERMINO_OBRA';
        break;
      case 'ENVIAR_EVIDENCIA_K3_RAPIDA':
        transitionAction = 'ENVIAR_A_EVALUACION';
        break;
      case 'PUBLICAR_POE_RAPIDO':
        transitionAction = 'PUBLICAR_ESTANDAR_POE';
        break;
      default:
        setIsProcessingAction(false);
        return;
    }

    try {
      const res = StorageService.transitionInitiative(initiative.id, transitionAction, payloadData);
      if (res.success && res.initiative) {
        setActionFeedback('✓ ¡Actualizado con éxito!');
        onQuickActionUpdated?.(res.initiative);
      } else {
        setActionFeedback(res.error || 'Error al procesar acción');
      }
    } catch (err: any) {
      setActionFeedback(err.message || 'Error de transición');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const actionUi = quickActionDesc ? getQuickActionUi(quickActionDesc.actionCode) : null;

  return (
    <article
      className="kiz-card kiz-card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Alerta de Estancamiento (+7 días) */}
      {initiative.isStagnant && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: 14,
          backgroundColor: '#ea580c',
          color: '#ffffff',
          fontSize: '0.65rem',
          fontWeight: 700,
          padding: '0.15rem 0.5rem',
          borderRadius: 'var(--kiz-radius-full)',
          boxShadow: 'var(--kiz-shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          zIndex: 2,
        }}>
          <span>⏱</span> {formatStagnantBadge(8)}
        </div>
      )}

      <div>
        {/* Cabecera de Tarjeta: Folio + Directriz + Estado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              fontFamily: 'var(--kiz-font-mono)',
              fontWeight: 700,
              fontSize: '0.78rem',
              color: 'var(--kiz-primary)',
              backgroundColor: 'var(--kiz-surface-subtle)',
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--kiz-radius-xs)',
              border: '1px solid var(--kiz-border)',
            }}>
              {initiative.folio}
            </span>

            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: gStyle.bg,
              color: gStyle.text,
              border: `1px solid ${gStyle.border}`,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--kiz-radius-xs)',
            }}>
              {initiative.guideline}
            </span>
          </div>

          <div className={`kiz-badge state-${initiative.state}`}>
            <span className="kiz-badge-dot" />
            <span>{initiative.state.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Título de la Iniciativa */}
        <h3 style={{
          fontSize: '0.975rem',
          fontWeight: 700,
          lineHeight: 1.35,
          color: 'var(--kiz-text)',
          marginBottom: '0.5rem',
        }}>
          {initiative.title}
        </h3>

        {/* Metadatos de Gemba */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--kiz-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          marginBottom: '0.75rem',
        }}>
          <div>
            🏢 <strong>{initiative.tenantName}</strong> &middot; {initiative.department}
          </div>
          <div>
            👤 Proponente: <strong>{initiative.proponentName}</strong>
          </div>
          <div>
            🧑‍🏫 Mentor: <strong>{initiative.mentorName || 'Sin asignar'}</strong>
          </div>
        </div>

        {/* Diagnóstico Resumen K0 / K2 */}
        <div style={{
          backgroundColor: 'var(--kiz-surface-subtle)',
          borderRadius: 'var(--kiz-radius)',
          padding: '0.5rem 0.65rem',
          fontSize: '0.72rem',
          color: 'var(--kiz-text-muted)',
          marginBottom: '0.85rem',
          borderLeft: '3px solid var(--kiz-accent)',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--kiz-text)', marginBottom: '0.2rem' }}>
            Idea K2:
          </div>
          <p style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {initiative.diagnostic.k2_proactivity}
          </p>
        </div>
      </div>

      <div>
        {/* Barra de Progreso y Paso Metodológico */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            marginBottom: '0.25rem',
            color: 'var(--kiz-text-subtle)',
          }}>
            <span>Paso {initiative.currentStep} de 6 Metodológico</span>
            <strong>{initiative.progressPercent}%</strong>
          </div>
          <div className="kiz-progress-bar">
            <div className="kiz-progress-fill" style={{ width: `${initiative.progressPercent}%` }} />
          </div>
        </div>

        {/* Barra de Acción Rápida Móvil (1-Tap) */}
        {hasQuickAction && actionUi && (
          <div style={{
            marginBottom: '0.65rem',
            padding: '0.5rem 0.6rem',
            backgroundColor: 'var(--kiz-surface-subtle)',
            borderRadius: 'var(--kiz-radius)',
            border: '1px solid var(--kiz-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: 'var(--kiz-text-muted)',
            }}>
              <span>⚡ Acción Rápida Móvil:</span>
              {actionFeedback && (
                <span style={{
                  color: actionFeedback.startsWith('✓') ? 'var(--kiz-success)' : 'var(--kiz-danger)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                }}>
                  {actionFeedback}
                </span>
              )}
            </div>

            <button
              onClick={handleExecute1TapAction}
              disabled={isProcessingAction}
              className="kiz-btn"
              style={{
                width: '100%',
                backgroundColor: actionUi.bg,
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--kiz-radius)',
                cursor: isProcessingAction ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: 'var(--kiz-shadow-xs)',
              }}
              aria-label={actionUi.label}
            >
              {isProcessingAction ? '⏳ Procesando...' : actionUi.label}
            </button>
          </div>
        )}

        {/* Footer de Tarjeta con Límite y Botón de Apertura */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--kiz-border-subtle)',
          paddingTop: '0.65rem',
          fontSize: '0.72rem',
          gap: '0.5rem',
        }}>
          <span style={{ color: 'var(--kiz-text-subtle)' }}>
            📅 Límite: <strong>{initiative.deadlineDate}</strong>
          </span>

          <button
            onClick={() => onOpenWorkspace(initiative)}
            className="kiz-btn kiz-btn-primary kiz-btn-sm"
            aria-label={`Abrir workspace de iniciativa ${initiative.folio}`}
          >
            Abrir Workspace →
          </button>
        </div>
      </div>
    </article>
  );
};
