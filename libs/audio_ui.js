const AudioUI = (function () {
    let $pauseButton = null;
    let isInitialized = false;

    // Ícone de pause
    const pauseIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
    `;

    function createPauseButton() {
        if ($pauseButton) return;

        // Criar botão de pause usando jQuery
        $pauseButton = $('<div>', {
            id: 'pauseToggleBtn',
            class: 'hud-button', // Usando nova classe CSS
            css: {
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'none' // Inicialmente oculto
            }
        });

        // Adicionar ícone de pause
        $pauseButton.html(pauseIcon);

        // Efeitos hover agora são controlados via CSS (.hud-button:hover)

        // Evento de clique usando jQuery
        $pauseButton.on('click', function () {
            if (typeof GameFunctions !== 'undefined') {
                GameFunctions.togglePause();
            }

            // Feedback visual usando jQuery
            $(this).css('transform', 'translateX(-50%) scale(0.9)');
            setTimeout(() => {
                $(this).css('transform', 'translateX(-50%)'); // Remove inline scale
            }, 150);
        });

        // Adicionar tooltip
        $pauseButton.attr('title', 'Pausar jogo (ESC)');

        // Adicionar ao body usando jQuery
        $('body').append($pauseButton);
    }

    function init() {
        if (isInitialized) return;

        createPauseButton();
        isInitialized = true;
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
        showPauseButton,
        hidePauseButton
    };
})();
