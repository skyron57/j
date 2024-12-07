import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Nouvelle configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCm_oWgAtZ21b-aWxPo_UMEjuOHF_IUo3s",
  authDomain: "perpette-b5073.firebaseapp.com",
  databaseURL: "https://perpette-b5073-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "perpette-b5073",
  storageBucket: "perpette-b5073.firebasestorage.app",
  messagingSenderId: "857626442492",
  appId: "1:857626442492:web:9f45d36824af0b36743579"
};

// Initialisation de l'application Firebase avec la nouvelle config
const app = initializeApp(firebaseConfig);

// Initialisation des services Firebase
const auth = getAuth(app);           // Service d'authentification
const db = getDatabase(app);         // Service de Realtime Database
const storage = getStorage(app);     // Service de stockage

// Exportation des services pour les utiliser ailleurs dans le projet
export { app, auth, db, storage };
