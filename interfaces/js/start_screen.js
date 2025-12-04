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

            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela inicial:', error);
        }
    }

    function show() {
        loadHTML();

        const overlay = $('#startScreenOverlay');
        overlay.css({ display: 'flex', opacity: 0 });

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