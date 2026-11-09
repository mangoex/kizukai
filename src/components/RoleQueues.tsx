import React, { useState } from 'react';
import { Initiative, User } from '../types/index.ts';
import { InitiativeCard } from './InitiativeCard.tsx';
import { getMobileRoleProfile, COORDINATOR_QUEUES } from '../domain/mobileUxEngine.ts';

interface RoleQueuesProps {
  currentUser: User;
  initiatives: Initiative[];
  onOpenWorkspace: (initiative: Initiative) => void;
  onNavigateToTab?: (view: 'queues' | 'catalog' | 'reports' | 'database') => void;
  onNavigateTab?: (tab: 'queues' | 'dashboard' | 'reports' | 'database') => void;
  onOpenNewInitiative?: () => void;
  onInitiativeUpdated?: (initiative: Initiative) => void;
}

export const RoleQueues: React.FC<RoleQueuesProps> = ({
  currentUser,
  initiatives,
  onOpenWorkspace,
  onNavigateToTab,
  onNavigateTab,
  onOpenNewInitiative,
  onInitiativeUpdated,
}) => {
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('all');
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<'ALL' | 'ORG-A' | 'ORG-B'>('ALL');

  const role = currentUser.role;
  const mobileProfile = getMobileRoleProfile(role);

  const handleNavigate = (tab: 'queues' | 'reports' | 'database') => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
  };

  if (role === 'TECH_ADMIN') {
    return (
      <div className="kiz-card" style={{ textAlign: 'center', padding: '2.5rem 1.25rem', backgroundColor: '#fff7ed', border: '2px dashed #ea580c' }}>
        <div style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }}>🛡️</div>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#ffedd5',
          color: '#9a3412',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: 'var(--kiz-radius-full)',
          marginBottom: '0.5rem',
        }}>
          {mobileProfile.modeTitle}
        </div>
        <h2 style={{ fontSize: '1.3rem', color: '#9a3412', marginBottom: '0.5rem' }}>
          Segregación de Funciones RBAC Activa
        </h2>
        <p style={{ maxWidth: 560, margin: '0 auto 1.25rem', color: '#7c2d12', fontSize: '0.85rem', lineHeight: 1.4 }}>
          El rol <strong>Administrador Técnico (TECH_ADMIN)</strong> tiene permisos sobre infraestructura, seguridad de la base de datos (22 entidades) y bitácoras inmutables de auditoría, pero <strong>tiene bloqueado el acceso al contenido funcional de las iniciativas de mejora continua</strong> por cumplimiento estricto de gobernanza y privacidad.
        </p>
        <button
          onClick={() => handleNavigate('database')}
          className="kiz-btn kiz-btn-primary"
          style={{ width: '100%', maxWidth: 360, padding: '0.65rem 1rem', fontSize: '0.875rem' }}
        >
          🛡️ Simulador DB &amp; Prueba 403 &rarr;
        </button>
      </div>
    );
  }

  // Filtrado de iniciativas por planta para el Consultor
  let scopedInitiatives = initiatives;
  if (role === 'CONSULTANT' && selectedPlantFilter !== 'ALL') {
    scopedInitiatives = initiatives.filter((i) => i.tenantId === selectedPlantFilter);
  }

  // Definición de subgrupos según Sección 4 del PRD
  let subgroups: { id: string; label: string; icon: string; items: Initiative[]; description: string }[] = [];

  if (role === 'PARTICIPANT') {
    const drafts = scopedInitiatives.filter((i) => i.state === 'BORRADOR');
    const returned = scopedInitiatives.filter((i) => i.state === 'DEVUELTA_PARA_AJUSTES');
    const active = scopedInitiatives.filter((i) => i.state === 'EN_IMPLEMENTACION' || i.state === 'PENDIENTE_PLAN_IMPLEMENTACION');
    const finalized = scopedInitiatives.filter((i) => i.state === 'FINALIZADA');

    subgroups = [
      {
        id: 'returned',
        label: `Observaciones (${returned.length})`,
        icon: '⚠️',
        items: returned,
        description: 'Iniciativas devueltas con observaciones metodológicas para cargar Versión 2.0 de evidencias.',
      },
      {
        id: 'drafts',
        label: `Borradores (${drafts.length})`,
        icon: '📝',
        items: drafts,
        description: 'Iniciativas en etapa inicial pendientes de envío a filtro técnico.',
      },
      {
        id: 'active',
        label: `En Implementación (${active.length})`,
        icon: '⚙️',
        items: active,
        description: 'Iniciativas con plan aprobado ejecutando tareas de campo en el Gemba.',
      },
      {
        id: 'finalized',
        label: `Finalizadas (${finalized.length})`,
        icon: '🏆',
        items: finalized,
        description: 'Iniciativas exitosas con Procedimiento Operativo Estandarizado (POE) catalogado.',
      },
    ];
  } else if (role === 'MENTOR') {
    const toReview = scopedInitiatives.filter((i) =>
      i.state === 'PENDIENTE_PLAN_IMPLEMENTACION' ||
      i.state === 'PENDIENTE_RESULTADOS' ||
      i.state === 'POR_EVALUAR'
    );
    const gembaScheduled = scopedInitiatives.filter((i) => i.state === 'POR_EVALUAR' || i.state === 'EN_IMPLEMENTACION');
    const expiringSoon = scopedInitiatives.filter((i) => {
      const created = new Date(i.createdAt).getTime();
      const days = Math.floor((Date.now() - created) / (1000 * 3600 * 24));
      return days >= 40 && i.state !== 'FINALIZADA' && i.state !== 'RECHAZADA';
    });
    const stagnant = scopedInitiatives.filter((i) => i.isStagnant);

    subgroups = [
      {
        id: 'toReview',
        label: `Entregables (${toReview.length})`,
        icon: '🔍',
        items: toReview,
        description: 'Planes de trabajo, resultados y evidencias pendientes de validación o evaluación.',
      },
      {
        id: 'gemba',
        label: `Auditorías 5S (${gembaScheduled.length})`,
        icon: '📋',
        items: gembaScheduled,
        description: 'Verificaciones presenciales en línea y evaluación con firma digital.',
      },
      {
        id: 'expiring',
        label: `Por Vencer (${expiringSoon.length})`,
        icon: '⏳',
        items: expiringSoon,
        description: 'Iniciativas en semanas 6-8 que requieren aceleración para evitar vencimiento.',
      },
      {
        id: 'stagnant',
        label: `Rezagadas (> 7d) (${stagnant.length})`,
        icon: '🛑',
        items: stagnant,
        description: 'Proyectos que superan el umbral de 7 días sin avances registrados en tareas.',
      },
    ];
  } else if (role === 'COORDINATOR') {
    const forApproval = scopedInitiatives.filter((i) => i.state === 'POR_APROBAR');
    const needMentor = scopedInitiatives.filter((i) => i.state === 'PENDIENTE_ASIGNACION_MENTOR');
    const stagnant = scopedInitiatives.filter((i) => i.isStagnant);
    const cohortGoal = scopedInitiatives.filter((i) => i.state !== 'RECHAZADA' && i.state !== 'CANCELADA');

    const counts: Record<string, number> = {
      pendingTechnicalReview: forApproval.length,
      pendingMentorAssignment: needMentor.length,
      stagnantOver7Days: stagnant.length,
      group2026: cohortGoal.length,
    };

    const itemsMap: Record<string, Initiative[]> = {
      pendingTechnicalReview: forApproval,
      pendingMentorAssignment: needMentor,
      stagnantOver7Days: stagnant,
      group2026: cohortGoal,
    };

    const cleanIcons: Record<string, string> = {
      pendingTechnicalReview: '✓',
      pendingMentorAssignment: '◎',
      stagnantOver7Days: '▲',
      group2026: '◆',
    };

    subgroups = COORDINATOR_QUEUES.map((q) => ({
      id: q.id,
      label: `${q.label} (${counts[q.id] ?? 0})`,
      icon: cleanIcons[q.id] || '•',
      items: itemsMap[q.id] || [],
      description: q.description,
    }));
  } else if (role === 'CONSULTANT') {
    const orgA = scopedInitiatives.filter((i) => i.tenantId === 'ORG-A');
    const orgB = scopedInitiatives.filter((i) => i.tenantId === 'ORG-B');
    const bestPractices = scopedInitiatives.filter((i) => i.state === 'FINALIZADA' && i.diagnostic.ve_annual_value >= 15000);

    subgroups = [
      {
        id: 'consolidated',
        label: `Portafolio (${scopedInitiatives.length})`,
        icon: '🌐',
        items: scopedInitiatives,
        description: `Visión global de portafolio: ${orgA.length} en Manufactura Norte (ORG-A) y ${orgB.length} en Alimentos Bajío (ORG-B).`,
      },
      {
        id: 'semaphore',
        label: `En Proceso (${scopedInitiatives.filter((i) => i.state !== 'FINALIZADA' && i.state !== 'RECHAZADA').length})`,
        icon: '🚦',
        items: scopedInitiatives.filter((i) => i.state !== 'FINALIZADA' && i.state !== 'RECHAZADA'),
        description: 'Monitoreo de cumplimiento del método Kizukai: Pasos 1 a 6 y Cero Inversión de Capital.',
      },
      {
        id: 'bestPractices',
        label: `Mejores Prácticas (${bestPractices.length})`,
        icon: '⭐',
        items: bestPractices,
        description: 'Iniciativas estandarizadas de alto impacto económico listas para replicación horizontal.',
      },
    ];
  }

  const activeGroup = selectedSubgroup === 'all'
    ? subgroups[0]
    : subgroups.find((g) => g.id === selectedSubgroup) || subgroups[0];

  // Cálculos para Hero Card por Rol
  const stagnantCount = scopedInitiatives.filter((i) => i.isStagnant).length;
  const returnedCount = scopedInitiatives.filter((i) => i.state === 'DEVUELTA_PARA_AJUSTES').length;
  const pendingPlanCount = scopedInitiatives.filter((i) => i.state === 'PENDIENTE_PLAN_IMPLEMENTACION').length;
  const pendingEvaluationCount = scopedInitiatives.filter((i) => i.state === 'POR_EVALUAR').length;
  const totalVeUsd = scopedInitiatives.reduce((acc, curr) => acc + (curr.diagnostic?.ve_annual_value || 0), 0);

  return (
    <section aria-labelledby="role-queues-title" style={{ marginBottom: '2rem' }}>
      {/* TARJETA HERO MÓVIL ESPECÍFICA DEL ROL */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--kiz-border)',
        borderRadius: 'var(--kiz-radius-lg)',
        padding: '1.15rem',
        marginBottom: '1rem',
        boxShadow: 'var(--kiz-shadow-sm)',
      }}>
        {/* Encabezado del Perfil de Rol */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.65rem',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--kiz-surface-subtle)',
              border: '1px solid var(--kiz-border)',
              borderRadius: 'var(--kiz-radius-full)',
              padding: '0.15rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--kiz-primary)',
              marginBottom: '0.35rem',
            }}>
              <span>⚡</span> {mobileProfile.modeTitle}
            </div>
            <h1 id="role-queues-title" style={{ fontSize: '1.15rem', color: 'var(--kiz-text)', margin: 0 }}>
              {currentUser.name}
            </h1>
          </div>

          <span className={`role-badge role-${currentUser.role}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
            {currentUser.role}
          </span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--kiz-text-muted)', marginBottom: '0.85rem' }}>
          {mobileProfile.subtitle}
        </p>

        {/* HERO INTERACTIVO POR ROL */}
        {role === 'PARTICIPANT' && (
          <div style={{
            backgroundColor: 'var(--kiz-surface-subtle)',
            borderRadius: 'var(--kiz-radius)',
            padding: '0.85rem',
            border: '1px solid var(--kiz-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}>
            <button
              onClick={() => onOpenNewInitiative?.()}
              className="kiz-btn kiz-btn-primary"
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--kiz-shadow-sm)',
              }}
            >
              ➕ Capturar Idea / Mejora K2 (3 pasos)
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '0.35rem',
              fontSize: '0.75rem',
              paddingTop: '0.4rem',
              borderTop: '1px solid var(--kiz-border-subtle)',
            }}>
              <span style={{ color: returnedCount > 0 ? 'var(--kiz-danger)' : 'var(--kiz-text-muted)', fontWeight: 600 }}>
                ⚠️ {returnedCount} por corregir
              </span>
              <span>&middot;</span>
              <span style={{ color: 'var(--kiz-text-muted)' }}>
                📝 {scopedInitiatives.filter((i) => i.state === 'BORRADOR').length} borradores
              </span>
              <span>&middot;</span>
              <span style={{ color: 'var(--kiz-success)', fontWeight: 600 }}>
                ⚙️ {scopedInitiatives.filter((i) => i.state === 'EN_IMPLEMENTACION').length} en campo
              </span>
            </div>
          </div>
        )}

        {role === 'MENTOR' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: 'var(--kiz-radius)',
            padding: '0.85rem',
            border: '1px solid #bbf7d0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
              📋 Resumen de Recorrido Gemba &amp; 5S en Piso:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedSubgroup('toReview')}
                className="kiz-btn"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <strong style={{ fontSize: '1.1rem' }}>{pendingPlanCount}</strong>
                <span>Por Validar Plan (8 sem)</span>
              </button>
              <button
                onClick={() => setSelectedSubgroup('gemba')}
                className="kiz-btn"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <strong style={{ fontSize: '1.1rem' }}>{pendingEvaluationCount}</strong>
                <span>Auditoría 5S / K3</span>
              </button>
            </div>
          </div>
        )}

        {role === 'COORDINATOR' && (
          <div style={{
            backgroundColor: stagnantCount > 0 ? '#fff7ed' : '#eff6ff',
            borderRadius: 'var(--kiz-radius)',
            padding: '0.85rem',
            border: stagnantCount > 0 ? '1px solid #fed7aa' : '1px solid #bfdbfe',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: stagnantCount > 0 ? '#9a3412' : '#1e40af',
            }}>
              <span>Revisión y asignación de iniciativas:</span>
              <span>{stagnantCount > 0 ? `${stagnantCount} estancadas (+7 días)` : 'Grupo al día'}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: stagnantCount > 0 ? '#7c2d12' : '#1e3a8a', margin: 0 }}>
              Puedes aprobar el filtro técnico Cero Inversión o asignar mentor directamente en las tarjetas inferiores.
            </p>
          </div>
        )}

        {role === 'CONSULTANT' && (
          <div style={{
            backgroundColor: '#faf5ff',
            borderRadius: 'var(--kiz-radius)',
            padding: '0.85rem',
            border: '1px solid #e9d5ff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: 600 }}>Ahorro Anualizado $V_E:</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#581c87', fontFamily: 'var(--kiz-font-mono)' }}>
                  ${totalVeUsd.toLocaleString()} USD
                </div>
              </div>
              <button
                onClick={() => handleNavigate('reports')}
                className="kiz-btn kiz-btn-sm"
                style={{ backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', fontSize: '0.75rem', fontWeight: 600 }}
              >
                📊 Ver Reportes / Exportar &rarr;
              </button>
            </div>

            {/* Selector rápido de Planta */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.35rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #f3e8ff',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#6b21a8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Filtrar Planta:
              </span>
              <button
                onClick={() => setSelectedPlantFilter('ALL')}
                className="kiz-btn"
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: selectedPlantFilter === 'ALL' ? '#7e22ce' : '#ffffff',
                  color: selectedPlantFilter === 'ALL' ? '#ffffff' : '#6b21a8',
                  border: '1px solid #d8b4fe',
                  whiteSpace: 'nowrap',
                }}
              >
                🌐 Todas
              </button>
              <button
                onClick={() => setSelectedPlantFilter('ORG-A')}
                className="kiz-btn"
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: selectedPlantFilter === 'ORG-A' ? '#7e22ce' : '#ffffff',
                  color: selectedPlantFilter === 'ORG-A' ? '#ffffff' : '#6b21a8',
                  border: '1px solid #d8b4fe',
                  whiteSpace: 'nowrap',
                }}
              >
                🏭 ORG-A Manufactura Norte
              </button>
              <button
                onClick={() => setSelectedPlantFilter('ORG-B')}
                className="kiz-btn"
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: selectedPlantFilter === 'ORG-B' ? '#7e22ce' : '#ffffff',
                  color: selectedPlantFilter === 'ORG-B' ? '#ffffff' : '#6b21a8',
                  border: '1px solid #d8b4fe',
                  whiteSpace: 'nowrap',
                }}
              >
                🏢 ORG-B Alimentos Bajío
              </button>
            </div>
          </div>
        )}

        {/* Selector de Subgrupos / Pestañas de Bandeja */}
        <div className="kiz-subgroup-tabs">
          {subgroups.map((group) => {
            const isSelected = activeGroup.id === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedSubgroup(group.id)}
                className="kiz-btn"
                style={{
                  backgroundColor: isSelected ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--kiz-text)',
                  border: isSelected ? '1px solid var(--kiz-primary)' : '1px solid var(--kiz-border)',
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
                aria-pressed={isSelected}
              >
                <span>{group.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Descripción del Subgrupo Activo */}
      <div style={{
        backgroundColor: 'var(--kiz-surface-subtle)',
        borderLeft: '4px solid var(--kiz-primary)',
        padding: '0.65rem 0.85rem',
        borderRadius: '0 var(--kiz-radius) var(--kiz-radius) 0',
        marginBottom: '1rem',
        fontSize: '0.78rem',
        color: 'var(--kiz-text-muted)',
      }}>
        <strong>{activeGroup.icon} {activeGroup.label}:</strong> {activeGroup.description}
      </div>

      {/* Grilla de Iniciativas en la Bandeja con 1-Tap Quick Action */}
      {activeGroup.items.length > 0 ? (
        <div className="kiz-grid-cards">
          {activeGroup.items.map((init) => (
            <InitiativeCard
              key={init.id}
              initiative={init}
              currentUser={currentUser}
              onOpenWorkspace={onOpenWorkspace}
              onQuickActionUpdated={onInitiativeUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="kiz-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--kiz-text-subtle)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--kiz-text-muted)', marginBottom: '0.25rem' }}>
            No hay iniciativas en este subgrupo actualmente
          </h3>
          <p style={{ fontSize: '0.825rem' }}>
            ¡Excelente! Tu bandeja de trabajo está al día.
          </p>
        </div>
      )}
    </section>
  );
};
