var boardElement = document.getElementById('sudoku-board');
var statusMessage = document.getElementById('status-message');
var btnEasy = document.getElementById('btn-easy');
var btnMed = document.getElementById('btn-med');
var btnHard = document.getElementById('btn-hard');

var board = [];
var solution = [];
var selectedCellIndex = null;
var currentDifficulty = 'easy';

// Difficulty settings (# of empty cells)
var difficulties = {
    easy: 25,
    medium: 50,
    hard: 60
};

function initGame() {
    window.addEventListener('langChanged', function() {
        if (document.getElementById('setup-screen').style.display !== 'none') {
            setDiffAndUI(currentDifficulty);
        }
    });
    // Wait for lang load
    setTimeout(function() {
        setDiffAndUI('easy');
    }, 100);
}

function setDiffAndUI(level) {
    currentDifficulty = level;
    btnEasy.style.backgroundColor = currentDifficulty === 'easy' ? 'black' : 'white';
    btnEasy.style.color = currentDifficulty === 'easy' ? 'white' : 'black';
    btnMed.style.backgroundColor = currentDifficulty === 'medium' ? 'black' : 'white';
    btnMed.style.color = currentDifficulty === 'medium' ? 'white' : 'black';
    btnHard.style.backgroundColor = currentDifficulty === 'hard' ? 'black' : 'white';
    btnHard.style.color = currentDifficulty === 'hard' ? 'white' : 'black';
    
    var descText = document.getElementById('diff-desc-text');
    if (descText) {
        if (currentDifficulty === 'easy') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_easy_desc') : 'Easy';
        if (currentDifficulty === 'medium') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_med_desc') : 'Medium';
        if (currentDifficulty === 'hard') descText.innerText = typeof getTranslation !== 'undefined' ? getTranslation('diff_hard_desc') : 'Hard';
    }
}

function startGame() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    generateNewGame();
}


function generateNewGame() {
    statusMessage.innerText = '';
    selectedCellIndex = null;
    
    // 1. Generate full valid board
    solution = [];
    for (var i = 0; i < 81; i++) solution.push(0);
    fillBoard(solution);
    
    // 2. Remove cells based on difficulty
    board = solution.slice();
    var cellsToRemove = difficulties[currentDifficulty];
    
    while (cellsToRemove > 0) {
        var randIndex = Math.floor(Math.random() * 81);
        if (board[randIndex] !== 0) {
            board[randIndex] = 0;
            cellsToRemove--;
        }
    }
    
    renderBoard();
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (var i = 0; i < 81; i++) {
        (function(index) {
            var cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            
            var row = Math.floor(index / 9);
            var col = index % 9;
            
            if (col % 3 === 2 && col !== 8) {
                cell.className += ' border-right';
            }
            if (row % 3 === 2 && row !== 8) {
                cell.className += ' border-bottom';
            }
            
            if (board[index] !== 0) {
                cell.innerText = board[index];
                cell.className += ' given';
            } else {
                cell.innerHTML = '<span style="visibility:hidden">0</span>';
                cell.onclick = function() { selectCell(index); };
            }
            
            cell.id = 'cell-' + index;
            boardElement.appendChild(cell);
            
            // Force line break every 9 cells to solve Kindle padding/border collapse
            if ((index + 1) % 9 === 0) {
                var br = document.createElement('div');
                br.className = 'clearfix';
                boardElement.appendChild(br);
            }
        })(i);
    }
    
    var clearfix = document.createElement('div');
    clearfix.className = 'clearfix';
    boardElement.appendChild(clearfix);
}

function selectCell(index) {
    var targetCell = document.getElementById('cell-' + index);
    // Cannot select given cells
    if (targetCell.className.indexOf('given') > -1) return;
    
    if (selectedCellIndex !== null) {
        var prevCell = document.getElementById('cell-' + selectedCellIndex);
        if (prevCell) {
            prevCell.className = prevCell.className.replace(' selected', '');
        }
    }
    
    selectedCellIndex = index;
    targetCell.className += ' selected';
}

function handleNumPad(num) {
    if (selectedCellIndex === null) return;
    
    var cell = document.getElementById('cell-' + selectedCellIndex);
    if (num === 0) {
        cell.innerHTML = '<span style="visibility:hidden">0</span>';
        board[selectedCellIndex] = 0;
    } else {
        cell.innerText = num;
        board[selectedCellIndex] = num;
    }
    
    // E-ink Ghosting Flash sequence
    // Instantly hide the new text in a pure white square (forces kindle to cleanse the sub-pixel gray ghost of the selection frame)
    cell.style.backgroundColor = 'white';
    cell.style.color = 'white'; 
    
    // Afterwards, restore regular colors
    setTimeout(function() {
        cell.className = cell.className.replace(' selected', '');
        cell.style.backgroundColor = '';
        cell.style.color = '';
    }, 250); // Gives WebKit hardware time to paint the pure white frame
    
    var lastIndex = selectedCellIndex;
    selectedCellIndex = null;
    
    checkPartialCompletion(lastIndex);
    checkWinCondition();
}

function checkPartialCompletion(index) {
    var row = Math.floor(index / 9);
    var col = index % 9;
    var blockRow = Math.floor(row / 3) * 3;
    var blockCol = Math.floor(col / 3) * 3;

    var rowIndices = [];
    var colIndices = [];
    var blockIndices = [];

    for (var i = 0; i < 9; i++) {
        rowIndices.push(row * 9 + i);
        colIndices.push(i * 9 + col);
        blockIndices.push((blockRow + Math.floor(i / 3)) * 9 + (blockCol + i % 3));
    }

    checkGroup(rowIndices, false);
    checkGroup(colIndices, false);
    checkGroup(blockIndices, true);
}

function checkGroup(indices, isBlock) {
    var full = true;
    var correct = true;
    for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        if (board[idx] === 0) {
            full = false;
            break;
        }
        if (board[idx] !== solution[idx]) {
            correct = false;
        }
    }

    if (full && correct) {
        flashGroup(indices, isBlock);
    }
}

function flashGroup(indices, isBlock) {
    for (var i = 0; i < indices.length; i++) {
        (function(idx) {
            var cell = document.getElementById('cell-' + idx);
            if (!cell) return;
            
            // Apply a rapid high-contrast flash compatible with E-ink
            cell.className += ' victory-flash';
            setTimeout(function() {
                cell.className = cell.className.replace(' victory-flash', '');
                if (isBlock) {
                    cell.className += ' block-completed';
                }
            }, 1200);
        })(indices[i]);
    }
}

function checkWinCondition() {
    // Check if there are no empty cells and all match
    var isFull = true;
    var isWin = true;
    
    for (var i = 0; i < 81; i++) {
        var cellVal = board[i];
        if (cellVal === 0) {
            isFull = false;
            break;
        }
        if (cellVal !== solution[i]) {
            isWin = false;
        }
    }
    
    if (isFull) {
        if (isWin) {
            statusMessage.innerText = getTranslation('sudoku_win');
            selectedCellIndex = null;
            // Unselect all
            for (var j = 0; j < 81; j++) {
                var c = document.getElementById('cell-' + j);
                if (c) c.className = c.className.replace(' selected', '');
            }
        } else {
            // Error handling ignored for E-ink
        }
    }
}

// Sudoku Generator Logic
function isValid(boardArray, row, col, num) {
    for (var x = 0; x <= 8; x++) {
        if (boardArray[row * 9 + x] === num) return false;
        if (boardArray[x * 9 + col] === num) return false;
    }
    var startRow = row - row % 3, startCol = col - col % 3;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (boardArray[(i + startRow) * 9 + (j + startCol)] === num) return false;
        }
    }
    return true;
}

function fillBoard(boardArray) {
    for (var i = 0; i < 81; i++) {
        if (boardArray[i] === 0) {
            var row = Math.floor(i / 9);
            var col = i % 9;
            
            // Randomize order of numbers 1-9
            var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            numbers.sort(function() { return Math.random() - 0.5; });
            
            for (var k = 0; k < numbers.length; k++) {
                var num = numbers[k];
                if (isValid(boardArray, row, col, num)) {
                    boardArray[i] = num;
                    if (fillBoard(boardArray)) {
                        return true;
                    }
                    boardArray[i] = 0;
                }
            }
            return false;
        }
    }
    return true;
}

document.addEventListener('DOMContentLoaded', initGame);
