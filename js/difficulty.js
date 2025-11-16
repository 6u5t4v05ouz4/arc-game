// Sistema de Dificuldade Progressiva
import { getCurrentLevel } from './progression.js';
import { TARGET_SPAWN_DELAY, TARGET_LIFETIME, TARGET_MAX_HEALTH } from './config.js';

// Calcula configurações de dificuldade baseadas no nível
export function calculateDifficulty(level) {
    // Velocidade de spawn diminui com o nível
    // spawnDelay = 5000 - (level * 200), mínimo 2000ms
    const spawnDelay = Math.max(2000, TARGET_SPAWN_DELAY - (level * 200));
    
    // Velocidade dos alvos aumenta
    // velocity = 100 + (level * 10), máximo 300
    const baseVelocity = 100;
    const velocity = Math.min(300, baseVelocity + (level * 10));
    
    // Vida dos alvos aumenta gradualmente
    // health = 5 + Math.floor(level / 3)
    const health = TARGET_MAX_HEALTH + Math.floor(level / 3);
    
    // Tempo de vida dos alvos diminui
    // lifetime = 4000 - (level * 100), mínimo 2000ms
    const lifetime = Math.max(2000, TARGET_LIFETIME - (level * 100));
    
    // Máximo de alvos simultâneos aumenta
    // maxTargets = 3 + Math.floor(level / 5)
    const maxTargets = 3 + Math.floor(level / 5);
    
    return {
        spawnDelay,
        velocity,
        health,
        lifetime,
        maxTargets
    };
}

// Obtém dificuldade atual baseada no nível do jogador
export function getCurrentDifficulty() {
    const level = getCurrentLevel();
    return calculateDifficulty(level);
}

