const GameFunctions = (function () {

    // INÍCIO: VARIÁVEIS GLOBAIS DO JOGO.
    const ship = { x: 0, y: 0, angle: 0, velocityX: 0, velocityY: 0, radius: 10, invulnerable: false, invulnerableTime: 0 };
    const bullets = [];
    const asteroids = [];
    const powerups = [];
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

    // SISTEMA DE POWERUPS E MUNIÇÕES ESPECIAIS
    let currentAmmoType = 'normal'; // 'normal', 'double', 'triple', 'piercing'
    let ammoTimer = 0; // Tempo restante da munição especial (0 = munição normal)
    const SPECIAL_AMMO_DURATION = 15.0; // 15 segundos
    const POWERUP_DROP_CHANCE = 0.15; // 15% de chance de drop

    // Tipos de powerups
    const POWERUP_TYPES = {
        DOUBLE_SHOT: { color: '#ff4444', size: 25, name: 'Tiro Duplo' },
        TRIPLE_SHOT: { color: '#44ff44', size: 25, name: 'Tiro Triplo' },
        PIERCING_SHOT: { color: '#4444ff', size: 25, name: 'Tiro Perfurante' },
        EXTRA_LIFE: { color: '#ffff44', size: 30, name: 'Vida Extra' }
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
    const BASE_FIRE_RATE_COOLDOWN = 0.25;   // segundos entre tiros (base)
    // FIM: CONSTANTES DE VELOCIDADE

    // Funções para calcular atributos dinâmicos
    function getShipRotationSpeed() {
        return BASE_SHIP_ROTATION_SPEED * (currentShipAttributes.maneuverability / 3.0);
    }

    function getShipAcceleration() {
        return BASE_SHIP_ACCELERATION * (currentShipAttributes.maneuverability / 3.0);
    }

    function getFireRateCooldown() {
        // Quanto maior fireRate, menor o cooldown
        return BASE_FIRE_RATE_COOLDOWN * (6 - currentShipAttributes.fireRate) / 3.0;
    }



    // ------------------------
    // Funções de inicialização e ação
    // ------------------------
    function InitControls() {
        $(document).keydown(e => {
            keys[e.key] = true;
            if (e.key === KEY_SHOOT && gameState === 'playing') {
                const currentTime = performance.now() / 1000.0; // Converter para segundos
                const cooldown = getFireRateCooldown();

                // Verificar se pode atirar baseado na cadência
                if (currentTime - lastShotTime >= cooldown) {
                    Shoot();
                    lastShotTime = currentTime;
                }
            }
            if (e.key === KEY_SPECIAL && gameState === 'playing') {
                // Usar especial se disponível
                if (specialCooldown <= 0) {
                    useSpecial();
                }
            }
            if (e.key === KEY_PAUSE) togglePause();
        });
        $(document).keyup(e => keys[e.key] = false);
    }

    function Shoot() {
        const baseVelX = Math.sin(ship.angle) * BULLET_SPEED;
        const baseVelY = -Math.cos(ship.angle) * BULLET_SPEED;

        switch (currentAmmoType) {
            case 'double':
                // Tiro duplo diagonal
                const offset = 0.3; // Ângulo de separação
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle - offset) * BULLET_SPEED,
                    velocityY: -Math.cos(ship.angle - offset) * BULLET_SPEED,
                    radius: 4, // Ajustado para o tamanho do sprite
                    type: 'double',
                    color: '#ff4444',
                    useSprite: true,
                    angle: ship.angle - offset
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle + offset) * BULLET_SPEED,
                    velocityY: -Math.cos(ship.angle + offset) * BULLET_SPEED,
                    radius: 4, // Ajustado para o tamanho do sprite
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
                    radius: 4, // Ajustado para o tamanho do sprite
                    type: 'triple',
                    color: '#44ff44',
                    useSprite: true,
                    angle: ship.angle
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle - spread) * BULLET_SPEED,
                    velocityY: -Math.cos(ship.angle - spread) * BULLET_SPEED,
                    radius: 4, // Ajustado para o tamanho do sprite
                    type: 'triple',
                    color: '#44ff44',
                    useSprite: true,
                    angle: ship.angle - spread
                });
                bullets.push({
                    x: ship.x,
                    y: ship.y,
                    velocityX: Math.sin(ship.angle + spread) * BULLET_SPEED,
                    velocityY: -Math.cos(ship.angle + spread) * BULLET_SPEED,
                    radius: 4, // Ajustado para o tamanho do sprite
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
                    radius: 5,
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
                    radius: 4, // Ajustado para o tamanho do sprite
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

        for (let i = 0; i < SHOCKWAVE_BULLETS; i++) {
            const angle = i * angleStep;

            bullets.push({
                x: ship.x,
                y: ship.y,
                velocityX: Math.sin(angle) * BULLET_SPEED,
                velocityY: -Math.cos(angle) * BULLET_SPEED,
                radius: 4,
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

        // Aplicar multiplicador de velocidade dinâmico
        const baseSpeed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
        const speed = baseSpeed * currentSpeedMultiplier;

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

        const asteroid = {
            x: x,
            y: y,
            radius: 30 + Math.random() * 20,
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

        powerups.push({
            x: x,
            y: y,
            type: randomType,
            color: config.color,
            size: config.size,
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

        if (keys[KEY_LEFT]) ship.angle -= rotationSpeed * deltaTime;
        if (keys[KEY_RIGHT]) ship.angle += rotationSpeed * deltaTime;
        if (keys[KEY_UP]) {
            ship.velocityX += Math.sin(ship.angle) * acceleration * deltaTime;
            ship.velocityY -= Math.cos(ship.angle) * acceleration * deltaTime;
        }

        // Aplicar atrito (convertido para delta time)
        const frictionFactor = Math.pow(SHIP_FRICTION, deltaTime * 60);
        ship.velocityX *= frictionFactor;
        ship.velocityY *= frictionFactor;

        ship.x += ship.velocityX * deltaTime;
        ship.y += ship.velocityY * deltaTime;

        if (ship.x > width) ship.x = 0;
        if (ship.x < 0) ship.x = width;
        if (ship.y > height) ship.y = 0;
        if (ship.y < 0) ship.y = height;

        // Gerenciar invulnerabilidade
        if (ship.invulnerable) {
            ship.invulnerableTime -= deltaTime;
            if (ship.invulnerableTime <= 0) {
                ship.invulnerable = false;
            }
        }
    }

    function updateAsteroids(width, height, deltaTime) {
        asteroids.forEach((a, ai) => {
            a.x += a.velocityX * deltaTime;
            a.y += a.velocityY * deltaTime;

            if (a.x > width) a.x = 0;
            if (a.x < 0) a.x = width;
            if (a.y > height) a.y = 0;
            if (a.y < 0) a.y = height;

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
            const isNewRecord = ProgressionSystem.updateScore(score);
            if (isNewRecord) {
                console.log('Novo recorde!', score);
            }
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

            const spriteWidth = 40;  // ajuste conforme tamanho do sprite
            const spriteHeight = 40;

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

                // Tamanho do sprite da bala (ajuste conforme necessário)
                const bulletWidth = 8;
                const bulletHeight = 16;

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

        // --- HUD RESPONSIVO ---

        // Função auxiliar para tamanho de fonte responsivo
        const getResponsiveFontSize = (baseSize) => {
            const scaleFactor = Math.min(canvas.width / 1200, 1); // Baseado em 1200px de largura
            return Math.max(Math.floor(baseSize * scaleFactor), 10); // Mínimo 10px
        };

        const fontSizeLg = getResponsiveFontSize(20);
        const fontSizeMd = getResponsiveFontSize(14);
        const fontSizeSm = getResponsiveFontSize(10);
        const padding = 20;

        // 1. TOP ESQUERDO: Score, Vidas, Integridade
        ctx.textAlign = 'left';

        // Score
        ctx.fillStyle = 'white';
        ctx.font = `${fontSizeLg}px "Press Start 2P"`;
        ctx.fillText(`SCORE: ${score}`, padding, padding + fontSizeLg);

        // Vidas
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`VIDAS: ${lives}`, padding, padding + fontSizeLg * 2.5);

        // Integridade
        if (hitsRemaining < currentShipAttributes.resistance) {
            ctx.fillStyle = hitsRemaining === 1 ? '#ff4444' : '#ffaa44';
        } else {
            ctx.fillStyle = '#44ff44';
        }
        ctx.fillText(`INTEGRIDADE: ${hitsRemaining}/${currentShipAttributes.resistance}`, padding, padding + fontSizeLg * 2.5 + fontSizeMd * 1.5);


        // 2. INFERIOR ESQUERDO: Powerups e Especial
        let bottomY = canvas.height - padding;

        // Especial
        if (specialCooldown > 0) {
            ctx.fillStyle = '#888888';
            ctx.fillText(`ESPECIAL [X]: ${Math.ceil(specialCooldown)}s`, padding, bottomY);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`ESPECIAL [X]: PRONTO!`, padding, bottomY);
        }

        // Powerup Ativo (acima do especial)
        if (currentAmmoType !== 'normal' && ammoTimer > 0) {
            const ammoInfo = POWERUP_TYPES[currentAmmoType.toUpperCase() + '_SHOT'];
            if (ammoInfo) {
                ctx.fillStyle = ammoInfo.color;
                ctx.fillText(`${ammoInfo.name}: ${Math.ceil(ammoTimer)}s`, padding, bottomY - fontSizeMd * 1.8);
            }
        }


        // 3. INFERIOR CENTRAL: Mapa
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `${fontSizeMd}px "Press Start 2P"`;
        ctx.fillText(`MAPA: ${currentBackgroundIndex}/5`, canvas.width / 2, canvas.height - padding);


        // 4. INFERIOR DIREITO: Dificuldade
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white'; // Texto branco conforme solicitado
        ctx.font = `${fontSizeSm}px "Press Start 2P"`;

        const lineHeight = fontSizeSm * 1.8;
        ctx.fillText(`ASTEROIDES: ${asteroids.length}/${currentMaxAsteroids}`, canvas.width - padding, canvas.height - padding - lineHeight * 2);
        ctx.fillText(`HITS/AST: ${currentHitsPerAsteroid}`, canvas.width - padding, canvas.height - padding - lineHeight);
        ctx.fillText(`VELOCIDADE: ${currentSpeedMultiplier.toFixed(1)}x`, canvas.width - padding, canvas.height - padding);

        // Resetar alinhamento
        ctx.textAlign = 'left';

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
        ship,
        bullets,
        asteroids,
        keys,
        getScore,  // Usar getter em vez de variável
        getLives,  // Usar getter em vez de variável
        gameState
    };
})();
