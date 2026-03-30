// ==========================================
// SABI OS — ICAN MASTER VAULT ENGINE (V8)
// ==========================================

const icanVault = {
    // --- ATSWA SCHEME ---
    "ATS11": ["Basic Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_BA.pdf", "ATS 1", "📊"],
    "ATS12": ["Economics", "https://icanig.org/ican/assets/docs/atswa/2025_ECONS.pdf", "ATS 1", "📉"],
    "ATS13": ["Business Law", "https://icanig.org/ican/assets/docs/atswa/2025_BLaw.pdf", "ATS 1", "⚖️"],
    "ATS14": ["Communication Skills", "https://icanig.org/students/list/45.pdf", "ATS 1", "🗣️"],
    
    "ATS21": ["Financial Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_FA.pdf", "ATS 2", "📒"],
    "ATS22": ["Public Sector Accounting", "https://icanig.org/students/list/52.pdf", "ATS 2", "🏛️"],
    "ATS23": ["Quantitative Analysis", "https://icanig.org/ican/assets/docs/atswa/2025_QA.pdf", "ATS 2", "🧮"],
    "ATS25": ["Information Technology", "https://icanig.org/ican/assets/docs/atswa/2025_IT.pdf", "ATS 2", "💻"],
    
    "ATS32": ["Cost Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_CA.pdf", "ATS 3", "🏭"],
    "ATS33": ["Taxation", "https://icanig.org/ican/assets/docs/atswa/2025_TAX.pdf", "ATS 3", "🧾"],
    "ATS34": ["Auditing", "https://icanig.org/ican/assets/docs/atswa/2025_Aud.pdf", "ATS 3", "🔎"],
    "ATS35": ["Principles of Management", "https://icanig.org/ican/assets/docs/atswa/2025_MAN.pdf", "ATS 3", "👔"],

    // --- PROFESSIONAL PATH: FOUNDATION ---
    "ICF1": ["Financial Accounting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20FA%20-%20QC.pdf", "FOUNDATION", "📑"],
    // Professional Foundation Economics - NOW UNLOCKED
"ICF2": ["Economics", "https://icanig.org/ican/assets/docs/atswa/2025_ECONS.pdf", "FOUNDATION", "📉"],

    "ICF3": ["Business Environment", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20BE%20-%20QC.pdf", "FOUNDATION", "📊"],
    "ICF4": ["Corporate & Business Law", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20CBL%20-%20QC.pdf", "FOUNDATION", "⚖️"],

    // --- PROFESSIONAL PATH: SKILLS ---
    "ICS1": ["Financial Reporting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20FR%20-%20QC.pdf", "SKILLS", "💰"],
    "ICS2": ["Audit, Assurance & Forensic", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20AAF.pdf", "SKILLS", "🔍"],
    "ICS3": ["Taxation", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20TAXATION%20-%20QC.pdf", "SKILLS", "📝"],
    "ICS4": ["Performance Management", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20PM%20%20-%20QC.pdf", "SKILLS", "📈"],
    "ICS5": ["Management Accounting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20MA%20-%20QC.pdf", "SKILLS", "🏗️"],
    "ICS6": ["Financial Management", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20%20FM%20-%20QC.pdf", "SKILLS", "🏦"],

    // --- PROFESSIONAL PATH: PROFESSIONAL ---
    "ICP1": ["Strategic Business Reporting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20SBR%20-%20QC.pdf", "PROFESSIONAL", "📋"],
    "ICP2": ["Strategic Financial Mgmt.", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20SFM%20-%20QC.pdf", "PROFESSIONAL", "💼"],
    "ICP3": ["Advanced Audit & Assurance", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20AAAF%20-%20QC.pdf", "PROFESSIONAL", "🔬"],
    "ICP4": ["Advanced Taxation", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20ADV%20TAX%20-%20QC.pdf", "PROFESSIONAL", "📝"],
    "ICP5": ["Public Sector (PSAF)", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20%20PSAF%20-%20QC.pdf", "PROFESSIONAL", "🏛️"],
    "ICP6": ["Case Study", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20CS%20-%20QC.pdf", "PROFESSIONAL", "🧠"]
};

function openSabiReader(url) {
    if (!url || url === '#') return;
    localStorage.setItem('sabi_current_pdf', url);
    window.location.href = `reader.html?url=${encodeURIComponent(url)}`;
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

        const matches = Object.keys(icanVault).filter(key => {
            const title = icanVault[key][0].toUpperCase();
            const tag = icanVault[key][2].toUpperCase();
            return title.includes(query) || tag.includes(query) || key.includes(query);
        });

        if (matches.length > 0) {
            resultsList.innerHTML = matches.map(key => {
                const book = icanVault[key];
                let cssClass = "tag-pro";
                if (book[2].includes("ATS")) cssClass = "tag-ats";
                if (book[2].includes("FOUNDATION")) cssClass = "tag-foundation";
                if (book[2].includes("SKILLS")) cssClass = "tag-skills";

                return `
                    <div class="book-card" onclick="openSabiReader('${book[1]}')">
                        <div class="book-cover">${book[3]}</div>
                        <div class="book-info">
                            <span class="lib-tag ${cssClass}">${book[2]}</span>
                            <div class="book-title">${book[0]}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            resultsList.innerHTML = `<p style="text-align:center; padding:40px; color:#A1A1AA;">No matching ICAN packs found.</p>`;
        }
    });
});
