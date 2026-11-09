const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const textBox = document.getElementById('text-box');
const restartBtn = document.getElementById('restart-btn');
const timeDisplay = document.getElementById('time');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const modeButtons = document.querySelectorAll('.mode-btn');
const langButtons = document.querySelectorAll('.lang-btn');
const keyboardContainer = document.getElementById('virtual-keyboard');
const tutorialBox = document.getElementById('tutorial-box');
const statsBox = document.getElementById('stats-box');
const exerciseTitle = document.getElementById('exercise-title');
const themeSelect = document.getElementById('theme-select');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

const customTimeInput = document.getElementById('custom-time-input');
const customTimeBtn = document.getElementById('custom-time-btn');

const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const leaderboardList = document.getElementById('leaderboard-list');

const tutTitle = document.getElementById('tut-title');
const tutStep1 = document.getElementById('tut-step-1');
const tutStep2 = document.getElementById('tut-step-2');
const practiceBtn = document.querySelector('.practice-btn');
const themeLabel = document.getElementById('theme-label');
const modalTitle = document.getElementById('modal-title');
const authTitleText = document.getElementById('auth-title-text');
const guestBtn = document.getElementById('guest-btn');
const authButtons = document.querySelectorAll('.auth-btn');
const authBox = document.getElementById('auth-box');

let currentLang = 'ru';
let charIndex = 0;
let totalTyped = 0;
let correctTyped = 0;
let selectedMode = "15";
let timeLeft = 15;
let timer = null;
let isTimerRunning = false;
let currentLessonIndex = 0;
let fullTextBuffer = "";
let isSoundEnabled = true;
let isTabPressed = false;
let currentUser = null;

authButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const provider = e.currentTarget.getAttribute('data-provider');
        currentUser = `${provider} User`;
        completeAuth();
    });
});

guestBtn.addEventListener('click', () => {
    currentUser = currentLang === 'ru' ? 'Гость' : 'Guest';
    completeAuth();
});

function completeAuth() {
    authBox.classList.add('hidden');
    startBtn.classList.remove('hidden');
}

let audioCtx = null;
function playKeySound() {
    if (!isSoundEnabled) return;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const randomFreq = 380 + Math.random() * 80;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(randomFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

const themes = [
    { name: "1. Dark Neon", bg: "#0b1329", card: "#172136", border: "#283754", accent: "#38bdf8" },
    { name: "2. Cyberpunk", bg: "#1a0826", card: "#2b0f3a", border: "#4a126b", accent: "#f43f5e" },
    { name: "3. Matrix Green", bg: "#021206", card: "#06240e", border: "#0b421a", accent: "#22c55e" },
    { name: "4. Dracula", bg: "#282a36", card: "#44475a", border: "#6272a4", accent: "#ff79c6" },
    { name: "5. Sunset Orange", bg: "#1c0d02", card: "#301908", border: "#542c0e", accent: "#f97316" }
];
for (let i = 6; i <= 100; i++) {
    const hue = (i * 37) % 360;
    themes.push({
        name: `${i}. Theme Custom #${i}`,
        bg: `hsl(${hue}, 40%, 8%)`,
        card: `hsl(${hue}, 35%, 15%)`,
        border: `hsl(${hue}, 30%, 25%)`,
        accent: `hsl(${hue}, 85%, 60%)`
    });
}

themes.forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = t.name;
    themeSelect.appendChild(opt);
});

themeSelect.addEventListener('change', (e) => {
    const t = themes[e.target.value];
    document.documentElement.style.setProperty('--bg-color', t.bg);
    document.documentElement.style.setProperty('--card-bg', t.card);
    document.documentElement.style.setProperty('--border-color', t.border);
    document.documentElement.style.setProperty('--accent-color', t.accent);
    document.documentElement.style.setProperty('--key-bg', t.card);
    document.documentElement.style.setProperty('--key-active', t.accent);
    e.target.blur();
});

soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    updateLanguageTexts();
    soundToggleBtn.blur();
});

leaderboardBtn.addEventListener('click', () => {
    displayLeaderboard();
    leaderboardModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => {
    leaderboardModal.classList.add('hidden');
});
leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) leaderboardModal.classList.add('hidden');
});

function saveScore(wpm, acc, duration) {
    let scores = JSON.parse(localStorage.getItem('typeRushScores')) || [];
    scores.push({ user: currentUser || 'Guest', wpm, acc, duration: duration + 's', date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.wpm - a.wpm);
    scores = scores.slice(0, 5);
    localStorage.setItem('typeRushScores', JSON.stringify(scores));
}

function displayLeaderboard() {
    let scores = JSON.parse(localStorage.getItem('typeRushScores')) || [];
    leaderboardList.innerHTML = '';
    if (scores.length === 0) {
        let emptyText = currentLang === 'ru' ? "Пока нет рекордов. Сыграйте партию!" : "No records yet. Play a game!";
        leaderboardList.innerHTML = `<li style="grid-template-columns: 1fr;"><span>${emptyText}</span></li>`;
        return;
    }
    scores.forEach((s, index) => {
        const li = document.createElement('li');
        let timeLabel = currentLang === 'ru' ? 'Время' : 'Time';
        let accLabel = currentLang === 'ru' ? 'Точность' : 'Acc';
        li.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span><span class="val">${s.user}</span></span>
            <span>WPM: <span class="val">${s.wpm}</span></span>
            <span>${accLabel}: <span class="val">${s.acc}%</span></span>
            <span>${s.date}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

const dictionary = {
    ru: {
        practiceName: "Учебный",
        tutTitleText: "🎓 Обучение слепой печати:",
        step1Text: "Поставьте пальцы на базовый ряд. Указательные пальцы лежат на клавишах с бугорками.",
        step2Text: "Не смотрите на клавиатуру — тренируйте мышечную память.",
        themeText: "🎨 Тема:",
        leaderboardText: "🏆 Рейтинг",
        restartText: "Restart",
        soundOn: "🔊 Звук: ВКЛЮЧЕН",
        soundOff: "🔇 Звук: ВЫКЛЮЧЕН",
        modalHeader: "🏆 Таблица Рекордов и Статистики",
        gameOverTitle: "🎉 Время вышло!",
        wpmLabel: "Скорость",
        accLabel: "Точность",
        againBtn: "Сыграть снова",
        authText: "Войти через:",
        guestText: "👻 Войти как гость",
        lessons: [
            { title: "Задание 1: Базовые выступы (А / О)", text: "аа оо аа оо ао оа аа оо ао оа ааоо ооаа" },
            { title: "Задание 2: Базовый ряд (ФЫВА ОЛДЖ)", text: "фыва олдж фыва олдж ф ы в а о л д ж аовл ыдфж" },
            { title: "Задание 3: Быстрые короткие слова", text: "дом кот лед сад шаг пар рот сон мир лап торт ком" },
            { title: "Задание 4: Комбинации букв и пробелов", text: "фа ож ыл вд ао жф лы дв аф ож вл ыд" },
            { title: "Задание 5: Скоростные русские предложения", text: "быстро печатать на клавиатуре это простой и полезный навык для работы" }
        ],
        words: [
            "быстрая", "регулярная", "практика", "помогает", "легко", "освоить", "слепую", "печать",
            "качественный", "код", "логическое", "мышление", "создавать", "удобные", "сайты", "дисциплина",
            "ежедневные", "тренировки", "развивают", "скорость", "точность", "ввода", "клавиатура", "экран"
        ],
        layout: [
            ['й','ц','у','к','е','н','г','ш','щ','з','х','ъ'],
            ['ф','ы','в','а','п','р','о','л','д','ж','э'],
            ['я','ч','с','м','и','т','ь','б','ю']
        ],
        homeKeys: ['ф', 'ы', 'в', 'а', 'о', 'л', 'д', 'ж'],
        bumps: ['а', 'о'],
        spaceText: "ПРОБЕЛ"
    },
    en: {
        practiceName: "Educational",
        tutTitleText: "🎓 Blind Typing Education:",
        step1Text: "Place fingers on the home row. Index fingers rest on keys with bumps.",
        step2Text: "Do not look at the keyboard — train your muscle memory.",
        themeText: "🎨 Theme:",
        leaderboardText: "🏆 Rank",
        restartText: "Restart",
        soundOn: "🔊 Sound: ON",
        soundOff: "🔇 Sound: OFF",
        modalHeader: "🏆 Leaderboard & Statistics",
        gameOverTitle: "🎉 Time is up!",
        wpmLabel: "Speed",
        accLabel: "Accuracy",
        againBtn: "Play Again",
        authText: "Sign in with:",
        guestText: "👻 Continue as Guest",
        lessons: [
            { title: "Task 1: Home Bumps (F / J)", text: "ff jj ff jj fj jf ff jj fj jf ffjj jjff" },
            { title: "Task 2: Home Row (ASDF JKL;)", text: "asdf jkl; asdf jkl; a s d f j k l ; fj dk sl a;" },
            { title: "Task 3: Fast Short Words", text: "cat dog red blue sun sky run fly jump code web" },
            { title: "Task 4: Key Combos", text: "fj dk sl a; fa j; ds kl fjd ksl fjdk sl" },
            { title: "Task 5: Speed English Sentences", text: "typing fast on keyboard is a simple and useful skill for everyday work" }
        ],
        words: [
            "persistence", "daily", "practice", "main", "keys", "success", "new", "endeavor",
            "successful", "projects", "built", "solid", "foundations", "clear", "planning", "disciplined",
            "teamwork", "programming", "requires", "knowledge", "syntax", "ability", "think", "logically"
        ],
        layout: [
            ['q','w','e','r','t','y','u','i','o','p'],
            ['a','s','d','f','g','h','j','k','l'],
            ['z','x','c','v','b','n','m']
        ],
        homeKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
        bumps: ['f', 'j'],
        spaceText: "SPACE"
    }
};

function updateLanguageTexts() {
    const data = dictionary[currentLang];
    practiceBtn.textContent = data.practiceName;
    tutTitle.textContent = data.tutTitleText;
    tutStep1.textContent = data.step1Text;
    tutStep2.textContent = data.step2Text;
    themeLabel.textContent = data.themeText;
    leaderboardBtn.textContent = data.leaderboardText;
    restartBtn.textContent = data.restartText;
    modalTitle.textContent = data.modalHeader;
    authTitleText.textContent = data.authText;
    guestBtn.textContent = data.guestText;

    if (isSoundEnabled) {
        soundToggleBtn.textContent = data.soundOn;
        soundToggleBtn.classList.remove('muted');
    } else {
        soundToggleBtn.textContent = data.soundOff;
        soundToggleBtn.classList.add('muted');
    }
}

function buildKeyboard() {
    keyboardContainer.innerHTML = '';
    const langData = dictionary[currentLang];

    langData.layout.forEach(rowKeys => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        rowKeys.forEach(k => {
            const keySpan = document.createElement('span');
            keySpan.className = 'key';
            keySpan.setAttribute('data-key', k);
            keySpan.textContent = k.toUpperCase();
            if (langData.homeKeys.includes(k)) keySpan.classList.add('home-key');
            if (langData.bumps.includes(k)) keySpan.classList.add('main-bump');
            rowDiv.appendChild(keySpan);
        });
        keyboardContainer.appendChild(rowDiv);
    });

    const spaceRow = document.createElement('div');
    spaceRow.className = 'row';
    const spaceSpan = document.createElement('span');
    spaceSpan.className = 'key space-key';
    spaceSpan.setAttribute('data-key', ' ');
    spaceSpan.textContent = langData.spaceText;
    spaceRow.appendChild(spaceSpan);
    keyboardContainer.appendChild(spaceRow);
}

langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        langButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        e.target.blur();

        currentLang = e.target.getAttribute('data-lang');
        updateLanguageTexts();
        buildKeyboard();
        resetGame();
    });
});

modeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        modeButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        e.target.blur();
        
        selectedMode = e.target.getAttribute('data-time');
        customTimeInput.value = "";
        resetGame();
    });
});

customTimeBtn.addEventListener('click', () => {
    const val = parseInt(customTimeInput.value);
    if (val && val > 0) {
        modeButtons.forEach(b => b.classList.remove('active'));
        selectedMode = val.toString();
        resetGame();
    }
    customTimeInput.blur();
});
customTimeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        customTimeBtn.click();
    }
});

function resetGame() {
    clearInterval(timer);
    isTimerRunning = false;
    charIndex = 0;
    totalTyped = 0;
    correctTyped = 0;
    wpmDisplay.textContent = "0";
    accuracyDisplay.textContent = "100";

    const existingOverlay = document.getElementById('game-over-overlay');
    if (existingOverlay) existingOverlay.remove();

    const langData = dictionary[currentLang];

    if (selectedMode === "practice") {
        tutorialBox.classList.remove('hidden');
        statsBox.classList.add('hidden');
        
        const lesson = langData.lessons[currentLessonIndex % langData.lessons.length];
        exerciseTitle.textContent = lesson.title;
        fullTextBuffer = lesson.text;
        renderText(fullTextBuffer);
    } else {
        tutorialBox.classList.add('hidden');
        statsBox.classList.remove('hidden');
        
        timeLeft = parseInt(selectedMode);
        timeDisplay.textContent = timeLeft + "s";

        fullTextBuffer = generateInfiniteText(80);
        renderText(fullTextBuffer);
    }
}

function generateInfiniteText(count = 70) {
    const list = dictionary[currentLang].words;
    let result = [];
    for (let i = 0; i < count; i++) {
        result.push(list[Math.floor(Math.random() * list.length)]);
    }
    return result.join(" ");
}

function appendMoreWords() {
    const newWords = " " + generateInfiniteText(40);
    fullTextBuffer += newWords;

    newWords.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        textBox.appendChild(span);
    });
}

function renderText(text) {
    textBox.innerHTML = '';
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        if (index === 0) span.classList.add('current');
        textBox.appendChild(span);
    });
}

function updateStats() {
    const elapsedMinutes = (parseInt(selectedMode) - timeLeft) / 60;
    if (elapsedMinutes > 0) {
        const wpm = Math.round((correctTyped / 5) / elapsedMinutes);
        wpmDisplay.textContent = wpm > 0 ? wpm : 0;
    }
    if (totalTyped > 0) {
        const acc = Math.round((correctTyped / totalTyped) * 100);
        accuracyDisplay.textContent = acc;
    }
}

function showGameOverPopup(wpm, acc) {
    const data = dictionary[currentLang];
    
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.id = 'game-over-overlay';

    overlay.innerHTML = `
        <div class="game-over-card">
            <h2>${data.gameOverTitle}</h2>
            <div class="results-grid">
                <div class="result-item">
                    <span class="result-label">${data.wpmLabel}</span>
                    <span class="result-value">${wpm}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">${data.accLabel}</span>
                    <span class="result-value">${acc}%</span>
                </div>
            </div>
            <button class="game-over-btn" id="popup-restart-btn">${data.againBtn}</button>
        </div>
    `;

    gameScreen.appendChild(overlay);

    document.getElementById('popup-restart-btn').addEventListener('click', () => {
        resetGame();
    });
}

function startTimer() {
    if (selectedMode === "practice") return;

    isTimerRunning = true;
    timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft + "s";
        updateStats();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            const finalWpm = parseInt(wpmDisplay.textContent);
            const finalAcc = parseInt(accuracyDisplay.textContent);
            
            saveScore(finalWpm, finalAcc, selectedMode);
            showGameOverPopup(finalWpm, finalAcc);
        }
    }, 1000);
}

startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateLanguageTexts();
    buildKeyboard();
    resetGame();
});

restartBtn.addEventListener('click', () => {
    resetGame();
    restartBtn.blur();
});

document.addEventListener('keydown', (e) => {
    if (gameScreen.classList.contains('hidden')) return;

    if (e.key === 'Tab') {
        isTabPressed = true;
        e.preventDefault();
        return;
    }

    if (e.key === 'Enter') {
        if (isTabPressed || e.ctrlKey || e.shiftKey) {
            e.preventDefault();
            resetGame();
            isTabPressed = false;
            return;
        }
    }

    if (document.activeElement === customTimeInput) {
        return;
    }

    const popup = document.getElementById('game-over-overlay');
    if (popup && e.key === 'Enter') {
        resetGame();
        return;
    }

    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
    }

    if (e.key === ' ') {
        e.preventDefault();
    }

    playKeySound();

    const keys = document.querySelectorAll('.key');
    const keyAttr = e.key.toLowerCase();
    keys.forEach(k => {
        if (k.getAttribute('data-key') === keyAttr) {
            k.classList.add('active');
        }
    });

    if (!isTimerRunning && selectedMode !== "practice") {
        startTimer();
    }

    const spanElements = textBox.querySelectorAll('span');
    
    if (e.key === 'Backspace') {
        if (charIndex > 0) {
            charIndex--;
            spanElements[charIndex].classList.remove('correct', 'incorrect');
            spanElements.forEach(s => s.classList.remove('current'));
            spanElements[charIndex].classList.add('current');
        }
        return;
    }

    if ((e.key.length === 1 || e.key === ' ') && charIndex < spanElements.length) {
        const currentSpan = spanElements[charIndex];
        totalTyped++;
        
        if (e.key === currentSpan.textContent) {
            currentSpan.classList.add('correct');
            correctTyped++;
        } else {
            currentSpan.classList.add('incorrect');
        }

        currentSpan.classList.remove('current');
        charIndex++;

        if (selectedMode !== "practice" && charIndex > spanElements.length - 25) {
            appendMoreWords();
        }

        const updatedSpans = textBox.querySelectorAll('span');
        if (charIndex < updatedSpans.length) {
            updatedSpans[charIndex].classList.add('current');
            
            const currentEl = updatedSpans[charIndex];
            if (currentEl.offsetTop > textBox.clientHeight + textBox.scrollTop - 40) {
                textBox.scrollTop += 45;
            }
        } else if (selectedMode === "practice") {
            currentLessonIndex++;
            setTimeout(() => {
                resetGame();
            }, 300);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
        isTabPressed = false;
    }

    const keys = document.querySelectorAll('.key');
    const keyAttr = e.key.toLowerCase();
    keys.forEach(k => {
        if (k.getAttribute('data-key') === keyAttr) {
            k.classList.remove('active');
        }
    });
});