// =========================================
// SABI OS: BULLETPROOF ENGINE (test-room.js)
// =========================================

let mode = (sessionStorage.getItem('sabi_exam_mode') || 'real').trim().toLowerCase();
let rawSubs = JSON.parse(sessionStorage.getItem('sabi_jamb_subjects')) || ["Use of English", "Chemistry"];
let subs = rawSubs.map(s => s.trim());
let activeSub = subs[0];
let qIndex = 0;
let answers = {};

// Time Tracking logic
const totalExamTime = (mode === 'demo') ? (30 * 60) : (120 * 60); 
let timeLeft = totalExamTime; 

let currentQuestions = []; 
let subjectVault = {}; 

// 1. BOOT SEQUENCE
document.addEventListener('DOMContentLoaded', () => {
    const modeDisplay = document.getElementById('mode-display');
    if (modeDisplay) {
        modeDisplay.innerText = (mode === 'demo') ? "DEMO MODE (30M)" : "REAL MODE (120M)";
        modeDisplay.style.color = (mode === 'demo') ? "#3D8EFF" : "#EF4444";
    }
    startTimer();
    switchSub(activeSub); 
});

// 2. THE VAULT LINKER (WITH SMART FETCHING)
async function prepareQuestions(jumpToLast = false) {
    try {
        // If we already loaded this subject, pull it from memory
        if (subjectVault[activeSub]) {
            currentQuestions = subjectVault[activeSub];
            if (jumpToLast) qIndex = currentQuestions.length - 1;
            renderTabs();
            loadQuestion();
            return;
        }

        // Standard File Map
        const fileMap = {
            "Use of English": "english.json",
            "Financial Accounting": "account.json",
            "Accounting": "account.json", 
            "Literature in English": "literature.json",
            "Chemistry": "chemistry.json",
            "Commerce": "commerce.json",
            "Economics": "economics.json",
            "Mathematics": "maths.json"
            
        };
        
        let fileName = fileMap[activeSub] || `${activeSub.toLowerCase()}.json`;
        
        const qTextDisplay = document.getElementById('q-text-display');
        if (qTextDisplay) qTextDisplay.innerHTML = `<span style="color:#3D8EFF">Loading ${activeSub}...</span>`;

        // Attempt 1: Fetch normal file
        let response = await fetch(`./data/${fileName}`);
        
        // Attempt 2: If normal fetch fails, try it with a space before .json (e.g. "economics .json")
        if (!response.ok) {
            console.log(`Trying alternative filename for ${activeSub}...`);
            response = await fetch(`./data/${activeSub.toLowerCase()} .json`);
        }

        if (!response.ok) throw new Error(`Subject file not found. Ensure ${fileName} is uploaded into your /data folder on Netlify.`);
        
        const data = await response.json();
        
        // Bulletproof check: Ensure the data is actually an array
        const questionList = Array.isArray(data) ? data : (data.questions || []);
        if (!Array.isArray(questionList) || questionList.length === 0) {
            throw new Error("Data format is invalid. Your .json file must start with a '[' bracket and contain a list of questions.");
        }

        // Shuffle and limit the questions based on the mode
        let shuffled = [...questionList].sort(() => Math.random() - 0.5);
        let qLimit = (mode === 'demo') ? (activeSub.toLowerCase().includes("english") ? 20 : 10) : (activeSub.toLowerCase().includes("english") ? 60 : 40);
        
        currentQuestions = shuffled.slice(0, qLimit);
        subjectVault[activeSub] = currentQuestions; 

        if (jumpToLast) qIndex = currentQuestions.length - 1;
        
        renderTabs();
        loadQuestion();
        
    } catch (err) {
        // Render the beautiful red crash report if a file is broken or missing
        console.error("Sabi Fetch Error:", err);
        const qTextDisplay = document.getElementById('q-text-display');
        if (qTextDisplay) {
            qTextDisplay.innerHTML = `
                <div style="background:rgba(239,68,68,0.1); padding:20px; border-radius:10px; border-left:4px solid #EF4444; margin-top:20px;">
                    <h4 style="color:#EF4444; margin:0 0 10px 0;">⚠️ SABI CRASH REPORT</h4>
                    <p style="color:white; font-family:monospace; font-size:14px; margin:0;">${err.message}</p>
                </div>`;
        }
        const optionsGrid = document.getElementById('options-grid');
        if (optionsGrid) optionsGrid.innerHTML = ""; // Clear out options so it looks clean
    }
}

// 3. RENDER TABS
function renderTabs() {
    const container = document.getElementById('subject-tabs');
    if (!container) return;
    container.innerHTML = subs.map(s => `<div class="sub-tab ${s === activeSub ? 'active' : ''}" onclick="switchSub('${s}')">${s}</div>`).join('');
}

// 4. LOAD QUESTION TO UI
function loadQuestion() {
    if (currentQuestions.length === 0) return; 
    
    const q = currentQuestions[qIndex];
    
    // Update headers safely
    const subNameEl = document.getElementById('active-sub-name');
    if(subNameEl) subNameEl.innerText = activeSub;
    
    const qNumEl = document.getElementById('q-number-display');
    if(qNumEl) qNumEl.innerText = `Question ${qIndex + 1}`;
    
    const progEl = document.getElementById('progress-text');
    if(progEl) progEl.innerText = `${qIndex + 1} / ${currentQuestions.length}`;
    
    const qTextEl = document.getElementById('q-text-display');
    if(qTextEl) qTextEl.innerText = q.text;

    // Load Options
    const savedAnswer = answers[activeSub + qIndex];
    const optionsGrid = document.getElementById('options-grid');
    
    if (optionsGrid) {
        optionsGrid.innerHTML = q.options.map((opt, i) => {
            let stateClass = (savedAnswer === i) ? "selected" : "";
            // Demo mode correct/wrong coloring
            if (mode === 'demo' && savedAnswer !== undefined) {
                stateClass = (i === q.answer) ? "correct" : (savedAnswer === i ? "wrong" : "");
            }
            return `<div class="option-card ${stateClass}" onclick="selectOpt(${i})">
                    <div class="opt-circle">${String.fromCharCode(65+i)}</div><div class="opt-text">${opt}</div></div>`;
        }).join('');
    }
    
    // Sabi Explanation Box Logic (Demo Mode Only)
    const expBox = document.getElementById('explanation-box');
    if (expBox) {
        if (mode === 'demo' && savedAnswer !== undefined) {
            const expText = document.getElementById('explanation-text');
            if(expText) expText.innerText = q.explanation || "No explanation provided.";
            expBox.classList.remove('hidden');
            expBox.style.borderLeft = `4px solid ${savedAnswer === q.answer ? '#10B981' : '#EF4444'}`;
        } else {
            expBox.classList.add('hidden');
        }
    }

    renderGrid(); // Instantly update the 0/0 counter
}

// 5. INTERACTION LOGIC
function selectOpt(i) {
    if (mode === 'demo' && answers[activeSub + qIndex] !== undefined) return; // Prevent double answering in demo
    answers[activeSub + qIndex] = i;
    loadQuestion();
}

function switchSub(sName, jumpToLast = false) {
    activeSub = sName;
    qIndex = 0;
    prepareQuestions(jumpToLast); 
}

function nextQuestion() { 
    if (qIndex < currentQuestions.length - 1) { 
        qIndex++; 
        loadQuestion(); 
    } else {
        // Auto-jump to next subject
        let idx = subs.indexOf(activeSub);
        if (idx < subs.length - 1) switchSub(subs[idx + 1]);
    }
}

function prevQuestion() { 
    if (qIndex > 0) { 
        qIndex--; 
        loadQuestion(); 
    } else {
        // Auto-jump to previous subject's last question
        let idx = subs.indexOf(activeSub);
        if (idx > 0) switchSub(subs[idx - 1], true);
    }
}

// 6. TIMER & SUBMIT
function startTimer() {
    const el = document.getElementById('timer-display');
    const interval = setInterval(() => {
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        if (el) el.innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if (timeLeft <= 0) { clearInterval(interval); endExam(); }
        timeLeft--;
    }, 1000);
}

function endExam() {
    // The "Double-Lock" time saver for the Results Page
    const timeSpentSeconds = totalExamTime - timeLeft; 
    sessionStorage.setItem('sabi_time_spent', timeSpentSeconds.toString());
    sessionStorage.setItem('sabi_time_left', timeLeft.toString()); 
    
    sessionStorage.setItem('sabi_user_answers', JSON.stringify(answers));
    sessionStorage.setItem('sabi_exam_vault', JSON.stringify(subjectVault));
    window.location.href = "results.html";
}

// 7. GRID LOGIC
function toggleGrid() {
    const sheet = document.getElementById('grid-bottom-sheet');
    const overlay = document.getElementById('grid-overlay');
    if (!sheet) return;
    
    if (sheet.classList.contains('hidden')) {
        renderGrid(); 
        sheet.classList.remove('hidden'); 
        if(overlay) overlay.classList.remove('hidden');
    } else {
        sheet.classList.add('hidden'); 
        if(overlay) overlay.classList.add('hidden');
    }
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    if (!container) return; 
    
    const gridSubName = document.getElementById('active-sub-grid-name');
    if (gridSubName) gridSubName.innerText = activeSub;

    let answeredCount = 0;
    container.innerHTML = currentQuestions.map((_, i) => {
        const isAnswered = answers[activeSub + i] !== undefined;
        if (isAnswered) answeredCount++; // Count for the 0/0 tracker
        return `<div class="q-bubble ${isAnswered ? 'answered' : ''} ${i === qIndex ? 'active' : ''}" onclick="jumpToQuestion(${i})">${i + 1}</div>`;
    }).join('');
    
    const statusEl = document.getElementById('grid-status');
    if (statusEl) statusEl.innerText = `${answeredCount}/${currentQuestions.length}`;
}

function jumpToQuestion(i) { 
    qIndex = i; 
    loadQuestion(); 
    toggleGrid(); 
}
