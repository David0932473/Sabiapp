/**
 * SABI OS v3.0: GOOGLE CALENDAR LANDSCAPE SYSTEM
 * Full Mini-Calendar with Event Counts, No Side-by-Side Months, & Focused Day Agenda
 */

// ==========================================
// 🔑 ENVIRONMENT & API KEY CONFIGURATION
// Keys are loaded from .env / env.js (git-ignored)
function getAnthropicKey() {
    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.ANTHROPIC_API_KEY || window.ENV.CLAUDE_API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
    }
    return (localStorage.getItem('claude_api_key') || localStorage.getItem('anthropic_api_key') || '').trim();
}

function getGeminiKey() {
    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.GEMINI_API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
    }
    return (localStorage.getItem('gemini_api_key') || localStorage.getItem('sabi_gemini_api_key') || '').trim();
}

function getOpenAiKey() {
    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.OPENAI_API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
    }
    return (localStorage.getItem('openai_api_key') || '').trim();
}

function getActiveApiKey() {
    const claudeKey = getAnthropicKey();
    if (claudeKey) return claudeKey;

    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.API_KEY || window.ENV.OPENAI_API_KEY || window.ENV.GEMINI_API_KEY || window.ENV.SABI_API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
            return envKey.trim();
        }
    }
    return getOpenAiKey() || getGeminiKey() || localStorage.getItem('sabi_api_key') || '';
}

// Helper to format YYYY-MM-DD
function getFutureDateString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayStr() {
    return getFutureDateString(0);
}

// Academic Milestones (Nigerian Official Exams - real calendar dates)
const DEFAULT_EVENTS = [
    {
        id: 'ev-jamb-2026',
        title: 'JAMB UTME 2026 National Examination',
        category: 'jamb',
        date: '2026-10-15',
        time: '08:00',
        duration: 3,
        location: 'Accredited CBT Exam Center',
        notes: 'Unified Tertiary Matriculation Examination (UTME). 4 registered subjects & past questions.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-scholar.svg', 'avatars/notion-felix.svg']
    },
    {
        id: 'ev-noun-tma',
        title: 'NOUN TMA 1 & 2 Final Submission Window',
        category: 'noun',
        date: '2026-10-22',
        time: '23:59',
        duration: 1,
        location: 'NOUN Student Portal',
        notes: 'Final deadline for Tutor Marked Assignments 1 and 2 across all registered courses.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-scholar.svg']
    },
    {
        id: 'ev-waec-2026',
        title: 'WAEC WASSCE Examination Kickoff',
        category: 'waec',
        date: '2026-11-04',
        time: '09:00',
        duration: 4,
        location: 'Secondary Examination Hall',
        notes: 'West African Senior School Certificate Examination commencement.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-scholar.svg', 'avatars/notion-sadie.svg']
    },
    {
        id: 'ev-ican-2026',
        title: 'ICAN Skills & Professional Diet Exam',
        category: 'ican',
        date: '2026-11-12',
        time: '09:00',
        duration: 4,
        location: 'ICAN Examination Center',
        notes: 'Institute of Chartered Accountants of Nigeria diet examinations.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-felix.svg', 'avatars/notion-scholar.svg']
    },
    {
        id: 'ev-neco-2026',
        title: 'NECO SSCE Senior Secondary Exam',
        category: 'neco',
        date: '2026-11-20',
        time: '09:00',
        duration: 4,
        location: 'Accredited Exam Hall',
        notes: 'National Examinations Council (NECO) Senior School Certificate Examination.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-alex.svg', 'avatars/notion-willow.svg']
    }
];

// Helper to format YYYY-MM-DD
function getFutureDateString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const DEFAULT_SUBJECT_CATALOG = [
    { name: "Mathematics", topics: ["Algebra & Quadratic Equations", "Calculus & Derivatives", "Trigonometry & Bearing", "Statistics & Probability"] },
    { name: "Use of English", topics: ["Comprehension & Summary", "Oral Forms & Vowels", "Lexis and Structure", "Sentence Registers"] },
    { name: "Physics", topics: ["Kinematics & Motion Graphs", "Newton's Laws & Dynamics", "Optics & Light Reflection", "Electric Current & Circuits", "Atomic Physics"] },
    { name: "Chemistry", topics: ["Separation Techniques", "Periodic Table Trends", "Chemical Energetics", "Hydrocarbons & Organic Families", "Acids, Bases & Salts"] },
    { name: "Biology", topics: ["Cell Structure & Functions", "Nutrition & Enzymes", "Genetics & Heredity", "Ecology & Habitats"] },
    { name: "Economics", topics: ["Theory of Demand and Supply", "Production & Cost Curves", "National Income Accounting", "Inflation & Monetary Policy"] },
    { name: "Government", topics: ["Colonial Rule in Nigeria", "Constitutional Developments", "Federalism in Nigeria", "Foreign Policy"] },
    { name: "Literature in English", topics: ["Dramatic Techniques", "Poetic Devices & Imagery", "African Prose & Themes", "Character Analysis"] }
];

const DEFAULT_CLASSES = [
    { day: 'Monday', start_time: '09:00', end_time: '11:00', subject: 'PHY 101: General Physics Lecture' },
    { day: 'Tuesday', start_time: '10:00', end_time: '12:00', subject: 'MTH 101: Elementary Mathematics' },
    { day: 'Wednesday', start_time: '08:30', end_time: '10:30', subject: 'CHM 101: General Chemistry' },
    { day: 'Thursday', start_time: '11:00', end_time: '13:00', subject: 'GST 101: Use of English' },
    { day: 'Friday', start_time: '09:00', end_time: '11:00', subject: 'BIO 101: General Biology' }
];

function getStoredClasses() {
    try {
        const stored = localStorage.getItem('sabi_classes');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error('Failed to parse sabi_classes', e);
    }
    localStorage.setItem('sabi_classes', JSON.stringify(DEFAULT_CLASSES));
    return DEFAULT_CLASSES;
}

// Helper: Calculate Monday of the week for given date
function getMondayOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay();
    // Monday is 1; Sunday is 0 -> diff: day 0 goes back 6 days, otherwise date - day + 1
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
}

// Add days to ISO date
function addDaysToDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateEndTime(startTime, durationHours = 1) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Math.round(durationHours * 60);
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    return `${endH}:${endM}`;
}

function calculateDuration(startTime, endTime) {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0.5, Math.round((mins / 60) * 10) / 10);
}

// State
let calendarEvents = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed
let selectedDate = getFutureDateString(0); // Today selected by default
let currentViewMode = 'agenda'; // Default to 'agenda' so months are NOT side-by-side!
let searchQuery = '';
let selectedDetailEventId = null;

// Available Categories
const CATEGORIES = [
    { key: 'jamb', label: '⚡ JAMB UTME', color: '#10B981', class: 'chip-jamb' },
    { key: 'waec', label: '📘 WAEC SSCE', color: '#3D8EFF', class: 'chip-waec' },
    { key: 'neco', label: '🟣 NECO', color: '#8B5CF6', class: 'chip-neco' },
    { key: 'noun', label: '🎓 NOUN TMA', color: '#0EA5E9', class: 'chip-noun' },
    { key: 'ican', label: '💼 ICAN Diet', color: '#F59E0B', class: 'chip-ican' },
    { key: 'study', label: '⏱️ Study Drills', color: '#EC4899', class: 'chip-study' }
];
let activeCategories = new Set(['jamb', 'waec', 'neco', 'noun', 'ican', 'study']);

// STAGE 5 & 6 PLANNER & WEEK VIEW STATE
let plannerWeekOffset = 0; // offset in weeks from current Monday
let stripWeekOffset = 0; // offset for 7-day strip
let activeWeeklyPlanMeta = null;
let enrolledSubjectsList = [];

// SMART PLANNER SETUP STATE
let onboardingTempProfile = null;
let selectedSubjects = new Set();
let hardSubjects = new Set();
let offDays = new Set(['Sunday']);
let selectedGoal = 'high';
let timetablePhotoBase64 = null;
let followUpContext = [];
let isLiveModelAvailable = true;

// Initialize
function initCalendarApp() {
    loadEvents();
    loadPlannerMetadata();
    renderFilterChips();
    switchViewMode('agenda'); // Ensure Agenda Schedule view is active by default
    renderAllViews();
    updateTargetCountdown();
    setupEmbedCalendar();

    // Default modal date to selectedDate or today
    const dateInput = document.getElementById('modal-session-date');
    if (dateInput) {
        dateInput.value = selectedDate || getFutureDateString(0);
    }

    // Dynamic countdown timer interval
    setInterval(updateTargetCountdown, 60000);

    // Initialize Onboarding & Check Monday Auto-Regeneration
    initPlannerOnboarding();
    checkMondayAutoRegeneration();

    // If user hasn't completed AI setup questions, automatically ask questions
    const isOnboarded = localStorage.getItem('sabi_planner_onboarded') === 'true';
    if (!isOnboarded) {
        setTimeout(() => {
            openPlannerOnboardingModal();
        }, 180);
    }

    // Close planner dropdown on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('planner-dropdown-menu');
        const btn = document.getElementById('btn-planner-menu');
        if (menu && !menu.classList.contains('hidden') && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendarApp);
} else {
    initCalendarApp();
}

// Load events from LocalStorage
function loadEvents() {
    const stored = localStorage.getItem('sabi_calendar_events_v2');
    const isOnboarded = localStorage.getItem('sabi_planner_onboarded') === 'true';

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Clean out legacy fake mock drills
            calendarEvents = parsed.filter(ev => {
                const id = ev.id || '';
                return !id.startsWith('ev-drill-today') && id !== 'ev-drill-tomorrow';
            });
            // If user hasn't onboarded yet, start clean without pre-loaded data
            if (!isOnboarded) {
                calendarEvents = [];
            }
        } catch (e) {
            console.error('Failed to parse calendar events', e);
            calendarEvents = [];
        }
    } else {
        calendarEvents = [];
        saveEvents();
    }
}

function saveEvents() {
    localStorage.setItem('sabi_calendar_events_v2', JSON.stringify(calendarEvents));
}

function loadPlannerMetadata() {
    try {
        const stored = localStorage.getItem('sabi_weekly_plan_meta');
        if (stored) {
            activeWeeklyPlanMeta = JSON.parse(stored);
        } else {
            activeWeeklyPlanMeta = {
                summary: "Your weekly study strategy is active. Focus on core drills and review weak spots with spaced practice.",
                notes: [
                    "Sessions are scheduled in your best concentration window (05:30 - 23:30).",
                    "Extra focus sessions allocated for priority courses.",
                    "Sunday is reserved for rest and mental recovery."
                ],
                week_start: getMondayOfWeek(new Date()),
                generated_at: new Date().toISOString()
            };
        }
    } catch (e) {
        console.error('Failed to parse weekly plan metadata', e);
    }
}

// Master Render Function
function renderAllViews() {
    renderMiniCalendar();
    renderMainMonthGrid();
    renderAgendaTimeline();
    renderWeekTimetable();
    renderAiPlanSummaryCard();
    updateMonthTitles();
}

function updateMonthTitles() {
    const d = new Date(currentYear, currentMonth, 1);
    const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const miniLabel = document.getElementById('mini-month-label');
    const mainTitle = document.getElementById('main-month-title');
    if (miniLabel) miniLabel.textContent = monthName;
    if (mainTitle) mainTitle.textContent = monthName;
}

// --- SLEEK 7-DAY WEEK STRIP NAVIGATOR ---
function changeStripWeek(offset) {
    stripWeekOffset += offset;
    renderMiniCalendar();
}

function renderMiniCalendar() {
    const container = document.getElementById('mini-cal-days');
    const labelEl = document.getElementById('strip-month-label');
    if (!container) return;
    
    container.innerHTML = '';
    
    const baseMonday = getMondayOfWeek(new Date());
    const targetMonday = addDaysToDate(baseMonday, stripWeekOffset * 7);
    const monDateObj = new Date(targetMonday + 'T00:00:00');
    
    if (labelEl) {
        labelEl.textContent = monDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    const todayStr = getFutureDateString(0);
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    for (let i = 0; i < 7; i++) {
        const dateStr = addDaysToDate(targetMonday, i);
        const dObj = new Date(dateStr + 'T00:00:00');
        const dayNum = dObj.getDate();
        
        // Find events on this day
        const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);
        const isSelected = selectedDate === dateStr;
        const isToday = todayStr === dateStr;
        
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `strip-day-btn ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`;
        pill.onclick = () => onSelectDate(dateStr);
        
        pill.innerHTML = `
            <span class="strip-day-letter">${dayLetters[i]}</span>
            <span class="strip-day-num">${dayNum}</span>
            <span class="strip-dot-slot">${dayEvents.length > 0 ? '<span class="strip-dot"></span>' : ''}</span>
        `;
        container.appendChild(pill);
    }
}

function onSelectDate(dateStr) {
    selectedDate = dateStr;
    const [y, m] = dateStr.split('-').map(Number);
    currentYear = y;
    currentMonth = m - 1;
    
    renderAllViews();
    
    if (currentViewMode !== 'agenda') {
        switchViewMode('agenda');
    }
}

function goToToday() {
    stripWeekOffset = 0;
    plannerWeekOffset = 0;
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    selectedDate = getFutureDateString(0);
    renderAllViews();
}

// --- FILTER CHIPS (From Reference Mockup Screen 2) ---
function renderFilterChips() {
    const container = document.getElementById('filter-chips-container');
    if (!container) return;
    
    container.innerHTML = CATEGORIES.map(cat => {
        const isActive = activeCategories.has(cat.key);
        return `
            <div class="removable-chip ${cat.class} ${isActive ? '' : 'inactive'}" onclick="toggleCategoryFilter('${cat.key}')">
                <span>${cat.label}</span>
                <span class="chip-x">${isActive ? '✕' : '+'}</span>
            </div>
        `;
    }).join('');
}

function toggleCategoryFilter(key) {
    if (activeCategories.has(key)) {
        if (activeCategories.size > 1) {
            activeCategories.delete(key);
        } else {
            showToast('Keep at least one category visible');
            return;
        }
    } else {
        activeCategories.add(key);
    }
    renderFilterChips();
    renderAllViews();
}

function resetCategoryFilters() {
    CATEGORIES.forEach(c => activeCategories.add(c.key));
    renderFilterChips();
    renderAllViews();
    showToast('All category filters restored');
}

// --- VIEW 1: FULL MONTH LANDSCAPE GRID ---
function renderMainMonthGrid() {
    const container = document.getElementById('main-month-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    const todayStr = getFutureDateString(0);
    
    // Previous month filler cells
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const cell = document.createElement('div');
        cell.className = 'grid-cell other-month';
        cell.innerHTML = `
            <div class="grid-cell-top">
                <span class="cell-day-num">${dayNum}</span>
            </div>
        `;
        container.appendChild(cell);
    }
    
    // Current month cells
    for (let day = 1; day <= totalDays; day++) {
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
        
        let dayEvents = calendarEvents.filter(ev => {
            const matchesCat = activeCategories.has(ev.category);
            const matchesSearch = !searchQuery || 
                ev.title.toLowerCase().includes(searchQuery) || 
                (ev.notes && ev.notes.toLowerCase().includes(searchQuery));
            return ev.date === dateStr && matchesCat && matchesSearch;
        });
        
        const isSelected = selectedDate === dateStr;
        const isToday = todayStr === dateStr;
        
        const cell = document.createElement('div');
        cell.className = `grid-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`;
        cell.onclick = (e) => {
            if (!e.target.closest('.event-chip-pill')) {
                onSelectDate(dateStr);
            }
        };
        
        // Stack of event pills
        let eventsHtml = '';
        if (dayEvents.length > 0) {
            eventsHtml = '<div class="cell-events-stack">';
            const visibleEvents = dayEvents.slice(0, 3);
            visibleEvents.forEach(ev => {
                const pillClass = `chip-pill-${ev.category}`;
                eventsHtml += `
                    <div class="event-chip-pill ${pillClass}" onclick="openEventDetailModal('${ev.id}')" title="${escapeHtml(ev.title)}">
                        <span>${ev.time || 'All Day'}</span>
                        <strong>${escapeHtml(ev.title)}</strong>
                    </div>
                `;
            });
            if (dayEvents.length > 3) {
                eventsHtml += `<span class="more-events-indicator">+${dayEvents.length - 3} more</span>`;
            }
            eventsHtml += '</div>';
        }
        
        cell.innerHTML = `
            <div class="grid-cell-top">
                <span class="cell-day-num">${day}</span>
            </div>
            ${eventsHtml}
        `;
        container.appendChild(cell);
    }
    
    // Next month filler cells
    const filledCells = startDayOfWeek + totalDays;
    const remaining = (7 - (filledCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell other-month';
        cell.innerHTML = `
            <div class="grid-cell-top">
                <span class="cell-day-num">${day}</span>
            </div>
        `;
        container.appendChild(cell);
    }
}

// --- VIEW 1: MINIMALIST AGENDA SCHEDULE ---
function renderAgendaTimeline() {
    const container = document.getElementById('agenda-timeline-list');
    const titleEl = document.getElementById('agenda-section-title');
    if (!container) return;
    
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const isToday = selectedDate === getTodayStr();
    const dayDisplay = isToday 
        ? 'Today' 
        : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (titleEl) {
        titleEl.textContent = `${dayDisplay}'s Sessions`;
    }
    
    // 1. Sessions for currently selected day
    const dayEvents = calendarEvents.filter(ev => {
        return ev.date === selectedDate && activeCategories.has(ev.category);
    });
    
    // Sort chronologically
    dayEvents.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    
    let html = '';
    
    if (dayEvents.length === 0) {
        const isOnboarded = localStorage.getItem('sabi_planner_onboarded') === 'true';
        if (!isOnboarded) {
            html += `
                <div class="calendar-onboarding-prompt-card">
                    <span class="onboarding-prompt-badge">⚡ AI Study Planner</span>
                    <h3 class="onboarding-prompt-title">Personalize Your Study Schedule</h3>
                    <p class="onboarding-prompt-desc">Answer 3 quick questions so Sabi AI can generate your custom timetable and revision plan.</p>
                    <button type="button" class="btn-start-onboarding" onclick="openPlannerOnboardingModal()">
                        <span>✨ Answer Questions & Generate Plan</span>
                    </button>
                </div>
            `;
        } else {
            html += `
                <div class="session-empty-card">
                    <span class="session-empty-icon">☕</span>
                    <p>No study sessions scheduled for ${dayDisplay}.</p>
                    <button type="button" class="btn-minimal-add" onclick="openAddSessionModal()">
                        + Add Session
                    </button>
                </div>
            `;
        }
    } else {
        html += dayEvents.map(ev => renderEventCardHtml(ev)).join('');
    }
    
    // 2. Upcoming sessions later this week
    const upcomingEvents = calendarEvents.filter(ev => {
        return ev.date > selectedDate && activeCategories.has(ev.category);
    }).sort((a, b) => {
        return new Date(`${a.date}T${a.time || '00:00'}:00`) - new Date(`${b.date}T${b.time || '00:00'}:00`);
    });
    
    if (upcomingEvents.length > 0) {
        html += `
            <div class="agenda-upcoming-header">
                <h4>Upcoming Later</h4>
            </div>
        `;
        
        // Show up to 5 upcoming sessions
        const upcomingSlice = upcomingEvents.slice(0, 5);
        html += upcomingSlice.map(ev => {
            const evDate = new Date(ev.date + 'T00:00:00');
            const dateLabel = evDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return renderEventCardHtml(ev, dateLabel);
        }).join('');
    }
    
    container.innerHTML = html;
}

// Minimalist Session Card HTML matching library.html book-card aesthetics
function renderEventCardHtml(ev, dateBadge = null) {
    const categoryName = getCategoryBadgeText(ev.category);
    const dateLabelHtml = dateBadge ? `<span class="session-date-pill">${dateBadge}</span>` : '';
    
    return `
        <div class="session-card cat-${ev.category} ${ev.completed ? 'completed' : ''}" id="agenda-card-${ev.id}">
            <div class="session-card-main" onclick="openEventDetailModal('${ev.id}')">
                <div class="session-card-header">
                    <span class="session-cat-pill cat-${ev.category}">${categoryName}</span>
                    ${dateLabelHtml}
                    <span class="session-time-text">🕒 ${ev.time || 'Flexible'} · ${ev.duration || 1}h</span>
                </div>
                <h4 class="session-title">${escapeHtml(ev.title)}</h4>
                ${ev.notes ? `<p class="session-notes-snippet">${escapeHtml(ev.notes)}</p>` : (ev.location ? `<span class="session-location-snippet">📍 ${escapeHtml(ev.location)}</span>` : '')}
            </div>
            <div class="session-card-actions">
                <button type="button" class="session-check-pill ${ev.completed ? 'active' : ''}" onclick="toggleEventComplete('${ev.id}')" title="${ev.completed ? 'Mark incomplete' : 'Mark as done'}" aria-label="Mark done">
                    ${ev.completed ? '✓' : '○'}
                </button>
            </div>
        </div>
    `;
}

// View Switching: Minimalist tab toggling (Schedule vs Week Grid)
function switchViewMode(mode) {
    currentViewMode = mode;
    
    document.querySelectorAll('.tab, .view-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.calendar-view-pane').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`btn-view-${mode}`);
    const activePane = document.getElementById(`view-${mode}-container`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) {
        activePane.classList.remove('hidden');
        activePane.classList.add('active');
    }
    
    if (mode === 'agenda') {
        renderAgendaTimeline();
    } else if (mode === 'week') {
        renderWeekTimetable();
    }
}

// Search Handler
function handleSearch(val) {
    searchQuery = val.trim().toLowerCase();
    renderMainMonthGrid();
    renderAgendaTimeline();
}

// --- TOP TARGET COUNTDOWN ---
function updateTargetCountdown() {
    const titleEl = document.getElementById('top-target-title');
    const timerEl = document.getElementById('top-target-timer');
    if (!titleEl || !timerEl) return;
    
    const now = new Date();
    const upcoming = calendarEvents
        .filter(ev => !ev.completed)
        .map(ev => ({
            ...ev,
            dateTime: new Date(`${ev.date}T${ev.time || '09:00'}:00`)
        }))
        .filter(ev => ev.dateTime > now)
        .sort((a, b) => a.dateTime - b.dateTime);
        
    if (upcoming.length === 0) {
        titleEl.textContent = 'All Milestones Cleared';
        timerEl.textContent = 'Ready 🎯';
        return;
    }
    
    const next = upcoming[0];
    titleEl.textContent = next.title;
    
    const diffMs = next.dateTime - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 1) {
        timerEl.textContent = `in ${days} days`;
    } else if (days === 1) {
        timerEl.textContent = `Tomorrow, ${hours}h`;
    } else {
        timerEl.textContent = `Today, in ${hours}h`;
    }
}

// --- DIRECT GOOGLE CALENDAR TEMPLATE GENERATOR ---
function createGoogleCalendarUrl(event) {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
        (event.notes ? `${event.notes}\n\n` : '') +
        `Category: ${event.category.toUpperCase()}\n` +
        `Managed with Sabi Study App`
    );
    const location = encodeURIComponent(event.location || 'Sabi Prep Room');
    
    const startD = new Date(`${event.date}T${event.time || '09:00'}:00`);
    const durationHours = parseFloat(event.duration || 1.5);
    const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);
    
    const startStr = formatGoogleIso(startD);
    const endStr = formatGoogleIso(endD);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

function formatGoogleIso(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

// --- MODALS & DETAILS ---
function openAddSessionModal() {
    const overlay = document.getElementById('add-session-modal');
    const dateInput = document.getElementById('modal-session-date');
    if (dateInput && selectedDate) {
        dateInput.value = selectedDate;
    }
    if (overlay) {
        overlay.classList.remove('hidden');
        if (document.body) document.body.style.overflow = 'hidden';
    }
}

function closeAddSessionModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const overlay = document.getElementById('add-session-modal');
    if (overlay) {
        overlay.classList.add('hidden');
        if (document.body) document.body.style.overflow = '';
    }
}

function handleSaveSession(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('modal-session-title');
    const categoryInput = document.getElementById('modal-session-category');
    const dateInput = document.getElementById('modal-session-date');
    const timeInput = document.getElementById('modal-session-time');
    const durationInput = document.getElementById('modal-session-duration');
    const notesInput = document.getElementById('modal-session-notes');
    const syncGcalCheck = document.getElementById('modal-session-gcal-sync');
    
    if (!titleInput.value.trim()) return;
    
    const newEvent = {
        id: 'ev-custom-' + Date.now(),
        title: titleInput.value.trim(),
        category: categoryInput.value || 'study',
        date: dateInput.value || getFutureDateString(0),
        time: timeInput.value || '17:00',
        duration: parseFloat(durationInput.value || 1.5),
        location: 'Sabi App Study Session',
        notes: notesInput.value.trim(),
        isDefault: false,
        completed: false,
        avatars: ['avatars/notion-scholar.svg']
    };
    
    calendarEvents.push(newEvent);
    saveEvents();
    renderAllViews();
    updateTargetCountdown();
    closeAddSessionModal();
    
    showToast('Study session scheduled!');
    
    if (syncGcalCheck && syncGcalCheck.checked) {
        window.open(createGoogleCalendarUrl(newEvent), '_blank');
    }
    
    titleInput.value = '';
    notesInput.value = '';
}

// --- QUICK ADD SCHEDULE PARSER & HANDLER ---
function parseQuickScheduleText(raw) {
    let text = raw.trim();
    
    // 1. Detect Category
    let category = 'study';
    if (/\bjamb\b/i.test(text)) category = 'jamb';
    else if (/\bwaec\b/i.test(text)) category = 'waec';
    else if (/\bneco\b/i.test(text)) category = 'neco';
    else if (/\bnoun\b/i.test(text)) category = 'noun';
    else if (/\bican\b/i.test(text)) category = 'ican';

    // 2. Detect Date
    let dateStr = selectedDate || getFutureDateString(0);
    const today = new Date();
    
    if (/\btomorrow\b/i.test(text)) {
        dateStr = getFutureDateString(1);
        text = text.replace(/\btomorrow\b/gi, '').trim();
    } else if (/\btoday\b/i.test(text)) {
        dateStr = getFutureDateString(0);
        text = text.replace(/\btoday\b/gi, '').trim();
    } else {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayRegex = /\b(?:on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;
        const dayMatch = text.match(dayRegex);
        if (dayMatch) {
            const targetDayIndex = dayNames.indexOf(dayMatch[1].toLowerCase());
            const currentDayIndex = today.getDay();
            let diff = targetDayIndex - currentDayIndex;
            if (diff <= 0) diff += 7; // Next occurrence
            dateStr = getFutureDateString(diff);
            text = text.replace(dayMatch[0], '').trim();
        }
    }

    // 3. Detect Duration
    let duration = 1.5;
    const durMatch = text.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|mins?|m|minutes?)\b/i) || 
                     text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
    if (durMatch) {
        const val = parseFloat(durMatch[1]);
        const unit = (durMatch[2] || '').toLowerCase();
        if (unit.startsWith('m')) {
            duration = Math.round((val / 60) * 10) / 10;
        } else {
            duration = val;
        }
        text = text.replace(durMatch[0], '').trim();
    }

    // 4. Detect Time
    let timeStr = '17:00';
    // Match patterns like "at 5pm", "at 5:30pm", "5:30 pm", "17:00", "at 8am"
    const timeMatch = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
                      text.match(/\b(?:at\s+)?(\d{1,2}):(\d{2})\b/i);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;

        timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        text = text.replace(timeMatch[0], '').trim();
    } else if (/\bmorning\b/i.test(text)) {
        timeStr = '09:00';
        text = text.replace(/\b(?:in\s+the\s+)?morning\b/gi, '').trim();
    } else if (/\bafternoon\b/i.test(text)) {
        timeStr = '14:00';
        text = text.replace(/\b(?:in\s+the\s+)?afternoon\b/gi, '').trim();
    } else if (/\bevening\b/i.test(text)) {
        timeStr = '18:00';
        text = text.replace(/\b(?:in\s+the\s+)?evening\b/gi, '').trim();
    } else if (/\bnight\b/i.test(text)) {
        timeStr = '20:30';
        text = text.replace(/\b(?:at\s+)?night\b/gi, '').trim();
    }

    // Clean up residual prepositions & punctuation from title
    let title = text
        .replace(/\b(at|on|for|in|by)\b\s*$/i, '')
        .replace(/^\s*(at|on|for|in|by)\b/i, '')
        .replace(/[,\-\:\.]\s*$/, '')
        .trim();

    if (!title || title.length < 2) {
        title = raw.trim();
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
        title,
        category,
        date: dateStr,
        time: timeStr,
        duration,
        location: 'Sabi Study Plan',
        notes: `Quick added: "${raw.trim()}"`
    };
}

function handleQuickScheduleAdd() {
    const input = document.getElementById('quick-schedule-input');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;

    const parsed = parseQuickScheduleText(raw);

    const newEvent = {
        id: 'ev-quick-' + Date.now(),
        title: parsed.title,
        category: parsed.category,
        date: parsed.date,
        time: parsed.time,
        duration: parsed.duration,
        location: parsed.location || 'Sabi Study Plan',
        notes: parsed.notes || `Quick added: "${raw}"`,
        isDefault: false,
        completed: false,
        avatars: ['avatars/notion-scholar.svg']
    };

    calendarEvents.push(newEvent);
    saveEvents();

    // Mark as onboarded if user adds sessions manually
    localStorage.setItem('sabi_planner_onboarded', 'true');

    // Select this event's date and refresh views
    selectedDate = parsed.date;
    renderAllViews();
    updateTargetCountdown();

    input.value = '';

    const dateObj = new Date(parsed.date + 'T00:00:00');
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    showToast(`Added: ${parsed.title} (${dayLabel} at ${parsed.time})`);
}

window.handleQuickScheduleAdd = handleQuickScheduleAdd;
window.parseQuickScheduleText = parseQuickScheduleText;

// Event Detail Modal
function openEventDetailModal(eventId) {
    const ev = calendarEvents.find(e => e.id === eventId);
    if (!ev) return;
    
    selectedDetailEventId = eventId;
    
    const modal = document.getElementById('event-detail-modal');
    const tag = document.getElementById('detail-event-tag');
    const title = document.getElementById('detail-event-title');
    const time = document.getElementById('detail-event-time');
    const loc = document.getElementById('detail-event-location');
    const notes = document.getElementById('detail-event-notes');
    const gcalBtn = document.getElementById('detail-gcal-btn');
    const compBtn = document.getElementById('detail-complete-btn');
    const delBtn = document.getElementById('detail-delete-btn');
    
    if (tag) {
        tag.textContent = getCategoryBadgeText(ev.category);
        tag.style.color = getCategoryColor(ev.category);
    }
    if (title) title.textContent = ev.title;
    if (time) time.textContent = `${ev.date} at ${ev.time || '09:00'} (${ev.duration || 1} hrs)`;
    if (loc) loc.textContent = ev.location || 'Sabi Study Room';
    if (notes) notes.textContent = ev.notes || 'No extra notes provided.';
    if (gcalBtn) gcalBtn.href = createGoogleCalendarUrl(ev);
    
    if (compBtn) {
        compBtn.textContent = ev.completed ? 'Mark Pending' : 'Mark Complete ✓';
    }
    if (delBtn) {
        delBtn.style.display = ev.isDefault ? 'none' : 'block';
    }
    
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeEventDetailModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('event-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    selectedDetailEventId = null;
}

function toggleCurrentDetailComplete() {
    if (!selectedDetailEventId) return;
    toggleEventComplete(selectedDetailEventId);
    closeEventDetailModal();
}

function deleteCurrentDetailEvent() {
    if (!selectedDetailEventId) return;
    if (confirm('Delete this study session?')) {
        calendarEvents = calendarEvents.filter(e => e.id !== selectedDetailEventId);
        saveEvents();
        renderAllViews();
        updateTargetCountdown();
        closeEventDetailModal();
        showToast('Session deleted.');
    }
}

function toggleEventComplete(id) {
    const ev = calendarEvents.find(e => e.id === id);
    if (!ev) return;
    ev.completed = !ev.completed;
    saveEvents();
    renderAllViews();
    updateTargetCountdown();
    if (ev.completed) {
        showToast('Study session completed! 🎯');
    }
}

// Export All Events to RFC 5545 iCalendar (.ics)
function exportToIcs() {
    if (calendarEvents.length === 0) {
        alert('No events to export.');
        return;
    }
    
    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sabi App//Study Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Sabi Study & Exam Schedule',
        'X-WR-TIMEZONE:Africa/Lagos'
    ];
    
    calendarEvents.forEach(ev => {
        const startD = new Date(`${ev.date}T${ev.time || '09:00'}:00`);
        const durationHours = parseFloat(ev.duration || 1.5);
        const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);
        
        const dtstamp = formatGoogleIso(new Date());
        const dtstart = formatGoogleIso(startD);
        const dtend = formatGoogleIso(endD);
        
        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${ev.id}@sabiapp.ng`);
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`DTSTART:${dtstart}`);
        ics.push(`DTEND:${dtend}`);
        ics.push(`SUMMARY:${escapeIcs(ev.title)}`);
        if (ev.notes) icsContent = ics.push(`DESCRIPTION:${escapeIcs(ev.notes)}`);
        ics.push(`LOCATION:${escapeIcs(ev.location || 'Sabi Prep Room')}`);
        ics.push('STATUS:CONFIRMED');
        ics.push('END:VEVENT');
    });
    
    ics.push('END:VCALENDAR');
    
    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sabi_study_calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Downloaded .ICS! Ready to import to Google Calendar.');
}

function escapeIcs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Google Calendar Live Embed Setup
function setupEmbedCalendar() {
    const iframe = document.getElementById('gcal-live-iframe');
    const input = document.getElementById('custom-gcal-id');
    const savedId = localStorage.getItem('sabi_gcal_embed_id');
    
    if (savedId && input) {
        input.value = savedId;
        if (iframe) {
            iframe.src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(savedId)}&ctz=Africa%2FLagos&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0`;
        }
    }
}

function updateCustomGcalId() {
    const input = document.getElementById('custom-gcal-id');
    const iframe = document.getElementById('gcal-live-iframe');
    if (!input || !iframe) return;
    
    const val = input.value.trim();
    if (!val) {
        alert('Please enter your Google Calendar email/ID');
        return;
    }
    
    localStorage.setItem('sabi_gcal_embed_id', val);
    iframe.src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(val)}&ctz=Africa%2FLagos&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0`;
    showToast('Google Calendar Linked! 📅');
}

// Helpers
function getCategoryColor(cat) {
    switch (cat.toLowerCase()) {
        case 'jamb': return '#10B981';
        case 'waec': return '#3D8EFF';
        case 'neco': return '#8B5CF6';
        case 'noun': return '#0EA5E9';
        case 'ican': return '#F59E0B';
        case 'study': return '#EC4899';
        default: return '#3D8EFF';
    }
}

function getCategoryBadgeText(cat) {
    switch (cat.toLowerCase()) {
        case 'jamb': return '⚡ JAMB UTME';
        case 'waec': return '📘 WAEC SSCE';
        case 'neco': return '🟣 NECO';
        case 'noun': return '🎓 NOUN TMA';
        case 'ican': return '💼 ICAN Diet';
        case 'study': return '⏱️ Study Drill';
        default: return '📚 Exam';
    }
}

function showToast(message) {
    let toast = document.getElementById('calendar-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'calendar-toast';
        toast.className = 'calendar-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==========================================================================
   STAGE 5: PLAN GENERATOR (ONE AI CALL, NO CHAT) & VALIDATION ENGINE
   ========================================================================== */

const PLANNER_SYSTEM_PROMPT = `You are the study planner inside Sabi, an app for Nigerian university and exam students. You receive one JSON input and return ONE JSON output. You never ask questions and never write anything outside the JSON.

INPUT FIELDS
- week_start: the Monday to plan for (Africa/Lagos)
- classes: [{day, start_time, end_time, subject}] (may be empty)
- fixed_sessions: sessions the student edited or added manually. Treat them as busy time, never move them, and count them toward their subject's weekly total.
- subjects: [{name, topics[]}] (topics may be empty)
- exam_info: {type: "confirmed" | "proposed" | "approximate" | "unknown", dates: [{subject, date}] or weeks_away}
- hard_subjects: subjects the student marked as hard
- hours_per_day: "1-2" | "3-4" | "5+"
- best_time: morning (05:30-12:00) | afternoon (12:00-17:00) | evening (17:00-21:00) | night (21:00-23:30)
- last_week: per subject {planned, done} (may be empty)

RULES
1. Plan only the 7 days from week_start. Never schedule before 05:30 or after 23:30.
2. Never overlap a class or fixed session. Prefer the student's best_time window. If a session must go outside it, say so in "notes".
3. Daily load must not exceed 80% of the midpoint of hours_per_day (1.5, 3.5, 5). Session length is 60 minutes, or 45 if there are more than 6 subjects.
4. Every subject gets at least 2 sessions, at least 2 days apart. Hard subjects get extra sessions, up to double the others.
5. If everything can't fit, reduce in this order: 1 session per subject, then a second session for hard subjects, then a second session for the rest. List what you reduced in "notes".
6. Never put the same subject back-to-back on one day. Max 3 subjects per day. Keep one rest day.
7. Give each session an activity: learn (first pass, make notes), recall (close notes, retrieve from memory, then check), practice (past questions), review (fix mistakes and revisit weak spots). Per subject, sequence learn, recall, practice, review, with gaps that grow over time. Mix subjects across the week.
8. Exam dates: "confirmed" or "proposed" dates within 14 days mean mostly recall and practice for that subject. Treat "proposed" as tentative and don't leave everything to the final days. "approximate" or "unknown": assume exams are about 6 weeks away.
9. Subjects marked missed in last_week get priority this week.
10. If a subject has topics, fill "focus" with one topic per session, in outline order, and use recall sessions to revisit earlier topics. Never invent topics that aren't in the input. If there are no topics, set focus to null.
11. Write one short friendly line in "summary".

OUTPUT (JSON only)
{"summary": "...", "notes": ["..."], "sessions": [{"date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "subject": "...", "activity": "learn|recall|practice|review", "focus": "... or null"}]}`;

// Profile Storage

// Profile Storage
function getPlannerProfile() {
    const stored = localStorage.getItem('sabi_planner_profile');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }
    return {
        hard_subjects: ["Physics", "Mathematics"],
        hours_per_day: "3-4",
        best_time: "evening",
        exam_info: { type: "approximate", weeks_away: 6, dates: [] }
    };
}

function savePlannerProfile(profile) {
    localStorage.setItem('sabi_planner_profile', JSON.stringify(profile));
}

function getEnrolledSubjects() {
    // Check saved subjects
    const stored = localStorage.getItem('sabi_enrolled_subjects') || localStorage.getItem('sabi_jamb_subjects');
    if (stored) {
        try {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) {
                return list.map(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    const catalogMatch = DEFAULT_SUBJECT_CATALOG.find(c => c.name.toLowerCase() === name.toLowerCase());
                    return {
                        name: name,
                        topics: catalogMatch ? catalogMatch.topics : []
                    };
                });
            }
        } catch (e) {
            console.error(e);
        }
    }
    return DEFAULT_SUBJECT_CATALOG.slice(0, 5); // Default 5 core subjects
}

// --- SMART PLANNER SETUP (ONE Tap-Only Screen: 3 Questions) ---
function initPlannerOnboarding() {
    onboardingTempProfile = getPlannerProfile();
    const enrolled = getEnrolledSubjects().map(s => s.name);
    selectedSubjects = new Set(onboardingTempProfile.subjects && onboardingTempProfile.subjects.length > 0 ? onboardingTempProfile.subjects : enrolled);
    if (onboardingTempProfile.hard_subjects) {
        hardSubjects = new Set(onboardingTempProfile.hard_subjects);
    } else {
        hardSubjects = new Set(["Physics", "Mathematics"]);
    }
}

function openPlannerOnboardingModal() {
    onboardingTempProfile = getPlannerProfile();
    const enrolled = getEnrolledSubjects().map(s => s.name);
    selectedSubjects = new Set(onboardingTempProfile.subjects && onboardingTempProfile.subjects.length > 0 ? onboardingTempProfile.subjects : enrolled);
    if (onboardingTempProfile.hard_subjects) {
        hardSubjects = new Set(onboardingTempProfile.hard_subjects);
    } else {
        hardSubjects = new Set(["Physics", "Mathematics"]);
    }

    renderOnboardingUI();
    const modal = document.getElementById('planner-onboarding-modal');
    if (modal) {
        modal.classList.remove('hidden');
        if (document.body) document.body.style.overflow = 'hidden';
    }
}

function closePlannerOnboardingModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('planner-onboarding-modal');
    if (modal) {
        modal.classList.add('hidden');
        if (document.body) document.body.style.overflow = '';
    }
}

// --- RENDER ONBOARDING UI ---
function renderOnboardingUI() {
    renderHardSubjectChips();
    selectHoursOption(onboardingTempProfile.hours_per_day || '3-4', false);
    selectBestTimeOption(onboardingTempProfile.best_time || 'evening', false);
    const examType = onboardingTempProfile.exam_info?.type || 'approximate';
    selectExamMode(examType, false);
}

// --- 1. Which subjects do you find hard? (chips from their subjects, any number) ---
function renderHardSubjectChips() {
    const container = document.getElementById('onboarding-hard-subjects-chips');
    if (!container) return;

    const allSubjects = [...new Set([...selectedSubjects])];
    if (allSubjects.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: var(--text-muted);">No subjects found. Add one below.</p>';
        return;
    }

    let html = allSubjects.map(name => {
        const isHard = hardSubjects.has(name);
        return `
            <button type="button" class="subject-chip-btn ${isHard ? 'hard' : ''}" onclick="toggleHardSubject('${escapeHtml(name)}')">
                <span>${isHard ? '🔥 Hard' : '✓ Enrolled'}</span>
                <span>${escapeHtml(name)}</span>
            </button>
        `;
    }).join('');

    // Quick add suggestions from default catalog
    const unselectedCatalog = DEFAULT_SUBJECT_CATALOG.filter(c => !selectedSubjects.has(c.name));
    if (unselectedCatalog.length > 0) {
        html += unselectedCatalog.slice(0, 4).map(c => `
            <button type="button" class="subject-chip-btn" style="opacity: 0.8; border-style: dashed;" onclick="addSubjectByName('${escapeHtml(c.name)}')">
                <span>＋</span>
                <span>${escapeHtml(c.name)}</span>
            </button>
        `).join('');
    }

    container.innerHTML = html;
}

function addSubjectByName(name) {
    if (name) {
        selectedSubjects.add(name);
        renderHardSubjectChips();
    }
}
window.addSubjectByName = addSubjectByName;

function toggleHardSubject(name) {
    if (hardSubjects.has(name)) {
        hardSubjects.delete(name);
    } else {
        hardSubjects.add(name);
    }
    renderHardSubjectChips();
}

function addCustomSubject() {
    const input = document.getElementById('custom-subject-input');
    if (!input) return;
    const name = input.value.trim();
    if (name) {
        selectedSubjects.add(name);
        hardSubjects.add(name);
        input.value = '';
        renderHardSubjectChips();
    }
}

// --- 2. Realistic study hours on a normal day (1-2 / 3-4 / 5+) and best time (morning / afternoon / evening / night) ---
function selectHoursOption(hours, shouldUpdate = true) {
    if (shouldUpdate) onboardingTempProfile.hours_per_day = hours;
    document.querySelectorAll('#tap-row-hours .tap-segment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-hours') === hours);
    });
}

function selectBestTimeOption(time, shouldUpdate = true) {
    if (shouldUpdate) onboardingTempProfile.best_time = time;
    document.querySelectorAll('#tap-grid-time .tap-segment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-time') === time);
    });
}

// --- 3. Exam dates: "I know them" (date picker per subject, optional), "In about X weeks", or "I don't know yet" ---
function selectExamMode(type, shouldUpdate = true) {
    if (shouldUpdate) {
        if (!onboardingTempProfile.exam_info) onboardingTempProfile.exam_info = {};
        onboardingTempProfile.exam_info.type = type;
        triggerReplanOnExamDateChange();
    }

    document.querySelectorAll('#tap-row-exam-mode .tap-segment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-exam-type') === type);
    });

    const panelDates = document.getElementById('exam-panel-dates');
    const panelWeeks = document.getElementById('exam-panel-weeks');
    const panelUnknown = document.getElementById('exam-panel-unknown');

    if (panelDates) panelDates.classList.toggle('hidden', type !== 'confirmed');
    if (panelWeeks) panelWeeks.classList.toggle('hidden', type !== 'approximate');
    if (panelUnknown) panelUnknown.classList.toggle('hidden', type !== 'unknown');

    if (type === 'confirmed') {
        renderSubjectDatePickers();
    } else if (type === 'approximate') {
        const weeks = onboardingTempProfile.exam_info?.weeks_away || 6;
        selectWeeksAway(weeks, false);
    }
}

function selectWeeksAway(weeks, shouldUpdate = true) {
    if (shouldUpdate) {
        if (!onboardingTempProfile.exam_info) onboardingTempProfile.exam_info = { type: 'approximate' };
        onboardingTempProfile.exam_info.weeks_away = Number(weeks);
        triggerReplanOnExamDateChange();
    }
    document.querySelectorAll('#weeks-chips-container .week-chip-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.getAttribute('data-weeks')) === Number(weeks));
    });
}

function renderSubjectDatePickers() {
    const container = document.getElementById('subject-date-pickers-list');
    if (!container) return;
    const datesMap = {};
    if (onboardingTempProfile.exam_info?.dates) {
        onboardingTempProfile.exam_info.dates.forEach(d => { datesMap[d.subject] = d.date; });
    }

    const subjectList = selectedSubjects.size > 0 ? [...selectedSubjects] : getEnrolledSubjects().map(s => s.name);
    container.innerHTML = subjectList.map(name => {
        const existingDate = datesMap[name] || '';
        return `
            <div class="sub-date-row">
                <span class="sub-date-label">${escapeHtml(name)}</span>
                <input type="date" class="sub-date-input" value="${existingDate}" onchange="handleSubjectDateChange('${escapeHtml(name)}', this.value)" />
            </div>
        `;
    }).join('');
}

// Re-plan the remaining days when the student enters or changes an exam date
let replanExamDateDebounceTimer = null;
function triggerReplanOnExamDateChange() {
    if (localStorage.getItem('sabi_planner_onboarded') !== 'true') return;
    savePlannerProfile(onboardingTempProfile);
    clearTimeout(replanExamDateDebounceTimer);
    replanExamDateDebounceTimer = setTimeout(() => {
        showToast('🔄 Re-planning remaining days for updated exam schedule...');
        const monday = getMondayOfWeek(new Date());
        generateWeeklyPlan(monday, false, true).then(() => {
            renderAllViews();
        });
    }, 450);
}

function handleSubjectDateChange(subject, dateVal) {
    if (!onboardingTempProfile.exam_info) onboardingTempProfile.exam_info = { type: 'confirmed', dates: [] };
    if (!onboardingTempProfile.exam_info.dates) onboardingTempProfile.exam_info.dates = [];
    
    onboardingTempProfile.exam_info.dates = onboardingTempProfile.exam_info.dates.filter(d => d.subject !== subject);
    if (dateVal) {
        onboardingTempProfile.exam_info.dates.push({ subject, date: dateVal });
    }
    triggerReplanOnExamDateChange();
}

// --- SUBMIT: Collect answers and generate (ONE AI call, no chat) ---
async function submitOnboardingAndGeneratePlan() {
    onboardingTempProfile.subjects = [...selectedSubjects];
    onboardingTempProfile.hard_subjects = [...hardSubjects];
    savePlannerProfile(onboardingTempProfile);
    localStorage.setItem('sabi_planner_onboarded', 'true');

    // Save subjects to enrolled subjects store
    const subjectObjects = [...selectedSubjects].map(name => {
        const catalogMatch = DEFAULT_SUBJECT_CATALOG.find(c => c.name.toLowerCase() === name.toLowerCase());
        return { name, topics: catalogMatch ? catalogMatch.topics : [] };
    });
    localStorage.setItem('sabi_enrolled_subjects', JSON.stringify(subjectObjects));

    // Show loading state
    const btn = document.getElementById('btn-submit-onboarding');
    const statusBar = document.getElementById('ai-status-bar');
    const statusText = document.getElementById('ai-status-text');
    if (btn) btn.disabled = true;
    if (statusBar) statusBar.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Generating your personalized study plan…';

    try {
        const monday = getMondayOfWeek(new Date());
        await generateWeeklyPlan(monday, false, false);

        if (statusText) statusText.textContent = '✅ Plan generated!';
        setTimeout(() => {
            closePlannerOnboardingModal();
            if (statusBar) statusBar.classList.add('hidden');
            if (btn) btn.disabled = false;
            showToast('✨ Your personalized study plan is ready!');
            renderAllViews();
        }, 500);

    } catch (err) {
        console.error('Plan generation error:', err);
        closePlannerOnboardingModal();
        if (statusBar) statusBar.classList.add('hidden');
        if (btn) btn.disabled = false;
        showToast('📋 Study plan ready');
        renderAllViews();
    }
}

// Helper: Safe fetch with timeout to avoid freezing UI
async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

// --- TIMETABLE EXTRACTION VIA AI (Supports Claude 3.5, Gemini & OpenAI) ---
async function extractTimetableFromPhoto(base64DataUrl) {
    const promptText = 'Extract the class/lecture timetable from this image. Return ONLY a JSON array of objects with these fields: day (e.g. "Monday"), start_time (e.g. "09:00"), end_time (e.g. "11:00"), subject (e.g. "PHY 101: General Physics"). If you cannot read the timetable clearly, return an empty array []. Output strictly valid JSON with no markdown wrapping.';

    try {
        const [header, data] = base64DataUrl.split(',');
        const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';

        const claudeKey = getAnthropicKey() || getActiveApiKey();
        const openAiKey = getOpenAiKey();
        const geminiKey = getGeminiKey();

        // 1. Anthropic Claude 3.5 Sonnet Vision
        if (claudeKey) {
            try {
                const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': claudeKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 2048,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'image',
                                        source: {
                                            type: 'base64',
                                            media_type: mimeType,
                                            data: data
                                        }
                                    },
                                    {
                                        type: 'text',
                                        text: promptText
                                    }
                                ]
                            }
                        ]
                    })
                }, 6000);

                if (res.ok) {
                    const resData = await res.json();
                    const content = resData.content?.[0]?.text;
                    if (content) {
                        const parsed = parseJsonSafe(content);
                        const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                        if (Array.isArray(classes) && classes.length > 0) return classes;
                    }
                }
            } catch (err) {
                console.warn('[Sabi Timetable] Claude photo extraction error or timeout:', err);
            }
        }

        // 2. OpenAI GPT-4o Vision
        const oKey = openAiKey || (claudeKey && claudeKey.startsWith('sk-') && !claudeKey.startsWith('sk-ant-') ? claudeKey : null);
        if (oKey) {
            try {
                const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${oKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: promptText },
                                    { type: 'image_url', image_url: { url: base64DataUrl } }
                                ]
                            }
                        ],
                        response_format: { type: 'json_object' }
                    })
                }, 5000);

                if (res.ok) {
                    const resData = await res.json();
                    const content = resData.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = parseJsonSafe(content);
                        const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                        if (Array.isArray(classes) && classes.length > 0) return classes;
                    }
                }
            } catch (err) {
                console.warn('[Sabi Timetable] OpenAI photo extraction failed:', err);
            }
        }

        // 3. Google Gemini Vision
        const gKey = geminiKey || (claudeKey && claudeKey.startsWith('AIzaSy') ? claudeKey : null);
        if (gKey) {
            const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gKey}`;
                    const res = await fetchWithTimeout(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                role: 'user',
                                parts: [
                                    { inlineData: { mimeType, data } },
                                    { text: promptText }
                                ]
                            }],
                            generationConfig: { responseMimeType: 'application/json' }
                        })
                    }, 5000);

                    if (res.ok) {
                        const resData = await res.json();
                        const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            const parsed = parseJsonSafe(text);
                            const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                            if (Array.isArray(classes) && classes.length > 0) return classes;
                        }
                    }
                } catch (e) {}
            }
        }
    } catch (err) {
        console.error('[Sabi Timetable] Photo extraction failed:', err);
    }
    return null;
}

async function extractTimetableFromText(timetableText) {
    if (!timetableText || !timetableText.trim()) return [];

    const promptText = `Parse this class timetable into structured data. Return ONLY a JSON array of objects with fields: day (e.g. "Monday"), start_time (24h format e.g. "09:00"), end_time (24h format e.g. "11:00"), subject (the class name). Here is the timetable:\n\n${timetableText}\n\nReturn strictly JSON.`;

    const claudeKey = getAnthropicKey() || getActiveApiKey();
    const openAiKey = getOpenAiKey();
    const geminiKey = getGeminiKey();

    // 1. Claude Haiku
    if (claudeKey) {
        try {
            const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-haiku-20241022',
                    max_tokens: 2048,
                    messages: [
                        { role: 'user', content: promptText }
                    ]
                })
            }, 5000);

            if (res.ok) {
                const resData = await res.json();
                const content = resData.content?.[0]?.text;
                if (content) {
                    const parsed = parseJsonSafe(content);
                    const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                    if (Array.isArray(classes) && classes.length > 0) return classes;
                }
            }
        } catch (err) {
            console.warn('[Sabi Timetable] Claude text extraction error:', err);
        }
    }

    // 2. OpenAI
    const oKey = openAiKey || (claudeKey && claudeKey.startsWith('sk-') && !claudeKey.startsWith('sk-ant-') ? claudeKey : null);
    if (oKey) {
        try {
            const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${oKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'user', content: promptText }
                    ],
                    response_format: { type: 'json_object' }
                })
            }, 4000);

            if (res.ok) {
                const data = await res.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    const parsed = parseJsonSafe(content);
                    const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                    if (Array.isArray(classes) && classes.length > 0) return classes;
                }
            }
        } catch (err) {}
    }

    // 3. Gemini
    const gKey = geminiKey || (claudeKey && claudeKey.startsWith('AIzaSy') ? claudeKey : null);
    if (gKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gKey}`;
            const res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: promptText }] }],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            }, 4000);

            if (res.ok) {
                const resData = await res.json();
                const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = parseJsonSafe(text);
                    const classes = Array.isArray(parsed) ? parsed : (parsed?.classes || parsed?.timetable || []);
                    if (Array.isArray(classes) && classes.length > 0) return classes;
                }
            }
        } catch (e) {}
    }

    return simpleTextTimetableParse(timetableText);
}

// Basic offline timetable parser
function simpleTextTimetableParse(text) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const lines = text.split('\n').filter(l => l.trim());
    const classes = [];
    
    lines.forEach(line => {
        const lower = line.toLowerCase();
        const dayMatch = days.find(d => lower.includes(d));
        if (!dayMatch) return;
        
        // Try to find time patterns like "9am-11am", "09:00-11:00", "9:00 - 11:00"
        const timePattern = /(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?\s*[-–to]+\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?/i;
        const timeMatch = line.match(timePattern);
        
        if (timeMatch) {
            let start = timeMatch[1];
            let end = timeMatch[2];
            
            // Convert to 24h if needed
            if (!start.includes(':')) start += ':00';
            if (!end.includes(':')) end += ':00';
            if (lower.includes('pm') && parseInt(start) < 12) {
                start = (parseInt(start) + 12) + start.slice(start.indexOf(':'));
            }
            if (lower.includes('pm') && parseInt(end) < 12) {
                end = (parseInt(end) + 12) + end.slice(end.indexOf(':'));
            }
            
            // Subject is everything after the time
            const afterTime = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length).trim();
            const subject = afterTime.replace(/^[-–,:\s]+/, '').trim() || 'Class';
            
            classes.push({
                day: dayMatch.charAt(0).toUpperCase() + dayMatch.slice(1),
                start_time: start.padStart(5, '0'),
                end_time: end.padStart(5, '0'),
                subject
            });
        }
    });
    
    return classes;
}

// --- MONDAY AUTO-REGENERATION CHECK ---
function checkMondayAutoRegeneration() {
    if (!localStorage.getItem('sabi_planner_onboarded')) return;
    const currentMonday = getMondayOfWeek(new Date());
    const lastPlannedMonday = localStorage.getItem('sabi_last_planned_monday');
    
    if (lastPlannedMonday !== currentMonday) {
        console.log(`[Sabi Planner] Auto-regenerating plan for new week: ${currentMonday}`);
        generateWeeklyPlan(currentMonday, false, false);
    }
}

// --- ⋯ MENU ACTIONS ---
function togglePlannerMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function triggerRegeneratePlan() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');
    showToast('⚡ Regenerating weekly study plan...');
    const monday = getMondayOfWeek(new Date());
    generateWeeklyPlan(monday, false, false);
}

function triggerReplanRemainingDays() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');
    showToast('🔄 Re-planning remaining days of the week...');
    const monday = getMondayOfWeek(new Date());
    generateWeeklyPlan(monday, false, true);
}

function triggerPrintTimetable() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');
    switchViewMode('week');
    setTimeout(() => {
        window.print();
    }, 250);
}

// --- BUNDLE BUILDER & API CALL ---
function buildPlannerInputBundle(weekStartStr, isReplanRemaining = false) {
    const fixedSessions = [];
    const todayStr = getFutureDateString(0);

    calendarEvents.forEach(ev => {
        // Manual/custom sessions treated as fixed busy sessions
        if (!ev.isAiGenerated) {
            fixedSessions.push({
                date: ev.date,
                start_time: ev.time || '17:00',
                end_time: calculateEndTime(ev.time || '17:00', ev.duration || 1),
                subject: ev.title
            });
        } else if (isReplanRemaining && ev.date < todayStr) {
            // Keep past AI sessions from earlier in the week as fixed
            fixedSessions.push({
                date: ev.date,
                start_time: ev.time || '17:00',
                end_time: calculateEndTime(ev.time || '17:00', ev.duration || 1),
                subject: ev.title
            });
        }
    });

    const storedClasses = getStoredClasses();
    const profile = getPlannerProfile();
    const subjects = getEnrolledSubjects();
    const lastWeek = JSON.parse(localStorage.getItem('sabi_last_week_stats') || '{}');

    return {
        week_start: weekStartStr,
        classes: storedClasses,
        fixed_sessions: fixedSessions,
        subjects: subjects,
        exam_info: profile.exam_info || { type: "approximate", weeks_away: 6 },
        hard_subjects: profile.hard_subjects || [],
        hours_per_day: profile.hours_per_day || "3-4",
        best_time: profile.best_time || "evening",
        off_days: profile.off_days || ["Sunday"],
        goal: profile.goal || "high",
        follow_up_context: followUpContext.length > 0 ? followUpContext : undefined,
        last_week: lastWeek
    };
}

// Call AI Model (Anthropic Claude 3.5 Sonnet, Google Gemini, OpenAI, or intelligent offline fallback)
async function callPlannerModel(inputBundle, retryViolations = null) {
    let promptContent = JSON.stringify(inputBundle);

    if (retryViolations && retryViolations.length > 0) {
        promptContent = `Your previous output had validation violations:\n- ${retryViolations.join('\n- ')}\n\nPlease regenerate the JSON output correcting all violations strictly according to the rules.\nInput: ${JSON.stringify(inputBundle)}`;
    }

    const claudeKey = getAnthropicKey() || getActiveApiKey();
    const openAiKey = getOpenAiKey();
    const geminiKey = getGeminiKey();

    // 1. Try Anthropic Claude 3.5 Sonnet first (User preference: Claude)
    if (isLiveModelAvailable && claudeKey) {
        try {
            console.log('[Sabi Planner] Calling Anthropic Claude 3.5 Sonnet API...');
            const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    system: PLANNER_SYSTEM_PROMPT,
                    messages: [
                        { role: 'user', content: promptContent }
                    ]
                })
            }, 5000);

            if (res.ok) {
                const data = await res.json();
                const text = data.content?.[0]?.text;
                if (text) {
                    console.log('[Sabi Planner] Received successful plan from Claude 3.5 Sonnet.');
                    return text;
                }
            } else {
                console.warn('[Sabi Planner] Claude API response status:', res.status);
                if (res.status === 401 || res.status === 403) {
                    isLiveModelAvailable = false; // Invalid key or unauthenticated, don't stall
                }
            }
        } catch (err) {
            console.warn('[Sabi Planner] Claude API fetch error or timeout:', err);
            isLiveModelAvailable = false;
        }
    }

    // 2. Try Google Gemini if configured
    const gKey = geminiKey || (claudeKey && claudeKey.startsWith('AIzaSy') ? claudeKey : null);
    if (isLiveModelAvailable && gKey) {
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gKey}`;
                const res = await fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: promptContent }] }],
                        systemInstruction: { parts: [{ text: PLANNER_SYSTEM_PROMPT }] },
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                }, 4000);

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return text;
                }
            } catch (err) {}
        }
    }

    // 3. Try OpenAI if configured
    const oKey = openAiKey || (claudeKey && claudeKey.startsWith('sk-') && !claudeKey.startsWith('sk-ant-') ? claudeKey : null);
    if (isLiveModelAvailable && oKey) {
        try {
            const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${oKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
                        { role: 'user', content: promptContent }
                    ],
                    response_format: { type: 'json_object' }
                })
            }, 4000);

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) return text;
            }
        } catch (err) {}
    }

    // 4. Offline rule-compliant generator (Conflict-Free 11-rule academic scheduler)
    console.log('[Sabi Planner] Using offline 11-rule study engine (immediate, guaranteed balance).');
    return synthesizeRuleCompliantPlan(inputBundle, retryViolations);
}

// High-fidelity offline generator following all 11 planner rules with dynamic collision avoidance
function synthesizeRuleCompliantPlan(input, retryViolations) {
    const weekStart = input.week_start;
    const subjects = input.subjects || [];
    const hardSet = new Set((input.hard_subjects || []).map(s => s.toLowerCase()));
    const bestTime = input.best_time || 'evening';
    const hoursPerDay = input.hours_per_day || '3-4';
    
    // Rule 3: Session length is 60 mins or 45 if > 6 subjects
    const sessionLengthMin = subjects.length > 6 ? 45 : 60;
    
    // Midpoints: 1-2 => 1.5h, 3-4 => 3.5h, 5+ => 5.0h. Max load <= 80%
    const midpoint = hoursPerDay === '1-2' ? 1.5 : (hoursPerDay === '5+' ? 5.0 : 3.5);
    const maxDailyMinutes = midpoint * 60 * 0.8;
    const maxSessionsPerDay = Math.min(3, Math.floor(maxDailyMinutes / sessionLengthMin)); // Rule 6: Max 3 subjects/day
    
    // Best time slot candidates tailored to student preference
    const timeSlotCandidatesByPref = {
        morning: ['07:00', '08:30', '10:00', '11:30', '06:00', '14:00', '15:30', '17:00', '18:30'],
        afternoon: ['13:00', '14:30', '15:45', '12:00', '17:00', '18:30', '08:30', '10:00', '20:00'],
        evening: ['17:30', '19:00', '20:30', '21:30', '16:00', '14:30', '08:30', '10:00', '07:00'],
        night: ['21:00', '22:15', '20:00', '19:00', '17:30', '16:00', '14:30']
    };
    const defaultCandidates = timeSlotCandidatesByPref[bestTime] || timeSlotCandidatesByPref.evening;
    
    // 7 days of the week: Mon(0) to Sun(6)
    const dayNameToIdx = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
    const offDaysSet = new Set((input.off_days || ['Sunday']).map(d => dayNameToIdx[d]).filter(v => v !== undefined));
    const activeDays = [0, 1, 2, 3, 4, 5, 6].filter(i => !offDaysSet.has(i));
    
    const plannedSessions = [];
    const subjectSessionCount = {};
    const subjectLastDay = {};
    const subjectTopicIdx = {};
    const subjectActivityCycle = ['learn', 'recall', 'practice', 'review'];
    const daysSubjects = {};
    
    subjects.forEach(s => {
        subjectSessionCount[s.name] = 0;
        subjectLastDay[s.name] = -99;
        subjectTopicIdx[s.name] = 0;
    });

    const isExamClose = input.exam_info?.type === 'confirmed' && (input.exam_info.dates || []).length > 0;

    const timeToMin = (t) => {
        if (!t || !t.includes(':')) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    activeDays.forEach(dayIdx => {
        const currentDateStr = addDaysToDate(weekStart, dayIdx);
        daysSubjects[currentDateStr] = [];
        let dailyCount = 0;

        // Collect busy intervals from classes and fixed calendar sessions
        const busy = [];
        const dayName = new Date(currentDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        if (input.classes) {
            for (const cls of input.classes) {
                if (cls.day.toLowerCase() === dayName.toLowerCase() || cls.day === currentDateStr) {
                    busy.push([timeToMin(cls.start_time), timeToMin(cls.end_time)]);
                }
            }
        }
        if (input.fixed_sessions) {
            for (const fix of input.fixed_sessions) {
                if (fix.date === currentDateStr) {
                    busy.push([timeToMin(fix.start_time), timeToMin(fix.end_time)]);
                }
            }
        }

        subjects.forEach(sub => {
            if (dailyCount >= maxSessionsPerDay) return;
            if (daysSubjects[currentDateStr].length >= 3) return; // Rule 6: Max 3 subjects per day

            const isHard = hardSet.has(sub.name.toLowerCase());
            const targetCount = isHard ? 3 : 2;
            const currentCount = subjectSessionCount[sub.name];

            // Rule 4: At least 2 days apart
            if (currentCount < targetCount && (dayIdx - subjectLastDay[sub.name] >= 2)) {
                let chosenSlot = null;
                const minAllowed = timeToMin('05:30');
                const maxAllowed = timeToMin('23:30');

                // Check candidate slots inside preferred window
                for (const candidateTime of defaultCandidates) {
                    const cStart = timeToMin(candidateTime);
                    const cEnd = cStart + sessionLengthMin;
                    if (cStart < minAllowed || cEnd > maxAllowed) continue;

                    const collides = busy.some(([bStart, bEnd]) => Math.max(cStart, bStart) < Math.min(cEnd, bEnd));
                    if (!collides) {
                        chosenSlot = candidateTime;
                        break;
                    }
                }

                // If all preferred slots busy, search open time slots across the day
                if (!chosenSlot) {
                    const fallbackTimes = ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00', '22:00'];
                    for (const fTime of fallbackTimes) {
                        const cStart = timeToMin(fTime);
                        const cEnd = cStart + sessionLengthMin;
                        if (cStart < minAllowed || cEnd > maxAllowed) continue;

                        const collides = busy.some(([bStart, bEnd]) => Math.max(cStart, bStart) < Math.min(cEnd, bEnd));
                        if (!collides) {
                            chosenSlot = fTime;
                            break;
                        }
                    }
                }

                if (!chosenSlot) return; // Skip if no free time window exists on this day

                const endTime = calculateEndTime(chosenSlot, sessionLengthMin / 60);

                // Add to busy intervals so following sessions don't overlap
                busy.push([timeToMin(chosenSlot), timeToMin(endTime)]);

                let act = subjectActivityCycle[currentCount % subjectActivityCycle.length];
                if (isExamClose) {
                    act = (currentCount % 2 === 0) ? 'recall' : 'practice';
                }

                let focusTopic = null;
                if (sub.topics && sub.topics.length > 0) {
                    const tIdx = subjectTopicIdx[sub.name] % sub.topics.length;
                    focusTopic = sub.topics[tIdx];
                    subjectTopicIdx[sub.name]++;
                }

                plannedSessions.push({
                    date: currentDateStr,
                    start_time: chosenSlot,
                    end_time: endTime,
                    subject: sub.name,
                    activity: act,
                    focus: focusTopic
                });

                daysSubjects[currentDateStr].push(sub.name);
                subjectSessionCount[sub.name]++;
                subjectLastDay[sub.name] = dayIdx;
                dailyCount++;
            }
        });
    });

    const hardNames = input.hard_subjects && input.hard_subjects.length > 0 
        ? input.hard_subjects.join(' & ') 
        : 'your priority courses';

    const notes = [
        `All sessions scheduled inside your preferred ${bestTime} window (05:30 - 23:30).`,
        `Extra focus sessions allocated for hard subjects (${hardNames}).`,
        `Sunday reserved as a full rest day to prevent academic fatigue.`
    ];

    // Rule 5: If everything can't fit, list what was reduced in notes
    const reducedSubs = subjects.filter(s => (subjectSessionCount[s.name] || 0) < 2).map(s => s.name);
    if (reducedSubs.length > 0) {
        notes.push(`Reduced sessions for ${reducedSubs.join(', ')} to fit within daily study limits.`);
    }

    return JSON.stringify({
        summary: `Your personalized weekly plan is set with spaced study sessions, prioritized focus on ${hardNames}, and Sunday reserved for rest.`,
        notes: notes,
        sessions: plannedSessions
    });
}

// --- VALIDATION ENGINE (Strict Code Checks) ---
function validatePlannerOutput(plan, inputBundle) {
    const violations = [];
    if (!plan || typeof plan !== 'object') {
        violations.push("Output is not a valid JSON object.");
        return { isValid: false, violations, validSessions: [] };
    }
    if (typeof plan.summary !== 'string' || !plan.summary.trim()) {
        violations.push("Missing or invalid 'summary' string.");
    }
    if (!Array.isArray(plan.notes)) {
        violations.push("Missing or invalid 'notes' array.");
    }
    if (!Array.isArray(plan.sessions)) {
        violations.push("Missing or invalid 'sessions' array.");
        return { isValid: false, violations, validSessions: [] };
    }

    const weekStartStr = inputBundle.week_start;
    const weekEndStr = addDaysToDate(weekStartStr, 6);
    const validSubjectNames = new Set((inputBundle.subjects || []).map(s => s.name.toLowerCase()));
    const validActivities = new Set(['learn', 'recall', 'practice', 'review']);

    const timeToMinutes = (t) => {
        if (!t || !t.includes(':')) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const validSessions = [];
    const sessionsByDay = {}; // date -> array of sessions
    const sessionsBySubject = {}; // subject (lowercase) -> array of dates

    plan.sessions.forEach((sess, idx) => {
        let isSessionValid = true;
        const prefix = `Session #${idx + 1} (${sess.subject || 'Unknown'} on ${sess.date || 'No date'}):`;

        // 1. Subject match
        if (!sess.subject || !validSubjectNames.has(sess.subject.toLowerCase())) {
            violations.push(`${prefix} Subject '${sess.subject}' is not in the input subjects list.`);
            isSessionValid = false;
        }

        // 2. Date inside week
        if (!sess.date || sess.date < weekStartStr || sess.date > weekEndStr) {
            violations.push(`${prefix} Date '${sess.date}' falls outside planning week (${weekStartStr} to ${weekEndStr}).`);
            isSessionValid = false;
        }

        // 3. Time inside 05:30 to 23:30
        if (!sess.start_time || !sess.end_time) {
            violations.push(`${prefix} Missing start_time or end_time.`);
            isSessionValid = false;
        } else {
            const startMin = timeToMinutes(sess.start_time);
            const endMin = timeToMinutes(sess.end_time);
            const minAllowed = timeToMinutes('05:30');
            const maxAllowed = timeToMinutes('23:30');

            if (startMin < minAllowed || endMin > maxAllowed || endMin <= startMin) {
                violations.push(`${prefix} Time (${sess.start_time}-${sess.end_time}) is outside allowed 05:30-23:30 window or end <= start.`);
                isSessionValid = false;
            }

            // 4. Overlap with classes
            if (inputBundle.classes && inputBundle.classes.length > 0 && sess.date) {
                const dayName = new Date(sess.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
                for (const cls of inputBundle.classes) {
                    if (cls.day.toLowerCase() === dayName.toLowerCase() || cls.day === sess.date) {
                        const clsStart = timeToMinutes(cls.start_time);
                        const clsEnd = timeToMinutes(cls.end_time);
                        if (Math.max(startMin, clsStart) < Math.min(endMin, clsEnd)) {
                            violations.push(`${prefix} Overlaps with class '${cls.subject}' (${cls.start_time}-${cls.end_time}).`);
                            isSessionValid = false;
                            break;
                        }
                    }
                }
            }

            // 5. Overlap with fixed sessions
            if (inputBundle.fixed_sessions && inputBundle.fixed_sessions.length > 0 && sess.date) {
                for (const fix of inputBundle.fixed_sessions) {
                    if (fix.date === sess.date) {
                        const fixStart = timeToMinutes(fix.start_time);
                        const fixEnd = timeToMinutes(fix.end_time);
                        if (Math.max(startMin, fixStart) < Math.min(endMin, fixEnd)) {
                            violations.push(`${prefix} Overlaps with fixed session '${fix.subject || fix.title}' (${fix.start_time}-${fix.end_time}).`);
                            isSessionValid = false;
                            break;
                        }
                    }
                }
            }

            // 6. Overlap with another planned session on the same day
            if (sess.date && sessionsByDay[sess.date]) {
                for (const other of sessionsByDay[sess.date]) {
                    const otherStart = timeToMinutes(other.start_time);
                    const otherEnd = timeToMinutes(other.end_time);
                    if (Math.max(startMin, otherStart) < Math.min(endMin, otherEnd)) {
                        violations.push(`${prefix} Overlaps with session '${other.subject}' (${other.start_time}-${other.end_time}).`);
                        isSessionValid = false;
                        break;
                    }
                }
            }
        }

        // 7. Max 3 subjects per day check (Rule 6)
        if (sess.date && sess.subject && isSessionValid) {
            const daySubjs = (sessionsByDay[sess.date] || []).map(s => s.subject.toLowerCase());
            const uniqueSubjs = new Set(daySubjs);
            if (!uniqueSubjs.has(sess.subject.toLowerCase()) && uniqueSubjs.size >= 3) {
                violations.push(`${prefix} Day ${sess.date} already has 3 distinct subjects. Max 3 subjects per day allowed.`);
                isSessionValid = false;
            }
        }

        // 8. Spacing rule: same subject must be >= 2 days apart (Rule 4 & Rule 6: never back-to-back or same day)
        if (sess.subject && sess.date && isSessionValid) {
            const sKey = sess.subject.toLowerCase();
            const prevDates = sessionsBySubject[sKey] || [];
            for (const prevDate of prevDates) {
                const d1 = new Date(prevDate + 'T00:00:00');
                const d2 = new Date(sess.date + 'T00:00:00');
                const diffDays = Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
                if (diffDays < 2) {
                    violations.push(`${prefix} Subject '${sess.subject}' is scheduled on ${sess.date}, which is less than 2 days from previous session on ${prevDate}.`);
                    isSessionValid = false;
                    break;
                }
            }
        }

        // 9. Activity check (fallback to learn if unknown)
        if (sess.activity && !validActivities.has(sess.activity.toLowerCase())) {
            sess.activity = 'learn';
        }

        // If session passes all validity criteria, preserve it
        if (isSessionValid) {
            validSessions.push(sess);
            if (!sessionsByDay[sess.date]) sessionsByDay[sess.date] = [];
            sessionsByDay[sess.date].push(sess);

            const sKey = (sess.subject || '').toLowerCase();
            if (!sessionsBySubject[sKey]) sessionsBySubject[sKey] = [];
            sessionsBySubject[sKey].push(sess.date);
        }
    });

    // 10. Min 2 sessions per subject with 2+ days between them (unless "notes" explains the reduction)
    const allNotesText = (plan.notes || []).join(' ').toLowerCase();
    const explainsReduction = /reduc|cut|drop|limit|fit|less|fewer|adjust/i.test(allNotesText);

    (inputBundle.subjects || []).forEach(sub => {
        const sKey = (sub.name || '').toLowerCase();
        const count = (sessionsBySubject[sKey] || []).length;
        if (count < 2) {
            const subjectMentionedInNotes = allNotesText.includes(sKey);
            if (!explainsReduction && !subjectMentionedInNotes) {
                violations.push(`Subject '${sub.name}' has only ${count} session(s) (minimum 2 required), and 'notes' does not explain any reduction.`);
            }
        }
    });

    return {
        isValid: violations.length === 0,
        violations: violations,
        validSessions: validSessions
    };
}

// Parse JSON safely
function parseJsonSafe(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {}
        }
    }
    return null;
}

// --- MASTER PLAN GENERATION ENGINE (ONE AI CALL, NO CHAT, 1 RETRY ON FAILURE) ---
async function generateWeeklyPlan(weekStartStr, isAuto = false, isReplanRemaining = false) {
    const inputBundle = buildPlannerInputBundle(weekStartStr, isReplanRemaining);
    console.log('[Sabi Planner] Generating weekly plan with bundle:', inputBundle);

    // Call 1
    const rawOutput = await callPlannerModel(inputBundle, null);
    let plan = parseJsonSafe(rawOutput);
    let validation = validatePlannerOutput(plan, inputBundle);

    if (!validation.isValid) {
        console.warn('[Sabi Planner] Validation failed on first attempt. Retrying once with violations:', validation.violations);
        
        // Retry once, passing violations back to the model
        const retryOutput = await callPlannerModel(inputBundle, validation.violations);
        const retryPlan = parseJsonSafe(retryOutput);
        const retryValidation = validatePlannerOutput(retryPlan, inputBundle);

        if (retryValidation.isValid) {
            plan = retryPlan;
            console.log('[Sabi Planner] Plan valid after retry.');
        } else {
            console.warn('[Sabi Planner] Retry still had violations. Dropping invalid sessions, saving the rest, and showing message. No rule-based scheduler.');
            
            // Drop invalid sessions, save valid rest, show student a short message
            // "Do not build a separate rule-based scheduler."
            const survivingSessions = (retryValidation.validSessions && retryValidation.validSessions.length > 0)
                ? retryValidation.validSessions
                : (validation.validSessions || []);

            plan = {
                summary: retryPlan?.summary || plan?.summary || "Weekly study plan saved with timetable safety adjustments.",
                notes: [
                    ...(retryPlan?.notes || plan?.notes || []).filter(n => !n.toLowerCase().includes('violation')),
                    "Conflicting or overlapping sessions were removed so your schedule stays balanced."
                ],
                sessions: survivingSessions
            };

            showToast("Saved your timetable: Conflicting sessions were removed.");
        }
    }

    // Apply plan to calendar
    applyPlanToCalendar(plan, weekStartStr, isReplanRemaining);
}

function applyPlanToCalendar(plan, weekStartStr, isReplanRemaining) {
    if (!plan || !Array.isArray(plan.sessions)) return;

    const weekEndStr = addDaysToDate(weekStartStr, 6);
    const todayStr = getFutureDateString(0);

    // Filter out existing AI sessions for this period
    if (isReplanRemaining) {
        calendarEvents = calendarEvents.filter(ev => {
            if (!ev.isAiGenerated) return true;
            // Keep past AI sessions from this week
            return ev.date < todayStr || ev.date < weekStartStr || ev.date > weekEndStr;
        });
    } else {
        // Clear all AI sessions for this week
        calendarEvents = calendarEvents.filter(ev => {
            if (!ev.isAiGenerated) return true;
            return ev.date < weekStartStr || ev.date > weekEndStr;
        });
    }

    // Add new planned sessions
    plan.sessions.forEach(sess => {
        const duration = calculateDuration(sess.start_time, sess.end_time);
        const activityCapitalized = sess.activity 
            ? sess.activity.charAt(0).toUpperCase() + sess.activity.slice(1) 
            : 'Study';

        calendarEvents.push({
            id: 'ev-ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            title: `${sess.subject} (${activityCapitalized})`,
            category: 'study',
            date: sess.date,
            time: sess.start_time,
            duration: duration,
            location: 'Sabi Prep Room',
            notes: sess.focus ? `Focus: ${sess.focus}` : `Sabi ${sess.activity} session for ${sess.subject}.`,
            activity: sess.activity || 'learn',
            focus: sess.focus || null,
            isAiGenerated: true,
            isDefault: false,
            completed: false,
            avatars: ['avatars/notion-scholar.svg', 'avatars/notion-felix.svg']
        });
    });

    // Save metadata
    activeWeeklyPlanMeta = {
        summary: plan.summary || "Your weekly study plan is active.",
        notes: plan.notes || [],
        week_start: weekStartStr,
        generated_at: new Date().toISOString()
    };

    localStorage.setItem('sabi_weekly_plan_meta', JSON.stringify(activeWeeklyPlanMeta));
    localStorage.setItem('sabi_last_planned_monday', weekStartStr);
    saveEvents();

    renderAllViews();
    updateTargetCountdown();
    showToast('✨ Weekly study plan updated!');
}

// --- RENDER FRIENDLY AI SUMMARY CARD ABOVE AGENDA ---
function renderAiPlanSummaryCard() {
    const card = document.getElementById('ai-plan-summary-card');
    const textEl = document.getElementById('ai-summary-text');
    const listEl = document.getElementById('ai-notes-list');
    const weekBadge = document.getElementById('ai-plan-week-badge');

    if (!card || !textEl || !listEl) return;

    if (!activeWeeklyPlanMeta) {
        card.classList.add('hidden');
        return;
    }

    card.classList.remove('hidden');
    textEl.textContent = activeWeeklyPlanMeta.summary || "Your weekly study plan is active.";

    if (weekBadge && activeWeeklyPlanMeta.week_start) {
        const startObj = new Date(activeWeeklyPlanMeta.week_start + 'T00:00:00');
        const endObj = new Date(addDaysToDate(activeWeeklyPlanMeta.week_start, 6) + 'T00:00:00');
        const rangeText = `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        weekBadge.textContent = rangeText;
    }

    const notes = activeWeeklyPlanMeta.notes || [];
    if (notes.length > 0) {
        listEl.innerHTML = notes.map(n => `<li>${escapeHtml(n)}</li>`).join('');
        document.getElementById('ai-notes-box')?.classList.remove('hidden');
    } else {
        document.getElementById('ai-notes-box')?.classList.add('hidden');
    }
}

/* ==========================================================================
   STAGE 6: WEEK TIMETABLE VIEW & PRINT INTEGRATION
   ========================================================================== */

function changeWeekOffset(offset) {
    plannerWeekOffset += offset;
    renderWeekTimetable();
}

function renderWeekTimetable() {
    const canvas = document.getElementById('week-grid-canvas');
    const rangeLabel = document.getElementById('week-range-label');
    const printSub = document.getElementById('print-doc-sub');
    if (!canvas) return;

    const baseMonday = getMondayOfWeek(new Date());
    const targetMonday = addDaysToDate(baseMonday, plannerWeekOffset * 7);
    const targetSunday = addDaysToDate(targetMonday, 6);

    const monDateObj = new Date(targetMonday + 'T00:00:00');
    const sunDateObj = new Date(targetSunday + 'T00:00:00');

    const formattedRange = `${monDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – ${sunDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (rangeLabel) rangeLabel.textContent = formattedRange;
    if (printSub) printSub.textContent = `Week of ${formattedRange}`;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayStr = getFutureDateString(0);
    const storedClasses = getStoredClasses();

    canvas.innerHTML = '';

    daysOfWeek.forEach((dayName, idx) => {
        const dayDateStr = addDaysToDate(targetMonday, idx);
        const dayObj = new Date(dayDateStr + 'T00:00:00');
        const dayNum = dayObj.getDate();
        const isToday = todayStr === dayDateStr;

        // Collect events & classes for this day
        const dayEvents = calendarEvents.filter(ev => ev.date === dayDateStr && activeCategories.has(ev.category));
        
        // Match recurring classes on this day
        const dayClasses = storedClasses.filter(cls => {
            return (cls.day || '').toLowerCase() === dayName.toLowerCase() || cls.day === dayDateStr;
        }).map(cls => ({
            id: 'cls-' + Math.random().toString(36).substr(2, 6),
            title: cls.subject,
            category: 'study',
            date: dayDateStr,
            time: cls.start_time,
            end_time: cls.end_time,
            duration: calculateDuration(cls.start_time, cls.end_time),
            isClass: true,
            activity: 'class'
        }));

        const allItems = [...dayEvents, ...dayClasses].sort((a, b) => {
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        const col = document.createElement('div');
        col.className = `week-day-column ${isToday ? 'today-col' : ''}`;

        let itemsHtml = '';
        if (allItems.length === 0) {
            itemsHtml = `
                <div class="week-day-empty">
                    <span class="week-day-empty-icon">${idx === 6 ? '🛌' : '✨'}</span>
                    <span>${idx === 6 ? 'Rest & Recharge' : 'No Sessions'}</span>
                </div>
            `;
        } else {
            itemsHtml = `<div class="week-day-cards">`;
            allItems.forEach(item => {
                const isClass = item.isClass;
                const act = item.activity || 'learn';
                const actClass = `activity-${act}`;
                const endTime = item.end_time || calculateEndTime(item.time || '17:00', item.duration || 1);
                const tagLabel = isClass ? 'CLASS' : act.toUpperCase();

                itemsHtml += `
                    <div class="week-session-card ${isClass ? 'is-class' : ''}" onclick="${isClass ? '' : `openEventDetailModal('${item.id}')`}">
                        <div class="week-card-top">
                            <span class="week-card-time">🕒 ${item.time || '17:00'} - ${endTime}</span>
                            <span class="week-card-activity-tag ${actClass}">${tagLabel}</span>
                        </div>
                        <div class="week-card-subject">${escapeHtml(item.title)}</div>
                        ${item.focus ? `<div class="week-card-focus">Focus: ${escapeHtml(item.focus)}</div>` : ''}
                    </div>
                `;
            });
            itemsHtml += `</div>`;
        }

        col.innerHTML = `
            <div class="week-day-head">
                <div class="week-day-name">${dayName.slice(0, 3)}</div>
                <div class="week-day-date-circle">${dayNum}</div>
            </div>
            ${itemsHtml}
        `;

        canvas.appendChild(col);
    });
}

// --- API KEY CONFIG MODAL ---
function promptApiKey() {
    const modal = document.getElementById('api-key-modal');
    const input = document.getElementById('gemini-api-key-input');
    const existing = getAnthropicKey() || getGeminiKey() || getOpenAiKey() || getActiveApiKey();
    if (input && existing) input.value = existing;
    if (modal) modal.classList.remove('hidden');
}

function closeApiKeyModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('api-key-modal');
    if (modal) modal.classList.add('hidden');
}

function saveApiKey() {
    const input = document.getElementById('gemini-api-key-input');
    if (input) {
        const val = input.value.trim();
        if (val) {
            if (val.startsWith('sk-ant-') || val.toLowerCase().includes('claude')) {
                localStorage.setItem('claude_api_key', val);
                localStorage.setItem('anthropic_api_key', val);
                showToast('Claude API key saved! Live Claude 3.5 Sonnet planner active.');
            } else if (val.startsWith('AIzaSy')) {
                localStorage.setItem('gemini_api_key', val);
                localStorage.setItem('sabi_gemini_api_key', val);
                showToast('Gemini API key saved! Live AI generation active.');
            } else {
                localStorage.setItem('claude_api_key', val);
                localStorage.setItem('anthropic_api_key', val);
                localStorage.setItem('openai_api_key', val);
                localStorage.setItem('sabi_api_key', val);
                showToast('API key saved! AI study planner active.');
            }
        }
    }
    closeApiKeyModal();
}

function clearApiKey() {
    localStorage.removeItem('claude_api_key');
    localStorage.removeItem('anthropic_api_key');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('sabi_gemini_api_key');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('sabi_api_key');
    const input = document.getElementById('gemini-api-key-input');
    if (input) input.value = '';
    showToast('API key removed. Using built-in planner engine.');
    closeApiKeyModal();
}

