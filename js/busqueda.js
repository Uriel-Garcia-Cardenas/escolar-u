// ============================================================
// js/busqueda.js
// Búsqueda global que respeta el rol del usuario.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// Normaliza texto para comparación (minúsculas + sin acentos)
// ------------------------------------------------------------
function normalizar(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ------------------------------------------------------------
// Buscar materias (todos los logueados)
// ------------------------------------------------------------
async function buscarMaterias(termino) {
  try {
    const snap = await getDocs(collection(db, "materias"));
    const t = normalizar(termino);
    const resultados = [];
    snap.forEach((d) => {
      const m = { id: d.id, ...d.data() };
      if (
        normalizar(m.nombre).includes(t) ||
        normalizar(m.descripcion).includes(t)
      ) {
        resultados.push(m);
      }
    });
    // Ordenar por "orden"
    resultados.sort((a, b) => (a.orden || 99) - (b.orden || 99));
    return resultados;
  } catch (e) {
    console.error("Error al buscar materias:", e);
    return [];
  }
}

// ------------------------------------------------------------
// Buscar unidades (filtrando por las materias del alumno si aplica)
// ------------------------------------------------------------
async function buscarUnidades(termino, materiasPermitidas = null) {
  try {
    const snap = await getDocs(collection(db, "unidades"));
    const t = normalizar(termino);
    const resultados = [];
    snap.forEach((d) => {
      const u = { id: d.id, ...d.data() };
      if (materiasPermitidas && !materiasPermitidas.includes(u.materiaId)) return;
      if (
        normalizar(u.titulo).includes(t) ||
        normalizar(u.plantilla).includes(t)
      ) {
        resultados.push(u);
      }
    });
    return resultados;
  } catch (e) {
    console.error("Error al buscar unidades:", e);
    return [];
  }
}

// ------------------------------------------------------------
// Buscar anuncios (filtrando por materias visibles)
// ------------------------------------------------------------
async function buscarAnuncios(termino, materiasPermitidas = null, esStaff = false) {
  try {
    const snap = await getDocs(collection(db, "anuncios"));
    const t = normalizar(termino);
    const resultados = [];
    const hoy = new Date();

    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() };

      // Expiración
      if (a.expira) {
        const exp = a.expira.toDate ? a.expira.toDate() : new Date(a.expira.seconds * 1000);
        if (exp < hoy) return;
      }

      // Visibilidad por materia
      if (!esStaff && materiasPermitidas) {
        const dirigidas = Array.isArray(a.materiasDirigidas) ? a.materiasDirigidas : [];
        if (dirigidas.length > 0) {
          const coincide = dirigidas.some((m) => materiasPermitidas.includes(m));
          if (!coincide) return;
        }
      }

      if (
        normalizar(a.titulo).includes(t) ||
        normalizar(a.mensaje).includes(t)
      ) {
        resultados.push(a);
      }
    });

    // Ordenar por fecha descendente
    resultados.sort((a, b) => {
      const fa = a.fecha?.seconds || 0;
      const fb = b.fecha?.seconds || 0;
      return fb - fa;
    });

    return resultados;
  } catch (e) {
    console.error("Error al buscar anuncios:", e);
    return [];
  }
}

// ------------------------------------------------------------
// Buscar usuarios (solo staff)
// ------------------------------------------------------------
async function buscarUsuarios(termino) {
  try {
    const snap = await getDocs(collection(db, "users"));
    const t = normalizar(termino);
    const resultados = [];
    snap.forEach((d) => {
      const u = { uid: d.id, ...d.data() };
      if (
        normalizar(u.nombre).includes(t) ||
        normalizar(u.email).includes(t) ||
        normalizar(u.rol).includes(t)
      ) {
        resultados.push(u);
      }
    });
    return resultados;
  } catch (e) {
    console.error("Error al buscar usuarios:", e);
    return [];
  }
}

// ------------------------------------------------------------
// BÚSQUEDA GLOBAL
//   opciones: { rol, materiasPermitidas }
// ------------------------------------------------------------
export async function buscarGlobal(termino, opciones = {}) {
  const { rol = "alumno", materiasPermitidas = [] } = opciones;

  if (!termino || termino.trim().length < 2) {
    return {
      ok: true,
      termino: termino || "",
      materias: [],
      unidades: [],
      anuncios: [],
      usuarios: []
    };
  }

  const esStaff = rol === "admin" || rol === "supervisor";

  // En paralelo
  const [materias, unidades, anuncios, usuarios] = await Promise.all([
    buscarMaterias(termino),
    buscarUnidades(termino, esStaff ? null : materiasPermitidas),
    buscarAnuncios(termino, esStaff ? null : materiasPermitidas, esStaff),
    esStaff ? buscarUsuarios(termino) : Promise.resolve([])
  ]);

  return {
    ok: true,
    termino,
    materias,
    unidades,
    anuncios,
    usuarios
  };
}