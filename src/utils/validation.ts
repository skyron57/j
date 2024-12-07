import { Guard } from '../types/guard';
import { PrisonerBot } from '../types/prisoner';
import { ActionType } from '../types/location';

// Validation pour s'assurer que l'ID utilisateur est valide pour Firebase
export const validateUserId = (userId: string): boolean => {
  const userIdPattern = /^[a-zA-Z0-9_-]+$/;
  return typeof userId === 'string' && userIdPattern.test(userId);
};

// Validation des actions possibles
export const validateAction = (action: string): action is ActionType => {
  const validActions: ActionType[] = ['attack', 'steal', 'heal'];
  return validActions.includes(action);
};

// Validation de l'utilisateur pour s'assurer qu'il a la structure correcte
export const validateUser = (user: Guard | PrisonerBot): boolean => {
  const userIdPattern = /^[a-zA-Z0-9_-]+$/;
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' && userIdPattern.test(user.id) &&
    typeof user.username === 'string' &&
    typeof user.level === 'number' &&
    typeof user.health === 'number'
  );
};

// Validation des lieux, assurant que le lieu est une chaîne non vide
export const validateLocation = (location: string): boolean => {
  return typeof location === 'string' && location.trim().length > 0;
};
