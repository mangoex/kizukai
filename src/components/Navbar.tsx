import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { DEMO_PROFILES } from '../data/seedData.ts';

interface NavbarProps {
  currentUser: User | null;
  activeView: 'queues' | 'catalog' | 'reports' | 'database' | 'admin';
  onNavigate: (view: 'queues' | 'catalog' | 'reports' | 'database' | 'admin') => void;
  onOpenNewModal: () => void;
  onOpenLoginModal: () => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  onOpenRoleSheet?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenNewModal,
  onOpenLoginModal,
  onSwitchUser,
  onLogout,
  onOpenRoleSheet
}) => {
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PARTICIPANT': return 'Participante';
      case 'MENTOR': return 'Mentor de Mejora';
      case 'COORDINATOR': return 'Coordinador de Empresa';
      case 'CONSULTANT': return 'Consultor Kizukai Global';
      case 'TECH_ADMIN': return 'Administrador Técnico';
      default: return role;
    }
  };

  return (
    <header style={{
      backgroundColor: 'var(--kiz-primary)',
      color: '#ffffff',
      borderBottom: '3px solid var(--kiz-accent)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--kiz-shadow-md)'
    }}>
      {/* 1. Mobile Topbar Compacta (56px) - Solo visible en viewport < 768px */}
      <div className="kiz-mobile-topbar" aria-label="Cabecera móvil compacta">
        <div className="kiz-mobile-topbar-brand">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--kiz-radius-xs)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--kiz-shadow-sm)'
          }}>
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="20" fill="#1a2d42"/>
              <path d="M25 75 L50 25 L75 75 Z" stroke="#c44536" strokeWidth="9" fill="none"/>
              <circle cx="50" cy="55" r="14" fill="#e0a96d"/>
              <circle cx="50" cy="55" r="6" fill="#1a2d42"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            KIZUKAI <span style={{ color: 'var(--kiz-accent-light)', fontSize: '0.85rem' }}>K2</span>
          </span>
        </div>

        {currentUser ? (
          <button
            type="button"
            onClick={onOpenRoleSheet || (() => setShowProfileSwitcher(true))}
            className="kiz-mobile-role-pill"
            aria-label={`Cambiar rol. Rol actual: ${currentUser.role}`}
          >
            <span>👤</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name.split(' ')[0]} ({currentUser.tenantId})
            </span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>▾</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="kiz-btn kiz-btn-accent kiz-btn-sm"
            style={{ minHeight: 36, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Ingresar
          </button>
        )}
      </div>

      {/* 2. Barra Superior Desktop de Gobernanza y Tenant (Oculta en Móvil) */}
      <div className="kiz-hide-on-mobile">
        <div style={{
          backgroundColor: '#101e2e',
          padding: '0.35rem 1.25rem',
          fontSize: '0.75rem',
          display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Sistema Activo: <strong>Kizukai Hub MVP</strong> (Vite + React 18)
          </span>

          {currentUser && (
            <span style={{
              backgroundColor: currentUser.tenantId === 'ORG-A' ? '#1e3a8a' : '#065f46',
              color: '#ffffff',
              padding: '0.15rem 0.6rem',
              borderRadius: 'var(--kiz-radius-full)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              {currentUser.role === 'CONSULTANT'
                ? '🌐 VISIÓN MULTIEMPRESA (ORG-A + ORG-B)'
                : `🏢 TENANT: ${currentUser.tenantName} (${currentUser.tenantId})`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#cbd5e1' }}>Norma: <strong>Cero Inversión / Gemba Kaizen</strong></span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#cbd5e1' }}>Ventana Máx: <strong>8 Semanas (56 Días)</strong></span>
        </div>
      </div>

      {/* Barra de Navegación Principal */}
      <div className="kiz-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--kiz-radius)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--kiz-shadow-sm)'
          }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="20" fill="#1a2d42"/>
              <path d="M25 75 L50 25 L75 75 Z" stroke="#c44536" strokeWidth="9" fill="none"/>
              <circle cx="50" cy="55" r="14" fill="#e0a96d"/>
              <circle cx="50" cy="55" r="6" fill="#1a2d42"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                KIZUKAI
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--kiz-accent-light)', letterSpacing: '0.05em' }}>
                PROJECT HUB
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1 }}>
              Excelencia Operacional Kaizen &middot; Multi-Tenant
            </p>
          </div>
        </div>

        {/* Links de Navegación */}
        {currentUser && (
          <nav aria-label="Navegación principal" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('queues')}
              className="kiz-btn kiz-btn-sm"
              style={{
                backgroundColor: activeView === 'queues' ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                border: activeView === 'queues' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent'
              }}
              aria-current={activeView === 'queues' ? 'page' : undefined}
            >
              📥 Bandejas por Rol
            </button>

            <button
              onClick={() => onNavigate('catalog')}
              className="kiz-btn kiz-btn-sm"
              style={{
                backgroundColor: activeView === 'catalog' ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                border: activeView === 'catalog' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent'
              }}
              aria-current={activeView === 'catalog' ? 'page' : undefined}
            >
              🔍 Catálogo de Iniciativas
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="kiz-btn kiz-btn-sm"
              style={{
                backgroundColor: activeView === 'reports' ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                border: activeView === 'reports' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent'
              }}
              aria-current={activeView === 'reports' ? 'page' : undefined}
            >
              📊 Reportes Directivos (A, B, C)
            </button>

            <button
              onClick={() => onNavigate('database')}
              className="kiz-btn kiz-btn-sm"
              style={{
                backgroundColor: activeView === 'database' ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: '#ffffff',
                border: activeView === 'database' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent'
              }}
              aria-current={activeView === 'database' ? 'page' : undefined}
            >
              🛡️ BD (22 Tablas) & Seguridad
            </button>

            {(currentUser.role === 'TECH_ADMIN' || currentUser.role === 'CONSULTANT' || currentUser.role === 'COORDINATOR') && (
              <button
                onClick={() => onNavigate('admin')}
                className="kiz-btn kiz-btn-sm"
                style={{
                  backgroundColor: activeView === 'admin' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: '#ffffff',
                  border: activeView === 'admin' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent'
                }}
                aria-current={activeView === 'admin' ? 'page' : undefined}
              >
                👥 Usuarios & Áreas
              </button>
            )}
          </nav>
        )}

        {/* Acciones de Usuario / Perfiles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            <>
              {currentUser.role !== 'TECH_ADMIN' && (
                <button
                  onClick={onOpenNewModal}
                  className="kiz-btn kiz-btn-accent kiz-btn-sm"
                  aria-label="Registrar nueva iniciativa K2"
                  style={{ fontWeight: 700 }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Registrar K2
                </button>
              )}

              {/* Selector Rápido de Perfiles Demo */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                  className="kiz-btn kiz-btn-secondary kiz-btn-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    color: 'var(--kiz-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.75rem'
                  }}
                  aria-haspopup="true"
                  aria-expanded={showProfileSwitcher}
                >
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--kiz-primary)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {currentUser.avatarInitials}
                  </span>
                  <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--kiz-text-subtle)' }}>
                      {getRoleLabel(currentUser.role)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', marginLeft: '0.2rem' }}>▾</span>
                </button>

                {showProfileSwitcher && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '0.4rem',
                      width: 320,
                      backgroundColor: 'var(--kiz-surface)',
                      color: 'var(--kiz-text)',
                      borderRadius: 'var(--kiz-radius-lg)',
                      boxShadow: 'var(--kiz-shadow-lg)',
                      border: '1px solid var(--kiz-border)',
                      padding: '0.5rem',
                      zIndex: 200
                    }}
                    role="menu"
                  >
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--kiz-text-muted)',
                      borderBottom: '1px solid var(--kiz-border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Cambio Rápido de Rol (1 Clic)</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--kiz-accent)' }}>7 Perfiles Demo</span>
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0.3rem 0' }}>
                      {DEMO_PROFILES.map((p) => {
                        const isCurrent = currentUser.email === p.user.email;
                        return (
                          <button
                            key={p.user.email}
                            onClick={() => {
                              onSwitchUser(p.user);
                              setShowProfileSwitcher(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.5rem 0.65rem',
                              border: 'none',
                              background: isCurrent ? 'var(--kiz-primary-light)' : 'transparent',
                              borderRadius: 'var(--kiz-radius)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'background 0.15s ease'
                            }}
                            role="menuitem"
                          >
                            <span style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              backgroundColor: isCurrent ? 'var(--kiz-accent)' : 'var(--kiz-primary)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {p.user.avatarInitials}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--kiz-text)' }}>
                                {p.user.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.tag}
                              </div>
                            </div>
                            {p.requiresMfa && (
                              <span style={{
                                fontSize: '0.62rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 'var(--kiz-radius-xs)',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                fontWeight: 700
                              }}>
                                MFA
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{
                      paddingTop: '0.4rem',
                      borderTop: '1px solid var(--kiz-border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <button
                        onClick={() => {
                          setShowProfileSwitcher(false);
                          onOpenLoginModal();
                        }}
                        className="kiz-btn kiz-btn-ghost kiz-btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        Pantalla de Login
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileSwitcher(false);
                          onLogout();
                        }}
                        className="kiz-btn kiz-btn-ghost kiz-btn-sm"
                        style={{ color: 'var(--kiz-danger)', fontSize: '0.72rem' }}
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="kiz-btn kiz-btn-accent kiz-btn-sm"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};

