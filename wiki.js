// ==========================================
// SABI WIKI ROULETTE: THE INFINITE VAULT
// ==========================================

const academicTopics = [
    // --- BIOLOGICAL & HEALTH SCIENCES ---
    "Cell_biology", "Mitosis", "Meiosis", "Photosynthesis", "CRISPR", "Genetics", "DNA_replication", 
    "Protein_biosynthesis", "Enzyme", "Metabolism", "Antibiotic_resistance", "Immunology", "Virology", 
    "Epidemiology", "Human_anatomy", "Neuroscience", "Endocrine_system", "Homeostasis", "Ecology", 
    "Biodiversity", "Evolutionary_biology", "Microbiology", "Botany", "Zoology", "Marine_biology",

    // --- PHYSICAL SCIENCES & MATH ---
    "Quantum_mechanics", "General_relativity", "Thermodynamics", "Electromagnetism", "Particle_physics", 
    "Dark_matter", "Black_hole", "Big_Bang", "Organic_chemistry", "Inorganic_chemistry", "Biochemistry", 
    "Analytical_chemistry", "Calculus", "Linear_algebra", "Statistics", "Probability_theory", 
    "Number_theory", "Topology", "Fibonacci_sequence", "Cryptography", "Chaos_theory",

    // --- COMPUTING & TECHNOLOGY ---
    "Artificial_intelligence", "Machine_learning", "Deep_learning", "Neural_network", "Data_science", 
    "Big_data", "Cloud_computing", "Cybersecurity", "Blockchain", "Cryptocurrency", "Internet_of_things", 
    "Software_engineering", "Algorithm", "Database_management_system", "Operating_system", 
    "Computer_network", "Human–computer_interaction", "Robotics", "Virtual_reality",

    // --- LAW & CRIMINOLOGY ---
    "Jurisprudence", "Constitutional_law", "Criminal_law", "Civil_law", "International_law", 
    "Human_rights", "Administrative_law", "Contract_law", "Tort", "Equity_(law)", "Habeas_corpus", 
    "Rule_of_law", "Criminology", "Forensic_science", "Victimology", "Criminal_justice", 
    "Penology", "Cybercrime", "Intellectual_property",

    // --- ECONOMICS & MANAGEMENT ---
    "Macroeconomics", "Microeconomics", "Econometrics", "Inflation", "Gross_domestic_product", 
    "Fiscal_policy", "Monetary_policy", "Supply_and_demand", "Game_theory", "Behavioral_economics", 
    "Development_economics", "International_trade", "Entrepreneurship", "Strategic_management", 
    "Marketing_research", "Human_resource_management", "Organizational_behavior", "Accounting", 
    "Financial_audit", "Corporate_finance",

    // --- SOCIAL SCIENCES & HUMANITIES ---
    "Sociology", "Psychology", "Cognitive_dissonance", "Behavioral_psychology", "Social_psychology", 
    "Political_science", "International_relations", "Geopolitics", "Public_administration", 
    "Anthropology", "Archaeology", "Linguistics", "Philosophy", "Ethics", "Logic", "Epistemology", 
    "Metaphysics", "Stoicism", "Existentialism", "Socratic_method", "Renaissance", "Enlightenment",

    // --- RESEARCH & ACADEMIA ---
    "Scientific_method", "Qualitative_research", "Quantitative_research", "Peer_review", 
    "Academic_writing", "Critical_thinking", "Information_literacy", "Pedagogy", "Epistemology"
];

let lastTopic = ""; // Prevents immediate repeats

function spinWikiRoulette() {
    const loadingState = document.getElementById('loading-state');
    const contentState = document.getElementById('content-state');
    const diceBtn = document.getElementById('dice-btn');
    const bigLoader = document.getElementById('big-loader');
    
    const titleEl = document.getElementById('wiki-title');
    const summaryEl = document.getElementById('wiki-summary');
    const imageEl = document.getElementById('wiki-image');

    // 1. ANIMATION START
    loadingState.style.display = 'flex';
    contentState.style.display = 'none';
    diceBtn.classList.add('btn-rolling'); 
    bigLoader.classList.add('is-rolling');

    // 2. PICK A TOPIC (Anti-Repeat Logic)
    let randomTopic = academicTopics[Math.floor(Math.random() * academicTopics.length)];
    while (randomTopic === lastTopic) {
        randomTopic = academicTopics[Math.floor(Math.random() * academicTopics.length)];
    }
    lastTopic = randomTopic;

    // 3. FETCH DATA (With Cache Buster)
    const wikiAPI = `https://en.wikipedia.org/api/rest_v1/page/summary/${randomTopic}?cb=${new Date().getTime()}`;

    fetch(wikiAPI)
        .then(response => response.json())
        .then(data => {
            titleEl.innerText = data.title;
            summaryEl.innerText = data.extract;
            
            if(data.thumbnail) {
                imageEl.src = data.thumbnail.source;
                imageEl.style.display = 'block';
            } else {
                imageEl.style.display = 'none';
            }

            currentWikiUrl = data.content_urls.desktop.page;

            // 4. ANIMATION STOP
            setTimeout(() => {
                loadingState.style.display = 'none';
                contentState.style.display = 'flex';
                diceBtn.classList.remove('btn-rolling'); 
                bigLoader.classList.remove('is-rolling');
            }, 600); // 0.6s is the perfect time for one full "ultra-smooth" roll
            
        })
        .catch(error => {
            console.error("Wiki Engine Error:", error);
            titleEl.innerText = "Sabi Vault Offline";
            summaryEl.innerText = "Could not fetch the archive. Check your network connection.";
            loadingState.style.display = 'none';
            contentState.style.display = 'flex';
            diceBtn.classList.remove('btn-rolling'); 
            bigLoader.classList.remove('is-rolling');
        });
}
// ==========================================
// 5. BOOT SEQUENCE (Auto-Load on Startup)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // This triggers the first "spin" automatically
    spinWikiRoulette();
});

// Optional: Global declaration to prevent reference errors
let currentWikiUrl = ""; 
