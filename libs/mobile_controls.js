// Sistema de Controles Mobile para Asteroids
const MobileControls = (function () {
    let isMobile = false;
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickTouch = null;
    let joystickAngle = 0;
    let joystickDistance = 0;
    
    const JOYSTICK_MAX_DISTANCE = 50; // pixels
    const JOYSTICK_DEADZONE = 0.2; // 20% de zona morta

    // Inicializar controles mobile
    function init() {
        // Verificar se modo mobile está ativado nas configurações
        if (typeof ProgressionSystem !== 'undefined') {
            isMobile = ProgressionSystem.isMobileMode();
        }
        
        console.log('=== MODO MOBILE ===');
        console.log('Modo mobile ativado?', isMobile);
        
        if (!isMobile) {
            console.log('Modo mobile desativado. Ative nas Configurações.');
            return;
        }

        console.log('Inicializando controles mobile...');
        createMobileUI();
        setupTouchEvents();
        adjustViewport();
        console.log('Controles mobile inicializados!');
    }
    
    // Ajustar viewport para mobile
    function adjustViewport() {
        // Forçar viewport mobile
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
        
        // Ajustar canvas para tela cheia
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
        }
        
        console.log('Viewport ajustado para mobile');
    }

    // Criar interface mobile
    function createMobileUI() {
        const html = `
            <!-- HUD Mobile Simplificada -->
            <div class="mobile-hud-compact">
                <div class="mobile-hud-item">
                    <span class="mobile-hud-label">Score</span>
                    <span class="mobile-hud-value" id="mobileScore">0</span>
                </div>
                <div class="mobile-hud-item">
                    <span class="mobile-hud-label">Vidas</span>
                    <span class="mobile-hud-value" id="mobileLives">3</span>
                </div>
            </div>
            
            <!-- Botão de Pause Mobile -->
            <button class="mobile-pause-btn" id="mobilePauseBtn">⏸</button>
            
            <!-- Controles Mobile -->
            <div id="mobileControls" class="mobile-controls">
                <!-- Joystick Virtual -->
                <div id="joystickArea" class="joystick-area">
                    <div id="joystickBase" class="joystick-base">
                        <div id="joystickStick" class="joystick-stick"></div>
                    </div>
                </div>
                
                <!-- Botão de Especial -->
                <div id="specialButton" class="special-button">
                    <span class="special-icon">⚡</span>
                </div>
            </div>
        `;

        $('body').append(html);
        console.log('HTML dos controles mobile adicionado ao body');

        // Carregar CSS
        const $link = $('<link>', {
            rel: 'stylesheet',
            href: 'css/mobile_controls.css'
        });
        
        $link.on('load', () => {
            console.log('CSS dos controles mobile carregado com sucesso');
        });
        
        $link.on('error', () => {
            console.error('ERRO ao carregar CSS dos controles mobile!');
        });
        
        $link.appendTo('head');
        
        // Carregar CSS da HUD mobile
        $('<link>', {
            rel: 'stylesheet',
            href: 'css/mobile_hud.css'
        }).appendTo('head');
        
        // Adicionar classe mobile-mode ao body
        $('body').addClass('mobile-mode');
        console.log('Classe mobile-mode adicionada ao body');
    }

    // Configurar eventos de touch
    function setupTouchEvents() {
        const $joystickArea = $('#joystickArea');
        const $specialButton = $('#specialButton');

        // Eventos do Joystick
        $joystickArea.on('touchstart', handleJoystickStart);
        $joystickArea.on('touchmove', handleJoystickMove);
        $joystickArea.on('touchend touchcancel', handleJoystickEnd);

        // Eventos do Botão Especial
        $specialButton.on('touchstart', handleSpecialPress);
        
        // Evento do Botão de Pause
        $('#mobilePauseBtn').on('click touchstart', function(e) {
            e.preventDefault();
            if (typeof GameFunctions !== 'undefined') {
                GameFunctions.togglePause();
            }
        });

        // Prevenir scroll e zoom em mobile
        $(document).on('touchmove', function(e) {
            if ($(e.target).closest('.mobile-controls, .mobile-hud-compact, .mobile-pause-btn').length) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Atualizar HUD mobile periodicamente
        setInterval(updateMobileHUD, 100);
    }
    
    // Atualizar HUD mobile
    function updateMobileHUD() {
        if (!isMobile) return;
        
        if (typeof GameFunctions !== 'undefined') {
            $('#mobileScore').text(GameFunctions.getScore());
            $('#mobileLives').text(GameFunctions.getLives());
        }
    }

    // Handlers do Joystick
    function handleJoystickStart(e) {
        e.preventDefault();
        const touch = e.originalEvent.touches[0];
        joystickTouch = touch.identifier;
        
        const $base = $('#joystickBase');
        const rect = $base[0].getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        joystickActive = true;
        updateJoystick(touch.clientX, touch.clientY);
    }

    function handleJoystickMove(e) {
        e.preventDefault();
        if (!joystickActive) return;
        
        const touches = e.originalEvent.touches;
        for (let i = 0; i < touches.length; i++) {
            if (touches[i].identifier === joystickTouch) {
                updateJoystick(touches[i].clientX, touches[i].clientY);
                break;
            }
        }
    }

    function handleJoystickEnd(e) {
        e.preventDefault();
        joystickActive = false;
        joystickAngle = 0;
        joystickDistance = 0;
        
        // Resetar posição visual do stick
        $('#joystickStick').css({
            transform: 'translate(-50%, -50%)'
        });
    }

    function updateJoystick(touchX, touchY) {
        const dx = touchX - joystickCenter.x;
        const dy = touchY - joystickCenter.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, -dy); // Invertido para corresponder ao sistema do jogo
        
        // Limitar distância
        const clampedDistance = Math.min(distance, JOYSTICK_MAX_DISTANCE);
        joystickDistance = clampedDistance / JOYSTICK_MAX_DISTANCE;
        
        // Aplicar deadzone
        if (joystickDistance < JOYSTICK_DEADZONE) {
            joystickDistance = 0;
        } else {
            // Normalizar após deadzone
            joystickDistance = (joystickDistance - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE);
        }
        
        joystickAngle = angle;
        
        // Atualizar posição visual do stick
        const visualX = Math.sin(angle) * clampedDistance;
        const visualY = -Math.cos(angle) * clampedDistance;
        
        $('#joystickStick').css({
            transform: `translate(calc(-50% + ${visualX}px), calc(-50% + ${visualY}px))`
        });
    }

    // Handler do Botão Especial
    function handleSpecialPress(e) {
        e.preventDefault();
        
        // Feedback visual
        const $button = $('#specialButton');
        $button.addClass('pressed');
        setTimeout(() => $button.removeClass('pressed'), 200);
        
        // Disparar especial no jogo
        if (typeof GameFunctions !== 'undefined') {
            GameFunctions.triggerSpecial();
        }
    }

    // Obter estado do joystick
    function getJoystickState() {
        return {
            active: joystickActive,
            angle: joystickAngle,
            distance: joystickDistance
        };
    }

    // Verificar se é mobile
    function isMobileDevice() {
        return isMobile;
    }

    // Mostrar/esconder controles
    function show() {
        console.log('MobileControls.show() chamado. isMobile:', isMobile);
        if (isMobile) {
            const $controls = $('#mobileControls');
            console.log('Elemento #mobileControls encontrado:', $controls.length > 0);
            $controls.css('display', 'block').fadeIn(300);
            console.log('Controles mobile exibidos');
        } else {
            console.log('Não é mobile, controles não serão exibidos');
        }
    }

    function hide() {
        console.log('MobileControls.hide() chamado');
        if (isMobile) {
            $('#mobileControls').fadeOut(300);
        }
    }

    return {
        init,
        isMobileDevice,
        getJoystickState,
        show,
        hide
    };
})();

// Inicializar quando o documento estiver pronto
$(document).ready(function() {
    MobileControls.init();
});
