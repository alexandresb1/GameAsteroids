const AudioManager = (function () {
    // Criar os objetos de áudio
    const menuTracks = [
        new Audio('audio/Main Menu 1.mp3'),
        new Audio('audio/Main Menu 2.mp3'),
        new Audio('audio/Main Menu 3.mp3')
    ];
    
    // Criar múltiplas faixas de gameplay (Gameplay 1.mp3 até Gameplay 6.mp3)
    const gameplayTracks = [];
    for (let i = 1; i <= 6; i++) {
        gameplayTracks.push(new Audio(`audio/Gameplay ${i}.mp3`));
    }

    // Configurações comuns
    menuTracks.forEach(track => {
        track.loop = false;
        track.volume = 0.7;
    });
    
    gameplayTracks.forEach(track => {
        track.loop = false;
        track.volume = 0.7;
    });

    let currentTrack = null;
    let isMuted = false; // Começa com áudio ativado
    let userHasInteracted = false;
    let pendingTrack = null; // Para tocar depois da primeira interação
    let currentContext = null; // 'menu' ou 'game' - rastreia o contexto atual
    let lastGameplayTrackIndex = -1; // Rastrear última música de gameplay para não repetir
    let lastMenuTrackIndex = -1; // Rastrear última música de menu para não repetir

    // Detectar primeira interação do usuário
    function enableAudioOnFirstInteraction() {
        if (!userHasInteracted) {
            userHasInteracted = true;

            // Se havia uma música pendente, tocar agora
            if (pendingTrack && !isMuted) {
                playTrack(pendingTrack);
            }

            // Remover listeners após primeira interação usando jQuery
            $(document).off('click keydown touchstart', enableAudioOnFirstInteraction);
        }
    }

    // Adicionar listeners para primeira interação usando jQuery
    $(document).on('click keydown touchstart', enableAudioOnFirstInteraction);

    function playTrack(track) {
        if (isMuted || !userHasInteracted) {
            pendingTrack = track;
            return Promise.resolve();
        }

        // Parar música atual (mas não resetar contexto)
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }
        
        currentTrack = track;

        return currentTrack.play().catch(error => {
            console.log('Não foi possível tocar áudio:', error.message);
            // Marcar como pendente para tentar novamente
            pendingTrack = track;
        });
    }

    function playMenuMusic(forceRestart = false) {
        // Marcar que estamos no contexto do menu
        currentContext = 'menu';

        // Selecionar uma faixa de menu aleatória que não seja a última tocada
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * menuTracks.length);
        } while (randomIndex === lastMenuTrackIndex && menuTracks.length > 1);
        
        lastMenuTrackIndex = randomIndex;
        const selectedTrack = menuTracks[randomIndex];
        
        console.log(`Tocando música do menu: Main Menu ${randomIndex + 1}.mp3`);
        
        // Configurar para tocar a próxima música quando esta terminar
        selectedTrack.onended = function() {
            console.log('Música do menu terminou, tocando próxima...');
            playMenuMusic(); // Recursivamente toca a próxima música
        };
        
        return playTrack(selectedTrack);
    }

    function getRandomGameplayTrack() {
        // Selecionar uma faixa de gameplay aleatória que não seja a última tocada
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * gameplayTracks.length);
        } while (randomIndex === lastGameplayTrackIndex && gameplayTracks.length > 1);
        
        lastGameplayTrackIndex = randomIndex;
        console.log(`Selecionada música de gameplay: Gameplay ${randomIndex + 1}.mp3`);
        return gameplayTracks[randomIndex];
    }

    function playGameMusic() {
        // Marcar que estamos no contexto do jogo
        currentContext = 'game';
        
        // Selecionar uma música de gameplay aleatória
        const selectedTrack = getRandomGameplayTrack();
        
        // Configurar para tocar a próxima música quando esta terminar
        selectedTrack.onended = function() {
            console.log('Música de gameplay terminou, tocando próxima...');
            playGameMusic(); // Recursivamente toca a próxima música
        };
        
        return playTrack(selectedTrack);
    }

    function stopCurrentTrack() {
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
            currentTrack.onended = null; // Limpar listener de fim de música
        }
        currentTrack = null;
        // NÃO resetar currentContext aqui - manter o contexto para evitar reiniciar música
    }

    function toggleMute() {
        isMuted = !isMuted;

        if (isMuted) {
            // Pausar música mas manter o contexto
            if (currentTrack) {
                currentTrack.pause();
            }
        } else if (userHasInteracted) {
            // Retomar música baseado no contexto atual
            if (currentContext === 'menu') {
                // No menu, sempre chamar playMenuMusic para randomizar
                playMenuMusic();
            } else if (currentContext === 'game') {
                // Na gameplay, sempre chamar playGameMusic para randomizar
                playGameMusic();
            } else if (currentTrack) {
                // Se tem uma música carregada, apenas retomar
                currentTrack.play().catch(error => {
                    console.log('Não foi possível retomar áudio:', error.message);
                });
            } else {
                // Se não tem contexto e não tem música, tocar menu por padrão
                playMenuMusic();
            }
        }

        return isMuted;
    }

    function setVolume(volume) {
        menuTracks.forEach(track => {
            track.volume = volume;
        });
        gameplayTracks.forEach(track => {
            track.volume = volume;
        });
    }

    function getMutedState() {
        return isMuted;
    }

    function hasUserInteracted() {
        return userHasInteracted;
    }

    function resetContext() {
        // Função para resetar completamente o contexto (usar apenas quando necessário)
        currentContext = null;
    }

    return {
        playMenuMusic,
        playGameMusic,
        stopCurrentTrack,
        toggleMute,
        setVolume,
        getMutedState,
        hasUserInteracted,
        resetContext
    };
})();
