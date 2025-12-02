const CustomizeHUD = (function() {
    let isLoaded = false;
    
    // Configuração das naves com atributos e descrições
    const ships = {
        1: { 
            name: 'PIONEER-X1', 
            unlockScore: 0,
            description: 'Nave de reconhecimento padrão da frota. Equilibrada e confiável, ideal para missões de exploração inicial e treinamento de pilotos novatos.',
            attributes: {
                maneuverability: 3,
                resistance: 2,
                fireRate: 3
            }
        },
        2: { 
            name: 'VIPER-DELTA', 
            unlockScore: 200,
            description: 'Interceptador de alta velocidade com motores turbo modificados. Especializada em manobras evasivas e ataques rápidos contra alvos móveis.',
            attributes: {
                maneuverability: 5,
                resistance: 1,
                fireRate: 4
            }
        },
        3: { 
            name: 'TITAN-FORGE', 
            unlockScore: 400,
            description: 'Cruzador pesado com blindagem reforçada e sistemas de resistência avançados. Construída para enfrentar campos de asteroides densos.',
            attributes: {
                maneuverability: 2,
                resistance: 3,
                fireRate: 2
            }
        },
        4: { 
            name: 'GREEN-REAPER', 
            unlockScore: 800,
            description: 'Caça furtivo experimental com tecnologia alien recuperada. Combina stealth, velocidade e firepower para missões de elite.',
            attributes: {
                maneuverability: 4,
                resistance: 2,
                fireRate: 5
            }
        }
    };
    
    function loadHTML() {
        if (isLoaded) return;
        
        try {
            // HTML embutido diretamente no JavaScript para evitar problemas de CORS
            const html = `
<div id="customizeOverlay" class="interface-overlay">
    <div class="customize-container">
        <h1 class="customize-title">PERSONALIZAÇÃO</h1>
        
        <!-- Seção de Naves -->
        <div class="ships-section">
            <h2 class="section-title">NAVES</h2>
            
            <div class="ships-grid">
                <!-- Nave 1 - Sempre desbloqueada -->
                <div class="ship-card" data-ship="1" data-unlock-score="0">
                    <div class="ship-preview">
                        <img src="assets/sprites/Ship-1.png" alt="PIONEER-X1" class="ship-image">
                    </div>
                    <div class="ship-name">PIONEER-X1</div>
                    <div class="ship-status unlocked">DESBLOQUEADA</div>
                </div>

                <!-- Nave 2 -->
                <div class="ship-card" data-ship="2" data-unlock-score="200">
                    <div class="ship-preview">
                        <img src="assets/sprites/Ship-2.png" alt="VIPER-DELTA" class="ship-image">
                    </div>
                    <div class="ship-name">VIPER-DELTA</div>
                    <div class="ship-status locked">Score: 200</div>
                </div>

                <!-- Nave 3 -->
                <div class="ship-card" data-ship="3" data-unlock-score="400">
                    <div class="ship-preview">
                        <img src="assets/sprites/Ship-3.png" alt="TITAN-FORGE" class="ship-image">
                    </div>
                    <div class="ship-name">TITAN-FORGE</div>
                    <div class="ship-status locked">Score: 400</div>
                </div>

                <!-- Nave 4 -->
                <div class="ship-card" data-ship="4" data-unlock-score="800">
                    <div class="ship-preview">
                        <img src="assets/sprites/Ship-4.png" alt="GREEN-REAPER" class="ship-image">
                    </div>
                    <div class="ship-name">GREEN-REAPER</div>
                    <div class="ship-status locked">Score: 800</div>
                </div>
            </div>
        </div>

        <!-- Informações do Jogador -->
        <div class="player-info">
            <div class="current-score">
                <span class="label">Melhor Score:</span>
                <span id="bestScore" class="value">0</span>
            </div>
            <div class="selected-ship">
                <span class="label">Nave Selecionada:</span>
                <span id="selectedShipName" class="value">PIONEER-X1</span>
            </div>
        </div>

        <!-- Tooltip para informações das naves -->
        <div id="shipTooltip" class="ship-tooltip">
            <div class="tooltip-content">Passe o mouse sobre uma nave para ver detalhes</div>
        </div>

        <!-- Botões -->
        <div class="customize-buttons">
            <button id="backToMenuBtn" class="customize-button back-button">
                ← Voltar ao Menu
            </button>
        </div>
    </div>
</div>`;
            
            // Adicionar HTML ao body usando jQuery
            $('body').append(html);
            
            // Carregar CSS usando jQuery
            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/customize.css'
            }).appendTo('head');
            
            // Configurar eventos
            setupEvents();
            
            isLoaded = true;
        } catch (error) {
            console.error('Erro ao carregar tela de personalização:', error);
        }
    }
    
    function setupEvents() {
        // Usar delegação de eventos para garantir que funcionem
        $(document).off('click', '#backToMenuBtn').on('click', '#backToMenuBtn', function() {
            hide();
            if (typeof StartScreenHUD !== 'undefined') {
                StartScreenHUD.show();
            }
        });
        
        // Eventos dos cards das naves usando delegação
        $(document).off('click', '.ship-card').on('click', '.ship-card', function() {
            const shipId = $(this).data('ship');
            const unlockScore = $(this).data('unlock-score');
            const bestScore = ProgressionSystem.getBestScore();
            
            // Verificar se a nave está desbloqueada
            if (bestScore >= unlockScore) {
                selectShip(shipId);
            } else {
                showUnlockMessage(shipId, unlockScore);
            }
        });
        
        // Tooltip hover usando delegação - agora sempre visível
        $(document).off('mouseenter', '.ship-card').on('mouseenter', '.ship-card', function() {
            const shipId = $(this).data('ship');
            const unlockScore = $(this).data('unlock-score');
            const bestScore = ProgressionSystem.getBestScore();
            const ship = ships[shipId];
            
            // Função para criar barras de atributos
            function createAttributeBar(value, maxValue = 5) {
                const filled = '★'.repeat(value);
                const empty = '☆'.repeat(maxValue - value);
                return filled + empty;
            }

            let tooltipContent = '';
            if (bestScore >= unlockScore) {
                tooltipContent = `<div class="tooltip-ship-name">${ship.name}</div>
                                <div class="tooltip-description">${ship.description}</div>
                                <div class="tooltip-attributes">
                                    <div>🚀 Manobrabilidade: ${createAttributeBar(ship.attributes.maneuverability)}</div>
                                    <div>🛡️ Resistência: ${createAttributeBar(ship.attributes.resistance, 3)} (${ship.attributes.resistance} hits)</div>
                                    <div>🔥 Cadência: ${createAttributeBar(ship.attributes.fireRate)}</div>
                                </div>
                                <div class="tooltip-status available">✓ Disponível - Clique para selecionar</div>`;
            } else {
                tooltipContent = `<div class="tooltip-ship-name">${ship.name}</div>
                                <div class="tooltip-description">${ship.description}</div>
                                <div class="tooltip-attributes">
                                    <div>🚀 Manobrabilidade: ${createAttributeBar(ship.attributes.maneuverability)}</div>
                                    <div>🛡️ Resistência: ${createAttributeBar(ship.attributes.resistance, 3)} (${ship.attributes.resistance} hits)</div>
                                    <div>🔥 Cadência: ${createAttributeBar(ship.attributes.fireRate)}</div>
                                </div>
                                <div class="tooltip-status locked">🔒 Requer ${unlockScore} pontos (Seu melhor: ${bestScore})</div>`;
            }
            
            updateTooltip(tooltipContent);
        });
        
        $(document).off('mouseleave', '.ships-grid').on('mouseleave', '.ships-grid', function() {
            resetTooltip();
        });
    }
    
    function selectShip(shipId) {
        // Remover seleção anterior
        $('.ship-card').removeClass('selected');
        
        // Adicionar seleção atual
        $(`.ship-card[data-ship="${shipId}"]`).addClass('selected');
        
        // Salvar seleção
        ProgressionSystem.setSelectedShip(shipId);
        
        // Atualizar UI
        updateSelectedShipDisplay();
        
        // Feedback visual
        showNotification(`${ships[shipId].name} selecionada!`);
    }
    
    function showUnlockMessage(shipId, requiredScore) {
        const currentScore = ProgressionSystem.getBestScore();
        const remaining = requiredScore - currentScore;
        showNotification(`Você precisa de mais ${remaining} pontos para desbloquear ${ships[shipId].name}!`);
    }
    
    function updateTooltip(htmlContent) {
        const $tooltip = $('#shipTooltip');
        $tooltip.find('.tooltip-content').html(htmlContent);
        // Tooltip sempre visível, apenas muda o conteúdo
    }
    
    function resetTooltip() {
        const $tooltip = $('#shipTooltip');
        $tooltip.find('.tooltip-content').html(`
            <div class="tooltip-default">
                <div class="tooltip-ship-name">Selecione uma Nave</div>
                <div class="tooltip-description">Passe o mouse sobre uma nave para ver suas características e requisitos de desbloqueio.</div>
            </div>
        `);
    }

    function initializeTooltip() {
        const $tooltip = $('#shipTooltip');
        // Garantir que o tooltip esteja sempre visível
        $tooltip.css({
            display: 'block',
            opacity: 1
        });
        // Definir conteúdo inicial
        resetTooltip();
    }
    
    function showNotification(message) {
        // Criar notificação temporária
        const $notification = $('<div>', {
            text: message,
            css: {
                position: 'fixed',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 255, 255, 0.9)',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '5px',
                fontFamily: 'Courier New, monospace',
                fontSize: '14px',
                zIndex: 1002,
                opacity: 0,
                transition: 'opacity 0.3s ease'
            }
        });
        
        $('body').append($notification);
        
        // Animação de entrada
        setTimeout(() => {
            $notification.css('opacity', '1');
        }, 10);
        
        // Remover após 2 segundos
        setTimeout(() => {
            $notification.css('opacity', '0');
            setTimeout(() => {
                $notification.remove();
            }, 300);
        }, 2000);
    }
    
    function updateUI() {
        const bestScore = ProgressionSystem.getBestScore();
        const selectedShip = ProgressionSystem.getSelectedShip();
        
        // Atualizar melhor score
        $('#bestScore').text(bestScore);
        
        // Atualizar status das naves
        $('.ship-card').each(function() {
            const $card = $(this);
            const shipId = $card.data('ship');
            const unlockScore = $card.data('unlock-score');
            const $status = $card.find('.ship-status');
            
            if (bestScore >= unlockScore) {
                $card.removeClass('locked').addClass('unlocked');
                $status.removeClass('locked').addClass('unlocked').text('DESBLOQUEADA');
            } else {
                $card.removeClass('unlocked').addClass('locked');
                $status.removeClass('unlocked').addClass('locked').text(`Score: ${unlockScore}`);
            }
            
            // Marcar nave selecionada
            if (shipId == selectedShip) {
                $card.addClass('selected');
            } else {
                $card.removeClass('selected');
            }
        });
        
        // Atualizar nome da nave selecionada
        updateSelectedShipDisplay();
    }
    
    function updateSelectedShipDisplay() {
        const selectedShip = ProgressionSystem.getSelectedShip();
        $('#selectedShipName').text(ships[selectedShip].name);
    }
    
    function show() {
        loadHTML();
        
        // Atualizar UI com dados atuais
        updateUI();
        
        // Inicializar tooltip
        initializeTooltip();
        
        const $overlay = $('#customizeOverlay');
        if ($overlay.length) {
            $overlay.css({
                display: 'flex',
                opacity: 0
            });
            
            // Animação de entrada usando jQuery
            setTimeout(() => {
                $overlay.css({
                    transition: 'opacity 0.3s ease',
                    opacity: 1
                });
            }, 10);
        }
    }
    
    function hide() {
        const $overlay = $('#customizeOverlay');
        if ($overlay.length) {
            $overlay.css({
                transition: 'opacity 0.2s ease',
                opacity: 0
            });
            
            setTimeout(() => {
                $overlay.css('display', 'none');
            }, 200);
        }
    }
    
    return {
        show,
        hide,
        updateUI
    };
})();
