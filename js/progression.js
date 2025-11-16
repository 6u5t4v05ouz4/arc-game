// Sistema de Níveis e Progressão
import { getStat, updateStat, incrementStat, getAllStats } from './stats.js';

// Fórmula de nível: level = Math.floor(Math.sqrt(totalKills / 10)) + 1
export function calculateLevel(totalKills) {
    return Math.floor(Math.sqrt(totalKills / 10)) + 1;
}

// Calcula XP necessário para um nível específico
export function getXPForLevel(level) {
    // XP necessário = (level - 1)² * 10
    return Math.pow(level - 1, 2) * 10;
}

// Calcula XP atual do jogador (kills totais)
export function getCurrentXP() {
    return getStat('totalKills') || 0;
}

// Calcula XP necessário para próximo nível
export function getXPForNextLevel() {
    const currentLevel = getCurrentLevel();
    const nextLevel = currentLevel + 1;
    return getXPForLevel(nextLevel);
}

// Obtém nível atual
export function getCurrentLevel() {
    const totalKills = getStat('totalKills') || 0;
    return calculateLevel(totalKills);
}

// Calcula progresso para próximo nível (0 a 1)
export function getLevelProgress() {
    const currentXP = getCurrentXP();
    const currentLevel = getCurrentLevel();
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    
    if (xpNeededForNext === 0) return 1;
    return Math.min(1, xpInCurrentLevel / xpNeededForNext);
}

// Verifica se subiu de nível após adicionar kills
export function checkLevelUp(newTotalKills) {
    const oldLevel = getCurrentLevel();
    const newLevel = calculateLevel(newTotalKills);
    
    if (newLevel > oldLevel) {
        updateStat('level', newLevel);
        return {
            leveledUp: true,
            oldLevel: oldLevel,
            newLevel: newLevel
        };
    }
    
    return {
        leveledUp: false,
        oldLevel: oldLevel,
        newLevel: newLevel
    };
}

// Desbloqueios por nível
export const LEVEL_UNLOCKS = {
    5: {
        name: 'Alvos Rápidos',
        description: 'Alvos mais rápidos agora aparecem no jogo'
    },
    10: {
        name: 'Alvos Dourados',
        description: 'Alvos dourados valiosos começam a aparecer'
    },
    15: {
        name: 'Modo Rush',
        description: 'Alvos spawnam mais rapidamente'
    },
    20: {
        name: 'Alvos Especiais',
        description: 'Alvos especiais raros podem aparecer'
    }
};

// Verifica se um desbloqueio está disponível
export function isUnlocked(unlockLevel) {
    const currentLevel = getCurrentLevel();
    return currentLevel >= unlockLevel;
}

// Obtém todos os desbloqueios alcançados
export function getUnlockedFeatures() {
    const currentLevel = getCurrentLevel();
    const unlocked = [];
    
    for (const level in LEVEL_UNLOCKS) {
        if (currentLevel >= parseInt(level)) {
            unlocked.push({
                level: parseInt(level),
                ...LEVEL_UNLOCKS[level]
            });
        }
    }
    
    return unlocked;
}

// Obtém próximo desbloqueio
export function getNextUnlock() {
    const currentLevel = getCurrentLevel();
    const unlockLevels = Object.keys(LEVEL_UNLOCKS).map(l => parseInt(l)).sort((a, b) => a - b);
    
    for (const level of unlockLevels) {
        if (currentLevel < level) {
            return {
                level: level,
                ...LEVEL_UNLOCKS[level],
                killsNeeded: getXPForLevel(level) - getCurrentXP()
            };
        }
    }
    
    return null; // Todos os desbloqueios já foram alcançados
}

