import React, { useState } from 'react';
import { Initiative, User } from '../types/index.ts';
import { InitiativeCard } from './InitiativeCard.tsx';

interface RoleQueuesProps {
  currentUser: User;
  initiatives: Initiative[];
  onOpenWorkspace: (initiative: Initiative) => void;
  onNavigateToTab: (view: 'queues' | 'catalog' | 'reports' | 'database') => void;
}

export const RoleQueues: React.FC<RoleQueuesProps> = ({
  currentUser,
  initiatives,
  onOpenWorkspace,
  onNavigateToTab
}) => {
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('all');

  // Filtrado de acuerdo al rol del usuario
  const role = currentUser.role;

  if (role === 'TECH_ADMIN') {
    return (
      <div className="kiz-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#fff7ed', border: '2px dashed #ea580c' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
        <h2 style={{ fontSize: '1.4rem', color: '#9a3412', marginBottom: '0.75rem' }}>
          Segregación de Funciones RBAC Activa
        </h2>
        <p style={{ maxWidth: 600, margin: '0 auto 1.5rem', color: '#7c2d12', fontSize: '0.9rem' }}>
          El rol <strong>Administrador Técnico (TECH_ADMIN)</strong> tiene permisos sobre infraestructura, seguridad de la base de datos (22 entidades) y bitácoras de auditoría, pero <strong>tiene bloqueado el acceso al contenido funcional de las iniciativas de mejora continua</strong> por cumplimiento estricto de gobernanza y privacidad.
        </p>
        <button
          onClick={() => onNavigateToTab('database')}
          className="kiz-btn kiz-btn-primary"
        >
          Ir a Consola de Base de Datos y Bitácora de Auditoría →
        </button>
      </div>
    );
  }

  // Definición de subgrupos según Sección 4 del PRD
  let subgroups: { id: string; label: string; icon: string; items: Initiative[]; description: string }[] = [];

  if (role === 'PARTICIPANT') {
    const drafts = initiatives.filter((i) => i.state === 'BORRADOR');
    const returned = initiatives.filter((i) => i.state === 'DEVUELTA_PARA_AJUSTES');
    const active = initiatives.filter((i) => i.state === 'EN_IMPLEMENTACION' || i.state === 'PENDIENTE_PLAN_IMPLEMENTACION');
    const finalized = initiatives.filter((i) => i.state === 'FINALIZADA');

    subgroups = [
      {
        id: 'returned',
        label: `Observaciones por Corregir (${returned.length})`,
        icon: '⚠️',
        items: returned,
        description: 'Iniciativas devueltas con observaciones metodológicas para cargar Versión 2.0 de evidencias.'
      },
      {
        id: 'drafts',
        label: `Borradores Pendientes (${drafts.length})`,
        icon: '📝',
        items: drafts,
        description: 'Iniciativas en etapa inicial pendientes de envío a filtro técnico.'
      },
      {
        id: 'active',
        label: `En Implementación Activa (${active.length})`,
        icon: '⚙️',
        items: active,
        description: 'Iniciativas con plan aprobado ejecutando tareas de campo en el Gemba.'
      },
      {
        id: 'finalized',
        label: `Finalizadas y Estandarizadas (${finalized.length})`,
        icon: '🏆',
        items: finalized,
        description: 'Iniciativas exitosas con Procedimiento Operativo Estandarizado (POE) catalogado.'
      }
    ];
  } else if (role === 'MENTOR') {
    const toReview = initiatives.filter((i) =>
      i.state === 'PENDIENTE_PLAN_IMPLEMENTACION' ||
      i.state === 'PENDIENTE_RESULTADOS' ||
      i.state === 'POR_EVALUAR'
    );
    const gembaScheduled = initiatives.filter((i) => i.state === 'POR_EVALUAR' || i.state === 'EN_IMPLEMENTACION');
    const expiringSoon = initiatives.filter((i) => {
      const created = new Date(i.createdAt).getTime();
      const days = Math.floor((Date.now() - created) / (1000 * 3600 * 24));
      return days >= 40 && i.state !== 'FINALIZADA' && i.state !== 'RECHAZADA';
    });
    const stagnant = initiatives.filter((i) => i.isStagnant);

    subgroups = [
      {
        id: 'toReview',
        label: `Entregables Pendientes (${toReview.length})`,
        icon: '🔍',
        items: toReview,
        description: 'Planes de trabajo, resultados y evidencias pendientes de validación o evaluación.'
      },
      {
        id: 'gemba',
        label: `Auditorías de Gemba / 5S (${gembaScheduled.length})`,
        icon: '📋',
        items: gembaScheduled,
        description: 'Verificaciones presenciales en línea y evaluación con firma digital.'
      },
      {
        id: 'expiring',
        label: `Próximas a Vencer (Ventana 8 Semanas) (${expiringSoon.length})`,
        icon: '⏳',
        items: expiringSoon,
        description: 'Iniciativas en semanas 6-8 que requieren aceleración para evitar vencimiento.'
      },
      {
        id: 'stagnant',
        label: `Iniciativas Rezagadas (> 7 Días) (${stagnant.length})`,
        icon: '🛑',
        items: stagnant,
        description: 'Proyectos que superan el umbral de 7 días sin avances registrados en tareas.'
      }
    ];
  } else if (role === 'COORDINATOR') {
    const forApproval = initiatives.filter((i) => i.state === 'POR_APROBAR');
    const needMentor = initiatives.filter((i) => i.state === 'PENDIENTE_ASIGNACION_MENTOR');
    const stagnant = initiatives.filter((i) => i.isStagnant);
    const cohortGoal = initiatives.filter((i) => i.state !== 'RECHAZADA' && i.state !== 'CANCELADA');

    subgroups = [
      {
        id: 'forApproval',
        label: `Ideas Nuevas - Filtro Técnico (${forApproval.length})`,
        icon: '💡',
        items: forApproval,
        description: 'Iniciativas recién enviadas que requieren validación de Cero Inversión y alineación QCDSM.'
      },
      {
        id: 'needMentor',
        label: `Pendientes Asignación Mentor (${needMentor.length})`,
        icon: '🧑‍🏫',
        items: needMentor,
        description: 'Iniciativas aprobadas técnicamente que esperan asignación de mentor experto.'
      },
      {
        id: 'stagnant',
        label: `Alertas de Estancamiento (> 7 Días) (${stagnant.length})`,
        icon: '⚠️',
        items: stagnant,
        description: 'Proyectos de la cohorte detenidos que requieren intervención de la coordinación.'
      },
      {
        id: 'cohortGoal',
        label: `Cohorte Top Companies 2026 (${cohortGoal.length})`,
        icon: '🎯',
        items: cohortGoal,
        description: 'Avance global contra la meta de la cohorte (Meta: 15 iniciativas estandarizadas).'
      }
    ];
  } else if (role === 'CONSULTANT') {
    const orgA = initiatives.filter((i) => i.tenantId === 'ORG-A');
    const orgB = initiatives.filter((i) => i.tenantId === 'ORG-B');
    const bestPractices = initiatives.filter((i) => i.state === 'FINALIZADA' && i.diagnostic.ve_annual_value >= 15000);

    subgroups = [
      {
        id: 'consolidated',
        label: `Consolidado Multiempresa (Total: ${initiatives.length})`,
        icon: '🌐',
        items: initiatives,
        description: `Visión global de portafolio: ${orgA.length} en Manufactura Norte (ORG-A) y ${orgB.length} en Alimentos Bajío (ORG-B).`
      },
      {
        id: 'semaphore',
        label: `Semáforo Metodológico por Cohorte`,
        icon: '🚦',
        items: initiatives.filter((i) => i.state !== 'FINALIZADA' && i.state !== 'RECHAZADA'),
        description: 'Monitoreo de cumplimiento del método Kizukai: Pasos 1 a 6 y Cero Inversión de Capital.'
      },
      {
        id: 'bestPractices',
        label: `Directorio de Mejores Prácticas K2/K3 (${bestPractices.length})`,
        icon: '⭐',
        items: bestPractices,
        description: 'Iniciativas estandarizadas de alto impacto económico listas para replicación horizontal.'
      }
    ];
  }

  const activeGroup = selectedSubgroup === 'all'
    ? subgroups[0]
    : subgroups.find((g) => g.id === selectedSubgroup) || subgroups[0];

  return (
    <section aria-labelledby="role-queues-title" style={{ marginBottom: '2rem' }}>
      {/* Banner de Contexto Operativo por Rol */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--kiz-border)',
        borderRadius: 'var(--kiz-radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--kiz-shadow-sm)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.35rem' }}>📥</span>
              <h1 id="role-queues-title" style={{ fontSize: '1.3rem', color: 'var(--kiz-text)' }}>
                Bandejas de Trabajo Especializadas &mdash; {currentUser.name}
              </h1>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--kiz-text-muted)' }}>
              Organizadas según las responsabilidades operacionales de la Sección 4 del PRD Kizukai.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`role-badge role-${currentUser.role}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              Rol Activo: {currentUser.role}
            </span>
          </div>
        </div>

        {/* Selector de Subgrupos / Pestañas de Bandeja */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--kiz-border-subtle)'
        }}>
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
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap'
                }}
                aria-pressed={isSelected}
              >
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Descripción del Subgrupo Activo */}
      <div style={{
        backgroundColor: 'var(--kiz-surface-subtle)',
        borderLeft: '4px solid var(--kiz-primary)',
        padding: '0.75rem 1rem',
        borderRadius: '0 var(--kiz-radius) var(--kiz-radius) 0',
        marginBottom: '1rem',
        fontSize: '0.825rem',
        color: 'var(--kiz-text-muted)'
      }}>
        <strong>{activeGroup.icon} {activeGroup.label}:</strong> {activeGroup.description}
      </div>

      {/* Grilla de Iniciativas en la Bandeja */}
      {activeGroup.items.length > 0 ? (
        <div className="kiz-grid-cards">
          {activeGroup.items.map((init) => (
            <InitiativeCard
              key={init.id}
              initiative={init}
              onOpenWorkspace={onOpenWorkspace}
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
