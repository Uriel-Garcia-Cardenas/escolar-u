// ============================================================
// js/materias.js
// CRUD de materias en Firestore.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLECCION = "materias";

// ------------------------------------------------------------
// 1. LISTAR todas las materias ordenadas por "orden"
// ------------------------------------------------------------
export async function listarMaterias() {
  try {
    const q = query(collection(db, COLECCION), orderBy("orden", "asc"));
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, materias: lista };
  } catch (error) {
    console.error("Error al listar materias:", error);
    return { ok: false, error: "No se pudieron cargar las materias" };
  }
}

// ------------------------------------------------------------
// 2. OBTENER una materia por ID
// ------------------------------------------------------------
export async function obtenerMateria(id) {
  try {
    const snap = await getDoc(doc(db, COLECCION, id));
    if (!snap.exists()) return { ok: false, error: "Materia no encontrada" };
    return { ok: true, materia: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener materia:", error);
    return { ok: false, error: "No se pudo cargar la materia" };
  }
}

// ------------------------------------------------------------
// 3. CREAR materia
// ------------------------------------------------------------
export async function crearMateria({ nombre, descripcion, imagen, orden, profesorUid }) {
  try {
    if (!nombre || !descripcion) {
      return { ok: false, error: "Nombre y descripción son obligatorios" };
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen || "assets/images/programacion.jpg",
      orden: Number(orden) || 99,
      profesorUid: profesorUid || null,
      createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, COLECCION), datos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("crear_materia", `Creó la materia "${datos.nombre}"`, { materiaId: ref.id })
    ).catch(() => {});

    return { ok: true, id: ref.id };
  } catch (error) {
    console.error("Error al crear materia:", error);
    return { ok: false, error: "No se pudo crear la materia" };
  }
}

// ------------------------------------------------------------
// 4. ACTUALIZAR materia
// ------------------------------------------------------------
export async function actualizarMateria(id, datos) {
  try {
    await updateDoc(doc(db, COLECCION, id), datos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_materia", `Editó la materia ${datos.nombre || id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar materia:", error);
    return { ok: false, error: "No se pudo actualizar la materia" };
  }
}

// ------------------------------------------------------------
// 5. BORRAR materia
// ------------------------------------------------------------
export async function borrarMateria(id) {
  try {
    await deleteDoc(doc(db, COLECCION, id));

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_materia", `Borró la materia ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al borrar materia:", error);
    return { ok: false, error: "No se pudo borrar la materia" };
  }
}

// ------------------------------------------------------------
// 6. SEMBRAR materias iniciales
// ------------------------------------------------------------
export async function sembrarMateriasIniciales() {
  const iniciales = [
    { nombre: "Informática I", descripcion: "Conceptos, principios y teorías fundamentales de la informática y la computación, así como su proyección social.", orden: 1 },
    { nombre: "Programación Visual", descripcion: "Desarrollo de programas de alta calidad con técnicas para crear interfaces visuales y eventos.", orden: 2 },
    { nombre: "Programación Aplicada a la Ingeniería", descripcion: "Estructura de la computadora, fundamentos de programación estructurada y desarrollo de programas.", orden: 3 },
    { nombre: "Computación para Ingeniería", descripcion: "Conocimiento de la estructura y funcionamiento de la computadora y programación estructurada.", orden: 4 },
    { nombre: "Seguridad Informática", descripcion: "Problemática de la seguridad informática, vulnerabilidades, normatividad y protección.", orden: 5 },
    { nombre: "Tópicos Selectos de Informática", descripcion: "Robótica, inteligencia artificial, sistemas concurrentes y lenguajes formales.", orden: 6 },
    { nombre: "Comercio Electrónico", descripcion: "Uso de Internet como instrumento de comercio, ventajas de la empresa en la web y aspectos legales.", orden: 7 },
    { nombre: "Análisis de Redes de Datos", descripcion: "Modelado, simulación y análisis de redes de datos para optimización.", orden: 8 }
  ];

  try {
    const promesas = iniciales.map((m) =>
      addDoc(collection(db, COLECCION), {
        ...m,
        imagen: "assets/images/programacion.jpg",
        profesorUid: null,
        createdAt: serverTimestamp()
      })
    );
    await Promise.all(promesas);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("sembrar_materias", `Sembró ${iniciales.length} materias iniciales`, { cantidad: iniciales.length })
    ).catch(() => {});

    return { ok: true, cantidad: iniciales.length };
  } catch (error) {
    console.error("Error al sembrar materias:", error);
    return { ok: false, error: "No se pudieron crear las materias iniciales" };
  }
}