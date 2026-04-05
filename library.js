/**
 * SABI INTELLIGENCE ENGINE v12.0 (The Brain)
 * Features: Synonym Mapping, Semantic Tokens, and Visual Highlighting.
 */

// 1. THE SYNONYM DICTIONARY (Expand this as you go!)
const SABI_SYNONYMS = {
    "MATH": ["MTH", "MATHEMATICS"],
    "ENG": ["GST", "ENGLISH", "COMMUNICATION"],
    "ACC": ["ACCOUNTING", "ACCOUNTANCY"],
    "BIO": ["BIOLOGY", "BIOLOGICAL"],
    "ECO": ["ECONOMICS", "ECONOMY"],
    "GOV": ["POL", "GOVERNMENT", "POLITICAL"],
    "LAW": ["PUL", "JIL", "CLL", "LEGAL"]
};

// 2. THE HIGHLIGHTER (Makes the match pop)
function highlightMatch(text, query) {
    if (!query) return text;
    const words = query.split(/\s+/).filter(w => w.length > 1);
    let highlighted = text;
    words.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        highlighted = highlighted.replace(regex, `<mark class="sabi-match">$1</mark>`);
    });
    return highlighted;
}

// 3. THE BRAIN: SCORE CALCULATION
function calculateRelevance(code, title, query) {
    let score = 0;
    const rawQuery = query.toUpperCase().trim();
    const queryWords = rawQuery.split(/\s+/);
    
    const targetCode = code.toUpperCase();
    const targetTitle = title.toUpperCase();

    // Check Synonyms
    let expandedQuery = [...queryWords];
    queryWords.forEach(word => {
        if (SABI_SYNONYMS[word]) {
            expandedQuery = expandedQuery.concat(SABI_SYNONYMS[word]);
        }
    });

    expandedQuery.forEach(word => {
        if (word.length < 2) return;

        // Exact Code Match (The Holy Grail)
        if (targetCode.replace(/\s/g, '') === word) score += 5000;

        // Partial Code Match
        if (targetCode.includes(word)) {
            score += targetCode.startsWith(word) ? 1000 : 500;
        }

        // Title Match
        if (targetTitle.includes(word)) {
            score += targetTitle.startsWith(word) ? 800 : 300;
        }
    });

    return score;
}

// 4. MAIN SEARCH HANDLER
function performSmartSearch() {
    if (typeof isVaultLoaded === 'undefined' || !isVaultLoaded) return;

    const input = document.getElementById('libSearchInput');
    const resultsList = document.getElementById('results-list');
    const query = input.value.trim();

    if (query.length < 2) {
        resultsList.innerHTML = '';
        return;
    }

    const scoredData = Object.keys(sabiVault).map(code => {
        const title = sabiVault[code][0];
        const url = sabiVault[code][1];
        return {
            code,
            title,
            url,
            score: calculateRelevance(code, title, query)
        };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

    // Render with Highlighting
    resultsList.innerHTML = scoredData.slice(0, 15).map(item => `
        <div class="book-card" onclick="openSabiReader('${item.url}')">
          <div class="book-cover">📗</div>
          <div class="book-info">
            <span class="noun-tag">${highlightMatch(item.code, query)}</span>
            <div class="book-title" style="color:white; font-weight:700;">
                ${highlightMatch(item.title, query)}
            </div>
            <div class="book-author">Official NOUN Courseware</div>
          </div>
        </div>
    `).join('');
}

// 5. DEBOUNCED INPUT (Wait for user to stop typing)
let searchTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('libSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSmartSearch();
            }, 300); // Wait 300ms
        });
    }
});
