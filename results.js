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
        badgeText.style.color = "#10B981"; badgeIcon.innerText = "🏆"; badgeText.innerText = "Sabi Legend";
        adviceText.innerText = "Exceptional performance. You are in the top percentile. Medicine or Law? You're ready.";
    } else if (overallPercentage >= 60) {
        badgeBox.style.background = "rgba(61, 142, 255, 0.1)"; badgeBox.style.borderColor = "rgba(61, 142, 255, 0.3)";
        badgeText.style.color = "#3D8EFF"; badgeIcon.innerText = "🥇"; badgeText.innerText = "Scholar";
        adviceText.innerText = `Solid outing. You've comfortably crossed the 240+ threshold. Keep fine-tuning.`;
    } else if (overallPercentage >= 45) {
        badgeBox.style.background = "rgba(245, 158, 11, 0.1)"; badgeBox.style.borderColor = "rgba(245, 158, 11, 0.3)";
        badgeText.style.color = "#F59E0B"; badgeIcon.innerText = "📈"; badgeText.innerText = "On Track";
        adviceText.innerText = "You survived, but the cutoff mark is breathing down your neck. Review your mistakes.";
    } else {
        badgeBox.style.background = "rgba(239, 68, 68, 0.1)"; badgeBox.style.borderColor = "rgba(239, 68, 68, 0.3)";
        badgeText.style.color = "#EF4444"; badgeIcon.innerText = "⚠️"; badgeText.innerText = "Keep Pushing";
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
