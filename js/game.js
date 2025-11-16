// Lógica principal do jogo Phaser
import { GAME_CONFIG, TARGET_SPAWN_DELAY, TARGET_LIFETIME, SCORE_FOR_MOVEMENT, TARGET_SIZE, TARGET_BODY_SIZE, TARGET_MAX_HEALTH, DAMAGE_PER_HIT, MIN_KILLS_FOR_CLAIM } from './config.js';
import { createTargetVisual, createExplosion, createTrail, createHitEffect, updateHealthBar, createFloatingText } from './effects.js';
import { updateScore, updateWalletInfo, updatePendingKills, showClaimButton, hideClaimButton, updateComboDisplay, updateLevelDisplay, showLevelUp, showAchievement } from './ui.js';
import { getCooldown, setCooldown, updateCooldown } from './blockchain.js';
import { addKill, getPendingKills, canClaim, addKills } from './killQueue.js';
import { incrementCombo, resetCombo, getEffectiveKills, initCombo, setComboUpdateCallback } from './combo.js';
import { incrementStat, recordShot, updateBestSession, startSession, endSession } from './stats.js';
import { checkLevelUp, getCurrentLevel, getLevelProgress } from './progression.js';
import { getRandomTargetType, getTargetProperties, TARGET_TYPES } from './targetTypes.js';
import { calculateDifficulty, getCurrentDifficulty } from './difficulty.js';
import { checkAchievements, recordTargetKill, setAchievementUpdateCallback } from './achievements.js';

let game = null;
let targets = [];
let score = 0;
let wallet = null;
let provider = null;
let notificationCallback = null;
let bulletSound = null;
let explosionSound = null;
let claimButtonContainer = null;
let pendingKillsUpdateCallback = null;

export function setWallet(w) {
    wallet = w;
}

export function setProvider(p) {
    provider = p;
}

export function setNotificationCallback(callback) {
    notificationCallback = callback;
}

export function setPendingKillsUpdateCallback(callback) {
    pendingKillsUpdateCallback = callback;
}

export function getScore() {
    return score;
}

export function resetScore() {
    score = 0;
    updateScore(score);
    targets.forEach(t => {
        if (t.container) t.container.destroy();
        else if (t.destroy) t.destroy();
    });
    targets = [];
    // Não limpa kills pendentes aqui - apenas score visual
}

export function resetGameAfterClaim() {
    // Reseta score após claim bem-sucedido
    score = 0;
    updateScore(score);
    hideClaimButton();
    updatePendingKills(0);
}

// Phaser Scenes
function preload() {
    // Carrega efeitos de áudio
    this.load.audio('bullet', 'assets/audio-effects/bullet.mp3');
    this.load.audio('coin-received', 'assets/audio-effects/coin-recieved.mp3');
    
    // Carrega spritesheet de moedas USDC (14 frames horizontais, cada um 200x200)
    this.load.spritesheet('usdc', 'assets/images/usdc.png', {
        frameWidth: 200,
        frameHeight: 200
    });
    
    // Carrega spritesheet de explosão de moedas USDC (9 frames horizontais, cada um 200x200)
    this.load.spritesheet('usdc-explosion', 'assets/images/usdc-explosion.png', {
        frameWidth: 200,
        frameHeight: 200
    });
}

function create() {
    // Mira custom
    this.input.setDefaultCursor('crosshair');
    
    // Inicializa sistema de combo
    initCombo();
    setComboUpdateCallback((combo, multiplier) => {
        updateComboDisplay(combo, multiplier);
    });
    
    // Inicia sessão de estatísticas
    startSession();
    
    // Inicializa sons
    bulletSound = this.sound.add('bullet', { volume: 0.5 });
    explosionSound = this.sound.add('coin-received', { volume: 0.6 });
    
    // Carrega kills pendentes e atualiza UI
    const pendingKills = getPendingKills();
    updatePendingKills(pendingKills);
    
    // Atualiza display de nível inicial
    const currentLevel = getCurrentLevel();
    const levelProgress = getLevelProgress();
    updateLevelDisplay(currentLevel, levelProgress);
    
    // Configura callback de level up
    window.onLevelUp = (newLevel) => {
        showLevelUp(this, newLevel);
        const newProgress = getLevelProgress();
        updateLevelDisplay(newLevel, newProgress);
    };
    
    // Configura callback de achievements
    setAchievementUpdateCallback((achievement) => {
        // Mostra notificação de conquista
        showAchievement(this, achievement);
    });
    
    // Verifica conquistas iniciais
    checkAchievements();
    
    // Sincroniza totalPoints com kills pendentes
    if (window.totalPoints !== undefined) {
        window.totalPoints = pendingKills;
    }
    
    // Evento clique (left button)
    this.input.on('pointerdown', async (pointer) => {
        if (pointer.button !== 0) return;
        
        // Toca som de tiro sempre que clicar
        if (bulletSound) {
            bulletSound.play();
        }
        
        // Registra tiro nas estatísticas
        recordShot(false); // Inicialmente como miss, será atualizado se acertar
        
        // Verifica cooldown apenas se houver alvo destruído
        // Usa coordenadas do mundo do Phaser
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        
        // Checa colisão com bounds manual usando coordenadas do mundo
        const hit = targets.find(t => {
            const target = t.container;
            if (!target) return false;
            
            const targetX = target.x;
            const targetY = target.y;
            const distance = Phaser.Math.Distance.Between(worldX, worldY, targetX, targetY);
            
            // Hit se estiver dentro do raio do alvo
            return distance <= TARGET_SIZE;
        });
        
        if (hit) {
            console.log('Hit detected!');
            
            // Registra como hit nas estatísticas
            recordShot(true);
            
            const target = hit.container;
            const hitX = target.x;
            const hitY = target.y;
            
            // Reduz vida do alvo
            const maxHealth = hit.maxHealth || hit.health || TARGET_MAX_HEALTH;
            hit.health = (hit.health || maxHealth) - DAMAGE_PER_HIT;
            
            // Atualiza barra de vida visual
            if (hit.healthBar) {
                updateHealthBar(hit.healthBar, hit.health, maxHealth);
            }
            
            // Efeito de hit (menor que explosão)
            createHitEffect(this, hitX, hitY);
            
            // Se vida chegou a zero, destrói o alvo
            if (hit.health <= 0) {
                // Verifica cooldown antes de destruir
                if (getCooldown() > 0) {
                    console.log('Cooldown ativo, aguarde...');
                    return;
                }
                
                // Incrementa combo ao matar alvo
                const newCombo = incrementCombo();
                
                // Incrementa kills totais nas estatísticas
                const newTotalKills = incrementStat('totalKills', 1);
                
                // Verifica se subiu de nível
                const levelUpInfo = checkLevelUp(newTotalKills);
                if (levelUpInfo.leveledUp) {
                    // Notifica level up
                    if (window.onLevelUp) {
                        window.onLevelUp(levelUpInfo.newLevel);
                    }
                }
                
                // Atualiza display de nível e XP
                const currentLevel = getCurrentLevel();
                const levelProgress = getLevelProgress();
                updateLevelDisplay(currentLevel, levelProgress);
                
                // Toca som de explosão
                if (explosionSound) {
                    explosionSound.play();
                }
                
                // Explosão melhorada
                createExplosion(this, hitX, hitY);
                
                // Calcula kills efetivos considerando combo e tipo de alvo
                const killValue = hit.killValue || 1;
                const effectiveKills = getEffectiveKills(killValue);
                
                // Texto flutuante mostrando kills ganhos
                createFloatingText(this, hitX, hitY, `+${effectiveKills} Kills`, effectiveKills > killValue ? '#ffff00' : '#00ff00');
                
                // Remove alvo
                target.destroy();
                targets = targets.filter(t => t !== hit);
                
                // Atualiza score visual
                score++;
                updateScore(score);
                
                // Atualiza melhor sessão
                updateBestSession(score);
                
                // Registra kill do tipo de alvo para achievements
                if (hit.type) {
                    recordTargetKill(hit.type);
                }
                
                // Adiciona kills à fila (com bônus de combo)
                const pendingKills = addKills(effectiveKills);
                console.log(`Kill adicionado! Combo: ${newCombo}, Kills efetivos: ${effectiveKills}, Total pendente: ${pendingKills}`);
                
                // Verifica conquistas após cada kill
                checkAchievements();
                
                // Atualiza totalPoints (compatibilidade com novo sistema)
                if (window.totalPoints !== undefined) {
                    window.totalPoints = pendingKills; // Sincroniza com pendingKills
                }
                
                // Atualiza UI de kills pendentes
                updatePendingKills(pendingKills);
                if (pendingKillsUpdateCallback) {
                    pendingKillsUpdateCallback(pendingKills);
                }
                
                // Atualiza botão de claim se existir
                if (window.updateClaimUI) {
                    window.updateClaimUI();
                }
                
                // Cooldown apenas para evitar spam de kills (não bloqueia mais transações)
                setCooldown(1000); // 1s cooldown mínimo entre kills
            } else {
                // Hit sem kill - sem cooldown para permitir múltiplos tiros
                console.log(`Alvo atingido! Vida restante: ${hit.health}/${TARGET_MAX_HEALTH}`);
            }
        } else {
            // Errou o tiro - reseta combo
            resetCombo();
        }
    });
    
    // Spawn timer dinâmico baseado na dificuldade
    function scheduleNextSpawn() {
        const difficulty = getCurrentDifficulty();
        this.time.delayedCall(difficulty.spawnDelay, () => {
            spawnTarget(this);
            scheduleNextSpawn.call(this);
        });
    }
    
    // Inicia primeiro spawn
    scheduleNextSpawn.call(this);
}

function update(time, delta) {
    updateCooldown(delta);
    
    // Obtém dificuldade atual
    const difficulty = getCurrentDifficulty();
    
    // Habilita movimento dos alvos baseado na dificuldade
    // Alvos começam a se mover após 5 kills (SCORE_FOR_MOVEMENT)
    if (score > SCORE_FOR_MOVEMENT) {
        targets.forEach(t => {
            const target = t.container || t;
            if (target.body && !t.isMoving) {
                // Velocidade baseada no tipo de alvo e dificuldade
                const baseVel = difficulty.velocity;
                const typeSpeed = t.speed || 1.0;
                const velocity = baseVel * typeSpeed;
                
                target.body.setVelocity(
                    Phaser.Math.Between(-velocity, velocity), 
                    Phaser.Math.Between(-velocity, velocity)
                );
                target.body.setBounce(1, 1);
                target.body.setCollideWorldBounds(true);
                t.isMoving = true;
                
                // Cria rastro periódico para alvos em movimento
                this.time.addEvent({
                    delay: 200,
                    callback: () => {
                        if (targets.includes(t)) {
                            createTrail(this, target.x, target.y);
                        }
                    },
                    loop: true
                });
                
                console.log('Physics enabled on target - now moving!');
            }
        });
    }
}

// SpawnTarget com visual melhorado e tipos variados
function spawnTarget(scene) {
    // Obtém dificuldade atual
    const difficulty = calculateDifficulty(getCurrentLevel());
    
    // Verifica limite de alvos simultâneos
    if (targets.length >= difficulty.maxTargets) {
        return; // Não spawna mais alvos se atingiu o limite
    }
    
    const margin = 50;
    const x = Phaser.Math.Between(margin, scene.scale.width - margin);
    const y = Phaser.Math.Between(margin, scene.scale.height - margin);
    
    // Obtém tipo de alvo aleatório
    const targetType = getRandomTargetType();
    const targetProps = getTargetProperties(targetType);
    
    // Cria visual do alvo com propriedades do tipo
    const targetVisual = createTargetVisual(scene, x, y, targetProps);
    const container = targetVisual.container;
    
    container.setDepth(1);
    const hitRadius = TARGET_SIZE * targetProps.size;
    container.setInteractive(new Phaser.Geom.Circle(0, 0, hitRadius), Phaser.Geom.Circle.Contains);
    
    // Pré-enable physics body arcade
    scene.physics.add.existing(container);
    const bodySize = TARGET_BODY_SIZE * targetProps.size;
    container.body.setSize(bodySize, bodySize);
    container.body.setAllowGravity(false);
    container.body.setImmovable(true);
    
    const targetData = {
        container: container,
        isMoving: false,
        health: targetProps.health, // Vida baseada no tipo
        maxHealth: targetProps.health,
        healthBar: targetVisual.healthBar,
        type: targetType,
        killValue: targetProps.killValue,
        speed: targetProps.speed
    };
    
    // Inicializa barra de vida
    if (targetData.healthBar) {
        updateHealthBar(targetData.healthBar, targetProps.health, targetProps.health);
    }
    
    targets.push(targetData);
    
    // Despawn após tempo (baseado na dificuldade)
    scene.time.delayedCall(difficulty.lifetime, () => {
        const idx = targets.indexOf(targetData);
        if (idx > -1) {
            container.destroy();
            targets.splice(idx, 1);
        }
    });
}

// Inicializa o jogo
export function initGame() {
    const config = {
        ...GAME_CONFIG,
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    game = new Phaser.Game(config);
    return game;
}

