import React, { useState } from 'react';
import { User, DemoProfile } from '../types/index.ts';
import { DEMO_PROFILES, DEMO_USERS } from '../data/seedData.ts';
import { StorageService } from '../services/storageService.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('ana.coord@empresa.com');
  const [password, setPassword] = useState('kizukai2026');
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    // Verificación especial para cuenta de Super Admin
    if (cleanEmail === 'mangoex@gmail.com') {
      if (password === '531698Pa' || password === 'kizukai2026') {
        const superAdminUser = DEMO_USERS.super_admin;
        StorageService.logAudit({
          entity: 'users',
          entityId: superAdminUser.id,
          action: 'SUPER_ADMIN_LOGIN_SUCCESS',
          performedBy: superAdminUser.email,
          tenantId: superAdminUser.tenantId,
          payloadSnapshot: { method: 'SUPER_ADMIN_PASSWORD', role: superAdminUser.role }
        });
        onLoginSuccess(superAdminUser);
        onClose();
        return;
      } else {
        setErrorMessage('Contraseña incorrecta para la cuenta Super Admin.');
        return;
      }
    }

    // Busca usuario demo por email
    const foundProfile = DEMO_PROFILES.find(
      (p) => p.user.email.toLowerCase() === cleanEmail
    );

    if (!foundProfile) {
      setErrorMessage('Credenciales no válidas. Puedes seleccionar uno de los perfiles demo de acceso rápido.');
      return;
    }

    if (foundProfile.user.requiresMfa) {
      setPendingUser(foundProfile.user);
      setMfaStep(true);
      setMfaCode('');
    } else {
      StorageService.logAudit({
        entity: 'users',
        entityId: foundProfile.user.id,
        action: 'USER_LOGIN_SUCCESS',
        performedBy: foundProfile.user.email,
        tenantId: foundProfile.user.tenantId,
        payloadSnapshot: { method: 'STANDARD_PASSWORD', role: foundProfile.user.role }
      });
      onLoginSuccess(foundProfile.user);
      onClose();
    }
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mfaCode.trim() !== '202600') {
      setErrorMessage('Código MFA incorrecto. Recuerda que el código de prueba es 202600.');
      return;
    }

    if (pendingUser) {
      StorageService.logAudit({
        entity: 'users',
        entityId: pendingUser.id,
        action: 'MFA_AUTH_SUCCESS',
        performedBy: pendingUser.email,
        tenantId: pendingUser.tenantId,
        payloadSnapshot: {
          method: 'TOTP_CHALLENGE',
          challengeCodeUsed: '202600',
          role: pendingUser.role
        }
      });
      onLoginSuccess(pendingUser);
      onClose();
    }
  };

  const handleQuickDemoSelect = (profile: DemoProfile) => {
    if (profile.requiresMfa) {
      setEmail(profile.user.email);
      setPendingUser(profile.user);
      setMfaStep(true);
      setMfaCode('202600'); // Pre-llenado opcional para máxima fluidez demo
      setErrorMessage('');
    } else {
      StorageService.logAudit({
        entity: 'users',
        entityId: profile.user.id,
        action: 'DEMO_QUICK_LOGIN',
        performedBy: profile.user.email,
        tenantId: profile.user.tenantId,
        payloadSnapshot: { profileTag: profile.tag, role: profile.user.role }
      });
      onLoginSuccess(profile.user);
      onClose();
    }
  };

  return (
    <div className="kiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="kiz-modal" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="kiz-modal-header" style={{ backgroundColor: 'var(--kiz-primary)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <div>
              <h2 id="login-modal-title" style={{ color: '#ffffff', fontSize: '1.15rem' }}>
                {mfaStep ? 'Desafío de Seguridad MFA (6 Dígitos)' : 'Control de Acceso Multi-Tenant Kizukai'}
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Autenticación RBAC, Segregación de Funciones y Gobernanza Gemba Kaizen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            style={{ color: '#ffffff', fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
            aria-label="Cerrar modal de autenticación"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="kiz-modal-body">
          {errorMessage && (
            <div className="kiz-alert kiz-alert-danger" role="alert">
              <span>⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          {!mfaStep ? (
            <div>
              {/* Formulario Estándar */}
              <form onSubmit={handleStandardLogin} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="login-email" className="kiz-label">
                    Correo Electrónico Corporativo
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="kiz-input"
                    placeholder="ejemplo@empresa.com"
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="login-password" className="kiz-label">
                    Contraseña
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="kiz-input"
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" className="kiz-btn kiz-btn-primary" style={{ width: '100%' }}>
                  Ingresar a la Plataforma
                </button>
              </form>

              {/* Selector de Acceso Rápido Demo (1 Clic) */}
              <div style={{
                borderTop: '1px solid var(--kiz-border)',
                paddingTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--kiz-text-muted)' }}>
                    🎯 Perfiles Demo Multi-Tenant (Acceso Directo con 1 Clic):
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--kiz-accent)', fontWeight: 600 }}>
                    7 Roles Preconfigurados
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
                  {DEMO_PROFILES.map((p) => (
                    <button
                      key={p.user.email}
                      type="button"
                      onClick={() => handleQuickDemoSelect(p)}
                      style={{
                        textAlign: 'left',
                        padding: '0.65rem 0.75rem',
                        border: '1px solid var(--kiz-border)',
                        borderRadius: 'var(--kiz-radius)',
                        backgroundColor: 'var(--kiz-surface-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--kiz-primary)';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--kiz-border)';
                        e.currentTarget.style.backgroundColor = 'var(--kiz-surface-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--kiz-text)' }}>
                          {p.user.name}
                        </span>
                        {p.requiresMfa && (
                          <span style={{
                            fontSize: '0.62rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 'var(--kiz-radius-xs)',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 700
                          }}>
                            MFA Req.
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-muted)' }}>
                        {p.tag}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)', fontFamily: 'var(--kiz-font-mono)' }}>
                        {p.user.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Pantalla del Desafío MFA */
            <form onSubmit={handleVerifyMfa}>
              <div className="kiz-alert kiz-alert-warning" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Autenticación de Dos Factores Obligatoria</strong> para roles de Coordinación, Consultoría y Administración Técnica.
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '1.25rem',
                backgroundColor: 'var(--kiz-surface-subtle)',
                borderRadius: 'var(--kiz-radius-lg)',
                border: '1px dashed var(--kiz-border)',
                marginBottom: '1.25rem'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--kiz-text-muted)', marginBottom: '0.5rem' }}>
                  Ingresa el código TOTP de 6 dígitos para la cuenta:
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--kiz-primary)', marginBottom: '0.75rem' }}>
                  {pendingUser?.name} ({pendingUser?.email})
                </div>

                {/* Badge con código demo visible */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: 'var(--kiz-radius-full)',
                  color: '#92400e',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '1rem'
                }}>
                  <span>🔑 Código MFA Demo para Evaluación:</span>
                  <strong style={{ fontFamily: 'var(--kiz-font-mono)', fontSize: '0.95rem', letterSpacing: '0.1em' }}>
                    202600
                  </strong>
                </div>

                <div style={{ maxWidth: 240, margin: '0 auto' }}>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="kiz-input"
                    style={{
                      textAlign: 'center',
                      fontFamily: 'var(--kiz-font-mono)',
                      fontSize: '1.6rem',
                      letterSpacing: '0.35em',
                      fontWeight: 700,
                      padding: '0.5rem'
                    }}
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMfaStep(false);
                    setPendingUser(null);
                  }}
                  className="kiz-btn kiz-btn-secondary"
                >
                  Volver
                </button>
                <button type="submit" className="kiz-btn kiz-btn-primary">
                  Verificar y Continuar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
