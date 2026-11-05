import React, { useState } from 'react';
import { StrategicGuideline, User, Initiative } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface NewInitiativeModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onInitiativeCreated: (initiative: Initiative) => void;
}

export const NewInitiativeModal: React.FC<NewInitiativeModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onInitiativeCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Ensamble y Troquelado');
  const [guideline, setGuideline] = useState<StrategicGuideline>('CALIDAD');

  // Metodología Kizukai (K0, K1, K2, K3)
  const [k0Deficient, setK0Deficient] = useState('');
  const [k1BasicFunction, setK1BasicFunction] = useState('');
  const [k2Proactivity, setK2Proactivity] = useState('');
  const [k3ExpectedImpact, setK3ExpectedImpact] = useState('');
  const [veAnnualValue, setVeAnnualValue] = useState<number>(12000);

  // Verificación Cero Inversión
  const [zeroInvestmentChecked, setZeroInvestmentChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!title.trim()) {
        setErrorMsg('El título descriptivo de la iniciativa es obligatorio.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!k0Deficient.trim() || !k1BasicFunction.trim() || !k2Proactivity.trim() || !k3ExpectedImpact.trim()) {
        setErrorMsg('Todos los campos metodológicos K0, K1, K2 y K3 son obligatorios.');
        return;
      }
      setStep(3);
    }
  };

  const handleSave = (asDraft: boolean) => {
    setErrorMsg('');

    if (!zeroInvestmentChecked && !asDraft) {
      setErrorMsg('Debes confirmar que la iniciativa cumple el principio de CERO INVERSIÓN para enviarla.');
      return;
    }

    const result = StorageService.createInitiative(currentUser, {
      title,
      department,
      guideline,
      k0_deficient: k0Deficient,
      k1_basic_function: k1BasicFunction,
      k2_proactivity: k2Proactivity,
      k3_expected_impact: k3ExpectedImpact,
      zero_investment_verified: zeroInvestmentChecked || asDraft,
      ve_annual_value: Number(veAnnualValue) || 0,
      asDraft
    });

    if (result.success && result.initiative) {
      onInitiativeCreated(result.initiative);
      onClose();
    } else {
      setErrorMsg(result.error || 'Ocurrió un error al registrar la iniciativa.');
    }
  };

  return (
    <div className="kiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-initiative-title">
      <div className="kiz-modal">
        {/* Header con Indicador de Pasos */}
        <div className="kiz-modal-header">
          <div>
            <h2 id="new-initiative-title" style={{ fontSize: '1.25rem', color: 'var(--kiz-primary)' }}>
              Registro Guiado de Iniciativa Kaizen K2
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--kiz-text-subtle)' }}>
              Metodología Kizukai: Soluciones ingeniosas sin presupuesto de capital
            </p>
          </div>
          <button
            onClick={onClose}
            className="kiz-btn kiz-btn-ghost kiz-btn-sm"
            style={{ fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* Barra de Pasos Progresivos */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--kiz-surface-subtle)',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--kiz-border-subtle)',
          gap: '1rem',
          fontSize: '0.78rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: step === 1 ? 'var(--kiz-primary)' : 'var(--kiz-text-subtle)',
            fontWeight: step === 1 ? 700 : 500
          }}>
            <span style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: step === 1 ? 'var(--kiz-primary)' : '#cbd5e1',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>1</span>
            <span>Datos Generales</span>
          </div>

          <div style={{ color: '#cbd5e1' }}>&gt;</div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: step === 2 ? 'var(--kiz-primary)' : 'var(--kiz-text-subtle)',
            fontWeight: step === 2 ? 700 : 500
          }}>
            <span style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: step === 2 ? 'var(--kiz-primary)' : '#cbd5e1',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>2</span>
            <span>Matriz K0 &ndash; K3</span>
          </div>

          <div style={{ color: '#cbd5e1' }}>&gt;</div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: step === 3 ? 'var(--kiz-primary)' : 'var(--kiz-text-subtle)',
            fontWeight: step === 3 ? 700 : 500
          }}>
            <span style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: step === 3 ? 'var(--kiz-primary)' : '#cbd5e1',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>3</span>
            <span>Cero Inversión & Envío</span>
          </div>
        </div>

        {/* Body */}
        <div className="kiz-modal-body">
          {errorMsg && (
            <div className="kiz-alert kiz-alert-danger" role="alert">
              <span>⚠️</span>
              <div>{errorMsg}</div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="init-title" className="kiz-label">
                  Título Operacional de la Iniciativa *
                </label>
                <input
                  id="init-title"
                  type="text"
                  required
                  placeholder="Ej: Dispositivo Poka-Yoke por Gravedad para Inserción de Conectores"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="kiz-input"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)' }}>
                  Debe ser descriptivo y enfocado en la contramedida física o de método en planta.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label htmlFor="init-dept" className="kiz-label">
                    Departamento de Gemba *
                  </label>
                  <select
                    id="init-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="kiz-select"
                  >
                    <option value="Ensamble y Troquelado">Ensamble y Troquelado</option>
                    <option value="Troquelado y Prensas">Troquelado y Prensas</option>
                    <option value="Mantenimiento y Servicios">Mantenimiento y Servicios</option>
                    <option value="Devanado y Bobinado">Devanado y Bobinado</option>
                    <option value="Empaque y Almacén">Empaque y Almacén</option>
                    <option value="Pintura y Acabados">Pintura y Acabados</option>
                    <option value="Línea de Envasado Aséptico">Línea de Envasado Aséptico</option>
                    <option value="Silos y Granos">Silos y Granos</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="init-guideline" className="kiz-label">
                    Directriz Estratégica (QCDSM) *
                  </label>
                  <select
                    id="init-guideline"
                    value={guideline}
                    onChange={(e) => setGuideline(e.target.value as StrategicGuideline)}
                    className="kiz-select"
                  >
                    <option value="CALIDAD">Calidad (Q) &ndash; Reducción de Defectos / Scrap</option>
                    <option value="COSTO">Costo (C) &ndash; Ahorro de Recursos / Energía</option>
                    <option value="ENTREGA">Entrega (D) &ndash; Tiempo de Ciclo / Setup SMED</option>
                    <option value="SEGURIDAD">Seguridad (S) &ndash; Cero Accidentes / Ergonomía</option>
                    <option value="MORAL">Moral (M) &ndash; Ambiente de Trabajo / 5S</option>
                  </select>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--kiz-surface-subtle)',
                padding: '0.85rem',
                borderRadius: 'var(--kiz-radius)',
                border: '1px solid var(--kiz-border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--kiz-text-muted)'
              }}>
                🏢 <strong>Organización:</strong> {currentUser.tenantName} ({currentUser.tenantId}) &middot; Proponente: <strong>{currentUser.name}</strong>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="k0-input" className="kiz-label">
                  K0: Situación Deficiente (¿Cuál es el problema y muda en Gemba?) *
                </label>
                <textarea
                  id="k0-input"
                  required
                  rows={2}
                  className="kiz-textarea"
                  placeholder="Describe la falla, el desperdicio o la situación incómoda actual observada en línea..."
                  value={k0Deficient}
                  onChange={(e) => setK0Deficient(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="k1-input" className="kiz-label">
                  K1: Función Básica (¿Cuál es el propósito esencial del proceso?) *
                </label>
                <textarea
                  id="k1-input"
                  required
                  rows={2}
                  className="kiz-textarea"
                  placeholder="Define el verbo y objeto principal que debe cumplirse sin agregados innecesarios..."
                  value={k1BasicFunction}
                  onChange={(e) => setK1BasicFunction(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="k2-input" className="kiz-label">
                  K2: Proactividad Propuesta (¿Qué idea ingeniosa se aplicará?) *
                </label>
                <textarea
                  id="k2-input"
                  required
                  rows={2}
                  className="kiz-textarea"
                  placeholder="Describe la contramedida física o lógica: gravedad, guías mecánicas, reciclaje de materiales..."
                  value={k2Proactivity}
                  onChange={(e) => setK2Proactivity(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="k3-input" className="kiz-label">
                    K3: Impacto Esperado (Resultados medibles proyectados) *
                  </label>
                  <input
                    id="k3-input"
                    type="text"
                    required
                    className="kiz-input"
                    placeholder="Ej: Cero defectos de inserción y reducción de 45% en tiempo"
                    value={k3ExpectedImpact}
                    onChange={(e) => setK3ExpectedImpact(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="ve-input" className="kiz-label">
                    Ahorro Estimado V_E (USD/Año)
                  </label>
                  <input
                    id="ve-input"
                    type="number"
                    min="0"
                    step="500"
                    className="kiz-input"
                    value={veAnnualValue}
                    onChange={(e) => setVeAnnualValue(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="kiz-alert kiz-alert-warning" style={{ alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                <div>
                  <strong>Mandato Kizukai Kaizen: Cero Inversión de Capital</strong>
                  <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    Esta plataforma no autoriza partidas de Capex ni compras externas para iniciativas K2. Las contramedidas deben construirse con ingenio, piezas recicladas de planta o ajustes de método.
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--kiz-surface-subtle)',
                border: '2px solid var(--kiz-accent)',
                borderRadius: 'var(--kiz-radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={zeroInvestmentChecked}
                    onChange={(e) => setZeroInvestmentChecked(e.target.checked)}
                    style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--kiz-accent)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--kiz-text)' }}>
                      Confirmo y Certifico: CERO INVERSIÓN DE CAPITAL ($0 USD Capex)
                    </strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--kiz-text-muted)', marginTop: '0.25rem' }}>
                      Declaro bajo metodología Kaizen que la implementación se realizará con materiales existentes, sobrantes de mantenimiento, redistribución de herramentales o cambios de método sin requerir presupuesto de inversión.
                    </p>
                  </div>
                </label>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--kiz-border)',
                borderRadius: 'var(--kiz-radius)',
                padding: '0.85rem',
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--kiz-primary)', marginBottom: '0.4rem' }}>
                  Resumen de la Iniciativa:
                </div>
                <div><strong>Título:</strong> {title}</div>
                <div><strong>Departamento:</strong> {department} &middot; Directriz: {guideline}</div>
                <div><strong>Valor Económico Proyectado:</strong> ${veAnnualValue.toLocaleString()} USD / año</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="kiz-modal-footer">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="kiz-btn kiz-btn-secondary"
            >
              ← Anterior
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="kiz-btn kiz-btn-primary"
            >
              Continuar →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="kiz-btn kiz-btn-secondary"
                title="Guarda la iniciativa en estado BORRADOR para editarla luego"
              >
                💾 Guardar Borrador
              </button>

              <button
                type="button"
                disabled={!zeroInvestmentChecked}
                onClick={() => handleSave(false)}
                className="kiz-btn kiz-btn-accent"
                title="Envía la iniciativa a POR_APROBAR para filtro técnico de Coordinación"
              >
                🚀 Enviar a Revisión Técnica (KIZ-2026-XXXX)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
