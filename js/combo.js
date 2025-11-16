// Sistema de Combo e Multiplicadores
import { MIN_KILLS_FOR_CLAIM } from './config.js';
import { updateBestCombo } from './stats.js';

const COMBO_DECAY_TIME = 5000; // 5 segundos sem acertar = reset
const MAX_MULTIPLIER = 5; // Multiplicador máximo

let currentCombo = 0;
let maxComboReached = 0;
let lastHitTime = 0;
let comboDecayTimer = null;
let comboUpdateCallback = null;

// Carrega melhor combo do localStorage
function loadMaxCombo() {
    try {
        const saved = localStorage.getItem('mira_max_combo');
        if (saved) {
            maxComboReached = parseInt(saved, 10) || 0;
        }
    } catch (e) {
        console.error('Erro ao carregar max combo:', e);
    }
}

// Salva melhor combo no localStorage
function saveMaxCombo() {
    try {
        localStorage.setItem('mira_max_combo', maxComboReached.toString());
    } catch (e) {
        console.error('Erro ao salvar max combo:', e);
    }
}

// Inicializa sistema de combo
export function initCombo() {
    loadMaxCombo();
}

// Incrementa combo ao acertar um alvo
export function incrementCombo() {
    currentCombo++;
    lastHitTime = Date.now();
    
    // Atualiza melhor combo se necessário
    if (currentCombo > maxComboReached) {
        maxComboReached = currentCombo;
        saveMaxCombo();
        // Atualiza também nas estatísticas
        updateBestCombo(currentCombo);
    }
    
    // Reseta timer de decay
    if (comboDecayTimer) {
        clearTimeout(comboDecayTimer);
    }
    
    // Inicia novo timer de decay
    comboDecayTimer = setTimeout(() => {
        resetCombo();
    }, COMBO_DECAY_TIME);
    
    // Notifica callback se existir
    if (comboUpdateCallback) {
        comboUpdateCallback(currentCombo, getMultiplier());
    }
    
    return currentCombo;
}

// Reseta combo (ao errar tiro ou timeout)
export function resetCombo() {
    if (currentCombo > 0) {
        currentCombo = 0;
        lastHitTime = 0;
        
        if (comboDecayTimer) {
            clearTimeout(comboDecayTimer);
            comboDecayTimer = null;
        }
        
        // Notifica callback
        if (comboUpdateCallback) {
            comboUpdateCallback(0, 1);
        }
    }
}

// Retorna combo atual
export function getCombo() {
    return currentCombo;
}

// Retorna melhor combo já alcançado
export function getMaxCombo() {
    return maxComboReached;
}

// Calcula multiplicador baseado no combo
// Fórmula: 1 + (combo / 10), máximo 5x
export function getMultiplier() {
    const multiplier = 1 + (currentCombo / 10);
    return Math.min(multiplier, MAX_MULTIPLIER);
}

// Calcula kills adicionais baseado no combo
// Combo 20+ = 2 kills por alvo, combo 30+ = 3 kills, etc.
export function getBonusKills() {
    if (currentCombo >= 30) {
        return 3; // 3 kills extras
    } else if (currentCombo >= 20) {
        return 2; // 2 kills extras
    } else if (currentCombo >= 10) {
        return 1; // 1 kill extra
    }
    return 0;
}

// Retorna total de kills considerando combo
export function getEffectiveKills(baseKills = 1) {
    const bonus = getBonusKills();
    return baseKills + bonus;
}

// Verifica se combo está ativo (não expirou)
export function isComboActive() {
    if (currentCombo === 0) return false;
    const timeSinceLastHit = Date.now() - lastHitTime;
    return timeSinceLastHit < COMBO_DECAY_TIME;
}

// Retorna tempo restante até decay (em ms)
export function getComboTimeRemaining() {
    if (!isComboActive()) return 0;
    const timeSinceLastHit = Date.now() - lastHitTime;
    return Math.max(0, COMBO_DECAY_TIME - timeSinceLastHit);
}

// Define callback para atualizações de combo
export function setComboUpdateCallback(callback) {
    comboUpdateCallback = callback;
}

// Atualiza combo manualmente (para sincronização)
export function updateCombo(newCombo) {
    currentCombo = Math.max(0, newCombo);
    lastHitTime = Date.now();
    
    if (comboDecayTimer) {
        clearTimeout(comboDecayTimer);
    }
    
    comboDecayTimer = setTimeout(() => {
        resetCombo();
    }, COMBO_DECAY_TIME);
    
    if (comboUpdateCallback) {
        comboUpdateCallback(currentCombo, getMultiplier());
    }
}

