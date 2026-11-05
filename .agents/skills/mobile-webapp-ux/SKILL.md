---
name: mobile-webapp-ux
description: Diseño y arquitectura de aplicaciones web móviles (Mobile-First Web App / PWA), ergonomía táctil (Thumb-Zone), navegación inferior (Bottom Nav), Bottom Sheets deslizables, transformación de tablas a tarjetas móviles y simplificación de flujos por rol (Role-Based Progressive Disclosure). Úsese cuando se diseñe, adapte o audite una aplicación web para celulares sin afectar la experiencia de escritorio.
---

# Mobile Web App UI/UX & Role-Based Ergonomics (`mobile-webapp-ux`)

Esta habilidad estandariza la transformación de aplicaciones empresariales de escritorio en **Web Apps Móviles (PWA-ready)** prácticas, rápidas y ergonómicas para uso en campo (Gemba / Piso de Planta / Dirección), preservando intacta la vista de escritorio (`>= 1024px`).

---

## 1. Principios Rectores de Diseño Móvil (Mobile-First Gemba UX)

1. **Un Rol, Una Acción Principal (Role-Based Progressive Disclosure):**
   - En pantallas `< 768px`, el usuario en campo no debe enfrentar paneles administrativos densos. Cada rol debe ver de inmediato su **Acción Crítica Primaria** en el primer tercio visible (*above the fold*) y al alcance del pulgar.
2. **Ergonomía de Zona del Pulgar (*Thumb-Zone Navigation*):**
   - Prohibido saturar la cabecera móvil con múltiples filas de botones o menús desplegables anchos.
   - **Top App Bar Compacta (`56px`):** Solo identidad/logo compacto, indicador de Tenant/Rol activo y disparador rápido de perfil.
   - **Bottom Navigation Bar Fija (`64px` + `env(safe-area-inset-bottom)`):** Máximo 4 a 5 destinos clave con iconos claros, etiquetas legibles (`11px-12px`) y botón de acción flotante o central integrado (`+ Capturar`).
3. **Cero Estilos en Línea Rígidos (*Zero Fixed Inline Layout Widths*):**
   - Evitar `style={{ width: 320, minWidth: 260 }}` o grillas rígidas en JSX que impidan la adaptación en viewports de `320px` a `430px`.
   - Utilizar clases semánticas en CSS con variables nativas (`tokens.css`), `clamp()`, Flexbox con `flex-wrap` controlado y CSS Grid responsivo (`minmax(0, 1fr)`).
4. **Modales como *Bottom Sheets* o Vistas *Full-Screen* (`100dvh`):**
   - En móvil, los modales complejos (expedientes, formularios multi-paso) se comportan como *Bottom Sheets* deslizables o pantallas completas con:
     - Cabecera fija (*Sticky Header*) con botón de cierre rápido (`✕` o `← Volver`).
     - Navegación interna mediante píldoras horizontales deslizables (`overflow-x: auto; scroll-snap-type: x mandatory`).
     - Barra inferior fija de acción (*Sticky Bottom Action Bar*) para aprobar, firmar o guardar con una sola mano.
5. **Transformación de Tablas a Tarjetas (*Table-to-Card Pattern*):**
   - Ninguna tabla de datos (`<table>`) debe forzar desplazamiento horizontal infinito en móvil. En `< 768px`, las filas se transforman en tarjetas apiladas (`display: flex; flex-direction: column`) con jerarquía visual clara (Título + Badge en cabecera, metadatos en grilla de 2 columnas, CTA al pie).
6. **Filtros Colapsables en *Bottom Sheet*:**
   - En lugar de mostrar 5 o 6 selectores apilados que empujan el contenido fuera de la pantalla, en móvil se muestra una barra de búsqueda compacta + botón `[⚡ Filtros (N)]` con contador de filtros activos que abre un cajón inferior (*Filter Sheet*).

---

## 2. Estándares de Accesibilidad Táctil (WCAG 2.1 AA Mobile)

- **Tamaño mínimo de área táctil (*Touch Target*):** `48px × 48px` (mínimo absoluto `44px × 44px`) en botones, pestañas, interruptores 5S y casillas de verificación.
- **Prevención de Auto-Zoom en iOS Safari:** Todos los `<input>`, `<select>` y `<textarea>` en móvil deben tener `font-size: 16px` (`1rem`) como mínimo para evitar que iOS haga zoom brusco al enfocar.
- **Unidades de Viewport Dinámicas:** Usar `100dvh` en lugar de `100vh` para respetar las barras dinámicas de navegación en Safari (iOS) y Chrome (Android).
- **Safe Area Insets:** Incluir `viewport-fit=cover` en `<meta name="viewport">` y aplicar `padding-bottom: env(safe-area-inset-bottom, 0px)` en barras inferiores fijas.
