var boardElement = document.getElementById('board');
var statusMessage = document.getElementById('status-message');
var scoreXElement = document.getElementById('score-x');
var scoreOElement = document.getElementById('score-o');
var scoreTiesElement = document.getElementById('score-ties');
var btnPvp = document.getElementById('btn-pvp');
var btnPve = document.getElementById('btn-pve');
var labelScoreO = document.getElementById('label-score-o');

var boardState = ['', '', '', '', '', '', '', '', ''];
var currentPlayer = 'X';
var gameActive = true;
var mode = 'pve'; // 'pvp' or 'pve'
var difficulty = 'easy';
var scores = { X: 0, O: 0, ties: 0 };

var winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function initGame() {
    loadScores();
    updateModeUI();
    resetGame();
    
    window.addEventListener('langChanged', function() {
        updateStatusMessage();
        updateModeUI();
        updateDiffUI();
    });
    
    setTimeout(function() {
        setMode('pve');
        setDifficulty('easy');
    }, 100);
}

function loadScores() {
    var savedScores = localStorage.getItem('tictactoe_scores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
    updateScoreUI();
}

function saveScores() {
    localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
}

function setMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    updateModeUI();
    resetGame();
}

function updateModeUI() {
    if (mode === 'pvp') {
        btnPvp.style.backgroundColor = 'black';
        btnPvp.style.color = 'white';
        btnPve.style.backgroundColor = 'white';
        btnPve.style.color = 'black';
        labelScoreO.innerText = getTranslation('score_p2');
        document.getElementById('difficulty-selector').style.display = 'none';
        
        var descText = document.getElementById('diff-desc-text');
        if (descText) descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('desc_tt_pvp') : 'PvP';
    } else {
        btnPve.style.backgroundColor = 'black';
        btnPve.style.color = 'white';
        btnPvp.style.backgroundColor = 'white';
        btnPvp.style.color = 'black';
        labelScoreO.innerText = getTranslation('score_ai');
        document.getElementById('difficulty-selector').style.display = 'block';
        updateDiffUI();
    }
}

function setDifficulty(level) {
    difficulty = level;
    updateDiffUI();
}

function updateDiffUI() {
    if (mode === 'pvp') return;
    
    var btnEasy = document.getElementById('btn-tt-easy');
    var btnMed = document.getElementById('btn-tt-med');
    var btnHard = document.getElementById('btn-tt-hard');
    
    if (btnEasy) {
        btnEasy.style.backgroundColor = difficulty === 'easy' ? 'black' : 'white';
        btnEasy.style.color = difficulty === 'easy' ? 'white' : 'black';
        btnMed.style.backgroundColor = difficulty === 'medium' ? 'black' : 'white';
        btnMed.style.color = difficulty === 'medium' ? 'white' : 'black';
        btnHard.style.backgroundColor = difficulty === 'hard' ? 'black' : 'white';
        btnHard.style.color = difficulty === 'hard' ? 'white' : 'black';
    }
    
    var descText = document.getElementById('diff-desc-text');
    if (descText) {
        if (difficulty === 'easy') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_easy_desc') : 'Easy';
        if (difficulty === 'medium') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_med_desc') : 'Medium';
        if (difficulty === 'hard') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_hard_desc') : 'Hard';
    }
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    // We already do this via resetGame called inside setMode, but ensure freshness:
    resetGame();
}

function backToMenu() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function handleCellClick(cellIndex) {
    if (boardState[cellIndex] !== '' || !gameActive) {
        return;
    }

    if (mode === 'pve' && currentPlayer === 'O') {
        return; // Ignoring clicks while AI is playing
    }

    makeMove(cellIndex, currentPlayer);

    if (gameActive && mode === 'pve' && currentPlayer === 'O') {
        statusMessage.innerText = getTranslation('turn_ai');
        // AI makes a move after a delay, allows Kindle to redraw if needed
        setTimeout(makeAIMove, 100); 
    }
}

function makeMove(index, player) {
    boardState[index] = player;
    var cell = document.getElementById('cell-' + index);
    if (cell) {
        cell.innerHTML = player;
    }
    
    checkResult();
    
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatusMessage();
    }
}

function updateStatusMessage() {
    if (!gameActive) return;
    if (currentPlayer === 'X') {
        statusMessage.innerText = getTranslation('turn_x');
    } else {
        if (mode === 'pve') {
            statusMessage.innerText = getTranslation('turn_ai');
        } else {
            statusMessage.innerText = getTranslation('turn_o');
        }
    }
}

function checkResult() {
    var roundWon = false;

    for (var i = 0; i < winningConditions.length; i++) {
        var a = winningConditions[i][0];
        var b = winningConditions[i][1];
        var c = winningConditions[i][2];
        
        if (boardState[a] !== '' && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        if (currentPlayer === 'X') {
            statusMessage.innerText = getTranslation('win_x');
        } else {
            if (mode === 'pve') {
                statusMessage.innerText = getTranslation('win_ai');
            } else {
                statusMessage.innerText = getTranslation('win_o');
            }
        }
        scores[currentPlayer]++;
        saveScores();
        updateScoreUI();
        gameActive = false;
        
        var cellA = document.getElementById('cell-' + a);
        var cellB = document.getElementById('cell-' + b);
        var cellC = document.getElementById('cell-' + c);
        
        if (cellA && cellB && cellC) {
            var blinkCount = 0;
            var intervalId = setInterval(function() {
                if (blinkCount % 2 === 0) {
                    cellA.style.backgroundColor = 'black';
                    cellA.style.color = 'white';
                    cellB.style.backgroundColor = 'black';
                    cellB.style.color = 'white';
                    cellC.style.backgroundColor = 'black';
                    cellC.style.color = 'white';
                } else {
                    cellA.style.backgroundColor = 'white';
                    cellA.style.color = 'black';
                    cellB.style.backgroundColor = 'white';
                    cellB.style.color = 'black';
                    cellC.style.backgroundColor = 'white';
                    cellC.style.color = 'black';
                }
                blinkCount++;
                if (blinkCount >= 6) {
                    clearInterval(intervalId);
                    // Ensure final state looks normal
                    cellA.style.backgroundColor = '';
                    cellA.style.color = '';
                    cellB.style.backgroundColor = '';
                    cellB.style.color = '';
                    cellC.style.backgroundColor = '';
                    cellC.style.color = '';
                }
            }, 300); // Slower refresh for e-ink
        }
        
        return;
    }

    var isDraw = true;
    for (var j = 0; j < boardState.length; j++) {
        if (boardState[j] === '') {
            isDraw = false;
            break;
        }
    }

    if (isDraw) {
        statusMessage.innerText = getTranslation('draw');
        scores.ties++;
        saveScores();
        updateScoreUI();
        gameActive = false;
        return;
    }
}

function updateScoreUI() {
    scoreXElement.innerText = scores.X;
    scoreOElement.innerText = scores.O;
    scoreTiesElement.innerText = scores.ties;
}

function resetGame() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    
    boardElement.innerHTML = '';
    for (var i = 0; i < 9; i++) {
        (function(index) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + index;
            cell.innerHTML = '<span style="visibility:hidden">X</span>';
            
            cell.onclick = function() { handleCellClick(index); };
            boardElement.appendChild(cell);
            
            if ((index + 1) % 3 === 0) {
                var br = document.createElement('div');
                br.className = 'clearfix';
                boardElement.appendChild(br);
            }
        })(i);
    }
    
    // Give lang system slightly time to be ready or call directly
    setTimeout(updateStatusMessage, 50); 
}

function handleResetScore() {
    document.getElementById('reset-modal').style.display = 'block';
}

function confirmReset(isYes) {
    if (isYes) {
        scores = { X: 0, O: 0, ties: 0 };
        saveScores();
        updateScoreUI();
    }
    document.getElementById('reset-modal').style.display = 'none';
}

function makeAIMove() {
    if (!gameActive) return;

    var move = null;
    var emptyIndexes = [];
    
    for (var j = 0; j < 9; j++) {
        if (boardState[j] === '') emptyIndexes.push(j);
    }
    
    if (emptyIndexes.length === 0) return;

    if (difficulty === 'easy') {
        // purely random
        move = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    } else if (difficulty === 'medium') {
        // 40% chance of random, 60% chance of perfect Minimax
        if (Math.random() < 0.4) {
            move = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
        } else {
            move = getBestMoveMinimax();
        }
    } else {
        // 99% Minimax, 1% chance of a random move to keep it interesting
        if (Math.random() < 0.01) {
            move = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
        } else {
            move = getBestMoveMinimax();
        }
    }

    if (move !== null) {
        makeMove(move, 'O');
    }
}

function getBestMoveMinimax() {
    var bestScore = -Infinity;
    var move = null;
    
    for (var i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = 'O';
            var score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    var result = checkWinnerForMinimax(board);
    if (result !== null) {
        if (result === 'O') return 10 - depth;
        if (result === 'X') return depth - 10;
        if (result === 'draw') return 0;
    }

    if (isMaximizing) {
        var bestScore = -Infinity;
        for (var i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                var score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        var bestScoreMin = Infinity;
        for (var j = 0; j < 9; j++) {
            if (board[j] === '') {
                board[j] = 'X';
                var scoreMin = minimax(board, depth + 1, true);
                board[j] = '';
                bestScoreMin = Math.min(scoreMin, bestScoreMin);
            }
        }
        return bestScoreMin;
    }
}

function checkWinnerForMinimax(board) {
    for (var i = 0; i < winningConditions.length; i++) {
        var a = winningConditions[i][0];
        var b = winningConditions[i][1];
        var c = winningConditions[i][2];
        if (board[a] !== '' && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 'X' or 'O'
        }
    }
    
    var isDraw = true;
    for (var j = 0; j < board.length; j++) {
        if (board[j] === '') {
            isDraw = false;
            break;
        }
    }
    if (isDraw) return 'draw';
    
    return null;
}

// Run init when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
