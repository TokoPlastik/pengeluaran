// Import SDK Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBGjQ_YvzaoimBW9sSpumQ8eF2O1s4okGo",
  authDomain: "pengeluaran-364cf.firebaseapp.com",
  projectId: "pengeluaran-364cf",
  storageBucket: "pengeluaran-364cf.firebasestorage.app",
  messagingSenderId: "724682926759",
  appId: "1:724682926759:web:a8578e0915bd8150600982",
  measurementId: "G-1R9XV98EDC"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export db agar bisa dipakai di app.js
export { db, collection };