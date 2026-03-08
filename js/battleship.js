var setupScreen = document.getElementById('setup-screen');
var passScreen = document.getElementById('pass-screen');
var fleetScreen = document.getElementById('fleet-screen');
var gameScreen = document.getElementById('game-screen');

var attackBoardElement = document.getElementById('attack-board');
var defenseBoardElement = document.getElementById('defense-board');
var fleetBoardElement = document.getElementById('fleet-board');
var statusMessage = document.getElementById('status-message');

var btnPvE = document.getElementById('btn-pve');
var btnPvP = document.getElementById('btn-pvp');
var btnStartMode = document.getElementById('btn-start-mode');

var gameMode = 'pve'; // pve or pvp
var gameState = 'MODE_SELECT'; 
var currentPlayer = 1;

var boards = {
    1: { ships: [], hits: [] }, // hits[i] = 0(none), 1(miss), 2(hit)
    2: { ships: [], hits: [] }
};
var totalShipCells = 17;

function initGame() {
    window.addEventListener('langChanged', function() {
        if (gameState === 'MODE_SELECT') {
            selectMode(gameMode);
        }
    });
    setTimeout(function() {
        selectMode('pve');
    }, 100);
}

function selectMode(selectedMode) {
    gameMode = selectedMode;
    document.getElementById('btn-pvp').style.backgroundColor = gameMode === 'pvp' ? 'black' : 'white';
    document.getElementById('btn-pvp').style.color = gameMode === 'pvp' ? 'white' : 'black';
    document.getElementById('btn-pve').style.backgroundColor = gameMode === 'pve' ? 'black' : 'white';
    document.getElementById('btn-pve').style.color = gameMode === 'pve' ? 'white' : 'black';
    
    var descText = document.getElementById('diff-desc-text');
    if (descText) {
        if (gameMode === 'pve') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('bs_pve_desc') : 'PvE';
        if (gameMode === 'pvp') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('bs_pvp_desc') : 'PvP';
    }
    btnStartMode.style.display = 'inline-block';
}

function startSetup() {
    setupScreen.style.display = 'none';
    currentPlayer = 1;
    boards[1].ships = generateRandomFleet();
    boards[2].ships = generateRandomFleet(); // generate AI/P2 upfront
    
    // Clear hits
    for(var i=0; i<100; i++) { boards[1].hits[i] = 0; boards[2].hits[i] = 0; }
    
    showFleetPlacement();
}

function generateRandomFleet() {
    var b = [];
    for (var i = 0; i < 100; i++) b.push(0);
    var ships = [5, 4, 3, 3, 2];
    for (var s = 0; s < ships.length; s++) {
        var size = ships[s];
        var placed = false;
        while (!placed) {
            var isVertical = Math.random() > 0.5;
            var r = Math.floor(Math.random() * (isVertical ? (10 - size) : 10));
            var c = Math.floor(Math.random() * (isVertical ? 10 : (10 - size)));
            var canPlace = true;
            for (var l = 0; l < size; l++) {
                if (b[(r + (isVertical?l:0)) * 10 + (c + (isVertical?0:l))] === 1) {
                    canPlace = false; break;
                }
            }
            if (canPlace) {
                for (var l2 = 0; l2 < size; l2++) {
                    b[(r + (isVertical?l2:0)) * 10 + (c + (isVertical?0:l2))] = 1;
                }
                placed = true;
            }
        }
    }
    return b;
}

function showFleetPlacement() {
    gameState = 'FLEET_PLACEMENT';
    passScreen.style.display = 'none';
    fleetScreen.style.display = 'block';
    document.getElementById('fleet-title').innerText = typeof getTranslation !== 'undefined' ? getTranslation('p' + currentPlayer + '_fleet') : 'Fleet';
    
    // Render the current player's generated fleet
    fleetBoardElement.innerHTML = '';
    var myBoard = boards[currentPlayer].ships;
    for (var i = 0; i < 100; i++) {
        var cell = document.createElement('div');
        cell.className = 'battleship-cell';
        if (myBoard[i] === 1) {
            cell.className += ' hit'; // Black square for ship
        }
        fleetBoardElement.appendChild(cell);
        if ((i + 1) % 10 === 0) {
            var br = document.createElement('div');
            br.className = 'clearfix';
            fleetBoardElement.appendChild(br);
        }
    }
}

function shuffleCurrentFleet() {
    boards[currentPlayer].ships = generateRandomFleet();
    showFleetPlacement();
}

function confirmFleet() {
    if (gameMode === 'pve') {
        // AI fleet already generated, skip to playing
        gameState = 'PLAYING';
        fleetScreen.style.display = 'none';
        startTurn();
    } else {
        // PvP
        if (currentPlayer === 1) {
            currentPlayer = 2;
            fleetScreen.style.display = 'none';
            triggerPassDevice();
        } else {
            currentPlayer = 1; // Back to P1 to start
            fleetScreen.style.display = 'none';
            triggerPassDevice();
            gameState = 'PLAYING';
        }
    }
}

function triggerPassDevice() {
    gameScreen.style.display = 'none';
    fleetScreen.style.display = 'none';
    passScreen.style.display = 'block';
    document.getElementById('pass-title').innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_turn_p' + currentPlayer) : 'Player ' + currentPlayer;
}

function acknowledgePass() {
    passScreen.style.display = 'none';
    if (gameState === 'FLEET_PLACEMENT') {
        showFleetPlacement();
    } else if (gameState === 'PLAYING') {
        startTurn();
    }
}

function startTurn() {
    gameScreen.style.display = 'block';
    document.getElementById('post-game-controls').style.display = 'none';
    
    var enemyId = currentPlayer === 1 ? 2 : 1;
    var myId = currentPlayer;
    
    document.getElementById('defense-title').innerText = typeof getTranslation !== 'undefined' ? getTranslation('p' + currentPlayer + '_fleet') : 'Your Fleet';
    statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_turn_p' + currentPlayer) : 'Your Turn';

    // Render Attack Board (Enemy)
    attackBoardElement.innerHTML = '';
    for (var i = 0; i < 100; i++) {
        (function(index) {
            var cell = document.createElement('div');
            cell.className = 'battleship-cell';
            var hitState = boards[enemyId].hits[index];
            if (hitState === 1) {
                cell.className += ' miss'; cell.innerHTML = 'O';
            } else if (hitState === 2) {
                cell.className += ' hit'; cell.innerHTML = 'X';
            } else {
                cell.innerHTML = '<span style="visibility:hidden">X</span>';
                cell.onclick = function() { registerAttack(index); };
            }
            attackBoardElement.appendChild(cell);
            if ((index + 1) % 10 === 0) {
                var br = document.createElement('div'); br.className = 'clearfix'; attackBoardElement.appendChild(br);
            }
        })(i);
    }
    
    // Render Defense Board (Self)
    defenseBoardElement.innerHTML = '';
    for (var j = 0; j < 100; j++) {
        var cellSelf = document.createElement('div');
        cellSelf.className = 'battleship-cell';
        var myShip = boards[myId].ships[j];
        var myHitState = boards[myId].hits[j];
        if (myShip === 1) cellSelf.className += ' hit'; // Show ship in black
        
        if (myHitState === 1) {
            cellSelf.className += ' miss'; cellSelf.innerHTML = 'O';
            if (myShip !== 1) { cellSelf.style.backgroundColor = 'white'; cellSelf.style.color = '#666'; }
        } else if (myHitState === 2) {
            cellSelf.className += ' hit'; cellSelf.innerHTML = 'X';
            cellSelf.style.color = 'red'; // Differentiate hit on own ship for e-ink? E-ink shows red as dark grey/black. Let's use custom text.
            cellSelf.innerHTML = '<span style="color:white">X</span>';
        } else {
            cellSelf.innerHTML = '<span style="visibility:hidden">X</span>';
        }
        
        defenseBoardElement.appendChild(cellSelf);
        if ((j + 1) % 10 === 0) {
            var br2 = document.createElement('div'); br2.className = 'clearfix'; defenseBoardElement.appendChild(br2);
        }
    }
}

function registerAttack(index) {
    if (gameState !== 'PLAYING') return;
    
    var enemyId = currentPlayer === 1 ? 2 : 1;
    var isHit = boards[enemyId].ships[index] === 1;
    
    boards[enemyId].hits[index] = isHit ? 2 : 1;
    
    // Check Win
    var hitsScored = 0;
    for(var k=0; k<100; k++) { if(boards[enemyId].hits[k] === 2) hitsScored++; }
    
    if (hitsScored >= totalShipCells) {
        startTurn(); // Re-render to show final strike
        gameState = 'GAME_OVER';
        statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_win') + " P" + currentPlayer : 'P' + currentPlayer + ' Won!';
        document.getElementById('post-game-controls').style.display = 'block';
        return;
    }
    
    // Switch Turn
    if (gameMode === 'pvp') {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        triggerPassDevice();
    } else {
        // AI Turn
        startTurn(); // Re-render my strike first
        statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_turn_ai') : 'AI thinking...';
        gameState = 'AI_WAITING';
        
        setTimeout(function() {
            if (gameState === 'GAME_OVER') return;
            var aiAttacked = false;
            while(!aiAttacked) {
                var aiChoice = Math.floor(Math.random() * 100);
                if (boards[1].hits[aiChoice] === 0) {
                    boards[1].hits[aiChoice] = boards[1].ships[aiChoice] === 1 ? 2 : 1;
                    aiAttacked = true;
                }
            }
            
            // AI Win Check
            var aiHitsScored = 0;
            for(var a=0; a<100; a++) { if(boards[1].hits[a] === 2) aiHitsScored++; }
            if (aiHitsScored >= totalShipCells) {
                gameState = 'GAME_OVER';
                startTurn();
                statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_lose') : 'You Lost!';
                document.getElementById('post-game-controls').style.display = 'block';
            } else {
                gameState = 'PLAYING';
                startTurn();
            }
        }, 800);
    }
}

function resetToMenu() {
    gameScreen.style.display = 'none';
    setupScreen.style.display = 'block';
    gameState = 'MODE_SELECT';
}

document.addEventListener('DOMContentLoaded', initGame);
