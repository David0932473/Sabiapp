/**
 * SABI MASTER ENGINE v8.0 (Anti-Flicker Glass Pills)
 * Features: Tab Switcher, Smart Search, Caching UI, Reader Handoff
 */

// ==========================================
// 1. TAB & MENU SWITCHER
// ==========================================
function setTab(element, category) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  
  const resultsList = document.getElementById('results-list');
  const nerdcGrid = document.getElementById('nerdc-grid');
  const profGrid = document.getElementById('professional-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('libSearchInput');
  const suggBox = document.getElementById('search-suggestions');

  if (suggBox) suggBox.classList.add('hidden');

  [resultsList, nerdcGrid, profGrid].forEach(el => {
    if (el) { el.classList.add('hidden'); el.classList.remove('visible-grid'); }
  });

  if (category === 'pro') {
    profGrid.classList.remove('hidden');
    profGrid.classList.add('visible-grid'); 
    searchInput.placeholder = "Search Professional Manuals...";
  } else if (category === 'secondary') {
    nerdcGrid.classList.remove('hidden'); 
    searchInput.placeholder = "Search WAEC/NECO Textbooks...";
  } else {
    resultsList.classList.remove('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    searchInput.placeholder = "Search BIO101 or Biology...";
  }
}

// ==========================================
// 2. LIVE AUTOCOMPLETE SUGGESTIONS (Anti-Flicker)
// ==========================================
let lastMatchState = ""; // This tracks the current pills on screen

function handleSuggestions() {
  const input = document.getElementById('libSearchInput');
  const suggBox = document.getElementById('search-suggestions');
  
  const rawQuery = input.value.trim().toUpperCase();
  const queryCode = rawQuery.replace(/\s/g, '');

  if (!rawQuery) {
    suggBox.innerHTML = '';
    suggBox.classList.add('hidden');
    lastMatchState = ""; // Reset memory when search is cleared
    return;
  }

  if (typeof sabiVault === 'undefined') return;

  const matches = Object.keys(sabiVault).filter(code => {
    const title = sabiVault[code][0].toUpperCase();
    return code.includes(queryCode) || title.includes(rawQuery);
  }).slice(0, 2); 

  // CREATE A SIGNATURE FOR THE RESULTS (e.g. "BIO101,BIO102")
  const currentState = matches.length > 0 ? matches.join(',') : "NOT_FOUND";

  // THE MAGIC: If the results are exactly the same as last time, do absolutely nothing!
  if (currentState === lastMatchState && !suggBox.classList.contains('hidden')) {
    return; 
  }

  // Update memory with new state
  lastMatchState = currentState;

  if (matches.length > 0) {
    suggBox.innerHTML = matches.map(code => {
      const title = sabiVault[code][0];
      return `
        <div class="suggestion-pill" onclick="selectSuggestion('${code}')">
          <div class="pill-left">
            <div class="pill-icon">⚡</div>
            <div class="pill-text">
              <span class="pill-code">${code}</span>
              <span class="pill-title">${title}</span>
            </div>
          </div>
          <div class="pill-action">OPEN</div>
        </div>
      `;
    }).join('');
    suggBox.classList.remove('hidden');
  } else {
    suggBox.innerHTML = `
      <div class="suggestion-pill" style="justify-content:center; background: rgba(255, 77, 77, 0.05); border-color: rgba(255, 77, 77, 0.2);">
        <span class="pill-title" style="color:#FF4D4D; font-size:12px;">No material found for "${input.value}"</span>
      </div>
    `;
    suggBox.classList.remove('hidden');
  }
}

function selectSuggestion(code) {
  document.getElementById('libSearchInput').value = code;
  document.getElementById('search-suggestions').classList.add('hidden');
  lastMatchState = ""; // Clear memory
  executeVaultSearch(); 
}

// ==========================================
// 3. MAIN SEARCH ENGINE (Multiple Results)
// ==========================================
function executeVaultSearch() {
  const input = document.getElementById('libSearchInput');
  const resultsList = document.getElementById('results-list');
  const suggBox = document.getElementById('search-suggestions');
  
  const rawQuery = input.value.trim().toUpperCase();
  const queryCode = rawQuery.replace(/\s/g, '');

  if (!rawQuery) return;

  if(suggBox) suggBox.classList.add('hidden');
  document.getElementById('professional-grid').classList.add('hidden');
  document.getElementById('nerdc-grid').classList.add('hidden');
  resultsList.classList.remove('hidden');
  
  lastMatchState = ""; // Clear memory

  if (typeof sabiVault === 'undefined') {
    alert("System Error: Vault data not loaded. Check vault.js");
    return;
  }

  const matches = Object.keys(sabiVault).filter(code => {
    const title = sabiVault[code][0].toUpperCase();
    return code.includes(queryCode) || title.includes(rawQuery);
  });

  if (matches.length > 0) {
    resultsList.innerHTML = matches.map(code => {
      const title = sabiVault[code][0];
      const url = sabiVault[code][1];
      
      return `
        <div class="book-card" onclick="openSabiReader('${url}')">
          <div class="book-cover">📗</div>
          <div class="book-info">
            <span class="noun-tag">${code}</span>
            <div class="book-title" style="color:white; font-weight:700;">${title}</div>
            <div class="book-author">Official NOUN Courseware</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    resultsList.innerHTML = `
      <div style="text-align:center; padding:50px 20px; color:#6B7280;">
        <p>No material found for "${input.value}".</p>
        <p style="font-size:11px; margin-top:10px;">Try searching a specific code like BIO101 or a broader topic like 'Biology'.</p>
      </div>
    `;
  }
}

// ==========================================
// 4. READER HANDOFF
// ==========================================
function openSabiReader(pdfUrl) {
  if (!pdfUrl) return;
  localStorage.setItem('sabi_current_pdf', pdfUrl);
  window.location.href = `reader.html?url=${encodeURIComponent(pdfUrl)}`;
}

function openProSection(type) {
    alert("Opening " + type.toUpperCase() + " Section...");
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('libSearchInput');
  const suggBox = document.getElementById('search-suggestions');

  if (searchInput) {
    searchInput.addEventListener('input', handleSuggestions);
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if(suggBox) suggBox.classList.add('hidden');
        executeVaultSearch();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      if(suggBox) suggBox.classList.add('hidden');
      lastMatchState = ""; // Reset memory when clicking away
    }
  });
});
// ==========================================
// 5. UPDATED EVENT LISTENERS (Instant Search)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('libSearchInput');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // 1. Show the small pills (Dropdown)
      handleSuggestions(); 
      
      // 2. ALSO update the main results area (The circled area)
      // This makes the books appear instantly as you type!
      executeVaultSearch(); 
    });
    
    // Keep the Enter key logic just in case
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const suggBox = document.getElementById('search-suggestions');
        if(suggBox) suggBox.classList.add('hidden');
        executeVaultSearch();
      }
    });
  }
});
// Add this to the bottom of library.js to handle the nav indicator
document.addEventListener('DOMContentLoaded', () => {
    const indicator = document.getElementById('nav-indicator');
    const activeTab = document.querySelector('.nav-item.active');
    if (activeTab && indicator) {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
    }
});
