// ============================================================
// js/roles.js
// Guardia de rutas por rol. Cada página protegida lo importa.
// ============================================================

import { observarSesion } from "./auth.js";

// Ruta al panel principal de cada rol
const PANEL_POR_ROL = {
  admin:      "admin/dashboard-admin.html",
  supervisor: "supervisor/dashboard.html",
  alumno:     "pages/dashboard.html"
};

// ------------------------------------------------------------
// protegerPagina(rolRequerido, rutaBase)
//   rolRequerido: "admin" | "supervisor" | "alumno" | "cualquiera"
//   rutaBase:     prefijo relativo para llegar a la raíz del proyecto
//                 desde la página actual (ej: "../" si estás en admin/)
// ------------------------------------------------------------
export function protegerPagina(rolRequerido, rutaBase = "../") {
  observarSesion(({ logueado, user, rol }) => {
    // Caso 1: no hay sesión → al login
    if (!logueado) {
      window.location.href = rutaBase + "index.html";
      return;
    }

    // Caso 2: hay sesión pero sin rol asignado en Firestore
    if (!rol) {
      alert("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
      window.location.href = rutaBase + "index.html";
      return;
    }

    // Caso 3: el rol no coincide con la carpeta (excepto admin que puede todo)
    if (rolRequerido !== "cualquiera" && rol !== rolRequerido && rol !== "admin") {
      window.location.href = rutaBase + PANEL_POR_ROL[rol];
      return;
    }

    // Caso 4: todo bien → la página carga normal
    console.log(`[roles.js] Acceso permitido: ${user.email} (rol: ${rol})`);
  });
}

// ------------------------------------------------------------
// redirigirSegunRol(rol, rutaBase)
//   Se usa después del login en index.html
// ------------------------------------------------------------
export function redirigirSegunRol(rol, rutaBase = "") {
  const destino = PANEL_POR_ROL[rol];
  if (destino) {
    window.location.href = rutaBase + destino;
  } else {
    alert("Rol desconocido. Contacta al administrador.");
  }
}