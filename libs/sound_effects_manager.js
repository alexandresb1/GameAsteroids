const SoundEffectsManager = (function () {
    // Sistema de pool de áudio para evitar vazamento de memória
    const POOL_SIZE = 10; // Número máximo de instâncias simultâneas por som

    // Função auxiliar para criar pool de áudio
    function createAudioPool(src, volume, poolSize = POOL_SIZE) {
        const pool = [];
        for (let i = 0; i < poolSize; i++) {
            const audio = new Audio(src);
            audio.volume = volume;
            pool.push(audio);
        }
        return pool;
    }

    // Função para tocar som do pool
    function playFromPool(pool, volume) {
        // Encontrar um áudio que não está tocando
        let audio = pool.find(a => a.paused || a.ended);

        // Se todos estão tocando, usar o primeiro (interromper e reiniciar)
        if (!audio) {
            audio = pool[0];
        }

        // Resetar e tocar
        audio.currentTime = 0;
        audio.volume = volume;
        audio.play().catch(error => {
            // Silenciar erros de autoplay
        });
    }

    // Criar pools de áudio para explosões
    const explosionPools = [];
    for (let i = 1; i <= 7; i++) {
        explosionPools.push(createAudioPool(`audio/SoundEffects/explosion_${i}.wav`, 0.5, 5));
    }

    // Criar pools para sons de tiro
    const shootPools = {
        normal: createAudioPool('audio/SoundEffects/shoot_1.wav', 0.3, 8),
        double: createAudioPool('audio/SoundEffects/shoot_2.wav', 0.3, 8),
        triple: createAudioPool('audio/SoundEffects/shoot_3.wav', 0.3, 8),
        piercing: createAudioPool('audio/SoundEffects/shoot_4.wav', 0.3, 8),
        shockwave: createAudioPool('audio/SoundEffects/shoot_5.wav', 0.3, 3)
    };

    // Criar pool para hit
    const hitPool = createAudioPool('audio/SoundEffects/hit_1.wav', 0.4, 3);

    // Criar pools para powerups
    const powerupPools = [
        createAudioPool('audio/SoundEffects/powerup_1.wav', 0.5, 3),
        createAudioPool('audio/SoundEffects/powerup_2.wav', 0.5, 3)
    ];

    // Variáveis de controle
    let soundEffectsEnabled = true;
    let explosionVolume = 0.5;
    let shootVolume = 0.3;
    let hitVolume = 0.4;
    let powerupVolume = 0.5;

    /**
     * Toca um som de explosão aleatório
     */
    function playExplosion() {
        if (!soundEffectsEnabled) return;

        const randomIndex = Math.floor(Math.random() * explosionPools.length);
        playFromPool(explosionPools[randomIndex], explosionVolume);
    }

    /**
     * Toca o som de tiro baseado no tipo de munição
     * @param {string} ammoType - Tipo de munição: 'normal', 'double', 'triple', 'piercing', 'shockwave'
     */
    function playShoot(ammoType = 'normal') {
        if (!soundEffectsEnabled) return;

        const pool = shootPools[ammoType];
        if (!pool) {
            console.warn(`Tipo de munição desconhecido: ${ammoType}`);
            return;
        }

        playFromPool(pool, shootVolume);
    }

    /**
     * Toca o som de hit quando a nave toma dano não fatal
     */
    function playHit() {
        if (!soundEffectsEnabled) return;
        playFromPool(hitPool, hitVolume);
    }

    /**
     * Toca um som de powerup aleatório
     */
    function playPowerup() {
        if (!soundEffectsEnabled) return;

        const randomIndex = Math.floor(Math.random() * powerupPools.length);
        playFromPool(powerupPools[randomIndex], powerupVolume);
    }

    /**
     * Ativa ou desativa os efeitos sonoros
     */
    function toggleSoundEffects() {
        soundEffectsEnabled = !soundEffectsEnabled;
        return soundEffectsEnabled;
    }

    /**
     * Define o volume dos efeitos sonoros de explosão
     * @param {number} volume - Volume de 0.0 a 1.0
     */
    function setVolume(volume) {
        explosionVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Define o volume dos sons de tiro
     * @param {number} volume - Volume de 0.0 a 1.0
     */
    function setShootVolume(volume) {
        shootVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Retorna o estado atual dos efeitos sonoros
     */
    function isEnabled() {
        return soundEffectsEnabled;
    }

    /**
     * Retorna o volume atual
     */
    function getVolume() {
        return explosionVolume;
    }

    // API pública
    return {
        playExplosion,
        playShoot,
        playHit,
        playPowerup,
        toggleSoundEffects,
        setVolume,
        setShootVolume,
        isEnabled,
        getVolume
    };
})();
