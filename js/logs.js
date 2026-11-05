// ============================================================
// js/logs.js
// Sistema de auditoría: registra acciones importantes.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COL = "logs";

// ------------------------------------------------------------
// REGISTRAR LOG
// ------------------------------------------------------------
export async function registrarLog(accion, detalle = "", meta = {}) {
  try {
    const user = auth.currentUser;
    if (!user) return { ok: false, error: "Sin sesión" };

    let rol = "desconocido";
    try {
      const { obtenerRol } = await import("./auth.js");
      rol = (await obtenerRol(user.uid)) || "desconocido";
    } catch (_) {}

    await addDoc(collection(db, COL), {
      uid: user.uid,
      email: user.email || "",
      rol,
      accion,
      detalle,
      meta,
      fecha: serverTimestamp()
    });

    return { ok: true };
  } catch (error) {
    console.warn("No se pudo registrar el log:", error);
    return { ok: false, error: error.message };
  }
}

// ------------------------------------------------------------
// LISTAR LOGS (solo admin)
// ------------------------------------------------------------
export async function listarLogs(cantidadMax = 100) {
  try {
    const q = query(
      collection(db, COL),
      orderBy("fecha", "desc"),
      limit(cantidadMax)
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, logs: lista };
  } catch (error) {
    console.error("Error al listar logs:", error);
    return { ok: false, error: "No se pudieron cargar los logs" };
  }
}

// ------------------------------------------------------------
// Formatear fecha
// ------------------------------------------------------------
export function formatearFecha(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (_) {
    return "—";
  }
}