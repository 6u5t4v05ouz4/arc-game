// Sistema de Achievements/Conquistas
import { getStat, incrementStat, getAllStats, getAccuracy } from './stats.js';
import { getCombo, getMaxCombo } from './combo.js';
import { getCurrentLevel } from './progression.js';
import { TARGET_TYPES } from './targetTypes.js';

const STORAGE_KEY = 'mira_achievements';

// Lista de todas as conquistas
export const ACHIEVEMENTS = {
    FIRST_BLOOD: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Faça seu primeiro kill',
        check: (stats) => stats.totalKills >= 1
    },
    COMBO_MASTER: {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Alcance um combo de 10',
        check: () => getMaxCombo() >= 10
    },
    COMBO_LEGEND: {
        id: 'combo_legend',
        name: 'Combo Legend',
        description: 'Alcance um combo de 50',
        check: () => getMaxCombo() >= 50
    },
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Mate 10 alvos rápidos',
        check: (stats) => (stats.fastTargetsKilled || 0) >= 10
    },
    TANK_BUSTER: {
        id: 'tank_buster',
        name: 'Tank Buster',
        description: 'Destrua 5 alvos Tank',
        check: (stats) => (stats.tankTargetsKilled || 0) >= 5
    },
    LUCKY_SHOT: {
        id: 'lucky_shot',
        name: 'Lucky Shot',
        description: 'Encontre um alvo especial',
        check: (stats) => (stats.specialTargetsKilled || 0) >= 1
    },
    CENTURION: {
        id: 'centurion',
        name: 'Centurion',
        description: 'Alcance 100 kills totais',
        check: (stats) => stats.totalKills >= 100
    },
    VETERAN: {
        id: 'veteran',
        name: 'Veteran',
        description: 'Alcance 500 kills totais',
        check: (stats) => stats.totalKills >= 500
    },
    PRECISION: {
        id: 'precision',
        name: 'Precision',
        description: 'Mantenha precisão acima de 80%',
        check: () => getAccuracy() >= 80
    },
    MARATHON: {
        id: 'marathon',
        name: 'Marathon',
        description: 'Jogue por 30 minutos',
        check: (stats) => (stats.totalPlayTime || 0) >= 1800 // 30 minutos em segundos
    }
};

let unlockedAchievements = loadAchievements();
let achievementUpdateCallback = null;

// Carrega conquistas desbloqueadas do localStorage
function loadAchievements() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Erro ao carregar conquistas:', e);
    }
    return [];
}

// Salva conquistas desbloqueadas no localStorage
function saveAchievements() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements));
    } catch (e) {
        console.error('Erro ao salvar conquistas:', e);
    }
}

// Verifica se uma conquista está desbloqueada
export function isAchievementUnlocked(achievementId) {
    return unlockedAchievements.includes(achievementId);
}

// Desbloqueia uma conquista
function unlockAchievement(achievementId) {
    if (!unlockedAchievements.includes(achievementId)) {
        unlockedAchievements.push(achievementId);
        saveAchievements();
        
        // Notifica callback se existir
        if (achievementUpdateCallback) {
            const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
            if (achievement) {
                achievementUpdateCallback(achievement);
            }
        }
        
        return true;
    }
    return false;
}

// Verifica todas as conquistas e desbloqueia as que foram alcançadas
export function checkAchievements() {
    const stats = getAllStats();
    const newlyUnlocked = [];
    
    for (const achievement of Object.values(ACHIEVEMENTS)) {
        // Pula se já estiver desbloqueada
        if (isAchievementUnlocked(achievement.id)) {
            continue;
        }
        
        // Verifica se a conquista foi alcançada
        if (achievement.check(stats)) {
            if (unlockAchievement(achievement.id)) {
                newlyUnlocked.push(achievement);
            }
        }
    }
    
    return newlyUnlocked;
}

// Registra kill de um tipo específico de alvo
export function recordTargetKill(targetType) {
    switch (targetType) {
        case TARGET_TYPES.FAST:
            incrementStat('fastTargetsKilled', 1);
            break;
        case TARGET_TYPES.TANK:
            incrementStat('tankTargetsKilled', 1);
            break;
        case TARGET_TYPES.SPECIAL:
            incrementStat('specialTargetsKilled', 1);
            break;
    }
    
    // Verifica conquistas relacionadas
    checkAchievements();
}

// Obtém todas as conquistas desbloqueadas
export function getUnlockedAchievements() {
    return unlockedAchievements.map(id => {
        return Object.values(ACHIEVEMENTS).find(a => a.id === id);
    }).filter(a => a !== undefined);
}

// Obtém todas as conquistas (desbloqueadas e não desbloqueadas)
export function getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
        ...achievement,
        unlocked: isAchievementUnlocked(achievement.id)
    }));
}

// Define callback para notificações de conquistas
export function setAchievementUpdateCallback(callback) {
    achievementUpdateCallback = callback;
}

