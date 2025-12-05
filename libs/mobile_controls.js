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

    // Detectar se é dispositivo mobile
    function detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);
        
        console.log('Dispositivo mobile detectado:', isMobile);
        return isMobile;
    }

    // Inicializar controles mobile
    function init() {
        detectMobile();
        
        if (!isMobile) {
            console.log('Desktop detectado - controles mobile desabilitados');
            return;
        }

        console.log('Inicializando controles mobile...');
        createMobileUI();
        setupTouchEvents();
    }

    // Criar interface mobile
    function createMobileUI() {
        const html = `
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
                    <span class="special-label">ESPECIAL</span>
                </div>
            </div>
        `;

        $('body').append(html);

        // Carregar CSS
        $('<link>', {
            rel: 'stylesheet',
            href: 'css/mobile_controls.css'
        }).appendTo('head');
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

        // Prevenir scroll e zoom em mobile
        $(document).on('touchmove', function(e) {
            if ($(e.target).closest('.mobile-controls').length) {
                e.preventDefault();
            }
        }, { passive: false });
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
        if (isMobile) {
            $('#mobileControls').fadeIn(300);
        }
    }

    function hide() {
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
