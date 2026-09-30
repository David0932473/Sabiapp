// ==========================================
// SABI OS — ICAN MASTER VAULT ENGINE (V8)
// ==========================================

const icanVault = {
    // --- ATSWA SCHEME ---
    "ATS11": ["Basic Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_BA.pdf", "ATS 1", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"></line><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"></line><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"></line></svg>"],
    "ATS12": ["Economics", "https://icanig.org/ican/assets/docs/atswa/2025_ECONS.pdf", "ATS 1", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"23 18 13.5 8.5 8.5 13.5 1 6\"></polyline><polyline points=\"17 18 23 18 23 12\"></polyline></svg>"],
    "ATS13": ["Business Law", "https://icanig.org/ican/assets/docs/atswa/2025_BLaw.pdf", "ATS 1", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"></path><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"></path><path d=\"M7 21h10\"></path><path d=\"M12 3v18\"></path><path d=\"M3 7h18\"></path></svg>"],
    "ATS14": ["Communication Skills", "https://icanig.org/students/list/45.pdf", "ATS 1", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path></svg>"],
    
    "ATS21": ["Financial Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_FA.pdf", "ATS 2", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"></path><path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"></path></svg>"],
    "ATS22": ["Public Sector Accounting", "https://icanig.org/students/list/52.pdf", "ATS 2", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"3\" y1=\"22\" x2=\"21\" y2=\"22\"></line><line x1=\"6\" y1=\"18\" x2=\"6\" y2=\"11\"></line><line x1=\"10\" y1=\"18\" x2=\"10\" y2=\"11\"></line><line x1=\"14\" y1=\"18\" x2=\"14\" y2=\"11\"></line><line x1=\"18\" y1=\"18\" x2=\"18\" y2=\"11\"></line><polygon points=\"12 2 20 7 4 7\"></polygon></svg>"],
    "ATS23": ["Quantitative Analysis", "https://icanig.org/ican/assets/docs/atswa/2025_QA.pdf", "ATS 2", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"></rect><line x1=\"8\" y1=\"6\" x2=\"16\" y2=\"6\"></line><line x1=\"16\" y1=\"14\" x2=\"16\" y2=\"18\"></line><path d=\"M16 10h.01\"></path><path d=\"M12 10h.01\"></path><path d=\"M8 10h.01\"></path><path d=\"M12 14h.01\"></path><path d=\"M8 14h.01\"></path><path d=\"M12 18h.01\"></path><path d=\"M8 18h.01\"></path></svg>"],
    "ATS25": ["Information Technology", "https://icanig.org/ican/assets/docs/atswa/2025_IT.pdf", "ATS 2", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><line x1=\"2\" y1=\"20\" x2=\"22\" y2=\"20\"></line></svg>"],
    
    "ATS32": ["Cost Accounting", "https://icanig.org/ican/assets/docs/atswa/2025_CA.pdf", "ATS 3", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z\"></path></svg>"],
    "ATS33": ["Taxation", "https://icanig.org/ican/assets/docs/atswa/2025_TAX.pdf", "ATS 3", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"></path><line x1=\"8\" y1=\"7\" x2=\"16\" y2=\"7\"></line><line x1=\"8\" y1=\"11\" x2=\"16\" y2=\"11\"></line><line x1=\"8\" y1=\"15\" x2=\"13\" y2=\"15\"></line></svg>"],
    "ATS34": ["Auditing", "https://icanig.org/ican/assets/docs/atswa/2025_Aud.pdf", "ATS 3", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg>"],
    "ATS35": ["Principles of Management", "https://icanig.org/ican/assets/docs/atswa/2025_MAN.pdf", "ATS 3", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path><circle cx=\"9\" cy=\"7\" r=\"4\"></circle><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"></path><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"></path></svg>"],

    // --- PROFESSIONAL PATH: FOUNDATION ---
    "ICF1": ["Financial Accounting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20FA%20-%20QC.pdf", "FOUNDATION", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"></path><path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"></path></svg>"],
    // Professional Foundation Economics - NOW UNLOCKED
"ICF2": ["Economics", "https://icanig.org/ican/assets/docs/atswa/2025_ECONS.pdf", "FOUNDATION", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"23 18 13.5 8.5 8.5 13.5 1 6\"></polyline><polyline points=\"17 18 23 18 23 12\"></polyline></svg>"],

    "ICF3": ["Business Environment", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20BE%20-%20QC.pdf", "FOUNDATION", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"></line><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"></line><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"></line></svg>"],
    "ICF4": ["Corporate & Business Law", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20CBL%20-%20QC.pdf", "FOUNDATION", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"></path><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"></path><path d=\"M7 21h10\"></path><path d=\"M12 3v18\"></path><path d=\"M3 7h18\"></path></svg>"],

    // --- PROFESSIONAL PATH: SKILLS ---
    "ICS1": ["Financial Reporting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20FR%20-%20QC.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"23\"></line><path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"></path></svg>"],
    "ICS2": ["Audit, Assurance & Forensic", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20AAF.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg>"],
    "ICS3": ["Taxation", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20TAXATION%20-%20QC.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"></path><line x1=\"8\" y1=\"7\" x2=\"16\" y2=\"7\"></line><line x1=\"8\" y1=\"11\" x2=\"16\" y2=\"11\"></line><line x1=\"8\" y1=\"15\" x2=\"13\" y2=\"15\"></line></svg>"],
    "ICS4": ["Performance Management", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20PM%20%20-%20QC.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"23 6 13.5 15.5 8.5 10.5 1 18\"></polyline><polyline points=\"17 6 23 6 23 12\"></polyline></svg>"],
    "ICS5": ["Management Accounting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20MA%20-%20QC.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"12 2 2 7 12 12 22 7 12 2\"></polygon><polyline points=\"2 17 12 22 22 17\"></polyline><polyline points=\"2 12 12 17 22 12\"></polyline></svg>"],
    "ICS6": ["Financial Management", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20%20FM%20-%20QC.pdf", "SKILLS", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"10\" width=\"18\" height=\"11\" rx=\"2\"></rect><path d=\"M12 2 3 7h18l-9-5Z\"></path></svg>"],

    // --- PROFESSIONAL PATH: PROFESSIONAL ---
    "ICP1": ["Strategic Business Reporting", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20SBR%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"></path><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\" ry=\"1\"></rect><line x1=\"8\" y1=\"11\" x2=\"16\" y2=\"11\"></line><line x1=\"8\" y1=\"15\" x2=\"16\" y2=\"15\"></line></svg>"],
    "ICP2": ["Strategic Financial Mgmt.", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20SFM%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"></path></svg>"],
    "ICP3": ["Advanced Audit & Assurance", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20AAAF%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polygon points=\"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76\"></polygon></svg>"],
    "ICP4": ["Advanced Taxation", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20ADV%20TAX%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 20h9\"></path><path d=\"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z\"></path></svg>"],
    "ICP5": ["Public Sector (PSAF)", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20%20PSAF%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"3\" y1=\"22\" x2=\"21\" y2=\"22\"></line><line x1=\"6\" y1=\"18\" x2=\"6\" y2=\"11\"></line><line x1=\"10\" y1=\"18\" x2=\"10\" y2=\"11\"></line><line x1=\"14\" y1=\"18\" x2=\"14\" y2=\"11\"></line><line x1=\"18\" y1=\"18\" x2=\"18\" y2=\"11\"></line><polygon points=\"12 2 20 7 4 7\"></polygon></svg>"],
    "ICP6": ["Case Study", "https://icanig.org/ican/assets/docs/pro-study-texts-2025/ICAN%202025%20STUDY%20TEXT%20-%20CS%20-%20QC.pdf", "PROFESSIONAL", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 18h6\"></path><path d=\"M10 22h4\"></path><path d=\"M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z\"></path></svg>"]
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
