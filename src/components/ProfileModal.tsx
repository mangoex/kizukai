import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserUpdated,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser.avatarUrl);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Solo se permiten archivos de imagen (PNG, JPG, WebP, etc.).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'La imagen excede el límite recomendado de 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarPreview(base64);
      setStatusMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const res = StorageService.updateUserProfile(
      currentUser.id,
      {
        name,
        email,
        department,
        phoneNumber,
        jobTitle,
        avatarUrl: avatarPreview
      },
      currentUser
    );

    if (res.success && res.user) {
      setStatusMsg({ type: 'success', text: '✓ Perfil actualizado exitosamente.' });
      onUserUpdated(res.user);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Error al actualizar el perfil.' });
    }
  };

  return (
    <div className="kiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="kiz-modal" style={{ maxWidth: 540 }}>
        {/* Cabecera */}
        <div className="kiz-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <h2 id="profile-modal-title" style={{ fontSize: '1.15rem', color: 'var(--kiz-primary)', margin: 0 }}>
                Mi Perfil de Usuario
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)', margin: 0 }}>
                Actualiza tus datos de contacto y fotografía personal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            style={{ fontSize: '1.3rem', padding: '0.2rem 0.5rem' }}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="kiz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {statusMsg && (
              <div className={`kiz-alert kiz-alert-${statusMsg.type}`} role="alert" style={{ marginBottom: 0 }}>
                <span>{statusMsg.type === 'success' ? '✓' : '⚠️'}</span>
                <div>{statusMsg.text}</div>
              </div>
            )}

            {/* Subida y Avatar Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '0.85rem',
              backgroundColor: 'var(--kiz-surface-subtle)',
              borderRadius: 'var(--kiz-radius)',
              border: '1px solid var(--kiz-border)'
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'var(--kiz-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                overflow: 'hidden',
                flexShrink: 0,
                border: '3px solid #ffffff',
                boxShadow: 'var(--kiz-shadow-sm)'
              }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{currentUser.avatarInitials || 'U'}</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                <label className="kiz-label" style={{ marginBottom: 0 }}>Fotografía de Perfil</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label
                    className="kiz-btn kiz-btn-secondary kiz-btn-sm"
                    style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    📷 Subir Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="kiz-btn kiz-btn-ghost kiz-btn-sm"
                      style={{ fontSize: '0.75rem', color: 'var(--kiz-danger)' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--kiz-text-subtle)' }}>
                  PNG, JPG o WebP (Máximo 2MB)
                </span>
              </div>
            </div>

            {/* Campos de texto */}
            <div>
              <label className="kiz-label">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="kiz-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="kiz-label">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kiz-input"
                />
              </div>

              <div>
                <label className="kiz-label">Teléfono Móvil / Gemba</label>
                <input
                  type="tel"
                  placeholder="+52 81 1234 5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="kiz-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="kiz-label">Puesto / Cargo</label>
                <input
                  type="text"
                  placeholder="Ej. Líder de Ensamble Kaizen"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="kiz-input"
                />
              </div>

              <div>
                <label className="kiz-label">Departamento</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="kiz-input"
                />
              </div>
            </div>

            {/* Metadatos informativos no editables */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--kiz-surface-muted)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--kiz-radius)',
              fontSize: '0.72rem',
              color: 'var(--kiz-text-muted)'
            }}>
              <span>🏢 Organización: <strong>{currentUser.tenantName} ({currentUser.tenantId})</strong></span>
              <span className={`role-badge role-${currentUser.role}`} style={{ fontSize: '0.65rem' }}>
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="kiz-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="kiz-btn kiz-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="kiz-btn kiz-btn-primary"
              style={{ fontWeight: 700 }}
            >
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
