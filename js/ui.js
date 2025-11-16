// Componentes de UI
import { EXPLORER_URL } from './config.js';

let notificationElement = null;
let scoreElement = null;
let walletInfoElement = null;
let pendingKillsElement = null;
let claimButtonContainer = null;
let comboElement = null;
let levelElement = null;
let xpBarElement = null;
let xpBarFillElement = null;

// Inicializa elementos de UI
export function initUI() {
    scoreElement = document.getElementById('score');
    walletInfoElement = document.getElementById('wallet-info');
    pendingKillsElement = document.getElementById('pending-kills');
    comboElement = document.getElementById('combo-display');
    levelElement = document.getElementById('level-display');
    xpBarElement = document.getElementById('xp-bar');
    xpBarFillElement = document.getElementById('xp-bar-fill');
}

// Atualiza display do score com animação
export function updateScore(score) {
    if (scoreElement) {
        scoreElement.textContent = score;
        // Animação de pulse
        scoreElement.classList.add('pulse');
        setTimeout(() => {
            scoreElement.classList.remove('pulse');
        }, 300);
    }
}

// Copia wallet para clipboard
export async function copyWalletToClipboard(address) {
    try {
        await navigator.clipboard.writeText(address);
        return true;
    } catch (err) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err2) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

// Atualiza informações da wallet
export function updateWalletInfo(address, balance, isLowBalance = false, isExternal = false, networkStatus = null, tokenBalance = null) {
    if (walletInfoElement) {
        const shortAddress = address.substring(0, 10) + '...';
        const balanceFormatted = parseFloat(balance).toFixed(4);
        const balanceClass = isLowBalance ? 'low-balance' : '';
        
        // Indicador de rede
        let networkIndicator = '';
        if (isExternal) {
            if (networkStatus === 'correct') {
                networkIndicator = '<div class="network-status correct">✓ Arc Testnet</div>';
            } else if (networkStatus === 'incorrect') {
                networkIndicator = '<div class="network-status incorrect">⚠ Wrong Network</div>';
            } else {
                networkIndicator = '<div class="network-status">🌐 External Wallet</div>';
            }
        }
        
        // Formata balance do token
        let tokenBalanceHtml = '';
        if (tokenBalance !== null) {
            const tokenBalanceFormatted = parseFloat(tokenBalance).toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 0
            });
            tokenBalanceHtml = `
                <div class="wallet-token-balance">
                    <span class="icon">🪙</span>
                    <span class="label">ARCGAME:</span>
                    <span class="value">${tokenBalanceFormatted}</span>
                </div>
            `;
        }
        
        walletInfoElement.innerHTML = `
            ${networkIndicator}
            <div class="wallet-address ${balanceClass}">
                <span class="icon">🔷</span>
                <span class="label">Wallet:</span>
                <span class="value">${shortAddress}</span>
                <button class="copy-wallet-btn" title="Copiar endereço completo" data-address="${address}">
                    <span class="copy-icon">📋</span>
                </button>
            </div>
            <div class="wallet-balance ${balanceClass}">
                <span class="icon">⚡</span>
                <span class="label">Balance:</span>
                <span class="value">${balanceFormatted} ETH</span>
            </div>
            ${tokenBalanceHtml}
            ${isLowBalance ? '<div class="warning">⚠️ Fund with USDC testnet on faucet for gas!</div>' : ''}
            <div class="wallet-link">
                <a href="https://faucet.circle.com" target="_blank" class="faucet-link">🔗 Faucet</a>
            </div>
        `;
        
        // Adiciona evento de clique no botão de copiar
        const copyBtn = walletInfoElement.querySelector('.copy-wallet-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const fullAddress = copyBtn.getAttribute('data-address');
                const success = await copyWalletToClipboard(fullAddress);
                if (success) {
                    copyBtn.innerHTML = '<span class="copy-icon">✓</span>';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<span class="copy-icon">📋</span>';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            });
        }
    }
}

// Cria notificação - apenas texto no canto inferior esquerdo
export function createNotification(scene, message, type = 'success', txData = null) {
    // Se não há scene, usa alert (para erros antes do jogo iniciar)
    if (!scene) {
        if (type === 'error') {
            alert(message);
        }
        return;
    }
    
    // Remove notificação anterior se existir
    if (notificationElement) {
        if (typeof notificationElement === 'object' && notificationElement.text) {
            // Se for objeto com text e linkText
            if (notificationElement.text) notificationElement.text.destroy();
            if (notificationElement.linkText) notificationElement.linkText.destroy();
        } else if (notificationElement.destroy) {
            // Se for um elemento Phaser direto
            notificationElement.destroy();
        }
        notificationElement = null;
    }
    
    const color = type === 'success' ? '#00ff00' : '#ff0000';
    
    // Posição no canto inferior esquerdo do canvas
    const padding = 20;
    const maxWidth = 400;
    const x = padding;
    const y = scene.scale.height - padding;
    
    // Texto da notificação
    let displayText = message;
    if (txData && txData.hash) {
        displayText = `${message}\nTX: ${txData.hash.substring(0, 10)}...`;
        if (txData.gasUsed) {
            displayText += ` | Gas: ${txData.gasUsed}`;
        }
    }
    
    // Cria apenas o texto, sem container
    const text = scene.add.text(x, y, displayText, {
        fontSize: '14px',
        fill: color,
        align: 'left',
        fontFamily: 'Orbitron, monospace',
        wordWrap: { width: maxWidth },
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0, 1); // Origem no canto inferior esquerdo
    
    // Link para explorer se tiver txData
    if (txData && txData.url) {
        const linkText = scene.add.text(x, y - (text.height || 20), 'View on Explorer', {
            fontSize: '12px',
            fill: '#00ffff',
            align: 'left',
            fontFamily: 'Orbitron, monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 1).setInteractive({ useHandCursor: true });
        
        linkText.on('pointerdown', () => {
            window.open(txData.url, '_blank');
        });
        
        // Ajusta posição do link baseado na altura do texto principal
        linkText.setY(y - text.height);
        
        text.setDepth(100);
        linkText.setDepth(100);
        
        // Animação de entrada
        text.setAlpha(0);
        linkText.setAlpha(0);
        
        scene.tweens.add({
            targets: [text, linkText],
            alpha: 1,
            x: x,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Animação de saída após delay
                scene.time.delayedCall(4000, () => {
                    scene.tweens.add({
                        targets: [text, linkText],
                        alpha: 0,
                        x: x - 30,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            text.destroy();
                            linkText.destroy();
                            notificationElement = null;
                        }
                    });
                });
            }
        });
        
        // Posição inicial (fora da tela à esquerda)
        text.setX(x - 100);
        linkText.setX(x - 100);
        
        notificationElement = { text, linkText };
    } else {
        text.setDepth(100);
        text.setAlpha(0);
        
        // Animação de entrada
        scene.tweens.add({
            targets: text,
            alpha: 1,
            x: x,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Animação de saída após delay
                scene.time.delayedCall(4000, () => {
                    scene.tweens.add({
                        targets: text,
                        alpha: 0,
                        x: x - 30,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            text.destroy();
                            notificationElement = null;
                        }
                    });
                });
            }
        });
        
        // Posição inicial (fora da tela à esquerda)
        text.setX(x - 100);
        
        notificationElement = text;
    }
}

// Inicializa notificação no Phaser (para compatibilidade)
export function initPhaserNotification(scene) {
    // Mantido para compatibilidade, mas não usado mais
    return null;
}

// Atualiza display de kills pendentes
export function updatePendingKills(killCount) {
    if (pendingKillsElement) {
        pendingKillsElement.textContent = killCount;
        // Adiciona classe quando pronto para claim
        if (killCount >= 10) { // MIN_KILLS_FOR_CLAIM (hardcoded para evitar import circular)
            pendingKillsElement.classList.add('ready-to-claim');
        } else {
            pendingKillsElement.classList.remove('ready-to-claim');
        }
    }
}

// Mostra botão de claim no HUD
export function showClaimButton(scene, killCount, onClaimClick) {
    const claimContainer = document.getElementById('claim-button-container');
    const claimButton = document.getElementById('claim-kills-btn');
    
    if (!claimContainer || !claimButton) return;
    
    // Atualiza texto do botão
    const buttonText = claimButton.querySelector('.button-text');
    if (buttonText) {
        buttonText.textContent = `Claim ${killCount} Kills`;
    } else {
        claimButton.textContent = `Claim ${killCount} Kills`;
    }
    
    // Remove event listeners anteriores
    const newButton = claimButton.cloneNode(true);
    claimButton.parentNode.replaceChild(newButton, claimButton);
    
    // Adiciona event listener
    newButton.addEventListener('click', () => {
        if (onClaimClick) {
            onClaimClick();
        }
    });
    
    // Mostra o container
    claimContainer.style.display = 'block';
    
    // Salva referência para poder esconder depois
    claimButtonContainer = claimContainer;
}

// Esconde botão de claim
export function hideClaimButton() {
    const claimContainer = document.getElementById('claim-button-container');
    if (claimContainer) {
        claimContainer.style.display = 'none';
    }
    claimButtonContainer = null;
}

// Atualiza display do combo
export function updateComboDisplay(combo, multiplier) {
    if (comboElement) {
        const comboRow = comboElement;
        const comboValue = comboRow.querySelector('.combo-value');
        
        if (combo > 0) {
            if (comboValue) {
                comboValue.textContent = `${combo}x (${multiplier.toFixed(1)}x)`;
            }
            comboRow.style.display = 'flex';
            
            // Efeito visual para combos altos
            if (combo >= 20) {
                comboRow.classList.add('high-combo');
            } else {
                comboRow.classList.remove('high-combo');
            }
        } else {
            comboRow.style.display = 'none';
            comboRow.classList.remove('high-combo');
        }
    }
}

// Atualiza display do nível e barra de XP
export function updateLevelDisplay(level, progress) {
    if (levelElement) {
        levelElement.textContent = level;
    }
    
    if (xpBarFillElement) {
        const percentage = Math.min(100, progress * 100);
        xpBarFillElement.style.width = `${percentage}%`;
    }
}

// Mostra notificação de conquista
export function showAchievement(scene, achievement) {
    if (!scene) return;
    
    // Texto no centro da tela
    const achievementText = scene.add.text(
        scene.scale.width / 2,
        scene.scale.height / 2 - 50,
        `ACHIEVEMENT UNLOCKED!\n${achievement.name}\n${achievement.description}`,
        {
            fontSize: '32px',
            fill: '#ffaa00',
            align: 'center',
            fontFamily: 'Orbitron, monospace',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5, 0.5).setDepth(200);
    
    // Animação de entrada
    achievementText.setAlpha(0);
    achievementText.setScale(0);
    
    scene.tweens.add({
        targets: achievementText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
            // Animação de saída
            scene.tweens.add({
                targets: achievementText,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                y: achievementText.y - 50,
                duration: 500,
                ease: 'Power2',
                delay: 2000,
                onComplete: () => {
                    achievementText.destroy();
                }
            });
        }
    });
    
    // Efeito de flash dourado
    const flash = scene.add.rectangle(
        scene.scale.width / 2,
        scene.scale.height / 2,
        scene.scale.width,
        scene.scale.height,
        0xffaa00,
        0.15
    );
    flash.setDepth(199);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 1000,
        onComplete: () => flash.destroy()
    });
}

// Mostra animação de level up
export function showLevelUp(scene, newLevel) {
    if (!scene) return;
    
    // Texto grande no centro da tela
    const levelUpText = scene.add.text(
        scene.scale.width / 2,
        scene.scale.height / 2,
        `LEVEL UP!\nLevel ${newLevel}`,
        {
            fontSize: '48px',
            fill: '#00ff00',
            align: 'center',
            fontFamily: 'Orbitron, monospace',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5, 0.5).setDepth(200);
    
    // Animação de entrada
    levelUpText.setAlpha(0);
    levelUpText.setScale(0);
    
    scene.tweens.add({
        targets: levelUpText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
            // Animação de saída
            scene.tweens.add({
                targets: levelUpText,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                y: levelUpText.y - 100,
                duration: 500,
                ease: 'Power2',
                delay: 1500,
                onComplete: () => {
                    levelUpText.destroy();
                }
            });
        }
    });
    
    // Efeito de flash
    const flash = scene.add.rectangle(
        scene.scale.width / 2,
        scene.scale.height / 2,
        scene.scale.width,
        scene.scale.height,
        0x00ff00,
        0.2
    );
    flash.setDepth(199);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 800,
        onComplete: () => flash.destroy()
    });
}

