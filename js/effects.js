// Efeitos visuais do jogo

// Cria explosão usando spritesheet de moedas USDC
export function createExplosion(scene, x, y) {
    // Cria animação de explosão se ainda não existir
    if (!scene.anims.exists('coinExplosion')) {
        // Cria frames da animação (9 frames: 0-8)
        scene.anims.create({
            key: 'coinExplosion',
            frames: scene.anims.generateFrameNumbers('usdc-explosion', { start: 0, end: 8 }),
            frameRate: 20, // Velocidade da animação
            repeat: 0 // Não repete, executa uma vez
        });
    }
    
    // Cria sprite da explosão
    const explosion = scene.add.sprite(x, y, 'usdc-explosion', 0);
    
    // Escala a explosão (mesmo tamanho da moeda ou um pouco maior)
    const scale = 0.2; // 200 * 0.2 = 40 pixels (mesmo tamanho da moeda)
    explosion.setScale(scale);
    explosion.setOrigin(0.5, 0.5);
    explosion.setDepth(10); // Garante que aparece acima de outros elementos
    
    // Reproduz animação de explosão
    explosion.play('coinExplosion');
    
    // Remove o sprite após a animação terminar
    explosion.on('animationcomplete', () => {
        explosion.destroy();
    });
    
    // Efeito de flash na tela (opcional, mantém feedback visual)
    const flash = scene.add.rectangle(
        scene.scale.width / 2, 
        scene.scale.height / 2, 
        scene.scale.width, 
        scene.scale.height, 
        0xffffff, 
        0.1
    );
    flash.setDepth(5);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 150,
        onComplete: () => flash.destroy()
    });
}

// Cria alvo com spritesheet de moedas USDC
export function createTargetVisual(scene, x, y) {
    // Cria animação de rotação da moeda se ainda não existir
    if (!scene.anims.exists('coinRotate')) {
        // Cria frames da animação (14 frames: 0-13)
        scene.anims.create({
            key: 'coinRotate',
            frames: scene.anims.generateFrameNumbers('usdc', { start: 0, end: 13 }),
            frameRate: 20, // Velocidade da animação
            repeat: -1 // Loop infinito
        });
    }
    
    // Cria sprite da moeda
    const coin = scene.add.sprite(0, 0, 'usdc', 0);
    
    // Escala a moeda para o tamanho desejado (frame original é 200x200)
    // Ajusta para aproximadamente 40x40 pixels (mesmo tamanho do alvo anterior)
    const scale = 0.2; // 200 * 0.2 = 40 pixels
    coin.setScale(scale);
    coin.setOrigin(0.5, 0.5);
    
    // Glow externo (mantém efeito visual)
    const glow = scene.add.graphics();
    glow.fillStyle(0x00ff00, 0.2);
    glow.fillCircle(0, 0, 30);
    
    // Animação de spawn (scale + fade in)
    coin.setAlpha(0);
    coin.setScale(0);
    glow.setAlpha(0);
    
    scene.tweens.add({
        targets: [coin, glow],
        alpha: 1,
        scaleX: scale,
        scaleY: scale,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
            // Inicia animação de rotação após spawn
            coin.play('coinRotate');
        }
    });
    
    // Animação pulsante do glow
    scene.tweens.add({
        targets: glow,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    
    // Container para agrupar os elementos
    const container = scene.add.container(x, y, [glow, coin]);
    
    // Cria barra de vida
    const healthBar = createHealthBar(scene, container);
    
    return {
        main: coin,
        glow: glow,
        container: container,
        healthBar: healthBar
    };
}

// Cria rastro/partículas para alvos em movimento
export function createTrail(scene, x, y) {
    const trail = scene.add.graphics();
    trail.fillStyle(0x00ff00, 0.5);
    trail.fillCircle(x, y, 3);
    
    scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        onComplete: () => trail.destroy()
    });
}

// Efeito de hit - partículas azuis da cor da moeda USDC
export function createHitEffect(scene, x, y) {
    // Cor azul da moeda USDC (azul vibrante)
    const coinBlue = 0x0099ff; // Azul similar ao das moedas
    
    // Cria partículas azuis que saem em todas as direções
    const particleCount = 8;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.5 - 0.25); // Pequena variação aleatória
        const speed = 15 + Math.random() * 25; // Velocidade variável
        const size = 2 + Math.random() * 3; // Tamanho variável
        
        // Cria partícula azul
        const particle = scene.add.graphics();
        particle.fillStyle(coinBlue, 0.9);
        particle.fillCircle(0, 0, size);
        particle.setPosition(x, y);
        particle.setDepth(5);
        
        particles.push({ 
            g: particle, 
            angle, 
            speed,
            size 
        });
    }
    
    // Anima cada partícula se afastando do ponto de impacto
    particles.forEach((p, i) => {
        const targetX = x + Math.cos(p.angle) * p.speed;
        const targetY = y + Math.sin(p.angle) * p.speed;
        
        scene.tweens.add({
            targets: p.g,
            x: targetX,
            y: targetY,
            alpha: 0,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 400 + Math.random() * 200, // Duração variável
            ease: 'Power2',
            onComplete: () => {
                p.g.destroy();
            }
        });
    });
}

// Cria barra de vida para o alvo
export function createHealthBar(scene, container) {
    const healthBarBg = scene.add.graphics();
    healthBarBg.fillStyle(0x000000, 0.8);
    healthBarBg.fillRoundedRect(-25, -35, 50, 6, 2);
    healthBarBg.setPosition(0, 0);
    
    const healthBar = scene.add.graphics();
    healthBar.fillStyle(0x00ff00);
    healthBar.fillRoundedRect(-24, -34, 48, 4, 2);
    healthBar.setPosition(0, 0);
    
    container.add([healthBarBg, healthBar]);
    
    return { bg: healthBarBg, bar: healthBar };
}

// Atualiza barra de vida
export function updateHealthBar(healthBar, currentHealth, maxHealth) {
    if (!healthBar || !healthBar.bar) return;
    
    const percentage = Math.max(0, currentHealth / maxHealth);
    const width = 48 * percentage;
    
    healthBar.bar.clear();
    
    // Cor muda conforme a vida
    let color = 0x00ff00; // Verde
    if (percentage < 0.4) {
        color = 0xff0000; // Vermelho
    } else if (percentage < 0.7) {
        color = 0xffff00; // Amarelo
    }
    
    healthBar.bar.fillStyle(color);
    healthBar.bar.fillRoundedRect(-24, -34, width, 4, 2);
}

