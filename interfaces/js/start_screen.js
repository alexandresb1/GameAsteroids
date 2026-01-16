const StartScreenHUD = (function () {
    let isLoaded = false;

    function updateAudioButtonStatus() {
        const $btn = $('#audioToggleMenuBtn');
        const isMuted = AudioManager.getMutedState();
        const $status = $btn.find('#audioToggleStatus');
        const $icon = $btn.find('.button-icon');
        
        if (isMuted) {
            $btn.attr('data-audio-status', 'muted');
            $status.text('DESATIVADO');
            $icon.html('<i class="fas fa-volume-mute"></i>');
        } else {
            $btn.attr('data-audio-status', 'active');
            $status.text('ATIVADO');
            $icon.html('<i class="fas fa-volume-up"></i>');
        }
    }

    function updateMobileToggleLabel(enabled) {
        $('#mobileToggleStatus').text(enabled ? 'ON' : 'OFF');
    }

    async function loadHTML() {
        if (isLoaded) return;

        try {
            // Carregar HTML do arquivo
            const response = await fetch('interfaces/html/start_screen.html');
            if (!response.ok) {
                throw new Error(`Erro ao carregar start_screen.html: ${response.status}`);
            }
            const html = await response.text();

            // Adicionar HTML ao body usando jQuery
            $('body').append(html);

            // Carregar CSS usando jQuery
            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/start_screen.css'
            }).appendTo('head');

            // Configurar eventos dos botões usando jQuery
            $('#startGameBtn').on('click', function () {
                hide();
                AudioManager.playGameMusic();
                GameFunctions.start();
            });

            $('#customizeBtn').on('click', function () {
                hide();
                if (typeof CustomizeHUD !== 'undefined') {
                    CustomizeHUD.show();
                }
            });

            $('#helpBtn').on('click', function () {
                hide();
                if (typeof HelpHUD !== 'undefined') {
                    HelpHUD.show();
                }
            });

            $('#settingsBtn').on('click', function () {
                hide();
                if (typeof SettingsHUD !== 'undefined') {
                    SettingsHUD.show();
                }
            });

            // Toggle Modo Mobile no menu principal
            const $mobileToggleBtn = $('#mobileToggleBtn');
            
            // Carregar estado atual
            if (typeof ProgressionSystem !== 'undefined') {
                const isMobile = ProgressionSystem.isMobileMode();
                updateMobileToggleLabel(isMobile);
            }
            
            $mobileToggleBtn.on('click', function () {
                if (typeof ProgressionSystem !== 'undefined') {
                    const currentState = ProgressionSystem.isMobileMode();
                    ProgressionSystem.setMobileMode(!currentState);
                    updateMobileToggleLabel(!currentState);
                }
            });

            // Evento do botão de áudio no menu
            $('#audioToggleMenuBtn').on('click', function () {
                AudioManager.toggleMute();
                updateAudioButtonStatus();
            });

            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela inicial:', error);
        }
    }

    function show() {
        loadHTML().then(() => {
            // PROTEÇÃO: Destruir qualquer PauseHUD residual
            if (typeof PauseHUD !== 'undefined') {
                PauseHUD.destroy();
            }

            const overlay = $('#startScreenOverlay');
            overlay.css({ display: 'flex', opacity: 0 });

            // Atualizar estado do toggle mobile
            if (typeof ProgressionSystem !== 'undefined') {
                const isMobile = ProgressionSystem.isMobileMode();
                updateMobileToggleLabel(isMobile);
            }

            // Atualizar status do botão de áudio
            updateAudioButtonStatus();

            // Tentar tocar música do menu (será controlado pelo AudioManager)
            AudioManager.playMenuMusic();

            setTimeout(() => {
                overlay.css({ transition: 'opacity 0.8s', opacity: 1 });
            }, 10);
        });
    }

    function hide() {
        const $overlay = $('#startScreenOverlay');
        if ($overlay.length) {
            $overlay.css({
                transition: 'opacity 0.4s',
                opacity: 0
            });

            setTimeout(() => {
                $overlay.css('display', 'none');
            }, 400);
        }
    }

    return {
        show,
        hide
    };
})();