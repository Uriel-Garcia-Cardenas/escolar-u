// ============================================================
// js/anuncios.js
// CRUD de anuncios con soporte para dirigirlos por materia.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COL = "anuncios";

// ------------------------------------------------------------
// 1. LISTAR todos los anuncios (para panel admin/supervisor)
// ------------------------------------------------------------
export async function listarAnuncios(cantidadMax = 50) {
  try {
    const q = query(
      collection(db, COL),
      orderBy("fecha", "desc"),
      limit(cantidadMax)
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, anuncios: lista };
  } catch (error) {
    console.error("Error al listar anuncios:", error);
    return { ok: false, error: "No se pudieron cargar los anuncios" };
  }
}

// ------------------------------------------------------------
// 2. LISTAR anuncios VIGENTES y VISIBLES para un alumno
//    alumnoMaterias: array de IDs de materias del alumno
//    Si es staff (staffVeTodo = true), se ignoran los filtros.
// ------------------------------------------------------------
export async function listarAnunciosVigentes({ alumnoMaterias = [], staffVeTodo = false, cantidadMax = 20 } = {}) {
  try {
    const q = query(
      collection(db, COL),
      orderBy("fecha", "desc"),
      limit(cantidadMax)
    );
    const snap = await getDocs(q);
    const hoy = new Date();
    const lista = [];

    snap.forEach((d) => {
      const data = d.data();

      // Filtro 1: expiración
      if (data.expira) {
        const exp = data.expira.toDate ? data.expira.toDate() : new Date(data.expira.seconds * 1000);
        if (exp < hoy) return;
      }

      // Filtro 2: visibilidad por materia (solo si NO es staff)
      if (!staffVeTodo) {
        const dirigidas = Array.isArray(data.materiasDirigidas) ? data.materiasDirigidas : [];
        if (dirigidas.length > 0) {
          const coincide = dirigidas.some((mId) => alumnoMaterias.includes(mId));
          if (!coincide) return; // no le corresponde
        }
      }

      lista.push({ id: d.id, ...data });
    });

    return { ok: true, anuncios: lista };
  } catch (error) {
    console.error("Error al listar anuncios vigentes:", error);
    return { ok: false, error: "No se pudieron cargar los anuncios" };
  }
}

// ------------------------------------------------------------
// 3. OBTENER uno por ID
// ------------------------------------------------------------
export async function obtenerAnuncio(id) {
  try {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return { ok: false, error: "Anuncio no encontrado" };
    return { ok: true, anuncio: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener anuncio:", error);
    return { ok: false, error: "No se pudo cargar el anuncio" };
  }
}

// ------------------------------------------------------------
// 4. CREAR anuncio (con materias opcionales)
// ------------------------------------------------------------
export async function crearAnuncio({ titulo, mensaje, prioridad, expira, materiasDirigidas }) {
  try {
    if (!titulo || !mensaje) {
      return { ok: false, error: "Título y mensaje son obligatorios" };
    }

    const user = auth.currentUser;
    const datos = {
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      prioridad: prioridad || "normal",
      materiasDirigidas: Array.isArray(materiasDirigidas) ? materiasDirigidas : [],
      autorUid:   user ? user.uid   : null,
      autorEmail: user ? user.email : "",
      expira: expira ? new Date(expira) : null,
      fecha: serverTimestamp()
    };

    const ref = await addDoc(collection(db, COL), datos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("crear_anuncio", `Creó anuncio "${datos.titulo}"`, {
        anuncioId: ref.id,
        materias: datos.materiasDirigidas
      })
    ).catch(() => {});

    return { ok: true, id: ref.id };
  } catch (error) {
    console.error("Error al crear anuncio:", error);
    return { ok: false, error: "No se pudo crear el anuncio" };
  }
}

// ------------------------------------------------------------
// 5. ACTUALIZAR anuncio
// ------------------------------------------------------------
export async function actualizarAnuncio(id, datos) {
  try {
    const limpio = { ...datos };
    if (limpio.expira) limpio.expira = new Date(limpio.expira);
    else limpio.expira = null;
    if (!Array.isArray(limpio.materiasDirigidas)) limpio.materiasDirigidas = [];

    await updateDoc(doc(db, COL, id), limpio);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_anuncio", `Editó el anuncio ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar anuncio:", error);
    return { ok: false, error: "No se pudo actualizar el anuncio" };
  }
}

// ------------------------------------------------------------
// 6. BORRAR anuncio
// ------------------------------------------------------------
export async function borrarAnuncio(id) {
  try {
    await deleteDoc(doc(db, COL, id));

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_anuncio", `Borró el anuncio ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al borrar anuncio:", error);
    return { ok: false, error: "No se pudo borrar el anuncio" };
  }
}

// ------------------------------------------------------------
// Helpers  
// ------------------------------------------------------------
export function formatearFecha(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleString("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (_) {
    return "—";
  }
}

export function colorPrioridad(p) {
  if (p === "urgente")    return { bg: "danger",  icon: "exclamation-triangle", texto: "Urgente" };
  if (p === "importante") return { bg: "warning", icon: "exclamation-circle",   texto: "Importante" };
  return                          { bg: "info",    icon: "info-circle",          texto: "Normal" };
}