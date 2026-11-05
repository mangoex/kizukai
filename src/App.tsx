import React, { useState, useEffect, useMemo } from 'react';
import { User, Initiative } from './types/index.ts';
import { DEMO_USERS } from './data/seedData.ts';
import { StorageService } from './services/storageService.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { RoleQueues } from './components/RoleQueues.tsx';
import { InitiativeFilters, FilterState } from './components/InitiativeFilters.tsx';
import { InitiativeCard } from './components/InitiativeCard.tsx';
import { WorkspaceModal } from './components/WorkspaceModal.tsx';
import { NewInitiativeModal } from './components/NewInitiativeModal.tsx';
import { ReportsModule } from './components/ReportsModule.tsx';
import { DatabaseSimulator } from './components/DatabaseSimulator.tsx';
import { AdminManagementModule } from './components/AdminManagementModule.tsx';
import { useViewport } from './hooks/useViewport.ts';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { MobileRoleSheet } from './components/MobileRoleSheet.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  tenantFilter: 'ALL',
  department: 'ALL',
  state: 'ALL',
  step: 'ALL',
  guideline: 'ALL',
  program: 'ALL'
};

export const App: React.FC = () => {
  // Usuario Activo (por defecto Ana Sofía Garza - Coordinadora de Empresa)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kizukai_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS.ana_coord;
      }
    }
    return DEMO_USERS.ana_coord;
  });

  // Vista Activa
  const [activeView, setActiveView] = useState<'queues' | 'catalog' | 'reports' | 'database' | 'admin'>('queues');

  // Estado de Iniciativas y Modales
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [activeWorkspaceInit, setActiveWorkspaceInit] = useState<Initiative | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hook reactivo de viewport
  const { isMobile } = useViewport();

  // Conteo de iniciativas pendientes por rol para el badge móvil
  const pendingCount = useMemo(() => {
    if (!currentUser) return 0;
    switch (currentUser.role) {
      case 'PARTICIPANT':
        return initiatives.filter((i) => i.state === 'BORRADOR' || i.state === 'DEVUELTA_PARA_AJUSTES').length;
      case 'MENTOR':
        return initiatives.filter((i) =>
          i.state === 'PENDIENTE_PLAN_IMPLEMENTACION' ||
          i.state === 'PENDIENTE_RESULTADOS' ||
          i.state === 'POR_EVALUAR'
        ).length;
      case 'COORDINATOR':
        return initiatives.filter((i) =>
          i.state === 'POR_APROBAR' ||
          i.state === 'PENDIENTE_ASIGNACION_MENTOR' ||
          i.isStagnant
        ).length;
      case 'CONSULTANT':
        return initiatives.filter((i) => i.state === 'POR_APROBAR' || i.state === 'DEVUELTA_PARA_AJUSTES').length;
      default:
        return 0;
    }
  }, [currentUser, initiatives]);

  // Filtros del Catálogo
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Banner Global de Alertas (ej. Bloqueos 403)
  const [globalAlert, setGlobalAlert] = useState<{
    type: 'danger' | 'warning' | 'success' | 'info';
    title: string;
    message: string;
  } | null>(null);


  // Carga inicial y sincronización con el usuario actual
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kizukai_active_user', JSON.stringify(currentUser));
      const userInitiatives = StorageService.getInitiativesForUser(currentUser);
      setInitiatives(userInitiatives);

      // Si el rol es TECH_ADMIN, por defecto redirigir a la vista de base de datos
      if (currentUser.role === 'TECH_ADMIN') {
        setActiveView('database');
      }
    } else {
      setInitiatives([]);
    }
  }, [currentUser]);

  // Recarga datos desde localStorage
  const refreshInitiatives = () => {
    if (currentUser) {
      const updated = StorageService.getInitiativesForUser(currentUser);
      setInitiatives(updated);
    }
  };

  // Apertura segura del Workspace con validación Cross-Tenant y Segregación
  const handleOpenWorkspace = (init: Initiative) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const check = StorageService.getInitiativeByIdSecure(init.id, currentUser);

    if (check.errorCode === '403_CROSS_TENANT_VIOLATION' || check.errorCode === '403_TECH_ADMIN_BLOCKED') {
      setGlobalAlert({
        type: 'danger',
        title: 'Acceso Denegado por Seguridad (403 Forbidden)',
        message: check.error || 'Violación de políticas de acceso.'
      });
      return;
    }

    if (check.data) {
      setActiveWorkspaceInit(check.data);
    }
  };

  // Filtrado de iniciativas en la vista de Catálogo
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((item) => {
      // Búsqueda por texto (folio, título, proponente)
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchFolio = item.folio.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchProponent = item.proponentName.toLowerCase().includes(q);
        if (!matchFolio && !matchTitle && !matchProponent) {
          return false;
        }
      }

      // Filtro de Tenant (para Consultor)
      if (filters.tenantFilter !== 'ALL' && item.tenantId !== filters.tenantFilter) {
        return false;
      }

      // Filtro de Departamento
      if (filters.department !== 'ALL' && item.department !== filters.department) {
        return false;
      }

      // Filtro de Estado
      if (filters.state !== 'ALL' && item.state !== filters.state) {
        return false;
      }

      // Filtro de Etapa Metodológica
      if (filters.step !== 'ALL' && item.currentStep !== filters.step) {
        return false;
      }

      // Filtro de Directriz
      if (filters.guideline !== 'ALL' && item.guideline !== filters.guideline) {
        return false;
      }

      return true;
    });
  }, [initiatives, filters]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Enlace Accesible de Salto al Contenido */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: -999,
          left: 10,
          backgroundColor: 'var(--kiz-primary)',
          color: '#ffffff',
          padding: '0.5rem 1rem',
          zIndex: 9999
        }}
        onFocus={(e) => (e.currentTarget.style.top = '10px')}
        onBlur={(e) => (e.currentTarget.style.top = '-999px')}
      >
        Saltar al contenido principal (Accesibilidad)
      </a>

      {/* Barra de Navegación Superior */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenRoleSheet={() => setIsRoleSheetOpen(true)}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          setGlobalAlert({
            type: 'info',
            title: 'Perfil Cambiado Exitosamente',
            message: `Ahora estás operando como '${user.name}' con rol '${user.role}' en '${user.tenantName}'.`
          });
        }}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('kizukai_active_user');
          setIsLoginModalOpen(true);
        }}
      />


      {/* Contenido Principal */}
      <main id="main-content" className="kiz-container" style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Banner de Alerta Global */}
        {globalAlert && (
          <div
            className={`kiz-alert kiz-alert-${globalAlert.type}`}
            role="alert"
            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <strong>{globalAlert.title}:</strong> {globalAlert.message}
            </div>
            <button
              onClick={() => setGlobalAlert(null)}
              className="kiz-btn kiz-btn-ghost kiz-btn-sm"
              style={{ fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
              aria-label="Cerrar alerta"
            >
              &times;
            </button>
          </div>
        )}

        {/* VISTAS */}
        {currentUser ? (
          <>
            {activeView === 'queues' && (
              <RoleQueues
                currentUser={currentUser}
                initiatives={initiatives}
                onOpenWorkspace={handleOpenWorkspace}
                onOpenNewInitiative={() => setIsNewModalOpen(true)}
                onInitiativeUpdated={refreshInitiatives}
                onNavigateToTab={(v) => setActiveView(v)}
                onNavigateTab={(v) => setActiveView(v === 'dashboard' ? 'catalog' : v)}
              />
            )}

            {activeView === 'catalog' && (
              <section aria-labelledby="catalog-title">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h1 id="catalog-title" style={{ fontSize: '1.35rem', color: 'var(--kiz-text)' }}>
                      Catálogo Integral de Iniciativas Kaizen
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-muted)' }}>
                      Búsqueda y filtros combinables para el portafolio de mejora continua.
                    </p>
                  </div>

                  {currentUser.role !== 'TECH_ADMIN' && (
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="kiz-btn kiz-btn-accent kiz-btn-sm"
                    >
                      + Registrar Nueva Iniciativa K2
                    </button>
                  )}
                </div>

                {/* Panel de Filtros */}
                <InitiativeFilters
                  currentUser={currentUser}
                  filters={filters}
                  onFilterChange={setFilters}
                  onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                  totalResults={filteredInitiatives.length}
                />

                {/* Grilla de Tarjetas */}
                {filteredInitiatives.length > 0 ? (
                  <div className="kiz-grid-cards">
                    {filteredInitiatives.map((init) => (
                      <InitiativeCard
                        key={init.id}
                        initiative={init}
                        currentUser={currentUser}
                        onQuickActionUpdated={refreshInitiatives}
                        onOpenWorkspace={handleOpenWorkspace}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="kiz-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--kiz-text-muted)' }}>
                      No se encontraron iniciativas con los filtros seleccionados
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--kiz-text-subtle)', marginBottom: '1rem' }}>
                      Prueba a restablecer los filtros para ver todo el inventario Kaizen.
                    </p>
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="kiz-btn kiz-btn-secondary kiz-btn-sm"
                    >
                      Restablecer Filtros
                    </button>
                  </div>
                )}
              </section>
            )}

            {activeView === 'reports' && (
              <ReportsModule
                currentUser={currentUser}
                initiatives={initiatives}
              />
            )}

            {activeView === 'database' && (
              <DatabaseSimulator
                currentUser={currentUser}
              />
            )}

            {activeView === 'admin' && (
              <AdminManagementModule
                currentUser={currentUser}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
              />
            )}
          </>
        ) : (
          <div className="kiz-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', margin: '2rem auto', maxWidth: 600 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
              Sesión No Iniciada
            </h2>
            <p style={{ color: 'var(--kiz-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Para ingresar al Hub de Mejora Continua Kizukai y gestionar las iniciativas de tu organización, por favor autentícate.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="kiz-btn kiz-btn-primary kiz-btn-lg"
            >
              Abrir Acceso Multi-Tenant &rarr;
            </button>
          </div>
        )}
      </main>

      {/* Footer Industrial Kaizen */}
      <footer style={{
        backgroundColor: 'var(--kiz-surface)',
        borderTop: '1px solid var(--kiz-border)',
        padding: '1.25rem',
        fontSize: '0.75rem',
        color: 'var(--kiz-text-subtle)',
        textAlign: 'center'
      }}>
        <div className="kiz-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>Kizukai Project Hub &copy; 2026</strong> &middot; Metodología Kaizen Cero Inversión &middot; Gemba Walk
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>WCAG 2.1 AA Compliant</span>
            <span>&middot;</span>
            <span>Multi-Tenant Isolated</span>
            <span>&middot;</span>
            <span>22 DB Entities PRD</span>
          </div>
        </div>
      </footer>

      {/* MODALES */}
      {/* Modal de Workspace */}
      {activeWorkspaceInit && currentUser && (
        <WorkspaceModal
          initiative={activeWorkspaceInit}
          currentUser={currentUser}
          onClose={() => setActiveWorkspaceInit(null)}
          onInitiativeUpdated={(updated) => {
            setActiveWorkspaceInit(updated);
            refreshInitiatives();
          }}
        />
      )}

      {/* Modal de Nueva Iniciativa */}
      {isNewModalOpen && currentUser && (
        <NewInitiativeModal
          isOpen={isNewModalOpen}
          currentUser={currentUser}
          onClose={() => setIsNewModalOpen(false)}
          onInitiativeCreated={(newInit) => {
            refreshInitiatives();
            setActiveWorkspaceInit(newInit);
            setGlobalAlert({
              type: 'success',
              title: 'Iniciativa Creada Exitosamente',
              message: `Folio ${newInit.folio} registrado en estado ${newInit.state}.`
            });
          }}
        />
      )}

      {/* Modal de Login / Switcher */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
          setGlobalAlert({
            type: 'success',
            title: 'Autenticación Exitosa',
            message: `Bienvenido, ${user.name} (${user.role}) a ${user.tenantName}.`
          });
        }}
      />

      {/* Barra Inferior Móvil Fija (Thumb-Zone) */}
      {currentUser && isMobile && (
        <MobileBottomNav
          currentUser={currentUser}
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          pendingCount={pendingCount}
          onOpenNewInitiative={() => setIsNewModalOpen(true)}
          onOpenRoleSheet={() => setIsRoleSheetOpen(true)}
        />
      )}

      {/* Bottom Sheet Móvil de Selección Rápida de Rol */}
      <MobileRoleSheet
        isOpen={isRoleSheetOpen}
        currentUser={currentUser}
        onClose={() => setIsRoleSheetOpen(false)}
        onSelectUser={(user) => {
          setCurrentUser(user);
          setGlobalAlert({
            type: 'info',
            title: 'Perfil Cambiado',
            message: `Operando como ${user.name} (${user.role}) en ${user.tenantName}.`
          });
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onNavigateToDatabase={() => setActiveView('database')}
        onNavigateToAdmin={() => setActiveView('admin')}
      />

      {/* Modal de Edición de Perfil de Usuario y Fotografía */}
      {isProfileModalOpen && currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshInitiatives();
            setGlobalAlert({
              type: 'success',
              title: 'Perfil Actualizado',
              message: `Los datos de contacto y foto de perfil para ${updatedUser.name} se han actualizado correctamente.`
            });
          }}
        />
      )}
    </div>
  );
};

