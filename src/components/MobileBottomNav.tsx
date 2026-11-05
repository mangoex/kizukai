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
    >
      {/* 1. Mi Rol / Bandejas */}
      <button
        type="button"
        onClick={() => onNavigate('queues')}
        className={`kiz-bottom-nav-item ${activeView === 'queues' ? 'active' : ''}`}
        aria-current={activeView === 'queues' ? 'page' : undefined}
        aria-label={`Mi Rol y Bandejas de Trabajo${pendingCount > 0 ? `, ${pendingCount} pendientes` : ''}`}
      >
        <span className="kiz-bottom-nav-icon">📥</span>
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
        <span className="kiz-bottom-nav-icon">🔍</span>
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
          {isTechAdmin ? '🛡️' : '+'}
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
        <span className="kiz-bottom-nav-icon">📊</span>
        <span>KPIs</span>
      </button>

      {/* 5. Perfil / Rol Sheet / DB */}
      <button
        type="button"
        onClick={onOpenRoleSheet}
        className={`kiz-bottom-nav-item ${activeView === 'database' ? 'active' : ''}`}
        aria-label="Cambiar Rol, Perfil o Ver Base de Datos"
      >
        <span className="kiz-bottom-nav-icon">🛡️</span>
        <span>Perfil / DB</span>
      </button>
    </nav>
  );
};
