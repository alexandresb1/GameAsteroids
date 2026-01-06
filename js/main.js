$(document).ready(function() {
    // Fix para altura da viewport em mobile (considera barra do navegador)
    // Só aplicar em dispositivos mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
    
    if (isMobile) {
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
    }

    // Inicializa o canvas do jogo
    Game.init('#gameCanvas');

    // Mostrar tela inicial
    StartScreenHUD.show();

    // O áudio será gerenciado pelo AudioManager e AudioUI
    console.log('Jogo inicializado! Use o botão de áudio no canto superior direito para controlar o som.');
});
