var boardElement = document.getElementById('memory-board');
var statusMessage = document.getElementById('status-message');
var scoreMovesElement = document.getElementById('score-moves');

var cards = [];
var flippedCards = [];
var matchedPairs = 0;
var moves = 0;
var gameActive = false;
var lockBoard = false;
var currentDifficulty = 'easy';

// Diff config mappings. Alphabet has 26 letters. 
var difficultyPairs = {
    easy: 4,   // 8 pairable cards + 1 joker = 9 cards -> 3 rows of 3
    medium: 6, // 12 cards -> 3 rows of 4
    hard: 8    // 16 cards -> 4 rows of 4
};
var baseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

function initGame() {
    window.addEventListener('langChanged', function() {
        if (document.getElementById('setup-screen').style.display !== 'none') {
            setDiffAndUI(currentDifficulty);
        } else if (matchedPairs === difficultyPairs[currentDifficulty]) {
            statusMessage.innerText = getTranslation('memory_win');
        }
    });

    setTimeout(function() {
        setDiffAndUI('easy');
    }, 100);
}

function setDiffAndUI(level) {
    currentDifficulty = level;
    var btnEasy = document.getElementById('btn-mem-easy');
    var btnMed = document.getElementById('btn-mem-med');
    var btnHard = document.getElementById('btn-mem-hard');
    
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
    boardElement.innerHTML = '';
    
    var numPairs = difficultyPairs[currentDifficulty];
    var currentSymbols = [];
    
    // Shuffle alphabet and pick required pairs
    var shuffledAlpha = baseAlphabet.slice();
    for (var a = shuffledAlpha.length - 1; a > 0; a--) {
        var b = Math.floor(Math.random() * (a + 1));
        var tap = shuffledAlpha[a];
        shuffledAlpha[a] = shuffledAlpha[b];
        shuffledAlpha[b] = tap;
    }
    
    for (var p = 0; p < numPairs; p++) {
        currentSymbols.push(shuffledAlpha[p]);
        currentSymbols.push(shuffledAlpha[p]);
    }
    
    var jokerIndex = -1;
    if (currentDifficulty === 'easy') {
        currentSymbols.push('★'); // Joker
        jokerIndex = 4; // 3x3 center is index 4
    }
    
    // Default Fisher-Yates for pairs
    var pairedCards = currentSymbols.filter(s => s !== '★');
    for (var i = pairedCards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = pairedCards[i];
        pairedCards[i] = pairedCards[j];
        pairedCards[j] = temp;
    }
    
    // Reconstruct with Joker
    if (currentDifficulty === 'easy') {
        cards = [];
        var pIdx = 0;
        for (var c = 0; c < 9; c++) {
            if (c === jokerIndex) cards.push('★');
            else cards.push(pairedCards[pIdx++]);
        }
    } else {
        cards = pairedCards;
    }
    
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    gameActive = true;
    lockBoard = false;
    
    scoreMovesElement.innerText = moves;
    statusMessage.innerText = '';
    
    // CSS adjustments
    if (currentDifficulty === 'easy') boardElement.style.width = '330px'; 
    else boardElement.style.width = '440px'; 
    
    var rowBreak = currentDifficulty === 'easy' ? 3 : 4;
    
    for (var k = 0; k < cards.length; k++) {
        (function(index) {
            var symbol = cards[index];
            var card = document.createElement('div');
            
            if (symbol === '★') {
                card.className = 'memory-card matched';
                card.innerHTML = '<span style="visibility:visible">' + symbol + '</span>';
            } else {
                card.className = 'memory-card hidden';
                card.setAttribute('data-symbol', symbol);
                card.setAttribute('data-index', index);
                card.innerHTML = '<span style="visibility:hidden">' + symbol + '</span>';
                card.onclick = function() { handleCardClick(card); };
            }
            
            boardElement.appendChild(card);
            
            if ((index + 1) % rowBreak === 0) {
                var br = document.createElement('div');
                br.className = 'clearfix';
                boardElement.appendChild(br);
            }
        })(k);
    }

    var clearfix = document.createElement('div');
    clearfix.className = 'clearfix';
    boardElement.appendChild(clearfix);
}

function handleCardClick(card) {
    if (!gameActive || lockBoard) return;
    
    // Check if matched or already visible using className
    if (card.className.indexOf('matched') > -1 || card.className.indexOf('hidden') === -1) return;

    // Flip card
    card.className = card.className.replace(' hidden', '');
    var s = card.getAttribute('data-symbol');
    card.innerHTML = '<span style="visibility:visible">' + s + '</span>';
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        scoreMovesElement.innerText = moves;
        checkForMatch();
    }
}

function checkForMatch() {
    var card1 = flippedCards[0];
    var card2 = flippedCards[1];

    if (card1.getAttribute('data-symbol') === card2.getAttribute('data-symbol')) {
        // Match
        card1.className += ' matched';
        card2.className += ' matched';
        matchedPairs++;
        flippedCards = [];
        
        if (matchedPairs === difficultyPairs[currentDifficulty]) {
            gameActive = false;
            statusMessage.innerText = getTranslation('memory_win');
            
            // Victory Animation for E-ink
            var allCards = document.querySelectorAll('.memory-card');
            for (var i = 0; i < allCards.length; i++) {
                allCards[i].className += ' victory-flash';
            }
        }
    } else {
        // No match
        lockBoard = true;
        setTimeout(function() {
            // E-ink Ghosting Fix - Blink phase 1: Full Black
            card1.className += ' hidden';
            card2.className += ' hidden';
            card1.innerHTML = '<span style="visibility:hidden">' + card1.getAttribute('data-symbol') + '</span>';
            card2.innerHTML = '<span style="visibility:hidden">' + card2.getAttribute('data-symbol') + '</span>';
            
            // Blink phase 2: Full White
            setTimeout(function() {
                card1.className = card1.className.replace(' hidden', '');
                card2.className = card2.className.replace(' hidden', '');
                
                // Blink phase 3: Returns to Final state (Black)
                setTimeout(function() {
                    card1.className += ' hidden';
                    card2.className += ' hidden';
                    flippedCards = [];
                    lockBoard = false;
                }, 350);
            }, 350);
        }, 600);
    }
}

document.addEventListener('DOMContentLoaded', initGame);
