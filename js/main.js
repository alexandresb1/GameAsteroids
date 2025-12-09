$(document).ready(function() {
    // Fix para altura da viewport em mobile (considera barra do navegador)
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Executar no carregamento
    setViewportHeight();

    // Atualizar quando a janela for redimensionada ou orientação mudar
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });

    // Inicializa o canvas do jogo
    Game.init('#gameCanvas');

    // Mostrar tela inicial
    StartScreenHUD.show();

    // O áudio será gerenciado pelo AudioManager e AudioUI
    console.log('Jogo inicializado! Use o botão de áudio no canto superior direito para controlar o som.');
});
