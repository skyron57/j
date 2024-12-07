// Énumération pour les états du garde
enum GuardState {
    PATROL = 'patrol',
    INVESTIGATE = 'investigate',
    PURSUE = 'pursue',
    ALERT = 'alert'
}

// Interface pour les positions
interface Position {
    x: number;
    y: number;
}

// Interface pour la configuration du garde
interface GuardConfig {
    thinkInterval?: number;
    memoryDecay?: number;
    minPatrolPoints?: number;
    maxPatrolPoints?: number;
}

export class GuardAI {
    private lastThinkTime: number = 0;
    private readonly THINK_INTERVAL: number;
    private readonly MEMORY_DECAY: number;
    private suspicionLevel: number = 0;
    private lastKnownPlayerPosition: Position | null = null;
    private patrolPoints: Position[] = [];
    private currentPatrolIndex: number = 0;
    private currentState: GuardState = GuardState.PATROL;
    private stateChangeCallbacks: ((state: GuardState) => void)[] = [];
    private distanceCache: Map<string, number> = new Map();
    private lastPlayerNoise: number = 0;
    private alertOtherGuards: ((position: Position, suspicionLevel: number) => void) | null = null;
    private stateTimer: number = 0;
    private readonly STATE_TIMEOUT = 5000; // 5 secondes avant de revenir à la patrouille

    constructor(
        private guard: GameEntity,
        private behavior: GuardBehavior,
        config?: GuardConfig
    ) {
        this.THINK_INTERVAL = config?.thinkInterval || 1000;
        this.MEMORY_DECAY = config?.memoryDecay || 0.95;
        this.initializePatrolPoints(config?.minPatrolPoints || 2, config?.maxPatrolPoints || 4);
        this.validateGuardPosition();
    }

    private validateGuardPosition(): void {
        if (!this.guard.position || typeof this.guard.position.x !== 'number' || typeof this.guard.position.y !== 'number') {
            throw new Error('Invalid guard position');
        }
    }

    private initializePatrolPoints(min: number, max: number): void {
        const numPoints = Math.floor(Math.random() * (max - min + 1)) + min;
        const angleStep = (2 * Math.PI) / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = angleStep * i;
            const radius = Math.random() * this.behavior.patrolRadius;
            this.patrolPoints.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    }

    public setAlertCallback(callback: (position: Position, suspicionLevel: number) => void): void {
        this.alertOtherGuards = callback;
    }

    public onStateChange(callback: (state: GuardState) => void): void {
        this.stateChangeCallbacks.push(callback);
    }

    private setState(newState: GuardState): void {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.stateChangeCallbacks.forEach(callback => callback(newState));
            this.stateTimer = Date.now();
        }
    }

    public receiveAlert(position: Position, suspicionLevel: number): void {
        // Réagir aux alertes d'autres gardes
        this.suspicionLevel = Math.max(this.suspicionLevel, suspicionLevel * 0.7);
        this.lastKnownPlayerPosition = position;
        if (this.currentState === GuardState.PATROL) {
            this.setState(GuardState.INVESTIGATE);
        }
    }

    public think(playerPosition: Position, noise: number): void {
        const now = Date.now();
        if (now - this.lastThinkTime < this.THINK_INTERVAL) return;
        this.lastThinkTime = now;

        // Vérifier le timeout d'état
        if (now - this.stateTimer > this.STATE_TIMEOUT && 
            this.currentState !== GuardState.PATROL) {
            this.setState(GuardState.PATROL);
        }

        const distance = this.calculateDistance(playerPosition);
        this.updateSuspicion(distance, noise);
        this.lastPlayerNoise = noise;

        // Prise de décision avec état d'alerte
        if (this.suspicionLevel > this.behavior.aggressionThreshold) {
            this.setState(GuardState.PURSUE);
            this.pursue(playerPosition);
            if (this.alertOtherGuards) {
                this.alertOtherGuards(playerPosition, this.suspicionLevel);
            }
        } else if (this.suspicionLevel > this.behavior.aggressionThreshold / 2) {
            this.setState(GuardState.INVESTIGATE);
            this.investigate(playerPosition);
        } else {
            this.setState(GuardState.PATROL);
            this.patrol();
        }

        // Décroissance de la suspicion avec bonus de vigilance
        this.suspicionLevel *= this.MEMORY_DECAY;
        if (this.lastPlayerNoise > 0) {
            this.suspicionLevel *= 0.98; // Décroissance plus lente si du bruit a été détecté
        }
    }

    private getCacheKey(position: Position): string {
        return `${position.x},${position.y}`;
    }

    private calculateDistance(position: Position): number {
        const cacheKey = this.getCacheKey(position);
        if (this.distanceCache.has(cacheKey)) {
            return this.distanceCache.get(cacheKey)!;
        }

        const dx = position.x - this.guard.position!.x;
        const dy = position.y - this.guard.position!.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.distanceCache.set(cacheKey, distance);
        setTimeout(() => this.distanceCache.delete(cacheKey), 1000); // Cache d'1 seconde
        
        return distance;
    }

    private updateSuspicion(distance: number, noise: number): void {
        // Facteurs environnementaux
        const timeOfDay = (Date.now() % 86400000) / 86400000; // 0-1 pour le cycle jour/nuit
        const nightFactor = timeOfDay < 0.25 || timeOfDay > 0.75 ? 1.2 : 1; // Vigilance accrue la nuit

        if (distance < this.behavior.detectionRange) {
            const proximityFactor = 1 + ((this.behavior.detectionRange - distance) / this.behavior.detectionRange);
            this.suspicionLevel += (this.behavior.detectionRange - distance) * 2 * proximityFactor * nightFactor;
        }

        if (noise > 0) {
            const noiseFactor = Math.min(noise * (this.behavior.detectionRange / Math.max(distance, 1)), 10);
            this.suspicionLevel += noiseFactor * nightFactor;
        }

        this.suspicionLevel = Math.min(100, Math.max(0, this.suspicionLevel));
    }

    private pursue(playerPosition: Position): void {
        this.lastKnownPlayerPosition = playerPosition;
        this.moveTo(playerPosition);
    }

    private investigate(position: Position): void {
        // Ajouter un peu de randomisation dans l'investigation
        const jitter = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        
        this.moveTo({
            x: position.x + jitter.x,
            y: position.y + jitter.y
        });
    }

    private patrol(): void {
        if (this.patrolPoints.length === 0) return;

        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const distanceToTarget = this.calculateDistance(targetPoint);
        
        if (distanceToTarget < 0.5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            // Ajouter une pause aléatoire aux points de patrouille
            setTimeout(() => this.moveTo(this.patrolPoints[this.currentPatrolIndex]), 
                      Math.random() * 1000 + 500);
        } else {
            this.moveTo(targetPoint);
        }
    }

    private moveTo(position: Position): void {
        // Calculer la direction
        const dx = position.x - this.guard.position!.x;
        const dy = position.y - this.guard.position!.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const speed = this.currentState === GuardState.PURSUE ? 
                         this.behavior.speed * 1.5 : this.behavior.speed;

            // Normaliser et appliquer la vitesse
            const velocityX = (dx / distance) * speed;
            const velocityY = (dy / distance) * speed;

            // Mise à jour de la position du garde (à implémenter selon le système de mouvement du jeu)
            // this.guard.position.x += velocityX;
            // this.guard.position.y += velocityY;
        }
    }

    public getState(): GuardState {
        return this.currentState;
    }

    public getSuspicionLevel(): number {
        return this.suspicionLevel;
    }

    public getLastKnownPlayerPosition(): Position | null {
        return this.lastKnownPlayerPosition;
    }

    // Nouvelle méthode pour réinitialiser le garde
    public reset(): void {
        this.suspicionLevel = 0;
        this.lastKnownPlayerPosition = null;
        this.currentPatrolIndex = 0;
        this.setState(GuardState.PATROL);
        this.distanceCache.clear();
        this.lastPlayerNoise = 0;
    }
}
