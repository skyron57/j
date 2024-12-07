import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export const ErrorFallback: React.FC<FallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl prison-font text-red-500 mb-4">Une erreur est survenue</h1>
        <p className="text-gray-400 mb-4">
          {error.message || 'Une erreur inattendue est survenue.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
};
