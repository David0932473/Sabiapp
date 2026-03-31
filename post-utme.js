/**
 * SABI OS - Post-UTME Engine
 * Logic: Fetches the 'Brain' from Supabase Storage and initializes the Arena.
 */

// 1. YOUR VAULT URL
const SABI_VAULT_URL = 'https://axmnhhazrjluviedaity.supabase.co/storage/v1/object/public/questions.json/questions.json';

// 2. STATE MANAGEMENT
let allQuestions = [];
let selectedUniversity = 'ALL';

/**
 * INITIALIZE ON LOAD
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSabiVault();
    
    // Set default display
    const display = document.getElementById('selected-display');
    if (display) display.innerText = "Universal Mix";
});

/**
 * FETCH DATA FROM SUPABASE STORAGE
 */
async function loadSabiVault() {
    try {
        console.log("Sabi Engine: Connecting to Vault...");
        const response = await fetch(SABI_VAULT_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allQuestions = await response.json();
        console.log(`Sabi Engine: ${allQuestions.length} questions loaded successfully.`);
        
        // Build the UI based on what's in the JSON
        renderUniversityCards();

    } catch (error) {
        console.error("Vault Connection Failed:", error);
        alert("Sabi couldn't reach the Vault. Check your internet or Supabase Bucket settings.");
    }
}

/**
 * DYNAMIC CARD RENDERING
 * This reads your JSON and creates a card for every unique University it finds.
 */
function renderUniversityCards() {
    const grid = document.getElementById('university-grid');
    if (!grid) return;

    // Extract unique schools from the JSON data
    const schools = [...new Set(allQuestions.map(q => q.university))].filter(Boolean);

    schools.forEach(school => {
        const card = document.createElement('div');
        card.className = 'uni-card';
        card.id = `card-${school.replace(/\s+/g, '-')}`;
        card.onclick = () => selectUni(school, card);

        card.innerHTML = `
            <div class="uni-icon">🏫</div>
            <div class="uni-info">
                <h3>${school}</h3>
                <p>${school} Post-UTME Vault</p>
            </div>
            <div class="selection-indicator"></div>
        `;
        grid.appendChild(card);
    });
}

/**
 * SELECTION LOGIC
 */
function selectUni(uni, element) {
    // UI feedback
    document.querySelectorAll('.uni-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');

    // Update state
    selectedUniversity = uni;
    
    // Update label
    const display = document.getElementById('selected-display');
    if (display) display.innerText = (uni === 'ALL') ? "Universal Mix" : uni;

    // Mobile Haptics
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

/**
 * ARENA LAUNCHER
 * Filters, Shuffles, and Redirects.
 */
function launchArena() {
    const startBtn = document.getElementById('start-btn');
    startBtn.innerText = "Initializing...";
    startBtn.disabled = true;

    // 1. Filter by selection
    let pool = allQuestions.filter(q => q.exam_type === 'POST-UTME');
    
    if (selectedUniversity !== 'ALL') {
        pool = pool.filter(q => q.university === selectedUniversity);
    }

    if (pool.length === 0) {
        alert("No questions found for this selection in the Vault!");
        startBtn.innerText = "Start Exam";
        startBtn.disabled = false;
        return;
    }

    // 2. Shuffle and take 20 (Sabi Logic)
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 20);

    // 3. Save Session for Arena.html to read
    localStorage.setItem('sabi_current_session', JSON.stringify({
        university: selectedUniversity,
        questions: shuffled,
        timestamp: new Date().getTime()
    }));

    // 4. Update Dashboard "Continue Prep" box
    localStorage.setItem('sabi_last_prep', JSON.stringify({
        exam: 'Post-UTME',
        subject: selectedUniversity
    }));

    // 5. GO!
    window.location.href = 'arena.html';
}
