// @ts-nocheck

const morseCode = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D',
    '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H',
    '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
    '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P',
    '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
    '-.--': 'Y', '--..': 'Z',
    '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
    '-....': '6', '--...': '7', '---..': '8', '----.': '9',
    '.-.-.-': '.', '--..--': ',', '..--..': '?', '-.-.--': '!', '-....-': '-', '-..-.': '/',
    '.--.-.': '@', '-.--.': '(', '-.--.-': ')', '/': ' '
};

const textToMorse = Object.fromEntries(
    Object.entries(morseCode).map(([k, v]) => [v, k])
);

function detectMorse(text = '', returnType = 'boolean') {
    text = text.trim();
    if (!text) return returnType === 'boolean' ? false : 'text';

    const validMorseChars = new Set(['.', '-', '/', ' ']);

    // Only count letters that are valid Morse
    const morseChars = [...text].filter(c => validMorseChars.has(c));

    // If at least half of the characters are valid Morse, consider it Morse
    const isMorse = morseChars.length / text.length >= 0.5;

    if (returnType === 'boolean') return isMorse;
    return isMorse ? 'morse' : 'text';
}

function isValidMorse(morse = '... --- ...') {
    morse = morse.trim();
    if (!morse) return false;

    // Valid Morse “letters”
    const validLetters = new Set([
        '.', '-', '..', '...', '....', '.....', 
        '-....', '--...', '---..', '----.', '-----',
        '.-', '-...', '-.-.', '-..', '.',
        '..-.', '--.', '....', '..', '.---',
        '-.-', '.-..', '--', '-.', '---',
        '.--.', '--.-', '.-.', '...', '-',
        '..-', '...-', '.--', '-..-', '-.--', '--..',
        '/'
    ]);

    // Split by space (each Morse letter)
    const parts = morse.split(' ');
    if (parts.length === 0) return false;

    // Check that every “letter” is valid
    for (const part of parts) {
        if (!validLetters.has(part)) return false;
    }

    return true;
}

function normalizeMorse(text) {
    return text.trim().replace(/\s+/g, ' ');
}

function translate(text = '') {
    if (!text) return '';

    const isMorse = detectMorse(text);

    if (isMorse) {
        // Morse → text
        const normalized = normalizeMorse(text);
        return normalized
            .split(' ')
            .map(code => morseCode[code] ?? code) // leave unknown as-is
            .join('');
    } else {
        // Text → Morse
        return text
            .toUpperCase()
            .split('')
            .map(char => textToMorse[char] ?? char)
            .join(' ');
    }
}

document.addEventListener('keydown', e => {
    // Check if Enter was pressed and the target is #morseText
    if (e.key === 'Enter' && e.target === $('#morseText')) {
        e.preventDefault(); // Prevent newline
        createItem($('#morseText').value);
    }
});

AVL($('#translateMorse'), 'click', () => {
    createItem($('#morseText').value);
});

function createItem(text = '') {
    if (!text || isEmpty(text)) return;

    // Detect type
    const type = detectMorse(text, 'string');

    // Translate
    const translation = translate(text);

    // Add to history
    const historySection = $('#history');

    const container = document.createElement('div'); // container for text + button
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '10px';

    const p = document.createElement('p');  
    p.textContent = text.cap.all + ' → ' + translation;

    const cpyBtn = document.createElement('button');
    cpyBtn.textContent = 'Copy';
    cpyBtn.style.cursor = 'pointer';
    animateClick(cpyBtn, 150, true);
    cpyBtn.addEventListener('click', () => {
        copy(translation);
    })
    const btn = document.createElement('button');
    btn.textContent = 'Clear';
    btn.style.cursor = 'pointer';
    animateClick(btn, 150, true);
    btn.addEventListener('click', () => container.remove());

    container.appendChild(p);
    container.appendChild(cpyBtn);
    container.appendChild(btn);
    historySection.appendChild(container);

    // Log
    csl(
        'log', 
        `Translated '${text}' (${type}) into '${translation}'`, 
        cslStyles.user, 
        'success'
    );
    $('#morseText').value = '';
}

animateClick($('#translateMorse'), 150, true);
autoGrow($('#morseText'));

function clearAll() {
    if (confirm('Are you sure you want to clear all history?')) {
        $('#history').innerHTML = '';
    }
}