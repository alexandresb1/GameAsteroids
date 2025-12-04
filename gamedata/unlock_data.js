// Dados centralizados de desbloqueio do jogo
const GameData = (function () {

    // Definição de naves com requisitos de desbloqueio
    const SHIPS = {
        1: {
            id: 1,
            name: 'PIONEER-X1',
            description: 'Nave de reconhecimento padrão da frota. Equilibrada e confiável, ideal para missões de exploração inicial e treinamento de pilotos novatos.',
            sprite: 'assets/sprites/Ship-1.png',
            attributes: {
                maneuverability: 4,
                resistance: 2,
                fireRate: 3
            },
            unlockType: 'always',
            unlockRequirement: 0
        },
        2: {
            id: 2,
            name: 'VIPER-DELTA',
            description: 'Interceptador de alta velocidade com motores turbo modificados. Especializada em manobras evasivas e ataques rápidos contra alvos móveis.',
            sprite: 'assets/sprites/Ship-2.png',
            attributes: {
                maneuverability: 6,
                resistance: 1,
                fireRate: 4
            },
            unlockType: 'highScore',
            unlockRequirement: 200
        },
        3: {
            id: 3,
            name: 'TITAN-FORGE',
            description: 'Cruzador pesado com blindagem reforçada e sistemas de resistência avançados. Construída para enfrentar campos de asteroides densos.',
            sprite: 'assets/sprites/Ship-3.png',
            attributes: {
                maneuverability: 3,
                resistance: 4,
                fireRate: 6
            },
            unlockType: 'totalScore',
            unlockRequirement: 1000
        },
        4: {
            id: 4,
            name: 'GREEN-REAPER',
            description: 'Caça furtivo experimental com tecnologia alien recuperada. Combina stealth, velocidade e firepower para missões de elite.',
            sprite: 'assets/sprites/Ship-4.png',
            attributes: {
                maneuverability: 4,
                resistance: 2,
                fireRate: 5
            },
            unlockType: 'playTime',
            unlockRequirement: 60
        }
    };

    // Tipos de desbloqueio disponíveis
    const UNLOCK_TYPES = {
        ALWAYS: 'always',           // Sempre desbloqueado
        HIGH_SCORE: 'highScore',    // Desbloqueio por melhor pontuação
        TOTAL_SCORE: 'totalScore',  // Desbloqueio por pontuação total acumulada
        PLAY_TIME: 'playTime'       // Desbloqueio por tempo de jogo (em segundos)
    };

    // Descrições dos tipos de desbloqueio
    const UNLOCK_TYPE_LABELS = {
        'always': 'Sempre disponível',
        'highScore': 'Melhor Score',
        'totalScore': 'Score Total',
        'playTime': 'Tempo de Jogo'
    };

    // Função para formatar requisito de desbloqueio
    function formatUnlockRequirement(unlockType, requirement) {
        switch (unlockType) {
            case UNLOCK_TYPES.HIGH_SCORE:
                return `${requirement} pontos`;
            case UNLOCK_TYPES.TOTAL_SCORE:
                return `${requirement} pontos totais`;
            case UNLOCK_TYPES.PLAY_TIME:
                const minutes = Math.floor(requirement / 60);
                const seconds = requirement % 60;
                return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutos`;
            default:
                return 'Disponível';
        }
    }

    // Obter todas as naves
    function getAllShips() {
        return Object.values(SHIPS);
    }

    // Obter nave por ID
    function getShipById(id) {
        return SHIPS[id];
    }

    // Obter naves por tipo de desbloqueio
    function getShipsByUnlockType(unlockType) {
        return Object.values(SHIPS).filter(ship => ship.unlockType === unlockType);
    }

    return {
        SHIPS,
        UNLOCK_TYPES,
        UNLOCK_TYPE_LABELS,
        getAllShips,
        getShipById,
        getShipsByUnlockType,
        formatUnlockRequirement
    };
})();
