export type GuardBehaviorType = 
  | 'aggressive'    // Attaque à vue
  | 'defensive'     // Privilégie la défense, contre-attaque
  | 'patroller'     // Patrouille régulière
  | 'investigator'  // Enquête sur les bruits suspects
  | 'sentinel';     // Reste statique mais très vigilant

export interface GuardBehavior {
  type: GuardBehaviorType;
  aggressionThreshold: number;     // Seuil de déclenchement d'une agression (0-100)
  pursuitDuration: number;         // Durée de poursuite en ms
  patrolRadius: number;            // Rayon de patrouille en unités
  detectionRange: number;          // Portée de détection en unités
  reactionTime: number;            // Temps de réaction en ms
  memory: number;                  // Durée de mémorisation des événements en ms
}

export const GUARD_BEHAVIORS: Record<GuardBehaviorType, GuardBehavior> = {
  aggressive: {
    type: 'aggressive',
    aggressionThreshold: 20,      // Très agressif
    pursuitDuration: 30000,       // Poursuit longtemps
    patrolRadius: 5,
    detectionRange: 8,            // Grande portée de détection
    reactionTime: 500,            // Réaction rapide
    memory: 60000                 // Mémoire moyenne
  },
  defensive: {
    type: 'defensive',
    aggressionThreshold: 60,      // Attaque uniquement si provoqué
    pursuitDuration: 15000,
    patrolRadius: 3,
    detectionRange: 6,
    reactionTime: 800,
    memory: 45000
  },
  patroller: {
    type: 'patroller',
    aggressionThreshold: 40,
    pursuitDuration: 20000,
    patrolRadius: 8,              // Grand rayon de patrouille
    detectionRange: 5,
    reactionTime: 1000,
    memory: 30000
  },
  investigator: {
    type: 'investigator',
    aggressionThreshold: 50,
    pursuitDuration: 25000,
    patrolRadius: 6,
    detectionRange: 7,            // Bonne détection
    reactionTime: 700,
    memory: 90000                 // Longue mémoire
  },
  sentinel: {
    type: 'sentinel',
    aggressionThreshold: 30,
    pursuitDuration: 10000,
    patrolRadius: 2,              // Reste proche de son poste
    detectionRange: 10,           // Excellente détection
    reactionTime: 600,
    memory: 120000               // Très longue mémoire
  }
};
