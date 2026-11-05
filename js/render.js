// ============================================================
// js/render.js
// Funciones para renderizar unidades según su plantilla.
// ============================================================

// ============================================================
// Normaliza cualquier URL de video a formato "embed"
// Acepta YouTube (watch, youtu.be, shorts, embed) y Vimeo.
// ============================================================
export function normalizarUrlVideo(url) {
  if (!url) return "";

  const u = url.trim();

  // ---- YOUTUBE ----
  // youtu.be/ID
  let m = u.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // youtube.com/watch?v=ID
  m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // youtube.com/shorts/ID
  m = u.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // youtube.com/embed/ID  → ya está correcto
  m = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // ---- VIMEO ----
  // vimeo.com/ID
  m = u.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;

  // ---- GOOGLE DRIVE (opcional) ----
  // drive.google.com/file/d/ID/view
  m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;

  // Si no coincide con ninguno, devolvemos lo que vino
  return u;
}
export function renderizarUnidad(unidad, index) {
  const { titulo, plantilla, contenido } = unidad;

  let html = `<div class="unidad-container mb-5" data-unidad-id="${unidad.id}">`;
  html += `<h3 class="mb-3">${titulo}</h3>`;

  switch (plantilla) {
    case "hoja":     html += renderHoja(contenido, index);     break;
    case "acordeon": html += renderAcordeon(contenido, index); break;
    case "tabs":     html += renderTabs(contenido, index);     break;
    case "tarjetas": html += renderTarjetas(contenido, index); break;
    case "timeline": html += renderTimeline(contenido, index); break;
    case "video":    html += renderVideo(contenido, index);    break;
    case "imagen": html += renderImagen(contenido, index); break;
    case "documento": html += renderDocumento(contenido, index); break;
    default:
      html += `<div class="alert alert-warning">Tipo de plantilla no soportado: ${plantilla}</div>`;
  }

  html += `</div>`;
  return html;
}

export function renderAcordeon(contenido, index) {
  if (!contenido.secciones || contenido.secciones.length === 0) {
    return '<div class="alert alert-info">No hay secciones.</div>';
  }
  let html = `<div class="accordion" id="accordionUnidad${index}">`;
  contenido.secciones.forEach((seccion, i) => {
    const cid = `collapseUnidad${index}_${i}`;
    const first = i === 0 ? "show" : "";
    html += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingUnidad${index}_${i}">
          <button class="accordion-button ${first ? "" : "collapsed"}" type="button"
                  data-bs-toggle="collapse" data-bs-target="#${cid}">
            ${seccion.titulo || "Sección"}
          </button>
        </h2>
        <div id="${cid}" class="accordion-collapse collapse ${first}"
             data-bs-parent="#accordionUnidad${index}">
          <div class="accordion-body">${seccion.texto || ""}</div>
        </div>
      </div>`;
  });
  html += `</div>`;
  return html;
}

export function renderTabs(contenido, index) {
  if (!contenido.pestanas || contenido.pestanas.length === 0) {
    return '<div class="alert alert-info">No hay pestañas.</div>';
  }
  const tabId = `tabUnidad${index}`;
  let html = `<ul class="nav nav-tabs mb-3" id="${tabId}" role="tablist">`;
  contenido.pestanas.forEach((p, i) => {
    const active = i === 0 ? "active" : "";
    const paneId = `${tabId}Pane${i}`;
    html += `
      <li class="nav-item" role="presentation">
        <button class="nav-link ${active}" id="${tabId}Tab${i}"
                data-bs-toggle="tab" data-bs-target="#${paneId}"
                type="button" role="tab">
          ${p.nombre || `Pestaña ${i + 1}`}
        </button>
      </li>`;
  });
  html += `</ul><div class="tab-content" id="${tabId}Content">`;
  contenido.pestanas.forEach((p, i) => {
    const active = i === 0 ? "show active" : "";
    const paneId = `${tabId}Pane${i}`;
    html += `
      <div class="tab-pane fade ${active}" id="${paneId}" role="tabpanel">
        ${p.texto || ""}
      </div>`;
  });
  html += `</div>`;
  return html;
}

export function renderTarjetas(contenido, index) {
  if (!contenido.tarjetas || contenido.tarjetas.length === 0) {
    return '<div class="alert alert-info">No hay tarjetas.</div>';
  }
  let html = `<div class="row g-4">`;
  contenido.tarjetas.forEach((t) => {
    // ✅ Convertimos la URL con el helper para que funcione con Drive, ImgBB, etc.
    const imagenHTML = t.imagen
      ? `<img src="${convertirUrlImagen(t.imagen)}"
              class="card-img-top"
              alt="${t.titulo || "Imagen"}"
              style="height:180px; object-fit:cover;"
              onerror="this.style.display='none'">`
      : "";

    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 tarjeta-simple">
          ${imagenHTML}
          <div class="card-body d-flex flex-column">
            ${t.titulo ? `<h5 class="card-title">${t.titulo}</h5>` : ""}
            ${t.descripcion ? `<p class="card-text">${t.descripcion}</p>` : ""}
          </div>
        </div>
      </div>`;
  });
  html += `</div>`;
  return html;
}

export function renderTimeline(contenido, index) {
  if (!contenido.eventos || contenido.eventos.length === 0) {
    return '<div class="alert alert-info">No hay eventos.</div>';
  }
  let html = `<div class="timeline">`;
  contenido.eventos.forEach((e, i) => {
    html += `
      <div class="timeline-item">
        <div class="timeline-icon">${i + 1}</div>
        <div class="timeline-content">
          <h4>${e.titulo || ""}</h4>
          <p>${e.texto || ""}</p>
        </div>
      </div>`;
  });
  html += `</div>`;
  return html;
}

export function renderVideo(contenido, index) {
  if (!contenido.url) {
    return '<div class="alert alert-warning">No se especificó URL.</div>';
  }

  const urlEmbed = normalizarUrlVideo(contenido.url);

  return `
    <div class="ratio ratio-16x9">
      <iframe src="${urlEmbed}"
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
    </div>
    <p class="mt-2 text-muted">${contenido.descripcion || ""}</p>`;
}


// Convierte link de Drive a URL directa (igual que en el editor)
export function convertirUrlImagen(url) {
    if (!url) return "";

    const u = url.trim();

    let m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

    m = u.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

    m = u.match(/drive\.google\.com\/uc\?.*id=([A-Za-z0-9_-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

    m = u.match(/docs\.google\.com\/.*\/d\/([A-Za-z0-9_-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;

    if (u.includes("dropbox.com")) {
        return u.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "");
    }

    return u;
}

export function renderImagen(contenido, index) {
    if (!contenido.url) {
        return '<div class="alert alert-warning">No se especificó imagen.</div>';
    }

    const urlFinal = convertirUrlImagen(contenido.url);

    return `
        <div class="text-center">
            <img src="${urlFinal}"
                 alt="${contenido.alt || "Imagen"}"
                 class="unidad-imagen img-fluid rounded shadow-sm"
                 loading="lazy"
                 onerror="this.src='../assets/images/info.png'">
            ${contenido.descripcion
                ? `<p class="text-muted mt-3 mb-0">${contenido.descripcion}</p>`
                : ""}
        </div>`;
}
// ============================================================
// HOJA EN BLANCO
// Se ve como una hoja de papel con título, subtítulo y texto libre.
// ============================================================
export function renderHoja(contenido, index) {
  const titulo    = contenido.titulo    || "";
  const subtitulo = contenido.subtitulo || "";
  const texto     = contenido.texto     || "";

  // Convertimos saltos de línea en <br> para respetar el formato
  const textoHTML = texto
    .split("\n")
    .map((linea) => linea.trim() === "" ? "<br>" : `<p>${linea}</p>`)
    .join("");

  return `
    <div class="hoja-blanco">
      ${titulo    ? `<h1 class="hoja-titulo">${titulo}</h1>` : ""}
      ${subtitulo ? `<h2 class="hoja-subtitulo">${subtitulo}</h2>` : ""}
      ${titulo || subtitulo ? `<hr class="hoja-divisor">` : ""}
      <div class="hoja-contenido">
        ${textoHTML || '<p class="text-muted"><em>Sin contenido.</em></p>'}
      </div>
    </div>`;
}
// ============================================================
// DOCUMENTO (PDF, Word, Excel, TXT)
// Transforma enlaces de Google Drive para que se vean en iframe.
// ============================================================
export function renderDocumento(contenido, index) {
  if (!contenido.url) {
    return '<div class="alert alert-warning">No se especificó el documento.</div>';
  }

  let urlFinal = contenido.url.trim();

  // Si es un enlace de Google Drive, lo convertimos a "preview" para que se vea embebido
  if (urlFinal.includes("drive.google.com/file/d/")) {
    const match = urlFinal.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      urlFinal = `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  // Si es un enlace de Google Docs o Sheets
  else if (urlFinal.includes("docs.google.com")) {
    urlFinal = urlFinal.replace(/\/edit(\?.*)?$/, "/preview");
  }

  return `
    <div class="documento-wrapper">
      <iframe src="${urlFinal}" 
              class="documento-iframe" 
              allow="autoplay" 
              allowfullscreen>
      </iframe>
    </div>
    ${contenido.descripcion
      ? `<p class="text-muted mt-3 mb-0">${contenido.descripcion}</p>`
      : ""}
  `;
}