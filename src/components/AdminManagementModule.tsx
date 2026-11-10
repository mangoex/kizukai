import React, { useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';
import { AdminEngine, UserRole } from '../domain/adminEngine.ts';

interface AdminManagementModuleProps {
  currentUser: User;
  onOpenProfileModal?: () => void;
}

export const AdminManagementModule: React.FC<AdminManagementModuleProps> = ({ currentUser, onOpenProfileModal }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'catalogs' | 'guidelines' | 'roles'>('users');

  // Estados de datos
  const [usersList, setUsersList] = useState<User[]>([]);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [deptsList, setDeptsList] = useState<any[]>([]);
  const [guidelinesList, setGuidelinesList] = useState<any[]>([]);

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
  const [newOrgConsultantId, setNewOrgConsultantId] = useState('usr-004-kasuga');
  const [editingOrg, setEditingOrg] = useState<any | null>(null);

  // 3. Departamento (COORDINATOR / CONSULTANT / TECH_ADMIN)
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBranch, setNewDeptBranch] = useState('Planta Principal');
  const [newDeptOrg, setNewDeptOrg] = useState(currentUser.tenantId);

  // 4. Directriz Estratégica
  const [newGuidelineCode, setNewGuidelineCode] = useState('');
  const [newGuidelineLetter, setNewGuidelineLetter] = useState('');
  const [newGuidelineName, setNewGuidelineName] = useState('');
  const [newGuidelineDesc, setNewGuidelineDesc] = useState('');
  const [newGuidelineOrg, setNewGuidelineOrg] = useState(currentUser.tenantId !== 'ORG-GLOBAL' ? currentUser.tenantId : 'ORG-A');
  const [editingGuideline, setEditingGuideline] = useState<any | null>(null);
  const [guidelineFilterOrg, setGuidelineFilterOrg] = useState<string>('ALL');

  const loadData = () => {
    setUsersList(StorageService.getUsers());
    setOrgsList(StorageService.getOrganizations());
    setDeptsList(StorageService.getDepartments());
    setGuidelinesList(StorageService.getGuidelines());
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

  // Consultores disponibles para asignación a empresas
  const consultantsList = usersList.filter((u) => u.role === 'CONSULTANT');

  const getOrgCommercialName = (orgId: string): string => {
    const org = orgsList.find((o) => o.id === orgId);
    return org ? org.commercialName : orgId;
  };

  const getConsultantDisplayName = (org: any): string => {
    if (org.consultantName) return org.consultantName;
    if (org.consultantId) {
      const c = usersList.find((u) => u.id === org.consultantId);
      if (c) return c.name;
    }
    return 'Carlos Kasuga';
  };

  // Roles permitidos para dar de alta según actor
  const getAllowedTargetRoles = (): { code: UserRole; label: string }[] => {
    if (currentUser.role === 'TECH_ADMIN') {
      return [
        { code: 'CONSULTANT', label: 'Consultor (CONSULTANT)' },
        { code: 'MENTOR', label: 'Mentor (MENTOR)' },
        { code: 'PARTICIPANT', label: 'Participante (PARTICIPANT)' },
        { code: 'COORDINATOR', label: 'Coordinador (COORDINATOR)' },
        { code: 'TECH_ADMIN', label: 'Administrador Técnico (TECH_ADMIN)' }
      ];
    }
    if (currentUser.role === 'CONSULTANT') {
      return [
        { code: 'COORDINATOR', label: 'Coordinador (COORDINATOR)' },
        { code: 'MENTOR', label: 'Mentor (MENTOR)' },
        { code: 'PARTICIPANT', label: 'Participante (PARTICIPANT)' }
      ];
    }
    if (currentUser.role === 'COORDINATOR') {
      return [
        { code: 'PARTICIPANT', label: 'Participante (PARTICIPANT)' },
        { code: 'MENTOR', label: 'Mentor (MENTOR)' }
      ];
    }
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
      setSuccessMsg(`Usuario ${res.user.name} (${res.user.role}) registrado exitosamente.`);
      setNewUserName('');
      setNewUserEmail('');
      loadData();
    } else {
      setErrorMsg(res.error || 'Error al crear el usuario.');
    }
  };

  // Manejo de Selección para Editar Empresa
  const handleSelectOrgForEdit = (org: any) => {
    clearAlerts();
    setEditingOrg(org);
    setNewBusinessName(org.businessName || '');
    setNewCommercialName(org.commercialName || '');
    setNewTaxId(org.taxId || '');
    setNewIndustry(org.industrySector || 'Automotriz');
    setNewOrgConsultantId(org.consultantId || (consultantsList[0]?.id || 'usr-004-kasuga'));
  };

  const handleCancelOrgEdit = () => {
    setEditingOrg(null);
    setNewBusinessName('');
    setNewCommercialName('');
    setNewTaxId('');
    setNewIndustry('Industrial y Manufactura');
    setNewOrgConsultantId(consultantsList[0]?.id || 'usr-004-kasuga');
    clearAlerts();
  };

  const handleCreateOrUpdateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const selectedConsultant = consultantsList.find((c) => c.id === newOrgConsultantId) || { name: 'Carlos Kasuga' };

    if (editingOrg) {
      const res = StorageService.updateOrganization(currentUser, editingOrg.id, {
        businessName: newBusinessName,
        commercialName: newCommercialName,
        taxId: newTaxId,
        industrySector: newIndustry,
        consultantId: newOrgConsultantId,
        consultantName: selectedConsultant.name
      });

      if (res.success && res.organization) {
        setSuccessMsg(`Empresa '${res.organization.commercialName}' (${res.organization.id}) actualizada exitosamente.`);
        handleCancelOrgEdit();
        loadData();
      } else {
        setErrorMsg(res.error || 'Error al actualizar la empresa.');
      }
    } else {
      const res = StorageService.createOrganization(currentUser, {
        businessName: newBusinessName,
        commercialName: newCommercialName,
        taxId: newTaxId,
        industrySector: newIndustry,
        consultantId: newOrgConsultantId,
        consultantName: selectedConsultant.name
      });

      if (res.success && res.organization) {
        setSuccessMsg(`Empresa ${res.organization.commercialName} (${res.organization.id}) creada y asignada a ${selectedConsultant.name} exitosamente.`);
        setNewBusinessName('');
        setNewCommercialName('');
        setNewTaxId('');
        loadData();
      } else {
        setErrorMsg(res.error || 'Error al crear la organización.');
      }
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
      setSuccessMsg(`Departamento '${res.department.name}' agregado al catálogo de ${res.department.organizationId}.`);
      setNewDeptName('');
      loadData();
    } else {
      setErrorMsg(res.error || 'Error al crear el departamento.');
    }
  };

  // Manejo de Selección para Editar Directriz
  const handleSelectGuidelineForEdit = (g: any) => {
    clearAlerts();
    setEditingGuideline(g);
    setNewGuidelineCode(g.code);
    setNewGuidelineLetter(g.letter);
    setNewGuidelineName(g.name);
    setNewGuidelineDesc(g.description || '');
    setNewGuidelineOrg(g.tenantId || 'ORG-A');
  };

  const handleCancelGuidelineEdit = () => {
    setEditingGuideline(null);
    setNewGuidelineCode('');
    setNewGuidelineLetter('');
    setNewGuidelineName('');
    setNewGuidelineDesc('');
    setNewGuidelineOrg(currentUser.tenantId !== 'ORG-GLOBAL' ? currentUser.tenantId : (orgsList[0]?.id || 'ORG-A'));
    clearAlerts();
  };

  const handleCreateOrUpdateGuideline = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (editingGuideline) {
      const res = StorageService.updateGuideline(currentUser, editingGuideline.code, {
        name: newGuidelineName,
        letter: newGuidelineLetter,
        description: newGuidelineDesc,
        tenantId: newGuidelineOrg
      });

      if (res.success && res.guideline) {
        setSuccessMsg(`Directriz '${res.guideline.name}' (${res.guideline.code}) actualizada exitosamente.`);
        handleCancelGuidelineEdit();
        loadData();
      } else {
        setErrorMsg(res.error || 'Error al actualizar la directriz.');
      }
    } else {
      const res = StorageService.createGuideline(currentUser, {
        code: newGuidelineCode,
        letter: newGuidelineLetter,
        name: newGuidelineName,
        description: newGuidelineDesc,
        tenantId: newGuidelineOrg
      });

      if (res.success && res.guideline) {
        setSuccessMsg(`Directriz '${res.guideline.name}' (${res.guideline.code}) registrada para ${getOrgCommercialName(res.guideline.tenantId)} exitosamente.`);
        setNewGuidelineCode('');
        setNewGuidelineLetter('');
        setNewGuidelineName('');
        setNewGuidelineDesc('');
        loadData();
      } else {
        setErrorMsg(res.error || 'Error al registrar la directriz.');
      }
    }
  };

  const canManageGuidelines = currentUser.role === 'TECH_ADMIN' || currentUser.role === 'CONSULTANT';

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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--kiz-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
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
            Directorio de Usuarios ({visibleUsers.length})
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
              Empresas Clientes ({orgsList.length})
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
            Departamentos ({deptsList.length})
          </button>

          <button
            onClick={() => { setActiveTab('guidelines'); clearAlerts(); }}
            className="kiz-btn kiz-btn-sm"
            style={{
              backgroundColor: activeTab === 'guidelines' ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
              color: activeTab === 'guidelines' ? '#ffffff' : 'var(--kiz-text)',
              border: '1px solid var(--kiz-border)'
            }}
          >
            Directrices QCDSM ({guidelinesList.length})
          </button>

          <button
            onClick={() => { setActiveTab('roles'); clearAlerts(); }}
            className="kiz-btn kiz-btn-sm"
            style={{
              backgroundColor: activeTab === 'roles' ? 'var(--kiz-primary)' : 'var(--kiz-surface-subtle)',
              color: activeTab === 'roles' ? '#ffffff' : 'var(--kiz-text)',
              border: '1px solid var(--kiz-border)'
            }}
          >
            Roles y Permisos ({AdminEngine.ROLES_CATALOG.length})
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="kiz-alert kiz-alert-success" role="alert">
          <span style={{ fontWeight: 700 }}>Éxito:</span>
          <div>{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="kiz-alert kiz-alert-danger" role="alert">
          <span style={{ fontWeight: 700 }}>Alerta:</span>
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
                {currentUser.role === 'TECH_ADMIN' && 'Como Administrador Técnico, aprovisionas usuarios corporativos asignando su rol y empresa.'}
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
                      onChange={(e) => {
                        const nextRole = e.target.value as UserRole;
                        setNewUserRole(nextRole);
                        if ((nextRole === 'PARTICIPANT' || nextRole === 'MENTOR' || nextRole === 'COORDINATOR') && newUserOrg === 'ORG-GLOBAL') {
                          setNewUserOrg(orgsList[0]?.id || 'ORG-A');
                        } else if (nextRole === 'CONSULTANT' && currentUser.role === 'TECH_ADMIN') {
                          setNewUserOrg('ORG-GLOBAL');
                        }
                      }}
                      className="kiz-select"
                    >
                      {allowedRoles.map((r) => (
                        <option key={r.code} value={r.code}>{r.label}</option>
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
                        {(newUserRole === 'CONSULTANT' || newUserRole === 'TECH_ADMIN') && (
                          <option value="ORG-GLOBAL">Kizukai Global (Consultoría)</option>
                        )}
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
                  Dar de Alta Usuario
                </button>
              </form>
            </div>
          ) : (
            <div className="kiz-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--kiz-text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
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
              {visibleUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--kiz-radius)',
                      border: isCurrent ? '1.5px solid var(--kiz-accent)' : '1px solid var(--kiz-border-subtle)',
                      backgroundColor: isCurrent ? '#fef2f2' : 'var(--kiz-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        backgroundColor: 'var(--kiz-primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: isCurrent ? '2px solid var(--kiz-accent)' : '1px solid var(--kiz-border)'
                      }}>
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          u.avatarInitials
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{u.name}</strong>
                          {isCurrent && (
                            <span style={{ fontSize: '0.62rem', backgroundColor: 'var(--kiz-accent)', color: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                              Tú
                            </span>
                          )}
                          <span className={`role-badge role-${u.role}`} style={{ fontSize: '0.65rem' }}>
                            {u.role}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)', marginTop: '0.15rem' }}>
                          {u.email}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)' }}>
                          {u.tenantName} &middot; {u.department || 'General'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isCurrent && onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={onOpenProfileModal}
                          className="kiz-btn kiz-btn-outline kiz-btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', fontWeight: 700 }}
                        >
                          Editar Mi Foto
                        </button>
                      )}
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 4, backgroundColor: u.requiresMfa ? '#ecfdf5' : '#f1f5f9', color: u.requiresMfa ? '#065f46' : '#64748b', fontWeight: 600 }}>
                        {u.requiresMfa ? 'MFA Activo' : 'Básico'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE EMPRESAS (TECH_ADMIN) */}
      {activeTab === 'organizations' && canCreateOrgs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          <div className="kiz-card" style={{ height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
              <h2 style={{ fontSize: '1.05rem', color: editingOrg ? 'var(--kiz-accent)' : 'var(--kiz-primary)', margin: 0 }}>
                {editingOrg ? `Editar Empresa: ${editingOrg.commercialName}` : '+ Registrar Nueva Empresa Cliente'}
              </h2>
              {editingOrg && (
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--kiz-accent-light)', color: 'var(--kiz-accent)', borderRadius: 4, fontWeight: 700 }}>
                  Modo Edición
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginBottom: '1rem' }}>
              {editingOrg
                ? `Actualiza la información comercial o reasigna el consultor líder para ${editingOrg.commercialName}.`
                : 'Registra un nuevo espacio corporativo multi-tenant (Tenant ID) y asigna a su consultor líder.'}
            </p>

            <form onSubmit={handleCreateOrUpdateOrganization} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                    <option value="Industrial y Manufactura">Industrial y Manufactura</option>
                  </select>
                </div>
              </div>

              {/* Selector de Consultor Asignado */}
              <div>
                <label className="kiz-label">Consultor Kizukai Asignado *</label>
                <select
                  value={newOrgConsultantId}
                  onChange={(e) => setNewOrgConsultantId(e.target.value)}
                  className="kiz-select"
                  required
                >
                  {consultantsList.length > 0 ? (
                    consultantsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))
                  ) : (
                    <option value="usr-004-kasuga">Carlos Kasuga (carlos.kasuga@kizukai.com)</option>
                  )}
                </select>
                <span style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', display: 'block', marginTop: '0.2rem' }}>
                  El consultor metodológico acompañará los comités Kaizen y la aprobación de coordinadores.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className={`kiz-btn ${editingOrg ? 'kiz-btn-accent' : 'kiz-btn-primary'}`}
                  style={{ flex: 1, fontWeight: 700 }}
                >
                  {editingOrg ? 'Guardar Cambios de Empresa' : 'Crear Espacio de Empresa (Tenant)'}
                </button>
                {editingOrg && (
                  <button
                    type="button"
                    onClick={handleCancelOrgEdit}
                    className="kiz-btn kiz-btn-outline"
                    style={{ fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="kiz-card">
            <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', marginBottom: '0.25rem' }}>
              Empresas Activas en Plataforma ({orgsList.length})
            </h2>
            <p style={{ fontSize: '0.74rem', color: 'var(--kiz-text-muted)', marginBottom: '0.75rem' }}>
              Haz clic en cualquier empresa para cargar sus datos y editarlos en el formulario.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {orgsList.map((org) => {
                const isEditingThis = editingOrg?.id === org.id;
                return (
                  <div
                    key={org.id}
                    onClick={() => handleSelectOrgForEdit(org)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectOrgForEdit(org); }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--kiz-radius)',
                      border: isEditingThis ? '2px solid var(--kiz-accent)' : '1px solid var(--kiz-border)',
                      backgroundColor: isEditingThis ? '#fef2f2' : 'var(--kiz-surface-subtle)',
                      cursor: 'pointer',
                      transition: 'var(--kiz-transition)',
                      boxShadow: isEditingThis ? 'var(--kiz-shadow-md)' : 'none'
                    }}
                    title="Haz clic para editar esta empresa"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--kiz-text)' }}>{org.commercialName}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.67rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 4,
                          backgroundColor: isEditingThis ? 'var(--kiz-accent)' : 'var(--kiz-surface-muted)',
                          color: isEditingThis ? '#ffffff' : 'var(--kiz-text-muted)',
                          fontWeight: 700
                        }}>
                          {isEditingThis ? 'Editando' : 'Clic para editar'}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--kiz-font-mono)', fontWeight: 700, backgroundColor: 'var(--kiz-primary-light)', color: 'var(--kiz-primary)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                          {org.id}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginTop: '0.2rem' }}>
                      {org.businessName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', marginTop: '0.25rem' }}>
                      Sector: <strong>{org.industrySector}</strong> &middot; RFC: {org.taxId}
                    </div>
                    <div style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.45rem',
                      borderTop: '1px dashed var(--kiz-border-subtle)',
                      fontSize: '0.73rem',
                      color: 'var(--kiz-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      flexWrap: 'wrap'
                    }}>
                      <span>Consultor Asignado:</span>
                      <span style={{ backgroundColor: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: 4, border: '1px solid var(--kiz-border-subtle)', color: 'var(--kiz-text)', fontWeight: 700 }}>
                        {getConsultantDisplayName(org)}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                  Guardar en Catálogo
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
                      {d.organizationId} &middot; {d.branchOffice || 'Planta Principal'}
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

      {/* TAB 4: CATÁLOGO DE DIRECTRICES ESTRATÉGICAS (QCDSM) */}
      {activeTab === 'guidelines' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          {canManageGuidelines && (
            <div className="kiz-card" style={{ height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <h2 style={{ fontSize: '1.05rem', color: editingGuideline ? 'var(--kiz-accent)' : 'var(--kiz-primary)', margin: 0 }}>
                  {editingGuideline ? `Editar Directriz: ${editingGuideline.name}` : '+ Agregar Directriz Estratégica'}
                </h2>
                {editingGuideline && (
                  <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--kiz-accent-light)', color: 'var(--kiz-accent)', borderRadius: 4, fontWeight: 700 }}>
                    Modo Edición
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-muted)', marginBottom: '1rem' }}>
                {editingGuideline
                  ? `Modifica los parámetros de la directriz o reasocia la empresa a la que pertenece.`
                  : 'Directrices corporativas para clasificar iniciativas Kaizen K0-K3 asociadas a cada empresa.'}
              </p>

              <form onSubmit={handleCreateOrUpdateGuideline} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Selector de Empresa para vincular la directriz */}
                <div>
                  <label className="kiz-label">Empresa Cliente Relacionada *</label>
                  <select
                    value={newGuidelineOrg}
                    onChange={(e) => setNewGuidelineOrg(e.target.value)}
                    className="kiz-select"
                    required
                  >
                    {orgsList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.commercialName} ({o.id})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', display: 'block', marginTop: '0.2rem' }}>
                    Esta directriz estratégica quedará asociada exclusivamente a esta empresa.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                  <div>
                    <label className="kiz-label">Código *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. MEDIO_AMBIENTE"
                      value={newGuidelineCode}
                      onChange={(e) => setNewGuidelineCode(e.target.value)}
                      className="kiz-input"
                      style={{
                        textTransform: 'uppercase',
                        backgroundColor: editingGuideline ? 'var(--kiz-surface-muted)' : '#ffffff'
                      }}
                      disabled={Boolean(editingGuideline)}
                    />
                    {editingGuideline && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--kiz-text-subtle)' }}>
                        Identificador único no modificable
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="kiz-label">Letra / Sigla *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. E (Environment)"
                      value={newGuidelineLetter}
                      onChange={(e) => setNewGuidelineLetter(e.target.value)}
                      className="kiz-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="kiz-label">Nombre Descriptivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sustentabilidad y Medio Ambiente"
                    value={newGuidelineName}
                    onChange={(e) => setNewGuidelineName(e.target.value)}
                    className="kiz-input"
                  />
                </div>

                <div>
                  <label className="kiz-label">Descripción Operativa</label>
                  <textarea
                    rows={2}
                    placeholder="Enfoque de reducción de huella de carbono, reciclaje y cero desperdicio..."
                    value={newGuidelineDesc}
                    onChange={(e) => setNewGuidelineDesc(e.target.value)}
                    className="kiz-textarea"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="kiz-btn kiz-btn-accent"
                    style={{ flex: 1, fontWeight: 700 }}
                  >
                    {editingGuideline ? 'Guardar Cambios en Directriz' : 'Guardar Directriz Estratégica'}
                  </button>
                  {editingGuideline && (
                    <button
                      type="button"
                      onClick={handleCancelGuidelineEdit}
                      className="kiz-btn kiz-btn-outline"
                      style={{ fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="kiz-card">
            {/* Cabecera con filtro por empresa */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', color: 'var(--kiz-primary)', margin: 0 }}>
                Catálogo de Directrices ({guidelinesList.filter((g) => guidelineFilterOrg === 'ALL' || (g.tenantId || 'ORG-A') === guidelineFilterOrg).length})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)', fontWeight: 600 }}>
                  Empresa:
                </label>
                <select
                  value={guidelineFilterOrg}
                  onChange={(e) => setGuidelineFilterOrg(e.target.value)}
                  className="kiz-select"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                >
                  <option value="ALL">Todas las Empresas ({guidelinesList.length})</option>
                  {orgsList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.commercialName} ({guidelinesList.filter((g) => (g.tenantId || 'ORG-A') === o.id).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--kiz-text-muted)', marginBottom: '0.75rem' }}>
              Haz clic en cualquier directriz para cargar sus datos y editarlos en el formulario.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '550px', overflowY: 'auto' }}>
              {guidelinesList
                .filter((g) => guidelineFilterOrg === 'ALL' || (g.tenantId || 'ORG-A') === guidelineFilterOrg)
                .map((g) => {
                  const isEditingThis = editingGuideline?.code === g.code && (editingGuideline?.tenantId || 'ORG-A') === (g.tenantId || 'ORG-A');
                  return (
                    <div
                      key={`${g.tenantId || 'ORG-A'}-${g.code}`}
                      onClick={() => handleSelectGuidelineForEdit(g)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectGuidelineForEdit(g); }}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--kiz-radius)',
                        border: isEditingThis ? '2px solid var(--kiz-accent)' : '1px solid var(--kiz-border)',
                        backgroundColor: isEditingThis ? '#fef2f2' : 'var(--kiz-surface-subtle)',
                        cursor: 'pointer',
                        transition: 'var(--kiz-transition)',
                        boxShadow: isEditingThis ? 'var(--kiz-shadow-md)' : 'none'
                      }}
                      title="Haz clic para editar esta directriz"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: isEditingThis ? 'var(--kiz-accent)' : 'var(--kiz-primary)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            {g.letter}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--kiz-text)' }}>{g.name}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{
                            fontSize: '0.67rem',
                            padding: '0.12rem 0.45rem',
                            borderRadius: 4,
                            backgroundColor: 'var(--kiz-primary-light)',
                            color: 'var(--kiz-primary)',
                            fontWeight: 700
                          }}>
                            {getOrgCommercialName(g.tenantId || 'ORG-A')}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontFamily: 'var(--kiz-font-mono)',
                            backgroundColor: 'var(--kiz-surface-muted)',
                            padding: '0.12rem 0.4rem',
                            borderRadius: 4,
                            fontWeight: 700,
                            color: 'var(--kiz-primary)'
                          }}>
                            {g.code}
                          </span>
                        </div>
                      </div>
                      {g.description && (
                        <p style={{ fontSize: '0.74rem', color: 'var(--kiz-text-muted)', marginTop: '0.35rem', marginBottom: '0.25rem' }}>
                          {g.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                        <span style={{
                          fontSize: '0.67rem',
                          color: isEditingThis ? 'var(--kiz-accent)' : 'var(--kiz-text-subtle)',
                          fontWeight: 700
                        }}>
                          {isEditingThis ? 'Editando actualmente' : 'Clic para editar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CATÁLOGO DE ROLES DEL SISTEMA Y MATRIZ DE PERMISOS */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header del Catálogo */}
          <div className="kiz-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: 'var(--kiz-primary)', margin: 0 }}>
                  Catálogo Maestro de Roles y Matriz de Permisos RBAC
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--kiz-text-muted)', margin: '0.25rem 0 0' }}>
                  Estructura oficial de perfiles de usuario, niveles de acceso y facultades metodológicas según el marco Kizukai Kaizen.
                </p>
              </div>
              {canCreateUsers && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('users'); clearAlerts(); }}
                  className="kiz-btn kiz-btn-primary kiz-btn-sm"
                  style={{ fontSize: '0.78rem', fontWeight: 700 }}
                >
                  + Dar de Alta Nuevo Usuario
                </button>
              )}
            </div>
          </div>

          {/* Grilla de Roles del Catálogo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
            {AdminEngine.ROLES_CATALOG.map((roleEntry) => {
              const usersWithThisRole = usersList.filter((u) => u.role === roleEntry.code);
              const isCreatableByActor = allowedRoles.some((ar) => ar.code === roleEntry.code);

              return (
                <div
                  key={roleEntry.code}
                  className="kiz-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: '1px solid var(--kiz-border)',
                    boxShadow: 'var(--kiz-shadow-xs)'
                  }}
                >
                  <div>
                    {/* Header de la tarjeta del rol */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', gap: '0.5rem' }}>
                      <div>
                        <span className={`role-badge role-${roleEntry.code}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                          {roleEntry.code}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', color: 'var(--kiz-text)', marginTop: '0.35rem', marginBottom: '0.15rem' }}>
                          {roleEntry.name}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)', fontWeight: 600 }}>
                          Alcance: {roleEntry.scope}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--kiz-font-mono)',
                        fontWeight: 700,
                        backgroundColor: 'var(--kiz-surface-subtle)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--kiz-radius-full)',
                        color: 'var(--kiz-primary)',
                        whiteSpace: 'nowrap'
                      }}>
                        {usersWithThisRole.length} usuarios
                      </span>
                    </div>

                    {/* Descripción */}
                    <p style={{ fontSize: '0.78rem', color: 'var(--kiz-text-muted)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                      {roleEntry.description}
                    </p>

                    {/* Permisos agrupados */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--kiz-primary)', marginBottom: '0.4rem' }}>
                        Permisos y Capacidades Otorgadas:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {roleEntry.permissions.map((permGroup, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              backgroundColor: 'var(--kiz-surface-subtle)',
                              padding: '0.5rem 0.65rem',
                              borderRadius: 'var(--kiz-radius-sm)',
                              border: '1px solid var(--kiz-border-subtle)'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--kiz-text)', marginBottom: '0.25rem' }}>
                              {permGroup.category}
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--kiz-text-muted)', lineHeight: 1.4 }}>
                              {permGroup.items.map((item, iIdx) => (
                                <li key={iIdx} style={{ marginBottom: '0.15rem' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Responsabilidades clave */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--kiz-text-subtle)', marginBottom: '0.35rem' }}>
                        Responsabilidades Metodológicas:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--kiz-text-muted)', lineHeight: 1.4 }}>
                        {roleEntry.keyResponsibilities.map((resp, rIdx) => (
                          <li key={rIdx} style={{ marginBottom: '0.15rem' }}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón de acción rápida: Asignar este rol al registrar usuario */}
                  {canCreateUsers && isCreatableByActor && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewUserRole(roleEntry.code);
                        if ((roleEntry.code === 'PARTICIPANT' || roleEntry.code === 'MENTOR' || roleEntry.code === 'COORDINATOR') && newUserOrg === 'ORG-GLOBAL') {
                          setNewUserOrg(orgsList[0]?.id || 'ORG-A');
                        } else if (roleEntry.code === 'CONSULTANT' && currentUser.role === 'TECH_ADMIN') {
                          setNewUserOrg('ORG-GLOBAL');
                        }
                        setActiveTab('users');
                        clearAlerts();
                      }}
                      className="kiz-btn kiz-btn-outline kiz-btn-sm"
                      style={{ width: '100%', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Asignar este rol al registrar usuario &rarr;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
