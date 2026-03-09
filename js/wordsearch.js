var boardElement = document.getElementById('wordsearch-board');
var listElement = document.getElementById('wordsearch-list');
var statusMessage = document.getElementById('status-message');

var gameActive = false;
var boardSize = 10;
var board = []; // 100 chars
var wordsToFind = [];
var foundWordsCount = 0;
var firstClick = null;
var placedWordsCoords = {}; // word -> array of indexes

var currentDifficulty = 'easy';
var diffTargetWordCount = {
    easy: 4,
    medium: 6,
    hard: 8
};

var btnEasy = document.getElementById('btn-ws-easy');
var btnMed = document.getElementById('btn-ws-med');
var btnHard = document.getElementById('btn-ws-hard');

function initGame() {
    window.addEventListener('langChanged', function() {
        if (document.getElementById('setup-screen').style.display !== 'none') {
            setDiffAndUI(currentDifficulty);
        }
    });
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
    resetGame();
}

function backToMenu() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function getShuffledList(key) {
    var raw = typeof getTranslation !== 'undefined' ? getTranslation(key) : null;
    if (!raw || !raw.length || typeof raw === 'string') {
        if (key === 'words_short') return ['CAT', 'DOG'];
        if (key === 'words_medium') return ['APPLE', 'HOUSE'];
        return ['COMPUTER', 'INTERNET'];
    }
    var list = raw.slice();
    for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
}

function resetGame() {    
    var wShort = getShuffledList('words_short');
    var wMed = getShuffledList('words_medium');
    var wLong = getShuffledList('words_long');
    
    wordsToFind = [];
    if (currentDifficulty === 'easy') {
        boardSize = 7;
        wordsToFind = wShort.slice(0, 3);
    } else if (currentDifficulty === 'medium') {
        boardSize = 10;
        wordsToFind = wShort.slice(0, 2).concat(wMed.slice(0, 3)).concat(wLong.slice(0, 1));
    } else {
        boardSize = 13;
        wordsToFind = wShort.slice(0, 3).concat(wMed.slice(0, 4)).concat(wLong.slice(0, 3));
    }

    foundWordsCount = 0;
    firstClick = null;
    placedWordsCoords = {};
    gameActive = true;
    
    // Initial instruction message
    statusMessage.innerText = 'Escolha a primeira letra da palavra encontrada';
    
    generateGrid();
    renderBoard();
    renderList();
}

function generateGrid() {
    board = [];
    var totalCells = boardSize * boardSize;
    for (var i = 0; i < totalCells; i++) board.push('');
    
    var dirs;
    if (currentDifficulty === 'easy') {
        dirs = [[0, 1], [1, 0]]; // Right, Down
    } else if (currentDifficulty === 'medium') {
        dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]]; // Right, Down, Diagonal Down-Right, Diagonal Up-Right
    } else {
        dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // All 8 directions
    }
    
    for (var w = 0; w < wordsToFind.length; w++) {
        var word = wordsToFind[w];
        var placed = false;
        var attempts = 0;
        
        while (!placed && attempts < 500) {
            attempts++;
            var dir = dirs[Math.floor(Math.random() * dirs.length)];
            var row = Math.floor(Math.random() * boardSize);
            var col = Math.floor(Math.random() * boardSize);
            var endRow = row + dir[0] * (word.length - 1);
            var endCol = col + dir[1] * (word.length - 1);
            
            if (endRow >= 0 && endRow < boardSize && endCol >= 0 && endCol < boardSize) {
                var canPlace = true;
                for (var l = 0; l < word.length; l++) {
                    var r = row + dir[0] * l;
                    var c = col + dir[1] * l;
                    var idx = r * boardSize + c;
                    if (board[idx] !== '' && board[idx] !== word[l]) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    var coords = [];
                    for (var l2 = 0; l2 < word.length; l2++) {
                        var r2 = row + dir[0] * l2;
                        var c2 = col + dir[1] * l2;
                        board[r2 * boardSize + c2] = word[l2];
                        coords.push(r2 * boardSize + c2);
                    }
                    placedWordsCoords[word] = coords;
                    placed = true;
                }
            }
        }
    }
    
    // Fill empty spots with random letters
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var k = 0; k < totalCells; k++) {
        if (board[k] === '') {
            board[k] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
    }
}

function renderList() {
    listElement.innerHTML = '';
    for (var i = 0; i < wordsToFind.length; i++) {
        var span = document.createElement('span');
        span.innerText = wordsToFind[i];
        span.id = 'word-tag-' + wordsToFind[i];
        listElement.appendChild(span);
    }
}

function renderBoard() {
    boardElement.innerHTML = '';
    // CSS uses width: 30px + margin: 0 1px 1px 0 = 31px
    // Board padding left 1px + borders
    // Exact width should be (boardSize * 31) + 1px for the padding.
    // Adding minimal leeway to prevent sub-pixel rounding drops.
    boardElement.style.width = ((boardSize * 31) + 1) + 'px';
    
    var totalCells = boardSize * boardSize;
    for (var i = 0; i < totalCells; i++) {
        (function(index) {
            var cell = document.createElement('div');
            cell.className = 'wordsearch-cell';
            cell.id = 'ws-cell-' + index;
            cell.innerText = board[index];
            
            cell.onclick = function() { handleCellClick(index); };
            boardElement.appendChild(cell);
            
            if ((index + 1) % boardSize === 0) {
                var br = document.createElement('div');
                br.className = 'clearfix';
                boardElement.appendChild(br);
            }
        })(i);
    }
}

function handleCellClick(index) {
    if (!gameActive) return;
    
    var cell = document.getElementById('ws-cell-' + index);
    
    // We REMOVE the check `if (cell.className.indexOf('found') > -1) return;` 
    // to allow overlapping words! A cell that is part of a found word 
    // CAN be used to find a crossing word.
    
    // However, we must temporarily highlight it if it's the first click.
    var wasFound = cell.className.indexOf('found') > -1;

    if (firstClick === null) {
        firstClick = index;
        cell.style.backgroundColor = 'black';
        cell.style.color = 'white';
        statusMessage.innerText = 'Agora selecione a ultima letra da palavra encontrada';
        
        statusMessage.style.backgroundColor = 'black';
        statusMessage.style.color = 'white';
        setTimeout(function() {
            statusMessage.style.backgroundColor = 'white';
            statusMessage.style.color = 'black';
        }, 200);

    } else {
        var matchedWord = null;
        var secondClick = index;
        
        // Find if these two endpoints match any word
        for (var w = 0; w < wordsToFind.length; w++) {
            var word = wordsToFind[w];
            var coords = placedWordsCoords[word];
            if (coords) {
                if ((coords[0] === firstClick && coords[coords.length - 1] === secondClick) ||
                    (coords[0] === secondClick && coords[coords.length - 1] === firstClick)) {
                    matchedWord = word;
                    break;
                }
            }
        }
        
        var firstCell = document.getElementById('ws-cell-' + firstClick);
        if (matchedWord) {
            var wCoords = placedWordsCoords[matchedWord];
            for (var c = 0; c < wCoords.length; c++) {
                var cNode = document.getElementById('ws-cell-' + wCoords[c]);
                cNode.style.backgroundColor = '';
                cNode.style.color = '';
                if (cNode.className.indexOf('found') === -1) {
                    cNode.className += ' found';
                }
            }
            document.getElementById('word-tag-' + matchedWord).className = 'found-word';
            placedWordsCoords[matchedWord] = null; // Mark as found
            foundWordsCount++;
            
            if (foundWordsCount === wordsToFind.length) {
                gameActive = false;
                statusMessage.style.backgroundColor = '';
                statusMessage.style.color = '';
                statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_win') : 'You Won!';
                triggerWinAnimation();
            } else {
                statusMessage.innerText = matchedWord + ' encontrada!';
                statusMessage.style.backgroundColor = 'black';
                statusMessage.style.color = 'white';
                setTimeout(function() {
                    statusMessage.style.backgroundColor = 'white';
                    statusMessage.style.color = 'black';
                    if (gameActive) {
                        statusMessage.innerText = 'Escolha a primeira letra da palavra encontrada';
                    }
                }, 1500);
            }
        } else {
            // Wrong selection - revert first cell if it wasn't already part of a found word
            if (wasFound) {
                // If the first cell *was* originally found, returning it to '' will strip inline styles 
                // and the CSS `.wordsearch-cell.found` will take over again, making it black/white.
                firstCell.style.backgroundColor = '';
                firstCell.style.color = '';
            } else {
                firstCell.style.backgroundColor = 'white';
                firstCell.style.color = 'white';
                setTimeout(function() {
                    firstCell.style.backgroundColor = '';
                    firstCell.style.color = '';
                }, 200);
            }
            
            statusMessage.innerText = 'Você deve selecionar a primeira e a ultima letra da palavra encontrada';
            statusMessage.style.backgroundColor = 'black';
            statusMessage.style.color = 'white';
            setTimeout(function() {
                statusMessage.style.backgroundColor = 'white';
                statusMessage.style.color = 'black';
            }, 600);
        }
        
        firstClick = null;
    }
}

function triggerWinAnimation() {
    var totalCells = boardSize * boardSize;
    var nonFoundIndices = [];
    
    for (var i = 0; i < totalCells; i++) {
        var cell = document.getElementById('ws-cell-' + i);
        if (cell && cell.className.indexOf('found') === -1) {
            nonFoundIndices.push(i);
        }
    }
    
    // Shuffle the nonFoundIndices array
    for (var j = nonFoundIndices.length - 1; j > 0; j--) {
        var rand = Math.floor(Math.random() * (j + 1));
        var temp = nonFoundIndices[j];
        nonFoundIndices[j] = nonFoundIndices[rand];
        nonFoundIndices[rand] = temp;
    }
    
    var idx = 0;
    var timer = setInterval(function() {
        if (idx >= nonFoundIndices.length) {
            clearInterval(timer);
            return;
        }
        (function(targetIdx) {
            var targetCell = document.getElementById('ws-cell-' + nonFoundIndices[targetIdx]);
            if (targetCell) {
                // Step A: Turn gray
                targetCell.style.color = '#ccc';
                
                // Step B: Clear after 500ms
                setTimeout(function() {
                    targetCell.innerText = '';
                    targetCell.style.color = '';
                }, 500);
            }
        })(idx);
        idx++;
    }, 1000); // 1 second interval between letters for E-ink friendliness
}

document.addEventListener('DOMContentLoaded', initGame);
