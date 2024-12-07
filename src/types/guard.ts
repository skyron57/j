import { Weapon } from './combat';

// Définir l'interface du gardien
export interface Guard {
  id: string;
  name: string;
  title: string;
  level: number;
  emoji: string;
  health: number;
  money: number;
  createdAt: string;
  active: boolean;
  lastRespawn: string | null;
  stats: {
    strength: number;
    defense: number;
    agility: number;
    dodge: number;
    points: number;
    damageDealt: number;
    damageTaken: number;
  };
  weapon: Weapon & {
    damage: number;
    defense: number;
    deathMessage: string;
  };
  position: {
    area: string;
    lastMove: number;
    isStatic?: boolean;
  };
  inComa: boolean;
  comaStartTime: string | null;
  maxHealth: number;
  behavior: string;
  behaviorDescription: string;
}

// Définir un tableau de gardiens (exemples statiques)
export const GUARDS: Guard[] = [
  {
    id: 'guard-1',
    name: 'jjjjjjjj',
    level: 2,
    emoji: '👮',
    health: 200,
    money: 0,
    createdAt: new Date().toISOString(),
    active: true,
    lastRespawn: null,
    stats: {
      strength: 2,
      defense: 2,
      agility: 2,
      dodge: 2,
      points: 2,
      damageDealt: 0,
      damageTaken: 0
    },
    weapon: {
      id: 'guard-baton-1',
      name: 'Matraque de gardien',
      type: 'weapon',
      damage: 10,
      defense: 5,
      stats: {
        attack: 10,
        defense: 5,
        agility: 0,
        dodge: 0
      },
      emoji: '🏏',
      description: 'Une matraque standard de gardien',
      deathMessage: '{killer} vous a neutralisé avec une matraque de gardien!'
    },
    position: { area: 'yard', lastMove: Date.now() }
  },
  {
    id: 'jjjjjjjjj',
    name: 'Gardien #5',
    level: 4,
    emoji: '👮‍♂️',
    health: 400,
    money: 0,
    createdAt: new Date().toISOString(),
    active: true,
    lastRespawn: null,
    stats: {
      strength: 4,
      defense: 4,
      agility: 4,
      dodge: 4,
      points: 4,
      damageDealt: 0,
      damageTaken: 0
    },
    weapon: {
      id: 'guard-baton-5',
      name: 'Matraque de gardien renforcée',
      type: 'weapon',
      damage: 20,
      defense: 10,
      stats: {
        attack: 20,
        defense: 10,
        agility: 2,
        dodge: 0
      },
      emoji: '🏏',
      description: 'Une matraque de gardien renforcée',
      deathMessage: '{killer} vous a brutalement frappé avec une matraque renforcée!'
    },
    position: { area: 'workshop', lastMove: Date.now() }
  }
];

// Fonction pour infliger des dégâts à un gardien
export const dealDamageToGuard = (guardId: string, damage: number, killer: string) => {
  // Trouver le gardien dans la liste des gardiens actifs
  const guard = GUARDS.find(g => g.id === guardId);

  if (!guard) {
    console.error('Guard not found');
    return;
  }

  // Appliquer les dégâts au gardien
  guard.health -= damage;

  // Si la santé du gardien tombe à zéro ou en dessous, il meurt
  if (guard.health <= 0) {
    // Afficher le message de meurtre
    console.log(guard.weapon.deathMessage.replace('{killer}', killer));

    // Ajouter un message dans la section de l'interface utilisateur pour afficher le meurtre
    displayKillMessage(guard.weapon.deathMessage.replace('{killer}', killer));

    // Regénérer le gardien avec les mêmes statistiques
    respawnGuard(guard);
  }
};

// Fonction pour régénérer un gardien après sa mort
const respawnGuard = (guard: Guard) => {
  // Créer un nouveau gardien avec les mêmes caractéristiques
  const newGuard: Guard = {
    id: `guard-${Date.now()}`, // ID unique pour le nouveau gardien
    name: guard.name,
    level: guard.level,
    emoji: guard.emoji,
    health: guard.health, // Réinitialiser la santé à la valeur de base
    money: guard.money,
    createdAt: new Date().toISOString(),
    active: true,
    lastRespawn: new Date().toISOString(),
    stats: { ...guard.stats }, // Copier les statistiques
    weapon: { ...guard.weapon }, // Copier l'arme
    position: { ...guard.position }, // Copier la position
  };

  // Remplacer l'ancien gardien par le nouveau dans le tableau
  const index = GUARDS.findIndex(g => g.id === guard.id);
  if (index !== -1) {
    GUARDS[index] = newGuard;
  }
};

// Fonction pour afficher le message de meurtre dans la section du jeu (UI)
const displayKillMessage = (message: string) => {
  // Affichage simple dans la console ici, mais tu peux l'intégrer dans l'interface utilisateur de ton jeu
  console.log('Message de meurtre:', message);
};

// Exemple d'utilisation de la fonction pour infliger des dégâts et tuer un gardien
dealDamageToGuard('guard-1', 200, 'Utilisateur123'); // Exemple où le gardien meurt après avoir reçu 200 points de dégâts
