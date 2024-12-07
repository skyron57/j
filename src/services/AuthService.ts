import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, set, get } from "firebase/database";

export class AuthService {
  // Enregistrer un utilisateur avec email et mot de passe
  static async register(email: string, password: string, username: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Initialiser les données de l'utilisateur dans Realtime Database
      const initialUserData = {
        id: userId,
        username,
        email,
        role: 'user', // Par défaut, les nouveaux utilisateurs sont des utilisateurs normaux
        health: 100,
        actionPoints: 30,
        movementPoints: 10,
        money: 500,
        location: 'cell',
        inventory: [
          {
            id: crypto.randomUUID(),
            name: 'Bâton',
            type: 'weapon',
            stats: {
              attack: 4,
              defense: 2,
              agility: 1,
              dodge: -1
            },
            durability: {
              current: 100,
              max: 100
            },
            equipped: false,
            emoji: '🏏',
            description: 'Un bâton solide trouvé dans la cour'
          },
          {
            id: crypto.randomUUID(),
            name: 'Bandage',
            type: 'consumable',
            description: 'Un bandage stérile pour les blessures moyennes.',
            emoji: '🩹',
            quantity: 5,
            effect: { type: 'health', value: 10 }
          },
          {
            id: crypto.randomUUID(),
            name: 'Compresse',
            type: 'consumable',
            description: 'Une compresse stérile pour les petites blessures.',
            emoji: '🩹',
            quantity: 5,
            effect: { type: 'health', value: 5 }
          },
          {
            id: crypto.randomUUID(),
            name: 'Seringue',
            type: 'consumable',
            description: 'Une seringue stérile pour les blessures graves.',
            emoji: '💉',
            quantity: 5,
            effect: { type: 'health', value: 15 }
          },
          {
            id: crypto.randomUUID(),
            name: 'Boisson énergisante',
            type: 'consumable',
            description: 'Restaure immédiatement des points d\'action.',
            emoji: '🥤',
            quantity: 1,
            effect: { type: 'actionPoints', value: 5 }
          },
          {
            id: crypto.randomUUID(),
            name: 'Anabolisant',
            type: 'consumable',
            description: 'Augmente temporairement la limite de points d\'action.',
            emoji: '💉',
            quantity: 1,
            effect: { type: 'anabolic', value: 1 }
          },
          {
            id: crypto.randomUUID(),
            name: 'Réveil',
            type: 'consumable',
            description: 'Permet de sortir du coma plus rapidement.',
            emoji: '⏰',
            quantity: 1,
            effect: { type: 'revive', value: 1 }
          }
        ],
        quickInventory: [],
        stats: {
          level: 0,
          strength: 5,
          defense: 5,
          agility: 5,
          dodge: 5,
          damageDealt: 0,
          damageTaken: 0,
          missedAttacks: 0,
          dodgedAttacks: 0
        },
        trainingProgress: null,
        taskProgress: {},
        activeAnabolic: {
          endTime: null,
          bonusAP: 0
        },
        inComa: false,
        comaStartTime: null,
        comaEndTime: null,
        hasRevive: false,
        history: [],
        morale: 100,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      };

      try {
        // Créer le document utilisateur dans Realtime Database
        const userRef = ref(db, `users/${userId}`);
        await set(userRef, initialUserData);

        // Stocker les informations dans le localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', 'user'); // Stocker le rôle par défaut
      } catch (dbError) {
        console.error('Error creating user data:', dbError);
        throw new Error('Erreur lors de la création des données utilisateur');
      }

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // Se connecter avec email et mot de passe
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Récupérer les données utilisateur
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('Compte utilisateur introuvable');
      }

      const userData = snapshot.val();

      // Stocker les informations dans le localStorage
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('username', userData?.username || email.split('@')[0]);
      localStorage.setItem('userRole', userData?.role || 'user');

      return userData;
    } catch (error) {
      throw error;
    }
  }

  // Se déconnecter
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
      
      // Nettoyer le localStorage
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    } catch (error) {
      throw error;
    }
  }
}
