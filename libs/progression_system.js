const ProgressionSystem = (function() {
    
    // Chaves para localStorage
    const STORAGE_KEYS = {
        BEST_SCORE: 'asteroids_best_score',
        SELECTED_SHIP: 'asteroids_selected_ship',
        UNLOCKED_SHIPS: 'asteroids_unlocked_ships'
    };
    
    // Configurações de desbloqueio
    const UNLOCK_REQUIREMENTS = {
        1: 0,    // Nave Básica - sempre desbloqueada
        2: 200,  // Nave Rápida
        3: 400,  // Nave Resistente  
        4: 800   // Nave Elite
    };
    
    // Inicializar dados padrão
    function initializeData() {
        // Se não há melhor score, definir como 0
        if (localStorage.getItem(STORAGE_KEYS.BEST_SCORE) === null) {
            setBestScore(0);
        }
        
        // Se não há nave selecionada, definir como 1 (básica)
        if (localStorage.getItem(STORAGE_KEYS.SELECTED_SHIP) === null) {
            setSelectedShip(1);
        }
        
        // Atualizar naves desbloqueadas baseado no score atual
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
        const bestScore = getBestScore();
        const unlocked = [];
        
        for (const [shipId, requiredScore] of Object.entries(UNLOCK_REQUIREMENTS)) {
            if (bestScore >= requiredScore) {
                unlocked.push(parseInt(shipId));
            }
        }
        
        setUnlockedShips(unlocked);
    }
    
    function isShipUnlocked(shipId) {
        const bestScore = getBestScore();
        return bestScore >= UNLOCK_REQUIREMENTS[shipId];
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
        
        // Constantes
        UNLOCK_REQUIREMENTS
    };
})();
