// 1. INITIALIZE SUPABASE
// Replace these with your actual keys from Supabase Settings > API
const SUPABASE_URL = 'https://axmnhhazrjluviedaity.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bW5oaGF6cmpsdXZpZWRhaXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDc3MDUsImV4cCI6MjA5MDQ4MzcwNX0.qx1GdrgpEuqx37-ytGD2ZrG-NfpxXAvQIXPpnTwwqUg';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. STATE MANAGEMENT
let selectedUniversity = 'ALL';
let allUniversities = [];

/**
 * INITIALIZE PAGE
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchUniversities();
    
    // Set 'Universal Mix' as the default view
    const selectedDisplay = document.getElementById('selected-display');
    if(selectedDisplay) selectedDisplay.innerText = "Universal Mix";
});

/**
 * FETCH UNIQUE UNIVERSITIES FROM DATABASE
 * This ensures that as you add new schools to Supabase, they appear automatically.
 */
async function fetchUniversities() {
    const { data, error } = await _supabase
        .from('questions')
        .select('university')
        .eq('exam_type', 'POST-UTME');

    if (error) {
        console.error('Error fetching universities:', error);
        return;
    }

    // Get unique school names and remove nulls/duplicates
    const uniqueUnis = [...new Set(data.map(item => item.university))].filter(Boolean);
    allUniversities = uniqueUnis;
    renderUniversityCards(uniqueUnis);
}

/**
 * RENDER CARDS TO THE GRID
 */
function renderUniversityCards(unis) {
    const grid = document.getElementById('university-grid');
    
    // We don't clear the grid because 'Universal Mix' is hardcoded in HTML
    unis.forEach(uni => {
        if (uni === 'ALL') return; // Skip if 'ALL' is in data to avoid duplicates

        const card = document.createElement('div');
        card.className = 'uni-card';
        card.id = `card-${uni.replace(/\s+/g, '-')}`;
        card.onclick = () => selectUni(uni, card);

        card.innerHTML = `
            <div class="uni-icon">🏫</div>
            <div class="uni-info">
                <h3>${uni}</h3>
                <p>Post-UTME Vault</p>
            </div>
            <div class="selection-indicator"></div>
        `;
        grid.appendChild(card);
    });
}

/**
 * HANDLE SELECTION LOGIC
 */
function selectUni(uni, element) {
    // 1. Remove 'active' class from all cards
    const allCards = document.querySelectorAll('.uni-card');
    allCards.forEach(card => card.classList.remove('active'));

    // 2. Add 'active' class to the clicked card
    element.classList.add('active');

    // 3. Update State
    selectedUniversity = uni;
    
    // 4. Update UI Text
    const display = document.getElementById('selected-display');
    display.innerText = (uni === 'ALL') ? "Universal Mix" : uni;

    // Optional: Haptic feedback for mobile
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

/**
 * SEARCH / FILTER LOGIC
 */
function filterUnis() {
    const searchTerm = document.getElementById('uni-search').value.toLowerCase();
    const cards = document.querySelectorAll('.uni-card');

    cards.forEach(card => {
        const uniName = card.querySelector('h3').innerText.toLowerCase();
        if (uniName.includes(searchTerm)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

/**
 * LAUNCH ARENA (THE BRAIN)
 * Fetches 20 random questions based on selection and moves to the Arena.
 */
async function launchArena() {
    const startBtn = document.getElementById('start-btn');
    startBtn.innerText = "Loading Arena...";
    startBtn.disabled = true;

    try {
        // Build the query
        let query = _supabase
            .from('questions')
            .select('*')
            .eq('exam_type', 'POST-UTME');

        // If a specific school is chosen, filter by it. 
        // If 'ALL' is chosen, it pulls from every school.
        if (selectedUniversity !== 'ALL') {
            query = query.eq('university', selectedUniversity);
        }

        /** * RANDOMIZATION LOGIC 
         * We use the 'random' order to ensure a fresh experience.
         * Note: If 'random()' isn't a standard column, you might need a Supabase RPC.
         */
        const { data, error } = await query
            .limit(40); // Pull a pool of 40

        if (error) throw error;

        // Shuffle the results locally for extra randomness
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 20);

        // Save to LocalStorage so 'arena.html' can read it without a new network call
        localStorage.setItem('sabi_current_session', JSON.stringify({
            university: selectedUniversity,
            questions: shuffled,
            startTime: new Date().getTime()
        }));

        // Redirect to the Arena
        window.location.href = 'arena.html';

    } catch (err) {
        console.error("Arena Launch Failed:", err);
        alert("Failed to load questions. Check your internet connection.");
        startBtn.innerText = "Start Exam";
        startBtn.disabled = false;
    }
}
