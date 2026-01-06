const CustomizeHUD = (function () {
    let isLoaded = false;

    // ========================================
    // SISTEMA DE COMPONENTES UNIVERSAIS
    // ========================================

    /**
     * Classe base para componentes de cards (naves, especiais, etc.)
     */
    class CardComponent {
        constructor(type, gridSelector, dataAttribute) {
            this.type = type; // 'ship' ou 'special'
            this.gridSelector = gridSelector;
            this.dataAttribute = dataAttribute;
        }

        // Gerar cards baseado nos dados
        generateCards(items, getUnlockedFn, getSelectedFn) {
            const $grid = $(this.gridSelector);
            
            if ($grid.length === 0) {
                console.error(`Grid ${this.gridSelector} não encontrado!`);
                return;
            }
            
            $grid.empty();

            // Adicionar card especial para "nenhum" se for especiais
            if (this.type === 'special') {
                this.addDefaultSpecialCard($grid);
            }

            // Adicionar cards dos itens
            items.forEach(item => {
                const isUnlocked = getUnlockedFn(item.id);
                const $card = this.createCard(item, isUnlocked);
                $grid.append($card);
            });
        }

        // Criar card individual
        createCard(item, isUnlocked) {
            const statusClass = isUnlocked ? 'unlocked' : 'locked';
            const statusText = isUnlocked ? 
                (this.type === 'ship' ? 'DESBLOQUEADA' : 'DESBLOQUEADO') : 
                'BLOQUEADO';

            const previewContent = this.type === 'ship' ? 
                `<img src="${item.sprite}" alt="${item.name}" class="ship-image">` :
                `<div class="special-icon">${item.icon}</div>`;

            return $(`
                <div class="${this.type}-card ${statusClass}" data-${this.dataAttribute}="${item.id}">
                    <div class="${this.type}-preview">
                        ${previewContent}
                    </div>
                    <div class="${this.type}-name">${item.name}</div>
                    <div class="${this.type}-status ${statusClass}">${statusText}</div>
                </div>
            `);
        }

        // Adicionar card padrão para especiais (Shockwave)
        addDefaultSpecialCard($grid) {
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
        }

        // Atualizar estado visual dos cards
        updateCardStates(items, getUnlockedFn, getSelectedFn) {
            const selectedId = getSelectedFn();

            $(`.${this.type}-card`).each(function () {
                const $card = $(this);
                const itemId = $card.data(this.dataAttribute);
                const $status = $card.find(`.${this.type}-status`);

                // Atualizar estado de desbloqueio
                let isUnlocked;
                if (this.type === 'special' && itemId === 0) {
                    isUnlocked = true; // Shockwave sempre desbloqueado
                } else {
                    isUnlocked = getUnlockedFn(itemId);
                }

                if (isUnlocked) {
                    $card.removeClass('locked').addClass('unlocked');
                    $status.removeClass('locked').addClass('unlocked');
                    if (this.type === 'special' && itemId === 0) {
                        $status.text('PADRÃO');
                    } else {
                        $status.text(this.type === 'ship' ? 'DESBLOQUEADA' : 'DESBLOQUEADO');
                    }
                } else {
                    $card.removeClass('unlocked').addClass('locked');
                    $status.removeClass('unlocked').addClass('locked').text('BLOQUEADO');
                }

                // Marcar item selecionado
                if (itemId == selectedId) {
                    $card.addClass('selected');
                } else {
                    $card.removeClass('selected');
                }
            }.bind(this));
        }
    }

    // Instâncias dos componentes
    const shipComponent = new CardComponent('ship', '#shipsGrid', 'ship');
    const specialComponent = new CardComponent('special', '#specialsGrid', 'special');

    // ========================================
    // SISTEMA DE TOOLTIPS UNIVERSAL
    // ========================================

    class TooltipManager {
        static showShipTooltip(shipId) {
            const ship = GameData.getShipById(shipId);
            if (!ship) {
                console.error('Nave não encontrada:', shipId);
                return;
            }

            const isUnlocked = ProgressionSystem.isShipUnlocked(shipId);
            const unlockInfo = this.getUnlockInfo(ship, isUnlocked);

            const tooltipContent = `
                <div class="tooltip-ship-name">${ship.name}</div>
                <div class="tooltip-description">${ship.description}</div>
                <div class="tooltip-attributes">
                    <div>🚀 Manobrabilidade: ${this.createAttributeBar(ship.attributes.maneuverability, 6)}</div>
                    <div>🛡️ Resistência: ${this.createAttributeBar(ship.attributes.resistance, 4)} (${ship.attributes.resistance} hits)</div>
                    <div>🔥 Cadência: ${this.createAttributeBar(ship.attributes.fireRate, 6)}</div>
                </div>
                ${unlockInfo}
                <div class="tooltip-status ${isUnlocked ? 'available' : 'locked'}">
                    ${isUnlocked ? `<button class="select-ship-btn" data-ship-id="${shipId}">SELECIONAR</button>` : 'BLOQUEADO'}
                </div>
            `;

            this.updateTooltip(tooltipContent);
        }

        static showSpecialTooltip(specialId) {
            let special, isUnlocked;

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

            const unlockInfo = specialId === 0 ? '' : this.getUnlockInfo(special, isUnlocked);

            const tooltipContent = `
                <div class="tooltip-special-name">${special.name}</div>
                <div class="tooltip-description">${special.description}</div>
                <div class="tooltip-cooldown">⏱️ Cooldown: ${special.cooldown}s</div>
                ${unlockInfo}
                <div class="tooltip-status ${isUnlocked ? 'available' : 'locked'}">
                    ${isUnlocked ? `<button class="select-special-btn" data-special-id="${specialId}">SELECIONAR</button>` : 'BLOQUEADO'}
                </div>
            `;

            this.updateTooltip(tooltipContent);
        }

        static createAttributeBar(value, maxValue = 5) {
            const clampedValue = Math.min(value, maxValue);
            const filled = '★'.repeat(clampedValue);
            const empty = '☆'.repeat(Math.max(0, maxValue - clampedValue));
            return filled + empty;
        }

        static getUnlockInfo(item, isUnlocked) {
            if (isUnlocked) return '';

            const unlockLabel = GameData.UNLOCK_TYPE_LABELS[item.unlockType];
            const requirement = GameData.formatUnlockRequirement(item.unlockType, item.unlockRequirement);

            let currentProgress = '';
            switch (item.unlockType) {
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

            return `
                <div class="tooltip-unlock-info">
                    <div style="color: #ff6666; margin-bottom: 5px;">🔒 ${unlockLabel}: ${requirement}</div>
                    <div style="color: #aaa; font-size: 0.85em;">${currentProgress}</div>
                </div>
            `;
        }

        static updateTooltip(htmlContent) {
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
    }

    // ========================================
    // FUNÇÕES PRINCIPAIS
    // ========================================

    function loadHTML() {
        if (isLoaded) return;

        try {
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

        <!-- Tooltip Universal -->
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

            $('body').append(html);

            $('<link>', {
                rel: 'stylesheet',
                href: 'interfaces/css/customize.css'
            }).appendTo('head');

            isLoaded = true;

            // Gerar cards usando os componentes
            generateAllCards();
            setupUniversalEvents();
        } catch (error) {
            console.error('Erro ao carregar tela de personalização:', error);
        }
    }

    function generateAllCards() {
        // Gerar cards de naves
        const allShips = GameData.getAllShips();
        shipComponent.generateCards(
            allShips,
            ProgressionSystem.isShipUnlocked,
            ProgressionSystem.getSelectedShip
        );

        // Gerar cards de especiais
        const allSpecials = GameData.getAllSpecials();
        specialComponent.generateCards(
            allSpecials,
            ProgressionSystem.isSpecialUnlocked,
            ProgressionSystem.getSelectedSpecial
        );
    }

    function setupUniversalEvents() {
        // Botão voltar
        $(document).off('click', '#backToMenuBtn').on('click', '#backToMenuBtn', function () {
            hide();
            if (typeof StartScreenHUD !== 'undefined') {
                StartScreenHUD.show();
            }
        });

        // Eventos universais de cards
        setupCardEvents('ship');
        setupCardEvents('special');

        // Tab switching
        $(document).off('click', '.tab-button').on('click', '.tab-button', function () {
            const tabName = $(this).data('tab');
            switchTab(tabName);
        });
    }

    function setupCardEvents(type) {
        const cardClass = `.${type}-card`;
        const btnClass = `.select-${type}-btn`;

        // Click nos cards
        $(document).off('click', cardClass).on('click', cardClass, function (e) {
            if ($(e.target).hasClass(`select-${type}-btn`)) {
                return;
            }
            
            const itemId = $(this).data(type);
            
            // Remover classe 'viewing' de todos os cards
            $('.ship-card, .special-card').removeClass('viewing');
            
            // Adicionar classe 'viewing' ao card clicado
            $(this).addClass('viewing');
            
            // Mostrar tooltip apropriado
            if (type === 'ship') {
                TooltipManager.showShipTooltip(itemId);
            } else {
                TooltipManager.showSpecialTooltip(itemId);
            }
        });

        // Hover nos cards
        $(document).on('mouseenter', cardClass, function () {
            const itemId = $(this).data(type);
            if (type === 'ship') {
                TooltipManager.showShipTooltip(itemId);
            } else {
                TooltipManager.showSpecialTooltip(itemId);
            }
        });

        // Botões de seleção
        $(document).off('click', btnClass).on('click', btnClass, function (e) {
            e.stopPropagation();
            e.preventDefault();
            const selectedId = parseInt($(this).data(`${type}-id`));
            
            if (type === 'ship') {
                selectShip(selectedId);
            } else {
                selectSpecial(selectedId);
            }
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
            $('.ship-card, .special-card').removeClass('viewing');
            $(`.special-card[data-special="${selectedSpecial}"]`).addClass('viewing');
            TooltipManager.showSpecialTooltip(selectedSpecial);
        } else {
            const selectedShip = ProgressionSystem.getSelectedShip();
            $('.ship-card, .special-card').removeClass('viewing');
            $(`.ship-card[data-ship="${selectedShip}"]`).addClass('viewing');
            TooltipManager.showShipTooltip(selectedShip);
        }
    }

    function selectShip(shipId) {
        if (!ProgressionSystem.isShipUnlocked(shipId)) {
            showNotification('Esta nave ainda está bloqueada!');
            return;
        }
        
        $('.ship-card').removeClass('selected');
        $(`.ship-card[data-ship="${shipId}"]`).addClass('selected');

        ProgressionSystem.setSelectedShip(shipId);
        updateSelectedShipDisplay();

        const ship = GameData.getShipById(shipId);
        showNotification(`${ship ? ship.name : 'Nave'} selecionada!`);
        TooltipManager.showShipTooltip(shipId);
    }

    function selectSpecial(specialId) {
        if (specialId !== 0 && !ProgressionSystem.isSpecialUnlocked(specialId)) {
            showNotification('Este especial ainda está bloqueado!');
            return;
        }
        
        $('.special-card').removeClass('selected');
        $(`.special-card[data-special="${specialId}"]`).addClass('selected');

        ProgressionSystem.setSelectedSpecial(specialId);
        updateSelectedSpecialDisplay();

        let specialName;
        if (specialId === 0) {
            specialName = 'Shockwave';
        } else {
            const special = GameData.getSpecialById(specialId);
            specialName = special ? special.name : 'Especial';
        }
        
        showNotification(`${specialName} selecionado!`);
        TooltipManager.showSpecialTooltip(specialId);
    }

    function updateSelectedShipDisplay() {
        const selectedShip = ProgressionSystem.getSelectedShip();
        const ship = GameData.getShipById(selectedShip);
        $('#selectedShipName').text(ship ? ship.name : 'PIONEER-X1');
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

    function showNotification(message) {
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

        setTimeout(() => $notification.css('opacity', '1'), 10);
        setTimeout(() => {
            $notification.css('opacity', '0');
            setTimeout(() => $notification.remove(), 300);
        }, 2000);
    }

    function updateUI() {
        // Atualizar scores
        $('#bestScore').text(ProgressionSystem.getBestScore());
        $('#totalScore').text(ProgressionSystem.getTotalScore());

        // Atualizar estados dos cards usando os componentes
        const allShips = GameData.getAllShips();
        shipComponent.updateCardStates(
            allShips,
            ProgressionSystem.isShipUnlocked,
            ProgressionSystem.getSelectedShip
        );

        const allSpecials = GameData.getAllSpecials();
        specialComponent.updateCardStates(
            allSpecials,
            ProgressionSystem.isSpecialUnlocked,
            ProgressionSystem.getSelectedSpecial
        );

        // Atualizar displays
        updateSelectedShipDisplay();
        updateSelectedSpecialDisplay();
    }

    function initializeTooltip() {
        const activeTab = $('.tab-button.active').data('tab');
        
        if (activeTab === 'especiais') {
            const selectedSpecial = ProgressionSystem.getSelectedSpecial();
            $('.ship-card, .special-card').removeClass('viewing');
            $(`.special-card[data-special="${selectedSpecial}"]`).addClass('viewing');
            TooltipManager.showSpecialTooltip(selectedSpecial);
        } else {
            const selectedShip = ProgressionSystem.getSelectedShip();
            $('.ship-card, .special-card').removeClass('viewing');
            $(`.ship-card[data-ship="${selectedShip}"]`).addClass('viewing');
            TooltipManager.showShipTooltip(selectedShip);
        }
    }

    function show() {
        loadHTML();

        setTimeout(() => {
            updateUI();
            initializeTooltip();

            const $overlay = $('#customizeOverlay');
            if ($overlay.length) {
                $overlay.css({ display: 'flex', opacity: 0 });
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