// Fonction debounce améliorée
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false // Paramètre optionnel pour exécuter la fonction immédiatement
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args); // Exécute la fonction après le délai si immediate est false
      }
    };

    const callNow = immediate && !timeout; // Vérifie si l'exécution immédiate est demandée et que timeout est nul
    if (timeout) {
      clearTimeout(timeout); // Effacer le précédent délai
    }
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args); // Exécution immédiate si le paramètre immediate est true
    }
  };
}

// Fonction throttle améliorée
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args); // Exécution de la fonction
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false; // Réinitialisation de la condition de throttle
      }, limit);
    }
  };
}
