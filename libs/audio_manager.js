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

        stopCurrentTrack();
        currentTrack = track;

        return currentTrack.play().catch(error => {
            console.log('Não foi possível tocar áudio:', error.message);
            // Marcar como pendente para tentar novamente
            pendingTrack = track;
        });
    }

    function playMenuMusic() {
        // Selecionar aleatoriamente entre as faixas de menu
        const randomIndex = Math.floor(Math.random() * menuTracks.length);
        const selectedTrack = menuTracks[randomIndex];
        console.log(`Tocando música do menu: ${randomIndex + 1}`);
        return playTrack(selectedTrack);
    }

    function playGameMusic() {
        return playTrack(gameMusic);
    }

    function stopCurrentTrack() {
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }
        currentTrack = null;
    }

    function toggleMute() {
        isMuted = !isMuted;

        if (isMuted) {
            stopCurrentTrack();
        } else if (userHasInteracted && pendingTrack) {
            playTrack(pendingTrack);
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

    return {
        playMenuMusic,
        playGameMusic,
        stopCurrentTrack,
        toggleMute,
        setVolume,
        getMutedState,
        hasUserInteracted
    };
})();
