// Lógica principal do jogo Phaser
import { GAME_CONFIG, TARGET_SPAWN_DELAY, TARGET_LIFETIME, SCORE_FOR_MOVEMENT, TARGET_SIZE, TARGET_BODY_SIZE, TARGET_MAX_HEALTH, DAMAGE_PER_HIT, MIN_KILLS_FOR_CLAIM } from './config.js';
import { createTargetVisual, createExplosion, createTrail, createHitEffect, updateHealthBar } from './effects.js';
import { updateScore, updateWalletInfo, updatePendingKills, showClaimButton, hideClaimButton } from './ui.js';
import { getCooldown, setCooldown, updateCooldown } from './blockchain.js';
import { addKill, getPendingKills, canClaim } from './killQueue.js';

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
    
    // Inicializa sons
    bulletSound = this.sound.add('bullet', { volume: 0.5 });
    explosionSound = this.sound.add('coin-received', { volume: 0.6 });
    
    // Carrega kills pendentes e atualiza UI
    const pendingKills = getPendingKills();
    updatePendingKills(pendingKills);
    
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
            
            const target = hit.container;
            const hitX = target.x;
            const hitY = target.y;
            
            // Reduz vida do alvo
            hit.health = (hit.health || TARGET_MAX_HEALTH) - DAMAGE_PER_HIT;
            
            // Atualiza barra de vida visual
            if (hit.healthBar) {
                updateHealthBar(hit.healthBar, hit.health, TARGET_MAX_HEALTH);
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
                
                // Toca som de explosão
                if (explosionSound) {
                    explosionSound.play();
                }
                
                // Explosão melhorada
                createExplosion(this, hitX, hitY);
                
                // Remove alvo
                target.destroy();
                targets = targets.filter(t => t !== hit);
                
                // Atualiza score visual
                score++;
                updateScore(score);
                
                // Adiciona kill à fila (sem transação imediata)
                const pendingKills = addKill();
                console.log(`Kill adicionado! Total pendente: ${pendingKills}`);
                
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
        }
    });
    
    // Spawn timer
    this.time.addEvent({ 
        delay: TARGET_SPAWN_DELAY, 
        callback: () => spawnTarget(this), 
        callbackScope: this, 
        loop: true 
    });
}

function update(time, delta) {
    updateCooldown(delta);
    
    // Dificuldade: Após 5 kills, set velocity nos alvos com body
    if (score > SCORE_FOR_MOVEMENT) {
        targets.forEach(t => {
            const target = t.container || t;
            if (target.body && !t.isMoving) {
                target.body.setVelocity(
                    Phaser.Math.Between(-100, 100), 
                    Phaser.Math.Between(-100, 100)
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

// SpawnTarget com visual melhorado
function spawnTarget(scene) {
    const margin = 50;
    const x = Phaser.Math.Between(margin, scene.scale.width - margin);
    const y = Phaser.Math.Between(margin, scene.scale.height - margin); // Canvas já está abaixo do HUD
    
    const targetVisual = createTargetVisual(scene, x, y);
    const container = targetVisual.container;
    
    container.setDepth(1);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, TARGET_SIZE), Phaser.Geom.Circle.Contains);
    
    // Pré-enable physics body arcade
    scene.physics.add.existing(container);
    container.body.setSize(TARGET_BODY_SIZE, TARGET_BODY_SIZE);
    container.body.setAllowGravity(false);
    container.body.setImmovable(true);
    
    const targetData = {
        container: container,
        isMoving: false,
        health: TARGET_MAX_HEALTH, // Inicializa com vida máxima
        healthBar: targetVisual.healthBar // Referência à barra de vida
    };
    
    // Inicializa barra de vida
    if (targetData.healthBar) {
        updateHealthBar(targetData.healthBar, TARGET_MAX_HEALTH, TARGET_MAX_HEALTH);
    }
    
    targets.push(targetData);
    
    // Despawn após tempo
    scene.time.delayedCall(TARGET_LIFETIME, () => {
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

