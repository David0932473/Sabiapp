// =========================================
// SABI OS: JAMB SETUP ENGINE (jamb-setup.js)
// =========================================

const allSubjects = [
    "Use of English", // Must be index 0
    "Mathematics", "Physics", "Chemistry", "Biology", 
    "Economics", "Government", "Literature in English", 
    "Agricultural Science", "CRS", "IRS", 
    "Geography", "Commerce", "Accounting", "History"
];

let selectedSubjects = ["Use of English"]; // Auto-loaded compulsory subject

document.addEventListener('DOMContentLoaded', () => {
    // 1. Show selected mode from previous page
    const mode = sessionStorage.getItem('sabi_exam_mode') || 'unknown';
    document.getElementById('display-mode').innerText = `MODE: ${mode}`;

    // 2. Render the subjects
    const container = document.getElementById('subject-container');
    
    allSubjects.forEach(subject => {
        const isCompulsory = subject === "Use of English";
        const card = document.createElement('div');
        
        card.className = `subject-card ${isCompulsory ? 'locked selected' : ''}`;
        card.innerHTML = `
            <h3>${subject}</h3>
            ${isCompulsory ? '<span class="locked-icon">🔒</span>' : ''}
        `;
        
        if (!isCompulsory) {
            card.onclick = () => toggleSubject(card, subject);
        }
        
        container.appendChild(card);
    });

    updateUI();
});

function toggleSubject(cardElement, subjectName) {
    if (selectedSubjects.includes(subjectName)) {
        // Deselect
        selectedSubjects = selectedSubjects.filter(s => s !== subjectName);
        cardElement.classList.remove('selected');
    } else {
        // Select (limit to 4 total)
        if (selectedSubjects.length < 4) {
            selectedSubjects.push(subjectName);
            cardElement.classList.add('selected');
        } else {
            // Visual shake feedback if they try to pick more than 4
            cardElement.style.transform = "translateX(5px)";
            setTimeout(() => cardElement.style.transform = "translateX(-5px)", 100);
            setTimeout(() => cardElement.style.transform = "translateX(0)", 200);
        }
    }
    updateUI();
}

function updateUI() {
    const counter = document.getElementById('counter');
    const startBtn = document.getElementById('start-btn');
    
    counter.innerText = `${selectedSubjects.length} / 4`;
    
    // Enable button ONLY if exactly 4 are picked
    if (selectedSubjects.length === 4) {
        startBtn.classList.remove('disabled');
        startBtn.removeAttribute('disabled');
        counter.style.color = "var(--jamb-green)";
    } else {
        startBtn.classList.add('disabled');
        startBtn.setAttribute('disabled', 'true');
        counter.style.color = "#fff";
    }
}

// 3. Boot Engine Logic
document.getElementById('start-btn').addEventListener('click', () => {
    if (selectedSubjects.length === 4) {
        // Save to session so test-room knows what to load
        sessionStorage.setItem('sabi_jamb_subjects', JSON.stringify(selectedSubjects));
        
        const btn = document.getElementById('start-btn');
        btn.innerText = "LOADING...";
        btn.style.opacity = "0.7";
        
        setTimeout(() => {
            window.location.href = 'test-room.html';
        }, 600);
    }
});
