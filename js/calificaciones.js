// ============================================================
// js/calificaciones.js
// CRUD de calificaciones con soporte para parciales dinámicos.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COL = "calificaciones";

function idDoc(alumnoUid, materiaId) {
  return `${alumnoUid}_${materiaId}`;
}

// ------------------------------------------------------------
// 1. OBTENER una calificación específica
// ------------------------------------------------------------
export async function obtenerCalificacion(alumnoUid, materiaId) {
  try {
    const ref  = doc(db, COL, idDoc(alumnoUid, materiaId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ok: true, calificacion: null };
    return { ok: true, calificacion: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener calificación:", error);
    return { ok: false, error: "No se pudo cargar la calificación" };
  }
}

// ------------------------------------------------------------
// 2. GUARDAR (crea o actualiza) una calificación
// ------------------------------------------------------------
export async function guardarCalificacion(datos) {
  try {
    const {
      alumnoUid, alumnoNombre, alumnoEmail,
      materiaId, materiaNombre,
      notas, // <-- Ahora es un objeto dinámico { "Parcial 1": 8, "Final": 9 }
      actualizadoPor
    } = datos;

    if (!alumnoUid || !materiaId) {
      return { ok: false, error: "Faltan datos obligatorios" };
    }

    const id = idDoc(alumnoUid, materiaId);
    const ref = doc(db, COL, id);

    await setDoc(ref, {
      alumnoUid,
      alumnoNombre:  alumnoNombre  || "",
      alumnoEmail:   alumnoEmail   || "",
      materiaId,
      materiaNombre: materiaNombre || "",
      notas: notas || {}, // Guardamos el objeto dinámico
      actualizadoEn: serverTimestamp(),
      actualizadoPor: actualizadoPor || null
    }, { merge: true });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("guardar_calificacion",
        `Calificó a ${alumnoNombre || alumnoUid} en ${materiaNombre || materiaId}`,
        { alumnoUid, materiaId })
    ).catch(() => {});

    return { ok: true, id };
  } catch (error) {
    console.error("Error al guardar calificación:", error);
    return { ok: false, error: "No se pudo guardar la calificación" };
  }
}

// ------------------------------------------------------------
// 3. LISTAR calificaciones por materia
// ------------------------------------------------------------
export async function listarCalificacionesPorMateria(materiaId) {
  try {
    const q = query(collection(db, COL), where("materiaId", "==", materiaId));
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, calificaciones: lista };
  } catch (error) {
    console.error("Error al listar calificaciones:", error);
    return { ok: false, error: "No se pudieron cargar las calificaciones" };
  }
}

// ------------------------------------------------------------
// 4. LISTAR calificaciones por alumno
// ------------------------------------------------------------
export async function listarCalificacionesPorAlumno(alumnoUid) {
  try {
    const q = query(collection(db, COL), where("alumnoUid", "==", alumnoUid));
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, calificaciones: lista };
  } catch (error) {
    console.error("Error al listar calificaciones del alumno:", error);
    return { ok: false, error: "No se pudieron cargar tus calificaciones" };
  }
}

// ------------------------------------------------------------
// 5. BORRAR calificación
// ------------------------------------------------------------
export async function borrarCalificacion(alumnoUid, materiaId) {
  try {
    await deleteDoc(doc(db, COL, idDoc(alumnoUid, materiaId)));
    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_calificacion", `Borró la calificación de ${alumnoUid} en ${materiaId}`, { alumnoUid, materiaId })
    ).catch(() => {});
    return { ok: true };
  } catch (error) {
    console.error("Error al borrar calificación:", error);
    return { ok: false, error: "No se pudo borrar la calificación" };
  }
}

// ------------------------------------------------------------
// 6. PROMEDIO (helper dinámico)
// ------------------------------------------------------------
export function calcularPromedio(cal) {
  if (!cal) return null;
  
  // Compatibilidad con el formato viejo (parcial1, parcial2...)
  let notasObj = cal.notas || {};
  if (Object.keys(notasObj).length === 0) {
      if (cal.parcial1 != null) notasObj["Parcial 1"] = cal.parcial1;
      if (cal.parcial2 != null) notasObj["Parcial 2"] = cal.parcial2;
      if (cal.parcial3 != null) notasObj["Parcial 3"] = cal.parcial3;
      if (cal.final != null) notasObj["Final"] = cal.final;
  }

  const notas = Object.values(notasObj).filter(n => typeof n === "number");
  if (notas.length === 0) return null;
  const suma = notas.reduce((a, b) => a + b, 0);
  return (suma / notas.length).toFixed(2);
}