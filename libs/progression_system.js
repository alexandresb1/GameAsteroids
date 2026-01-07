const ProgressionSystem = (function () {

    // Chaves para localStorage
    const STORAGE_KEYS = {
        BEST_SCORE: 'asteroids_best_score',
        TOTAL_SCORE: 'asteroids_total_score',
        PLAY_TIME: 'asteroids_play_time',
        SELECTED_SHIP: 'asteroids_selected_ship',
        UNLOCKED_SHIPS: 'asteroids_unlocked_ships',
        SELECTED_SPECIAL: 'asteroids_selected_special',
        UNLOCKED_SPECIALS: 'asteroids_unlocked_specials'
    };

    // Acumulador de tempo da sessão atual (em segundos)
    let currentSessionTime = 0;
    
    // Modo mobile (controlado pelo usuário)
    const MOBILE_MODE_KEY = 'asteroids_mobile_mode';

    // Configurações de desbloqueio (agora vem do GameData)
    const UNLOCK_REQUIREMENTS = {};
    const SPECIAL_UNLOCK_REQUIREMENTS = {};

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

            const specials = GameData.getAllSpecials();
            specials.forEach(special => {
                SPECIAL_UNLOCK_REQUIREMENTS[special.id] = {
                    type: special.unlockType,
                    value: special.unlockRequirement
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

        // Se não há especial selecionado, definir como 0 (nenhum)
        if (localStorage.getItem(STORAGE_KEYS.SELECTED_SPECIAL) === null) {
            setSelectedSpecial(0);
        }

        // Atualizar naves desbloqueadas baseado nas stats atuais
        updateUnlockedShips();
        updateUnlockedSpecials();
    }

    // Gerenciar melhor pontuação
    function getBestScore() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.BEST_SCORE)) || 0;
    }

    function setBestScore(score) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
        updateUnlockedShips();
        updateUnlockedSpecials();
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
        updateUnlockedSpecials();
    }

    function addToTotalScore(points) {
        const current = getTotalScore();
        setTotalScore(current + points);
    }

    // Gerenciar tempo de jogo (em segundos)
    function getPlayTime() {
        // Retorna o tempo TOTAL (salvo no localStorage)
        const stored = localStorage.getItem(STORAGE_KEYS.PLAY_TIME);
        return parseInt(stored) || 0;
    }

    function getSessionTime() {
        // Retorna o tempo da SESSÃO ATUAL (não salvo ainda)
        return Math.floor(currentSessionTime);
    }

    function setPlayTime(seconds) {
        // Salvar apenas segundos inteiros
        localStorage.setItem(STORAGE_KEYS.PLAY_TIME, Math.floor(seconds).toString());
        updateUnlockedShips();
        updateUnlockedSpecials();
    }

    function addPlayTime(deltaSeconds) {
        // Acumular tempo na sessão atual (não salva no localStorage ainda)
        currentSessionTime += deltaSeconds;
    }

    function saveCurrentSession() {
        // Salvar o tempo acumulado da sessão no localStorage
        if (currentSessionTime > 0) {
            const totalTime = getPlayTime() + Math.floor(currentSessionTime);
            setPlayTime(totalTime);
            console.log('✅ Sessão salva! Tempo da sessão:', Math.floor(currentSessionTime), 'segundos');
            console.log('✅ Tempo total acumulado:', totalTime, 'segundos');
            currentSessionTime = 0; // Resetar acumulador
        }
    }

    function resetSessionTime() {
        // Resetar o acumulador da sessão (usado quando inicia nova partida)
        console.log('🔄 Tempo de sessão resetado');
        currentSessionTime = 0;
    }

    // Gerenciar modo mobile
    function isMobileMode() {
        return localStorage.getItem(MOBILE_MODE_KEY) === 'true';
    }

    function setMobileMode(enabled) {
        localStorage.setItem(MOBILE_MODE_KEY, enabled.toString());
        console.log('Modo mobile', enabled ? 'ATIVADO' : 'DESATIVADO');
        
        // Recarregar página para aplicar mudanças
        window.location.reload();
    }

    // Gerenciar especial selecionado
    function getSelectedSpecial() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.SELECTED_SPECIAL)) || 0; // 0 = nenhum especial
    }

    function setSelectedSpecial(specialId) {
        // Verificar se o especial está desbloqueado (0 = nenhum especial sempre permitido)
        if (specialId === 0 || isSpecialUnlocked(specialId)) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_SPECIAL, specialId.toString());
            return true;
        }
        return false;
    }

    // Gerenciar especiais desbloqueados
    function getUnlockedSpecials() {
        const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_SPECIALS);
        return stored ? JSON.parse(stored) : []; // Nenhum especial desbloqueado por padrão
    }

    function setUnlockedSpecials(specials) {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_SPECIALS, JSON.stringify(specials));
    }

    function updateUnlockedSpecials() {
        const unlocked = [];
        const bestScore = getBestScore();
        const totalScore = getTotalScore();
        const playTime = getPlayTime();

        for (const [specialId, requirement] of Object.entries(SPECIAL_UNLOCK_REQUIREMENTS)) {
            if (checkUnlockRequirement(requirement, bestScore, totalScore, playTime)) {
                unlocked.push(parseInt(specialId));
            }
        }

        setUnlockedSpecials(unlocked);
    }

    function isSpecialUnlocked(specialId) {
        const requirement = SPECIAL_UNLOCK_REQUIREMENTS[specialId];
        if (!requirement) return false;

        const bestScore = getBestScore();
        const totalScore = getTotalScore();
        const playTime = getPlayTime();

        return checkUnlockRequirement(requirement, bestScore, totalScore, playTime);
    }
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
        console.log('=== RESETANDO PROGRESSO COMPLETO ===');
        
        // Remover TODOS os dados salvos
        localStorage.removeItem(STORAGE_KEYS.BEST_SCORE);
        localStorage.removeItem(STORAGE_KEYS.TOTAL_SCORE);
        localStorage.removeItem(STORAGE_KEYS.PLAY_TIME);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_SHIP);
        localStorage.removeItem(STORAGE_KEYS.UNLOCKED_SHIPS);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_SPECIAL);
        localStorage.removeItem(STORAGE_KEYS.UNLOCKED_SPECIALS);
        
        // Resetar acumulador de sessão
        currentSessionTime = 0;
        
        console.log('✅ Todos os dados foram removidos do localStorage');
        
        // Reinicializar com valores padrão
        initializeData();
        
        console.log('✅ Progresso resetado com sucesso!');
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
            nextUnlock: getNextUnlock(),
            selectedSpecial: getSelectedSpecial(),
            unlockedSpecials: getUnlockedSpecials(),
            totalSpecials: Object.keys(SPECIAL_UNLOCK_REQUIREMENTS).length
        };
    }

    // Função para gerar hash simples (checksum)
    function generateHash(data) {
        let hash = 0;
        const str = JSON.stringify(data);
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32-bit integer
        }
        
        return Math.abs(hash).toString(16);
    }

    // Função para criptografar dados (Base64 + Hash)
    function encryptData(data) {
        try {
            // Gerar hash dos dados originais
            const hash = generateHash(data);
            
            // Adicionar hash aos dados
            const dataWithHash = {
                ...data,
                _hash: hash
            };
            
            // Converter para JSON e depois para Base64
            const jsonString = JSON.stringify(dataWithHash);
            const encoded = btoa(jsonString); // Base64 encoding
            
            return encoded;
        } catch (error) {
            console.error('Erro ao criptografar dados:', error);
            return null;
        }
    }

    // Função para descriptografar dados (Base64 + Verificação de Hash)
    function decryptData(encoded) {
        try {
            // Decodificar de Base64
            const jsonString = atob(encoded);
            const data = JSON.parse(jsonString);
            
            // Extrair hash
            const storedHash = data._hash;
            delete data._hash; // Remover hash dos dados
            
            // Gerar hash dos dados atuais
            const currentHash = generateHash(data);
            
            // Verificar integridade
            if (storedHash !== currentHash) {
                console.warn('⚠️ Aviso: Arquivo foi modificado! Hash não corresponde.');
                return null; // Arquivo foi manipulado
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao descriptografar dados:', error);
            return null;
        }
    }

    // Exportar dados para JSON (criptografado)
    function exportData() {
        const data = {
            version: 3,
            timestamp: Date.now(),
            bestScore: getBestScore(),
            totalScore: getTotalScore(),
            playTime: getPlayTime(),
            selectedShip: getSelectedShip(),
            unlockedShips: getUnlockedShips(),
            selectedSpecial: getSelectedSpecial(),
            unlockedSpecials: getUnlockedSpecials()
        };
        
        // Criptografar dados
        const encrypted = encryptData(data);
        
        if (!encrypted) {
            return JSON.stringify({ error: 'Erro ao exportar save' });
        }
        
        // Retornar em formato JSON com dados criptografados
        const exportedData = {
            encrypted: true,
            data: encrypted,
            exportedAt: new Date().toLocaleString('pt-BR')
        };
        
        return JSON.stringify(exportedData, null, 2);
    }

    // Importar dados de JSON (descriptografado)
    function importData(jsonString) {
        try {
            const fileData = JSON.parse(jsonString);

            // Validação básica
            if (!fileData || typeof fileData !== 'object') {
                throw new Error('Formato inválido');
            }

            // Verificar se está criptografado
            if (fileData.encrypted === true && fileData.data) {
                // Descriptografar dados
                const data = decryptData(fileData.data);
                
                if (!data) {
                    return { 
                        success: false, 
                        message: 'Erro ao importar: Arquivo foi modificado ou corrompido!' 
                    };
                }
                
                // Restaurar dados descriptografados
                if (typeof data.bestScore === 'number') setBestScore(data.bestScore);
                if (typeof data.totalScore === 'number') setTotalScore(data.totalScore);
                if (typeof data.playTime === 'number') setPlayTime(data.playTime);
                if (typeof data.selectedShip === 'number') setSelectedShip(data.selectedShip);
                if (Array.isArray(data.unlockedShips)) setUnlockedShips(data.unlockedShips);
                if (typeof data.selectedSpecial === 'number') setSelectedSpecial(data.selectedSpecial);
                if (Array.isArray(data.unlockedSpecials)) setUnlockedSpecials(data.unlockedSpecials);

                // Recarregar dados internos
                initializeData();

                return { success: true, message: 'Save importado com sucesso!' };
            } else {
                // Arquivo antigo sem criptografia (compatibilidade)
                console.warn('⚠️ Aviso: Save antigo detectado (sem criptografia)');
                
                // Restaurar dados do formato antigo
                if (typeof fileData.bestScore === 'number') setBestScore(fileData.bestScore);
                if (typeof fileData.totalScore === 'number') setTotalScore(fileData.totalScore);
                if (typeof fileData.playTime === 'number') setPlayTime(fileData.playTime);
                if (typeof fileData.selectedShip === 'number') setSelectedShip(fileData.selectedShip);
                if (Array.isArray(fileData.unlockedShips)) setUnlockedShips(fileData.unlockedShips);
                if (typeof fileData.selectedSpecial === 'number') setSelectedSpecial(fileData.selectedSpecial);
                if (Array.isArray(fileData.unlockedSpecials)) setUnlockedSpecials(fileData.unlockedSpecials);

                // Recarregar dados internos
                initializeData();

                return { success: true, message: 'Save antigo importado com sucesso!' };
            }
        } catch (error) {
            console.error('Erro ao importar save:', error);
            return { success: false, message: 'Erro ao importar: Arquivo inválido ou corrompido.' };
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
        getSessionTime,
        setPlayTime,
        addPlayTime,
        saveCurrentSession,
        resetSessionTime,
        isMobileMode,
        setMobileMode,

        // Naves
        getSelectedShip,
        setSelectedShip,
        getSelectedShipSprite,
        isShipUnlocked,
        getUnlockedShips,
        setUnlockedShips,

        // Especiais
        getSelectedSpecial,
        setSelectedSpecial,
        isSpecialUnlocked,
        getUnlockedSpecials,
        setUnlockedSpecials,

        // Informações
        getProgressInfo,
        getNextUnlock,

        // Utilitários
        resetProgress,
        exportData,
        importData,
        encryptData,
        decryptData,

        // Constantes
        UNLOCK_REQUIREMENTS
    };
})();
