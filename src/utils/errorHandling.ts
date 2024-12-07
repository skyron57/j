export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const handleError = (error: unknown): string => {
  console.error('Game error:', error);

  if (error instanceof GameError) {
    return error.message;
  }

  if (error instanceof Error) {
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  return 'Une erreur inattendue est survenue.';
};
