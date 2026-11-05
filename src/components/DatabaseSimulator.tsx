import React, { useState } from 'react';
import { User, AuditLog } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface DatabaseSimulatorProps {
  currentUser: User;
}

export const DatabaseSimulator: React.FC<DatabaseSimulatorProps> = ({
  currentUser
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [selectedEntity, setSelectedEntity] = useState<string>('initiatives');
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
            <h1 id="db-sim-title" style={{ fontSize: '1.35rem', color: 'var(--kiz-text)' }}>
              Consola de Base de Datos (22 Entidades) & Gobernanza Multi-Tenant
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--kiz-text-muted)' }}>
              Aislamiento estricto por <code>tenant_id</code>, inmutabilidad de <code>audit_logs</code> y verificación de segregación de funciones.
            </p>
          </div>
        </div>

        {/* Panel Interactivo de Pruebas de Seguridad en Vivo */}
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--kiz-border)',
          borderRadius: 'var(--kiz-radius)'
        }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--kiz-primary)', marginBottom: '0.5rem' }}>
            🧪 Pruebas de Intrusión y Bloqueo en Vivo (Simulador de Firewalls):
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button
              onClick={handleTestCrossTenantAttack}
              className="kiz-btn kiz-btn-danger kiz-btn-sm"
              title="Prueba el bloqueo de una petición de ORG-A hacia un UUID perteneciente a ORG-B"
            >
              Simular Ataque Cross-Tenant (ORG-A &rarr; ORG-B UUID)
            </button>

            <button
              onClick={handleTestTechAdminSegregation}
              className="kiz-btn kiz-btn-secondary kiz-btn-sm"
              title="Prueba el bloqueo a TECH_ADMIN sobre contenido de negocio"
            >
              Simular Intento de Lectura Funcional por TECH_ADMIN
            </button>

            <button
              onClick={handleRefreshLogs}
              className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            >
              ↺ Recargar Bitácora
            </button>
          </div>

          {/* Resultado de la Prueba de Seguridad */}
          {securityTestResult.status === 'BLOCKED_403' && (
            <div className="kiz-alert kiz-alert-danger" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: '1.25rem' }}>⛔</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.9rem' }}>{securityTestResult.message}</strong>
                <pre style={{
                  marginTop: '0.4rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--kiz-font-mono)',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  padding: '0.5rem',
                  borderRadius: 4,
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(securityTestResult.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla: Explorador de las 22 Entidades + Visor de Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '1.25rem' }}>
        {/* Columna Izquierda: Las 22 Entidades del PRD */}
        <div className="kiz-card" style={{ padding: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--kiz-border-subtle)',
            paddingBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--kiz-primary)' }}>
              Catálogo de las 22 Entidades del PRD
            </h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--kiz-text-subtle)' }}>
              22 Tablas Activas
            </span>
          </div>

          <div style={{ maxHeight: '650px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--kiz-text-subtle)' }}>
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
        <div className="kiz-card" style={{ padding: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--kiz-border-subtle)',
            paddingBottom: '0.5rem'
          }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--kiz-primary)' }}>
                Bitácora Inmutable de Auditoría (`audit_logs`)
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--kiz-text-subtle)' }}>
                Registro append-only con snapshots JSON y eventos de seguridad
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

          <div style={{ maxHeight: '650px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {auditLogs.map((log) => {
              const isSecurityAlert =
                log.action.includes('DENIED') || log.action.includes('BLOCKED');
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--kiz-radius)',
                    border: isSecurityAlert ? '1px solid #fca5a5' : '1px solid var(--kiz-border)',
                    backgroundColor: isSecurityAlert ? '#fff1f2' : 'var(--kiz-surface-subtle)',
                    borderLeft: isSecurityAlert ? '4px solid #b91c1c' : '4px solid var(--kiz-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--kiz-font-mono)',
                      fontWeight: 700,
                      color: isSecurityAlert ? '#b91c1c' : 'var(--kiz-primary)'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--kiz-font-mono)', color: 'var(--kiz-text-subtle)' }}>
                      {log.timestamp.replace('T', ' ').split('.')[0]} UTC
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)', marginBottom: '0.35rem' }}>
                    Actor: <strong>{log.performedBy}</strong> &middot; Tenant: <strong>{log.tenantId}</strong> &middot; Entidad: <code>{log.entity} ({log.entityId})</code>
                  </div>

                  {log.payloadSnapshot && (
                    <details style={{ marginTop: '0.25rem' }}>
                      <summary style={{ fontSize: '0.68rem', color: 'var(--kiz-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Ver Snapshot JSON del Payload
                      </summary>
                      <pre style={{
                        marginTop: '0.35rem',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--kiz-font-mono)',
                        backgroundColor: '#ffffff',
                        padding: '0.5rem',
                        borderRadius: 4,
                        border: '1px solid var(--kiz-border-subtle)',
                        overflowX: 'auto'
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
