import React, { useState } from 'react';
import { User, AuditLog } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface DatabaseSimulatorProps {
  currentUser: User;
}

export const DatabaseSimulator: React.FC<DatabaseSimulatorProps> = ({
  currentUser: _currentUser
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [selectedEntity, setSelectedEntity] = useState<string>('initiatives');
  const [activeMobileView, setActiveMobileView] = useState<'ENTITIES' | 'AUDIT_LOGS'>('ENTITIES');
  const [securityTestResult, setSecurityTestResult] = useState<{
    status: 'IDLE' | 'SUCCESS' | 'BLOCKED_403';
    message: string;
    details?: any;
  }>({ status: 'IDLE', message: '' });

  const entities = StorageService.getDatabaseEntitiesSummary();

  const handleRefreshLogs = () => {
    setAuditLogs(StorageService.getAuditLogs());
  };

  // Simulación de ataque Cross-Tenant
  const handleTestCrossTenantAttack = () => {
    // Forzamos intento de acceso cruzado: un usuario de ORG-A intenta consultar la iniciativa init-011-org-b-activa (de ORG-B)
    const simulatedAttacker: User = {
      id: 'attacker-usr-01',
      name: 'Usuario ORG-A (Simulado)',
      email: 'operador.a@empresa-norte.com',
      role: 'PARTICIPANT',
      tenantId: 'ORG-A',
      tenantName: 'Manufactura Eléctrica del Norte',
      requiresMfa: false,
      avatarInitials: 'UA'
    };

    const targetIdFromOrgB = 'init-011-org-b-activa';
    const result = StorageService.getInitiativeByIdSecure(targetIdFromOrgB, simulatedAttacker);

    if (result.errorCode === '403_CROSS_TENANT_VIOLATION') {
      setSecurityTestResult({
        status: 'BLOCKED_403',
        message: '¡BLOQUEO 403 EXITOSO! El firewall de datos multi-tenant interceptó y rechazó el acceso cruzado.',
        details: {
          exception: 'CrossTenantAccessDeniedException',
          errorCode: result.errorCode,
          errorString: result.error,
          attackerTenant: 'ORG-A',
          resourceTenant: 'ORG-B',
          actionLogged: 'CROSS_TENANT_ACCESS_DENIED'
        }
      });
      handleRefreshLogs();
    } else {
      setSecurityTestResult({
        status: 'SUCCESS',
        message: 'Acceso concedido (Inesperado si era ataque cruzado).'
      });
    }
  };

  // Simulación de bloqueo a Administrador Técnico
  const handleTestTechAdminSegregation = () => {
    const techAdminUser: User = {
      id: 'sysadmin-test',
      name: 'SysAdmin David (TECH_ADMIN)',
      email: 'admin.tech@kizukai.com',
      role: 'TECH_ADMIN',
      tenantId: 'ORG-A',
      tenantName: 'Kizukai Platform Infrastructure',
      requiresMfa: true,
      avatarInitials: 'DA'
    };

    const targetId = 'init-001-devuelta';
    const result = StorageService.getInitiativeByIdSecure(targetId, techAdminUser);

    if (result.errorCode === '403_TECH_ADMIN_BLOCKED') {
      setSecurityTestResult({
        status: 'BLOCKED_403',
        message: '¡SEGREGACIÓN RBAC CONFIRMADA! El Administrador Técnico tiene bloqueada la lectura de iniciativas.',
        details: {
          exception: 'TechAdminFunctionalContentBlockedException',
          errorCode: result.errorCode,
          errorString: result.error,
          role: 'TECH_ADMIN',
          actionLogged: 'TECH_ADMIN_ACCESS_BLOCKED'
        }
      });
      handleRefreshLogs();
    }
  };

  return (
    <section aria-labelledby="db-sim-title" style={{ marginBottom: '2.5rem' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--kiz-border)',
        borderRadius: 'var(--kiz-radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--kiz-shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <h1 id="db-sim-title" style={{ fontSize: '1.35rem', color: 'var(--kiz-text)', margin: 0 }}>
              Consola de Base de Datos (22 Entidades) &amp; Gobernanza Multi-Tenant
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-muted)', margin: 0 }}>
              Aislamiento estricto por <code>tenant_id</code>, inmutabilidad de <code>audit_logs</code> y verificación de segregación de funciones.
            </p>
          </div>
        </div>

        {/* Panel Interactivo de Pruebas de Seguridad en Vivo */}
        <div style={{
          marginTop: '1rem',
          padding: '0.85rem',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--kiz-border)',
          borderRadius: 'var(--kiz-radius)'
        }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
            🧪 Pruebas de Intrusión y Bloqueo en Vivo (Simulador de Firewalls):
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <button
              onClick={handleTestCrossTenantAttack}
              className="kiz-btn kiz-btn-danger kiz-btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
              title="Prueba el bloqueo de una petición de ORG-A hacia un UUID perteneciente a ORG-B"
            >
              Simular Ataque Cross-Tenant (ORG-A &rarr; ORG-B)
            </button>

            <button
              onClick={handleTestTechAdminSegregation}
              className="kiz-btn kiz-btn-secondary kiz-btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
              title="Prueba el bloqueo a TECH_ADMIN sobre contenido de negocio"
            >
              Simular Bloqueo TECH_ADMIN
            </button>

            <button
              onClick={handleRefreshLogs}
              className="kiz-btn kiz-btn-ghost kiz-btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
            >
              ↺ Recargar Bitácora
            </button>
          </div>

          {/* Resultado de la Prueba de Seguridad */}
          {securityTestResult.status === 'BLOCKED_403' && (
            <div className="kiz-alert kiz-alert-danger" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⛔</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '0.85rem' }}>{securityTestResult.message}</strong>
                <pre style={{
                  marginTop: '0.4rem',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--kiz-font-mono)',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  padding: '0.5rem',
                  borderRadius: 4,
                  overflowX: 'auto',
                  maxHeight: '180px'
                }}>
                  {JSON.stringify(securityTestResult.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECTOR RÁPIDO PARA PANTALLAS PEQUEÑAS / MÓVILES (< 768px) */}
      <div className="kiz-show-on-mobile" style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          backgroundColor: 'var(--kiz-surface-subtle)',
          padding: '0.35rem',
          borderRadius: 'var(--kiz-radius)',
          border: '1px solid var(--kiz-border)'
        }}>
          <button
            onClick={() => setActiveMobileView('ENTITIES')}
            className="kiz-btn"
            style={{
              backgroundColor: activeMobileView === 'ENTITIES' ? 'var(--kiz-primary)' : 'transparent',
              color: activeMobileView === 'ENTITIES' ? '#ffffff' : 'var(--kiz-text)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.5rem',
              borderRadius: 'var(--kiz-radius-sm)',
              boxShadow: activeMobileView === 'ENTITIES' ? 'var(--kiz-shadow-xs)' : 'none'
            }}
          >
            🗄️ 22 Entidades SQL
          </button>
          <button
            onClick={() => setActiveMobileView('AUDIT_LOGS')}
            className="kiz-btn"
            style={{
              backgroundColor: activeMobileView === 'AUDIT_LOGS' ? 'var(--kiz-primary)' : 'transparent',
              color: activeMobileView === 'AUDIT_LOGS' ? '#ffffff' : 'var(--kiz-text)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.5rem',
              borderRadius: 'var(--kiz-radius-sm)',
              boxShadow: activeMobileView === 'AUDIT_LOGS' ? 'var(--kiz-shadow-xs)' : 'none'
            }}
          >
            📜 Bitácora ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Grilla Adaptable: repeat(auto-fit, minmax(min(100%, 320px), 1fr)) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '1.25rem'
      }}>
        {/* Columna Izquierda: Las 22 Entidades del PRD */}
        <div
          className={`kiz-card ${activeMobileView !== 'ENTITIES' ? 'kiz-hide-on-mobile' : ''}`}
          style={{ padding: '1rem' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--kiz-border-subtle)',
            paddingBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--kiz-primary)', margin: 0 }}>
              Catálogo de 22 Entidades
            </h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--kiz-text-subtle)' }}>
              22 Tablas Activas
            </span>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {entities.map((ent) => {
              const isSelected = selectedEntity === ent.name;
              return (
                <button
                  key={ent.name}
                  onClick={() => setSelectedEntity(ent.name)}
                  style={{
                    textAlign: 'left',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: isSelected ? '1px solid var(--kiz-primary)' : '1px solid var(--kiz-border-subtle)',
                    backgroundColor: isSelected ? 'var(--kiz-surface-muted)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--kiz-text)' }}>
                      {ent.displayName}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--kiz-font-mono)',
                      backgroundColor: 'var(--kiz-primary-light)',
                      color: 'var(--kiz-primary)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 4,
                      fontWeight: 700
                    }}>
                      {ent.count} filas
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-muted)' }}>
                    {ent.description}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--kiz-text-subtle)', flexWrap: 'wrap' }}>
                    <span>PK: <code>{ent.primaryKey}</code></span>
                    <span>&middot;</span>
                    <span style={{ color: ent.tenantScoped ? 'var(--kiz-info)' : 'var(--kiz-text-subtle)' }}>
                      {ent.tenantScoped ? '🔒 Aislado por Tenant' : '🌐 Catálogo Global'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Visor de Audit Logs Inmutables */}
        <div
          className={`kiz-card ${activeMobileView !== 'AUDIT_LOGS' ? 'kiz-hide-on-mobile' : ''}`}
          style={{ padding: '1rem' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--kiz-border-subtle)',
            paddingBottom: '0.5rem'
          }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--kiz-primary)', margin: 0 }}>
                Bitácora Inmutable (`audit_logs`)
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)', margin: 0 }}>
                Append-only con snapshots JSON y alertas 403
              </p>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '0.15rem 0.5rem',
              borderRadius: 4
            }}>
              {auditLogs.length} eventos
            </span>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {auditLogs.map((log) => {
              const isSecurityAlert =
                log.action.includes('DENIED') || log.action.includes('BLOCKED');
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: isSecurityAlert ? '1px solid #fca5a5' : '1px solid var(--kiz-border)',
                    backgroundColor: isSecurityAlert ? '#fff1f2' : 'var(--kiz-surface-subtle)',
                    borderLeft: isSecurityAlert ? '4px solid #b91c1c' : '4px solid var(--kiz-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--kiz-font-mono)',
                      fontWeight: 700,
                      color: isSecurityAlert ? '#b91c1c' : 'var(--kiz-primary)'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--kiz-font-mono)', color: 'var(--kiz-text-subtle)' }}>
                      {log.timestamp.replace('T', ' ').split('.')[0]} UTC
                    </span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--kiz-text-muted)', marginBottom: '0.3rem' }}>
                    Actor: <strong>{log.performedBy}</strong> &middot; Tenant: <strong>{log.tenantId}</strong> &middot; Entidad: <code>{log.entity}</code>
                  </div>

                  {log.payloadSnapshot && (
                    <details style={{ marginTop: '0.2rem' }}>
                      <summary style={{ fontSize: '0.68rem', color: 'var(--kiz-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Ver Snapshot JSON
                      </summary>
                      <pre style={{
                        marginTop: '0.3rem',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--kiz-font-mono)',
                        backgroundColor: '#ffffff',
                        padding: '0.45rem',
                        borderRadius: 4,
                        border: '1px solid var(--kiz-border-subtle)',
                        overflowX: 'auto',
                        maxHeight: '160px'
                      }}>
                        {JSON.stringify(log.payloadSnapshot, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
