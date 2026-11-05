// ============================================================
// js/stats.js
// Estadísticas generales para el dashboard del admin.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// Obtiene el conteo de una colección
// ------------------------------------------------------------
async function contar(coleccion) {
  try {
    const snap = await getCountFromServer(collection(db, coleccion));
    return snap.data().count;
  } catch (error) {
    console.error(`Error al contar ${coleccion}:`, error);
    return 0;
  }
}

// ------------------------------------------------------------
// Estadísticas globales
// ------------------------------------------------------------
export async function obtenerEstadisticas() {
  try {
    const [usuarios, materias, unidades, calificaciones, actividades, entregas] = await Promise.all([
      contar("users"),
      contar("materias"),
      contar("unidades"),
      contar("calificaciones"),
      contar("actividades"),
      contar("entregas")
    ]);

    return {
      ok: true,
      stats: { usuarios, materias, unidades, calificaciones, actividades, entregas }
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return { ok: false, error: "No se pudieron cargar las estadísticas" };
  }
}

// ------------------------------------------------------------
// Usuarios desglosados por rol
// ------------------------------------------------------------
export async function obtenerUsuariosPorRol() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const conteo = { admin: 0, supervisor: 0, alumno: 0, otros: 0 };
    snap.forEach((d) => {
      const rol = d.data().rol;
      if (rol === "admin") conteo.admin++;
      else if (rol === "supervisor") conteo.supervisor++;
      else if (rol === "alumno") conteo.alumno++;
      else conteo.otros++;
    });
    return { ok: true, roles: conteo };
  } catch (error) {
    console.error("Error al contar por rol:", error);
    return { ok: false, error: "No se pudieron contar los roles" };
  }
}