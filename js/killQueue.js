// Sistema de fila de kills acumulados
import { MIN_KILLS_FOR_CLAIM } from './config.js';

const STORAGE_KEY = 'mira_kills_pending';

// Adiciona um kill à fila
export function addKill() {
    return addKills(1);
}

// Adiciona múltiplos kills à fila (para bônus de combo)
export function addKills(count) {
    const current = getPendingKills();
    const newCount = current + count;
    savePendingKills(newCount);
    return newCount;
}

// Obtém número de kills pendentes
export function getPendingKills() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return 0;
        const data = JSON.parse(stored);
        return data.count || 0;
    } catch (err) {
        console.error('Erro ao ler kills pendentes:', err);
        return 0;
    }
}

// Limpa kills pendentes
export function clearKills() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (err) {
        console.error('Erro ao limpar kills:', err);
        return false;
    }
}

// Salva kills pendentes no localStorage
function savePendingKills(count) {
    try {
        const data = {
            count: count,
            lastUpdate: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
        console.error('Erro ao salvar kills pendentes:', err);
    }
}

// Verifica se pode fazer claim (mínimo de kills atingido)
export function canClaim() {
    return getPendingKills() >= MIN_KILLS_FOR_CLAIM;
}

// Obtém contagem de kills (alias para compatibilidade)
export function getKillCount() {
    return getPendingKills();
}

