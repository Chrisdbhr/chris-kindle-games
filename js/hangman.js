var wordElement = document.getElementById('hangman-word');
var drawingElement = document.getElementById('hangman-drawing');
var kbElement = document.getElementById('hangman-kb');
var statusMessage = document.getElementById('status-message');

var gameActive = false;
var mistakes = 0;
var maxMistakes = 6;
var currentWord = '';
var guessedLetters = [];
var winInterval = null;
var currentDifficulty = 'easy';

var drawings = [
    "\n\n\n\n\n======",
    "  |\n  |\n  |\n  |\n  |\n======",
    "  ____\n  |\n  |\n  |\n  |\n======",
    "  ____\n  |   O\n  |\n  |\n  |\n======",
    "  ____\n  |   O\n  |   |\n  |\n  |\n======",
    "  ____\n  |   O\n  |  /|\\\n  |\n  |\n======",
    "  ____\n  |   O\n  |  /|\\\n  |  / \\\n  |\n======"
];

var winFrames = [
    " \n   \\O/\n    |\n   / \\\n \n======",
    " \n   _O_\n    |\n   / \\\n \n======"
];

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
    var btnEasy = document.getElementById('btn-hm-easy');
    var btnMed = document.getElementById('btn-hm-med');
    var btnHard = document.getElementById('btn-hm-hard');
    
    if (btnEasy) {
        btnEasy.style.backgroundColor = currentDifficulty === 'easy' ? 'black' : 'white';
        btnEasy.style.color = currentDifficulty === 'easy' ? 'white' : 'black';
        btnMed.style.backgroundColor = currentDifficulty === 'medium' ? 'black' : 'white';
        btnMed.style.color = currentDifficulty === 'medium' ? 'white' : 'black';
        btnHard.style.backgroundColor = currentDifficulty === 'hard' ? 'black' : 'white';
        btnHard.style.color = currentDifficulty === 'hard' ? 'white' : 'black';
    }
    
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

function resetGame() {
    if (winInterval) {
        clearInterval(winInterval);
        winInterval = null;
    }
    
    drawingElement.style.backgroundColor = '';
    drawingElement.style.color = '';
    
    var wordKey = currentDifficulty === 'easy' ? 'words_short' : (currentDifficulty === 'medium' ? 'words_medium' : 'words_long');
    var words = typeof getTranslation !== 'undefined' ? getTranslation(wordKey) : null;
    
    if (!words || !words.length || typeof words === 'string') {
        if (typeof words === 'string' && words.indexOf('words_') > -1) {
            // Translations loading
            setTimeout(resetGame, 200);
            return;
        }
        words = ['KINDLE', 'BATTERY', 'BOOK', 'SCREEN', 'PAGE', 'CAT'];
    }
    
    currentWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
    guessedLetters = [];
    mistakes = 0;
    gameActive = true;
    statusMessage.innerText = '';
    
    renderWord();
    renderDrawing();
    renderKeyboard();
}

function renderWord() {
    var htmlDisplay = '';
    var hasMissing = false;
    
    var isGameOver = (!gameActive && mistakes >= maxMistakes);
    
    for (var i = 0; i < currentWord.length; i++) {
        var letter = currentWord[i];
        if (guessedLetters.indexOf(letter) > -1) {
            htmlDisplay += letter;
        } else {
            hasMissing = true;
            if (isGameOver) {
                htmlDisplay += '<span style="color:#aaa;">' + letter + '</span>';
            } else {
                htmlDisplay += '_';
            }
        }
        htmlDisplay += ' ';
    }
    
    wordElement.innerHTML = htmlDisplay;
    
    if (!hasMissing && gameActive) {
        gameActive = false;
        statusMessage.innerText = typeof getTranslation !== 'undefined' ? getTranslation('status_win') : 'You Won!';
        playWinAnimation();
    }
}

function playWinAnimation() {
    var frame = 0;
    winInterval = setInterval(function() {
        drawingElement.innerText = winFrames[frame % 2];
        frame++;
    }, 400); // 400ms handles the e-ink refresh smoothly
}

function renderDrawing() {
    if (!winInterval) {
        drawingElement.innerText = drawings[mistakes];
    }
}

function renderKeyboard() {
    kbElement.innerHTML = '';
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (var i = 0; i < letters.length; i++) {
        (function(index) {
            var letter = letters[index];
            var btn = document.createElement('button');
            btn.className = 'btn';
            btn.innerText = letter;
            
            btn.onclick = function() {
                handleGuess(letter, btn);
            };
            
            kbElement.appendChild(btn);
        })(i);
    }
    
    var clearfix = document.createElement('div');
    clearfix.className = 'clearfix';
    kbElement.appendChild(clearfix);
}

function handleGuess(letter, btnNode) {
    if (!gameActive) return;
    
    // Ghosting fix + visual disable state
    btnNode.className += ' used';
    
    if (currentWord.indexOf(letter) > -1) {
        guessedLetters.push(letter);
        renderWord();
    } else {
        mistakes++;
        if (mistakes >= maxMistakes) {
            gameActive = false;
            drawingElement.style.backgroundColor = 'black';
            drawingElement.style.color = 'white';
            renderWord(); // Re-render forces HTML tags with missing letters shown 
            statusMessage.innerText = (typeof getTranslation !== 'undefined' ? getTranslation('status_lose') : 'You Lost!');
        }
        renderDrawing();
    }
}

document.addEventListener('DOMContentLoaded', initGame);
