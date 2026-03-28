// =========================================
// SABI OS: EXAM PREP ENGINE (pq.js)
// =========================================

// --- JAMB MODE SELECTOR LOGIC ---
function triggerJambFlow() {
    document.getElementById('mode-overlay').style.display = 'flex';
}

function closeModeSelector() {
    document.getElementById('mode-overlay').style.display = 'none';
}

function selectMode(mode) {
    sessionStorage.setItem('sabi_exam_mode', mode);
    document.querySelector('.mode-card').style.transform = "scale(0.9)";
    document.querySelector('.mode-card').style.opacity = "0.5";
    
    setTimeout(() => {
        window.location.href = 'test-room.html'; // Go straight to test room or subject picker
    }, 300);
}

// --- BOTTOM SHEET LOGIC (For WAEC, NECO, etc.) ---
const examDatabase = {
    'WAEC': { subjects: ['Mathematics', 'English Language', 'Biology', 'Physics', 'Chemistry'], years: ['2023', '2022', '2021', '2020'], color: '#3B82F6' },
    'NECO': { subjects: ['Mathematics', 'English Language', 'Biology', 'Physics'], years: ['2023', '2022', '2021'], color: '#8B5CF6' },
    'Post-UTME': { subjects: ['UNILAG', 'UI', 'OAU', 'UNN', 'UNILORIN'], years: ['2023', '2022', '2021'], color: '#F43F5E' },
    'JUPEB': { subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], years: ['2023', '2022', '2021'], color: '#F59E0B' },
    'NABTEB': { subjects: ['General Math', 'English', 'Basic Electricity'], years: ['2023', '2022'], color: '#06B6D4' },
    'ICAN': { subjects: ['ATS 1: Basic Accounting', 'ATS 2: Economics', 'Professional: Audit'], years: ['Nov 2023', 'May 2023'], color: '#EAB308' }
};

function openSheet(examName, subtitle) {
    const data = examDatabase[examName];
    if (!data) return;

    document.getElementById('sheet-title').innerText = examName;
    document.getElementById('sheet-subtitle').innerText = subtitle;
    document.getElementById('sheet-title').style.color = data.color;

    const subjectHTML = data.subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    const yearHTML = data.years.map(y => `<option value="${y}">${y}</option>`).join('');

    document.getElementById('sheet-content-area').innerHTML = `
        <select id="sub-select" style="width: 100%; background: #1A2130; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 16px; color: white; font-family: 'Outfit'; font-size: 14px; margin-bottom: 15px; outline: none; appearance: none; -webkit-appearance: none;">
            <option value="" disabled selected>Select Subject</option>
            ${subjectHTML}
        </select>
        <select id="yr-select" style="width: 100%; background: #1A2130; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 16px; color: white; font-family: 'Outfit'; font-size: 14px; margin-bottom: 25px; outline: none; appearance: none; -webkit-appearance: none;">
            <option value="" disabled selected>Select Year</option>
            ${yearHTML}
        </select>
        <button onclick="launchStandardExam('${examName}')" style="width: 100%; background: ${data.color}; color: white; padding: 16px; border-radius: 14px; border: none; font-weight: 700; font-family: 'Outfit'; cursor: pointer; font-size: 15px; transition: 0.2s;">
            BOOT ENGINE
        </button>
    `;

    document.getElementById('sheet-overlay').style.opacity = '1';
    document.getElementById('sheet-overlay').style.pointerEvents = 'auto';
    document.getElementById('exam-sheet').style.transform = 'translateY(0)';
}

function closeSheet() {
    document.getElementById('sheet-overlay').style.opacity = '0';
    document.getElementById('sheet-overlay').style.pointerEvents = 'none';
    document.getElementById('exam-sheet').style.transform = 'translateY(100%)';
}

function launchStandardExam(examName) {
    const subject = document.getElementById('sub-select').value;
    const year = document.getElementById('yr-select').value;
    
    if (!subject || !year) {
        alert("Please select both a subject and a year.");
        return;
    }

    // Save session data for standard exams
    localStorage.setItem('sabi_last_prep', JSON.stringify({ exam: examName, subject: subject, year: year }));
    
    closeSheet();
    setTimeout(() => {
        window.location.href = 'test-room.html'; // Go to test room
    }, 400);
}
function selectMode(mode) {
    sessionStorage.setItem('sabi_exam_mode', mode);
    document.querySelector('.mode-card').style.transform = "scale(0.9)";
    document.querySelector('.mode-card').style.opacity = "0.5";
    
    setTimeout(() => {
        // Redirect to Setup, NOT test-room yet
        window.location.href = 'jamb-setup.html'; 
    }, 300);
}
