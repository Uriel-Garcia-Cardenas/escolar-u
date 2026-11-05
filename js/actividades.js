// ============================================================
// js/actividades.js
// CRUD de actividades y entregas.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COL_ACT = "actividades";
const COL_ENT = "entregas";

// ID compuesto para evitar entregas duplicadas
function idEntrega(actividadId, alumnoUid) {
  return `${actividadId}_${alumnoUid}`;
}

// ------------------------------------------------------------
// Convierte URL de Drive u otros a directa
// (para mostrar archivos de imagen si el profe o alumno los sube)
// ------------------------------------------------------------
export function convertirUrlArchivo(url) {
  if (!url) return "";
  const u = url.trim();

  let m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/view`;

  return u;
}

// ============================================================
// ACTIVIDADES
// ============================================================

// ------------------------------------------------------------
// 1. LISTAR actividades de una materia
//    soloActivas = true → solo las que están activas
// ------------------------------------------------------------
export async function listarActividadesPorMateria(materiaId, soloActivas = false) {
  try {
    let q;
    if (soloActivas) {
      q = query(
        collection(db, COL_ACT),
        where("materiaId", "==", materiaId),
        where("activa", "==", true),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, COL_ACT),
        where("materiaId", "==", materiaId),
        orderBy("createdAt", "desc")
      );
    }
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, actividades: lista };
  } catch (error) {
    console.error("Error al listar actividades:", error);
    // Fallback sin ordenar (por si falta índice)
    try {
      const snap = await getDocs(
        query(collection(db, COL_ACT), where("materiaId", "==", materiaId))
      );
      const lista = [];
      snap.forEach((d) => {
        const a = { id: d.id, ...d.data() };
        if (!soloActivas || a.activa) lista.push(a);
      });
      return { ok: true, actividades: lista };
    } catch (e2) {
      return { ok: false, error: "No se pudieron cargar las actividades" };
    }
  }
}

// ------------------------------------------------------------
// 2. OBTENER una actividad
// ------------------------------------------------------------
export async function obtenerActividad(id) {
  try {
    const snap = await getDoc(doc(db, COL_ACT, id));
    if (!snap.exists()) return { ok: false, error: "Actividad no encontrada" };
    return { ok: true, actividad: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    return { ok: false, error: "No se pudo cargar la actividad" };
  }
}

// ------------------------------------------------------------
// 3. CREAR actividad
// ------------------------------------------------------------
export async function crearActividad(datos) {
  try {
    const {
      materiaId, materiaNombre, titulo, instrucciones,
      recursos, fechaLimite, puntajeMaximo, tiposPermitidos
    } = datos;

    if (!materiaId || !titulo) {
      return { ok: false, error: "Materia y título son obligatorios" };
    }

    const user = auth.currentUser;
    const payload = {
      materiaId,
      materiaNombre: materiaNombre || "",
      titulo: titulo.trim(),
      instrucciones: instrucciones || { titulo: "", subtitulo: "", texto: "" },
      recursos: Array.isArray(recursos) ? recursos : [],
      fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      puntajeMaximo: Number(puntajeMaximo) || 10,
      tiposPermitidos: Array.isArray(tiposPermitidos)
        ? tiposPermitidos
        : ["pdf", "docx", "txt", "png", "jpg", "jpeg", "tif", "webp"],
      activa: true,
      autorUid:   user ? user.uid   : null,
      autorEmail: user ? user.email : "",
      createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, COL_ACT), payload);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("crear_actividad", `Creó actividad "${payload.titulo}"`, { actividadId: ref.id })
    ).catch(() => {});

    return { ok: true, id: ref.id };
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return { ok: false, error: "No se pudo crear la actividad" };
  }
}

// ------------------------------------------------------------
// 4. ACTUALIZAR actividad
// ------------------------------------------------------------
export async function actualizarActividad(id, datos) {
  try {
    const limpio = { ...datos };
    if (limpio.fechaLimite !== undefined) {
      limpio.fechaLimite = limpio.fechaLimite ? new Date(limpio.fechaLimite) : null;
    }
    await updateDoc(doc(db, COL_ACT, id), limpio);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_actividad", `Editó la actividad ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    return { ok: false, error: "No se pudo actualizar la actividad" };
  }
}

// ------------------------------------------------------------
// 5. BORRAR actividad (y todas sus entregas asociadas)
// ------------------------------------------------------------
export async function borrarActividad(id) {
  try {
    // Borrar entregas asociadas
    const q = query(collection(db, COL_ENT), where("actividadId", "==", id));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    // Borrar actividad
    await deleteDoc(doc(db, COL_ACT, id));

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_actividad", `Borró la actividad ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al borrar actividad:", error);
    return { ok: false, error: "No se pudo borrar la actividad" };
  }
}

// ============================================================
// ENTREGAS
// ============================================================

// ------------------------------------------------------------
// 6. OBTENER la entrega de un alumno a una actividad
// ------------------------------------------------------------
export async function obtenerEntrega(actividadId, alumnoUid) {
  try {
    const ref = doc(db, COL_ENT, idEntrega(actividadId, alumnoUid));
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ok: true, entrega: null };
    return { ok: true, entrega: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    return { ok: false, error: "No se pudo cargar la entrega" };
  }
}

// ------------------------------------------------------------
// 7. LISTAR entregas de una actividad (para el profe)
// ------------------------------------------------------------
export async function listarEntregasPorActividad(actividadId) {
  try {
    const q = query(collection(db, COL_ENT), where("actividadId", "==", actividadId));
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, entregas: lista };
  } catch (error) {
    console.error("Error al listar entregas:", error);
    return { ok: false, error: "No se pudieron cargar las entregas" };
  }
}

// ------------------------------------------------------------
// 8. LISTAR entregas de un alumno en una materia
//    (para saber en qué actividades ya entregó)
// ------------------------------------------------------------
export async function listarEntregasAlumnoMateria(alumnoUid, materiaId) {
  try {
    const q = query(
      collection(db, COL_ENT),
      where("alumnoUid", "==", alumnoUid),
      where("materiaId", "==", materiaId)
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, entregas: lista };
  } catch (error) {
    console.error("Error al listar entregas del alumno:", error);
    return { ok: false, error: "No se pudieron cargar tus entregas" };
  }
}

// ------------------------------------------------------------
// 9. GUARDAR entrega del alumno (crear o reemplazar)
//    Solo permite si la entrega no está calificada.
// ------------------------------------------------------------
export async function guardarEntrega({
  actividadId, materiaId, materiaNombre, actividadTitulo, archivos, comentarioAlumno
}) {
  try {
    const user = auth.currentUser;
    if (!user) return { ok: false, error: "Sin sesión" };

    if (!Array.isArray(archivos) || archivos.length === 0) {
      return { ok: false, error: "Debes adjuntar al menos un archivo" };
    }

    const id = idEntrega(actividadId, user.uid);
    const ref = doc(db, COL_ENT, id);
    const existe = await getDoc(ref);

    if (existe.exists()) {
      const data = existe.data();
      if (data.calificacion !== null && data.calificacion !== undefined) {
        return { ok: false, error: "Esta entrega ya fue calificada. No se puede modificar." };
      }
    }

    let alumnoNombre = "";
    let alumnoEmail  = user.email || "";
    try {
      const { obtenerUsuario } = await import("./usuarios.js");
      const resU = await obtenerUsuario(user.uid);
      if (resU.ok) alumnoNombre = resU.usuario.nombre || "";
    } catch (_) {}

    const payload = {
      actividadId,
      actividadTitulo: actividadTitulo || "", // <-- NUEVO
      materiaId,
      materiaNombre: materiaNombre || "",     // <-- NUEVO
      alumnoUid: user.uid,
      alumnoNombre,
      alumnoEmail,
      archivos,
      comentarioAlumno: comentarioAlumno || "",
      fechaEntrega: serverTimestamp(),
      estado: "entregado"
    };

    if (!existe.exists()) {
      payload.calificacion      = null;
      payload.comentarioProfesor = null;
      payload.calificadoPor     = null;
      payload.fechaCalificacion = null;
    }

    if (existe.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog(
        existe.exists() ? "reentrega" : "entregar_actividad",
        `${existe.exists() ? "Reentregó" : "Entregó"} la actividad ${actividadId}`,
        { actividadId, archivosCount: archivos.length }
      )
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al guardar entrega:", error);
    return { ok: false, error: error.message || "No se pudo guardar la entrega" };
  }
}

// ------------------------------------------------------------
// 10. CALIFICAR entrega (staff)
// ------------------------------------------------------------
export async function calificarEntrega({
  actividadId, alumnoUid, calificacion, comentarioProfesor
}) {
  try {
    const user = auth.currentUser;
    const ref = doc(db, COL_ENT, idEntrega(actividadId, alumnoUid));

    await updateDoc(ref, {
      calificacion:      Number(calificacion),
      comentarioProfesor: comentarioProfesor || "",
      calificadoPor:     user ? user.uid : null,
      fechaCalificacion: serverTimestamp(),
      estado:            "calificado"
    });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("calificar_entrega",
        `Calificó la actividad ${actividadId} de ${alumnoUid} con ${calificacion}`,
        { actividadId, alumnoUid, calificacion })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al calificar entrega:", error);
    return { ok: false, error: "No se pudo calificar la entrega" };
  }
}

// ------------------------------------------------------------
// 13. LISTAR TODAS las entregas de un alumno (para su boleta)
// ------------------------------------------------------------
export async function listarTodasEntregasAlumno(alumnoUid) {
  try {
    const q = query(
      collection(db, COL_ENT),
      where("alumnoUid", "==", alumnoUid)
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, entregas: lista };
  } catch (error) {
    console.error("Error al listar entregas del alumno:", error);
    return { ok: false, error: "No se pudieron cargar tus entregas" };
  }
}

// ------------------------------------------------------------
// 14. CONTAR entregas por calificar (para el admin)
// ------------------------------------------------------------
export async function contarEntregasPorCalificar() {
  try {
    const q = query(
      collection(db, COL_ENT),
      where("estado", "==", "entregado")
    );
    const snap = await getDocs(q);
    return { ok: true, cantidad: snap.size };
  } catch (error) {
    console.error("Error al contar entregas:", error);
    return { ok: false, cantidad: 0 };
  }
}

// ------------------------------------------------------------
// 11. Helper: ¿está vencida la fecha?
// ------------------------------------------------------------
export function estaVencida(actividad) {
  if (!actividad || !actividad.fechaLimite) return false;
  const f = actividad.fechaLimite;
  const fecha = f.toDate ? f.toDate() : new Date(f.seconds * 1000);
  return fecha < new Date();
}

// ------------------------------------------------------------
// 12. Helper: formatear fecha límite
// ------------------------------------------------------------
export function formatearFechaLimite(actividad) {
  if (!actividad || !actividad.fechaLimite) return "Sin fecha límite";
  const f = actividad.fechaLimite;
  const fecha = f.toDate ? f.toDate() : new Date(f.seconds * 1000);
  return fecha.toLocaleString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}