import { ref, get, set, child } from 'firebase/database';
import { auth } from '../firebase'; // Assurez-vous d'importer correctement l'instance auth de Firebase
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { GlobalInventory } from '../types/inventory'; // Assurez-vous que l'importation de votre inventaire global est correcte

export const AuthService = {
  // Inscription d'un nouvel utilisateur
  async register(email: string, password: string, username: string): Promise<any> {
    if (!email || !password || !username) {
      throw new Error('Tous les champs sont requis');
    }

    try {
      // Vérification de l'unicité du nom d'utilisateur
      const usersRef = ref(db, 'users');
      const usersSnapshot = await get(usersRef);
      const usersData = usersSnapshot.val() || {};

      const usernameExists = Object.values(usersData).some(user => user.username === username);
      if (usernameExists) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }

      // Créer un nouvel utilisateur avec l'email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = ref(db, `users/${userCredential.user.uid}`);

      // Inventaire initial
      const initialInventory = GlobalInventory.weapons.map(item => ({ ...item, quantity: 1 }));
      const userData = {
        username,
        email,
        role: 'user',
        inventory: initialInventory,
        createdAt: new Date().toISOString()
      };

      // Sauvegarder les données utilisateur dans la Realtime Database
      await set(userRef, userData);

      // Stocker l'ID et le nom d'utilisateur dans localStorage
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('username', username);

      return userData;
    } catch (error: any) {
      const errorMessage = error.message || "Erreur lors de l'inscription";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Connexion de l'utilisateur
  async login(identifier: string, password: string): Promise<any> {
    if (!identifier || !password) {
      throw new Error('Identifiant et mot de passe requis');
    }

    try {
      let email = identifier;

      // Vérification si l'identifiant est un nom d'utilisateur
      if (!identifier.includes('@')) {
        const usersRef = ref(db, 'users');
        const usersSnapshot = await get(usersRef);
        const usersData = usersSnapshot.val() || {};

        const userDoc = Object.values(usersData).find((user: any) => user.username === identifier);
        if (!userDoc) throw new Error('Identifiants incorrects');

        email = userDoc.email;
      }

      // Connexion avec email et mot de passe
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const userDocSnapshot = await get(userRef);

      if (!userDocSnapshot.exists()) {
        throw new Error("Compte utilisateur introuvable");
      }

      const userData = userDocSnapshot.val();

      // Stocker l'ID et le nom d'utilisateur dans localStorage
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('username', userData.username);

      return {
        user: userCredential.user,
        userData
      };
    } catch (error: any) {
      console.error("Erreur de connexion:", error.message);
      throw new Error(error.message || "Identifiants incorrects");
    }
  },

  // Déconnexion de l'utilisateur
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    } catch (error: any) {
      console.error("Erreur de déconnexion:", error.message);
      throw new Error("Erreur lors de la déconnexion");
    }
  }
};
