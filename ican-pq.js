const supabaseUrl = 'https://axmnhhazrjluviedaity.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bW5oaGF6cmpsdXZpZWRhaXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDc3MDUsImV4cCI6MjA5MDQ4MzcwNX0.qx1GdrgpEuqx37-ytGD2ZrG-NfpxXAvQIXPpnTwwqUg';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentLevel, currentSubject, currentSection, currentIndex = 0;
let activeSections = [];
let includeMCQ, includeSAQ, includeEssay;

let sessionData = { MCQ: [], SAQ: [], ESSAY: [] };
let scores = { MCQ: 0, SAQ: 0, ESSAY: 0 };
let answeredQuestions = { MCQ: new Set(), SAQ: new Set(), ESSAY: new Set() };

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    currentLevel = params.get('level');
    currentSubject = params.get('subject');
    includeMCQ = params.get('mcq') === 'true';
    includeSAQ = params.get('saq') === 'true';
    includeEssay = params.get('essay') === 'true';

    if (!currentLevel || !currentSubject) { 
        window.location.href = 'pq-setup.html'; 
        return; 
    }
    document.getElementById('display-subject').innerText = currentSubject;
    if (!includeMCQ) document.getElementById('tab-MCQ').style.display = 'none';
    if (!includeSAQ) document.getElementById('tab-SAQ').style.display = 'none';
    if (!includeEssay) document.getElementById('tab-ESSAY').style.display = 'none';

    await loadData();
};

async function loadData() {
    let rawData = [];

    try {
        // Fetch from all three specific tables independently
        const tableNames = ['sabi_mcq', 'sabi_saq', 'sabi_essay'];
        
        for (const tableName of tableNames) {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*')
                .eq('subject_name', currentSubject);

            if (!error && data) {
                rawData = [...rawData, ...data];
            } else if (error) {
                console.warn(`Could not load ${tableName}:`, error.message);
            }
        }

        // Sort data into categories
        let data = { MCQ: [], SAQ: [], ESSAY: [] };
        rawData.forEach(q => {
            let formattedQ = { text: q.question_text, insight: q.insight };

            if (q.category === 'MCQ') {
                formattedQ.options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                formattedQ.answer = parseInt(q.answer, 10); 
                data.MCQ.push(formattedQ);
            } else if (q.category === 'SAQ') {
                formattedQ.answer = q.answer;
                data.SAQ.push(formattedQ);
            } else if (q.category === 'ESSAY') {
                formattedQ.keywords = typeof q.answer === 'string' ? JSON.parse(q.answer) : q.answer;
                data.ESSAY.push(formattedQ);
            }
        });

        const clean = (arr) => (arr || []).filter(q => q && q.text);
        if (includeMCQ) { sessionData.MCQ = shuffle(clean(data.MCQ)).slice(0, 30); if(sessionData.MCQ.length > 0) activeSections.push('MCQ'); }
        if (includeSAQ) { sessionData.SAQ = shuffle(clean(data.SAQ)).slice(0, 20); if(sessionData.SAQ.length > 0) activeSections.push('SAQ'); }
        if (includeEssay) { sessionData.ESSAY = shuffle(clean(data.ESSAY)).slice(0, 6); if(sessionData.ESSAY.length > 0) activeSections.push('ESSAY'); }

        if (activeSections.length > 0) {
            switchSection(activeSections[0]);
        } else {
            document.getElementById('interaction-area').innerHTML = `<h2 style="color: red; text-align:center;">No Questions Found!</h2>`;
        }

    } catch (e) {
        console.error("Critical error in loadData:", e);
    }
}

function switchSection(sec) {
    currentSection = sec;
    currentIndex = 0;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${sec}`).classList.add('active');
    render();
}

function render() {
    const area = document.getElementById('interaction-area');
    const q = sessionData[currentSection][currentIndex];
    document.getElementById('feedback-panel').style.display = 'none';
    document.getElementById('q-meta').innerText = `${currentSection} | QUESTION ${currentIndex + 1} OF ${sessionData[currentSection].length}`;
    document.getElementById('q-text').innerText = q.text;
    area.innerHTML = '';
    const done = answeredQuestions[currentSection].has(currentIndex);

    if (currentSection === 'MCQ') {
        q.options.forEach((opt, i) => {
            const b = document.createElement('button'); b.className = 'opt-btn'; b.innerText = opt;
            if (done) b.disabled = true;
            b.onclick = (e) => gradeMCQ(e, i, q);
            area.appendChild(b);
        });
    } else if (currentSection === 'SAQ') {
        area.innerHTML = `<input type="text" id="ans" class="text-input" placeholder="Enter term..." ${done?'disabled':''}>
        <button class="action-btn" onclick="gradeSAQ()" ${done?'disabled':''}>Verify Answer</button>`;
    } else {
        area.innerHTML = `<textarea id="ans" class="text-input" style="height:120px" placeholder="Draft your response..." ${done?'disabled':''}></textarea>
        <button class="action-btn" onclick="gradeEssay()" ${done?'disabled':''}>Submit Response</button>`;
    }
    updateControls();
    const totalDone = answeredQuestions.MCQ.size + answeredQuestions.SAQ.size + answeredQuestions.ESSAY.size;
    const totalQ = sessionData.MCQ.length + sessionData.SAQ.length + sessionData.ESSAY.length;
    document.getElementById('progress-text').innerText = Math.round((totalDone/totalQ)*100) + '%';
}

function updateControls() {
    const div = document.getElementById('arena-controls'); div.innerHTML = '';
    const secIdx = activeSections.indexOf(currentSection);
    const back = document.createElement('button'); back.className = 'nav-btn'; back.innerText = 'Back';
    back.onclick = () => { if(currentIndex > 0) { currentIndex--; render(); }};
    if (currentIndex === 0) back.style.opacity = '0.3';
    div.appendChild(back);
    const next = document.createElement('button'); next.className = 'nav-btn';
    if (currentIndex < sessionData[currentSection].length - 1) {
        next.innerText = 'Next Question';
        next.onclick = () => { currentIndex++; render(); };
    } else if (secIdx < activeSections.length - 1) {
        next.innerText = 'Next Section';
        next.onclick = () => switchSection(activeSections[secIdx+1]);
    } else {
        next.innerText = 'Finish Test'; next.onclick = finish;
    }
    div.appendChild(next);
}

function gradeMCQ(e, i, q) {
    answeredQuestions.MCQ.add(currentIndex);
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    if (i === q.answer) { scores.MCQ++; e.target.classList.add('correct'); feedback('success', 'CORRECT', q.insight); }
    else { e.target.classList.add('wrong'); document.querySelectorAll('.opt-btn')[q.answer].classList.add('correct'); feedback('error', 'INCORRECT', q.insight); }
}

function gradeSAQ() {
    answeredQuestions.SAQ.add(currentIndex);
    const q = sessionData.SAQ[currentIndex]; const val = document.getElementById('ans').value.trim().toLowerCase();
    document.getElementById('ans').disabled = true; document.querySelector('.action-btn').disabled = true;
    if (val === q.answer.toLowerCase() || (q.answer.toLowerCase().includes(val) && val.length > 3)) { 
        scores.SAQ++; feedback('success', 'CORRECT', q.insight); 
    } else { feedback('error', 'INCORRECT', `Correct: ${q.answer}\n\n${q.insight}`); }
}

function gradeEssay() {
    answeredQuestions.ESSAY.add(currentIndex);
    const q = sessionData.ESSAY[currentIndex]; const txt = document.getElementById('ans').value.toLowerCase();
    document.getElementById('ans').disabled = true; document.querySelector('.action-btn').disabled = true;
    let m = 0;
    q.keywords.forEach(g => { if(g.some(w => txt.includes(w.toLowerCase()))) m++; });
    const pts = (m / q.keywords.length) * 12.5; scores.ESSAY += pts;
    feedback('success', `GRADED: ${pts.toFixed(1)} / 12.5`, q.insight);
}

function feedback(type, title, msg) {
    const p = document.getElementById('feedback-panel');
    p.style.display = 'block'; p.className = `feedback ${type}`;
    document.getElementById('feedback-title').innerText = title; document.getElementById('insight-text').innerText = msg;
}

function finish() {
    const ess = Math.min(scores.ESSAY, 50);
    const total = scores.MCQ + scores.SAQ + ess;
    const max = (includeMCQ?30:0) + (includeSAQ?20:0) + (includeEssay?50:0);
    const p = max > 0 ? Math.round((total/max)*100) : 0;
    document.getElementById('interaction-area').innerHTML = `<div style="text-align:center"><h1>${p}%</h1><p>${p >= 50 ? 'PASSED' : 'FAILED'}</p><button onclick="window.location.reload()">Retake</button></div>`;
}

function shuffle(a) { return a.sort(() => Math.random() - 0.5); }
