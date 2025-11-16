// Tipos de Alvos e Lógica de Spawn
import { getCurrentLevel } from './progression.js';

// Tipos de alvos disponíveis
export const TARGET_TYPES = {
    NORMAL: 'normal',
    FAST: 'fast',
    TANK: 'tank',
    SPECIAL: 'special'
};

// Propriedades de cada tipo de alvo
export const TARGET_PROPERTIES = {
    [TARGET_TYPES.NORMAL]: {
        name: 'Normal',
        health: 5,
        killValue: 1,
        speed: 1.0,
        size: 1.0,
        glowColor: 0x00ff00, // Verde
        spawnWeight: 100
    },
    [TARGET_TYPES.FAST]: {
        name: 'Rápido',
        health: 3,
        killValue: 1,
        speed: 2.0,
        size: 0.8,
        glowColor: 0x00ffff, // Ciano
        spawnWeight: 0 // Desbloqueado no nível 5
    },
    [TARGET_TYPES.TANK]: {
        name: 'Tank',
        health: 10,
        killValue: 3,
        speed: 0.5,
        size: 1.3,
        glowColor: 0xffaa00, // Dourado
        spawnWeight: 0 // Desbloqueado no nível 10
    },
    [TARGET_TYPES.SPECIAL]: {
        name: 'Especial',
        health: 7,
        killValue: 5,
        speed: 1.5,
        size: 1.1,
        glowColor: 0xff00ff, // Magenta
        spawnWeight: 0 // Desbloqueado no nível 20
    }
};

// Probabilidades de spawn por nível
const SPAWN_PROBABILITIES = {
    // Níveis 1-5: 100% Normal
    1: { [TARGET_TYPES.NORMAL]: 100 },
    5: { [TARGET_TYPES.NORMAL]: 100 },
    
    // Níveis 6-10: 80% Normal, 20% Rápido
    6: { [TARGET_TYPES.NORMAL]: 80, [TARGET_TYPES.FAST]: 20 },
    10: { [TARGET_TYPES.NORMAL]: 80, [TARGET_TYPES.FAST]: 20 },
    
    // Níveis 11-15: 60% Normal, 30% Rápido, 10% Tank
    11: { [TARGET_TYPES.NORMAL]: 60, [TARGET_TYPES.FAST]: 30, [TARGET_TYPES.TANK]: 10 },
    15: { [TARGET_TYPES.NORMAL]: 60, [TARGET_TYPES.FAST]: 30, [TARGET_TYPES.TANK]: 10 },
    
    // Níveis 16+: 50% Normal, 25% Rápido, 20% Tank, 5% Especial
    16: { 
        [TARGET_TYPES.NORMAL]: 50, 
        [TARGET_TYPES.FAST]: 25, 
        [TARGET_TYPES.TANK]: 20, 
        [TARGET_TYPES.SPECIAL]: 5 
    }
};

// Obtém tipo de alvo baseado no nível atual
export function getTargetType(level) {
    // Determina qual faixa de probabilidade usar
    let probabilitySet = SPAWN_PROBABILITIES[1]; // Default
    
    if (level >= 16) {
        probabilitySet = SPAWN_PROBABILITIES[16];
    } else if (level >= 11) {
        probabilitySet = SPAWN_PROBABILITIES[11];
    } else if (level >= 6) {
        probabilitySet = SPAWN_PROBABILITIES[6];
    }
    
    // Gera número aleatório de 0 a 100
    const random = Math.random() * 100;
    let cumulative = 0;
    
    // Seleciona tipo baseado em probabilidade
    for (const [type, probability] of Object.entries(probabilitySet)) {
        cumulative += probability;
        if (random <= cumulative) {
            return type;
        }
    }
    
    // Fallback para Normal
    return TARGET_TYPES.NORMAL;
}

// Obtém propriedades de um tipo de alvo
export function getTargetProperties(type) {
    return TARGET_PROPERTIES[type] || TARGET_PROPERTIES[TARGET_TYPES.NORMAL];
}

// Verifica se um tipo está desbloqueado para o nível atual
export function isTargetTypeUnlocked(type, level) {
    switch (type) {
        case TARGET_TYPES.NORMAL:
            return true; // Sempre desbloqueado
        case TARGET_TYPES.FAST:
            return level >= 5;
        case TARGET_TYPES.TANK:
            return level >= 10;
        case TARGET_TYPES.SPECIAL:
            return level >= 20;
        default:
            return false;
    }
}

// Obtém tipo de alvo aleatório considerando nível e desbloqueios
export function getRandomTargetType() {
    const level = getCurrentLevel();
    const type = getTargetType(level);
    
    // Verifica se o tipo está desbloqueado, se não, retorna Normal
    if (isTargetTypeUnlocked(type, level)) {
        return type;
    }
    
    return TARGET_TYPES.NORMAL;
}

