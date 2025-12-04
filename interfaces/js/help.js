const HelpHUD = (function () {
    let isLoaded = false;

    function loadHTML() {
        if (isLoaded) return;

        try {
            const html = `
            <div id="helpOverlay" class="interface-overlay">
                <div class="help-container">
                    <h1 class="help-title">COMO JOGAR</h1>
                    
                    <div class="help-content">
                        <div class="help-section">
                            <h2 class="section-title">🎮 CONTROLES</h2>
                            <div class="control-list">
                                <div class="control-item">
                                    <span class="key">↑</span>
                                    <span class="description">Acelerar nave</span>
                                </div>
                                <div class="control-item">
                                    <span class="key">← →</span>
                                    <span class="description">Rotacionar nave</span>
                                </div>
                                <div class="control-item">
                                    <span class="key">ESPAÇO</span>
                                    <span class="description">Atirar</span>
                                </div>
                                <div class="control-item">
                                    <span class="key">X</span>
                                    <span class="description">Especial (Shockwave)</span>
                                </div>
                                <div class="control-item">
                                    <span class="key">ESC</span>
                                    <span class="description">Pausar jogo</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="help-section">
                            <h2 class="section-title">⭐ POWERUPS</h2>
                            <div class="powerup-list">
                                <div class="powerup-item">
                                    <span class="powerup-name">Double Shot</span>
                                    <span class="powerup-desc">Atira 2 projéteis</span>
                                </div>
                                <div class="powerup-item">
                                    <span class="powerup-name">Triple Shot</span>
                                    <span class="powerup-desc">Atira 3 projéteis</span>
                                </div>
                                <div class="powerup-item">
                                    <span class="powerup-name">Piercing Shot</span>
                                    <span class="powerup-desc">Atravessa asteroides</span>
                                </div>
                                <div class="powerup-item">
                                    <span class="powerup-name">Extra Life</span>
                                    <span class="powerup-desc">+1 vida</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="help-section">
                            <h2 class="section-title">💡 DICAS</h2>
                            <ul class="tips-list">
                                <li>Use o especial (X) em emergências!</li>
                                <li>Asteroides maiores dão mais pontos</li>
                                <li>Desbloqueie naves com pontuações altas</li>
                                <li>Cada nave tem atributos únicos</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="help-buttons">
                        <button id="backToMenuFromHelp" class="help-button">
                            ← VOLTAR AO MENU
                        </button>
                    </div>
                </div>
            </div>`;

            $('body').append(html);

            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/help.css'
            }).appendTo('head');

            $('#backToMenuFromHelp').on('click', function () {
                hide();
                if (typeof StartScreenHUD !== 'undefined') {
                    StartScreenHUD.show();
                }
            });

            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela de ajuda:', error);
        }
    }

    function show() {
        loadHTML();

        const $overlay = $('#helpOverlay');
        if ($overlay.length) {
            $overlay.css({
                display: 'flex',
                opacity: 0
            });

            setTimeout(() => {
                $overlay.css({
                    transition: 'opacity 0.3s ease',
                    opacity: 1
                });
            }, 10);
        }
    }

    function hide() {
        const $overlay = $('#helpOverlay');
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

    return {
        show,
        hide
    };
})();
