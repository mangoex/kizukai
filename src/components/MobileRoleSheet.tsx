import React from 'react';
import { User, DemoProfile } from '../types/index.ts';
import { DEMO_PROFILES } from '../data/seedData.ts';

interface MobileRoleSheetProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  onOpenLoginModal: () => void;
  onNavigateToDatabase: () => void;
  onNavigateToAdmin?: () => void;
}

export const MobileRoleSheet: React.FC<MobileRoleSheetProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser,
  onOpenLoginModal,
  onNavigateToDatabase,
  onNavigateToAdmin
}) => {
  if (!isOpen) return null;

  const getRolePermissionsDescription = (role?: string) => {
    switch (role) {
      case 'PARTICIPANT':
        return 'Registra iniciativas K0-K3 con Cero Inversión, ejecuta tareas en Gemba y carga evidencias corregidas v2.0.';
      case 'MENTOR':
        return 'Valida planes de trabajo (máx. 8 semanas / 56 días), audita en Gemba con checklist 5S y firma digitalmente.';
      case 'COORDINATOR':
        return 'Aplica filtro técnico de aprobación/rechazo, asigna mentores y vigila metas de cohorte y alertas de estancamiento.';
      case 'CONSULTANT':
        return 'Acceso global multiempresa (ORG-A + ORG-B), semáforo de apego metodológico y directorio de mejores prácticas K2/K3.';
      case 'TECH_ADMIN':
        return 'Gobernanza de las 22 tablas, bitácoras de auditoría y parámetros del sistema. Bloqueado por diseño de leer contenido funcional.';
      default:
        return 'Selecciona un perfil para operar la plataforma con sus permisos asignados.';
    }
  };

  return (
    <div
      className="kiz-bottom-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-sheet-title"
      onClick={onClose}
    >
      <div
        className="kiz-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle táctil */}
        <div className="kiz-bottom-sheet-drag-handle" aria-hidden="true" />

        {/* Cabecera del Sheet */}
        <div className="kiz-bottom-sheet-header">
          <div>
            <h2 id="role-sheet-title" style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', margin: 0 }}>
              Cambio Rápido de Rol & Perfil
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)', margin: 0 }}>
              1 toque para alternar entre roles demo en planta
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            style={{ fontSize: '1.25rem', padding: '0.2rem 0.5rem', minHeight: 36 }}
            aria-label="Cerrar panel de rol"
          >
            &times;
          </button>
        </div>

        {/* Cuerpo del Sheet */}
        <div className="kiz-bottom-sheet-body">
          {/* Tarjeta de Rol Activo y Permisos */}
          {currentUser && (
            <div style={{
              backgroundColor: 'var(--kiz-surface-subtle)',
              border: '1px solid var(--kiz-border)',
              borderRadius: 'var(--kiz-radius)',
              padding: '0.85rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--kiz-primary)', letterSpacing: '0.04em' }}>
                  USUARIO Y ROL ACTIVO
                </span>
                <span className={`role-badge role-${currentUser.role}`} style={{ fontSize: '0.7rem' }}>
                  {currentUser.role}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--kiz-text)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)', marginBottom: '0.5rem' }}>
                🏢 {currentUser.tenantName} ({currentUser.tenantId}) &middot; {currentUser.department}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--kiz-text-muted)',
                backgroundColor: '#ffffff',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--kiz-radius-xs)',
                borderLeft: '3px solid var(--kiz-accent)'
              }}>
                <strong>Permisos clave:</strong> {getRolePermissionsDescription(currentUser.role)}
              </div>
            </div>
          )}

          {/* Selector de Perfiles a 1 Toque */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--kiz-text)', marginBottom: '0.5rem' }}>
              🎯 Seleccionar Perfil Demo (1 Toque Táctil):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DEMO_PROFILES.map((profile: DemoProfile) => {
                const isSelected = currentUser?.email === profile.user.email;
                return (
                  <button
                    key={profile.user.email}
                    type="button"
                    onClick={() => {
                      onSelectUser(profile.user);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--kiz-radius)',
                      border: isSelected ? '2px solid var(--kiz-accent)' : '1px solid var(--kiz-border)',
                      backgroundColor: isSelected ? 'var(--kiz-primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: 52,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--kiz-accent)' : 'var(--kiz-primary)',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {profile.user.avatarInitials}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--kiz-text)' }}>
                          {profile.user.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {profile.tag}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {profile.requiresMfa && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 'var(--kiz-radius-xs)'
                        }}>
                          MFA
                        </span>
                      )}
                      {isSelected ? (
                        <span style={{ color: 'var(--kiz-accent)', fontWeight: 800, fontSize: '1rem' }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--kiz-border)', fontSize: '0.9rem' }}>›</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accesos de Seguridad y Base de Datos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: onNavigateToAdmin ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '0.4rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--kiz-border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => {
                onNavigateToDatabase();
                onClose();
              }}
              className="kiz-btn kiz-btn-secondary kiz-btn-sm"
              style={{ fontSize: '0.72rem', minHeight: 44, justifyContent: 'center', padding: '0.2rem' }}
            >
              🛡️ Tablas DB
            </button>

            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToAdmin();
                  onClose();
                }}
                className="kiz-btn kiz-btn-secondary kiz-btn-sm"
                style={{ fontSize: '0.72rem', minHeight: 44, justifyContent: 'center', padding: '0.2rem' }}
              >
                👥 Usuarios
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLoginModal();
              }}
              className="kiz-btn kiz-btn-primary kiz-btn-sm"
              style={{ fontSize: '0.72rem', minHeight: 44, justifyContent: 'center', padding: '0.2rem' }}
            >
              🔑 Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
