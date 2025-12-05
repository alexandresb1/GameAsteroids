const Game = (function() {
    let $canvas, ctx;
    
    // Controle de FPS fixo
    const TARGET_FPS = 60;
    const FRAME_DURATION = 1000 / TARGET_FPS; // ~16.67ms por frame
    let lastFrameTime = 0;
    let accumulatedTime = 0;

    function resizeCanvas() {
        $canvas[0].width = $(window).width();
        $canvas[0].height = $(window).height();
    }

    function init(canvasSelector) {
        $canvas = $(canvasSelector);
        ctx = $canvas[0].getContext('2d');

        resizeCanvas();
        $(window).resize(resizeCanvas);

        // Inicia o loop de renderização
        lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function update(currentTime) {
        if (typeof GameFunctions !== "undefined") {
            GameFunctions.update(currentTime); // passa o timestamp
        }
    }

    function draw() {
        ctx.clearRect(0, 0, $canvas[0].width, $canvas[0].height);

        if (typeof GameFunctions !== "undefined") {
            GameFunctions.draw(ctx, $canvas[0]); // passa ctx e canvas
        }
    }

    function gameLoop(currentTime) {
        // Calcular delta time desde o último frame
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // Acumular tempo
        accumulatedTime += deltaTime;
        
        // Processar frames fixos de 60 FPS
        while (accumulatedTime >= FRAME_DURATION) {
            update(currentTime);
            accumulatedTime -= FRAME_DURATION;
        }
        
        // Sempre desenhar (interpolação visual)
        draw();
        
        requestAnimationFrame(gameLoop);
    }

    return { init };
})();
