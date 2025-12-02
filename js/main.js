$(document).ready(function() {
    // Inicializa o canvas do jogo
    Game.init('#gameCanvas');

    // Mostrar tela inicial
    StartScreenHUD.show();

    // O áudio será gerenciado pelo AudioManager e AudioUI
    console.log('Jogo inicializado! Use o botão de áudio no canto superior direito para controlar o som.');
});
