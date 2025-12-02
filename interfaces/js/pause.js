const PauseHUD = (function() {
    let isLoaded = false;
    
    function loadHTML() {
        if (isLoaded) return;
        
        try {
            // HTML embutido diretamente no JavaScript para evitar problemas de CORS
            const html = `
<div id="pauseOverlay" class="interface-overlay">
    <div class="pause-container">
        <h1 class="pause-title">JOGO PAUSADO</h1>
        
        <div class="pause-buttons">
            <button id="resumeGameBtn" class="pause-button resume-button">
                ▶️ Continuar
            </button>
            
            <button id="backToMenuBtn" class="pause-button menu-button">
                🏠 Menu Principal
            </button>
        </div>
        
        <div class="pause-instructions">
            <p>Pressione <kbd>ESC</kbd> para continuar</p>
        </div>
    </div>
</div>`;
            
            // Adicionar HTML ao body usando jQuery
            $('body').append(html);
            
            // Carregar CSS usando jQuery
            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/pause.css'
            }).appendTo('head');
            
            // Configurar eventos dos botões usando jQuery
            $('#resumeGameBtn').on('click', function() {
                hide();
                GameFunctions.resume();
            });
            
            $('#backToMenuBtn').on('click', function() {
                // Usar forceHide para esconder imediatamente sem animação
                forceHide();
                // Chamar backToMenu sem delay, já que forceHide é imediato
                GameFunctions.backToMenu();
            });
            
            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela de pause:', error);
        }
    }
    
    function show() {
        loadHTML();
        
        const $overlay = $('#pauseOverlay');
        if ($overlay.length) {
            $overlay.css({
                display: 'flex',
                opacity: 0
            });
            
            // Animação de entrada usando jQuery
            setTimeout(() => {
                $overlay.css({
                    transition: 'opacity 0.3s ease',
                    opacity: 1
                });
            }, 10);
        }
    }
    
    function hide() {
        const $overlay = $('#pauseOverlay');
        if ($overlay.length) {
            $overlay.css({
                transition: 'opacity 0.2s ease',
                opacity: 0
            });
            
            setTimeout(() => {
                $overlay.css('display', 'none');
            }, 200);
        }
    }

    function forceHide() {
        const $overlay = $('#pauseOverlay');
        if ($overlay.length) {
            $overlay.css({
                display: 'none',
                opacity: 0
            });
        }
    }
    
    function isVisible() {
        const $overlay = $('#pauseOverlay');
        return $overlay.length && $overlay.css('display') !== 'none';
    }
    
    return {
        show,
        hide,
        forceHide,
        isVisible
    };
})();
