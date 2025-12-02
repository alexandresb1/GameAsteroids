const GameOverHUD = (function() {
    let isLoaded = false;
    
    function loadHTML() {
        if (isLoaded) return;
        
        try {
            // HTML embutido diretamente no JavaScript para evitar problemas de CORS
            const html = `
<div id="gameOverOverlay" class="interface-overlay">
    <div class="game-over-container">
        <h1 class="game-over-title">GAME OVER</h1>
        
        <p id="finalScore" class="final-score">Pontuação Final: 0</p>
        
        <button id="restartGameBtn" class="restart-button">Jogar Novamente</button>
    </div>
</div>`;
            
            // Adicionar HTML ao body usando jQuery
            $('body').append(html);
            
            // Carregar CSS usando jQuery
            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/game_over.css'
            }).appendTo('head');
            
            // Configurar evento do botão usando jQuery
            $('#restartGameBtn').on('click', function() {
                hide();
                GameFunctions.restart();
            });
            
            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela de game over:', error);
        }
    }
    
    async function show() {
        await loadHTML();
        
        // Atualizar pontuação usando jQuery
        $('#finalScore').text(`Pontuação Final: ${GameFunctions.score}`);
        
        const $overlay = $('#gameOverOverlay');
        if ($overlay.length) {
            $overlay.css({
                display: 'flex',
                opacity: 0
            });
            
            // Animação de entrada usando jQuery
            setTimeout(() => {
                $overlay.css({
                    transition: 'opacity 0.5s',
                    opacity: 1
                });
            }, 10);
        }
    }
    
    function hide() {
        const $overlay = $('#gameOverOverlay');
        if ($overlay.length) {
            $overlay.css({
                transition: 'opacity 0.3s',
                opacity: 0
            });
            
            setTimeout(() => {
                $overlay.css('display', 'none');
            }, 300);
        }
    }
    
    return {
        show,
        hide
    };
})();