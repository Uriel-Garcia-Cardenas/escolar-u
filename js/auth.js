// ============================================================
// js/auth.js
// Maneja login, logout y observación de sesión con Firebase.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// 1. LOGIN
// ------------------------------------------------------------
export async function login(email, password) {
  try {
    const credencial = await signInWithEmailAndPassword(auth, email, password);

    // Registrar en logs (no bloqueante)
    import("./logs.js").then(({ registrarLog }) =>
      registrarLog("login", `Inicio de sesión: ${email}`)
    ).catch(() => {});

    return { ok: true, user: credencial.user };
  } catch (error) {
    let mensaje = "Error al iniciar sesión";
    if (error.code === "auth/invalid-credential")  mensaje = "Correo o contraseña incorrectos";
    if (error.code === "auth/user-not-found")      mensaje = "Usuario no encontrado";
    if (error.code === "auth/wrong-password")      mensaje = "Contraseña incorrecta";
    if (error.code === "auth/invalid-email")       mensaje = "Correo inválido";
    if (error.code === "auth/too-many-requests")   mensaje = "Demasiados intentos, espera un momento";
    return { ok: false, error: mensaje };
  }
}

// ------------------------------------------------------------
// 2. LOGOUT
// ------------------------------------------------------------
export async function logout() {
  try {
    const user = auth.currentUser;
    if (user) {
      import("./logs.js").then(({ registrarLog }) =>
        registrarLog("logout", `Cierre de sesión: ${user.email}`)
      ).catch(() => {});
    }
  } catch (_) {}
  await signOut(auth);
}

// ------------------------------------------------------------
// 3. OBTENER ROL
// ------------------------------------------------------------
export async function obtenerRol(uid) {
  try {
    const ref  = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().rol;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener rol:", error);
    return null;
  }
}

// ------------------------------------------------------------
// 4. OBSERVAR SESIÓN
// ------------------------------------------------------------
export function observarSesion(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const rol = await obtenerRol(user.uid);
      callback({ logueado: true, user, rol });
    } else {
      callback({ logueado: false, user: null, rol: null });
    }
  });
}