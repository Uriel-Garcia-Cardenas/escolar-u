// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDb5HEkjov6mdyWXlQuNAiE5GBaW60QR18",
  authDomain: "escolar-u.firebaseapp.com",
  projectId: "escolar-u",
  storageBucket: "escolar-u.firebasestorage.app",
  messagingSenderId: "645749406176",
  appId: "1:645749406176:web:004287075b836f7491d385"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// 4. Obtenemos las instancias de Auth y Firestore
const auth = getAuth(app);
const db   = getFirestore(app);

// 5. Exportamos para usarlas en otros archivos
export { app, auth, db };