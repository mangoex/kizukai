# Kizukai Project Hub — Plataforma SaaS Multi-Tenant de Mejora Continua (MVP)

Plataforma digital modular, multiempresa (**Multi-Tenant**) y orientada a flujos guiados para institucionalizar la metodología **Kizukai** concebida por **Alejandro Kasuga Sakai** (*A. Kasuga Consultores*).

Diseñada y construida bajo el marco de ingeniería **Humanio CEO (`/director-dev` & `/creador-de-agentes`)**, integrando:
- **SDD (Software Design Description):** Arquitectura Limpia/Hexagonal, Máquina de 12 Estados, Aislamiento Multi-Tenant (`organization_id`) y esquema relacional PostgreSQL 16 de **22 entidades**.
- **SDK Tipado (`@kizukai/sdk`):** Cliente e interfaces fuertemente tipadas para el ciclo de vida completo de iniciativas.
- **SBD (Specification-Based Development):** Criterios de aceptación formales en Gherkin (`HU-01` a `HU-05`).
- **TDD (Test-Driven Development):** Pool de **20 pruebas automatizadas** (`TC-TDD-001` a `TC-TDD-015` + `HU-01` a `HU-05`) con paridad 1:1 en **Python (`pytest`)** y **TypeScript (`Vitest`)**.

---

## 1. Modelo Metodológico y Algorítmico Kizukai

El motor de dominio gobierna el ciclo de vida del rendimiento operativo mediante cuatro variables fundamentales:

$$V_E = \sum_{i=1}^{n} \left( K1_i + (K2_i \cdot K3_i) \right) - K0$$

1. **$K0$ (Estado Deficiente):** Anomalía, desperdicio (*muda*), tiempos muertos, mermas o retrabajos cuantificados en línea base.
2. **$K1$ (Funciones Básicas):** Cumplimiento del Procedimiento Operativo Estandarizado (POE) contractual.
3. **$K2$ (Proactividad *Ki Wo Tsukau*):** Propuesta voluntaria sujeta a **dos invariantes duras de backend**:
   - **Principio de Cero Inversión** (`ZeroInvestmentRequiredException`).
   - **Plazo máximo improrrogable de 8 semanas / 56 días** (`MaxImplementationWindowExceededException`).
4. **$K3$ (Impacto y Beneficio):** Resultado auditado presencialmente en el *Gemba* (Lista 5S firmada) y validado por Finanzas/Costos confrontando $K0$ vs $K3$.

---

## 2. Control de Acceso (RBAC Multi-Tenant + MFA) y Cuentas Demo

La aplicación incluye control de acceso basado en 5 roles, aislamiento lógico por `organization_id` y verificación **MFA obligatoria** (código demo: **`202600`**) para roles privilegiados:

| Correo Electrónico | Rol RBAC | Organización (Tenant) | MFA Requerido | Alcance Operativo |
| :--- | :--- | :--- | :---: | :--- |
| `juan.perez@empresa.com` | `PARTICIPANT` | Manufactura Eléctrica del Norte (`ORG-A`) | No | Registro de ideas K2, plan de 8 semanas, carga de evidencias y subsanación. |
| `carlos.mentor@empresa.com` | `MENTOR` | Manufactura Eléctrica del Norte (`ORG-A`) | No | Revisión de planes/entregables, auditoría *Gemba* 5S y devolución con feedback. |
| `roberto.mentor@empresa.com` | `MENTOR` | Manufactura Eléctrica del Norte (`ORG-A`) | No | Mentor disponible para nuevas asignaciones en `ORG-A`. |
| `ana.coord@empresa.com` | `COORDINATOR` | Manufactura Eléctrica del Norte (`ORG-A`) | **Sí (`202600`)** | Filtro técnico, asignación de mentores, aprobación K3 con Costos, POE y reportes de su empresa. |
| `kasuga.consultor@kizukai.com` | `CONSULTANT` | Global Multiempresa (`ORG-A` + `ORG-B`) | **Sí (`202600`)** | Visión consolidada multiempresa, auditoría metodológica y reportes globales. |
| `laura.operadora@bajio.com` | `PARTICIPANT` | Alimentos Industriales del Bajío (`ORG-B`) | No | Colaboradora de `ORG-B` (permite comprobar el aislamiento Multi-Tenant `403 Forbidden`). |
| `admin.tech@kizukai.com` | `TECH_ADMIN` | Global Infraestructura | **Sí (`202600`)** | Parámetros globales, almacenamiento y `audit_logs` (**sin acceso a contenido funcional**). |

---

## 3. Estructura del Repositorio

```text
├── api/                          # Endpoints Serverless para Vercel (/api/auth, /api/initiatives, /api/reports, /api/health)
├── database/
│   ├── schema.sql                # Esquema DDL PostgreSQL 16 (22 entidades + índices compuestos < 3.0s)
│   └── seed.sql                  # Semilla de los 12 estados, 6 etapas, 5 roles, métricas y organizaciones
├── docs/
│   ├── SDD_ARCHITECTURE.md       # Especificación de Diseño de Software (Diagramas Mermaid y ADRs)
│   ├── SBD_SPECIFICATIONS.md     # Especificaciones Basadas en Diseño (Reglas de Guarda, Workspace y Reportes)
│   ├── TDD_TEST_PLAN.md          # Plan y Matriz de Trazabilidad del Pool de Pruebas TDD/BDD
│   └── openapi.yaml              # Contrato formal OpenAPI 3.0.3
├── kizukai_py/                   # Motor de dominio Kizukai en Python (validación TDD pytest)
│   ├── __init__.py
│   └── engine.py
├── src/
│   ├── components/               # Vistas React 18 (Navbar, LoginModal MFA, RoleQueues, WorkspaceModal, ReportsModule, DatabaseSimulator)
│   ├── data/seedData.ts          # Semilla interactiva de las 22 entidades y casos del PRD
│   ├── domain/engine.ts          # Motor de dominio Kizukai en TypeScript (12 estados, K0-K3, OOXML .xlsx)
│   ├── sdk/                      # Contrato e implementación del SDK tipado (@kizukai/sdk)
│   │   ├── types.ts
│   │   └── client.ts
│   ├── services/storageService.ts# Persistencia reactiva, transiciones, versionamiento v1->v2 y exportador Excel
│   └── styles/tokens.css         # Sistema de diseño con tokens CSS nativos y accesibilidad WCAG 2.1 AA
├── tests/
│   ├── features/kizukai_mvp.feature # Escenarios Gherkin (HU-01 a HU-05)
│   ├── test_kizukai_tdd.py       # Suite Python pytest (20 pruebas: TC-TDD-001..015 + HU-01..05)
│   └── kizukai.spec.ts           # Suite TypeScript Vitest (20 pruebas espejo 1:1)
├── vercel.json                   # Configuración de enrutamiento y despliegue en Vercel
└── package.json
```

---

## 4. Ejecución de Pruebas (TDD / BDD) y Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar suite TDD/BDD en TypeScript (Vitest — 20 pruebas)
npx vitest run

# 3. Ejecutar suite TDD/BDD en Python (pytest — 20 pruebas)
pytest tests/test_kizukai_tdd.py

# 4. Compilar para producción (TypeScript + Vite)
npm run build

# 5. Iniciar servidor de desarrollo
npm run dev
```
