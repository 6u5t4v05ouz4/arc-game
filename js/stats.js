// Sistema de Estatísticas Persistentes
const STORAGE_KEY = 'mira_game_stats';

// Estatísticas padrão
const DEFAULT_STATS = {
    totalKills: 0,
    bestCombo: 0,
    level: 1,
    totalClaims: 0,
    totalPlayTime: 0, // em segundos
    totalShots: 0,
    totalHits: 0,
    bestSession: 0, // melhor score em uma sessão
    sessionStartTime: null
};

let stats = loadStats();

// Carrega estatísticas do localStorage
function loadStats() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Mescla com defaults para garantir que todas as propriedades existam
            return { ...DEFAULT_STATS, ...parsed };
        }
    } catch (e) {
        console.error('Erro ao carregar estatísticas:', e);
    }
    return { ...DEFAULT_STATS };
}

// Salva estatísticas no localStorage
function saveStats() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Erro ao salvar estatísticas:', e);
    }
}

// Atualiza uma estatística específica
export function updateStat(statName, value) {
    if (statName in stats) {
        stats[statName] = value;
        saveStats();
    } else {
        console.warn(`Estatística "${statName}" não existe`);
    }
}

// Obtém uma estatística específica
export function getStat(statName) {
    return stats[statName] !== undefined ? stats[statName] : null;
}

// Incrementa uma estatística numérica
export function incrementStat(statName, amount = 1) {
    if (statName in stats && typeof stats[statName] === 'number') {
        stats[statName] += amount;
        saveStats();
        return stats[statName];
    } else {
        console.warn(`Estatística "${statName}" não existe ou não é numérica`);
        return null;
    }
}

// Obtém todas as estatísticas
export function getAllStats() {
    return { ...stats };
}

// Calcula precisão (hits / shots * 100)
export function getAccuracy() {
    if (stats.totalShots === 0) return 0;
    return (stats.totalHits / stats.totalShots) * 100;
}

// Inicia sessão (registra tempo de início)
export function startSession() {
    stats.sessionStartTime = Date.now();
    saveStats();
}

// Finaliza sessão (atualiza tempo total jogado)
export function endSession() {
    if (stats.sessionStartTime) {
        const sessionTime = Math.floor((Date.now() - stats.sessionStartTime) / 1000);
        stats.totalPlayTime += sessionTime;
        stats.sessionStartTime = null;
        saveStats();
    }
}

// Atualiza melhor sessão se necessário
export function updateBestSession(sessionKills) {
    if (sessionKills > stats.bestSession) {
        stats.bestSession = sessionKills;
        saveStats();
    }
}

// Registra um tiro (hit ou miss)
export function recordShot(isHit = false) {
    incrementStat('totalShots', 1);
    if (isHit) {
        incrementStat('totalHits', 1);
    }
}

// Atualiza melhor combo se necessário
export function updateBestCombo(combo) {
    if (combo > stats.bestCombo) {
        stats.bestCombo = combo;
        saveStats();
    }
}

// Reseta todas as estatísticas (opcional, para debug)
export function resetStats() {
    stats = { ...DEFAULT_STATS };
    saveStats();
}

// Formata tempo total jogado em formato legível
export function getFormattedPlayTime() {
    const hours = Math.floor(stats.totalPlayTime / 3600);
    const minutes = Math.floor((stats.totalPlayTime % 3600) / 60);
    const seconds = stats.totalPlayTime % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

