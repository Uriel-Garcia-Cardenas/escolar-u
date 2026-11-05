// ============================================================
// js/main.js
// Lógica general de UI. (Migrado de Supabase a Firebase)
// ============================================================

// NOTA: El login/logout ahora vive en index.html + js/auth.js.
// Aquí solo dejamos UI general y funciones de renderizado.

document.addEventListener('DOMContentLoaded', function () {

    // ========== STICKY NAVBAR ==========
    const navbar = document.querySelector('.sticky-nav');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ========== BOTÓN INVITADO ==========
    // (Se conserva como acceso rápido sin sesión)
    const invitadoBtn = document.getElementById('invitado');
    if (invitadoBtn) {
        invitadoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Has ingresado como invitado. Podrás ver la información básica.');
            window.location.href = 'pages/inicio.html';
        });
    }

    // ========== DETECTAR PÁGINA DE MATERIA ==========
    // Cuando estemos dentro de pages/materiaN.html, cargaremos sus unidades.
    // TODO: migrar cargarUnidades() a Firestore en un paso posterior.
    const path = window.location.pathname;
    const materiaMatch = path.match(/materia(\d+)\.html/);
    if (materiaMatch) {
        const materiaId = `materia${materiaMatch[1]}`;
        console.log(`[main.js] Página de ${materiaId} detectada (carga pendiente de migrar a Firestore).`);
        // cargarUnidades(materiaId);  // ← se activará cuando migremos a Firebase
    }
});

// ============================================================
// FUNCIONES DE RENDERIZADO (no dependen de la base de datos)
// Se usan para pintar unidades cuando carguemos su contenido.
// ============================================================

/**
 * Renderiza una unidad según su tipo de plantilla.
 * @param {Object} unidad - { id, titulo, plantilla, contenido }
 * @param {number} index  - Índice para IDs únicos
 */
function renderizarUnidad(unidad, index) {
    const { titulo, plantilla, contenido } = unidad;

    let html = `<div class="unidad-container mb-5" data-unidad-id="${unidad.id}">`;
    html += `<h3 class="mb-3">${titulo}</h3>`;

    switch (plantilla) {
        case 'acordeon': html += renderAcordeon(contenido, index); break;
        case 'tabs':     html += renderTabs(contenido, index);     break;
        case 'flip':     html += renderFlip(contenido, index);     break;
        case 'timeline': html += renderTimeline(contenido, index); break;
        case 'video':    html += renderVideo(contenido, index);    break;
        default:
            html += `<div class="alert alert-warning">Tipo de plantilla no soportado: ${plantilla}</div>`;
    }

    html += `</div>`;
    return html;
}

function renderAcordeon(contenido, index) {
    if (!contenido.secciones || contenido.secciones.length === 0) {
        return '<div class="alert alert-info">No hay secciones en este acordeón.</div>';
    }
    let html = `<div class="accordion" id="accordionUnidad${index}">`;
    contenido.secciones.forEach((seccion, i) => {
        const collapseId = `collapseUnidad${index}_${i}`;
        const isFirst = i === 0 ? 'show' : '';
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="headingUnidad${index}_${i}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="${collapseId}">
                        ${seccion.titulo || 'Sección sin título'}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" aria-labelledby="headingUnidad${index}_${i}" data-bs-parent="#accordionUnidad${index}">
                    <div class="accordion-body">${seccion.texto || ''}</div>
                </div>
            </div>`;
    });
    html += `</div>`;
    return html;
}

function renderTabs(contenido, index) {
    if (!contenido.pestanas || contenido.pestanas.length === 0) {
        return '<div class="alert alert-info">No hay pestañas en esta unidad.</div>';
    }
    const tabId = `tabUnidad${index}`;
    let html = `<ul class="nav nav-tabs mb-3" id="${tabId}" role="tablist">`;
    contenido.pestanas.forEach((pestana, i) => {
        const isActive = i === 0 ? 'active' : '';
        const tabPaneId = `${tabId}Pane${i}`;
        html += `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${isActive}" id="${tabId}Tab${i}" data-bs-toggle="tab" data-bs-target="#${tabPaneId}" type="button" role="tab" aria-controls="${tabPaneId}" aria-selected="${i === 0 ? 'true' : 'false'}">
                    ${pestana.nombre || `Pestaña ${i + 1}`}
                </button>
            </li>`;
    });
    html += `</ul>`;

    html += `<div class="tab-content" id="${tabId}Content">`;
    contenido.pestanas.forEach((pestana, i) => {
        const isActive = i === 0 ? 'show active' : '';
        const tabPaneId = `${tabId}Pane${i}`;
        html += `
            <div class="tab-pane fade ${isActive}" id="${tabPaneId}" role="tabpanel" aria-labelledby="${tabId}Tab${i}">
                ${pestana.texto || ''}
            </div>`;
    });
    html += `</div>`;
    return html;
}

function renderFlip(contenido, index) {
    if (!contenido.tarjetas || contenido.tarjetas.length === 0) {
        return '<div class="alert alert-info">No hay tarjetas flip.</div>';
    }
    let html = `<div class="row g-4 flip-grid">`;
    contenido.tarjetas.forEach((tarjeta) => {
        html += `
            <div class="col-md-4 col-lg-3">
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-front">
                            <div class="flip-icon">#</div>
                            <h4>${tarjeta.frontal || 'Frontal'}</h4>
                            <p>${tarjeta.descripcion || ''}</p>
                        </div>
                        <div class="flip-back">
                            <h5>${tarjeta.trasera || 'Detalles'}</h5>
                            <ul>${(tarjeta.detalles || []).map(d => `<li>${d}</li>`).join('')}</ul>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    html += `</div>`;
    return html;
}

function renderTimeline(contenido, index) {
    if (!contenido.eventos || contenido.eventos.length === 0) {
        return '<div class="alert alert-info">No hay eventos en la línea de tiempo.</div>';
    }
    let html = `<div class="timeline">`;
    contenido.eventos.forEach((evento, i) => {
        html += `
            <div class="timeline-item">
                <div class="timeline-icon">${i + 1}</div>
                <div class="timeline-content">
                    <h4>${evento.titulo || 'Evento'}</h4>
                    <p>${evento.texto || ''}</p>
                </div>
            </div>`;
    });
    html += `</div>`;
    return html;
}

function renderVideo(contenido, index) {
    if (!contenido.url) {
        return '<div class="alert alert-warning">No se especificó URL del video.</div>';
    }
    return `
        <div class="ratio ratio-16x9">
            <iframe src="${contenido.url}" title="${contenido.descripcion || 'Video'}" allowfullscreen></iframe>
        </div>
        <p class="mt-2 text-muted">${contenido.descripcion || ''}</p>`;
}