// ============================================================
// js/solicitudes.js
// Gestión de solicitudes de ingreso para nuevos alumnos.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { crearUsuario, asignarMaterias } from "./usuarios.js";

const COL = "solicitudes";

// ------------------------------------------------------------
// 1. CREAR SOLICITUD (Lo usa el alumno desde el formulario)
// ------------------------------------------------------------
export async function crearSolicitud(datos) {
  try {
    const { nombre, email, password, numCuenta, celular, materias } = datos;
    
    if (!nombre || !email || !password || !numCuenta || !celular) {
      return { ok: false, error: "Todos los campos son obligatorios" };
    }
    if (password.length < 6) {
      return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }

    await addDoc(collection(db, COL), {
      nombre,
      email: email.trim().toLowerCase(),
      password, // Se guarda temporalmente para crearlo en Auth
      numCuenta,
      celular,
      materias: Array.isArray(materias) ? materias : [],
      estado: "pendiente",
      fechaSolicitud: serverTimestamp()
    });

    return { ok: true };
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    return { ok: false, error: "No se pudo enviar la solicitud" };
  }
}

// ------------------------------------------------------------
// 2. LISTAR SOLICITUDES PENDIENTES (Lo usa el admin/supervisor)
// ------------------------------------------------------------
export async function listarSolicitudesPendientes() {
  try {
    const q = query(collection(db, COL), where("estado", "==", "pendiente"));
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    
    // Ordenar por fecha (más recientes primero)
    lista.sort((a, b) => (b.fechaSolicitud?.seconds || 0) - (a.fechaSolicitud?.seconds || 0));
    return { ok: true, solicitudes: lista };
  } catch (error) {
    console.error("Error al listar solicitudes:", error);
    return { ok: false, error: "No se pudieron cargar las solicitudes" };
  }
}

// ------------------------------------------------------------
// 3. APROBAR SOLICITUD
//    Crea el usuario en Firebase Auth y Firestore, y le asigna materias.
// ------------------------------------------------------------
export async function aprobarSolicitud(solicitudId, solicitudData) {
  try {
    const { email, password, nombre, materias } = solicitudData;

    // 1. Creamos el usuario en Auth y Firestore usando la función existente
    const resCrear = await crearUsuario({
      email: email,
      password: password,
      nombre: nombre,
      rol: "alumno"
    });

    if (!resCrear.ok) {
      return { ok: false, error: resCrear.error };
    }

    const nuevoUid = resCrear.uid;

    // 2. Asignamos las materias que seleccionó en la solicitud
    if (materias && materias.length > 0) {
      await asignarMaterias(nuevoUid, materias);
    }

    // 3. Actualizamos el estado de la solicitud y borramos la contraseña por seguridad
    const ref = doc(db, COL, solicitudId);
    await updateDoc(ref, {
      estado: "aprobada",
      password: "***", // Ya no la necesitamos
      fechaAprobacion: serverTimestamp()
    });

    return { ok: true, uid: nuevoUid };
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);
    return { ok: false, error: "No se pudo aprobar la solicitud" };
  }
}

// ------------------------------------------------------------
// 4. RECHAZAR SOLICITUD
// ------------------------------------------------------------
export async function rechazarSolicitud(solicitudId) {
  try {
    const ref = doc(db, COL, solicitudId);
    await updateDoc(ref, {
      estado: "rechazada",
      password: "***", // Borramos la contraseña
      fechaRechazo: serverTimestamp()
    });
    return { ok: true };
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    return { ok: false, error: "No se pudo rechazar la solicitud" };
  }
}
// ------------------------------------------------------------
// 5. CONTAR SOLICITUDES PENDIENTES (Para los dashboards)
// ------------------------------------------------------------
export async function contarSolicitudesPendientes() {
  try {
    const q = query(collection(db, COL), where("estado", "==", "pendiente"));
    const snap = await getDocs(q);
    return { ok: true, cantidad: snap.size };
  } catch (error) {
    console.error("Error al contar solicitudes:", error);
    return { ok: false, cantidad: 0 };
  }
}