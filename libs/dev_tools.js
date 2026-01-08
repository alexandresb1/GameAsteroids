const DevTools = (function () {
    let devPanelVisible = false;
    let isToggling = false;
    const DEV_MODE_KEY = 'asteroids_dev_mode';

    function isDevModeEnabled() {
        return localStorage.getItem(DEV_MODE_KEY) === 'true';
    }

    function enableDevMode() {
        localStorage.setItem(DEV_MODE_KEY, 'true');
        createDevPanel();
    }

    function disableDevMode() {
        localStorage.setItem(DEV_MODE_KEY, 'false');
        removeDevPanel();
    }

    function setScore(score) {
        if (typeof ProgressionSystem !== 'undefined') {
            ProgressionSystem.setBestScore(score);
        }
    }

    function setTotalScore(score) {
        if (typeof ProgressionSystem !== 'undefined') {
            ProgressionSystem.setTotalScore(score);
        }
    }

    function setPlayTime(seconds) {
        if (typeof ProgressionSystem !== 'undefined') {
            ProgressionSystem.setPlayTime(seconds);
        }
    }

    function unlockAllShips() {
        if (typeof ProgressionSystem !== 'undefined') {
            const allShips = Object.keys(ProgressionSystem.UNLOCK_REQUIREMENTS);
            ProgressionSystem.setUnlockedShips(allShips.map(id => parseInt(id)));
        }
    }

    function unlockAllSpecials() {
        if (typeof ProgressionSystem !== 'undefined') {
            if (typeof GameData !== 'undefined') {
                const allSpecials = GameData.getAllSpecials().map(s => s.id);
                ProgressionSystem.setUnlockedSpecials(allSpecials);
            }
        }
    }

    function unlockShip(shipId) {
        if (typeof ProgressionSystem !== 'undefined') {
            const unlocked = ProgressionSystem.getUnlockedShips();
            if (!unlocked.includes(shipId)) {
                unlocked.push(shipId);
                ProgressionSystem.setUnlockedShips(unlocked);
            }
        }
    }

    function unlockSpecial(specialId) {
        if (typeof ProgressionSystem !== 'undefined') {
            const unlocked = ProgressionSystem.getUnlockedSpecials();
            if (!unlocked.includes(specialId)) {
                unlocked.push(specialId);
                ProgressionSystem.setUnlockedSpecials(unlocked);
            }
        }
    }

    function resetAll() {
        if (typeof ProgressionSystem !== 'undefined') {
            ProgressionSystem.resetProgress();
        }
    }

    function getStats() {
        if (typeof ProgressionSystem !== 'undefined') {
            const stats = {
                bestScore: ProgressionSystem.getBestScore(),
                totalScore: ProgressionSystem.getTotalScore(),
                playTime: ProgressionSystem.getPlayTime(),
                sessionTime: ProgressionSystem.getSessionTime(),
                selectedShip: ProgressionSystem.getSelectedShip(),
                unlockedShips: ProgressionSystem.getUnlockedShips(),
                selectedSpecial: ProgressionSystem.getSelectedSpecial(),
                unlockedSpecials: ProgressionSystem.getUnlockedSpecials()
            };
            console.table(stats);
            return stats;
        }
    }

    function exportCleanSave() {
        if (typeof ProgressionSystem !== 'undefined') {
            const data = ProgressionSystem.exportData();
            console.log('📋 Save exportado (criptografado):');
            console.log(data);
            
            navigator.clipboard.writeText(data).then(() => {
                console.log('✅ Save copiado para clipboard!');
            });
        }
    }

    function importTestSave(jsonString) {
        if (typeof ProgressionSystem !== 'undefined') {
            const result = ProgressionSystem.importData(jsonString);
            if (result.success) {
                console.log('✅ ' + result.message);
            } else {
                console.error('❌ ' + result.message);
            }
        }
    }

    function createDevPanel() {
        if (document.getElementById('devPanel')) return;

        const html = `
                <div id="devPanel" style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 350px;
                    background: rgba(0, 0, 0, 0.95);
                    border: 3px solid #00ff00;
                    border-radius: 10px;
                    padding: 15px;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    z-index: 9999;
                    box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
                        <span style="font-weight: bold; font-size: 14px;">🔧 DEV TOOLS</span>
                        <button id="closeDevPanel" style="
                            background: #00ff00;
                            color: black;
                            border: none;
                            padding: 5px 10px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-weight: bold;
                        ">✕</button>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <div style="margin-bottom: 5px; color: #ffff00;">📊 SCORES</div>
                        <input type="number" id="devBestScore" placeholder="Melhor Score" style="width: 100%; padding: 5px; margin-bottom: 5px; background: #1a1a1a; border: 1px solid #00ff00; color: #00ff00;">
                        <button id="devSetBestScore" style="width: 100%; padding: 5px; background: #00ff00; color: black; border: none; cursor: pointer; margin-bottom: 10px;">SET BEST SCORE</button>

                        <input type="number" id="devTotalScore" placeholder="Score Total" style="width: 100%; padding: 5px; margin-bottom: 5px; background: #1a1a1a; border: 1px solid #00ff00; color: #00ff00;">
                        <button id="devSetTotalScore" style="width: 100%; padding: 5px; background: #00ff00; color: black; border: none; cursor: pointer; margin-bottom: 10px;">SET TOTAL SCORE</button>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <div style="margin-bottom: 5px; color: #ffff00;">⏱️ TEMPO</div>
                        <input type="number" id="devPlayTime" placeholder="Tempo (segundos)" style="width: 100%; padding: 5px; margin-bottom: 5px; background: #1a1a1a; border: 1px solid #00ff00; color: #00ff00;">
                        <button id="devSetPlayTime" style="width: 100%; padding: 5px; background: #00ff00; color: black; border: none; cursor: pointer; margin-bottom: 10px;">SET PLAY TIME</button>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <div style="margin-bottom: 5px; color: #ffff00;">💾 SAVE</div>
                        <button id="devExportSave" style="width: 100%; padding: 5px; background: #00ff00; color: black; border: none; cursor: pointer; margin-bottom: 5px;">EXPORTAR SAVE</button>
                        <button id="devResetAll" style="width: 100%; padding: 5px; background: #ff4444; color: white; border: none; cursor: pointer; margin-bottom: 5px;">RESETAR TUDO</button>
                        <button id="devGetStats" style="width: 100%; padding: 5px; background: #00ff00; color: black; border: none; cursor: pointer;">VER STATS</button>
                    </div>
                </div>`;

        $('body').append(html);

        // Event listeners - com delay para evitar conflitos
        setTimeout(() => {
            $('#closeDevPanel').on('click', (e) => {
                e.stopPropagation();
                removeDevPanel();
            });

            $('#devSetBestScore').on('click', (e) => {
                e.stopPropagation();
                const value = parseInt($('#devBestScore').val());
                if (!isNaN(value)) setScore(value);
            });

            $('#devSetTotalScore').on('click', (e) => {
                e.stopPropagation();
                const value = parseInt($('#devTotalScore').val());
                if (!isNaN(value)) setTotalScore(value);
            });

            $('#devSetPlayTime').on('click', (e) => {
                e.stopPropagation();
                const value = parseInt($('#devPlayTime').val());
                if (!isNaN(value)) setPlayTime(value);
            });

            $('#devExportSave').on('click', (e) => {
                e.stopPropagation();
                exportCleanSave();
            });

            $('#devResetAll').on('click', (e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que quer resetar TUDO?')) {
                    resetAll();
                }
            });

            $('#devGetStats').on('click', (e) => {
                e.stopPropagation();
                getStats();
            });
        }, 100);

        devPanelVisible = true;
    }

    function removeDevPanel() {
        $('#devPanel').remove();
        devPanelVisible = false;
    }

    function toggleDevPanel() {
        if (isToggling) return;
        isToggling = true;
        
        if (devPanelVisible) {
            removeDevPanel();
        } else {
            createDevPanel();
        }
        
        setTimeout(() => {
            isToggling = false;
        }, 300);
    }

    function initKeyboardShortcuts() {
        // Este listener será removido - usar apenas o listener direto no document
    }

    function init() {
        initKeyboardShortcuts();

        if (isDevModeEnabled()) {
            createDevPanel();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isDevModeEnabled()) {
                enableDevMode();
            } else {
                toggleDevPanel();
            }
        }
        
        if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isDevModeEnabled()) {
                disableDevMode();
            }
        }
    }, true);

    return {
        enableDevMode,
        disableDevMode,
        isDevModeEnabled,
        toggleDevPanel,
        setScore,
        setTotalScore,
        setPlayTime,
        unlockAllShips,
        unlockAllSpecials,
        unlockShip,
        unlockSpecial,
        resetAll,
        getStats,
        exportCleanSave,
        importTestSave
    };
})();
