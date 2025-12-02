const AudioUI = (function() {
    let $audioButton = null;
    let $pauseButton = null;
    let isInitialized = false;

    // Ícones SVG para som ligado e desligado
    const soundOnIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    `;

    const soundOffIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
    `;

    // Ícone de pause
    const pauseIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
    `;

    function createAudioButton() {
        if ($audioButton) return;

        // Criar botão de áudio usando jQuery
        $audioButton = $('<div>', {
            id: 'audioToggleBtn',
            css: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                transition: 'all 0.3s ease',
                userSelect: 'none'
            }
        });

        // Efeitos hover usando jQuery
        $audioButton.hover(
            function() {
                $(this).css({
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)'
                });
            },
            function() {
                $(this).css({
                    background: 'rgba(0, 0, 0, 0.7)',
                    transform: 'scale(1)'
                });
            }
        );

        // Evento de clique usando jQuery
        $audioButton.on('click', function() {
            const wasMuted = AudioManager.getMutedState();
            const isMuted = AudioManager.toggleMute();
            updateIcon();
            
            // Mostrar notificação se o áudio foi ativado pela primeira vez
            if (wasMuted && !isMuted) {
                showAudioNotification('🔊 Áudio ativado!');
            } else if (!wasMuted && isMuted) {
                showAudioNotification('🔇 Áudio desativado');
            }
            
            // Feedback visual usando jQuery
            $(this).css('transform', 'scale(0.9)');
            setTimeout(() => {
                $(this).css('transform', 'scale(1)');
            }, 150);
        });

        // Adicionar ao body usando jQuery
        $('body').append($audioButton);
        
        // Atualizar ícone inicial
        updateIcon();
    }

    function createPauseButton() {
        if ($pauseButton) return;

        // Criar botão de pause usando jQuery
        $pauseButton = $('<div>', {
            id: 'pauseToggleBtn',
            css: {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'none', // Inicialmente oculto
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                transition: 'all 0.3s ease',
                userSelect: 'none'
            }
        });

        // Adicionar ícone de pause
        $pauseButton.html(pauseIcon);

        // Efeitos hover usando jQuery
        $pauseButton.hover(
            function() {
                $(this).css({
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateX(-50%) scale(1.1)'
                });
            },
            function() {
                $(this).css({
                    background: 'rgba(0, 0, 0, 0.7)',
                    transform: 'translateX(-50%) scale(1)'
                });
            }
        );

        // Evento de clique usando jQuery
        $pauseButton.on('click', function() {
            if (typeof GameFunctions !== 'undefined') {
                GameFunctions.togglePause();
            }
            
            // Feedback visual usando jQuery
            $(this).css('transform', 'translateX(-50%) scale(0.9)');
            setTimeout(() => {
                $(this).css('transform', 'translateX(-50%) scale(1)');
            }, 150);
        });

        // Adicionar tooltip
        $pauseButton.attr('title', 'Pausar jogo (ESC)');

        // Adicionar ao body usando jQuery
        $('body').append($pauseButton);
    }

    function updateIcon() {
        if (!$audioButton) return;

        const isMuted = AudioManager.getMutedState();
        $audioButton.html(isMuted ? soundOffIcon : soundOnIcon);
        
        // Adicionar tooltip usando jQuery
        $audioButton.attr('title', isMuted ? 'Clique para ativar o som' : 'Clique para desativar o som');
    }

    function showAudioNotification(message) {
        // Criar elemento de notificação usando jQuery
        const $notification = $('<div>', {
            text: message,
            css: {
                position: 'fixed',
                top: '80px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '5px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                zIndex: 1001,
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none'
            }
        });

        $('body').append($notification);

        // Animação de entrada usando jQuery
        setTimeout(() => {
            $notification.css('opacity', '1');
        }, 10);

        // Remover após 2 segundos usando jQuery
        setTimeout(() => {
            $notification.css('opacity', '0');
            setTimeout(() => {
                $notification.remove();
            }, 300);
        }, 2000);
    }

    function init() {
        if (isInitialized) return;
        
        createAudioButton();
        createPauseButton();
        isInitialized = true;
    }

    function show() {
        if ($audioButton) {
            $audioButton.css('display', 'flex');
        }
    }

    function hide() {
        if ($audioButton) {
            $audioButton.hide();
        }
    }

    function showPauseButton() {
        if ($pauseButton) {
            $pauseButton.css('display', 'flex');
        }
    }

    function hidePauseButton() {
        if ($pauseButton) {
            $pauseButton.hide();
        }
    }

    // Inicializar automaticamente quando o DOM estiver pronto usando jQuery
    $(document).ready(init);

    return {
        init,
        updateIcon,
        show,
        hide,
        showPauseButton,
        hidePauseButton
    };
})();
