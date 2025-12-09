const GameFunctions = (function () {

    // INÍCIO: VARIÁVEIS GLOBAIS DO JOGO.
    const ship = { x: 0, y: 0, angle: 0, velocityX: 0, velocityY: 0, radius: 10, baseRadius: 10, invulnerable: false, invulnerableTime: 0 };
    const bullets = [];
    const asteroids = [];
    const powerups = [];
    
    // Controle com mouse
    let mouseX = 0;
    let mouseY = 0;
    let mouseControlEnabled = false; // Ativa quando o mouse se move
    let mouseButtonPressed = false; // Clique esquerdo pressionado
    const keys = {};
    let score = 0;
    let lives = 3;
    let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'

    // SISTEMA DE DIFICULDADE PROGRESSIVA
    const BASE_MAX_ASTEROIDS = 3; // Começar com 3 asteroides
    const MAX_ASTEROIDS_LIMIT = 30; // Limite máximo de asteroides
    const ASTEROID_INCREASE_INTERVAL = 300; // A cada 300 pontos aumenta asteroides

    const BASE_HITS_PER_ASTEROID = 1; // Hits base para destruir asteroide
    const MAX_HITS_PER_ASTEROID = 7; // Máximo de hits por asteroide
    const HITS_INCREASE_INTERVAL = 1500; // A cada 1500 pontos aumenta hits

    const BASE_SPEED_MULTIPLIER = 1.0; // Velocidade base
    const MAX_SPEED_MULTIPLIER = 1.6; // Velocidade máxima (1.6x)
    const SPEED_INCREASE_INTERVAL = 1000; // A cada 1000 pontos aumenta velocidade

    // Variáveis dinâmicas de dificuldade
    let currentMaxAsteroids = BASE_MAX_ASTEROIDS;
    let currentHitsPerAsteroid = BASE_HITS_PER_ASTEROID;
    let currentSpeedMultiplier = BASE_SPEED_MULTIPLIER;

    const INVULNERABLE_DURATION = 2.0; // 2 segundos
    let lastFrameTime = 0;
    
    // FUNÇÃO PARA ESCALA RESPONSIVA DOS ELEMENTOS
    function getGameScale() {
        const width = $(window).width();
        const height = $(window).height();
        const baseWidth = 1200; // Largura de referência (desktop)
        const baseHeight = 800; // Altura de referência
        
        // Calcular escala baseada no menor viewport
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Limitar escala entre 0.4 e 1.0 (40% a 100%)
        return Math.max(0.4, Math.min(1.0, scale));
    }

    // SISTEMA DE POWERUPS E MUNIÇÕES ESPECIAIS
    let currentAmmoType = 'normal'; // 'normal', 'double', 'triple', 'piercing'
    let ammoTimer = 0; // Tempo restante da munição especial (0 = munição normal)
    const SPECIAL_AMMO_DURATION = 15.0; // 15 segundos
    const POWERUP_DROP_CHANCE = 0.15; // 15% de chance de drop

    // Tipos de powerups (tamanhos base)
    const POWERUP_TYPES = {
        DOUBLE_SHOT: { color: '#ff4444', baseSize: 25, name: 'Tiro Duplo' },
        TRIPLE_SHOT: { color: '#44ff44', baseSize: 25, name: 'Tiro Triplo' },
        PIERCING_SHOT: { color: '#4444ff', baseSize: 25, name: 'Tiro Perfurante' },
        EXTRA_LIFE: { color: '#ffff44', baseSize: 30, name: 'Vida Extra' }
    };

    // SISTEMA DE ATRIBUTOS DAS NAVES
    const SHIP_ATTRIBUTES = {
        1: { // PIONEER-X1
            maneuverability: 4,
            resistance: 2,
            fireRate: 3
        },
        2: { // VIPER-DELTA
            maneuverability: 6,
            resistance: 1,
            fireRate: 4
        },
        3: { // TITAN-FORGE
            maneuverability: 3,
            resistance: 4,
            fireRate: 6
        },
        4: { // GREEN-REAPER
            maneuverability: 4,
            resistance: 2,
            fireRate: 5
        }
    };

    // Variáveis de atributos da nave atual
    let currentShipAttributes = SHIP_ATTRIBUTES[1]; // Padrão para PIONEER-X1
    let hitsRemaining = 2; // Hits restantes antes de perder vida
    let lastShotTime = 0; // Para controle de cadência

    // SISTEMA DE ESPECIAL (SHOCKWAVE)
    let specialCooldown = 0; // Tempo restante para usar especial (0 = disponível)
    const SPECIAL_COOLDOWN_TIME = 5.0; // 5 segundos para recarregar
    const SHOCKWAVE_BULLETS = 16; // Número de tiros na onda
    // FIM: VARIÁVEIS GLOBAIS DO JOGO.

    // INÍCIO: IMPORTAÇÃO DOS SPRITES.
    // Logo após as variáveis globais:
    let shipSprite = new Image();

    // Função para carregar sprite da nave selecionada
    function loadSelectedShipSprite() {
        const selectedSpritePath = ProgressionSystem.getSelectedShipSprite();
        shipSprite.src = selectedSpritePath;
    }

    // Função para carregar atributos da nave selecionada
    function loadSelectedShipAttributes() {
        const selectedShip = ProgressionSystem.getSelectedShip();
        currentShipAttributes = SHIP_ATTRIBUTES[selectedShip] || SHIP_ATTRIBUTES[1];
        hitsRemaining = currentShipAttributes.resistance; // Reset hits
    }

    // Carregar sprite e atributos iniciais
    loadSelectedShipSprite();
    loadSelectedShipAttributes();

    // SPRITES DOS ASTEROIDES
    const asteroidSprites = [
        new Image(),
        new Image(),
        new Image()
    ];
    asteroidSprites[0].src = "assets/sprites/Asteroid-1.png";
    asteroidSprites[1].src = "assets/sprites/Asteroid-2.png";
    asteroidSprites[2].src = "assets/sprites/Asteroid-3.png";

    // SPRITE DA BALA
    const bulletSprite = new Image();
    bulletSprite.src = "assets/sprites/bullet.png";

    // SPRITES DOS POWERUPS
    const healthPowerupSprite = new Image();
    healthPowerupSprite.src = "assets/sprites/powerup-health.png";

    const doubleShotPowerupSprite = new Image();
    doubleShotPowerupSprite.src = "assets/sprites/powerup-double-shot.png";

    const tripleShotPowerupSprite = new Image();
    tripleShotPowerupSprite.src = "assets/sprites/powerup-triple-shot.png";

    const piercingShotPowerupSprite = new Image();
    piercingShotPowerupSprite.src = "assets/sprites/powerup-piercing-shot.png";

    // SISTEMA DE BACKGROUNDS DINÂMICOS
    const bgImage = new Image();
    let currentBackgroundIndex = 1; // Background atual (1-5)
    let lastScoreThreshold = 0; // Último threshold de score que mudou o background
    const SCORE_THRESHOLD_FOR_BG_CHANGE = 2000; // A cada 2000 pontos muda o background
    const TOTAL_BACKGROUNDS = 9; // Total de backgrounds disponíveis (map-bg-1 até map-bg-5)

    // Função para carregar um background específico
    function loadBackground(index) {
        currentBackgroundIndex = index;
        bgImage.src = `assets/images/map-bg-${index}.jpg`;
        console.log(`Background alterado para: map-bg-${index}.jpg`);
    }

    // Função para selecionar background aleatório
    function selectRandomBackground() {
        const randomIndex = Math.floor(Math.random() * TOTAL_BACKGROUNDS) + 1; // 1 a 5
        loadBackground(randomIndex);
        return randomIndex;
    }

    // Função para verificar se deve mudar o background baseado no score
    function checkBackgroundChange() {
        const currentThreshold = Math.floor(score / SCORE_THRESHOLD_FOR_BG_CHANGE);

        // Se passou de um threshold para outro, muda o background
        if (currentThreshold > lastScoreThreshold) {
            lastScoreThreshold = currentThreshold;

            // Selecionar próximo background de forma cíclica
            let nextBgIndex = currentBackgroundIndex + 1;
            if (nextBgIndex > TOTAL_BACKGROUNDS) {
                nextBgIndex = 1; // Volta para o primeiro
            }

            loadBackground(nextBgIndex);

            // Mostrar mensagem de mudança de mapa (opcional)
            console.log(`Novo mapa desbloqueado! Score: ${score}`);
        }
    }

    // Carregar background inicial aleatório
    selectRandomBackground();


    // FIM: IMPORTAÇÃO DOS SPRITES.

    // SISTEMA DE DIFICULDADE PROGRESSIVA
    function updateDifficulty() {
        // Atualizar quantidade máxima de asteroides (a cada 300 pontos)
        const asteroidLevel = Math.floor(score / ASTEROID_INCREASE_INTERVAL);
        currentMaxAsteroids = Math.min(
            BASE_MAX_ASTEROIDS + asteroidLevel,
            MAX_ASTEROIDS_LIMIT
        );

        // Atualizar hits necessários por asteroide (a cada 1500 pontos)
        const hitsLevel = Math.floor(score / HITS_INCREASE_INTERVAL);
        currentHitsPerAsteroid = Math.min(
            BASE_HITS_PER_ASTEROID + hitsLevel,
            MAX_HITS_PER_ASTEROID
        );

        // Atualizar multiplicador de velocidade (a cada 1000 pontos)
        const speedLevel = Math.floor(score / SPEED_INCREASE_INTERVAL);
        const speedIncrease = speedLevel * 0.1; // 0.1x por nível
        currentSpeedMultiplier = Math.min(
            BASE_SPEED_MULTIPLIER + speedIncrease,
            MAX_SPEED_MULTIPLIER
        );
    }

    // INÍCIO: COMANDOS E CONTROLES DO JOGO.
    const KEY_LEFT = 'ArrowLeft';
    const KEY_RIGHT = 'ArrowRight';
    const KEY_UP = 'ArrowUp';
    const KEY_SHOOT = ' '; // BARRA DE ESPAÇO
    const KEY_SPECIAL = 'x'; // TECLA X para especial
    const KEY_PAUSE = 'Escape'; // TECLA ESC
    // FIM: COMANDOS E CONTROLES DO JOGO.

    // INÍCIO: CONSTANTES DE VELOCIDADE (por segundo)
    const BASE_SHIP_ROTATION_SPEED = 3.0;   // radianos por segundo base
    const BASE_SHIP_ACCELERATION = 300.0;   // pixels por segundo² base
    const SHIP_FRICTION = 0.98;             // fator de atrito
    const BULLET_SPEED = 300.0;             // pixels por segundo
    const ASTEROID_MIN_SPEED = 60.0;        // pixels por segundo
    const ASTEROID_MAX_SPEED = 280.0;       // pixels por segundo
    const BASE_FIRE_RATE_COOLDOWN = 0.35;   // segundos entre tiros (base - mais lento)
    // FIM: CONSTANTES DE VELOCIDADE

    // Funções para calcular atributos dinâmicos
    function getShipRotationSpeed() {
        return BASE_SHIP_ROTATION_SPEED * (currentShipAttributes.maneuverability / 3.0);
    }

    function getShipAcceleration() {
        const scale = getGameScale();
        return BASE_SHIP_ACCELERATION * (currentShipAttributes.maneuverability / 3.0) * scale;
    }

    function getFireRateCooldown() {
        // Mapear fireRate (1-6) para cooldown em segundos
        // fireRate 1 = 0.50s (lento)
        // fireRate 3 = 0.35s (médio)
        // fireRate 6 = 0.20s (rápido)
        const fireRate = currentShipAttributes.fireRate;
        
        // Fórmula: cooldown diminui linearmente com fireRate
        // 0.50 - (fireRate - 1) * 0.06
        return 0.50 - ((fireRate - 1) * 0.06);
    }



    // ------------------------
    // Funções de inicialização e ação
    // ------------------------
    function InitControls() {
        $(document).keydown(e => {
            keys[e.key] = true;
            
            // Desabilitar controle de mouse quando usar setinhas
            if (e.key === KEY_LEFT || e.key === KEY_RIGHT) {
                mouseControlEnabled = false;
            }
            
            // Especial só dispara no keydown (não contínuo)
            if (e.key === KEY_SPECIAL && gameState === 'playing') {
                if (specialCooldown <= 0) {
                    useSpecial();
                }
            }
            
            // Pause só dispara no keydown
            if (e.key === KEY_PAUSE) togglePause();
        });
        
        $(document).keyup(e => keys[e.key] = false);
        
        // Controle com mouse
        $(document).mousemove(e => {
            if (gameState === 'playing') {
                mouseX = e.clientX;
                mouseY = e.clientY;
                
                // Ativar controle de mouse quando mover o cursor
                // (desativa controle de setinhas)
                if (!keys[KEY_LEFT] && !keys[KEY_RIGHT]) {
                    mouseControlEnabled = true;
                }
            }
        });
        
        // Clique do mouse para acelerar
        $(document).mousedown(e => {
            if (gameState === 'playing' && e.button === 0) { // Botão esquerdo
                mouseButtonPressed = true;
                e.preventDefault();
            }
        });
        
        $(document).mouseup(e => {
            if (e.button === 0) {
                mouseButtonPressed = false;
            }
        });
        
        // Prevenir menu de contexto ao clicar com botão direito durante o jogo
        $(document).contextmenu(e => {
            if (gameState === 'playing') {
                e.preventDefault();
            }
        });
        
        // Listener de clique no canvas para botão de pause
        $('#gameCanvas').on('click touchstart', function(e) {
            if (gameState !== 'playing') return;
            
            const canvas = this;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // Obter coordenadas do clique/toque
            let clientX, clientY;
            if (e.type === 'touchstart') {
                const touch = e.originalEvent.touches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;
            
            // Verificar se clicou na área do botão de pause (centro da barra superior)
            const hudBarHeight = Math.max(50, Math.min(70, canvas.height * 0.08));
            const topSectionWidth = canvas.width / 3;
            const pauseX = topSectionWidth * 1.5;
            const pauseY = hudBarHeight / 2;
            const pauseRadius = 50; // Área clicável
            
            const distance = Math.sqrt((x - pauseX) ** 2 + (y - pauseY) ** 2);
            
            if (distance < pauseRadius && y < hudBarHeight) {
                togglePause();
                e.preventDefault();
            }
        });
    }

    function updateShooting(currentTime) {
        const currentTimeSeconds = currentTime / 1000.0;
        const cooldown = getFireRateCooldown();
        
        // Verificar se está em mobile
        const isMobile = typeof MobileControls !== 'undefined' && MobileControls.isMobileDevice();
        
        // Em mobile: tiro automático sempre ativo
        // Em desktop: apenas se barra de espaço estiver pressionada
        const shouldShoot = isMobile || keys[KEY_SHOOT];
        
        if (shouldShoot) {
            // Verificar se pode atirar baseado na cadência
            if (currentTimeSeconds - lastShotTime >= cooldown) {
                Shoot();
                lastShotTime = currentTimeSeconds;
            }
        }
    }

    function Shoot() {
        const scale = getGameScale();
        const scaledBulletSpeed = BULLET_SPEED * scale;
        const baseVelX = Math.sin(ship.angle) * scaledBulletSpeed;
        const baseVelY = -Math.cos(ship.angle) * scaledBulletSpeed;
        const bulletRadius = 4 * scale;
        const piercingRadius = 5 * scale;

        switch (currentAmmoType) {
            case 'double':
                // Tiro duplo diagonal
                const offset = 0.3; // Ângulo de separação
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle - offset) * scaledBulletSpeed,
                    velocityY: -Math.cos(ship.angle - offset) * scaledBulletSpeed,
                    radius: bulletRadius,
                    type: 'double',
                    color: '#ff4444',
                    useSprite: true,
                    angle: ship.angle - offset
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle + offset) * scaledBulletSpeed,
                    velocityY: -Math.cos(ship.angle + offset) * scaledBulletSpeed,
                    radius: bulletRadius,
                    type: 'double',
                    color: '#ff4444',
                    useSprite: true,
                    angle: ship.angle + offset
                });
                break;

            case 'triple':
                // Tiro triplo (centro + diagonais)
                const spread = 0.25;
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: baseVelX,
                    velocityY: baseVelY,
                    radius: bulletRadius,
                    type: 'triple',
                    color: '#44ff44',
                    useSprite: true,
                    angle: ship.angle
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle - spread) * scaledBulletSpeed,
                    velocityY: -Math.cos(ship.angle - spread) * scaledBulletSpeed,
                    radius: bulletRadius,
                    type: 'triple',
                    color: '#44ff44',
                    useSprite: true,
                    angle: ship.angle - spread
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle + spread) * scaledBulletSpeed,
                    velocityY: -Math.cos(ship.angle + spread) * scaledBulletSpeed,
                    radius: bulletRadius,
                    type: 'triple',
                    color: '#44ff44',
                    useSprite: true,
                    angle: ship.angle + spread
                });
                break;

            case 'piercing':
                // Tiro perfurante (maior e azul)
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: baseVelX,
                    velocityY: baseVelY,
                    radius: piercingRadius,
                    type: 'piercing',
                    color: '#4444ff',
                    piercing: true
                });
                break;

            default: // 'normal'
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: baseVelX,
                    velocityY: baseVelY,
                    radius: bulletRadius,
                    type: 'normal',
                    color: 'red',
                    useSprite: true,
                    angle: ship.angle
                });
                break;
        }

        // Tocar som de tiro baseado no tipo de munição
        if (typeof SoundEffectsManager !== 'undefined') {
            SoundEffectsManager.playShoot(currentAmmoType);
        }
    }

    function useSpecial() {
        // Ativar cooldown
        specialCooldown = SPECIAL_COOLDOWN_TIME;

        // Criar shockwave - onda de tiros em todas as direções
        const angleStep = (Math.PI * 2) / SHOCKWAVE_BULLETS; // Dividir 360° pelos tiros
        const scale = getGameScale();
        const scaledBulletSpeed = BULLET_SPEED * scale;
        const bulletRadius = 4 * scale;

        for (let i = 0; i < SHOCKWAVE_BULLETS; i++) {
            const angle = i * angleStep;

            bullets.push({
                x: ship.x,
                y: ship.y,
                velocityX: Math.sin(angle) * scaledBulletSpeed,
                velocityY: -Math.cos(angle) * scaledBulletSpeed,
                radius: bulletRadius,
                type: 'shockwave',
                color: '#ffaa00', // Laranja para destacar
                useSprite: true,
                angle: angle
            });
        }

        // Tocar som de shockwave
        if (typeof SoundEffectsManager !== 'undefined') {
            SoundEffectsManager.playShoot('shockwave');
        }

        console.log('ESPECIAL: Shockwave ativado!'); // Feedback temporário
    }

    function SpawnAsteroid() {
        if (asteroids.length >= currentMaxAsteroids) return;

        const canvasWidth = $(window).width();
        const canvasHeight = $(window).height();
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // Escolher uma região de spawn (bordas + cantos para mais variedade)
        const spawnRegion = Math.floor(Math.random() * 8);
        let x, y;

        // Aplicar multiplicador de velocidade dinâmico e escala de viewport
        const viewportScale = getGameScale(); // Escala baseada no viewport
        const baseSpeed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
        // Ajustar velocidade proporcionalmente ao tamanho da tela
        // Em telas menores (mobile), velocidade é reduzida proporcionalmente
        const speed = baseSpeed * currentSpeedMultiplier * viewportScale;

        // Definir posição de spawn baseada na região
        switch (spawnRegion) {
            case 0: // Topo
                x = Math.random() * canvasWidth;
                y = -50;
                break;
            case 1: // Direita
                x = canvasWidth + 50;
                y = Math.random() * canvasHeight;
                break;
            case 2: // Baixo
                x = Math.random() * canvasWidth;
                y = canvasHeight + 50;
                break;
            case 3: // Esquerda
                x = -50;
                y = Math.random() * canvasHeight;
                break;
            case 4: // Canto superior direito
                x = canvasWidth + 50;
                y = -50;
                break;
            case 5: // Canto inferior direito
                x = canvasWidth + 50;
                y = canvasHeight + 50;
                break;
            case 6: // Canto inferior esquerdo
                x = -50;
                y = canvasHeight + 50;
                break;
            case 7: // Canto superior esquerdo
                x = -50;
                y = -50;
                break;
        }

        // Calcular direção base em direção ao centro com variação
        const baseDirectionX = centerX - x;
        const baseDirectionY = centerY - y;
        const baseDistance = Math.sqrt(baseDirectionX * baseDirectionX + baseDirectionY * baseDirectionY);

        // Normalizar direção base
        const baseDirNormX = baseDirectionX / baseDistance;
        const baseDirNormY = baseDirectionY / baseDistance;

        // Adicionar variação angular (até ±45 graus da direção do centro)
        const maxAngleVariation = Math.PI / 4; // 45 graus
        const angleVariation = (Math.random() - 0.5) * maxAngleVariation;

        // Aplicar rotação à direção
        const cos = Math.cos(angleVariation);
        const sin = Math.sin(angleVariation);

        const finalDirX = baseDirNormX * cos - baseDirNormY * sin;
        const finalDirY = baseDirNormX * sin + baseDirNormY * cos;

        // Aplicar velocidade à direção final
        const velocityX = finalDirX * speed;
        const velocityY = finalDirY * speed;

        const spriteIndex = Math.floor(Math.random() * asteroidSprites.length);

        // Calcular tamanho responsivo do asteroide
        const sizeScale = getGameScale();
        const baseRadius = 30 + Math.random() * 20;
        const scaledRadius = baseRadius * sizeScale;
        
        const asteroid = {
            x: x,
            y: y,
            radius: scaledRadius,
            velocityX: velocityX,
            velocityY: velocityY,
            sprite: asteroidSprites[spriteIndex],
            // Sistema de vida do asteroide
            maxHealth: currentHitsPerAsteroid,
            currentHealth: currentHitsPerAsteroid,
            hitCooldown: 0 // Para evitar múltiplos hits simultâneos
        };

        asteroids.push(asteroid);
    }

    // SISTEMA DE POWERUPS
    function spawnPowerup(x, y) {
        if (Math.random() > POWERUP_DROP_CHANCE) return; // Só spawna se passar na chance

        const powerupTypes = Object.keys(POWERUP_TYPES);
        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        const config = POWERUP_TYPES[randomType];
        const scale = getGameScale();

        powerups.push({
            x: x,
            y: y,
            type: randomType,
            color: config.color,
            size: config.baseSize * scale,
            name: config.name,
            lifetime: 10.0, // 10 segundos para coletar
            pulseTimer: 0
        });
    }

    function updatePowerups(deltaTime) {
        powerups.forEach((powerup, index) => {
            // Atualizar lifetime e efeito de pulsação
            powerup.lifetime -= deltaTime;
            powerup.pulseTimer += deltaTime * 4; // Velocidade da pulsação

            // Remover powerup expirado
            if (powerup.lifetime <= 0) {
                powerups.splice(index, 1);
                return;
            }

            // Verificar colisão com a nave
            const dx = powerup.x - ship.x;
            const dy = powerup.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < powerup.size + ship.radius) {
                collectPowerup(powerup);
                powerups.splice(index, 1);
            }
        });
    }

    function collectPowerup(powerup) {
        // Tocar som de powerup
        if (typeof SoundEffectsManager !== 'undefined') {
            SoundEffectsManager.playPowerup();
        }

        switch (powerup.type) {
            case 'DOUBLE_SHOT':
                currentAmmoType = 'double';
                ammoTimer = SPECIAL_AMMO_DURATION;
                showPowerupMessage(`${powerup.name} ativado! (${SPECIAL_AMMO_DURATION}s)`);
                break;

            case 'TRIPLE_SHOT':
                currentAmmoType = 'triple';
                ammoTimer = SPECIAL_AMMO_DURATION;
                showPowerupMessage(`${powerup.name} ativado! (${SPECIAL_AMMO_DURATION}s)`);
                break;

            case 'PIERCING_SHOT':
                currentAmmoType = 'piercing';
                ammoTimer = SPECIAL_AMMO_DURATION;
                showPowerupMessage(`${powerup.name} ativado! (${SPECIAL_AMMO_DURATION}s)`);
                break;

            case 'EXTRA_LIFE':
                lives++;
                showPowerupMessage(`${powerup.name}! Vidas: ${lives}`);
                break;
        }
    }

    function showPowerupMessage(message) {
        // Criar notificação temporária na tela
        console.log(`POWERUP: ${message}`); // Temporário - depois pode ser uma UI visual
    }

    function updateAmmoTimer(deltaTime) {
        if (ammoTimer > 0) {
            ammoTimer -= deltaTime;
            if (ammoTimer <= 0) {
                currentAmmoType = 'normal';
                showPowerupMessage('Munição especial esgotada');
            }
        }
    }

    function updateSpecialCooldown(deltaTime) {
        if (specialCooldown > 0) {
            specialCooldown -= deltaTime;
            if (specialCooldown < 0) {
                specialCooldown = 0; // Garantir que não fique negativo
            }
        }
    }


    function SpawnInitialAsteroids() {
        // Spawnar asteroides até atingir o máximo inicial (3)
        while (asteroids.length < BASE_MAX_ASTEROIDS) {
            SpawnAsteroid();
        }
    }

    // ------------------------
    // Funções auxiliares
    // ------------------------
    function updateShip(width, height, deltaTime) {
        const rotationSpeed = getShipRotationSpeed();
        const acceleration = getShipAcceleration();

        // Verificar se está usando controles mobile
        const isMobile = typeof MobileControls !== 'undefined' && MobileControls.isMobileDevice();
        
        if (isMobile) {
            // Controles mobile via joystick
            const joystick = MobileControls.getJoystickState();
            
            if (joystick.active && joystick.distance > 0) {
                // Rotacionar nave para o ângulo do joystick
                ship.angle = joystick.angle;
                
                // Acelerar baseado na distância do joystick
                const thrust = joystick.distance;
                ship.velocityX += Math.sin(ship.angle) * acceleration * deltaTime * thrust;
                ship.velocityY -= Math.cos(ship.angle) * acceleration * deltaTime * thrust;
            }
        } else {
            // Controles desktop
            
            // Controle de mouse (aponta para o cursor)
            if (mouseControlEnabled) {
                const dx = mouseX - ship.x;
                const dy = mouseY - ship.y;
                const targetAngle = Math.atan2(dx, -dy);
                
                // Suavizar rotação para o ângulo alvo
                let angleDiff = targetAngle - ship.angle;
                
                // Normalizar diferença de ângulo para -PI a PI
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // Rotacionar suavemente
                const maxRotation = rotationSpeed * deltaTime * 2; // Mais rápido que setinhas
                if (Math.abs(angleDiff) < maxRotation) {
                    ship.angle = targetAngle;
                } else {
                    ship.angle += Math.sign(angleDiff) * maxRotation;
                }
                
                // Acelerar com clique do mouse
                if (mouseButtonPressed) {
                    ship.velocityX += Math.sin(ship.angle) * acceleration * deltaTime;
                    ship.velocityY -= Math.cos(ship.angle) * acceleration * deltaTime;
                }
            } else {
                // Controle com setinhas (clássico)
                if (keys[KEY_LEFT]) ship.angle -= rotationSpeed * deltaTime;
                if (keys[KEY_RIGHT]) ship.angle += rotationSpeed * deltaTime;
                
                // Acelerar com seta para cima
                if (keys[KEY_UP]) {
                    ship.velocityX += Math.sin(ship.angle) * acceleration * deltaTime;
                    ship.velocityY -= Math.cos(ship.angle) * acceleration * deltaTime;
                }
            }
        }

        // Aplicar atrito (convertido para delta time)
        const frictionFactor = Math.pow(SHIP_FRICTION, deltaTime * 60);
        ship.velocityX *= frictionFactor;
        ship.velocityY *= frictionFactor;

        ship.x += ship.velocityX * deltaTime;
        ship.y += ship.velocityY * deltaTime;

        // Definir limites da área de jogo (considerando as barras HUD)
        const hudBarHeight = Math.max(50, Math.min(70, height * 0.08));
        const playAreaTop = hudBarHeight;
        const playAreaBottom = height - hudBarHeight;

        // Wrap horizontal (normal)
        if (ship.x > width) ship.x = 0;
        if (ship.x < 0) ship.x = width;
        
        // Wrap vertical (considerando as barras HUD)
        if (ship.y > playAreaBottom) ship.y = playAreaTop;
        if (ship.y < playAreaTop) ship.y = playAreaBottom;

        // Gerenciar invulnerabilidade
        if (ship.invulnerable) {
            ship.invulnerableTime -= deltaTime;
            if (ship.invulnerableTime <= 0) {
                ship.invulnerable = false;
            }
        }
    }

    function updateAsteroids(width, height, deltaTime) {
        // Definir limites da área de jogo (considerando as barras HUD)
        const hudBarHeight = Math.max(50, Math.min(70, height * 0.08));
        const playAreaTop = hudBarHeight;
        const playAreaBottom = height - hudBarHeight;
        
        asteroids.forEach((a, ai) => {
            a.x += a.velocityX * deltaTime;
            a.y += a.velocityY * deltaTime;

            // Wrap horizontal (normal)
            if (a.x > width) a.x = 0;
            if (a.x < 0) a.x = width;
            
            // Wrap vertical (considerando as barras HUD)
            if (a.y > playAreaBottom) a.y = playAreaTop;
            if (a.y < playAreaTop) a.y = playAreaBottom;

            // Colisão com a nave (só se não estiver invulnerável)
            if (!ship.invulnerable) {
                const shipDx = a.x - ship.x;
                const shipDy = a.y - ship.y;
                const shipDistance = Math.sqrt(shipDx * shipDx + shipDy * shipDy);
                if (shipDistance < a.radius + ship.radius && gameState === 'playing') {
                    shipHit();
                    return;
                }
            }

            // Colisão com tiros
            bullets.forEach((b, bi) => {
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < a.radius + b.radius && a.hitCooldown <= 0) {
                    // Reduzir vida do asteroide
                    a.currentHealth--;
                    a.hitCooldown = 0.1; // Cooldown de 0.1 segundos para evitar múltiplos hits

                    // Remove tiro apenas se não for perfurante
                    if (!b.piercing) {
                        bullets.splice(bi, 1);
                    }

                    // Verificar se o asteroide foi destruído
                    if (a.currentHealth <= 0) {
                        // Tocar som de explosão
                        if (typeof SoundEffectsManager !== 'undefined') {
                            SoundEffectsManager.playExplosion();
                        }

                        // Spawnar powerup na posição do asteroide destruído
                        spawnPowerup(a.x, a.y);

                        // Remove asteroide
                        asteroids.splice(ai, 1);

                        score += 10;

                        // Verificar se deve mudar o background baseado no score
                        checkBackgroundChange();

                        // Atualizar dificuldade baseada no score
                        updateDifficulty();

                        // Manter sempre o número máximo de asteroides
                        SpawnAsteroid();
                    }
                }
            });

            // Atualizar cooldown de hit
            if (a.hitCooldown > 0) {
                a.hitCooldown -= deltaTime;
            }
        });
    }

    function updateBullets(width, height, deltaTime) {
        bullets.forEach((b, bi) => {
            b.x += b.velocityX * deltaTime;
            b.y += b.velocityY * deltaTime;
            if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
                bullets.splice(bi, 1);
            }
        });
    }

    // ------------------------
    // Funções de controle do jogo
    // ------------------------
    function shipHit() {
        hitsRemaining--;

        // Tocar som de hit (apenas se não for hit fatal)
        if (hitsRemaining > 0 && typeof SoundEffectsManager !== 'undefined') {
            SoundEffectsManager.playHit();
        }

        // Ativar invulnerabilidade temporária
        ship.invulnerable = true;
        ship.invulnerableTime = INVULNERABLE_DURATION;

        // Verificar se perdeu uma vida
        if (hitsRemaining <= 0) {
            shipDestroyed();
        }
    }

    function shipDestroyed() {
        lives--;

        // Tocar som de explosão quando a nave é destruída
        if (typeof SoundEffectsManager !== 'undefined') {
            SoundEffectsManager.playExplosion();
        }

        if (lives <= 0) {
            gameOver();
        } else {
            respawnShip();
        }
    }

    function respawnShip() {
        // Reposicionar nave no centro
        const canvasWidth = $(window).width();
        const canvasHeight = $(window).height();

        ship.x = canvasWidth / 2;
        ship.y = canvasHeight / 2;
        ship.angle = 0;
        ship.velocityX = 0;
        ship.velocityY = 0;

        // Resetar hits restantes baseado na resistência da nave
        hitsRemaining = currentShipAttributes.resistance;

        // Ativar invulnerabilidade temporária
        ship.invulnerable = true;
        ship.invulnerableTime = INVULNERABLE_DURATION;
    }

    function gameOver() {
        gameState = 'gameover';

        // Registrar pontuação no sistema de progressão
        if (typeof ProgressionSystem !== 'undefined') {
            // Salvar tempo da sessão atual
            ProgressionSystem.saveCurrentSession();
            
            const isNewRecord = ProgressionSystem.updateScore(score);
            if (isNewRecord) {
                console.log('Novo recorde!', score);
            }
            
            // Adicionar ao score total
            ProgressionSystem.addToTotalScore(score);
        }

        // Esconder botão de pause
        if (typeof AudioUI !== 'undefined') {
            AudioUI.hidePauseButton();
        }
        AudioManager.stopCurrentTrack(); // opcional, ou tocar outra música de game over
        if (typeof GameOverHUD !== 'undefined') {
            GameOverHUD.show();
        }
    }


    function start() {
        gameState = 'playing';
        // Recarregar sprite e atributos da nave selecionada
        loadSelectedShipSprite();
        loadSelectedShipAttributes();
        resetGame();
        // Mostrar botão de pause quando jogo inicia
        if (typeof AudioUI !== 'undefined') {
            AudioUI.showPauseButton();
        }
        // Mostrar controles mobile se aplicável
        if (typeof MobileControls !== 'undefined') {
            MobileControls.show();
        }
    }

    function restart() {
        gameState = 'playing';
        // Recarregar sprite e atributos da nave selecionada
        loadSelectedShipSprite();
        loadSelectedShipAttributes();
        resetGame();
        // Mostrar botão de pause quando jogo reinicia
        if (typeof AudioUI !== 'undefined') {
            AudioUI.showPauseButton();
        }
    }

    function pause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            if (typeof PauseHUD !== 'undefined') {
                PauseHUD.show();
            }
        }
    }

    function resume() {
        if (gameState === 'paused') {
            gameState = 'playing';
            // Resetar lastFrameTime para evitar salto no delta time
            lastFrameTime = 0;
        } else {
            console.warn('Tentativa de resumir jogo quando não estava pausado. Estado atual:', gameState);
        }
    }

    function togglePause() {
        if (gameState === 'playing') {
            pause();
        } else if (gameState === 'paused') {
            resume();
            if (typeof PauseHUD !== 'undefined') {
                PauseHUD.hide();
            }
        }
    }

    function backToMenu() {
        // CRÍTICO: Setar gameState PRIMEIRO para parar update/draw imediatamente
        gameState = 'menu';

        // Resetar lastFrameTime para evitar delta time incorreto
        lastFrameTime = 0;

        // CRÍTICO: Forçar esconder pause IMEDIATAMENTE
        if (typeof PauseHUD !== 'undefined') {
            PauseHUD.forceHide();
        }

        // Esconder outras interfaces
        if (typeof GameOverHUD !== 'undefined') {
            GameOverHUD.hide();
        }
        if (typeof CustomizeHUD !== 'undefined') {
            CustomizeHUD.hide();
        }
        if (typeof HelpHUD !== 'undefined') {
            HelpHUD.hide();
        }

        // Resetar jogo completamente (sem asteroides)
        resetGameToMenu();

        // Esconder botão de pause
        if (typeof AudioUI !== 'undefined') {
            AudioUI.hidePauseButton();
        }
        
        // Esconder controles mobile
        if (typeof MobileControls !== 'undefined') {
            MobileControls.hide();
        }

        // Mostrar tela inicial
        if (typeof StartScreenHUD !== 'undefined') {
            StartScreenHUD.show();
        }

        // Tocar música do menu
        AudioManager.playMenuMusic();
    }

    function resetGame() {
        // Resetar posição da nave
        ship.x = $(window).width() / 2;
        ship.y = $(window).height() / 2;
        ship.angle = 0;
        ship.velocityX = 0;
        ship.velocityY = 0;
        ship.invulnerable = false;
        ship.invulnerableTime = 0;

        // Limpar arrays
        bullets.length = 0;
        asteroids.length = 0;
        powerups.length = 0;

        // Resetar score e vidas
        score = 0;
        lives = 3;

        // Resetar powerups
        currentAmmoType = 'normal';
        ammoTimer = 0;

        // Resetar atributos da nave
        hitsRemaining = currentShipAttributes.resistance;
        lastShotTime = 0;

        // Resetar especial
        specialCooldown = 0;

        // Resetar sistema de backgrounds
        lastScoreThreshold = 0;
        selectRandomBackground(); // Selecionar novo background aleatório para o novo jogo

        // Resetar sistema de dificuldade
        currentMaxAsteroids = BASE_MAX_ASTEROIDS;
        currentHitsPerAsteroid = BASE_HITS_PER_ASTEROID;
        currentSpeedMultiplier = BASE_SPEED_MULTIPLIER;

        // Resetar tempo para Delta Time
        lastFrameTime = 0;

        // Spawnar asteroides iniciais (sempre 3)
        SpawnInitialAsteroids();
    }

    function resetGameToMenu() {
        // Resetar posição da nave
        ship.x = $(window).width() / 2;
        ship.y = $(window).height() / 2;
        ship.angle = 0;
        ship.velocityX = 0;
        ship.velocityY = 0;
        ship.invulnerable = false;
        ship.invulnerableTime = 0;

        // Limpar arrays COMPLETAMENTE
        bullets.length = 0;
        asteroids.length = 0;
        powerups.length = 0;

        // Resetar score e vidas
        score = 0;
        lives = 3;

        // Resetar powerups
        currentAmmoType = 'normal';
        ammoTimer = 0;

        // Resetar atributos da nave
        hitsRemaining = currentShipAttributes.resistance;
        lastShotTime = 0;

        // Resetar especial
        specialCooldown = 0;

        // Resetar sistema de backgrounds
        lastScoreThreshold = 0;
        // Manter o background atual no menu (não mudar)

        // Resetar sistema de dificuldade
        currentMaxAsteroids = BASE_MAX_ASTEROIDS;
        currentHitsPerAsteroid = BASE_HITS_PER_ASTEROID;
        currentSpeedMultiplier = BASE_SPEED_MULTIPLIER;

        // Resetar tempo para Delta Time
        lastFrameTime = 0;

        // NÃO spawnar asteroides no menu!
        // SpawnInitialAsteroids(); <- Esta linha é removida intencionalmente
    }

    // ------------------------
    // Update principal
    // ------------------------
    function update(currentTime = 0) {
        if (gameState !== 'playing') return;

        // Calcular Delta Time (em segundos)
        if (lastFrameTime === 0) lastFrameTime = currentTime;
        const deltaTime = (currentTime - lastFrameTime) / 1000.0;
        lastFrameTime = currentTime;

        // Limitar delta time para evitar saltos grandes (ex: quando a aba fica inativa)
        const clampedDeltaTime = Math.min(deltaTime, 1 / 30); // máximo 30fps

        const width = $(window).width();
        const height = $(window).height();

        updateShip(width, height, clampedDeltaTime);
        updateAsteroids(width, height, clampedDeltaTime);
        updateBullets(width, height, clampedDeltaTime);
        updatePowerups(clampedDeltaTime);
        updateAmmoTimer(clampedDeltaTime);
        updateSpecialCooldown(clampedDeltaTime);
        
        // Verificar disparo contínuo (se barra de espaço está pressionada)
        updateShooting(currentTime);

        // Adicionar tempo de jogo ao ProgressionSystem
        if (typeof ProgressionSystem !== 'undefined') {
            ProgressionSystem.addPlayTime(clampedDeltaTime);
        }

        // Garantir que sempre tenhamos o número máximo de asteroides (APENAS quando estiver jogando)
        if (gameState === 'playing') {
            while (asteroids.length < currentMaxAsteroids) {
                SpawnAsteroid();
            }
        }
    }

    // INÍCIO: FUNÇÃO PARA DESENHAR ELEMENTOS DO JOGO.
    function draw(ctx, canvas) {
        // Se não estiver jogando, limpar canvas e sair
        if (gameState !== 'playing') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        // DESENHAR BACKGROUND ESTILO "COVER"
        if (bgImage.complete) {
            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = bgImage.width / bgImage.height;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                // Imagem é mais larga → ajustar altura, cortar nas laterais
                drawHeight = canvas.height;
                drawWidth = bgImage.width * (canvas.height / bgImage.height);
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Imagem é mais alta → ajustar largura, cortar em cima/baixo
                drawWidth = canvas.width;
                drawHeight = bgImage.height * (canvas.width / bgImage.width);
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // NAVE COM SPRITE
        if (
            (!ship.invulnerable || Math.floor(ship.invulnerableTime * 5) % 2 === 0) &&
            shipSprite.complete
        ) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle);

            const scale = getGameScale();
            const spriteWidth = 40 * scale;
            const spriteHeight = 40 * scale;
            
            // Atualizar raio da nave baseado na escala
            ship.radius = ship.baseRadius * scale;

            // Efeito fantasma durante invulnerabilidade
            if (ship.invulnerable) ctx.globalAlpha = 0.5;

            ctx.drawImage(
                shipSprite,
                -spriteWidth / 2,
                -spriteHeight / 2,
                spriteWidth,
                spriteHeight
            );

            ctx.restore();
            ctx.globalAlpha = 1.0; // sempre resetar
        }


        // ASTEROIDES
        // ASTEROIDES COM SPRITES E BARRINHA DE VIDA
        asteroids.forEach(a => {
            if (a.sprite && a.sprite.complete) {
                const size = a.radius * 2; // largura e altura baseadas no raio
                ctx.drawImage(a.sprite, a.x - a.radius, a.y - a.radius, size, size);
            } else {
                // fallback (caso sprite não carregue)
                ctx.fillStyle = 'gray';
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Desenhar barrinha de vida apenas se o asteroide tem mais de 1 hit
            if (a.maxHealth > 1) {
                const barWidth = a.radius * 1.5;
                const barHeight = 4;
                const barY = a.y - a.radius - 10;

                // Fundo da barra (vermelho)
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillRect(a.x - barWidth / 2, barY, barWidth, barHeight);

                // Vida atual (verde)
                const healthPercent = a.currentHealth / a.maxHealth;
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.fillRect(a.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

                // Borda da barra
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.strokeRect(a.x - barWidth / 2, barY, barWidth, barHeight);
            }
        });


        // TIROS
        bullets.forEach(b => {
            if (b.useSprite && bulletSprite.complete) {
                // Usar sprite para tiros normais, duplos e triplos
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.angle);

                // Tamanho do sprite da bala (responsivo)
                const scale = getGameScale();
                const bulletWidth = 8 * scale;
                const bulletHeight = 16 * scale;

                ctx.drawImage(
                    bulletSprite,
                    -bulletWidth / 2,
                    -bulletHeight / 2,
                    bulletWidth,
                    bulletHeight
                );

                ctx.restore();
            } else {
                // Fallback para círculo (tiro perfurante e caso sprite não carregue)
                ctx.fillStyle = b.color || 'red';
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // POWERUPS
        powerups.forEach(powerup => {
            // Efeito de pulsação
            const pulseScale = 1 + Math.sin(powerup.pulseTimer) * 0.3;
            const currentSize = powerup.size * pulseScale;

            // Diminuir opacidade quando está expirando
            const opacity = powerup.lifetime < 3 ? powerup.lifetime / 3 : 1;

            ctx.globalAlpha = opacity;

            // Usar sprites para todos os powerups
            let powerupSprite = null;
            let spriteSize = currentSize * 2; // Tamanho do sprite baseado no size do powerup

            switch (powerup.type) {
                case 'EXTRA_LIFE':
                    powerupSprite = healthPowerupSprite;
                    break;
                case 'DOUBLE_SHOT':
                    powerupSprite = doubleShotPowerupSprite;
                    break;
                case 'TRIPLE_SHOT':
                    powerupSprite = tripleShotPowerupSprite;
                    break;
                case 'PIERCING_SHOT':
                    powerupSprite = piercingShotPowerupSprite;
                    break;
            }

            if (powerupSprite && powerupSprite.complete) {
                // Desenhar sprite do powerup
                ctx.drawImage(
                    powerupSprite,
                    powerup.x - spriteSize / 2,
                    powerup.y - spriteSize / 2,
                    spriteSize,
                    spriteSize
                );
            } else {
                // Fallback: desenhar círculo colorido se sprite não carregou
                ctx.fillStyle = powerup.color;
                ctx.beginPath();
                ctx.arc(powerup.x, powerup.y, currentSize, 0, Math.PI * 2);
                ctx.fill();

                // Borda branca para destaque
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.globalAlpha = 1; // Resetar alpha
        });

        // --- HUD UNIFICADA E RESPONSIVA ---

        // Função auxiliar para tamanho de fonte responsivo
        const getResponsiveFontSize = (baseSize) => {
            const scaleFactor = Math.min(canvas.width / 1200, 1);
            return Math.max(Math.floor(baseSize * scaleFactor), 8);
        };

        const fontSizeLg = getResponsiveFontSize(16);
        const fontSizeMd = getResponsiveFontSize(12);
        const fontSizeSm = getResponsiveFontSize(9);
        const padding = 10;
        
        // Altura das barras (compacta e responsiva)
        const barHeight = Math.max(50, Math.min(70, canvas.height * 0.08));

        // ========== BARRA SUPERIOR ==========
        const topBarY = 0;
        
        // Desenhar barra superior com gradiente
        const topGradient = ctx.createLinearGradient(0, 0, 0, barHeight);
        topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        topGradient.addColorStop(1, 'rgba(0, 0, 0, 0.80)');
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, canvas.width, barHeight);
        
        // Borda inferior
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, barHeight);
        ctx.lineTo(canvas.width, barHeight);
        ctx.stroke();
        
        // Informações na barra superior
        const topBarCenterY = barHeight / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dividir em 3 seções: Powerup | Pause/ESC | Especial
        const topSectionWidth = canvas.width / 3;
        
        // 1. POWERUP (esquerda)
        if (currentAmmoType !== 'normal' && ammoTimer > 0) {
            const ammoInfo = POWERUP_TYPES[currentAmmoType.toUpperCase() + '_SHOT'];
            if (ammoInfo) {
                ctx.fillStyle = '#00ffff';
                ctx.font = `${fontSizeSm}px "Press Start 2P"`;
                ctx.fillText('POWERUP', topSectionWidth * 0.5, topBarCenterY - 10);
                ctx.fillStyle = ammoInfo.color;
                ctx.font = `${fontSizeMd}px "Press Start 2P"`;
                ctx.fillText(`${Math.ceil(ammoTimer)}s`, topSectionWidth * 0.5, topBarCenterY + 8);
            }
        }
        
        // 2. PAUSE (centro)
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('PAUSE', topSectionWidth * 1.5, topBarCenterY - 10);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText('ESC / ⏸', topSectionWidth * 1.5, topBarCenterY + 8);
        
        // 3. ESPECIAL (direita)
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('ESPECIAL', topSectionWidth * 2.5, topBarCenterY - 10);
        
        if (specialCooldown > 0) {
            ctx.fillStyle = '#888888';
            ctx.font = `${fontSizeMd}px "Press Start 2P"`;
            ctx.fillText(`${Math.ceil(specialCooldown)}s`, topSectionWidth * 2.5, topBarCenterY + 8);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.font = `${fontSizeMd}px "Press Start 2P"`;
            ctx.fillText('PRONTO!', topSectionWidth * 2.5, topBarCenterY + 8);
        }
        
        // ========== BARRA INFERIOR ==========
        const bottomBarY = canvas.height - barHeight;
        
        // Desenhar barra inferior com gradiente
        const bottomGradient = ctx.createLinearGradient(0, bottomBarY, 0, canvas.height);
        bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0.80)');
        bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, bottomBarY, canvas.width, barHeight);
        
        // Borda superior
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, bottomBarY);
        ctx.lineTo(canvas.width, bottomBarY);
        ctx.stroke();
        
        // Informações na barra inferior
        const bottomBarCenterY = bottomBarY + barHeight / 2;
        
        // Dividir em 4 seções
        const bottomSectionWidth = canvas.width / 4;
        
        // 1. SCORE
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('SCORE', bottomSectionWidth * 0.5, bottomBarCenterY - 10);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`${score}`, bottomSectionWidth * 0.5, bottomBarCenterY + 8);
        
        // 2. VIDAS
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('VIDAS', bottomSectionWidth * 1.5, bottomBarCenterY - 10);
        ctx.fillStyle = lives <= 1 ? '#ff4444' : 'white';
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`${lives}`, bottomSectionWidth * 1.5, bottomBarCenterY + 8);
        
        // 3. INTEGRIDADE
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('INTEGRIDADE', bottomSectionWidth * 2.5, bottomBarCenterY - 10);
        if (hitsRemaining < currentShipAttributes.resistance) {
            ctx.fillStyle = hitsRemaining === 1 ? '#ff4444' : '#ffaa44';
        } else {
            ctx.fillStyle = '#44ff44';
        }
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`${hitsRemaining}/${currentShipAttributes.resistance}`, bottomSectionWidth * 2.5, bottomBarCenterY + 8);
        
        // 4. DIFICULDADE
        ctx.fillStyle = '#00ffff';
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;
        ctx.fillText('DIFICULDADE', bottomSectionWidth * 3.5, bottomBarCenterY - 10);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`${currentSpeedMultiplier.toFixed(1)}x`, bottomSectionWidth * 3.5, bottomBarCenterY + 8);

        // Resetar alinhamento
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

    }
    // FIM: FUNÇÃO PARA DESENHAR ELEMENTOS DO JOGO.


    // INCIALIZA OS CONTROLES.
    InitControls();

    // Função getter para retornar o score atual
    function getScore() {
        return score;
    }

    function getLives() {
        return lives;
    }

    // Função para disparar especial (chamada pelo botão mobile)
    function triggerSpecial() {
        if (gameState === 'playing' && specialCooldown <= 0) {
            useSpecial();
        }
    }

    return {
        update,
        draw,
        SpawnAsteroid,
        SpawnInitialAsteroids,
        Shoot,
        start,
        restart,
        pause,
        resume,
        togglePause,
        backToMenu,
        gameOver,
        triggerSpecial,
        ship,
        bullets,
        asteroids,
        keys,
        getScore,  // Usar getter em vez de variável
        getLives,  // Usar getter em vez de variável
        gameState
    };
})();
