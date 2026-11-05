// ============================================================
// js/usuarios.js
// Funciones de gestión de usuarios (solo admin).
// ============================================================

import { auth, db } from "./firebase-config.js";

import {
  initializeApp,
  deleteApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb5HEkjov6mdyWXlQuNAiE5GBaW60QR18",
  authDomain: "escolar-u.firebaseapp.com",
  projectId: "escolar-u",
  storageBucket: "escolar-u.firebasestorage.app",
  messagingSenderId: "645749406176",
  appId: "1:645749406176:web:004287075b836f7491d385"
};

// ------------------------------------------------------------
// 1. CREAR USUARIO
// ------------------------------------------------------------
export async function crearUsuario({ email, password, nombre, rol }) {
  if (!email || !password || !nombre || !rol) {
    return { ok: false, error: "Todos los campos son obligatorios" };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (!["admin", "supervisor", "alumno"].includes(rol)) {
    return { ok: false, error: "Rol inválido" };
  }

  let appSecundaria = null;

  try {
    const nombreApp = "appSecundaria_" + Date.now();
    appSecundaria = initializeApp(firebaseConfig, nombreApp);
    const authSecundaria = getAuth(appSecundaria);

    const cred = await createUserWithEmailAndPassword(authSecundaria, email, password);
    const uid = cred.user.uid;

    await signOut(authSecundaria);
    await deleteApp(appSecundaria);
    appSecundaria = null;

    await setDoc(doc(db, "users", uid), {
      nombre,
      email,
      rol,
      activo: true,
      materiasAsignadas: [],
      createdAt: serverTimestamp()
    });

    // Log
    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("crear_usuario", `Creó usuario ${email} (${rol})`, { email, rol, uid })
    ).catch(() => {});

    return { ok: true, uid };
  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (appSecundaria) {
      try { await deleteApp(appSecundaria); } catch (_) {}
    }

    let mensaje = "Error al crear usuario";
    if (error.code === "auth/email-already-in-use") mensaje = "Ese correo ya está registrado";
    if (error.code === "auth/invalid-email")       mensaje = "Correo inválido";
    if (error.code === "auth/weak-password")       mensaje = "Contraseña muy débil";
    if (error.code === "permission-denied")        mensaje = "Sin permisos (revisa reglas de Firestore)";

    return { ok: false, error: mensaje };
  }
}

// ------------------------------------------------------------
// 2. LISTAR USUARIOS
// ------------------------------------------------------------
export async function listarUsuarios() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const lista = [];
    snap.forEach((d) => lista.push({ uid: d.id, ...d.data() }));
    return { ok: true, usuarios: lista };
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return { ok: false, error: "No se pudieron cargar los usuarios" };
  }
}

// ------------------------------------------------------------
// 3. ACTUALIZAR ROL
// ------------------------------------------------------------
export async function actualizarRol(uid, nuevoRol) {
  try {
    await updateDoc(doc(db, "users", uid), { rol: nuevoRol });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("cambiar_rol", `Cambió rol de ${uid} a ${nuevoRol}`, { uid, nuevoRol })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return { ok: false, error: "No se pudo actualizar el rol" };
  }
}

// ------------------------------------------------------------
// 4. ACTIVAR / DESACTIVAR
// ------------------------------------------------------------
export async function cambiarActivo(uid, activo) {
  try {
    await updateDoc(doc(db, "users", uid), { activo });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("cambiar_activo", `${activo ? "Activó" : "Desactivó"} al usuario ${uid}`, { uid, activo })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al cambiar activo:", error);
    return { ok: false, error: "No se pudo cambiar el estado" };
  }
}

// ------------------------------------------------------------
// 5. BORRAR DOCUMENTO DE USUARIO
// ------------------------------------------------------------
export async function borrarUsuarioDoc(uid) {
  try {
    await deleteDoc(doc(db, "users", uid));

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("borrar_usuario", `Borró documento de usuario ${uid}`, { uid })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al borrar usuario:", error);
    return { ok: false, error: "No se pudo borrar el usuario" };
  }
}

// ------------------------------------------------------------
// 6. ENVIAR RESET DE CONTRASEÑA
// ------------------------------------------------------------
export async function enviarResetPassword(email) {
  try {
    if (!email) return { ok: false, error: "Correo vacío" };

    await sendPasswordResetEmail(auth, email);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("reset_password", `Envió reset de contraseña a ${email}`, { email })
    ).catch(() => {});

    return { ok: true, mensaje: `Correo de restablecimiento enviado a ${email}` };
  } catch (error) {
    console.error("Error al enviar reset:", error);

    let mensaje = "No se pudo enviar el correo";
    if (error.code === "auth/user-not-found") mensaje = "Ese correo no está registrado";
    if (error.code === "auth/invalid-email")  mensaje = "Correo inválido";

    return { ok: false, error: mensaje };
  }
}

// ------------------------------------------------------------
// 7. ASIGNAR MATERIAS A UN ALUMNO
// ------------------------------------------------------------
export async function asignarMaterias(uid, materiasIds) {
  try {
    if (!Array.isArray(materiasIds)) {
      return { ok: false, error: "Formato de materias inválido" };
    }
    await updateDoc(doc(db, "users", uid), {
      materiasAsignadas: materiasIds
    });

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("asignar_materias", `Asignó ${materiasIds.length} materias al alumno ${uid}`, { uid, materiasIds })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al asignar materias:", error);
    return { ok: false, error: "No se pudieron asignar las materias" };
  }
}

// ------------------------------------------------------------
// 8. OBTENER UN USUARIO POR UID
// ------------------------------------------------------------
export async function obtenerUsuario(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return { ok: false, error: "Usuario no encontrado" };
    return { ok: true, usuario: { uid: snap.id, ...snap.data() } };
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return { ok: false, error: "No se pudo cargar el usuario" };
  }
}

// ------------------------------------------------------------
// 9. ACTUALIZAR PERFIL (alumno edita sus propios campos)
// ------------------------------------------------------------
export async function actualizarPerfil(uid, datos) {
  try {
    const permitidos = {};
    const campos = ["nombre", "telefono", "direccion", "biografia", "fotoUrl"];
    campos.forEach((c) => {
      if (c in datos) permitidos[c] = datos[c] ?? "";
    });

    await updateDoc(doc(db, "users", uid), permitidos);

    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("editar_perfil", `Actualizó su perfil`, { uid })
    ).catch(() => {});

    return { ok: true };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return { ok: false, error: "No se pudo actualizar el perfil" };
  }
}