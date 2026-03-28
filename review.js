document.addEventListener('DOMContentLoaded', () => {
    const vault = JSON.parse(sessionStorage.getItem('sabi_exam_vault')) || {};
    const userAnswers = JSON.parse(sessionStorage.getItem('sabi_user_answers')) || {};
    const container = document.getElementById('review-list');

    let fullHTML = "";

    // Loop through each subject they took
    for (const subject in vault) {
        const questions = vault[subject];

        questions.forEach((q, index) => {
            const answerKey = subject + index;
            const userPick = userAnswers[answerKey];
            const isCorrect = userPick === q.answer;

            fullHTML += `
                <div class="review-item">
                    <div class="review-meta">${subject} | Question ${index + 1}</div>
                    <div class="status-badge ${isCorrect ? 'status-correct' : 'status-wrong'}">
                        ${isCorrect ? 'CORRECT' : 'WRONG'}
                    </div>
                    
                    <div class="review-q-text">${q.text}</div>

                    <div class="options-grid">
                        ${q.options.map((opt, i) => {
                            let state = "";
                            if (i === q.answer) state = "correct"; // Always show the right one in green
                            else if (i === userPick && !isCorrect) state = "wrong"; // Show their wrong pick in red

                            return `
                                <div class="option-card ${state}">
                                    <div class="opt-circle">${String.fromCharCode(65+i)}</div>
                                    <div class="opt-text">${opt}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="explanation-box" style="display: block; margin-top: 20px;">
                        <div class="exp-header"><h4>SABI EXPLANATION</h4></div>
                        <p>${q.explanation || "No explanation available for this question."}</p>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = fullHTML || "<p style='text-align:center;'>No exam data found to review.</p>";
});
