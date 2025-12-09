const AudioManager = (function () {
    // Criar os objetos de áudio
    const menuTracks = [
        new Audio('audio/Main Menu 1.mp3'),
        new Audio('audio/Main Menu 2.mp3')
    ];
    const gameMusic = new Audio('audio/Gameplay1.mp3');

    // Configurações comuns
    menuTracks.forEach(track => {
        track.loop = true;
        track.volume = 0.7;
    });
    gameMusic.loop = true;
    gameMusic.volume = 0.7;

    let currentTrack = null;
    let isMuted = true; // Começa mutado para evitar problemas de autoplay
    let userHasInteracted = false;
    let pendingTrack = null; // Para tocar depois da primeira interação
    let currentContext = null; // 'menu' ou 'game' - rastreia o contexto atual

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
        // Se já estamos no contexto do menu e não é para forçar restart, não fazer nada
        if (currentContext === 'menu' && !forceRestart) {
            console.log('Já estamos no menu, música continua tocando');
            return Promise.resolve();
        }

        // Marcar que estamos no contexto do menu
        currentContext = 'menu';

        // Selecionar aleatoriamente entre as faixas de menu
        const randomIndex = Math.floor(Math.random() * menuTracks.length);
        const selectedTrack = menuTracks[randomIndex];
        console.log(`Tocando música do menu: ${randomIndex + 1}`);
        return playTrack(selectedTrack);
    }

    function playGameMusic() {
        // Marcar que estamos no contexto do jogo
        currentContext = 'game';
        return playTrack(gameMusic);
    }

    function stopCurrentTrack() {
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
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
        } else if (userHasInteracted && pendingTrack) {
            playTrack(pendingTrack);
        } else if (userHasInteracted && currentTrack) {
            // Se já tem uma música carregada, apenas retomar
            currentTrack.play().catch(error => {
                console.log('Não foi possível retomar áudio:', error.message);
            });
        }

        // Notificar mudança para atualizar UI
        if (typeof AudioUI !== 'undefined') {
            AudioUI.updateIcon();
        }

        return isMuted;
    }

    function setVolume(volume) {
        menuTracks.forEach(track => {
            track.volume = volume;
        });
        gameMusic.volume = volume;
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
