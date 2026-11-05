// ============================================================
// js/contacto.js
// Gestión de los datos de contacto que se muestran en el inicio.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DOC_REF = doc(db, "configuracion", "contacto");

// Datos por defecto (por si es la primera vez que se abre)
const DATOS_DEFECTO = {
  nombre: "LIANA LOPEZ PACHECO",
  correo: "lizli_lopez@hotmail.com",
  telefono: "+52 55 66 78 78 78",
  facebook: "https://facebook.com/prof.liana",
  horarioOficina: "Lunes a Viernes: 16:00 - 18:00 hrs",
  atencionEnLinea: "Plataforma Teams / Google Meet con cita previa.",
  notaAdicional: "Las demás materias se atienden previa cita.",
  horarioClases: [
    { dia: "Lunes", horario: "10:00 - 12:00", materia: "Informática I", aula: "Aula 1" },
    { dia: "Martes", horario: "14:00 - 16:00", materia: "Programación Visual", aula: "Laboratorio 2" },
    { dia: "Miércoles", horario: "10:00 - 12:00", materia: "Informática I", aula: "Aula 1" },
    { dia: "Jueves", horario: "14:00 - 16:00", materia: "Programación Visual", aula: "Laboratorio 2" },
    { dia: "Viernes", horario: "08:00 - 10:00", materia: "Programación Aplicada a la Ingeniería", aula: "Aula 3" }
  ]
};

// ------------------------------------------------------------
// 1. OBTENER DATOS DE CONTACTO (Público)
// ------------------------------------------------------------
export async function obtenerContacto() {
  try {
    const snap = await getDoc(DOC_REF);
    
    if (snap.exists()) {
      return { ok: true, datos: snap.data() };
    } else {
      // Si no existe, devolvemos los datos por defecto
      return { ok: true, datos: DATOS_DEFECTO, esDefecto: true };
    }
  } catch (error) {
    console.error("Error al obtener contacto:", error);
    return { ok: false, error: "No se pudieron cargar los datos", datos: DATOS_DEFECTO };
  }
}

// ------------------------------------------------------------
// 2. GUARDAR DATOS DE CONTACTO (Staff)
// ------------------------------------------------------------
export async function guardarContacto(datos) {
  try {
    const payload = {
      ...datos,
      actualizadoEn: serverTimestamp()
    };
    
    await setDoc(DOC_REF, payload, { merge: true });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_contacto", `Actualizó los datos de contacto e inicio`, {})
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al guardar contacto:", error);
    return { ok: false, error: "No se pudieron guardar los cambios" };
  }
}