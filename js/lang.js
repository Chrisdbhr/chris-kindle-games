var translations = {};
var currentLang = 'pt';

var availableLocales = {
    'pt': { name: 'Português', icon: 'img/br.png' },
    'en': { name: 'English', icon: 'img/us.png' }
};

function renderLangButtons() {
    var btnSwitch = document.getElementById('btn-lang-selector');
    if (btnSwitch) {
        var localeInfo = availableLocales[currentLang];
        btnSwitch.innerHTML = '<img src="' + localeInfo.icon + '" style="vertical-align:middle; margin-right:5px; filter:grayscale(100%); -webkit-filter:grayscale(100%);"> ' + currentLang.toUpperCase();
    }
}

// Dedicated Lang HTML page is used instead of Modals

function setLang(lang) {
    if (!availableLocales[lang]) {
        lang = 'pt';
    }
    currentLang = lang;
    localStorage.setItem('kindle_lang', lang);

    if (translations[lang]) {
        applyTranslations();
        renderLangButtons();
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'locales/' + lang + '.json', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 304 || xhr.status === 0)) {
                try {
                    translations[lang] = JSON.parse(xhr.responseText);
                    applyTranslations();
                    renderLangButtons();
                } catch (e) {
                    console.error('Failed to parse translation');
                }
            }
        };
        xhr.send(null);
    }
}

function applyTranslations() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
        var key = els[i].getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            els[i].innerText = translations[currentLang][key];
        }
    }

    try {
        var event;
        if (typeof CustomEvent === 'function') {
            event = new CustomEvent('langChanged', { detail: currentLang });
        } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('langChanged', true, true, currentLang);
        }
        window.dispatchEvent(event);
    } catch(e) {}
}

function getTranslation(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    return key;
}

document.addEventListener('DOMContentLoaded', function() {
    var savedLang = localStorage.getItem('kindle_lang');
    if (savedLang) {
        setLang(savedLang);
    } else {
        setLang('pt');
    }
});

// Remove toggleFullscreen
