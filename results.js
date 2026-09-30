document.addEventListener('DOMContentLoaded', () => {
    // 1. Pull Data from Storage
    const rawSubs = JSON.parse(sessionStorage.getItem('sabi_jamb_subjects')) || ["Use of English", "Financial Accounting"];
    const subs = rawSubs.map(s => s.trim());
    
    const userAnswers = JSON.parse(sessionStorage.getItem('sabi_user_answers')) || {};
    const examVault = JSON.parse(sessionStorage.getItem('sabi_exam_vault')) || {};
    
    // =========================================
    // 2. CALCULATE TIME SPENT (FIXED!)
    // =========================================
    // We pull the final spent seconds calculated by test-room.js
    const timeSpent = parseInt(sessionStorage.getItem('sabi_time_spent')) || 0;
    
    let h = Math.floor(timeSpent / 3600);
    let m = Math.floor((timeSpent % 3600) / 60);
    let s = timeSpent % 60;

    let timeString = h > 0 
        ? `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}` 
        : `${m}:${s < 10 ? '0'+s : s}`;
        
    const timeEl = document.getElementById('time-spent');
    if (timeEl) timeEl.innerText = timeString;

    // =========================================
    // 3. TRUE JAMB GRADING LOGIC
    // =========================================
    let totalQuestions = 0;
    let totalCorrect = 0;
    let breakdownHTML = "";

    subs.forEach(sub => {
        let questions = examVault[sub] || [];
        let subQCount = questions.length;
        let subCorrect = 0;

        if (subQCount > 0) {
            questions.forEach((q, index) => {
                totalQuestions++;
                let userAnswer = userAnswers[sub + index];
                if (userAnswer !== undefined && userAnswer === q.answer) {
                    subCorrect++;
                    totalCorrect++;
                }
            });
        }
        
        let scaledSubScore = subQCount > 0 ? Math.round((subCorrect / subQCount) * 100) : 0;
        
        breakdownHTML += `
            <div class="sub-card">
                <span class="sub-name">${sub}</span>
                <span class="sub-score">${scaledSubScore} <span style="font-size:12px; color:#71717A;">/ 100</span></span>
            </div>
        `;
    });

    const breakdownGrid = document.getElementById('breakdown-grid');
    if (breakdownGrid) breakdownGrid.innerHTML = breakdownHTML;
    
    // =========================================
    // 4. SCORE CALCULATIONS
    // =========================================
    let overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    let projectedJAMBScore = Math.round((overallPercentage / 100) * 400);

    const scoreMaxEl = document.querySelector('.score-max');
    if (scoreMaxEl) scoreMaxEl.innerText = `/ 400`;

    const accuracyEl = document.getElementById('accuracy-percent');
    if (accuracyEl) accuracyEl.innerText = `${Math.round(overallPercentage)}%`;
    
    animateScore(projectedJAMBScore);

    // =========================================
    // 5. AWARD BADGES
    // =========================================
    const badgeBox = document.getElementById('badge-box');
    const badgeIcon = document.getElementById('badge-icon');
    const badgeText = document.getElementById('badge-text');
    const adviceText = document.getElementById('sabi-advice');

    if (!badgeBox) return;

    if (overallPercentage >= 75) {
        badgeBox.style.background = "rgba(16, 185, 129, 0.1)"; badgeBox.style.borderColor = "rgba(16, 185, 129, 0.3)";
        badgeText.style.color = "#10B981";
        badgeIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`;
        badgeText.innerText = "Sabi Legend";
        adviceText.innerText = "Exceptional performance. You are in the top percentile. Medicine or Law? You're ready.";
    } else if (overallPercentage >= 60) {
        badgeBox.style.background = "rgba(61, 142, 255, 0.1)"; badgeBox.style.borderColor = "rgba(61, 142, 255, 0.3)";
        badgeText.style.color = "#3D8EFF";
        badgeIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D8EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>`;
        badgeText.innerText = "Scholar";
        adviceText.innerText = `Solid outing. You've comfortably crossed the 240+ threshold. Keep fine-tuning.`;
    } else if (overallPercentage >= 45) {
        badgeBox.style.background = "rgba(245, 158, 11, 0.1)"; badgeBox.style.borderColor = "rgba(245, 158, 11, 0.3)";
        badgeText.style.color = "#F59E0B";
        badgeIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
        badgeText.innerText = "On Track";
        adviceText.innerText = "You survived, but the cutoff mark is breathing down your neck. Review your mistakes.";
    } else {
        badgeBox.style.background = "rgba(239, 68, 68, 0.1)"; badgeBox.style.borderColor = "rgba(239, 68, 68, 0.3)";
        badgeText.style.color = "#EF4444";
        badgeIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        badgeText.innerText = "Keep Pushing";
        adviceText.innerText = "Rough day at the office. Don't panic, just head to the Review Room and study the Sabi Explanations.";
    }
});

function animateScore(target) {
    let current = 0;
    const el = document.getElementById('total-score');
    if (!el) return;
    if (target === 0) { el.innerText = "0"; return; }
    const increment = Math.ceil(target / 40) || 1;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.innerText = target;
            clearInterval(timer);
        } else {
            el.innerText = current;
        }
    }, 20);
}
function retakeExam() {
    // 1. CLEAR EVERYTHING (Answers, Time, and the Question Vault)
    // This forces test-room.js to pull fresh, re-shuffled questions
    sessionStorage.removeItem('sabi_user_answers');
    sessionStorage.removeItem('sabi_exam_vault'); 
    sessionStorage.removeItem('sabi_time_spent');
    sessionStorage.removeItem('sabi_time_left');

    // 2. KEEP ONLY THE SETTINGS
    // We leave 'sabi_jamb_subjects' and 'sabi_exam_mode' alone 
    // so the student doesn't have to pick subjects again.

    // 3. BLAST OFF back to the exam
    window.location.href = "test-room.html";
}
