// STATE MANAGEMENT
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 1200; // 20 Minutes in seconds

/**
 * INITIALIZE ARENA
 */
document.addEventListener('DOMContentLoaded', () => {
    const sessionData = JSON.parse(localStorage.getItem('sabi_current_session'));
    
    if (!sessionData || !sessionData.questions) {
        alert("No exam data found. Returning to menu.");
        window.location.href = 'post-utme.html';
        return;
    }

    currentQuestions = sessionData.questions;
    startTimer();
    renderQuestion();
});

/**
 * TIMER LOGIC
 */
function startTimer() {
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
    }, 1000);
}

/**
 * DISPLAY QUESTION
 */
function renderQuestion() {
    const q = currentQuestions[currentIndex];
    const qData = q.data;

    document.getElementById('q-count').innerText = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('q-text').innerText = qData.text;
    
    // Update Progress Bar
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(index, btn);
        optionsList.appendChild(btn);
    });

    // Reset Next Button
    document.getElementById('next-btn').disabled = true;
    document.getElementById('next-btn').innerText = (currentIndex === currentQuestions.length - 1) ? "Submit Exam" : "Next Question";
}

/**
 * OPTION SELECTION
 */
function selectOption(index, element) {
    // UI Update
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');

    // Save choice
    userAnswers[currentIndex] = index;
    document.getElementById('next-btn').disabled = false;
}

/**
 * NAVIGATION
 */
function nextQuestion() {
    // Check answer
    if (userAnswers[currentIndex] === currentQuestions[currentIndex].data.answer) {
        score++;
    }

    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        finishExam();
    }
}

/**
 * FINISH & SAVE RESULTS
 */
function finishExam() {
    clearInterval(timerInterval);
    
    const results = {
        total: currentQuestions.length,
        correct: score,
        percentage: (score / currentQuestions.length) * 100,
        questions: currentQuestions,
        userAnswers: userAnswers
    };

    localStorage.setItem('sabi_last_result', JSON.stringify(results));
    window.location.href = 'results.html'; // Next page to build
}
