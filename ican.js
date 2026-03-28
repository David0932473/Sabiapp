// ==========================================
// SABI OS - ICAN MASTER ENGINE (V3)
// ==========================================

const icanVault = {
    "ICAN-SYL": ["Official ICAN Syllabus 2025", "https://icanig.org/ican/assets/docs/UPDATED_SYLLABUS_2025_APPENDIX6_No_Highlights.pdf", "Syllabus", "📜"],

    // --- ATS I (COMPLETE) ---
    "ATS11": ["Basic Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_BA.pdf", "ATS 1", "📊"],
    "ATS12": ["Economics", "https://icanig.org/students/list/46.pdf", "ATS 1", "📉"],
    "ATS13": ["Business Law", "https://icanig.org/ican/assets/docs/atswa/2025_BLaw.pdf", "ATS 1", "⚖️"],
    "ATS14": ["Communication Skills", "https://icanig.org/students/list/45.pdf", "ATS 1", "🗣️"],

    // --- ATS II ---
    "ATS21": ["Financial Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_FA.pdf", "ATS 2", "📒"],
    "ATS22": ["Public Sector Accounting", "https://icanig.org/students/list/52.pdf", "ATS 2", "🏛️"],
    "ATS23": ["Quantitative Analysis", "https://icanig.org/ican/assets/docs/atswa/2025_QA.pdf", "ATS 2", "🧮"],
    "ATS24": ["Business Law", "#", "ATS 2", "⚖️"],
    "ATS25": ["Information Technology", "https://icanig.org/ican/assets/docs/atswa/2025_IT.pdf", "ATS 2", "💻"],

    // --- ATS III (UPDATED) ---
    "ATS31": ["Advanced Financial Accounting", "#", "ATS 3", "📈"],
    "ATS32": ["Management Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_CA.pdf", "ATS 3", "🏭"],
    "ATS33": ["Taxation", "https://icanig.org/ican/assets/docs/atswa/2025_TAX.pdf", "ATS 3", "🧾"],
    "ATS34": ["Auditing", "https://icanig.org/ican/assets/docs/atswa/2025_Aud.pdf", "ATS 3", "🔎"],
    "ATS35": ["Principles of Management", "https://icanig.org/ican/assets/docs/atswa/2025_MAN.pdf", "ATS 3", "👔"],

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

function openSabiReader(pdfUrl) {
    if (!pdfUrl || pdfUrl === '#') {
        console.log("Locked.");
        return;
    }
    localStorage.setItem('sabi_current_pdf', pdfUrl);
    window.location.href = `reader.html?url=${encodeURIComponent(pdfUrl)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('icanSearchInput');
    const resultsList = document.getElementById('results-list');
    const defaultGrid = document.getElementById('ican-grid');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toUpperCase().trim();

        if (query.length < 2) {
            resultsList.classList.add('hidden');
            defaultGrid.classList.remove('hidden');
            return;
        }

        defaultGrid.classList.add('hidden');
        resultsList.classList.remove('hidden');

        const matches = Object.keys(icanVault).filter(code => {
            const title = icanVault[code][0].toUpperCase();
            return code.includes(query) || title.includes(query);
        });

        if (matches.length > 0) {
            resultsList.innerHTML = matches.map(code => {
                const title = icanVault[code][0];
                const url = icanVault[code][1];
                const tag = icanVault[code][2];
                const emoji = icanVault[code][3] || "📘";
                const isLocked = (url === "#");

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
                <p style="font-size: 12px; margin-top: 5px;">Try "Taxation" or "ATS1"</p>
              </div>
            `;
        }
    });
});
