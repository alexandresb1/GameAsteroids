const PauseHUD = (function () {
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
            
            <button id="endGameBtn" class="pause-button end-button">
                🏁 Finalizar Jogo
            </button>
            
            <button id="backToMenuBtn" class="pause-button menu-button">
                🏠 Menu Principal
            </button>
        </div>
        
        <div class="pause-instructions">
            <p>Pressione <kbd>ESC</kbd> para continuar</p>
        </div>
    </div>
    
    <!-- Popup de confirmação de finalização -->
    <div id="endGameConfirm" class="end-game-popup" style="display: none;">
        <div class="end-game-content">
            <h2 class="end-game-title">FINALIZAR JOGO?</h2>
            
            <div class="end-game-stats">
                <div class="stat-item">
                    <span class="stat-label">Score Atual:</span>
                    <span id="currentScoreValue" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tempo de Jogo:</span>
                    <span id="currentTimeValue" class="stat-value">0:00</span>
                </div>
            </div>
            
            <p class="end-game-warning">
                Seu progresso será salvo e você voltará ao menu principal.
            </p>
            
            <div class="end-game-buttons">
                <button id="cancelEndBtn" class="end-game-button cancel-button">
                    Cancelar
                </button>
                <button id="confirmEndBtn" class="end-game-button confirm-button">
                    Finalizar
                </button>
            </div>
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
            $('#resumeGameBtn').on('click', function () {
                hide();
                GameFunctions.resume();
            });

            $('#endGameBtn').on('click', function () {
                showEndGameConfirm();
            });

            $('#backToMenuBtn').on('click', function () {
                // Esconder LOCALMENTE primeiro para garantir feedback visual imediato
                forceHide();

                // Depois chamar a função do jogo que vai limpar tudo
                GameFunctions.backToMenu();
            });

            // Eventos do popup de confirmação
            $('#cancelEndBtn').on('click', function () {
                hideEndGameConfirm();
            });

            $('#confirmEndBtn').on('click', function () {
                endGameAndSave();
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
            // CRÍTICO: Remover style inline que foi forçado pelo forceHide
            $overlay.removeAttr('style');

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
            // Abordagem NUCLEAR: Forçar style inline com !important
            // Usando setProperty para garantir !important
            $overlay[0].style.setProperty('display', 'none', 'important');
            $overlay[0].style.setProperty('opacity', '0', 'important');
            $overlay[0].style.setProperty('pointer-events', 'none', 'important');

            // Garantir que não há listeners de eventos ativos
            $overlay.off('transitionend');
        }
    }

    function isVisible() {
        const $overlay = $('#pauseOverlay');
        return $overlay.length && $overlay.css('display') !== 'none';
    }

    function showEndGameConfirm() {
        // Obter dados atuais do jogo
        const currentScore = typeof GameFunctions !== 'undefined' ? GameFunctions.getScore() : 0;
        const playTime = typeof ProgressionSystem !== 'undefined' ? ProgressionSystem.getPlayTime() : 0;
        
        console.log('=== FINALIZAR JOGO ===');
        console.log('Score atual:', currentScore);
        console.log('Tempo de jogo (segundos):', playTime);
        
        // Formatar tempo de jogo
        const totalSeconds = Math.floor(playTime);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let timeString = '';
        if (hours > 0) {
            timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (minutes > 0) {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // Menos de 1 minuto - mostrar apenas segundos
            timeString = `0:${seconds.toString().padStart(2, '0')}`;
        }
        
        console.log('Tempo formatado:', timeString);
        
        // Atualizar valores no popup
        $('#currentScoreValue').text(currentScore);
        $('#currentTimeValue').text(timeString);
        
        // Mostrar popup com animação
        const $popup = $('#endGameConfirm');
        $popup.css({
            display: 'flex',
            opacity: 0
        });
        
        setTimeout(() => {
            $popup.css({
                transition: 'opacity 0.3s ease',
                opacity: 1
            });
        }, 10);
    }

    function hideEndGameConfirm() {
        const $popup = $('#endGameConfirm');
        $popup.css({
            transition: 'opacity 0.2s ease',
            opacity: 0
        });
        
        setTimeout(() => {
            $popup.css('display', 'none');
        }, 200);
    }

    function endGameAndSave() {
        // Esconder popup
        hideEndGameConfirm();
        
        // Obter score atual
        const currentScore = typeof GameFunctions !== 'undefined' ? GameFunctions.getScore() : 0;
        
        // Salvar progresso
        if (typeof ProgressionSystem !== 'undefined') {
            // Salvar tempo da sessão atual
            ProgressionSystem.saveCurrentSession();
            
            // Atualizar score (verifica se é novo recorde)
            ProgressionSystem.updateScore(currentScore);
            
            // Adicionar ao score total
            ProgressionSystem.addToTotalScore(currentScore);
        }
        
        // Esconder menu de pause
        forceHide();
        
        // Voltar ao menu principal
        if (typeof GameFunctions !== 'undefined') {
            GameFunctions.backToMenu();
        }
    }

    // Expor explicitamente para window para garantir acesso global
    window.PauseHUD = {
        show,
        hide,
        forceHide,
        isVisible
    };

    return window.PauseHUD;
})();
