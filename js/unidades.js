// ============================================================
// js/unidades.js
// CRUD de unidades + helper para sembrar unidades de ejemplo.
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COL = "unidades";

// ------------------------------------------------------------
// 1. LISTAR unidades de una materia
// ------------------------------------------------------------
export async function listarUnidades(materiaId) {
  try {
    const q = query(
      collection(db, COL),
      where("materiaId", "==", materiaId),
      orderBy("orden", "asc")
    );
    const snap = await getDocs(q);
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    return { ok: true, unidades: lista };
  } catch (error) {
    console.error("Error al listar unidades:", error);
    return { ok: false, error: "No se pudieron cargar las unidades" };
  }
}

// ------------------------------------------------------------
// 2. CREAR unidad
// ------------------------------------------------------------
export async function crearUnidad({ materiaId, titulo, plantilla, contenido, orden }) {
  try {
    if (!materiaId || !titulo || !plantilla) {
      return { ok: false, error: "Faltan campos obligatorios" };
    }
    const datos = {
      materiaId,
      titulo: titulo.trim(),
      plantilla,
      contenido: contenido || {},
      orden: Number(orden) || 99,
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, COL), datos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("crear_unidad", `Creó unidad "${titulo}" (${plantilla})`, { materiaId })
    ).catch(() => {});

    return { ok: true, id: ref.id };
  } catch (error) {
    console.error("Error al crear unidad:", error);
    return { ok: false, error: "No se pudo crear la unidad" };
  }
}

// ------------------------------------------------------------
// 3. ACTUALIZAR unidad
// ------------------------------------------------------------
export async function actualizarUnidad(id, datos) {
  try {
    await updateDoc(doc(db, COL, id), datos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_unidad", `Editó la unidad ${datos.titulo || id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar unidad:", error);
    return { ok: false, error: "No se pudo actualizar la unidad" };
  }
}

// ------------------------------------------------------------
// 4. BORRAR unidad
// ------------------------------------------------------------
export async function borrarUnidad(id) {
  try {
    await deleteDoc(doc(db, COL, id));

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_unidad", `Borró la unidad ${id}`, { id })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al borrar unidad:", error);
    return { ok: false, error: "No se pudo borrar la unidad" };
  }
}

// ------------------------------------------------------------
// 5. SEMBRAR unidades de ejemplo para una materia
// ------------------------------------------------------------
export async function sembrarUnidadesEjemplo(materiaId) {
  const ejemplos = [

        {
      titulo: "Hoja de ejemplo",
      plantilla: "hoja",
      orden: 0,
      contenido: {
        titulo: "Introducción a la programación",
        subtitulo: "Unidad 1 — Conceptos básicos",
        texto:
          "La programación es el proceso de crear instrucciones que una computadora puede ejecutar.\n" +
          "Es una habilidad fundamental en el mundo moderno y se aplica en casi todas las áreas.\n" +
          "\n" +
          "Se divide en varias fases:\n" +
          "  • Análisis del problema\n" +
          "  • Diseño del algoritmo\n" +
          "  • Codificación\n" +
          "  • Pruebas y depuración\n" +
          "\n" +
          "Cada fase es importante y no se puede saltar ninguna si queremos obtener un programa funcional."
      }
    },
    {
      titulo: "Unidad 1: Introducción",
      plantilla: "acordeon",
      orden: 1,
      contenido: {
        secciones: [
          { titulo: "¿Qué es?", texto: "Una introducción general al tema." },
          { titulo: "¿Para qué sirve?", texto: "Aplicaciones principales en el mundo real." },
          { titulo: "Historia", texto: "Breve recorrido histórico." }
        ]
      }
    },
    {
      titulo: "Unidad 2: Conceptos clave",
      plantilla: "tabs",
      orden: 2,
      contenido: {
        pestanas: [
          { nombre: "Definición", texto: "Texto con la definición del concepto." },
          { nombre: "Ejemplos",  texto: "Tres ejemplos prácticos." },
          { nombre: "Errores comunes", texto: "Lo que suele hacerse mal." }
        ]
      }
    },
    {
      titulo: "Unidad 3: Tarjetas de repaso",
      plantilla: "flip",
      orden: 3,
      contenido: {
        tarjetas: [
          { frontal: "HTML",  descripcion: "Lenguaje de marcado", trasera: "HTML",  detalles: ["Estructura", "Etiquetas", "Semántica"] },
          { frontal: "CSS",   descripcion: "Estilos",             trasera: "CSS",   detalles: ["Selectores", "Cascada", "Responsive"] },
          { frontal: "JS",    descripcion: "Comportamiento",      trasera: "JS",    detalles: ["DOM", "Eventos", "Async"] }
        ]
      }
    },
    {
      titulo: "Unidad 4: Línea de tiempo",
      plantilla: "timeline",
      orden: 4,
      contenido: {
        eventos: [
          { titulo: "1970", texto: "Nace el concepto." },
          { titulo: "1995", texto: "Popularización masiva." },
          { titulo: "2010", texto: "Evolución moderna." }
        ]
      }
    },
    {
      titulo: "Unidad 5: Video introductorio",
      plantilla: "video",
      orden: 5,
      contenido: {
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        descripcion: "Video de ejemplo."
      }
    }
  ];

  try {
    const promesas = ejemplos.map((u) =>
      addDoc(collection(db, COL), {
        materiaId,
        ...u,
        createdAt: serverTimestamp()
      })
    );
    await Promise.all(promesas);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("sembrar_unidades", `Sembró ${ejemplos.length} unidades en materia ${materiaId}`, { materiaId })
    ).catch(() => {});

    return { ok: true, cantidad: ejemplos.length };
  } catch (error) {
    console.error("Error al sembrar unidades:", error);
    return { ok: false, error: "No se pudieron crear las unidades de ejemplo" };
  }
}