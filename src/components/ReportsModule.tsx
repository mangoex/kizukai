import React, { useState } from 'react';
import { Initiative, User } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface ReportsModuleProps {
  currentUser: User;
  initiatives: Initiative[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  currentUser,
  initiatives
}) => {
  const [selectedReport, setSelectedReport] = useState<'A' | 'B' | 'C'>('A');

  // Cálculos agregados para KPIs
  const totalCount = initiatives.length;
  const finalizedCount = initiatives.filter((i) => i.state === 'FINALIZADA').length;
  const activeCount = initiatives.filter(
    (i) => i.state === 'EN_IMPLEMENTACION' || i.state === 'PENDIENTE_PLAN_IMPLEMENTACION'
  ).length;
  const stagnantCount = initiatives.filter((i) => i.isStagnant).length;
  const totalVeAnnual = initiatives.reduce((acc, curr) => acc + curr.diagnostic.ve_annual_value, 0);

  const conversionRate = totalCount > 0 ? Math.round((finalizedCount / totalCount) * 100) : 0;

  const handleDownloadCSV = () => {
    const csvContent = StorageService.generateReportCSV(selectedReport, currentUser, initiatives);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Kizukai_Reporte_${selectedReport}_${currentUser.tenantId}_${dateStr}.csv`;
    StorageService.triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const handleDownloadExcel = () => {
    // Generación de formato compatible con Microsoft Excel (TSV con BOM y extensión .xlsx/.csv)
    const csvContent = StorageService.generateReportCSV(selectedReport, currentUser, initiatives);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Kizukai_Reporte_${selectedReport}_${currentUser.tenantId}_${dateStr}.xlsx`;
    StorageService.triggerDownload(csvContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
  };

  return (
    <section aria-labelledby="reports-title" style={{ marginBottom: '2.5rem' }}>
      {/* Encabezado del Módulo */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--kiz-border)',
        borderRadius: 'var(--kiz-radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--kiz-shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.35rem' }}>📊</span>
              <h1 id="reports-title" style={{ fontSize: '1.35rem', color: 'var(--kiz-text)' }}>
                Reportes Directivos y Gobernanza Kaizen
              </h1>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--kiz-text-muted)' }}>
              Exportación certificada con metadatos de auditoría: UTC, Usuario, Rol y Organización.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDownloadCSV}
              className="kiz-btn kiz-btn-secondary kiz-btn-sm"
              title="Descargar archivo en formato CSV con metadatos de auditoría"
            >
              📥 Descargar .CSV (Auditado)
            </button>
            <button
              onClick={handleDownloadExcel}
              className="kiz-btn kiz-btn-success kiz-btn-sm"
              title="Descargar hoja de cálculo Excel"
            >
              📊 Descargar .XLSX (Excel)
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Directivas (KPIs Kaizen) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--kiz-border-subtle)'
        }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--kiz-surface-subtle)', borderRadius: 'var(--kiz-radius)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)', fontWeight: 700 }}>
              VALOR ECONÓMICO ACUMULADO (V_E)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--kiz-success)', fontFamily: 'var(--kiz-font-mono)' }}>
              ${totalVeAnnual.toLocaleString()} USD
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-muted)' }}>
              Inversión de capital: <strong>$0 USD (100% Kaizen)</strong>
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--kiz-surface-subtle)', borderRadius: 'var(--kiz-radius)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)', fontWeight: 700 }}>
              TASA DE CONVERSIÓN DEL EMBUDO
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--kiz-primary)', fontFamily: 'var(--kiz-font-mono)' }}>
              {conversionRate}%
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-muted)' }}>
              {finalizedCount} iniciativas finalizadas de {totalCount}
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--kiz-surface-subtle)', borderRadius: 'var(--kiz-radius)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)', fontWeight: 700 }}>
              EN IMPLEMENTACIÓN GEMBA
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0369a1', fontFamily: 'var(--kiz-font-mono)' }}>
              {activeCount} proyectos
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-muted)' }}>
              En ejecución activa de tareas de campo
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--kiz-surface-subtle)', borderRadius: 'var(--kiz-radius)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--kiz-text-subtle)', fontWeight: 700 }}>
              ALERTAS DE ESTANCAMIENTO (&gt;7 DÍAS)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stagnantCount > 0 ? '#b91c1c' : 'var(--kiz-success)', fontFamily: 'var(--kiz-font-mono)' }}>
              {stagnantCount}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--kiz-text-muted)' }}>
              Requieren atención de Coordinación
            </div>
          </div>
        </div>
      </div>

      {/* Selector de los 3 Reportes Prioritarios (PRD) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <button
          onClick={() => setSelectedReport('A')}
          className="kiz-btn"
          style={{
            backgroundColor: selectedReport === 'A' ? 'var(--kiz-primary)' : '#ffffff',
            color: selectedReport === 'A' ? '#ffffff' : 'var(--kiz-text)',
            border: '1px solid var(--kiz-border)',
            fontSize: '0.825rem',
            padding: '0.5rem 1rem'
          }}
          aria-pressed={selectedReport === 'A'}
        >
          📈 Reporte A: Eficiencia del Embudo y Conversión
        </button>

        <button
          onClick={() => setSelectedReport('B')}
          className="kiz-btn"
          style={{
            backgroundColor: selectedReport === 'B' ? 'var(--kiz-primary)' : '#ffffff',
            color: selectedReport === 'B' ? '#ffffff' : 'var(--kiz-text)',
            border: '1px solid var(--kiz-border)',
            fontSize: '0.825rem',
            padding: '0.5rem 1rem'
          }}
          aria-pressed={selectedReport === 'B'}
        >
          ⏱️ Reporte B: Tiempos de Ciclo y Estancamiento
        </button>

        <button
          onClick={() => setSelectedReport('C')}
          className="kiz-btn"
          style={{
            backgroundColor: selectedReport === 'C' ? 'var(--kiz-primary)' : '#ffffff',
            color: selectedReport === 'C' ? '#ffffff' : 'var(--kiz-text)',
            border: '1px solid var(--kiz-border)',
            fontSize: '0.825rem',
            padding: '0.5rem 1rem'
          }}
          aria-pressed={selectedReport === 'C'}
        >
          💰 Reporte C: Impacto Económico K3 vs Cero Inversión
        </button>
      </div>

      {/* Vista Previa en Vivo de la Tabla del Reporte Seleccionado */}
      <div className="kiz-table-container">
        {selectedReport === 'A' && (
          <table className="kiz-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Iniciativa Kaizen</th>
                <th>Organización</th>
                <th>Directriz</th>
                <th>Estado Actual</th>
                <th>Paso Metodológico</th>
                <th>Avance %</th>
                <th>Mentor Asignado</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'var(--kiz-font-mono)', fontWeight: 700 }}>{i.folio}</td>
                  <td style={{ fontWeight: 600, color: 'var(--kiz-text)' }}>{i.title}</td>
                  <td>{i.tenantName}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 4, backgroundColor: 'var(--kiz-surface-muted)' }}>
                      {i.guideline}
                    </span>
                  </td>
                  <td>
                    <span className={`kiz-badge state-${i.state}`}>
                      <span className="kiz-badge-dot" />
                      <span>{i.state.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td>Paso {i.currentStep} de 6</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="kiz-progress-bar" style={{ width: 60 }}>
                        <div className="kiz-progress-fill" style={{ width: `${i.progressPercent}%` }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{i.progressPercent}%</span>
                    </div>
                  </td>
                  <td>{i.mentorName || 'Sin asignar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedReport === 'B' && (
          <table className="kiz-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Iniciativa</th>
                <th>Organización</th>
                <th>Fecha Registro</th>
                <th>Límite Ventana (8 Semanas)</th>
                <th>Estado Actual</th>
                <th>Alerta Estancamiento (&gt;7 Días)</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'var(--kiz-font-mono)', fontWeight: 700 }}>{i.folio}</td>
                  <td style={{ fontWeight: 600 }}>{i.title}</td>
                  <td>{i.tenantName}</td>
                  <td>{i.createdAt.split('T')[0]}</td>
                  <td style={{ fontWeight: 700, color: 'var(--kiz-primary)' }}>{i.deadlineDate}</td>
                  <td>
                    <span className={`kiz-badge state-${i.state}`}>
                      <span className="kiz-badge-dot" />
                      <span>{i.state.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td>
                    {i.isStagnant ? (
                      <span style={{ color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⚠️ ALERTA: &gt;7 días sin avance
                      </span>
                    ) : (
                      <span style={{ color: 'var(--kiz-success)', fontWeight: 600 }}>
                        ✓ En flujo operativo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedReport === 'C' && (
          <table className="kiz-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Iniciativa Kaizen</th>
                <th>Organización</th>
                <th>Directriz QCDSM</th>
                <th>Ahorro Anualizado (V_E)</th>
                <th>Inversión Capex Real</th>
                <th>ROI Kaizen</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'var(--kiz-font-mono)', fontWeight: 700 }}>{i.folio}</td>
                  <td style={{ fontWeight: 600 }}>{i.title}</td>
                  <td>{i.tenantName}</td>
                  <td>{i.guideline}</td>
                  <td style={{ fontFamily: 'var(--kiz-font-mono)', fontWeight: 700, color: 'var(--kiz-success)' }}>
                    ${i.diagnostic.ve_annual_value.toLocaleString()} USD
                  </td>
                  <td style={{ color: 'var(--kiz-text-muted)' }}>$0 USD (Cero Inversión)</td>
                  <td>
                    <span style={{ color: '#065f46', fontWeight: 700 }}>Infinito (&infin;)</span>
                  </td>
                  <td>
                    <span className={`kiz-badge state-${i.state}`}>
                      <span className="kiz-badge-dot" />
                      <span>{i.state.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
