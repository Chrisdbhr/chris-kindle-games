var boardSizeCols = 7;
var boardSizeRows = 6;
var board = [];
var currentPlayer = 1; // 1 = Black, 2 = White
var gameActive = false;
var scores = { player1: 0, player2: 0 };

var gameMode = 'pvp'; // pvp or pve
var aiDifficulty = 'medium'; 
var isAIThinking = false;

var boardElement = document.getElementById('board');
var statusMessage = document.getElementById('status-message');
var score1Element = document.getElementById('score-1');
var score2Element = document.getElementById('score-2');
var labelScore2Element = document.getElementById('label-score-2');
var btnPvp = document.getElementById('btn-pvp');
var btnPve = document.getElementById('btn-pve');
var btnEasy = document.getElementById('btn-c4-easy');
var btnMed = document.getElementById('btn-c4-med');
var btnHard = document.getElementById('btn-c4-hard');
var diffSelector = document.getElementById('difficulty-selector');

function initSetup() {
    loadScores();
    setMode('pvp');
    setDifficulty('medium');
    document.getElementById('setup-screen').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';

    window.addEventListener('langChanged', function() {
        if (document.getElementById('setup-screen').style.display !== 'none') {
            setDifficulty(aiDifficulty); // update description
        }
    });
}

function setMode(mode) {
    gameMode = mode;
    btnPvp.style.backgroundColor = mode === 'pvp' ? 'black' : 'white';
    btnPvp.style.color = mode === 'pvp' ? 'white' : 'black';
    btnPve.style.backgroundColor = mode === 'pve' ? 'black' : 'white';
    btnPve.style.color = mode === 'pve' ? 'white' : 'black';

    if (mode === 'pve') {
        diffSelector.style.display = 'block';
        labelScore2Element.innerText = typeof getTranslation !== 'undefined' ? getTranslation('score_cpu_c4') : 'IA (Branco): ';
    } else {
        diffSelector.style.display = 'none';
        labelScore2Element.innerText = typeof getTranslation !== 'undefined' ? getTranslation('score_p2_c4') : 'Jogador 2 (Branco): ';
        document.getElementById('diff-desc-text').innerText = ''; 
    }
}

function setDifficulty(level) {
    aiDifficulty = level;
    btnEasy.style.backgroundColor = level === 'easy' ? 'black' : 'white';
    btnEasy.style.color = level === 'easy' ? 'white' : 'black';
    btnMed.style.backgroundColor = level === 'medium' ? 'black' : 'white';
    btnMed.style.color = level === 'medium' ? 'white' : 'black';
    btnHard.style.backgroundColor = level === 'hard' ? 'black' : 'white';
    btnHard.style.color = level === 'hard' ? 'white' : 'black';

    var descText = document.getElementById('diff-desc-text');
    if (gameMode === 'pve' && descText) {
        if (level === 'easy') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_easy_desc') : 'Easy';
        if (level === 'medium') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_med_desc') : 'Medium';
        if (level === 'hard') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_hard_desc') : 'Hard';
    }
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    // Auto scale fix for some kindle versions
    setTimeout(function() {
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('resize'));
        } else {
            var resizeEvent = window.document.createEvent('UIEvents'); 
            resizeEvent.initUIEvent('resize', true, false, window, 0); 
            window.dispatchEvent(resizeEvent);
        }
    }, 100);

    resetGame();
}

function backToMenu() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function initBoard() {
    board = [];
    for (var r = 0; r < boardSizeRows; r++) {
        board[r] = [];
        for (var c = 0; c < boardSizeCols; c++) {
            board[r][c] = 0;
        }
    }
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (var r = 0; r < boardSizeRows; r++) {
        for (var c = 0; c < boardSizeCols; c++) {
            (function(row, col) {
                var cell = document.createElement('div');
                cell.className = 'connect4-cell';
                cell.id = 'c4-' + row + '-' + col;
                
                var token = document.createElement('div');
                token.className = 'connect4-token';
                token.id = 'c4-tk-' + row + '-' + col;
                if (board[row][col] === 1) {
                    token.className += ' player1';
                } else if (board[row][col] === 2) {
                    token.className += ' player2';
                }

                cell.appendChild(token);
                
                // Clicking a cell means playing in that column
                cell.onclick = function() {
                    handleColumnClick(col);
                };
                
                boardElement.appendChild(cell);
            })(r, c);
        }
    }
}

function getAvailableRow(col) {
    for (var r = boardSizeRows - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            return r;
        }
    }
    return -1;
}

function handleColumnClick(col) {
    if (!gameActive || isAIThinking) return;

    var row = getAvailableRow(col);
    if (row === -1) return; // Column full

    makeMove(row, col, currentPlayer);
}

function makeMove(row, col, player) {
    board[row][col] = player;
    
    // Update visual
    var token = document.getElementById('c4-tk-' + row + '-' + col);
    if (token) {
        token.className = 'connect4-token player' + player;
    }

    var winCoords = checkWin(board, player);
    if (winCoords) {
        gameActive = false;
        var p1WinsInfo = typeof getTranslation !== 'undefined' ? getTranslation('p1_wins') : 'Player 1 Wins!';
        var p2WinsInfo = typeof getTranslation !== 'undefined' ? getTranslation('p2_wins') : 'Player 2 Wins!';
        var cpuWinsInfo = typeof getTranslation !== 'undefined' ? getTranslation('cpu_wins') : 'CPU Wins!';
        
        if (player === 1) {
            statusMessage.innerText = p1WinsInfo;
            scores.player1++;
        } else {
            statusMessage.innerText = gameMode === 'pve' ? cpuWinsInfo : p2WinsInfo;
            scores.player2++;
        }
        updateScores();
        blinkWinner(winCoords);
        return;
    }

    if (checkDraw(board)) {
        gameActive = false;
        statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_draw') : 'Draw!';
        return;
    }

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatusMessage();

    if (gameMode === 'pve' && currentPlayer === 2 && gameActive) {
        isAIThinking = true;
        statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('cpu_turn') : 'CPU is thinking...';
        setTimeout(playAI, 300); // Small delay to let UI update
    }
}

function blinkWinner(coords) {
    var c = 0;
    var flash = setInterval(function() {
        if (c >= 6) {
            clearInterval(flash);
            return;
        }
        for (var i = 0; i < coords.length; i++) {
            var token = document.getElementById('c4-tk-' + coords[i].r + '-' + coords[i].c);
            if (token) {
                token.style.visibility = (c % 2 === 0) ? 'hidden' : 'visible';
            }
        }
        c++;
    }, 300);
}

function updateStatusMessage() {
    if (!gameActive) return;
    var p1Turn = typeof getTranslation !== 'undefined' ? getTranslation('turn_p1') : 'Player 1 Turn';
    var p2Turn = typeof getTranslation !== 'undefined' ? getTranslation('turn_p2') : 'Player 2 Turn';
    statusMessage.innerText = currentPlayer === 1 ? p1Turn : p2Turn;
}

function playAI() {
    var bestCol = -1;
    var depth = 1;

    if (aiDifficulty === 'easy') depth = 1;
    if (aiDifficulty === 'medium') depth = 3;
    if (aiDifficulty === 'hard') depth = 5;

    // Fast check for instant win or block
    var instantCol = findInstantWinOrBlock(board);
    if (instantCol !== -1 && getAvailableRow(instantCol) !== -1) {
        bestCol = instantCol;
    } else {
        // Run minimax
        // We clone the board state
        var boardCopy = copyBoard(board);
        var result = minimax(boardCopy, depth, -Infinity, Infinity, true);
        bestCol = result.col;
        
        // Fallback if minimax fails finding a forced move
        if (bestCol === -1 || getAvailableRow(bestCol) === -1) {
            var availableCols = [];
            for (var c = 0; c < boardSizeCols; c++) {
                if (getAvailableRow(c) !== -1) availableCols.push(c);
            }
            if (availableCols.length > 0) {
                bestCol = availableCols[Math.floor(Math.random() * availableCols.length)];
            }
        }
    }

    isAIThinking = false;
    if (bestCol !== -1) {
        var r = getAvailableRow(bestCol);
        if (r !== -1) {
            makeMove(r, bestCol, 2);
        }
    }
}

function copyBoard(b) {
    var nb = [];
    for (var i = 0; i < boardSizeRows; i++) {
        nb.push(b[i].slice());
    }
    return nb;
}

function findInstantWinOrBlock(b) {
    // Check if AI can win
    for (var c = 0; c < boardSizeCols; c++) {
        var r = getAvailableRowInCopied(b, c);
        if (r !== -1) {
            b[r][c] = 2;
            if (checkWin(b, 2)) {
                b[r][c] = 0;
                return c;
            }
            b[r][c] = 0;
        }
    }
    // Check if Player can win and block
    for (var c2 = 0; c2 < boardSizeCols; c2++) {
        var r2 = getAvailableRowInCopied(b, c2);
        if (r2 !== -1) {
            b[r2][c2] = 1;
            if (checkWin(b, 1)) {
                b[r2][c2] = 0;
                return c2;
            }
            b[r2][c2] = 0;
        }
    }
    return -1;
}

function getAvailableRowInCopied(b, col) {
    for (var r = boardSizeRows - 1; r >= 0; r--) {
        if (b[r][col] === 0) {
            return r;
        }
    }
    return -1;
}

// Very basic minimax for connect 4 structure
function minimax(b, depth, alpha, beta, isMaximizing) {
    var validLocations = [];
    for (var c = 0; c < boardSizeCols; c++) {
        if (getAvailableRowInCopied(b, c) !== -1) validLocations.push(c);
    }
    
    var winner = checkWin(b, 1) || checkWin(b, 2);
    var isTerminal = winner || validLocations.length === 0;
    
    if (depth === 0 || isTerminal) {
        if (isTerminal) {
            if (checkWin(b, 2)) return { score: 100000000000000, col: -1 };
            if (checkWin(b, 1)) return { score: -100000000000000, col: -1 };
            return { score: 0, col: -1 }; // Draw
        } else {
            return { score: evaluateBoard(b, 2), col: -1 };
        }
    }
    
    if (isMaximizing) {
        var value = -Infinity;
        var bestCol = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (var i = 0; i < validLocations.length; i++) {
            var col = validLocations[i];
            var row = getAvailableRowInCopied(b, col);
            
            var bCopy = copyBoard(b);
            bCopy[row][col] = 2;
            
            var newScore = minimax(bCopy, depth - 1, alpha, beta, false).score;
            if (newScore > value) {
                value = newScore;
                bestCol = col;
            }
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return { score: value, col: bestCol };
    } else {
        var value2 = Infinity;
        var bestCol2 = validLocations[Math.floor(Math.random() * validLocations.length)];
        for (var i2 = 0; i2 < validLocations.length; i2++) {
            var col2 = validLocations[i2];
            var row2 = getAvailableRowInCopied(b, col2);
            
            var bCopy2 = copyBoard(b);
            bCopy2[row2][col2] = 1;
            
            var newScore2 = minimax(bCopy2, depth - 1, alpha, beta, true).score;
            if (newScore2 < value2) {
                value2 = newScore2;
                bestCol2 = col2;
            }
            beta = Math.min(beta, value2);
            if (alpha >= beta) break;
        }
        return { score: value2, col: bestCol2 };
    }
}

function evaluateBoard(b, piece) {
    var score = 0;
    var oppPiece = piece === 1 ? 2 : 1;

    // Score center column
    var centerArray = [];
    var centerCol = Math.floor(boardSizeCols / 2);
    for (var r = 0; r < boardSizeRows; r++) {
        centerArray.push(b[r][centerCol]);
    }
    var centerCount = 0;
    for (var i=0; i<centerArray.length; i++) if(centerArray[i]===piece) centerCount++;
    score += centerCount * 3;

    // Horizontal
    for (var r = 0; r < boardSizeRows; r++) {
        for (var c = 0; c < boardSizeCols - 3; c++) {
            var windowArr = [b[r][c], b[r][c+1], b[r][c+2], b[r][c+3]];
            score += evaluateWindow(windowArr, piece, oppPiece);
        }
    }

    // Vertical
    for (var c = 0; c < boardSizeCols; c++) {
        for (var r = 0; r < boardSizeRows - 3; r++) {
            var windowArr = [b[r][c], b[r+1][c], b[r+2][c], b[r+3][c]];
            score += evaluateWindow(windowArr, piece, oppPiece);
        }
    }

    // Positive Diagonal
    for (var r = 0; r < boardSizeRows - 3; r++) {
        for (var c = 0; c < boardSizeCols - 3; c++) {
            var windowArr = [b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]];
            score += evaluateWindow(windowArr, piece, oppPiece);
        }
    }

    // Negative Diagonal
    for (var r = 0; r < boardSizeRows - 3; r++) {
        for (var c = 0; c < boardSizeCols - 3; c++) {
            var windowArr = [b[r+3][c], b[r+2][c+1], b[r+1][c+2], b[r][c+3]];
            score += evaluateWindow(windowArr, piece, oppPiece);
        }
    }

    return score;
}

function evaluateWindow(windowArr, piece, oppPiece) {
    var score = 0;
    var pCount = 0;
    var eCount = 0;
    var oCount = 0;
    for(var i=0; i<4; i++) {
        if(windowArr[i] === piece) pCount++;
        else if(windowArr[i] === oppPiece) oCount++;
        else eCount++;
    }

    if (pCount === 4) {
        score += 100;
    } else if (pCount === 3 && eCount === 1) {
        score += 5;
    } else if (pCount === 2 && eCount === 2) {
        score += 2;
    }

    if (oCount === 3 && eCount === 1) {
        score -= 4;
    }

    return score;
}

function checkWin(b, player) {
    // horizontal
    for (var c = 0; c < boardSizeCols - 3; c++) {
        for (var r = 0; r < boardSizeRows; r++) {
            if (b[r][c] === player && b[r][c+1] === player && b[r][c+2] === player && b[r][c+3] === player) {
                return [{r:r, c:c}, {r:r, c:c+1}, {r:r, c:c+2}, {r:r, c:c+3}];
            }
        }
    }
    // vertical
    for (var c = 0; c < boardSizeCols; c++) {
        for (var r = 0; r < boardSizeRows - 3; r++) {
            if (b[r][c] === player && b[r+1][c] === player && b[r+2][c] === player && b[r+3][c] === player) {
                return [{r:r, c:c}, {r:r+1, c:c}, {r:r+2, c:c}, {r:r+3, c:c}];
            }
        }
    }
    // diagonal positive
    for (var c = 0; c < boardSizeCols - 3; c++) {
        for (var r = 0; r < boardSizeRows - 3; r++) {
            if (b[r][c] === player && b[r+1][c+1] === player && b[r+2][c+2] === player && b[r+3][c+3] === player) {
                return [{r:r, c:c}, {r:r+1, c:c+1}, {r:r+2, c:c+2}, {r:r+3, c:c+3}];
            }
        }
    }
    // diagonal negative
    for (var c = 0; c < boardSizeCols - 3; c++) {
        for (var r = 3; r < boardSizeRows; r++) {
            if (b[r][c] === player && b[r-1][c+1] === player && b[r-2][c+2] === player && b[r-3][c+3] === player) {
                return [{r:r, c:c}, {r:r-1, c:c+1}, {r:r-2, c:c+2}, {r:r-3, c:c+3}];
            }
        }
    }
    return null;
}

function checkDraw(b) {
    for (var c = 0; c < boardSizeCols; c++) {
        if (b[0][c] === 0) return false;
    }
    return true;
}

function loadScores() {
    var stored1 = localStorage.getItem('c4_score1');
    var stored2 = localStorage.getItem('c4_score2');
    if (stored1) scores.player1 = parseInt(stored1, 10);
    if (stored2) scores.player2 = parseInt(stored2, 10);
    updateScores();
}

function saveScores() {
    localStorage.setItem('c4_score1', scores.player1);
    localStorage.setItem('c4_score2', scores.player2);
}

function updateScores() {
    score1Element.innerText = scores.player1;
    score2Element.innerText = scores.player2;
    saveScores();
}

function handleResetScore() {
    document.getElementById('reset-modal').style.display = 'block';
}

function confirmReset(confirm) {
    if (confirm) {
        scores = { player1: 0, player2: 0 };
        updateScores();
    }
    document.getElementById('reset-modal').style.display = 'none';
}

function resetGame() {
    initBoard();
    renderBoard();
    currentPlayer = 1;
    gameActive = true;
    isAIThinking = false;
    updateStatusMessage();
}

document.addEventListener('DOMContentLoaded', initSetup);
