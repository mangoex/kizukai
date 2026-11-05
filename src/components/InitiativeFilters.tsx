import React from 'react';
import { BusinessState, StrategicGuideline, TenantId, User } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

export interface FilterState {
  searchQuery: string;
  tenantFilter: 'ALL' | TenantId;
  department: string;
  state: 'ALL' | BusinessState;
  step: 'ALL' | number;
  guideline: 'ALL' | StrategicGuideline;
  program: string;
}

interface InitiativeFiltersProps {
  currentUser: User;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  totalResults: number;
}

export const InitiativeFilters: React.FC<InitiativeFiltersProps> = ({
  currentUser,
  filters,
  onFilterChange,
  onResetFilters,
  totalResults
}) => {
  const isConsultant = currentUser.role === 'CONSULTANT';
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const activeFiltersCount =
    (filters.state !== 'ALL' ? 1 : 0) +
    (filters.step !== 'ALL' ? 1 : 0) +
    (filters.guideline !== 'ALL' ? 1 : 0) +
    (filters.department !== 'ALL' ? 1 : 0) +
    (filters.tenantFilter !== 'ALL' ? 1 : 0);

  const handleChange = (field: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const ALL_STATES: BusinessState[] = [
    'BORRADOR',
    'POR_APROBAR',
    'RECHAZADA',
    'PENDIENTE_ASIGNACION_MENTOR',
    'PENDIENTE_PLAN_IMPLEMENTACION',
    'EN_IMPLEMENTACION',
    'DEVUELTA_PARA_AJUSTES',
    'PENDIENTE_RESULTADOS',
    'POR_EVALUAR',
    'POR_DOCUMENTAR',
    'FINALIZADA',
    'CANCELADA'
  ];

  return (
    <div className="kiz-card" style={{ marginBottom: '1.25rem', backgroundColor: '#ffffff' }}>
      {/* Barra de Búsqueda Rápida */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.85rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
          <label htmlFor="search-input" className="kiz-label">
            Buscar por Folio, Título, Proponente o Palabras Clave
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-input"
              type="text"
              placeholder="Ej: KIZ-2026-0001, conector, troquel, Juan..."
              value={filters.searchQuery}
              onChange={(e) => handleChange('searchQuery', e.target.value)}
              className="kiz-input"
              style={{ paddingLeft: '2rem' }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--kiz-text-subtle)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Filtro Empresa (Solo modificable por Consultor Kizukai Global) */}
        <div style={{ minWidth: 200 }}>
          <label htmlFor="company-filter" className="kiz-label">
            Organización / Empresa
          </label>
          <select
            id="company-filter"
            value={filters.tenantFilter}
            onChange={(e) => handleChange('tenantFilter', e.target.value)}
            disabled={!isConsultant}
            className="kiz-select"
            style={{
              backgroundColor: !isConsultant ? 'var(--kiz-surface-muted)' : 'var(--kiz-surface)',
              cursor: !isConsultant ? 'not-allowed' : 'pointer'
            }}
          >
            {isConsultant && <option value="ALL">🌐 Todas las Empresas (Consolidado)</option>}
            <option value="ORG-A">Manufactura Eléctrica del Norte (ORG-A)</option>
            <option value="ORG-B">Alimentos Industriales del Bajío (ORG-B)</option>
          </select>
        </div>

        {/* Botones de Filtros y Restablecer */}
        <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="kiz-btn kiz-btn-secondary kiz-show-on-mobile"
            title="Mostrar u ocultar filtros secundarios en móvil"
            aria-expanded={showMobileFilters}
          >
            ⚡ Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''} {showMobileFilters ? '▲' : '▼'}
          </button>

          <button
            onClick={onResetFilters}
            className="kiz-btn kiz-btn-secondary"
            title="Restablecer todos los filtros a sus valores predeterminados"
          >
            ↺ Restablecer
          </button>
        </div>
      </div>

      {/* Filtros Combinables Secundarios */}
      <div
        className={`kiz-filter-grid ${showMobileFilters ? 'open' : ''}`}
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--kiz-border-subtle)'
        }}
      >
        {/* Estado (12 Estados) */}
        <div>
          <label htmlFor="state-filter" className="kiz-label">
            Estado de Negocio (12 Estados)
          </label>
          <select
            id="state-filter"
            value={filters.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="kiz-select"
          >
            <option value="ALL">Todos los Estados</option>
            {ALL_STATES.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Etapa / Paso Metodológico */}
        <div>
          <label htmlFor="step-filter" className="kiz-label">
            Paso Metodológico (1 a 6)
          </label>
          <select
            id="step-filter"
            value={filters.step}
            onChange={(e) => handleChange('step', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="kiz-select"
          >
            <option value="ALL">Todos los Pasos</option>
            <option value={1}>Paso 1: Detección y Análisis K0</option>
            <option value={2}>Paso 2: Mapeo Función Básica K1</option>
            <option value={3}>Paso 3: Diseño Contramedida K2</option>
            <option value={4}>Paso 4: Implementación en Gemba</option>
            <option value={5}>Paso 5: Medición Impacto K3</option>
            <option value={6}>Paso 6: Estandarización POE</option>
          </select>
        </div>

        {/* Directriz Estratégica (QCDSM) */}
        <div>
          <label htmlFor="guideline-filter" className="kiz-label">
            Directriz (QCDSM)
          </label>
          <select
            id="guideline-filter"
            value={filters.guideline}
            onChange={(e) => handleChange('guideline', e.target.value)}
            className="kiz-select"
          >
            <option value="ALL">Todas las Directrices</option>
            {StorageService.getGuidelines().map((g: any) => (
              <option key={g.code} value={g.code}>
                {g.name} ({g.letter})
              </option>
            ))}
          </select>
        </div>

        {/* Departamento */}
        <div>
          <label htmlFor="department-filter" className="kiz-label">
            Departamento de Gemba
          </label>
          <select
            id="department-filter"
            value={filters.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className="kiz-select"
          >
            <option value="ALL">Todos los Departamentos</option>
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
      </div>

      {/* Resumen de Resultados Filtrados */}
      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--kiz-text-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>
          Mostrando <strong>{totalResults}</strong> iniciativa(s) que coinciden con los criterios.
        </span>
        {isConsultant && (
          <span style={{ color: 'var(--kiz-info)' }}>
            ℹ️ Filtro multiempresa activo como Consultor Kizukai Global.
          </span>
        )}
      </div>
    </div>
  );
};
