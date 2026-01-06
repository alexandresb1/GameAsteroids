const CustomizeHUD = (function () {
    let isLoaded = false;

    function loadHTML() {
        if (isLoaded) return;

        try {
            // HTML estrutural - cards serão gerados dinamicamente
            const html = `
<div id="customizeOverlay" class="interface-overlay">
    <div class="customize-container">
        <h1 class="customize-title">PERSONALIZAÇÃO</h1>
        
        <!-- Tab Navigation -->
        <div class="tab-navigation">
            <button class="tab-button active" data-tab="naves">NAVES</button>
            <button class="tab-button" data-tab="especiais">ESPECIAIS</button>
        </div>

        <!-- Tab Content Container -->
        <div class="tab-content-container">
            <!-- Tab: Naves -->
            <div class="tab-content active" id="tab-naves">
                <div class="ships-section">
                    <h2 class="section-title">NAVES</h2>
                    <div class="ships-grid" id="shipsGrid">
                        <!-- Cards gerados dinamicamente -->
                    </div>
                </div>
            </div>

            <!-- Tab: Especiais -->
            <div class="tab-content" id="tab-especiais">
                <div class="specials-section">
                    <h2 class="section-title">ESPECIAIS</h2>
                    <div class="specials-grid" id="specialsGrid">
                        <!-- Cards gerados dinamicamente -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Informações do Jogador -->
        <div class="player-info">
            <div class="current-score">
                <span class="label">Melhor Score:</span>
                <span id="bestScore" class="value">0</span>
            </div>
            <div class="total-score">
                <span class="label">Score Total:</span>
                <span id="totalScore" class="value">0</span>
            </div>
            <div class="selected-ship">
                <span class="label">Nave:</span>
                <span id="selectedShipName" class="value">PIONEER-X1</span>
            </div>
            <div class="selected-special">
                <span class="label">Especial:</span>
                <span id="selectedSpecialName" class="value">Shockwave</span>
            </div>
        </div>

        <!-- Tooltip para informações das naves e especiais -->
        <div id="shipTooltip" class="ship-tooltip">
            <div class="tooltip-content">Passe o mouse sobre um item para ver detalhes</div>
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

            isLoaded = true;

            // Gerar cards das naves e especiais dinamicamente ANTES de configurar eventos
            generateShipCards();
            generateSpecialCards();
            
            // Configurar eventos DEPOIS de gerar os cards
            setupEvents();
        } catch (error) {
            console.error('Erro ao carregar tela de personalização:', error);
        }
    }

    function generateSpecialCards() {
        const $grid = $('#specialsGrid');
        
        if ($grid.length === 0) {
            console.error('Grid de especiais não encontrado!');
            return;
        }
        
        $grid.empty();

        // Adicionar card "Nenhum" (especial padrão)
        const $noneCard = $(`
            <div class="special-card unlocked" data-special="0">
                <div class="special-preview">
                    <div class="special-icon">🌀</div>
                </div>
                <div class="special-name">SHOCKWAVE</div>
                <div class="special-status unlocked">PADRÃO</div>
            </div>
        `);
        $grid.append($noneCard);

        // Adicionar especiais desbloqueáveis
        const allSpecials = GameData.getAllSpecials();
        
        allSpecials.forEach(special => {
            const isUnlocked = ProgressionSystem.isSpecialUnlocked(special.id);
            const statusClass = isUnlocked ? 'unlocked' : 'locked';
            const statusText = isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO';
            
            const $card = $(`
                <div class="special-card ${statusClass}" data-special="${special.id}">
                    <div class="special-preview">
                        <div class="special-icon">${special.icon}</div>
                    </div>
                    <div class="special-name">${special.name}</div>
                    <div class="special-status ${statusClass}">${statusText}</div>
                </div>
            `);
            
            $grid.append($card);
        });
    }

    function generateShipCards() {
        const $grid = $('#shipsGrid');
        
        if ($grid.length === 0) {
            console.error('Grid de naves não encontrado!');
            return;
        }
        
        $grid.empty();

        const allShips = GameData.getAllShips();
        
        allShips.forEach(ship => {
            const isUnlocked = ProgressionSystem.isShipUnlocked(ship.id);
            const statusClass = isUnlocked ? 'unlocked' : 'locked';
            const statusText = isUnlocked ? 'DESBLOQUEADA' : 'BLOQUEADO';
            
            const $card = $(`
                <div class="ship-card ${statusClass}" data-ship="${ship.id}">
                    <div class="ship-preview">
                        <img src="${ship.sprite}" alt="${ship.name}" class="ship-image">
                    </div>
                    <div class="ship-name">${ship.name}</div>
                    <div class="ship-status ${statusClass}">${statusText}</div>
                </div>
            `);
            
            $grid.append($card);
        });
    }

    function setupEvents() {
        // Usar delegação de eventos no documento para garantir que funcionem
        $(document).off('click', '#backToMenuBtn').on('click', '#backToMenuBtn', function () {
            hide();
            if (typeof StartScreenHUD !== 'undefined') {
                StartScreenHUD.show();
            }
        });

        // Eventos dos cards das naves usando delegação no documento
        $(document).off('click', '.ship-card').on('click', '.ship-card', function (e) {
            // Não fazer nada se clicou no botão de seleção
            if ($(e.target).hasClass('select-ship-btn')) {
                return;
            }
            
            const shipId = $(this).data('ship');
            
            // Remover classe 'viewing' de todos os cards
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            
            // Adicionar classe 'viewing' ao card clicado
            $(this).addClass('viewing');
            
            showShipTooltip(shipId);
        });

        // Eventos dos cards de especiais usando delegação no documento
        $(document).off('click', '.special-card').on('click', '.special-card', function (e) {
            // Não fazer nada se clicou no botão de seleção
            if ($(e.target).hasClass('select-special-btn')) {
                return;
            }
            
            const specialId = $(this).data('special');
            
            // Remover classe 'viewing' de todos os cards
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            
            // Adicionar classe 'viewing' ao card clicado
            $(this).addClass('viewing');
            
            showSpecialTooltip(specialId);
        });

        // Tooltip hover usando delegação no documento
        $(document).off('mouseenter mouseleave', '.ship-card, .special-card');
        
        $(document).on('mouseenter', '.ship-card', function () {
            const shipId = $(this).data('ship');
            showShipTooltip(shipId);
        });

        $(document).on('mouseenter', '.special-card', function () {
            const specialId = $(this).data('special');
            showSpecialTooltip(specialId);
        });

        $(document).on('mouseleave', '.ship-card, .special-card', function () {
            // Não fazer nada - manter o estado visual
        });

        // Tab switching
        $(document).off('click', '.tab-button').on('click', '.tab-button', function () {
            const tabName = $(this).data('tab');
            switchTab(tabName);
        });

        // Evento do botão SELECIONAR usando delegação
        $(document).off('click', '.select-ship-btn').on('click', '.select-ship-btn', function (e) {
            e.stopPropagation();
            e.preventDefault();
            const selectedShipId = parseInt($(this).data('ship-id'));
            selectShip(selectedShipId);
        });

        // Evento do botão SELECIONAR especial usando delegação
        $(document).off('click', '.select-special-btn').on('click', '.select-special-btn', function (e) {
            e.stopPropagation();
            e.preventDefault();
            const selectedSpecialId = parseInt($(this).data('special-id'));
            selectSpecial(selectedSpecialId);
        });
    }

    function switchTab(tabName) {
        // Update tab buttons
        $('.tab-button').removeClass('active');
        $(`.tab-button[data-tab="${tabName}"]`).addClass('active');

        // Update tab content
        $('.tab-content').removeClass('active');
        $(`#tab-${tabName}`).addClass('active');

        // Atualizar tooltip baseado na aba ativa
        if (tabName === 'especiais') {
            const selectedSpecial = ProgressionSystem.getSelectedSpecial();
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            $(`.special-card[data-special="${selectedSpecial}"]`).addClass('viewing');
            showSpecialTooltip(selectedSpecial);
        } else {
            const selectedShip = ProgressionSystem.getSelectedShip();
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            $(`.ship-card[data-ship="${selectedShip}"]`).addClass('viewing');
            showSelectedShipTooltip();
        }
    }

    function showSpecialTooltip(specialId) {
        let special, isUnlocked, tooltipContent;

        if (specialId === 0) {
            // Especial padrão (Shockwave)
            special = {
                name: 'SHOCKWAVE',
                description: 'Dispara uma onda de tiros em todas as direções ao redor da nave. Especial padrão sempre disponível.',
                cooldown: 5.0
            };
            isUnlocked = true;
        } else {
            special = GameData.getSpecialById(specialId);
            if (!special) {
                console.error('Especial não encontrado:', specialId);
                return;
            }
            isUnlocked = ProgressionSystem.isSpecialUnlocked(specialId);
        }

        // Obter informações de desbloqueio
        let unlockInfo = '';
        if (!isUnlocked && specialId !== 0) {
            const unlockLabel = GameData.UNLOCK_TYPE_LABELS[special.unlockType];
            const requirement = GameData.formatUnlockRequirement(special.unlockType, special.unlockRequirement);

            // Mostrar progresso atual
            let currentProgress = '';
            switch (special.unlockType) {
                case 'highScore':
                    currentProgress = `Seu melhor: ${ProgressionSystem.getBestScore()}`;
                    break;
                case 'totalScore':
                    currentProgress = `Seu total: ${ProgressionSystem.getTotalScore()}`;
                    break;
                case 'playTime':
                    const playTime = ProgressionSystem.getPlayTime();
                    const mins = Math.floor(playTime / 60);
                    const secs = playTime % 60;
                    currentProgress = `Seu tempo: ${mins}m ${secs}s`;
                    break;
            }

            unlockInfo = `<div class="tooltip-unlock-info" style="margin-top: 10px;">
                <div style="color: #ff6666; margin-bottom: 5px;">🔒 ${unlockLabel}: ${requirement}</div>
                <div style="color: #aaa; font-size: 0.85em;">${currentProgress}</div>
            </div>`;
        }

        tooltipContent = `<div class="tooltip-special-name">${special.name}</div>
                        <div class="tooltip-description">${special.description}</div>
                        <div class="tooltip-cooldown">
                            ⏱️ Cooldown: ${special.cooldown}s
                        </div>
                        ${unlockInfo}
                        <div class="tooltip-status ${isUnlocked ? 'available' : 'locked'}">
                            ${isUnlocked ? `<button class="select-special-btn" data-special-id="${specialId}">SELECIONAR</button>` : 'BLOQUEADO'}
                        </div>`;

        updateTooltip(tooltipContent);
    }

    function selectSpecial(specialId) {
        // Verificar se o especial está desbloqueado (0 sempre permitido)
        if (specialId !== 0 && !ProgressionSystem.isSpecialUnlocked(specialId)) {
            showNotification('Este especial ainda está bloqueado!');
            return;
        }
        
        // Remover classe 'selected' de todos os cards de especiais
        $('.special-card').removeClass('selected');

        // Adicionar classe 'selected' ao card escolhido
        $(`.special-card[data-special="${specialId}"]`).addClass('selected');

        // Salvar seleção
        ProgressionSystem.setSelectedSpecial(specialId);

        // Atualizar UI
        updateSelectedSpecialDisplay();

        // Feedback visual
        let specialName;
        if (specialId === 0) {
            specialName = 'Shockwave';
        } else {
            const special = GameData.getSpecialById(specialId);
            specialName = special ? special.name : 'Especial';
        }
        
        showNotification(`${specialName} selecionado!`);
        
        // Atualizar tooltip para mostrar o especial selecionado
        showSpecialTooltip(specialId);
    }

    function showShipTooltip(shipId) {
        const ship = GameData.getShipById(shipId);
        if (!ship) {
            console.error('Nave não encontrada:', shipId);
            return;
        }

        const isUnlocked = ProgressionSystem.isShipUnlocked(shipId);

        // Função para criar barras de atributos
        function createAttributeBar(value, maxValue = 5) {
            // Garantir que value não ultrapasse maxValue
            const clampedValue = Math.min(value, maxValue);
            const filled = '★'.repeat(clampedValue);
            const empty = '☆'.repeat(Math.max(0, maxValue - clampedValue));
            return filled + empty;
        }

        // Obter informações de desbloqueio
        let unlockInfo = '';
        if (!isUnlocked) {
            const unlockLabel = GameData.UNLOCK_TYPE_LABELS[ship.unlockType];
            const requirement = GameData.formatUnlockRequirement(ship.unlockType, ship.unlockRequirement);

            // Mostrar progresso atual
            let currentProgress = '';
            switch (ship.unlockType) {
                case 'highScore':
                    currentProgress = `Seu melhor: ${ProgressionSystem.getBestScore()}`;
                    break;
                case 'totalScore':
                    currentProgress = `Seu total: ${ProgressionSystem.getTotalScore()}`;
                    break;
                case 'playTime':
                    const playTime = ProgressionSystem.getPlayTime();
                    const mins = Math.floor(playTime / 60);
                    const secs = playTime % 60;
                    currentProgress = `Seu tempo: ${mins}m ${secs}s`;
                    break;
            }

            unlockInfo = `<div class="tooltip-unlock-info" style="margin-top: 10px;">
                <div style="color: #ff6666; margin-bottom: 5px;">🔒 ${unlockLabel}: ${requirement}</div>
                <div style="color: #aaa; font-size: 0.85em;">${currentProgress}</div>
            </div>`;
        }

        let tooltipContent = `<div class="tooltip-ship-name">${ship.name}</div>
                            <div class="tooltip-description">${ship.description}</div>
                            <div class="tooltip-attributes">
                                <div>🚀 Manobrabilidade: ${createAttributeBar(ship.attributes.maneuverability, 6)}</div>
                                <div>🛡️ Resistência: ${createAttributeBar(ship.attributes.resistance, 4)} (${ship.attributes.resistance} hits)</div>
                                <div>🔥 Cadência: ${createAttributeBar(ship.attributes.fireRate, 6)}</div>
                            </div>
                            ${unlockInfo}
                            <div class="tooltip-status ${isUnlocked ? 'available' : 'locked'}">
                                ${isUnlocked ? `<button class="select-ship-btn" data-ship-id="${shipId}">SELECIONAR</button>` : 'BLOQUEADO'}
                            </div>`;

        updateTooltip(tooltipContent);
    }

    function showSelectedShipTooltip() {
        const selectedShip = ProgressionSystem.getSelectedShip();
        showShipTooltip(selectedShip);
    }

    function selectShip(shipId) {
        // Verificar se a nave está desbloqueada
        if (!ProgressionSystem.isShipUnlocked(shipId)) {
            showNotification('Esta nave ainda está bloqueada!');
            return;
        }
        
        // Remover classe 'selected' de todos os cards
        $('.ship-card').removeClass('selected');

        // Adicionar classe 'selected' ao card escolhido (glow verde)
        $(`.ship-card[data-ship="${shipId}"]`).addClass('selected');

        // Salvar seleção
        ProgressionSystem.setSelectedShip(shipId);

        // Atualizar UI
        updateSelectedShipDisplay();

        // Feedback visual
        const ship = GameData.getShipById(shipId);
        showNotification(`${ship ? ship.name : 'Nave'} selecionada!`);
        
        // Atualizar tooltip para mostrar a nave selecionada
        showShipTooltip(shipId);
    }

    function updateSelectedSpecialDisplay() {
        const selectedSpecialId = ProgressionSystem.getSelectedSpecial();
        let specialName;
        
        if (selectedSpecialId === 0) {
            specialName = 'Shockwave';
        } else {
            const special = GameData.getSpecialById(selectedSpecialId);
            specialName = special ? special.name : 'Shockwave';
        }
        
        $('#selectedSpecialName').text(specialName);
    }

    function updateSelectedShipDisplay() {
        const selectedShip = ProgressionSystem.getSelectedShip();
        const ship = GameData.getShipById(selectedShip);
        $('#selectedShipName').text(ship ? ship.name : 'PIONEER-X1');
    }

    function updateTooltip(htmlContent) {
        const $tooltip = $('#shipTooltip');
        if ($tooltip.length === 0) {
            console.error('Tooltip não encontrado no DOM!');
            return;
        }
        
        const $content = $tooltip.find('.tooltip-content');
        if ($content.length === 0) {
            console.error('tooltip-content não encontrado!');
            return;
        }
        
        $content.html(htmlContent);
    }

    function resetTooltip() {
        // Ao invés de mostrar mensagem genérica, mostra a nave selecionada
        showSelectedShipTooltip();
    }

    function initializeTooltip() {
        const $tooltip = $('#shipTooltip');
        // Garantir que o tooltip esteja sempre visível
        $tooltip.css({
            display: 'block',
            opacity: 1
        });
        
        // Verificar qual aba está ativa
        const activeTab = $('.tab-button.active').data('tab');
        
        if (activeTab === 'especiais') {
            // Marcar o especial selecionado como 'viewing' ao abrir
            const selectedSpecial = ProgressionSystem.getSelectedSpecial();
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            $(`.special-card[data-special="${selectedSpecial}"]`).addClass('viewing');
            
            // Mostrar especial selecionado por padrão
            showSpecialTooltip(selectedSpecial);
        } else {
            // Marcar a nave selecionada como 'viewing' ao abrir
            const selectedShip = ProgressionSystem.getSelectedShip();
            $('.ship-card').removeClass('viewing');
            $('.special-card').removeClass('viewing');
            $(`.ship-card[data-ship="${selectedShip}"]`).addClass('viewing');
            
            // Mostrar nave selecionada por padrão
            showSelectedShipTooltip();
        }
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
        const selectedShip = ProgressionSystem.getSelectedShip();
        const selectedSpecial = ProgressionSystem.getSelectedSpecial();

        // Atualizar melhor score e score total
        $('#bestScore').text(ProgressionSystem.getBestScore());
        $('#totalScore').text(ProgressionSystem.getTotalScore());

        // Atualizar status das naves
        $('.ship-card').each(function () {
            const $card = $(this);
            const shipId = $card.data('ship');
            const $status = $card.find('.ship-status');

            const isUnlocked = ProgressionSystem.isShipUnlocked(shipId);

            if (isUnlocked) {
                $card.removeClass('locked').addClass('unlocked');
                $status.removeClass('locked').addClass('unlocked').text('DESBLOQUEADA');
            } else {
                $card.removeClass('unlocked').addClass('locked');
                $status.removeClass('unlocked').addClass('locked').text('BLOQUEADO');
            }

            // Marcar nave selecionada
            if (shipId == selectedShip) {
                $card.addClass('selected');
            } else {
                $card.removeClass('selected');
            }
        });

        // Atualizar status dos especiais
        $('.special-card').each(function () {
            const $card = $(this);
            const specialId = $card.data('special');
            const $status = $card.find('.special-status');

            let isUnlocked;
            if (specialId === 0) {
                isUnlocked = true; // Shockwave sempre desbloqueado
            } else {
                isUnlocked = ProgressionSystem.isSpecialUnlocked(specialId);
            }

            if (isUnlocked) {
                $card.removeClass('locked').addClass('unlocked');
                $status.removeClass('locked').addClass('unlocked');
                if (specialId === 0) {
                    $status.text('PADRÃO');
                } else {
                    $status.text('DESBLOQUEADO');
                }
            } else {
                $card.removeClass('unlocked').addClass('locked');
                $status.removeClass('unlocked').addClass('locked').text('BLOQUEADO');
            }

            // Marcar especial selecionado
            if (specialId == selectedSpecial) {
                $card.addClass('selected');
            } else {
                $card.removeClass('selected');
            }
        });

        // Atualizar nome da nave e especial selecionados
        updateSelectedShipDisplay();
        updateSelectedSpecialDisplay();
    }

    function show() {
        loadHTML();

        // Aguardar um pouco para garantir que o DOM foi atualizado
        setTimeout(() => {
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
        }, 50);
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