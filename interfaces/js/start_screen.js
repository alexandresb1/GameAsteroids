const StartScreenHUD = (function () {
    let isLoaded = false;

    function loadHTML() {
        if (isLoaded) return;

        try {
            // HTML embutido diretamente no JavaScript para evitar problemas de CORS
            const html = `
<div id="startScreenOverlay" class="interface-overlay">
    <div class="start-screen-container">
         <img src="assets/images/AsteroidsLogo.png" 
             alt="Asteroids Logo" 
             class="game-logo">

        <!-- Botões do menu -->
        <div class="menu-buttons">
            <button id="startGameBtn" class="menu-button">
                <span class="button-icon">▶</span>
                <span class="button-text">JOGAR</span>
            </button>
            
            <button id="customizeBtn" class="menu-button">
                <span class="button-icon">⚙</span>
                <span class="button-text">PERSONALIZAR</span>
            </button>
            
            <button id="helpBtn" class="menu-button">
                <span class="button-icon">?</span>
                <span class="button-text">COMO JOGAR</span>
            </button>

            <button id="settingsBtn" class="menu-button">
                <span class="button-icon">⚙</span>
                <span class="button-text">CONFIGURAÇÕES</span>
            </button>
        </div>

        <!-- Toggle Modo Mobile -->
        <div class="mobile-mode-toggle">
            <label class="toggle-container">
                <input type="checkbox" id="mainMenuMobileToggle">
                <span class="toggle-slider-main"></span>
            </label>
            <span id="mainMenuMobileStatus" class="toggle-label-main">📱 MODO MOBILE</span>
        </div>
    </div>
</div>`;

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
                AudioManager.playGameMusic();  // <---- música de gameplay
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
            const $mainMobileToggle = $('#mainMenuMobileToggle');
            const $mainMobileStatus = $('#mainMenuMobileStatus');
            
            // Carregar estado atual
            if (typeof ProgressionSystem !== 'undefined') {
                const isMobile = ProgressionSystem.isMobileMode();
                $mainMobileToggle.prop('checked', isMobile);
                updateMobileToggleLabel(isMobile);
            }
            
            $mainMobileToggle.on('change', function () {
                const enabled = $(this).is(':checked');
                if (typeof ProgressionSystem !== 'undefined') {
                    ProgressionSystem.setMobileMode(enabled);
                    updateMobileToggleLabel(enabled);
                }
            });

            function updateMobileToggleLabel(enabled) {
                $mainMobileStatus.text(enabled ? '📱 MODO MOBILE: ON' : '📱 MODO MOBILE: OFF');
                $mainMobileStatus.css('color', enabled ? '#00ff00' : '#00ffff');
            }

            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela inicial:', error);
        }
    }

    function show() {
        loadHTML();

        // PROTEÇÃO: Destruir qualquer PauseHUD residual
        if (typeof PauseHUD !== 'undefined') {
            PauseHUD.destroy();
        }

        const overlay = $('#startScreenOverlay');
        overlay.css({ display: 'flex', opacity: 0 });

        // Atualizar estado do toggle mobile
        if (typeof ProgressionSystem !== 'undefined') {
            const isMobile = ProgressionSystem.isMobileMode();
            $('#mainMenuMobileToggle').prop('checked', isMobile);
            const $status = $('#mainMenuMobileStatus');
            $status.text(isMobile ? '📱 MODO MOBILE: ON' : '📱 MODO MOBILE: OFF');
            $status.css('color', isMobile ? '#00ff00' : '#00ffff');
        }

        // Tentar tocar música do menu (será controlado pelo AudioManager)
        AudioManager.playMenuMusic();

        setTimeout(() => {
            overlay.css({ transition: 'opacity 0.8s', opacity: 1 });
        }, 10);
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