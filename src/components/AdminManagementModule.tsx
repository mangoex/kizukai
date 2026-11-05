import React, { useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';
import { AdminEngine, UserRole } from '../domain/adminEngine.ts';

interface AdminManagementModuleProps {
  currentUser: User;
}

export const AdminManagementModule: React.FC<AdminManagementModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'catalogs'>('users');

  // Estados de datos
  const [usersList, setUsersList] = useState<User[]>([]);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [deptsList, setDeptsList] = useState<any[]>([]);

  // Estados de feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de formularios
  // 1. Usuario
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('PARTICIPANT');
  const [newUserOrg, setNewUserOrg] = useState(currentUser.tenantId);
  const [newUserDept, setNewUserDept] = useState('');

  // 2. Organización (TECH_ADMIN)
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newCommercialName, setNewCommercialName] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newIndustry, setNewIndustry] = useState('Industrial y Manufactura');

  // 3. Departamento (COORDINATOR / CONSULTANT / TECH_ADMIN)
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBranch, setNewDeptBranch] = useState('Planta Principal');
  const [newDeptOrg, setNewDeptOrg] = useState(currentUser.tenantId);

  const loadData = () => {
    setUsersList(StorageService.getUsers());
    setOrgsList(StorageService.getOrganizations());
    setDeptsList(StorageService.getDepartments());
  };

  useEffect(() => {
    loadData();
    // Preconfigurar rol inicial sugerido según actor
    if (currentUser.role === 'TECH_ADMIN') {
      setNewUserRole('CONSULTANT');
      setNewUserOrg('ORG-GLOBAL');
    } else if (currentUser.role === 'CONSULTANT') {
      setNewUserRole('COORDINATOR');
      setNewUserOrg('ORG-A');
    } else {
      setNewUserRole('PARTICIPANT');
      setNewUserOrg(currentUser.tenantId);
    }
  }, [currentUser]);

  const clearAlerts = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Roles permitidos para dar de alta según actor
  const getAllowedTargetRoles = (): UserRole[] => {
    if (currentUser.role === 'TECH_ADMIN') return ['CONSULTANT'];
    if (currentUser.role === 'CONSULTANT') return ['COORDINATOR'];
    if (currentUser.role === 'COORDINATOR') return ['PARTICIPANT', 'MENTOR'];
    return [];
  };

  const allowedRoles = getAllowedTargetRoles();
  const canCreateUsers = allowedRoles.length > 0;
  const canCreateOrgs = currentUser.role === 'TECH_ADMIN';
  const canManageDepts = currentUser.role === 'TECH_ADMIN' || currentUser.role === 'CONSULTANT' || currentUser.role === 'COORDINATOR';

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const res = StorageService.createUser(currentUser, {
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      organizationId: newUserOrg,
      department: newUserDept || 'General'
    });

    if (res.success && res.user) {
      setSuccessMsg(`✓ Usuario ${res.user.name} (${res.user.role}) registrado exitosamente.`);
      setNewUserName('');
      setNewUserEmail('');
      loadData();
    } else {
      setErrorMsg(res.error || 'Error al crear el usuario.');
    }
  };

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const res = StorageService.createOrganization(currentUser, {
      businessName: newBusinessName,
      commercialName: newCommercialName,
      taxId: newTaxId,
      industrySector: newIndustry
    });

    if (res.success && res.organization) {
      setSuccessMsg(`✓ Empresa ${res.organization.commercialName} (${res.organization.id}) creada exitosamente.`);
      setNewBusinessName('');
      setNewCommercialName('');
      setNewTaxId('');
      loadData();
    } else {
      setErrorMsg(res.error || 'Error al crear la organización.');
    }
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const res = StorageService.createDepartment(currentUser, {
      organizationId: newDeptOrg,
      name: newDeptName,
      branchOffice: newDeptBranch
    });

    if (res.success && res.department) {
      setSuccessMsg(`✓ Departamento '${res.department.name}' agregado al catálogo de ${res.department.organizationId}.`);
      setNewDeptName('');
      loadData();
    } else {
      setErrorMsg(res.error || 'Error al crear el departamento.');
    }
  };

  // Filtrado de usuarios según permisos de visualización
  const visibleUsers = usersList.filter((u) => {
    if (currentUser.role === 'TECH_ADMIN' || currentUser.role === 'CONSULTANT') return true;
    return u.tenantId === currentUser.tenantId;
  });

  return (
    <section aria-labelledby="admin-module-title" style={{ marginBottom: '2.5rem' }}>
      {/* Cabecera del Módulo */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--kiz-border)',
        borderRadius: 'var(--kiz-radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--kiz-shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.35rem' }}>👥</span>
              <h1 id="admin-module-title" style={{ fontSize: '1.35rem', color: 'var(--kiz-text)', margin: 0 }}>
                Aprovisionamiento y Catálogos Corporativos
              </h1>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-muted)', margin: 0 }}>
              Gobierno jerárquico RBAC: Admin &rarr; Consultores &rarr; Coordinadores &rarr; Participantes y Mentores.
            </p>
          </div>

          <span className={`role-badge role-${currentUser.role}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
            Operando como: {currentUser.role}
          </span>
        </div>

        {/* Pestañas de Gestión */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--kiz-border-subtle)' }}>
          <button
            onClick={() => { setActiveTab('users'); clearAlerts(); }}
            className="kiz-btn kiz-btn-sm"
            style={{
              backgroundColor: activeTab === 'users' ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
              color: activeTab === 'users' ? '#ffffff' : 'var(--kiz-text)',
              border: '1px solid var(--kiz-border)'
            }}
          >
            👤 Directorio de Usuarios ({visibleUsers.length})
          </button>

          {canCreateOrgs && (
            <button
              onClick={() => { setActiveTab('organizations'); clearAlerts(); }}
              className="kiz-btn kiz-btn-sm"
              style={{
                backgroundColor: activeTab === 'organizations' ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
                color: activeTab === 'organizations' ? '#ffffff' : 'var(--kiz-text)',
                border: '1px solid var(--kiz-border)'
              }}
            >
              🏢 Empresas Clientes ({orgsList.length})
            </button>
          )}

          <button
            onClick={() => { setActiveTab('catalogs'); clearAlerts(); }}
            className="kiz-btn kiz-btn-sm"
            style={{
              backgroundColor: activeTab === 'catalogs' ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
              color: activeTab === 'catalogs' ? '#ffffff' : 'var(--kiz-text)',
              border: '1px solid var(--kiz-border)'
            }}
          >
            🗂️ Catálogos de Áreas ({deptsList.length})
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="kiz-alert kiz-alert-success" role="alert">
          <span>✓</span>
          <div>{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="kiz-alert kiz-alert-danger" role="alert">
          <span>⚠️</span>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* TAB 1: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          {/* Formulario de Alta de Usuario */}
          {canCreateUsers ? (
            <div className="kiz-card" style={{ height: 'fit-content' }}>
              <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.4rem' }}>
                + Registrar Nuevo Usuario
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginBottom: '1rem' }}>
                {currentUser.role === 'TECH_ADMIN' && 'Como Administrador Técnico, das de alta a Consultores Globales.'}
                {currentUser.role === 'CONSULTANT' && 'Como Consultor Global, das de alta a Coordinadores de Empresa.'}
                {currentUser.role === 'COORDINATOR' && 'Como Coordinador, das de alta a Participantes y Mentores para tu empresa.'}
              </p>

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="kiz-label">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Sánchez"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="kiz-input"
                  />
                </div>

                <div>
                  <label className="kiz-label">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="roberto.s@empresa.mx"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="kiz-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label className="kiz-label">Rol Asignado *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="kiz-select"
                    >
                      {allowedRoles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="kiz-label">Organización *</label>
                    {currentUser.role === 'COORDINATOR' ? (
                      <input
                        type="text"
                        disabled
                        value={currentUser.tenantName}
                        className="kiz-input"
                        style={{ backgroundColor: 'var(--kiz-surface-muted)' }}
                      />
                    ) : (
                      <select
                        value={newUserOrg}
                        onChange={(e) => setNewUserOrg(e.target.value)}
                        className="kiz-select"
                      >
                        {currentUser.role === 'TECH_ADMIN' && <option value="ORG-GLOBAL">Kizukai Global (Consultoría)</option>}
                        {orgsList.map((o) => (
                          <option key={o.id} value={o.id}>{o.commercialName} ({o.id})</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="kiz-label">Departamento / Área</label>
                  <select
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="kiz-select"
                  >
                    <option value="">-- Seleccionar Área --</option>
                    {deptsList
                      .filter((d) => d.organizationId === newUserOrg)
                      .map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    <option value="Operaciones Generales">Operaciones Generales</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="kiz-btn kiz-btn-accent"
                  style={{ marginTop: '0.5rem', fontWeight: 700 }}
                >
                  🚀 Dar de Alta Usuario
                </button>
              </form>
            </div>
          ) : (
            <div className="kiz-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
              <h3 style={{ fontSize: '1rem', color: 'var(--kiz-text-muted)' }}>Sin privilegios de alta</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--kiz-text-subtle)' }}>
                Tu rol actual ({currentUser.role}) no tiene autorización para dar de alta nuevos usuarios.
              </p>
            </div>
          )}

          {/* Directorio de Usuarios Activos */}
          <div className="kiz-card">
            <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
              Directorio de Usuarios ({visibleUsers.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              {visibleUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: '1px solid var(--kiz-border-subtle)',
                    backgroundColor: 'var(--kiz-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{u.name}</strong>
                      <span className={`role-badge role-${u.role}`} style={{ fontSize: '0.65rem' }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)', marginTop: '0.15rem' }}>
                      📧 {u.email}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)' }}>
                      🏢 {u.tenantName} &middot; 📍 {u.department || 'General'}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 4, backgroundColor: u.requiresMfa ? '#ecfdf5' : '#f1f5f9', color: u.requiresMfa ? '#065f46' : '#64748b', fontWeight: 600 }}>
                    {u.requiresMfa ? 'MFA Activo' : 'Básico'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE EMPRESAS (TECH_ADMIN) */}
      {activeTab === 'organizations' && canCreateOrgs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          <div className="kiz-card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.4rem' }}>
              + Registrar Nueva Empresa Cliente
            </h2>
            <form onSubmit={handleCreateOrganization} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="kiz-label">Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Industrias Metalmecánicas del Norte S.A."
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="kiz-input"
                />
              </div>

              <div>
                <label className="kiz-label">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. InduMetal"
                  value={newCommercialName}
                  onChange={(e) => setNewCommercialName(e.target.value)}
                  className="kiz-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="kiz-label">RFC / Tax ID</label>
                  <input
                    type="text"
                    placeholder="IMN240101XYZ"
                    value={newTaxId}
                    onChange={(e) => setNewTaxId(e.target.value)}
                    className="kiz-input"
                  />
                </div>
                <div>
                  <label className="kiz-label">Sector Industrial</label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="kiz-select"
                  >
                    <option value="Automotriz">Automotriz</option>
                    <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                    <option value="Aeroespacial">Aeroespacial</option>
                    <option value="Metalmecánica">Metalmecánica</option>
                    <option value="Farmacéutica">Farmacéutica</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="kiz-btn kiz-btn-primary" style={{ marginTop: '0.5rem', fontWeight: 700 }}>
                🏢 Crear Espacio de Empresa (Tenant)
              </button>
            </form>
          </div>

          <div className="kiz-card">
            <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
              Empresas Activas en Plataforma ({orgsList.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {orgsList.map((org) => (
                <div
                  key={org.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: '1px solid var(--kiz-border)',
                    backgroundColor: 'var(--kiz-surface-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--kiz-text)' }}>{org.commercialName}</strong>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--kiz-font-mono)', fontWeight: 700, backgroundColor: 'var(--kiz-primary-light)', color: 'var(--kiz-primary)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                      {org.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginTop: '0.2rem' }}>
                    {org.businessName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', marginTop: '0.25rem' }}>
                    Sector: <strong>{org.industrySector}</strong> &middot; RFC: {org.taxId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATÁLOGOS CORPORATIVOS */}
      {activeTab === 'catalogs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          {canManageDepts && (
            <div className="kiz-card" style={{ height: 'fit-content' }}>
              <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.4rem' }}>
                + Agregar Área o Departamento
              </h2>
              <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="kiz-label">Nombre del Departamento / Línea *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Línea 4 de Ensamble Final"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="kiz-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label className="kiz-label">Empresa *</label>
                    {currentUser.role === 'COORDINATOR' ? (
                      <input
                        type="text"
                        disabled
                        value={currentUser.tenantName}
                        className="kiz-input"
                        style={{ backgroundColor: 'var(--kiz-surface-muted)' }}
                      />
                    ) : (
                      <select
                        value={newDeptOrg}
                        onChange={(e) => setNewDeptOrg(e.target.value)}
                        className="kiz-select"
                      >
                        {orgsList.map((o) => (
                          <option key={o.id} value={o.id}>{o.commercialName}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="kiz-label">Planta / Sucursal</label>
                    <input
                      type="text"
                      placeholder="Planta Norte"
                      value={newDeptBranch}
                      onChange={(e) => setNewDeptBranch(e.target.value)}
                      className="kiz-input"
                    />
                  </div>
                </div>

                <button type="submit" className="kiz-btn kiz-btn-primary" style={{ marginTop: '0.5rem', fontWeight: 700 }}>
                  ➕ Guardar en Catálogo
                </button>
              </form>
            </div>
          )}

          <div className="kiz-card">
            <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
              Catálogo de Áreas por Empresa ({deptsList.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '550px', overflowY: 'auto' }}>
              {deptsList.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: '1px solid var(--kiz-border-subtle)',
                    backgroundColor: 'var(--kiz-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{d.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)' }}>
                      🏢 {d.organizationId} &middot; 📍 {d.branchOffice || 'Planta Principal'}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--kiz-font-mono)', color: 'var(--kiz-text-muted)' }}>
                    {d.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
