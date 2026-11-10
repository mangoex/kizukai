import React from 'react';
import { User } from '../types/index.ts';

interface MobileBottomNavProps {
  currentUser: User | null;
  activeView: 'queues' | 'catalog' | 'reports' | 'database' | 'admin';
  onNavigate: (view: 'queues' | 'catalog' | 'reports' | 'database' | 'admin') => void;
  pendingCount?: number;
  onOpenNewInitiative: () => void;
  onOpenRoleSheet: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  activeView,
  onNavigate,
  pendingCount = 0,
  onOpenNewInitiative,
  onOpenRoleSheet
}) => {
  const isTechAdmin = currentUser?.role === 'TECH_ADMIN';

  const handleCenterAction = () => {
    if (isTechAdmin) {
      // Tech admin tiene bloqueado el registro de iniciativas de negocio, redirige a arquitectura de seguridad/BD
      onNavigate('database');
    } else {
      onOpenNewInitiative();
    }
  };

  return (
    <nav
      className="kiz-bottom-nav"
      aria-label="Navegación móvil inferior (Thumb-Zone)"
      role="navigation"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
    >
      {/* 1. Mi Rol / Bandejas */}
      <button
        type="button"
        onClick={() => onNavigate('queues')}
        className={`kiz-bottom-nav-item ${activeView === 'queues' ? 'active' : ''}`}
        aria-current={activeView === 'queues' ? 'page' : undefined}
        aria-label={`Mi Rol y Bandejas de Trabajo${pendingCount > 0 ? `, ${pendingCount} pendientes` : ''}`}
      >
        <span className="kiz-bottom-nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        </span>
        <span>Mi Rol</span>
        {pendingCount > 0 && (
          <span className="kiz-bottom-nav-badge" aria-hidden="true">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {/* 2. Explorar / Catálogo */}
      <button
        type="button"
        onClick={() => onNavigate('catalog')}
        className={`kiz-bottom-nav-item ${activeView === 'catalog' ? 'active' : ''}`}
        aria-current={activeView === 'catalog' ? 'page' : undefined}
        aria-label="Explorar Catálogo de Iniciativas"
      >
        <span className="kiz-bottom-nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <span>Explorar</span>
      </button>

      {/* 3. Botón Central Prominente: + K2 (Thumb-Zone Focal) */}
      <button
        type="button"
        onClick={handleCenterAction}
        className="kiz-bottom-nav-fab"
        aria-label={isTechAdmin ? 'Seguridad y Parámetros RBAC' : 'Capturar Nueva Iniciativa K2'}
        title={isTechAdmin ? 'Seguridad RBAC' : 'Nueva Iniciativa K2'}
      >
        <span className="kiz-bottom-nav-fab-icon">
          {isTechAdmin ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ) : '+'}
        </span>
      </button>

      {/* 4. KPIs / Reportes */}
      <button
        type="button"
        onClick={() => onNavigate('reports')}
        className={`kiz-bottom-nav-item ${activeView === 'reports' ? 'active' : ''}`}
        aria-current={activeView === 'reports' ? 'page' : undefined}
        aria-label="Reportes Directivos y KPIs Kaizen"
      >
        <span className="kiz-bottom-nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </span>
        <span>KPIs</span>
      </button>

      {/* 5. Perfil / Rol Sheet / DB */}
      <button
        type="button"
        onClick={onOpenRoleSheet}
        className={`kiz-bottom-nav-item ${activeView === 'database' ? 'active' : ''}`}
        aria-label="Cambiar Rol, Perfil o Ver Base de Datos"
      >
        <span className="kiz-bottom-nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span>Perfil / DB</span>
      </button>
    </nav>
  );
};
