// ============================================================
// js/anuncios-widget.js
// Pinta el widget de anuncios vigentes filtrado por alumno/staff.
// ============================================================

import { listarAnunciosVigentes, formatearFecha, colorPrioridad } from "./anuncios.js";

/**
 * @param {string} containerId  - id del contenedor donde pintar
 * @param {object} opciones
 *   - alumnoMaterias: array de IDs (solo alumnos)
 *   - staffVeTodo: boolean (true para admin/supervisor)
 *   - cantidad: cuántos anuncios mostrar (default 3)
 */
export async function pintarWidgetAnuncios(containerId, opciones = {}) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  cont.innerHTML = '<p class="text-muted small text-center py-3">Cargando anuncios...</p>';

  const res = await listarAnunciosVigentes({
    alumnoMaterias: opciones.alumnoMaterias || [],
    staffVeTodo:    opciones.staffVeTodo    || false,
    cantidadMax:    opciones.cantidad       || 20
  });

  if (!res.ok) {
    cont.innerHTML = `<p class="text-danger small text-center py-3">${res.error}</p>`;
    return;
  }

  if (res.anuncios.length === 0) {
    cont.innerHTML = '<p class="text-muted small text-center py-3"><i class="fas fa-info-circle me-1"></i>No hay anuncios por ahora.</p>';
    return;
  }

  // Limitar a los N más recientes si se pidió
  const limite = opciones.cantidad || 3;
  const visibles = res.anuncios.slice(0, limite);

  cont.innerHTML = "";
  visibles.forEach((a) => {
    const c = colorPrioridad(a.prioridad);
    const tieneMaterias = Array.isArray(a.materiasDirigidas) && a.materiasDirigidas.length > 0;

    const div = document.createElement("div");
    div.className = `alert alert-${c.bg} py-2 mb-2 small`;
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="flex-grow-1">
                <strong><i class="fas fa-${c.icon} me-1"></i>${a.titulo || ""}</strong>
                ${tieneMaterias
                    ? `<span class="badge bg-light text-dark ms-1" style="font-size:0.65rem;">
                          <i class="fas fa-book me-1"></i>${a.materiasDirigidas.length} materia(s)
                       </span>`
                    : `<span class="badge bg-light text-dark ms-1" style="font-size:0.65rem;">
                          <i class="fas fa-globe me-1"></i>Global
                       </span>`}
                <div class="mt-1">${a.mensaje || ""}</div>
                <div class="text-muted mt-1" style="font-size:0.75rem;">
                    <i class="fas fa-user me-1"></i>${a.autorEmail || "—"}
                    &nbsp;·&nbsp;
                    ${formatearFecha(a.fecha)}
                </div>
            </div>
        </div>
    `;
    cont.appendChild(div);
  });
}