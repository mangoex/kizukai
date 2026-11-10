import React from 'react';
import { Initiative, User } from '../types/index.ts';
import { formatStagnantBadge } from '../domain/mobileUxEngine.ts';

interface InitiativeCardProps {
  initiative: Initiative;
  currentUser?: User;
  onOpenWorkspace: (initiative: Initiative) => void;
  onQuickActionUpdated?: (initiative: Initiative) => void;
}

export const InitiativeCard: React.FC<InitiativeCardProps> = ({
  initiative,
  currentUser: _currentUser,
  onOpenWorkspace,
  onQuickActionUpdated: _onQuickActionUpdated,
}) => {
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

  return (
    <article
      className="kiz-card kiz-card-hover"
      onClick={() => onOpenWorkspace(initiative)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        cursor: 'pointer',
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
          {formatStagnantBadge(8)}
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
            <strong>{initiative.tenantName}</strong> &middot; {initiative.department}
          </div>
          <div>
            Proponente: <strong>{initiative.proponentName}</strong>
          </div>
          <div>
            Mentor: <strong>{initiative.mentorName || 'Sin asignar'}</strong>
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
            Límite: <strong>{initiative.deadlineDate}</strong>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorkspace(initiative);
            }}
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
