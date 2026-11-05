// ============================================================
// js/storage.js
// Subida de archivos a Firebase Storage.
// ============================================================

import { app } from "./firebase-config.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const storage = getStorage(app);

// ------------------------------------------------------------
// SUBIR imagen de una unidad
//   archivo: el File del <input type="file">
//   materiaId: ID de la materia (para organizar carpetas)
// Devuelve { ok, url } o { ok:false, error }
// ------------------------------------------------------------
export async function subirImagenUnidad(archivo, materiaId) {
  try {
    if (!archivo) return { ok: false, error: "No se seleccionó archivo" };

    // Validación: debe ser imagen
    if (!archivo.type.startsWith("image/")) {
      return { ok: false, error: "El archivo debe ser una imagen" };
    }

    // Nombre único para evitar colisiones
    const extension = archivo.name.split(".").pop() || "jpg";
    const nombre = `unidades/${materiaId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const storageRef = ref(storage, nombre);
    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);

    return { ok: true, url };
  } catch (error) {
    console.error("Error al subir imagen:", error);

    let mensaje = "No se pudo subir la imagen";
    if (error.code === "storage/unauthorized") mensaje = "Sin permisos para subir (revisa reglas)";
    if (error.code === "storage/canceled")     mensaje = "Subida cancelada";
    if (error.code === "storage/retry-limit-exceeded") mensaje = "Se agotó el tiempo de subida";

    return { ok: false, error: mensaje };
  }
}

// ------------------------------------------------------------
// BORRAR imagen por URL (opcional)
// ------------------------------------------------------------
export async function borrarImagenPorUrl(url) {
  try {
    if (!url) return { ok: false, error: "URL vacía" };
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    return { ok: true };
  } catch (error) {
    console.error("Error al borrar imagen:", error);
    return { ok: false, error: "No se pudo borrar la imagen" };
  }
}