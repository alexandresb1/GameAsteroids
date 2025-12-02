const Game = (function() {
    let $canvas, ctx;

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
        update(currentTime);
        draw();
        requestAnimationFrame(gameLoop);
    }

    return { init };
})();
