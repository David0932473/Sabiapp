// ==========================================
// SABI OS - ICAN MASTER ENGINE (COMPLETE)
// ==========================================

/**
 * THE ICAN VAULT (28 Subjects + Syllabus)
 * FORMAT: "CODE": ["Title", "URL", "Tag/Level", "Emoji"]
 */
const icanVault = {
    // SYLLABUS (ACTIVATED)
    "ICAN-SYL": ["Official ICAN Syllabus 2025", "https://icanig.org/ican/assets/docs/UPDATED_SYLLABUS_2025_APPENDIX6_No_Highlights.pdf", "Syllabus", "📜"],

    // --- ATS I ---
    "ATS11": ["Basic Accounting", "#", "ATS 1", "📊"],
    "ATS12": ["Economics", "#", "ATS 1", "📉"],
    "ATS13": ["Business Law", "#", "ATS 1", "⚖️"],
    "ATS14": ["Communication Skills", "#", "ATS 1", "🗣️"],

    // --- ATS II ---
    "ATS21": ["Financial Accounting", "#", "ATS 2", "📒"],
    "ATS22": ["Public Sector Accounting", "#", "ATS 2", "🏛️"],
    "ATS23": ["Quantitative Analysis", "#", "ATS 2", "🧮"],
    "ATS24": ["Business Law", "#", "ATS 2", "⚖️"],
    "ATS25": ["Management Information", "#", "ATS 2", "💻"],

    // --- ATS III ---
    "ATS31": ["Advanced Financial Accounting", "#", "ATS 3", "📈"],
    "ATS32": ["Management Accounting", "#", "ATS 3", "🏭"],
    "ATS33": ["Taxation", "#", "ATS 3", "🧾"],
    "ATS34": ["Auditing", "#", "ATS 3", "🔎"],
    "ATS35": ["Principles of Management", "#", "ATS 3", "👔"],

    // --- FOUNDATION LEVEL ---
    "ICF1": ["Accounting", "#", "FOUNDATION", "📑"],
    "ICF2": ["Economics", "#", "FOUNDATION", "📉"],
    "ICF3": ["Management Information", "#", "FOUNDATION", "📊"],
    "ICF4": ["Business Law", "#", "FOUNDATION", "⚖️"],

    // --- SKILLS LEVEL ---
    "ICS1": ["Financial Reporting", "#", "SKILLS", "💰"],
    "ICS2": ["Audit and Assurance", "#", "SKILLS", "🔍"],
    "ICS3": ["Taxation", "#", "SKILLS", "📝"],
    "ICS4": ["Performance Management", "#", "SKILLS", "📈"],
    "ICS5": ["Financial Management", "#", "SKILLS", "🏦"],

    // --- PROFESSIONAL LEVEL ---
    "ICP1": ["Corporate Reporting", "#", "PROFESSIONAL", "📋"],
    "ICP2": ["Strategic Financial Management", "#", "PROFESSIONAL", "💼"],
    "ICP3": ["Advanced Audit and Assurance", "#", "PROFESSIONAL", "🔬"],
    "ICP4": ["Public Sector Accounting & Finance", "#", "PROFESSIONAL", "🏛️"],
    "ICP5": ["Case Study", "#", "PROFESSIONAL", "🧠"]
};

/**
 * PDF HANDOFF LOGIC
 * Opens the Sabi Reader with the provided PDF URL
 */
function openSabiReader(pdfUrl) {
    if (!pdfUrl || pdfUrl === '#') {
        console.log("Material locked. Add the link to the vault to unlock!");
        return;
    }
    localStorage.setItem('sabi_current_pdf', pdfUrl);
    window.location.href = `reader.html?url=${encodeURIComponent(pdfUrl)}`;
}

/**
 * SEARCH ENGINE LOGIC
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('icanSearchInput');
    const resultsList = document.getElementById('results-list');
    const defaultGrid = document.getElementById('ican-grid');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toUpperCase().trim();

        // If search is empty or too short, return to default grid
        if (query.length < 2) {
            resultsList.classList.add('hidden');
            defaultGrid.classList.remove('hidden');
            return;
        }

        // Switch View: Hide Grid, Show Search Results
        defaultGrid.classList.add('hidden');
        resultsList.classList.remove('hidden');

        // Filter through the master icanVault
        const matches = Object.keys(icanVault).filter(code => {
            const title = icanVault[code][0].toUpperCase();
            return code.includes(query) || title.includes(query);
        });

        if (matches.length > 0) {
            resultsList.innerHTML = matches.map(code => {
                const title = icanVault[code][0];
                const url = icanVault[code][1];
                const tag = icanVault[code][2];
                const emoji = icanVault[code][3] || "📘"; // Pulls emoji from 4th slot
                const isLocked = (url === "#");

                // Determine CSS Tag Class for Mint Blue / Gold / Indigo / Cyan
                let tagClass = "tag-pro";
                if (tag.includes("ATS")) tagClass = "tag-ats";
                if (tag.includes("FOUNDATION")) tagClass = "tag-foundation";
                if (tag.includes("SKILLS")) tagClass = "tag-skills";

                return `
                  <div class="book-card ${isLocked ? 'locked' : ''}" onclick="openSabiReader('${url}')">
                    <div class="book-cover">${emoji}</div>
                    <div class="book-info">
                      <span class="lib-tag ${tagClass}">${tag}</span>
                      <div class="book-title">${title}</div>
                      <div class="book-author">Official ICAN Study Pack</div>
                    </div>
                  </div>
                `;
            }).join('');
        } else {
            resultsList.innerHTML = `
              <div style="text-align:center; padding:60px 20px; color:#A1A1AA;">
                <div style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;">🔎</div>
                <p style="font-weight: 600;">No ICAN results for "${e.target.value}"</p>
                <p style="font-size: 12px; margin-top: 5px;">Try "Taxation", "ATS1", or "Accounting"</p>
              </div>
            `;
        }
    });
});
