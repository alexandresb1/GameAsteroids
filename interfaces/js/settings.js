const SettingsHUD = (function () {
    let isLoaded = false;

    function loadHTML() {
        if (isLoaded) return;

        try {
            const html = `
                <div id="settingsOverlay" class="interface-overlay">
                    <div class="settings-container">
                        <h1 class="settings-title">CONFIGURAÇÕES</h1>
                        
                        <div class="settings-content">
                            <div class="settings-section">
                                <h2>GERENCIAR SAVE</h2>
                                <p class="settings-description">
                                    Exporte seu progresso para um arquivo JSON ou importe um save anterior.
                                </p>
                                <div class="save-buttons">
                                    <button id="exportSaveBtn" class="settings-button export-button">
                                        💾 EXPORTAR SAVE
                                    </button>
                                    <button id="importSaveBtn" class="settings-button import-button">
                                        📂 IMPORTAR SAVE
                                    </button>
                                </div>
                                <input type="file" id="importFileInput" accept=".json" style="display: none;">
                            </div>

                            <div class="settings-section">
                                <h2>ÁUDIO</h2>
                                <p class="settings-description">
                                    Ative ou desative a música de fundo do jogo.
                                </p>
                                <div class="mobile-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="audioToggle">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span id="audioStatus" class="toggle-label">DESATIVADO</span>
                                </div>
                            </div>

                            <div class="settings-section">
                                <h2>MODO MOBILE</h2>
                                <p class="settings-description">
                                    Ative para usar controles touch (joystick virtual e tiro automático). Ideal para celulares e tablets.
                                </p>
                                <div class="mobile-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="mobileToggle">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span id="mobileStatus" class="toggle-label">DESATIVADO</span>
                                </div>
                            </div>

                            <div class="settings-section">
                                <h2>DADOS DO JOGO</h2>
                                <p class="settings-description">
                                    Cuidado! Esta ação apagará todo o seu progresso, incluindo recordes e naves desbloqueadas.
                                </p>
                                <button id="resetProgressBtn" class="settings-button danger-button">
                                    RESETAR PROGRESSO
                                </button>
                            </div>
                        </div>

                        <div class="settings-footer">
                            <button id="backFromSettingsBtn" class="settings-button back-button">
                                VOLTAR
                            </button>
                        </div>
                    </div>

                    <!-- Modal de Confirmação -->
                    <div id="confirmModal" class="modal-overlay">
                        <div class="modal-container">
                            <h2 class="modal-title">TEM CERTEZA?</h2>
                            <p class="modal-text">
                                Isso apagará PERMANENTEMENTE todo o seu progresso.<br>
                                Esta ação não pode ser desfeita.
                            </p>
                            <div class="modal-buttons">
                                <button id="cancelResetBtn" class="modal-button cancel-button">
                                    CANCELAR
                                </button>
                                <button id="confirmResetBtn" class="modal-button confirm-button">
                                    SIM, APAGAR TUDO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;

            $('body').append(html);

            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/settings.css'
            }).appendTo('head');

            // Eventos
            
            // Toggle Áudio
            const $audioToggle = $('#audioToggle');
            const $audioStatus = $('#audioStatus');
            
            // Carregar estado atual do áudio
            if (typeof AudioManager !== 'undefined') {
                const isMuted = AudioManager.getMutedState();
                $audioToggle.prop('checked', !isMuted); // Invertido: checked = ativado
                $audioStatus.text(isMuted ? 'DESATIVADO' : 'ATIVADO');
            }
            
            $audioToggle.on('change', function () {
                const enabled = $(this).is(':checked');
                if (typeof AudioManager !== 'undefined') {
                    const currentlyMuted = AudioManager.getMutedState();
                    
                    // Se o estado desejado é diferente do atual, fazer toggle
                    if ((enabled && currentlyMuted) || (!enabled && !currentlyMuted)) {
                        AudioManager.toggleMute();
                    }
                    
                    $audioStatus.text(enabled ? 'ATIVADO' : 'DESATIVADO');
                }
            });
            
            // Toggle Modo Mobile
            const $mobileToggle = $('#mobileToggle');
            const $mobileStatus = $('#mobileStatus');
            
            // Carregar estado atual
            if (typeof ProgressionSystem !== 'undefined') {
                const isMobile = ProgressionSystem.isMobileMode();
                $mobileToggle.prop('checked', isMobile);
                $mobileStatus.text(isMobile ? 'ATIVADO' : 'DESATIVADO');
            }
            
            $mobileToggle.on('change', function () {
                const enabled = $(this).is(':checked');
                if (typeof ProgressionSystem !== 'undefined') {
                    ProgressionSystem.setMobileMode(enabled);
                    $mobileStatus.text(enabled ? 'ATIVADO' : 'DESATIVADO');
                }
            });
            
            $('#resetProgressBtn').on('click', function () {
                $('#confirmModal').css('display', 'flex').hide().fadeIn(200);
            });

            $('#cancelResetBtn').on('click', function () {
                $('#confirmModal').fadeOut(200);
            });

            $('#confirmResetBtn').on('click', function () {
                if (typeof ProgressionSystem !== 'undefined') {
                    console.log('=== INICIANDO RESET COMPLETO ===');
                    ProgressionSystem.resetProgress();
                    
                    // Mostrar mensagem de sucesso
                    showMessage('Progresso resetado com sucesso! Recarregando...', 'success');
                    
                    // Fechar modal
                    $('#confirmModal').fadeOut(200);
                    
                    // Recarregar página após 1.5 segundos para aplicar mudanças
                    setTimeout(() => {
                        console.log('=== RECARREGANDO PÁGINA ===');
                        window.location.reload();
                    }, 1500);
                }
            });

            $('#backFromSettingsBtn').on('click', function () {
                hide();
                if (typeof StartScreenHUD !== 'undefined') {
                    StartScreenHUD.show();
                }
            });

            // Export Save
            $('#exportSaveBtn').on('click', function () {
                if (typeof ProgressionSystem !== 'undefined') {
                    const jsonData = ProgressionSystem.exportData();
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'asteroids_save.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    showMessage('✅ Save exportado com sucesso! (Criptografado)', 'success');
                }
            });

            // Import Save
            $('#importSaveBtn').on('click', function () {
                $('#importFileInput').click();
            });

            $('#importFileInput').on('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const jsonString = event.target.result;
                        if (typeof ProgressionSystem !== 'undefined') {
                            const result = ProgressionSystem.importData(jsonString);
                            if (result.success) {
                                showMessage(result.message, 'success');
                            } else {
                                showMessage(result.message, 'error');
                            }
                        }
                    };
                    reader.readAsText(file);
                }
                // Reset input para permitir importar o mesmo arquivo novamente
                $(this).val('');
            });

            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    function showMessage(message, type = 'success') {
        const colors = {
            success: { bg: 'rgba(0, 255, 0, 0.9)', text: 'black' },
            error: { bg: 'rgba(255, 0, 0, 0.9)', text: 'white' }
        };
        const color = colors[type] || colors.success;

        const $msg = $('<div>', {
            text: message,
            css: {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: color.bg,
                color: color.text,
                padding: '15px 30px',
                borderRadius: '5px',
                zIndex: 3000,
                fontWeight: 'bold',
                boxShadow: `0 0 20px ${color.bg}`
            }
        }).appendTo('body');

        setTimeout(() => {
            $msg.fadeOut(500, function () { $(this).remove(); });
        }, 2000);
    }

    function show() {
        loadHTML();
        const $overlay = $('#settingsOverlay');
        $overlay.css({ display: 'flex', opacity: 0 });

        setTimeout(() => {
            $overlay.css({ transition: 'opacity 0.3s', opacity: 1 });
        }, 10);
    }

    function hide() {
        const $overlay = $('#settingsOverlay');
        if ($overlay.length) {
            $overlay.css({ transition: 'opacity 0.3s', opacity: 0 });
            setTimeout(() => {
                $overlay.css('display', 'none');
            }, 300);
        }
    }

    return {
        show,
        hide
    };
})();
