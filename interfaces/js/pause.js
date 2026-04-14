const PauseHUD = (function () {
    let isLoaded = false;

    function updateAudioButtonStatus() {
        const $btn = $('#toggleAudioBtn');
        const isMuted = AudioManager.getMutedState();
        const $status = $btn.find('#pauseAudioStatus');
        const $icon = $btn.find('.button-icon');
        
        if (isMuted) {
            $btn.attr('data-audio-status', 'muted');
            $status.text('DESATIVADA');
            $icon.html('<i class="fas fa-volume-mute"></i>');
        } else {
            $btn.attr('data-audio-status', 'active');
            $status.text('ATIVADA');
            $icon.html('<i class="fas fa-volume-up"></i>');
        }
    }

    async function loadHTML() {
        if (isLoaded) return;

        try {
            // Carregar HTML do arquivo
            const response = await fetch('interfaces/html/pause.html');
            if (!response.ok) {
                throw new Error(`Erro ao carregar pause.html: ${response.status}`);
            }
            const html = await response.text();

            // Adicionar HTML ao body usando jQuery
            $('body').append(html);

            // Carregar CSS usando jQuery
            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/pause.css'
            }).appendTo('head');

            // Configurar eventos dos botões usando jQuery
            $('#resumeGameBtn').on('click', function () {
                console.log('=== RESUME BUTTON CLICADO ===');
                
                // Verificar se realmente está pausado antes de resumir
                if (typeof GameFunctions !== 'undefined') {
                    const currentState = GameFunctions.getGameState();
                    console.log('Estado atual do jogo:', currentState);
                    
                    if (currentState === 'paused') {
                        hide();
                        GameFunctions.resume();
                    } else {
                        console.warn('Tentativa de resumir quando não está pausado. Estado:', currentState);
                        // Se não está pausado, destruir o overlay
                        destroy();
                    }
                } else {
                    console.error('GameFunctions não disponível');
                    forceHide();
                }
            });

            $('#toggleAudioBtn').on('click', function () {
                if (typeof AudioManager !== 'undefined') {
                    AudioManager.toggleMute();
                    updateAudioButtonStatus();
                }
            });

            $('#endGameBtn').on('click', function () {
                showEndGameConfirm();
            });

            $('#backToMenuBtn').on('click', function () {
                console.log('=== VOLTAR AO MENU CLICADO ===');
                
                // Esconder LOCALMENTE primeiro para garantir feedback visual imediato
                forceHide();

                // Pequeno delay para garantir que o forceHide foi aplicado
                setTimeout(() => {
                    // Depois chamar a função do jogo que vai limpar tudo
                    if (typeof GameFunctions !== 'undefined') {
                        GameFunctions.backToMenu();
                    }
                }, 50);
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
        // PROTEÇÃO: Só mostrar se o jogo está realmente pausado
        if (typeof GameFunctions !== 'undefined') {
            const currentState = GameFunctions.getGameState();
            if (currentState !== 'paused') {
                console.warn('PauseHUD.show() bloqueado - gameState não é paused:', currentState);
                return;
            }
        }
        
        loadHTML().then(() => {
            const $overlay = $('#pauseOverlay');
            const $popup = $('#endGameConfirm');
            
            if ($overlay.length) {
                // CRÍTICO: Limpar TODOS os estilos inline forçados
                $overlay[0].removeAttribute('style');
                
                // Garantir que o popup está escondido
                if ($popup.length) {
                    $popup.css('display', 'none');
                }

                $overlay.css({
                    display: 'flex',
                    opacity: 0
                });
                
                // Atualizar estado do botão de áudio
                if (typeof AudioManager !== 'undefined') {
                    updateAudioButtonStatus();
                }

                // Animação de entrada usando jQuery
                setTimeout(() => {
                    $overlay.css({
                        transition: 'opacity 0.3s ease',
                        opacity: 1
                    });
                }, 10);
                
                console.log('PauseHUD show executado');
            }
        });
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
        const $popup = $('#endGameConfirm');
        
        if ($overlay.length) {
            // Abordagem NUCLEAR: Forçar style inline com !important
            // Usando setProperty para garantir !important
            $overlay[0].style.setProperty('display', 'none', 'important');
            $overlay[0].style.setProperty('opacity', '0', 'important');
            $overlay[0].style.setProperty('pointer-events', 'none', 'important');
            $overlay[0].style.setProperty('visibility', 'hidden', 'important');

            // Garantir que não há listeners de eventos ativos
            $overlay.off('transitionend');
            
            // Remover qualquer animação pendente
            $overlay.stop(true, true);
        }
        
        // Esconder popup de confirmação também
        if ($popup.length) {
            $popup[0].style.setProperty('display', 'none', 'important');
            $popup[0].style.setProperty('opacity', '0', 'important');
            $popup[0].style.setProperty('pointer-events', 'none', 'important');
            $popup[0].style.setProperty('visibility', 'hidden', 'important');
        }
        
        console.log('PauseHUD forceHide executado');
    }

    function destroy() {
        console.log('=== PauseHUD DESTROY INICIADO ===');
        
        const $overlay = $('#pauseOverlay');
        const $popup = $('#endGameConfirm');
        
        if ($overlay.length) {
            // Remover TODOS os event listeners
            $overlay.find('*').off();
            $overlay.off();
            
            // Parar todas as animações
            $overlay.stop(true, true);
            if ($popup.length) {
                $popup.stop(true, true);
            }
            
            // Remover completamente do DOM
            $overlay.remove();
            
            // Marcar como não carregado para forçar recriação
            isLoaded = false;
            
            console.log('PauseHUD destruído e removido do DOM');
        } else {
            console.log('PauseHUD não encontrado no DOM');
        }
        
        console.log('=== PauseHUD DESTROY CONCLUÍDO ===');
    }

    function isVisible() {
        const $overlay = $('#pauseOverlay');
        if (!$overlay.length) return false;
        
        // Verificar múltiplas condições para garantir que está realmente visível
        const display = $overlay.css('display');
        const visibility = $overlay.css('visibility');
        const opacity = parseFloat($overlay.css('opacity'));
        
        const visible = display !== 'none' && visibility !== 'hidden' && opacity > 0;
        
        console.log('PauseHUD.isVisible:', visible, { display, visibility, opacity });
        
        return visible;
    }

    function showEndGameConfirm() {
        // Obter dados atuais do jogo
        const currentScore = typeof GameFunctions !== 'undefined' ? GameFunctions.getScore() : 0;
        const sessionTime = typeof ProgressionSystem !== 'undefined' ? ProgressionSystem.getSessionTime() : 0;
        
        console.log('=== FINALIZAR JOGO ===');
        console.log('Score atual:', currentScore);
        console.log('Tempo da sessão (segundos):', sessionTime);
        
        // Formatar tempo de jogo
        const totalSeconds = Math.floor(sessionTime);
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
        destroy,
        isVisible
    };

    return window.PauseHUD;
})();
