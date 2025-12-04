const ProgressionSystem = (function () {

    // Chaves para localStorage
    const STORAGE_KEYS = {
        BEST_SCORE: 'asteroids_best_score',
        TOTAL_SCORE: 'asteroids_total_score',
        PLAY_TIME: 'asteroids_play_time',
        SELECTED_SHIP: 'asteroids_selected_ship',
        UNLOCKED_SHIPS: 'asteroids_unlocked_ships'
    };

    // Acumulador de tempo da sessão atual (em segundos)
    let currentSessionTime = 0;

    // Configurações de desbloqueio (agora vem do GameData)
    const UNLOCK_REQUIREMENTS = {};

    // Inicializar requirements do GameData quando disponível
    function initUnlockRequirements() {
        if (typeof GameData !== 'undefined') {
            const ships = GameData.getAllShips();
            ships.forEach(ship => {
                UNLOCK_REQUIREMENTS[ship.id] = {
                    type: ship.unlockType,
                    value: ship.unlockRequirement
                };
            });
        }
    }

    // Inicializar dados padrão
    function initializeData() {
        // Inicializar requirements do GameData
        initUnlockRequirements();

        // Se não há melhor score, definir como 0
        if (localStorage.getItem(STORAGE_KEYS.BEST_SCORE) === null) {
            setBestScore(0);
        }

        // Se não há score total, definir como 0
        if (localStorage.getItem(STORAGE_KEYS.TOTAL_SCORE) === null) {
            setTotalScore(0);
        }

        // Se não há tempo de jogo, definir como 0
        if (localStorage.getItem(STORAGE_KEYS.PLAY_TIME) === null) {
            setPlayTime(0);
        }

        // Se não há nave selecionada, definir como 1 (básica)
        if (localStorage.getItem(STORAGE_KEYS.SELECTED_SHIP) === null) {
            setSelectedShip(1);
        }

        // Atualizar naves desbloqueadas baseado nas stats atuais
        updateUnlockedShips();
    }

    // Gerenciar melhor pontuação
    function getBestScore() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.BEST_SCORE)) || 0;
    }

    function setBestScore(score) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
        updateUnlockedShips();
    }

    function updateScore(newScore) {
        const currentBest = getBestScore();
        if (newScore > currentBest) {
            setBestScore(newScore);

            // Verificar se desbloqueou novas naves
            const newlyUnlocked = checkNewUnlocks(currentBest, newScore);
            if (newlyUnlocked.length > 0) {
                showUnlockNotifications(newlyUnlocked);
            }

            return true; // Novo recorde
        }
        return false; // Não foi recorde
    }

    // Gerenciar score total
    function getTotalScore() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SCORE)) || 0;
    }

    function setTotalScore(score) {
        localStorage.setItem(STORAGE_KEYS.TOTAL_SCORE, score.toString());
        updateUnlockedShips();
    }

    function addToTotalScore(points) {
        const current = getTotalScore();
        setTotalScore(current + points);
    }

    // Gerenciar tempo de jogo (em segundos)
    function getPlayTime() {
        const stored = localStorage.getItem(STORAGE_KEYS.PLAY_TIME);
        const savedTime = parseInt(stored) || 0;
        // Retornar tempo salvo + tempo da sessão atual
        return savedTime + Math.floor(currentSessionTime);
    }

    function setPlayTime(seconds) {
        // Salvar apenas segundos inteiros
        localStorage.setItem(STORAGE_KEYS.PLAY_TIME, Math.floor(seconds).toString());
        updateUnlockedShips();
    }

    function addPlayTime(deltaSeconds) {
        // Acumular tempo na sessão atual (não salva no localStorage ainda)
        currentSessionTime += deltaSeconds;
    }

    function saveCurrentSession() {
        // Salvar o tempo acumulado da sessão no localStorage
        if (currentSessionTime > 0) {
            const totalTime = getPlayTime();
            setPlayTime(totalTime);
            console.log('✅ Sessão salva! Tempo total:', Math.floor(totalTime), 'segundos');
            currentSessionTime = 0; // Resetar acumulador
        }
    }

    function resetSessionTime() {
        // Resetar o acumulador da sessão (usado quando volta ao menu sem salvar)
        currentSessionTime = 0;
    }

    // Gerenciar nave selecionada
    function getSelectedShip() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.SELECTED_SHIP)) || 1;
    }

    function setSelectedShip(shipId) {
        // Verificar se a nave está desbloqueada
        if (isShipUnlocked(shipId)) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_SHIP, shipId.toString());
            return true;
        }
        return false;
    }

    // Gerenciar naves desbloqueadas
    function getUnlockedShips() {
        const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_SHIPS);
        return stored ? JSON.parse(stored) : [1]; // Nave 1 sempre desbloqueada
    }

    function setUnlockedShips(ships) {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_SHIPS, JSON.stringify(ships));
    }

    function updateUnlockedShips() {
        const unlocked = [];
        const bestScore = getBestScore();
        const totalScore = getTotalScore();
        const playTime = getPlayTime();

        for (const [shipId, requirement] of Object.entries(UNLOCK_REQUIREMENTS)) {
            if (checkUnlockRequirement(requirement, bestScore, totalScore, playTime)) {
                unlocked.push(parseInt(shipId));
            }
        }

        setUnlockedShips(unlocked);
    }

    function checkUnlockRequirement(requirement, bestScore, totalScore, playTime) {
        switch (requirement.type) {
            case 'always':
                return true;
            case 'highScore':
                return bestScore >= requirement.value;
            case 'totalScore':
                return totalScore >= requirement.value;
            case 'playTime':
                return playTime >= requirement.value;
            default:
                return false;
        }
    }

    function isShipUnlocked(shipId) {
        const requirement = UNLOCK_REQUIREMENTS[shipId];
        if (!requirement) return false;

        const bestScore = getBestScore();
        const totalScore = getTotalScore();
        const playTime = getPlayTime();

        return checkUnlockRequirement(requirement, bestScore, totalScore, playTime);
    }

    // Verificar novos desbloqueios
    function checkNewUnlocks(oldScore, newScore) {
        const newlyUnlocked = [];

        for (const [shipId, requiredScore] of Object.entries(UNLOCK_REQUIREMENTS)) {
            if (oldScore < requiredScore && newScore >= requiredScore) {
                newlyUnlocked.push({
                    shipId: parseInt(shipId),
                    name: getShipName(shipId)
                });
            }
        }

        return newlyUnlocked;
    }

    function getShipName(shipId) {
        const names = {
            1: 'Nave Básica',
            2: 'Nave Rápida',
            3: 'Nave Resistente',
            4: 'Nave Elite'
        };
        return names[shipId] || `Nave ${shipId}`;
    }

    function showUnlockNotifications(unlockedShips) {
        unlockedShips.forEach((ship, index) => {
            setTimeout(() => {
                showUnlockNotification(ship);
            }, index * 1000); // Mostrar uma por vez com delay
        });
    }

    function showUnlockNotification(ship) {
        // Criar notificação de desbloqueio
        const $notification = $('<div>', {
            css: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
                border: '3px solid #00ff00',
                borderRadius: '15px',
                padding: '30px',
                textAlign: 'center',
                color: 'white',
                fontFamily: 'Courier New, monospace',
                zIndex: 2000,
                opacity: 0,
                transition: 'all 0.5s ease',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)'
            }
        });

        $notification.html(`
            <div style="font-size: 1.5em; color: #00ff00; margin-bottom: 10px;">
                🚀 NAVE DESBLOQUEADA! 🚀
            </div>
            <div style="font-size: 1.2em; margin-bottom: 15px;">
                ${ship.name}
            </div>
            <div style="font-size: 0.9em; color: #cccccc;">
                Disponível na personalização
            </div>
        `);

        $('body').append($notification);

        // Animação de entrada
        setTimeout(() => {
            $notification.css({
                opacity: 1,
                transform: 'translate(-50%, -50%) scale(1.05)'
            });
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            $notification.css({
                opacity: 0,
                transform: 'translate(-50%, -50%) scale(0.8)'
            });
            setTimeout(() => {
                $notification.remove();
            }, 500);
        }, 3000);
    }

    // Resetar progresso (para debug/teste)
    function resetProgress() {
        localStorage.removeItem(STORAGE_KEYS.BEST_SCORE);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_SHIP);
        localStorage.removeItem(STORAGE_KEYS.UNLOCKED_SHIPS);
        initializeData();
    }

    // Obter sprite da nave selecionada
    function getSelectedShipSprite() {
        const selectedShip = getSelectedShip();
        return `assets/sprites/Ship-${selectedShip}.png`;
    }

    // Obter informações completas do progresso
    function getProgressInfo() {
        return {
            bestScore: getBestScore(),
            selectedShip: getSelectedShip(),
            unlockedShips: getUnlockedShips(),
            totalShips: Object.keys(UNLOCK_REQUIREMENTS).length,
            nextUnlock: getNextUnlock()
        };
    }

    // Exportar dados para JSON
    function exportData() {
        const data = {
            version: 2,
            timestamp: Date.now(),
            bestScore: getBestScore(),
            totalScore: getTotalScore(),
            playTime: getPlayTime(),
            selectedShip: getSelectedShip(),
            unlockedShips: getUnlockedShips()
        };
        return JSON.stringify(data, null, 2);
    }

    // Importar dados de JSON
    function importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validação básica
            if (!data || typeof data !== 'object') {
                throw new Error('Formato inválido');
            }

            // Restaurar dados
            if (typeof data.bestScore === 'number') setBestScore(data.bestScore);
            if (typeof data.totalScore === 'number') setTotalScore(data.totalScore);
            if (typeof data.playTime === 'number') setPlayTime(data.playTime);
            if (typeof data.selectedShip === 'number') setSelectedShip(data.selectedShip);
            if (Array.isArray(data.unlockedShips)) setUnlockedShips(data.unlockedShips);

            // Recarregar dados internos
            initializeData();

            return { success: true, message: 'Dados importados com sucesso!' };
        } catch (error) {
            console.error('Erro ao importar save:', error);
            return { success: false, message: 'Erro ao importar: Arquivo inválido.' };
        }
    }

    function getNextUnlock() {
        const bestScore = getBestScore();
        const unlocked = getUnlockedShips();

        for (const [shipId, requiredScore] of Object.entries(UNLOCK_REQUIREMENTS)) {
            if (!unlocked.includes(parseInt(shipId)) && bestScore < requiredScore) {
                return {
                    shipId: parseInt(shipId),
                    name: getShipName(shipId),
                    requiredScore: requiredScore,
                    remaining: requiredScore - bestScore
                };
            }
        }

        return null; // Todas as naves desbloqueadas
    }

    // Inicializar quando o sistema carrega
    initializeData();

    return {
        // Pontuação
        getBestScore,
        setBestScore,
        updateScore,
        getTotalScore,
        setTotalScore,
        addToTotalScore,
        getPlayTime,
        setPlayTime,
        addPlayTime,
        saveCurrentSession,
        resetSessionTime,

        // Naves
        getSelectedShip,
        setSelectedShip,
        getSelectedShipSprite,
        isShipUnlocked,
        getUnlockedShips,

        // Informações
        getProgressInfo,
        getNextUnlock,

        // Utilitários
        resetProgress,
        exportData,
        importData,

        // Constantes
        UNLOCK_REQUIREMENTS
    };
})();
