/**
 * SABI OS: SMART ACADEMIC TIMETABLE & STUDY COMPANION
 * Dual support for recurring school/university classes and study/revision sessions.
 * Features friendly conversational Sabi AI Study Buddy, full manual CRUD,
 * daily agenda timeline, 7-day weekly grid, Google Calendar sync, and .ics export.
 */

// ==========================================
// --- ENVIRONMENT & API KEY CONFIGURATION ---
// Keys loaded from .env / env.js
// ==========================================
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

function getOpenRouterKey() {
    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.OPENROUTER_API_KEY || window.ENV.API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.startsWith('sk-or-')) return envKey.trim();
    }
    const local = (localStorage.getItem('openrouter_api_key') || localStorage.getItem('sabi_api_key') || '').trim();
    if (local && local.startsWith('sk-or-')) return local;
    return "";
}

const DEFAULT_NVIDIA_API_KEY = "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";

function getNvidiaKey() {
    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.NVIDIA_API_KEY || window.ENV.API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.startsWith('nvapi-')) return envKey.trim();
    }
    const local = (localStorage.getItem('nvidia_api_key') || localStorage.getItem('sabi_api_key') || '').trim();
    if (local && local.startsWith('nvapi-')) return local;
    return DEFAULT_NVIDIA_API_KEY;
}

function getActiveApiKey() {
    const orKey = getOpenRouterKey();
    if (orKey) return orKey;
    const nvKey = getNvidiaKey();
    if (nvKey) return nvKey;
    const claudeKey = getAnthropicKey();
    if (claudeKey) return claudeKey;
    const geminiKey = getGeminiKey();
    if (geminiKey) return geminiKey;
    const openAiKey = getOpenAiKey();
    if (openAiKey) return openAiKey;

    if (typeof window !== 'undefined' && window.ENV) {
        const envKey = window.ENV.API_KEY || window.ENV.SABI_API_KEY;
        if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
            return envKey.trim();
        }
    }
    return localStorage.getItem('sabi_api_key') || '';
}

// Helper: Safe fetch with timeout to avoid freezing UI
async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
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

// ==========================================
// --- RENDER ALL VIEWS --- (central re-render)
// ==========================================
function renderAllViews() {
    updateCalendarHeaderTitle();
    if (document.getElementById('mini-cal-days')) {
        renderMiniCalendarStrip();
    }
    if (currentViewMode === 'day') {
        renderDayTimeline();
    } else if (currentViewMode === 'week') {
        renderWeekTimetable();
    } else if (currentViewMode === 'month') {
        renderMonthCalendar();
    } else {
        renderAgendaTimeline();
    }
}
window.renderAllViews = renderAllViews;

// ==========================================
// --- DATE & TIME HELPERS ---
// ==========================================
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

function getSundayOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
}

function getMondayOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
}

function addDaysToDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDayNameFromDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
}

function calculateEndTime(startTime, durationHours = 1) {
    if (!startTime || !startTime.includes(':')) return '18:00';
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Math.round(durationHours * 60);
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    return `${endH}:${endM}`;
}

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime || !startTime.includes(':') || !endTime.includes(':')) return 1;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    return Math.max(0.5, Math.round((mins / 60) * 10) / 10);
}

function formatGoogleIso(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeIcs(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
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

// ==========================================
// --- DATA STORES & STATE ---
// ==========================================
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

const CATEGORIES = [
    { key: 'jamb', label: 'JAMB UTME', color: '#10B981' },
    { key: 'waec', label: 'WAEC SSCE', color: '#3D8EFF' },
    { key: 'neco', label: 'NECO', color: '#8B5CF6' },
    { key: 'noun', label: 'NOUN TMA', color: '#0EA5E9' },
    { key: 'ican', label: 'ICAN Diet', color: '#F59E0B' },
    { key: 'study', label: 'Study Drills', color: '#EC4899' }
];

let calendarEvents = [];
let storedClasses = [];
let selectedDate = getTodayStr();
let currentViewMode = 'day'; // 'day', 'agenda', 'week', or 'month'
let stripWeekOffset = 0;
let plannerWeekOffset = 0;
let agendaFilter = 'all'; // 'all', 'class', 'study'
let selectedDetailEventId = null;
let selectedDetailType = 'study'; // 'study' or 'class'

if (typeof window !== 'undefined') {
    window.storedClasses = storedClasses;
    window.calendarEvents = calendarEvents;
}

// ==========================================
// --- PERSISTENCE HELPERS ---
// ==========================================
function loadEvents() {
    try {
        const stored = localStorage.getItem('sabi_calendar_events_v5');
        calendarEvents = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(calendarEvents)) calendarEvents = [];
    } catch (e) {
        console.error('Failed to parse calendar events', e);
        calendarEvents = [];
    }
}

function saveEvents() {
    try {
        localStorage.setItem('sabi_calendar_events_v5', JSON.stringify(calendarEvents));
    } catch (e) {
        console.error('Failed to save events', e);
    }
}

function loadStoredClasses() {
    try {
        const stored = localStorage.getItem('sabi_classes_v5');
        storedClasses = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(storedClasses)) storedClasses = [];
    } catch (e) {
        console.error('Failed to parse classes', e);
        storedClasses = [];
    }
}

function saveStoredClasses(classes) {
    try {
        storedClasses = classes || [];
        localStorage.setItem('sabi_classes_v5', JSON.stringify(storedClasses));
    } catch (e) {
        console.error('Failed to save classes', e);
    }
}

function getStoredClasses() {
    return storedClasses;
}

// ==========================================
// --- APP INITIALIZATION ---
// ==========================================
function initCalendarApp() {
    loadEvents();
    loadStoredClasses();

    // Set initial date in modal
    const dateInput = document.getElementById('modal-session-date');
    if (dateInput) {
        dateInput.value = selectedDate || getTodayStr();
    }

    // Render components if on calendar page
    if (document.getElementById('mini-cal-days')) {
        renderMiniCalendarStrip();
        renderAllViews();
    }

    // Setup textarea auto-expand and Enter-to-send for chat input
    const chatInput = document.getElementById('chat-user-input');
    if (chatInput && !chatInput._hasAutoExpandListener) {
        chatInput._hasAutoExpandListener = true;
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage(e);
            }
        });
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
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
window.initCalendarApp = initCalendarApp;

// ========================================================
// --- FIRST-TIME POPUP MENU MODAL --- (WITH PROMINENT SKIP BUTTON)
// ========================================================
let intakeProfile = {
    target: 'uni',
    classes: [],
    hardSubjects: new Set(['Mathematics', 'Physics']),
    timeWindow: 'evening',
    hoursPerDay: '3-4'
};

function checkAndShowFirstTimePopup() {
    const hasEntered = localStorage.getItem('sabi_calendar_entered_v7') === 'true';
    if (!hasEntered) {
        setTimeout(() => {
            openFirstTimePopup();
        }, 120);
    }
}

function openFirstTimePopup() {
    const modal = document.getElementById('first-time-popup-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    // Reset to main menu
    const mainMenu = document.getElementById('popup-menu-main');
    const quickPanel = document.getElementById('popup-quick-panel');
    if (mainMenu) mainMenu.classList.remove('hidden');
    if (quickPanel) quickPanel.classList.add('hidden');

    renderPopupHardSubjects();
}
window.openFirstTimePopup = openFirstTimePopup;
window.openCalendarIntakeModal = openFirstTimePopup; // Backwards-compatible alias

function closeFirstTimePopup() {
    const modal = document.getElementById('first-time-popup-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeFirstTimePopup = closeFirstTimePopup;

function skipFirstTimePopup() {
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeFirstTimePopup();
    showToast('Entered Calendar! You can set up your schedule anytime.');
}
window.skipFirstTimePopup = skipFirstTimePopup;
window.skipIntakeAndEnterCalendar = skipFirstTimePopup; // Backwards-compatible alias

function startFirstTimeAiChat() {
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeFirstTimePopup();
    openSabiAiChat();
}
window.startFirstTimeAiChat = startFirstTimeAiChat;

function showPopupQuickSetup() {
    const mainMenu = document.getElementById('popup-menu-main');
    const quickPanel = document.getElementById('popup-quick-panel');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (quickPanel) quickPanel.classList.remove('hidden');
    renderPopupHardSubjects();
}
window.showPopupQuickSetup = showPopupQuickSetup;

function hidePopupQuickSetup() {
    const mainMenu = document.getElementById('popup-menu-main');
    const quickPanel = document.getElementById('popup-quick-panel');
    if (quickPanel) quickPanel.classList.add('hidden');
    if (mainMenu) mainMenu.classList.remove('hidden');
}
window.hidePopupQuickSetup = hidePopupQuickSetup;

function openAddSessionFromPopup(type) {
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeFirstTimePopup();
    openAddSessionModal(type || 'class');
}
window.openAddSessionFromPopup = openAddSessionFromPopup;

function selectIntakeTarget(targetKey) {
    intakeProfile.target = targetKey;
    document.querySelectorAll('#popup-target-chips .popup-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === targetKey);
    });
}
window.selectIntakeTarget = selectIntakeTarget;

function selectIntakeTimeWindow(windowKey) {
    intakeProfile.timeWindow = windowKey;
    document.querySelectorAll('#popup-time-window-chips .popup-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-window') === windowKey);
    });
}
window.selectIntakeTimeWindow = selectIntakeTimeWindow;

function renderPopupHardSubjects() {
    const container = document.getElementById('popup-hard-subjects-grid');
    if (!container) return;

    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'English', 'Accounting', 'Government', 'Literature'];
    container.innerHTML = subjects.map(sub => {
        const isHard = intakeProfile.hardSubjects.has(sub);
        return `
            <button type="button" class="popup-chip ${isHard ? 'hard-active' : ''}" onclick="togglePopupHardSubject('${escapeHtml(sub)}')">
                <span>${isHard ? '●' : '○'}</span>
                <span>${escapeHtml(sub)}</span>
            </button>
        `;
    }).join('');
}

function togglePopupHardSubject(sub) {
    if (intakeProfile.hardSubjects.has(sub)) {
        intakeProfile.hardSubjects.delete(sub);
    } else {
        intakeProfile.hardSubjects.add(sub);
    }
    renderPopupHardSubjects();
}
window.togglePopupHardSubject = togglePopupHardSubject;

function submitPopupQuickSetup() {
    const mondayStr = getMondayOfWeek(new Date());
    const targetExam = intakeProfile.target === 'uni' ? 'study' : intakeProfile.target;
    const hardSubsList = Array.from(intakeProfile.hardSubjects);
    const subjectsToSchedule = hardSubsList.length > 0 
        ? hardSubsList 
        : ['Mathematics', 'Physics', 'Use of English', 'Chemistry'];

    const timeMap = {
        morning: ['08:00', '10:30'],
        afternoon: ['13:00', '15:30'],
        evening: ['17:00', '19:00', '20:30'],
        night: ['21:00', '22:15']
    };
    const preferredTimes = timeMap[intakeProfile.timeWindow] || timeMap.evening;

    // Schedule 5 days Mon-Fri
    for (let i = 0; i < 5; i++) {
        const dateStr = addDaysToDate(mondayStr, i);
        const sub = subjectsToSchedule[i % subjectsToSchedule.length];
        const time = preferredTimes[i % preferredTimes.length];

        calendarEvents.push({
            id: 'ev-' + Date.now() + '-' + i,
            title: `${sub} Speed Drill`,
            category: targetExam,
            date: dateStr,
            time: time,
            duration: 1.5,
            location: 'Sabi Prep Room',
            notes: `Targeted revision drill and spaced repetition.`,
            completed: false,
            isAiGenerated: true
        });
    }

    saveEvents();

    // Mark completed and enter
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeFirstTimePopup();
    renderAllViews();
    showToast('Sabi generated your personalized timetable! Welcome.');
}
window.submitPopupQuickSetup = submitPopupQuickSetup;
window.submitIntakeAndGenerateTimetable = submitPopupQuickSetup;

// ==========================================
// --- CALENDAR HEADER & VIEW CONTROLS ---
// ==========================================
function updateCalendarHeaderTitle() {
    const titleEl = document.getElementById('cal-deck-month-title');
    const stripMonthLabel = document.getElementById('strip-month-label');
    
    // Format month and year based on selectedDate
    const d = new Date(selectedDate + 'T00:00:00');
    const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (titleEl) titleEl.textContent = monthYear;
    if (stripMonthLabel) stripMonthLabel.textContent = monthYear;
}
window.updateCalendarHeaderTitle = updateCalendarHeaderTitle;

function toggleViewDropdown(event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById('cal-view-popover');
    if (popover) {
        popover.classList.toggle('hidden');
    }
}
window.toggleViewDropdown = toggleViewDropdown;

function selectViewFromDropdown(mode) {
    switchViewMode(mode);
    const popover = document.getElementById('cal-view-popover');
    if (popover) popover.classList.add('hidden');
}
window.selectViewFromDropdown = selectViewFromDropdown;

function toggleCalendarSearch(force) {
    const bar = document.getElementById('cal-search-bar');
    const input = document.getElementById('cal-search-input');
    if (!bar) return;

    const willShow = typeof force === 'boolean' ? force : bar.classList.contains('hidden');
    if (willShow) {
        bar.classList.remove('hidden');
        if (input) {
            input.focus();
            input.select();
        }
    } else {
        bar.classList.add('hidden');
        if (input) input.value = '';
        renderAllViews();
    }
}
window.toggleCalendarSearch = toggleCalendarSearch;

function handleCalendarSearch(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
        renderAllViews();
        return;
    }

    if (currentViewMode === 'day') {
        const cards = document.querySelectorAll('.day-event-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(q) ? 'flex' : 'none';
        });
    } else if (currentViewMode === 'agenda') {
        const rows = document.querySelectorAll('.agenda-event-card');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? 'flex' : 'none';
        });
    }
}
window.handleCalendarSearch = handleCalendarSearch;

// Close popovers on click outside
document.addEventListener('click', (e) => {
    const popover = document.getElementById('cal-view-popover');
    const toggleBtn = document.getElementById('btn-view-selector-toggle');
    if (popover && !popover.classList.contains('hidden')) {
        if (!popover.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
            popover.classList.add('hidden');
        }
    }
});

// Format 24h string ('14:00') into 12h ('2:00 pm')
function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ==========================================
// --- VIEW SWITCHING ---
// ==========================================
function switchViewMode(mode) {
    if (!['day', 'agenda', 'week', 'month'].includes(mode)) mode = 'day';
    currentViewMode = mode;

    // 1. Update Dropdown Label and active states
    const labelEl = document.getElementById('current-view-label');
    const labelMap = {
        day: 'Day',
        agenda: 'Schedule',
        week: 'Week',
        month: 'Month'
    };
    if (labelEl) labelEl.textContent = labelMap[mode] || 'Day';

    document.querySelectorAll('.view-popover-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
    });

    // 2. Update Desktop segmented tabs
    document.querySelectorAll('.desktop-view-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
    });

    // 3. Show/hide view panes
    const panes = ['day', 'agenda', 'week', 'month'];
    panes.forEach(p => {
        const paneEl = document.getElementById(`view-${p}-container`);
        if (paneEl) {
            if (p === mode) {
                paneEl.classList.remove('hidden');
                paneEl.classList.add('active');
            } else {
                paneEl.classList.add('hidden');
                paneEl.classList.remove('active');
            }
        }
    });

    // 4. Render active view
    if (mode === 'day') {
        renderDayTimeline();
    } else if (mode === 'agenda') {
        renderAgendaTimeline();
    } else if (mode === 'week') {
        renderWeekTimetable();
    } else if (mode === 'month') {
        renderMonthCalendar();
    }
}
window.switchViewMode = switchViewMode;

// ==========================================
// --- 7-DAY MINI CALENDAR STRIP (SUN - SAT) ---
// ==========================================
function changeStripWeek(direction) {
    stripWeekOffset += direction;
    renderMiniCalendarStrip();
}
window.changeStripWeek = changeStripWeek;

function goToToday() {
    stripWeekOffset = 0;
    monthViewOffset = 0;
    selectedDate = getTodayStr();
    updateCalendarHeaderTitle();
    renderMiniCalendarStrip();
    renderAllViews();
}
window.goToToday = goToToday;

function onSelectDate(dateStr) {
    selectedDate = dateStr;
    updateCalendarHeaderTitle();
    renderMiniCalendarStrip();
    if (currentViewMode === 'day') {
        renderDayTimeline();
    } else if (currentViewMode === 'agenda') {
        renderAgendaTimeline();
    }
}
window.onSelectDate = onSelectDate;

function renderMiniCalendarStrip() {
    const container = document.getElementById('mini-cal-days');
    const label = document.getElementById('strip-month-label');
    if (!container) return;

    // Start week on Sunday (Sun to Sat) to match native calendar mockup!
    const baseSunday = getSundayOfWeek(new Date(selectedDate + 'T00:00:00'));
    const weekSundayStr = addDaysToDate(baseSunday, stripWeekOffset * 7);
    const weekSunDate = new Date(weekSundayStr + 'T00:00:00');

    if (label) {
        label.textContent = weekSunDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const todayStr = getTodayStr();
    const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let html = '';
    for (let i = 0; i < 7; i++) {
        const currentDateStr = addDaysToDate(weekSundayStr, i);
        const curDateObj = new Date(currentDateStr + 'T00:00:00');
        const dayNum = curDateObj.getDate();
        const isSelected = selectedDate === currentDateStr;
        const isToday = todayStr === currentDateStr;

        // Check if there are sessions or classes on this day
        const daySessionsCount = calendarEvents.filter(ev => ev.date === currentDateStr).length;
        const dayClassesCount = storedClasses.filter(cls => (cls.day || '').toLowerCase() === fullDayNames[i].toLowerCase()).length;
        const totalCount = daySessionsCount + dayClassesCount;

        html += `
            <button type="button" class="strip-day-btn ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}" onclick="onSelectDate('${currentDateStr}')">
                <span class="strip-day-name">${dayShortNames[i]}</span>
                <span class="strip-day-num">${dayNum}</span>
                ${totalCount > 0 ? `<span class="strip-dot-badge">${totalCount}</span>` : '<span class="strip-dot-badge empty"></span>'}
            </button>
        `;
    }

    container.innerHTML = html;
}

// ==========================================================
// --- VIEW 1: DAY TIMELINE / HOURLY VIEW (PRIMARY MOCKUP) ---
// ==========================================================
function renderDayTimeline() {
    const hoursCol = document.getElementById('timeline-hours-column');
    const eventsCanvas = document.getElementById('timeline-events-canvas');
    const marker = document.getElementById('timeline-current-time-marker');
    const markerTag = document.getElementById('current-time-tag');
    if (!hoursCol || !eventsCanvas) return;

    // 1. Build Hour Rows (07:00 to 22:00)
    let hoursHtml = '';
    for (let h = 7; h <= 22; h++) {
        let label = '';
        if (h === 12) {
            label = 'Noon';
        } else if (h < 12) {
            label = `${h}:00 am`;
        } else {
            label = `${h - 12}:00 pm`;
        }
        const hStr = String(h).padStart(2, '0') + ':00';
        hoursHtml += `
            <div class="timeline-hour-row" data-hour="${h}">
                <div class="timeline-hour-label">${label}</div>
                <div class="timeline-hour-slot" onclick="openAddSessionModal('study', '${hStr}')"></div>
            </div>
        `;
    }
    hoursCol.innerHTML = hoursHtml;

    // 2. Position Current Time Indicator if viewing Today
    if (marker && markerTag) {
        const isToday = selectedDate === getTodayStr();
        if (isToday) {
            const now = new Date();
            const curH = now.getHours();
            const curM = now.getMinutes();
            if (curH >= 7 && curH <= 22) {
                const topPx = (curH - 7 + curM / 60) * 68;
                marker.style.top = `${topPx}px`;
                marker.classList.remove('hidden');
                let timeText = '';
                if (curH === 12 && curM === 0) {
                    timeText = 'Noon ▶';
                } else {
                    const formatted = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
                    timeText = `${formatted} ▶`;
                }
                markerTag.textContent = timeText;
            } else {
                marker.classList.add('hidden');
            }
        } else {
            marker.classList.add('hidden');
        }
    }

    // 3. Collect Events for Selected Date
    const dayOfWeekName = getDayNameFromDate(selectedDate);
    
    // Recurring classes on this weekday
    const dayClasses = storedClasses.filter(c => (c.day || '').toLowerCase() === dayOfWeekName.toLowerCase()).map(c => ({
        id: c.id,
        title: c.subject,
        start_time: c.start_time || '09:00',
        end_time: c.end_time || '11:00',
        venue: c.venue || 'Lecture Hall',
        isClass: true,
        category: 'class'
    }));

    // Specific study/exam events on this date
    const daySessions = calendarEvents.filter(e => e.date === selectedDate).map(e => ({
        id: e.id,
        title: e.title,
        start_time: e.time || '14:00',
        end_time: e.end_time || getEndTime(e.time || '14:00', e.duration || 1.5),
        venue: e.notes || '',
        completed: !!e.completed,
        isClass: false,
        category: e.category || 'study'
    }));

    const allEvents = [...dayClasses, ...daySessions].sort((a, b) => {
        return (a.start_time || '00:00').localeCompare(b.start_time || '00:00');
    });

    if (allEvents.length === 0) {
        eventsCanvas.innerHTML = `
            <div class="day-timeline-empty-notice">
                <span>No classes or study sessions scheduled for today. Tap any hour slot to add.</span>
            </div>
        `;
        return;
    }

    const pastelPalettes = ['day-card-pink', 'day-card-blue', 'day-card-lavender', 'day-card-mint', 'day-card-amber'];

    let eventsHtml = '';
    allEvents.forEach((ev, idx) => {
        const [sH, sM] = (ev.start_time || '09:00').split(':').map(Number);
        const [eH, eM] = (ev.end_time || '10:30').split(':').map(Number);

        // Clamp to 7:00 - 23:00 timeline boundary
        const startFraction = Math.max(0, (sH - 7) + (sM || 0) / 60);
        const endFraction = Math.min(16, (eH - 7) + (eM || 0) / 60);
        const durationFraction = Math.max(0.65, endFraction - startFraction);

        const topPx = startFraction * 68 + 2;
        const heightPx = Math.max(durationFraction * 68 - 4, 46);

        // Pick distinct pastel theme
        let themeClass = pastelPalettes[idx % pastelPalettes.length];
        if (ev.isClass) {
            themeClass = 'day-card-blue';
        } else if (ev.title.toLowerCase().includes('research') || ev.title.toLowerCase().includes('project')) {
            themeClass = 'day-card-pink';
        } else if (ev.title.toLowerCase().includes('break') || ev.title.toLowerCase().includes('lunch')) {
            themeClass = 'day-card-mint';
        } else if (ev.category === 'exam' || ev.title.toLowerCase().includes('exam') || ev.title.toLowerCase().includes('test')) {
            themeClass = 'day-card-amber';
        }

        const safeTitle = escapeHtml(ev.title || 'Session');
        const safeVenue = ev.venue ? escapeHtml(ev.venue) : '';
        const timeRangeStr = `${formatTime12h(ev.start_time)} - ${formatTime12h(ev.end_time)}`;

        eventsHtml += `
            <div class="day-event-card ${themeClass}" style="top: ${topPx}px; height: ${heightPx}px;" onclick="openEventDetailModal('${ev.id}', ${ev.isClass})">
                <div class="day-event-card-inner">
                    <div class="day-event-top-row">
                        <strong class="day-event-title">${safeTitle}</strong>
                        <span class="day-event-check ${ev.completed ? 'checked' : ''}" onclick="event.stopPropagation(); toggleEventCompleted('${ev.id}')">
                            ${ev.completed ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                        </span>
                    </div>
                    <div class="day-event-meta-row">
                        <span class="day-event-time">${timeRangeStr}</span>
                        ${safeVenue ? `<span class="day-event-venue">• ${safeVenue}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    eventsCanvas.innerHTML = eventsHtml;
}

// ==========================================
// --- VIEW 4: MONTH CALENDAR GRID VIEW ---
// ==========================================
let monthViewOffset = 0;
function changeMonthOffset(dir) {
    monthViewOffset += dir;
    renderMonthCalendar();
}
window.changeMonthOffset = changeMonthOffset;

function renderMonthCalendar() {
    const gridEl = document.getElementById('month-grid-canvas');
    const labelEl = document.getElementById('month-range-label');
    if (!gridEl) return;

    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + monthViewOffset);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    if (labelEl) {
        labelEl.textContent = baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayStr();

    let cellsHtml = '';

    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
        cellsHtml += `<div class="month-day-cell empty"></div>`;
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
        const curDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = getDayNameFromDate(curDateStr);
        const isToday = curDateStr === todayStr;
        const isSelected = curDateStr === selectedDate;

        const classCount = storedClasses.filter(c => (c.day || '').toLowerCase() === dayOfWeek.toLowerCase()).length;
        const sessionCount = calendarEvents.filter(e => e.date === curDateStr).length;
        const totalEvents = classCount + sessionCount;

        cellsHtml += `
            <div class="month-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="onSelectDate('${curDateStr}'); switchViewMode('day');">
                <span class="month-cell-num">${d}</span>
                ${totalEvents > 0 ? `<div class="month-event-dots"><span class="m-dot"></span>${totalEvents > 1 ? '<span class="m-dot"></span>' : ''}</div>` : ''}
            </div>
        `;
    }

    gridEl.innerHTML = cellsHtml;
}

// ==========================================
// --- AGENDA SCHEDULE VIEW ---
// ==========================================
function filterAgendaEvents(type) {
    agendaFilter = type;
    document.querySelectorAll('.agenda-filter-chips .filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === type);
    });
    renderAgendaTimeline();
}
window.filterAgendaEvents = filterAgendaEvents;

function renderAgendaTimeline() {
    const container = document.getElementById('agenda-timeline-list');
    const titleEl = document.getElementById('agenda-section-title');
    if (!container) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeekName = getDayNameFromDate(selectedDate);
    const isToday = selectedDate === getTodayStr();
    const dayDisplay = isToday
        ? 'Today'
        : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (titleEl) {
        titleEl.textContent = `Schedule for ${dayDisplay}`;
    }

    // 1. Recurring classes matching this day of the week
    let matchedClasses = [];
    if (agendaFilter === 'all' || agendaFilter === 'class') {
        matchedClasses = storedClasses.filter(cls => {
            return (cls.day || '').toLowerCase() === dayOfWeekName.toLowerCase();
        }).map(cls => ({
            id: cls.id || ('cls-' + Math.random().toString(36).substr(2, 6)),
            title: cls.subject,
            time: cls.start_time,
            end_time: cls.end_time,
            duration: calculateDuration(cls.start_time, cls.end_time),
            location: cls.venue || 'Classroom / Lecture Hall',
            isClass: true,
            day: cls.day
        }));
    }

    // 2. Study sessions on this specific date
    let matchedSessions = [];
    if (agendaFilter === 'all' || agendaFilter === 'study') {
        matchedSessions = calendarEvents.filter(ev => ev.date === selectedDate).map(ev => ({
            ...ev,
            isClass: false
        }));
    }

    // Combine and sort chronologically
    const combined = [...matchedClasses, ...matchedSessions].sort((a, b) => {
        return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    if (combined.length === 0) {
        container.innerHTML = `
            <div class="session-empty-card">
                <span class="session-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                <p>No ${agendaFilter === 'class' ? 'classes' : (agendaFilter === 'study' ? 'study sessions' : 'events')} scheduled for ${dayDisplay}.</p>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px;">
                    <button type="button" class="btn-minimal-add" onclick="openAddSessionModal('study')">
                        + Study Session
                    </button>
                    <button type="button" class="btn-minimal-add" style="border-color: #6366F1; color: #818CF8;" onclick="openAddSessionModal('class')">
                        + Recurring Class
                    </button>
                </div>
            </div>
        `;
        return;
    }

    let html = combined.map(item => {
        if (item.isClass) {
            return `
                <div class="session-card is-class" onclick="openClassDetailModal('${item.id}')">
                    <div class="session-card-main">
                        <div class="session-card-header">
                            <span class="class-tag-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>Class Lecture</span>
                            <span class="session-time-text"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${item.time || '09:00'} - ${item.end_time || '11:00'} · Every ${item.day}</span>
                        </div>
                        <h4 class="session-title">${escapeHtml(item.title)}</h4>
                        <div class="class-venue-info">
                            <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(item.location || 'Lecture Hall')}</span>
                        </div>
                    </div>
                    <div class="session-card-actions">
                        <button type="button" class="btn-detail-edit" onclick="event.stopPropagation(); editClassById('${item.id}')" title="Edit Class">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            const categoryName = getCategoryBadgeText(item.category || 'study');
            return `
                <div class="session-card cat-${item.category || 'study'} ${item.completed ? 'completed' : ''}" onclick="openEventDetailModal('${item.id}')">
                    <div class="session-card-main">
                        <div class="session-card-header">
                            <span class="session-cat-pill cat-${item.category || 'study'}">${categoryName}</span>
                            <span class="session-time-text"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${item.time || '17:00'} · ${item.duration || 1.5}h</span>
                        </div>
                        <h4 class="session-title">${escapeHtml(item.title)}</h4>
                        ${item.notes ? `<p class="session-notes-snippet">${escapeHtml(item.notes)}</p>` : ''}
                    </div>
                    <div class="session-card-actions">
                        <button type="button" class="session-check-pill ${item.completed ? 'active' : ''}" onclick="event.stopPropagation(); toggleEventComplete('${item.id}')" title="${item.completed ? 'Mark incomplete' : 'Mark done'}" aria-label="Mark done">
                            ${item.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = html;
}

// ==========================================
// --- WEEK TIMETABLE GRID VIEW ---
// ==========================================
function changeWeekOffset(offset) {
    plannerWeekOffset += offset;
    renderWeekTimetable();
}
window.changeWeekOffset = changeWeekOffset;

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
    const todayStr = getTodayStr();

    canvas.innerHTML = '';

    daysOfWeek.forEach((dayName, idx) => {
        const dayDateStr = addDaysToDate(targetMonday, idx);
        const dayObj = new Date(dayDateStr + 'T00:00:00');
        const dayNum = dayObj.getDate();
        const isToday = todayStr === dayDateStr;

        // 1. Study sessions on this date
        const daySessions = calendarEvents.filter(ev => ev.date === dayDateStr).map(ev => ({
            ...ev,
            isClass: false
        }));

        // 2. Recurring classes for this day
        const dayClasses = storedClasses.filter(cls => {
            return (cls.day || '').toLowerCase() === dayName.toLowerCase();
        }).map(cls => ({
            id: cls.id,
            title: cls.subject,
            time: cls.start_time,
            end_time: cls.end_time,
            duration: calculateDuration(cls.start_time, cls.end_time),
            location: cls.venue || 'Lecture Hall',
            isClass: true
        }));

        const allItems = [...dayClasses, ...daySessions].sort((a, b) => {
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        const col = document.createElement('div');
        col.className = `week-day-column ${isToday ? 'today-col' : ''}`;

        let itemsHtml = '';
        if (allItems.length === 0) {
            itemsHtml = `
                <div class="week-day-empty">
                    <span class="week-day-empty-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>
                    <span>${idx === 6 ? 'Rest Day' : 'No Events'}</span>
                </div>
            `;
        } else {
            itemsHtml = `<div class="week-day-cards">`;
            allItems.forEach(item => {
                const isClass = item.isClass;
                const endTime = item.end_time || calculateEndTime(item.time || '17:00', item.duration || 1.5);
                const tagLabel = isClass ? 'CLASS' : 'STUDY';
                const tagClass = isClass ? 'activity-class' : 'activity-practice';

                itemsHtml += `
                    <div class="week-session-card ${isClass ? 'is-class' : ''}" onclick="${isClass ? `openClassDetailModal('${item.id}')` : `openEventDetailModal('${item.id}')`}">
                        <div class="week-card-top">
                            <span class="week-card-time"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${item.time || '17:00'} - ${endTime}</span>
                            <span class="week-card-activity-tag ${tagClass}">${tagLabel}</span>
                        </div>
                        <div class="week-card-subject">${escapeHtml(item.title)}</div>
                        ${isClass && item.location ? `<div class="week-card-focus"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(item.location)}</div>` : ''}
                        ${!isClass && item.notes ? `<div class="week-card-focus">${escapeHtml(item.notes)}</div>` : ''}
                    </div>
                `;
            });
            itemsHtml += `</div>`;
        }

        col.innerHTML = `
            <div class="week-day-head" onclick="onSelectDate('${dayDateStr}'); switchViewMode('agenda');">
                <div class="week-day-name">${dayName.slice(0, 3)}</div>
                <div class="week-day-date-circle">${dayNum}</div>
            </div>
            ${itemsHtml}
        `;

        canvas.appendChild(col);
    });
}

// ==========================================
// --- MANUAL ADD & EDIT MODAL ---
// ==========================================
function switchModalEventType(type) {
    const studyFields = document.getElementById('fields-study-session');
    const classFields = document.getElementById('fields-recurring-class');
    const btnStudy = document.getElementById('btn-type-study');
    const btnClass = document.getElementById('btn-type-class');
    const modalTypeInput = document.getElementById('modal-edit-type');
    const btnSaveText = document.getElementById('btn-modal-save-text');
    const isEdit = Boolean(document.getElementById('modal-edit-id')?.value);

    if (type === 'class') {
        if (studyFields) studyFields.classList.add('hidden');
        if (classFields) classFields.classList.remove('hidden');
        if (btnStudy) btnStudy.classList.remove('active');
        if (btnClass) btnClass.classList.add('active');
        if (modalTypeInput) modalTypeInput.value = 'class';
        if (btnSaveText) btnSaveText.textContent = isEdit ? 'Update Class' : 'Save Recurring Class';
    } else {
        if (studyFields) studyFields.classList.remove('hidden');
        if (classFields) classFields.classList.add('hidden');
        if (btnStudy) btnStudy.classList.add('active');
        if (btnClass) btnClass.classList.remove('active');
        if (modalTypeInput) modalTypeInput.value = 'study';
        if (btnSaveText) btnSaveText.textContent = isEdit ? 'Update Study Session' : 'Save Study Session';
    }
}
window.switchModalEventType = switchModalEventType;

function openAddSessionModal(initialType = 'study', prefillData = null) {
    const overlay = document.getElementById('add-session-modal');
    const sheetTitle = document.getElementById('modal-sheet-title');
    const editIdInput = document.getElementById('modal-edit-id');
    const editTypeInput = document.getElementById('modal-edit-type');
    const dateInput = document.getElementById('modal-session-date');

    // Reset inputs
    if (editIdInput) editIdInput.value = prefillData?.id || '';
    if (sheetTitle) sheetTitle.textContent = prefillData ? 'Edit Timetable Entry' : 'Add to Timetable';

    if (dateInput && !prefillData) {
        dateInput.value = selectedDate || getTodayStr();
    }

    if (prefillData) {
        if (initialType === 'class') {
            document.getElementById('modal-class-subject').value = prefillData.subject || '';
            document.getElementById('modal-class-day').value = prefillData.day || 'Monday';
            document.getElementById('modal-class-start').value = prefillData.start_time || '09:00';
            document.getElementById('modal-class-end').value = prefillData.end_time || '11:00';
            document.getElementById('modal-class-venue').value = prefillData.venue || '';
        } else {
            document.getElementById('modal-session-title').value = prefillData.title || '';
            document.getElementById('modal-session-category').value = prefillData.category || 'study';
            document.getElementById('modal-session-date').value = prefillData.date || selectedDate;
            document.getElementById('modal-session-time').value = prefillData.time || '17:00';
            document.getElementById('modal-session-duration').value = prefillData.duration || 1.5;
            document.getElementById('modal-session-notes').value = prefillData.notes || '';
        }
    }

    switchModalEventType(initialType);

    if (overlay) {
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}
window.openAddSessionModal = openAddSessionModal;

function closeAddSessionModal(e) {
    // Allow programmatic calls (no event) or clicks on the overlay/close button
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn') && !e.target.classList.contains('modal-overlay')) return;
    const overlay = document.getElementById('add-session-modal');
    if (overlay) {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
    const editIdEl = document.getElementById('modal-edit-id');
    if (editIdEl) editIdEl.value = '';
}
window.closeAddSessionModal = closeAddSessionModal;

function handleSaveSession(e) {
    e.preventDefault();
    const type = document.getElementById('modal-edit-type')?.value || 'study';
    const editId = document.getElementById('modal-edit-id')?.value;

    if (type === 'class') {
        const subject = document.getElementById('modal-class-subject')?.value.trim();
        const day = document.getElementById('modal-class-day')?.value || 'Monday';
        const start = document.getElementById('modal-class-start')?.value || '09:00';
        const end = document.getElementById('modal-class-end')?.value || '11:00';
        const venue = document.getElementById('modal-class-venue')?.value.trim();

        if (!subject) {
            alert('Please enter the course code or subject.');
            return;
        }

        let savedClass = null;
        if (editId) {
            const idx = storedClasses.findIndex(c => c.id === editId);
            if (idx !== -1) {
                const prev = storedClasses[idx];
                storedClasses[idx] = { ...prev, id: editId, subject, day, start_time: start, end_time: end, venue, isRecurring: true };
                savedClass = storedClasses[idx];
            }
        } else {
            savedClass = {
                id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                subject,
                day,
                start_time: start,
                end_time: end,
                venue,
                isRecurring: true
            };
            storedClasses.push(savedClass);
        }
        saveStoredClasses(storedClasses);
        showToast(editId ? 'Class updated!' : 'Recurring class added to timetable!');
        if (savedClass && typeof isGcalConnected === 'function' && isGcalConnected() && isGcalAutoSyncEnabled()) {
            syncClassToGoogle(savedClass, true);
        }
    } else {
        const title = document.getElementById('modal-session-title')?.value.trim();
        const category = document.getElementById('modal-session-category')?.value || 'study';
        const date = document.getElementById('modal-session-date')?.value || getTodayStr();
        const time = document.getElementById('modal-session-time')?.value || '17:00';
        const duration = parseFloat(document.getElementById('modal-session-duration')?.value || 1.5);
        const notes = document.getElementById('modal-session-notes')?.value.trim();
        const syncGcal = document.getElementById('modal-session-gcal-sync')?.checked;

        if (!title) {
            alert('Please enter a session subject or topic.');
            return;
        }

        let savedEvent = null;
        if (editId) {
            const idx = calendarEvents.findIndex(ev => ev.id === editId);
            if (idx !== -1) {
                calendarEvents[idx] = {
                    ...calendarEvents[idx],
                    title,
                    category,
                    date,
                    time,
                    duration,
                    notes
                };
                savedEvent = calendarEvents[idx];
            }
        } else {
            savedEvent = {
                id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                title,
                category,
                date,
                time,
                duration,
                location: 'Sabi Prep Room',
                notes,
                completed: false,
                isAiGenerated: false
            };
            calendarEvents.push(savedEvent);
        }
        saveEvents();
        showToast(editId ? 'Study session updated!' : 'Study session scheduled!');

        if (savedEvent) {
            if (typeof isGcalConnected === 'function' && isGcalConnected() && isGcalAutoSyncEnabled()) {
                syncSingleEventToGoogle(savedEvent, false);
            } else if (syncGcal) {
                window.open(createGoogleCalendarUrl(savedEvent), '_blank');
            }
        }
    }

    closeAddSessionModal();
    renderAllViews();
}
window.handleSaveSession = handleSaveSession;

// ==========================================
// --- EVENT DETAILS & CLASS DETAILS MODAL ---
// ==========================================
function openEventDetailModal(id) {
    const ev = calendarEvents.find(e => e.id === id);
    if (!ev) return;

    selectedDetailEventId = id;
    selectedDetailType = 'study';

    const modal = document.getElementById('event-detail-modal');
    const tag = document.getElementById('detail-event-tag');
    const title = document.getElementById('detail-event-title');
    const time = document.getElementById('detail-event-time');
    const loc = document.getElementById('detail-event-location');
    const notes = document.getElementById('detail-event-notes');
    const gcalBtn = document.getElementById('detail-gcal-btn');
    const compBtn = document.getElementById('detail-complete-btn');

    if (tag) {
        tag.textContent = getCategoryBadgeText(ev.category || 'study');
        tag.style.color = getCategoryColor(ev.category || 'study');
    }
    if (title) title.textContent = ev.title;
    if (time) time.textContent = `${ev.date} at ${ev.time || '17:00'} (${ev.duration || 1.5} hrs)`;
    if (loc) loc.textContent = ev.location || 'Sabi Prep Room';
    if (notes) notes.textContent = ev.notes || 'No extra notes provided.';
    if (gcalBtn) {
        gcalBtn.style.display = 'inline-flex';
        gcalBtn.href = createGoogleCalendarUrl(ev);
    }
    if (compBtn) {
        compBtn.style.display = 'inline-flex';
        compBtn.textContent = ev.completed ? 'Mark Pending' : 'Mark Done';
    }

    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}
window.openEventDetailModal = openEventDetailModal;

function openClassDetailModal(id) {
    const cls = storedClasses.find(c => c.id === id);
    if (!cls) return;

    selectedDetailEventId = id;
    selectedDetailType = 'class';

    const modal = document.getElementById('event-detail-modal');
    const tag = document.getElementById('detail-event-tag');
    const title = document.getElementById('detail-event-title');
    const time = document.getElementById('detail-event-time');
    const loc = document.getElementById('detail-event-location');
    const notes = document.getElementById('detail-event-notes');
    const gcalBtn = document.getElementById('detail-gcal-btn');
    const compBtn = document.getElementById('detail-complete-btn');

    if (tag) {
        tag.textContent = 'RECURRING CLASS';
        tag.style.color = '#818CF8';
    }
    if (title) title.textContent = cls.subject;
    if (time) time.textContent = `Every ${cls.day}, ${cls.start_time} - ${cls.end_time}`;
    if (loc) loc.textContent = cls.venue || 'Classroom / Lecture Hall';
    if (notes) notes.textContent = 'Recurring weekly lecture on your academic timetable.';
    if (gcalBtn) {
        gcalBtn.style.display = 'none'; // Recurring classes exported via .ics
    }
    if (compBtn) {
        compBtn.style.display = 'none';
    }

    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}
window.openClassDetailModal = openClassDetailModal;

function closeEventDetailModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const modal = document.getElementById('event-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    selectedDetailEventId = null;
}
window.closeEventDetailModal = closeEventDetailModal;

function editCurrentDetailEvent() {
    if (!selectedDetailEventId) return;
    const type = selectedDetailType;
    const id = selectedDetailEventId;
    closeEventDetailModal();

    if (type === 'class') {
        const cls = storedClasses.find(c => c.id === id);
        if (cls) openAddSessionModal('class', cls);
    } else {
        const ev = calendarEvents.find(e => e.id === id);
        if (ev) openAddSessionModal('study', ev);
    }
}
window.editCurrentDetailEvent = editCurrentDetailEvent;

function editClassById(id) {
    const cls = storedClasses.find(c => c.id === id);
    if (cls) openAddSessionModal('class', cls);
}
window.editClassById = editClassById;

function deleteCurrentDetailEvent() {
    if (!selectedDetailEventId) return;
    const isClass = selectedDetailType === 'class';
    const msg = isClass ? 'Delete this recurring class from your timetable?' : 'Delete this study session?';

    if (confirm(msg)) {
        if (isClass) {
            const toDel = storedClasses.find(c => c.id === selectedDetailEventId);
            if (toDel?.gcalEventId && typeof deleteClassFromGoogle === 'function') {
                deleteClassFromGoogle(toDel.gcalEventId);
            }
            storedClasses = storedClasses.filter(c => c.id !== selectedDetailEventId);
            saveStoredClasses(storedClasses);
        } else {
            const toDel = calendarEvents.find(e => e.id === selectedDetailEventId);
            if (toDel?.gcalEventId && typeof deleteEventFromGoogle === 'function') {
                deleteEventFromGoogle(toDel.gcalEventId);
            }
            calendarEvents = calendarEvents.filter(e => e.id !== selectedDetailEventId);
            saveEvents();
        }
        closeEventDetailModal();
        renderAllViews();
        showToast('Item deleted.');
    }
}
window.deleteCurrentDetailEvent = deleteCurrentDetailEvent;

function toggleEventComplete(id) {
    const ev = calendarEvents.find(e => e.id === id);
    if (!ev) return;
    ev.completed = !ev.completed;
    saveEvents();
    renderAllViews();
    showToast(ev.completed ? 'Session completed!' : 'Marked pending.');
    if (ev.gcalEventId && typeof isGcalConnected === 'function' && isGcalConnected() && isGcalAutoSyncEnabled()) {
        syncSingleEventToGoogle(ev, true);
    }
}
window.toggleEventComplete = toggleEventComplete;

function toggleCurrentDetailComplete() {
    if (!selectedDetailEventId) return;
    toggleEventComplete(selectedDetailEventId);
    closeEventDetailModal();
}
window.toggleCurrentDetailComplete = toggleCurrentDetailComplete;

// ==========================================
// --- SABI AI STUDY BUDDY CONVERSATIONAL ASSISTANT ---
// ==========================================
let pendingChatMedia = null; // { name, type, size, dataUrl, textContent }

const DEFAULT_CHAT_GREETING = {
    role: 'bot',
    content: "Hey! I'm Steady, your academic mentor and study partner. What degree, courses, or exam (JAMB, WAEC, NOUN, ICAN) are you focusing on this semester? *(Tap the attach button below to upload a course outline)*",
    timestamp: 'Just now'
};

// 3-Day Conversation Storage Policy (Untouched conversations deleted after 72 hours)
const CHAT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

function createNewSessionData(title) {
    const now = Date.now();
    return {
        id: 'sess-' + now + '-' + Math.random().toString(36).substr(2, 5),
        title: title || 'New Conversation',
        createdAt: now,
        lastUpdated: now,
        messages: [DEFAULT_CHAT_GREETING]
    };
}

function pruneOldChatSessions(sessions) {
    const now = Date.now();
    return (sessions || []).filter(s => {
        const lastTouch = s.lastUpdated || s.createdAt || now;
        return (now - lastTouch) < CHAT_RETENTION_MS;
    });
}

function getAllChatSessions() {
    let sessions = [];
    try {
        const stored = localStorage.getItem('sabi_chat_sessions_v2');
        if (stored) {
            sessions = JSON.parse(stored) || [];
        } else {
            // Migrate legacy single-history storage
            const legacy = localStorage.getItem('sabi_chat_history_v4');
            if (legacy) {
                const parsed = JSON.parse(legacy);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const migrated = createNewSessionData('Previous Session');
                    migrated.messages = parsed;
                    sessions = [migrated];
                }
            }
        }
    } catch (e) {
        sessions = [];
    }

    // Auto-prune sessions untouched for over 3 days
    const pruned = pruneOldChatSessions(sessions);
    if (pruned.length !== sessions.length) {
        try {
            localStorage.setItem('sabi_chat_sessions_v2', JSON.stringify(pruned));
        } catch (e) {}
    }

    if (pruned.length === 0) {
        const fresh = createNewSessionData('New Conversation');
        pruned.push(fresh);
        try {
            localStorage.setItem('sabi_chat_sessions_v2', JSON.stringify(pruned));
            localStorage.setItem('sabi_active_session_id', fresh.id);
        } catch (e) {}
    }

    return pruned;
}

function saveAllChatSessions(sessions) {
    try {
        const pruned = pruneOldChatSessions(sessions);
        localStorage.setItem('sabi_chat_sessions_v2', JSON.stringify(pruned));
    } catch (e) {
        console.warn('Failed to save chat sessions:', e);
    }
}

function getActiveSession() {
    const sessions = getAllChatSessions();
    const activeId = localStorage.getItem('sabi_active_session_id');
    let session = sessions.find(s => s.id === activeId);
    if (!session) {
        session = sessions[0] || createNewSessionData('New Conversation');
        localStorage.setItem('sabi_active_session_id', session.id);
    }
    return session;
}

function getChatHistory() {
    const session = getActiveSession();
    return Array.isArray(session.messages) && session.messages.length > 0
        ? session.messages
        : [DEFAULT_CHAT_GREETING];
}

function saveChatHistory(history) {
    try {
        const sanitized = (history || []).slice(-35).map(msg => {
            if (!msg.media) return msg;
            const cleanMedia = { ...msg.media };
            if (cleanMedia.dataUrl && cleanMedia.dataUrl.length > 2500) {
                cleanMedia.dataUrl = null;
            }
            return {
                ...msg,
                media: cleanMedia
            };
        });

        const sessions = getAllChatSessions();
        const activeId = localStorage.getItem('sabi_active_session_id');
        let session = sessions.find(s => s.id === activeId);

        if (!session) {
            session = createNewSessionData('New Conversation');
            sessions.unshift(session);
            localStorage.setItem('sabi_active_session_id', session.id);
        }

        session.messages = sanitized;
        session.lastUpdated = Date.now();

        // Auto-generate title from the first user message if default
        if (session.title === 'New Conversation' || session.title.startsWith('New Conv')) {
            const firstUserMsg = sanitized.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.content) {
                const clean = firstUserMsg.content.replace(/[^\w\s-]/g, '').trim();
                session.title = clean.length > 30 ? clean.slice(0, 30) + '...' : clean || 'Study Session';
            }
        }

        saveAllChatSessions(sessions);
    } catch (e) {
        console.warn('Failed to save chat history:', e);
    }
}

function startNewChatSession() {
    const sessions = getAllChatSessions();
    const newSession = createNewSessionData('New Conversation');
    sessions.unshift(newSession);
    localStorage.setItem('sabi_active_session_id', newSession.id);
    saveAllChatSessions(sessions);

    toggleChatHistoryDrawer(false);
    removePendingChatMedia();

    const input = document.getElementById('chat-user-input');
    if (input) input.value = '';

    renderChatMessages();
    renderChatQuickChips();
    showToast('Started new conversation');
}
window.startNewChatSession = startNewChatSession;

function switchChatSession(sessionId) {
    const sessions = getAllChatSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
        target.lastUpdated = Date.now();
        localStorage.setItem('sabi_active_session_id', sessionId);
        saveAllChatSessions(sessions);
        toggleChatHistoryDrawer(false);
        removePendingChatMedia();
        renderChatMessages();
        renderChatQuickChips();
        showToast('Switched conversation');
    }
}
window.switchChatSession = switchChatSession;

function deleteChatSession(sessionId, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let sessions = getAllChatSessions();
    sessions = sessions.filter(s => s.id !== sessionId);

    if (sessions.length === 0) {
        const fresh = createNewSessionData('New Conversation');
        sessions = [fresh];
        localStorage.setItem('sabi_active_session_id', fresh.id);
    } else {
        const currentActive = localStorage.getItem('sabi_active_session_id');
        if (currentActive === sessionId) {
            localStorage.setItem('sabi_active_session_id', sessions[0].id);
        }
    }

    saveAllChatSessions(sessions);
    renderChatHistoryList();
    renderChatMessages();
    showToast('Conversation deleted');
}
window.deleteChatSession = deleteChatSession;

function toggleChatHistoryDrawer(forceState) {
    const panel = document.getElementById('studio-history-panel');
    if (!panel) return;

    const willShow = typeof forceState === 'boolean' ? forceState : panel.classList.contains('hidden');
    if (willShow) {
        renderChatHistoryList();
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}
window.toggleChatHistoryDrawer = toggleChatHistoryDrawer;

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

function renderChatHistoryList() {
    const container = document.getElementById('studio-history-list');
    if (!container) return;

    const sessions = getAllChatSessions();
    const activeId = localStorage.getItem('sabi_active_session_id');

    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="studio-history-empty">
                No previous conversations found.<br>Tap "New" to start a new chat.
            </div>
        `;
        return;
    }

    container.innerHTML = sessions.map(sess => {
        const isActive = sess.id === activeId;
        const msgCount = Array.isArray(sess.messages) ? sess.messages.length : 0;
        const relativeTime = formatRelativeTime(sess.lastUpdated);

        return `
            <div class="studio-history-item ${isActive ? 'active' : ''}" onclick="switchChatSession('${escapeHtml(sess.id)}')">
                <div class="studio-history-item-info">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="studio-history-item-title">${escapeHtml(sess.title || 'Conversation')}</span>
                        ${isActive ? '<span class="studio-history-badge-active">Active</span>' : ''}
                    </div>
                    <div class="studio-history-item-meta">
                        <span>${relativeTime}</span>
                        <span>•</span>
                        <span>${msgCount} msg${msgCount === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <button type="button" class="studio-history-item-del" onclick="deleteChatSession('${escapeHtml(sess.id)}', event)" title="Delete Conversation" aria-label="Delete Conversation">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
    }).join('');
}
window.renderChatHistoryList = renderChatHistoryList;

let studioVisualViewportHandler = null;

function openSabiAiChat() {
    const hubMenu = document.getElementById('planner-dropdown-menu');
    if (hubMenu) hubMenu.classList.add('hidden');

    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.remove('hidden');
        if (window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';

            // Synchronize with mobile on-screen keyboard using visualViewport
            if (window.visualViewport) {
                if (studioVisualViewportHandler) {
                    window.visualViewport.removeEventListener('resize', studioVisualViewportHandler);
                    window.visualViewport.removeEventListener('scroll', studioVisualViewportHandler);
                }
                studioVisualViewportHandler = () => {
                    if (!drawer.classList.contains('hidden')) {
                        const h = window.visualViewport.height;
                        drawer.style.height = `${h}px`;
                        const container = document.getElementById('chat-messages-container');
                        if (container) container.scrollTop = container.scrollHeight;
                    }
                };
                studioVisualViewportHandler();
                window.visualViewport.addEventListener('resize', studioVisualViewportHandler);
                window.visualViewport.addEventListener('scroll', studioVisualViewportHandler);
            }
        }
    }

    // Close history drawer by default on open
    toggleChatHistoryDrawer(false);

    // Restore expanded sidebar preference
    const isExpanded = localStorage.getItem('sabi_studio_expanded') === 'true';
    const windowEl = document.querySelector('.copilot-studio-window');
    const expandBtn = document.getElementById('studio-toggle-expand');
    if (windowEl && isExpanded) {
        windowEl.classList.add('studio-expanded');
        if (expandBtn) expandBtn.classList.add('active');
    }

    setStudioMode(currentStudioMode || 'planner');
    renderChatMessages();

    setTimeout(() => {
        const input = document.getElementById('chat-user-input');
        if (input) input.focus();
    }, 200);
}
window.openSabiAiChat = openSabiAiChat;
window.openSteadyChat = openSabiAiChat;

function closeSabiAiChat(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('close-btn') && !e.target.closest('.close-btn') && !e.target.classList.contains('modal-overlay')) return;
    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
        drawer.style.height = '';
        document.body.style.overflow = '';
    }
    if (window.visualViewport && studioVisualViewportHandler) {
        window.visualViewport.removeEventListener('resize', studioVisualViewportHandler);
        window.visualViewport.removeEventListener('scroll', studioVisualViewportHandler);
    }
}
window.closeSabiAiChat = closeSabiAiChat;
window.closeSteadyChat = closeSabiAiChat;

function toggleStudioExpand() {
    const windowEl = document.querySelector('.copilot-studio-window');
    const btn = document.getElementById('studio-toggle-expand');
    if (!windowEl) return;
    const isExpanded = windowEl.classList.toggle('studio-expanded');
    try {
        localStorage.setItem('sabi_studio_expanded', isExpanded ? 'true' : 'false');
    } catch (e) {}
    if (btn) {
        btn.classList.toggle('active', isExpanded);
        btn.title = isExpanded ? 'Restore Sidebar Size' : 'Expand Split-Screen Studio';
    }
}
window.toggleStudioExpand = toggleStudioExpand;

let speechRecognitionInstance = null;
let isVoiceDictating = false;

function toggleVoiceDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('btn-voice-dictate');
    const input = document.getElementById('chat-user-input');

    if (!SpeechRecognition) {
        showToast('Voice dictation is not supported in this browser. Try Chrome, Edge, or Safari.');
        return;
    }

    if (isVoiceDictating && speechRecognitionInstance) {
        try { speechRecognitionInstance.stop(); } catch (e) {}
        isVoiceDictating = false;
        if (btn) btn.classList.remove('listening');
        return;
    }

    try {
        speechRecognitionInstance = new SpeechRecognition();
        speechRecognitionInstance.continuous = false;
        speechRecognitionInstance.interimResults = true;
        speechRecognitionInstance.lang = 'en-US';

        speechRecognitionInstance.onstart = () => {
            isVoiceDictating = true;
            if (btn) btn.classList.add('listening');
            showToast('Listening... Speak your prompt or schedule');
        };

        speechRecognitionInstance.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if (input) {
                input.value = transcript;
            }
        };

        speechRecognitionInstance.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            isVoiceDictating = false;
            if (btn) btn.classList.remove('listening');
            if (event.error !== 'no-speech') {
                showToast('Voice recognition error: ' + event.error);
            }
        };

        speechRecognitionInstance.onend = () => {
            isVoiceDictating = false;
            if (btn) btn.classList.remove('listening');
        };

        speechRecognitionInstance.start();
    } catch (err) {
        console.error('Failed to start speech recognition:', err);
        isVoiceDictating = false;
        if (btn) btn.classList.remove('listening');
    }
}
window.toggleVoiceDictation = toggleVoiceDictation;

function copyCodeSnippet(btn) {
    if (!btn) return;
    const block = btn.closest('.steady-code-block');
    if (!block) return;
    const codeEl = block.querySelector('code');
    if (!codeEl) return;
    const textToCopy = codeEl.innerText || codeEl.textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 1800);
        }).catch(() => {
            fallbackCopy(textToCopy, btn);
        });
    } else {
        fallbackCopy(textToCopy, btn);
    }
}

function fallbackCopy(text, btn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1800);
    } catch (e) {}
    document.body.removeChild(ta);
}
window.copyCodeSnippet = copyCodeSnippet;

function toggleMsgFavorite(btn) {
    if (!btn) return;
    const isActive = btn.classList.toggle('active');
    btn.style.color = isActive ? '#EC4899' : '';
    showToast(isActive ? 'Saved to favorites' : 'Removed from favorites');
}
window.toggleMsgFavorite = toggleMsgFavorite;

function shareMsgContent(btn) {
    if (!btn) return;
    const bubble = btn.closest('.studio-msg-row')?.querySelector('.studio-bubble');
    if (!bubble) return;
    const text = bubble.innerText.trim();
    if (navigator.share) {
        navigator.share({
            title: 'Steady Academic Advice',
            text: text
        }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Response copied for sharing');
        });
    }
}
window.shareMsgContent = shareMsgContent;

function copyMsgContent(btn) {
    if (!btn) return;
    const bubble = btn.closest('.studio-msg-row')?.querySelector('.studio-bubble');
    if (!bubble) return;
    const text = bubble.innerText.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Message copied to clipboard');
        }).catch(() => {
            showToast('Copied to clipboard');
        });
    } else {
        fallbackCopy(text, btn);
        showToast('Message copied to clipboard');
    }
}
window.copyMsgContent = copyMsgContent;

function clearChatHistory() {
    if (confirm('Restart session with Steady?')) {
        saveChatHistory([DEFAULT_CHAT_GREETING]);
        removePendingChatMedia();
        renderChatMessages();
        renderChatQuickChips();
        showToast('Steady session restarted.');
    }
}
window.clearChatHistory = clearChatHistory;

// ==========================================
// --- MEDIA UPLOAD HANDLERS --- (COURSE OUTLINES & TIMETABLES)
// ==========================================
function triggerChatMediaUpload() {
    const fileInput = document.getElementById('chat-media-file-input');
    if (fileInput) fileInput.click();
}
window.triggerChatMediaUpload = triggerChatMediaUpload;

// Broad academic vocabulary for Nigerian & International institutions
const SABI_SUBJECT_VOCAB = [
    'Computer Science', 'Software Engineering', 'Information Technology', 'Cybersecurity', 'Data Science', 'Data Structures', 'Algorithms', 'Web Development',
    'Mathematics', 'Maths', 'Math', 'Further Maths', 'Calculus', 'Algebra', 'Statistics', 'Geometry',
    'Physics', 'Mechanics', 'Electromagnetism', 'Optics', 'Thermodynamics',
    'Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry',
    'Biology', 'Microbiology', 'Anatomy', 'Physiology', 'Genetics', 'Botany', 'Zoology',
    'Medicine', 'Surgery', 'Pharmacy', 'Pharmacology', 'Nursing', 'Public Health',
    'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Petroleum Engineering',
    'Economics', 'Microeconomics', 'Macroeconomics', 'Project Evaluation', 'Mathematical Economics', 'International Economics', 'Development Economics', 'Accounting', 'Financial Accounting', 'Commerce', 'Business Administration', 'Marketing', 'Finance', 'Taxation', 'Banking',
    'Law', 'Jurisprudence', 'Constitutional Law', 'Criminal Law', 'Commercial Law',
    'English', 'Use of English', 'Literature', 'Literature in English', 'Government', 'Political Science', 'History', 'Geography', 'Philosophy', 'Sociology', 'Social Sciences', 'Mass Communication'
];

const SABI_DAY_MAP = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tues': 'Tuesday', 'tuesday': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thur': 'Thursday', 'thurs': 'Thursday', 'thursday': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
};

function extractCourseCodesFromText(text) {
    if (!text) return [];
    // Match common course codes including university prefixes (e.g. ECO301, OOU-ECO371, MTH 101, CSC-201, PHY102, BIO 201, GST 111, SSC301, etc.)
    const codeRegex = /\b((?:[a-zA-Z]{2,4}-)?[a-zA-Z]{2,4}\s*[-]?\s*\d{3}[a-zA-Z]?)\b/gi;
    const matches = text.match(codeRegex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(c => {
        let clean = c.toUpperCase().trim();
        clean = clean.replace(/([A-Z])(\d{3})/g, '$1 $2');
        return clean;
    })));
}

function parseTimetableFromOcrText(text) {
    if (!text) return { courses: [], classes: [] };

    // Support both newline and piped/semicolon tabular splits
    const rawLines = text.split(/\r?\n/);
    const lines = [];
    rawLines.forEach(l => {
        if (l.includes('|') || l.includes(';')) {
            l.split(/[|;]/).forEach(sub => lines.push(sub.trim()));
        } else {
            lines.push(l.trim());
        }
    });

    const detectedClasses = [];
    const detectedCourses = new Set();

    // 1. Extract raw course codes
    const codes = extractCourseCodesFromText(text);
    codes.forEach(c => detectedCourses.add(c));

    // 2. Vocabulary subjects
    for (const item of SABI_SUBJECT_VOCAB) {
        const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('\\b' + escaped + '\\b', 'i');
        if (re.test(text)) detectedCourses.add(item);
    }

    // 3. Line-by-line schedule parsing with context tracking
    let currentCourseContext = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 3) continue;

        // Check if line establishes a course context (e.g. "CSC 201: Data Structures" or "MTH 101")
        const lineCodes = extractCourseCodesFromText(trimmed);
        if (lineCodes.length > 0) {
            currentCourseContext = lineCodes[0];
            detectedCourses.add(lineCodes[0]);
        } else {
            for (const item of SABI_SUBJECT_VOCAB) {
                const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp('\\b' + escaped + '\\b', 'i');
                if (re.test(trimmed)) {
                    currentCourseContext = item;
                    detectedCourses.add(item);
                    break;
                }
            }
        }

        // Day detection
        const dayMatch = trimmed.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i);
        if (!dayMatch) continue;

        const dayKey = dayMatch[1].toLowerCase();
        const fullDay = SABI_DAY_MAP[dayKey];
        if (!fullDay) continue;

        const lineSubject = (lineCodes.length > 0 ? lineCodes[0] : null) || currentCourseContext || 'Lecture';

        // Time range detection: e.g. 09:00 - 11:00, 9am - 11am, 9-11am, 14:00 - 16:00, 2pm to 4pm
        const rangeMatch = trimmed.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
        // Single time: e.g. at 9am, 10:00am, 14:00
        const singleMatch = !rangeMatch && (trimmed.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || trimmed.match(/\b(\d{1,2}):(\d{2})\b/));

        let startTime = '09:00';
        let endTime = '11:00';

        if (rangeMatch) {
            let h1 = parseInt(rangeMatch[1], 10);
            const m1 = rangeMatch[2] || '00';
            const ap1 = (rangeMatch[3] || rangeMatch[6] || '').toLowerCase();
            if (ap1 === 'pm' && h1 < 12) h1 += 12;
            if (ap1 === 'am' && h1 === 12) h1 = 0;
            startTime = String(h1).padStart(2, '0') + ':' + m1;

            let h2 = parseInt(rangeMatch[4], 10);
            const m2 = rangeMatch[5] || '00';
            const ap2 = (rangeMatch[6] || rangeMatch[3] || '').toLowerCase();
            if (ap2 === 'pm' && h2 < 12) h2 += 12;
            if (ap2 === 'am' && h2 === 12) h2 = 0;
            endTime = String(h2).padStart(2, '0') + ':' + m2;
        } else if (singleMatch) {
            let h = parseInt(singleMatch[1], 10);
            const m = singleMatch[2] || '00';
            const ap = (singleMatch[3] || '').toLowerCase();
            if (ap === 'pm' && h < 12) h += 12;
            if (ap === 'am' && h === 12) h = 0;
            startTime = String(h).padStart(2, '0') + ':' + m;
            endTime = String((h + 2) % 24).padStart(2, '0') + ':' + m;
        }

        // Venue detection
        let venue = 'Lecture Hall';
        const venueMatch = trimmed.match(/\(([^)]+)\)/) || trimmed.match(/\b(LT\s*\d+|Hall\s*[A-Z0-9]+|Lab\s*[A-Z0-9]+|Auditorium\s*[A-Z0-9]?|Room\s*\d+)\b/i);
        if (venueMatch) {
            venue = venueMatch[1].trim();
        }

        detectedClasses.push({
            day: fullDay,
            start_time: startTime,
            end_time: endTime,
            subject: lineSubject,
            venue: venue
        });
    }

    return {
        courses: Array.from(detectedCourses),
        classes: detectedClasses
    };
}

function updateChatMediaPreviewStatus(statusText) {
    const sizeEl = document.getElementById('media-preview-filesize');
    if (sizeEl) sizeEl.textContent = statusText;
}

function processImageTextClientSide(file, dataUrl, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        try {
            // 1. High-resolution canvas for OCR
            const canvas = document.createElement('canvas');
            const maxDim = 1400;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            // 2. High-clarity vision image for AI model and compact thumbnail for UI
            const visionDataUrl = canvas.toDataURL('image/jpeg', 0.82);

            const thumbCanvas = document.createElement('canvas');
            const thumbMax = 320;
            let tw = img.width;
            let th = img.height;
            if (tw > thumbMax || th > thumbMax) {
                if (tw > th) {
                    th = Math.round((th * thumbMax) / tw);
                    tw = thumbMax;
                } else {
                    tw = Math.round((tw * thumbMax) / th);
                    th = thumbMax;
                }
            }
            thumbCanvas.width = tw;
            thumbCanvas.height = th;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.drawImage(img, 0, 0, tw, th);
            const optimizedThumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

            // 3. Tesseract OCR Recognition
            if (typeof Tesseract !== 'undefined' && Tesseract.recognize) {
                updateChatMediaPreviewStatus('Scanning timetable text (0%)...');

                const ocrPromise = Tesseract.recognize(canvas, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                            const pct = Math.round(m.progress * 100);
                            updateChatMediaPreviewStatus(`Reading timetable (${pct}%)...`);
                        }
                    }
                });

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OCR Timeout')), 15000)
                );

                Promise.race([ocrPromise, timeoutPromise])
                    .then(res => {
                        const rawText = res?.data?.text || '';
                        const parsed = parseTimetableFromOcrText(rawText);
                        const fallbackCodes = extractCourseCodesFromText(file.name);
                        const allCodes = Array.from(new Set([...parsed.courses, ...fallbackCodes]));

                        if (parsed.classes.length > 0) {
                            updateChatMediaPreviewStatus(`Found ${parsed.classes.length} classes & ${allCodes.length} courses`);
                        } else if (allCodes.length > 0) {
                            updateChatMediaPreviewStatus(`Detected ${allCodes.length} courses`);
                        } else {
                            updateChatMediaPreviewStatus(`Screenshot scanned`);
                        }

                        callback({
                            visionDataUrl: visionDataUrl,
                            optimizedDataUrl: optimizedThumbUrl,
                            extractedCodes: allCodes,
                            extractedClasses: parsed.classes,
                            rawText: rawText,
                            width: w,
                            height: h
                        });
                    })
                    .catch(err => {
                        console.warn('Tesseract OCR error/timeout, using fallback:', err);
                        const fallbackCodes = extractCourseCodesFromText(file.name);
                        updateChatMediaPreviewStatus('Image attached');
                        callback({
                            visionDataUrl: visionDataUrl,
                            optimizedDataUrl: optimizedThumbUrl,
                            extractedCodes: fallbackCodes,
                            extractedClasses: [],
                            rawText: '',
                            width: w,
                            height: h
                        });
                    });
            } else {
                const fallbackCodes = extractCourseCodesFromText(file.name);
                callback({
                    visionDataUrl: visionDataUrl,
                    optimizedDataUrl: optimizedThumbUrl,
                    extractedCodes: fallbackCodes,
                    extractedClasses: [],
                    rawText: '',
                    width: w,
                    height: h
                });
            }
        } catch (e) {
            console.error('Image processing error:', e);
            callback({
                optimizedDataUrl: dataUrl,
                extractedCodes: extractCourseCodesFromText(file.name),
                extractedClasses: [],
                rawText: ''
            });
        }
    };
    img.onerror = function() {
        callback({
            optimizedDataUrl: dataUrl,
            extractedCodes: extractCourseCodesFromText(file.name),
            extractedClasses: [],
            rawText: ''
        });
    };
    img.src = dataUrl;
}

function handleChatImageFile(file, label) {
    if (!file) return;
    const isImage = file.type ? file.type.startsWith('image/') : true;
    if (!isImage) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const rawDataUrl = evt.target.result;
        pendingChatMedia = {
            name: file.name || label || 'Screenshot',
            type: 'image',
            size: (file.size / 1024).toFixed(1) + ' KB',
            dataUrl: rawDataUrl,
            extractedCodes: [],
            extractedClasses: [],
            textContent: `[Uploaded Outline: ${file.name || label}]`
        };
        displayPendingMediaBar();
        updateChatMediaPreviewStatus('Reading screenshot text with AI OCR...');

        processImageTextClientSide(file, rawDataUrl, (processed) => {
            if (!pendingChatMedia) return;
            pendingChatMedia.dataUrl = processed.visionDataUrl || processed.optimizedDataUrl;
            pendingChatMedia.thumbUrl = processed.optimizedDataUrl;
            pendingChatMedia.extractedCodes = processed.extractedCodes;
            pendingChatMedia.extractedClasses = processed.extractedClasses;
            pendingChatMedia.textContent = `[Uploaded Timetable Screenshot: ${file.name || label}]\n` +
                (processed.extractedClasses && processed.extractedClasses.length > 0
                    ? `Extracted Classes:\n` + processed.extractedClasses.map(c => `- ${c.subject}: ${c.day} ${c.start_time}-${c.end_time} (${c.venue})`).join('\n')
                    : '') +
                (processed.extractedCodes && processed.extractedCodes.length > 0
                    ? `\nDetected Courses: ${processed.extractedCodes.join(', ')}`
                    : '') +
                (processed.rawText ? `\nOCR Text:\n${processed.rawText.slice(0, 1500)}` : '');

            displayPendingMediaBar();

            const input = document.getElementById('chat-user-input');
            if (input && (!input.value.trim() || input.value.startsWith('Here is my course outline') || input.value.startsWith('Here is my timetable'))) {
                if (processed.extractedClasses && processed.extractedClasses.length > 0) {
                    input.value = `Here is my timetable screenshot (${pendingChatMedia.name})! It has ${processed.extractedClasses.length} classes. Please lock them into my schedule and plan my study hours.`;
                } else if (processed.extractedCodes && processed.extractedCodes.length > 0) {
                    input.value = `Here is my course outline (${pendingChatMedia.name})! Please create a weekly study plan for my courses: ${processed.extractedCodes.slice(0, 4).join(', ')}.`;
                } else {
                    input.value = `Here is my timetable screenshot (${pendingChatMedia.name})! Please extract my schedule.`;
                }
            }
        });
    };
    reader.readAsDataURL(file);
}
window.handleChatImageFile = handleChatImageFile;

function handleChatMediaSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        handleChatImageFile(file, file.name);
    } else {
        // Document reader
        const reader = new FileReader();
        reader.onload = function(evt) {
            const content = typeof evt.target.result === 'string' ? evt.target.result.slice(0, 4000) : '';
            const detected = extractCourseCodesFromText(file.name + ' ' + content);
            pendingChatMedia = {
                name: file.name,
                type: 'document',
                size: (file.size / 1024).toFixed(1) + ' KB',
                textContent: content || `Document: ${file.name}`,
                extractedCodes: detected,
                extractedClasses: []
            };
            displayPendingMediaBar();
        };
        if (file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            reader.onload = function() {
                const detected = extractCourseCodesFromText(file.name);
                pendingChatMedia = {
                    name: file.name,
                    type: 'document',
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    textContent: `Document: ${file.name}`,
                    extractedCodes: detected,
                    extractedClasses: []
                };
                displayPendingMediaBar();
            };
            reader.readAsArrayBuffer(file);
        }
    }
}
window.handleChatMediaSelected = handleChatMediaSelected;

// Global clipboard paste listener for screenshots (Ctrl+V)
window.addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                e.preventDefault();
                openSabiAiChat();
                handleChatImageFile(file, 'Pasted Timetable Screenshot');
                break;
            }
        }
    }
});

function displayPendingMediaBar() {
    const bar = document.getElementById('chat-media-preview-bar');
    const nameEl = document.getElementById('media-preview-filename');
    const sizeEl = document.getElementById('media-preview-filesize');
    const iconEl = document.getElementById('media-preview-icon');

    if (!bar || !pendingChatMedia) return;

    if (nameEl) nameEl.textContent = pendingChatMedia.name;
    if (sizeEl && (!sizeEl.textContent || sizeEl.textContent.endsWith('KB'))) {
        sizeEl.textContent = pendingChatMedia.size;
    }
    if (iconEl) iconEl.innerHTML = pendingChatMedia.type === 'image' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

    bar.classList.remove('hidden');

    const input = document.getElementById('chat-user-input');
    if (input && !input.value.trim()) {
        input.value = `Here is my course outline / timetable (${pendingChatMedia.name}), please extract my schedule!`;
    }
}

function removePendingChatMedia() {
    pendingChatMedia = null;
    const bar = document.getElementById('chat-media-preview-bar');
    if (bar) bar.classList.add('hidden');
    const fileInput = document.getElementById('chat-media-file-input');
    if (fileInput) fileInput.value = '';
}
window.removePendingChatMedia = removePendingChatMedia;

// Render rich markdown: Code blocks with copy, LaTeX math ($$...$$ and $...$), bold, italic, lists, and newlines
function renderMarkdownLite(text) {
    if (!text) return '';

    const codeBlocks = [];
    const mathBlocks = [];

    // 1. Extract fenced code blocks (```lang ... ```)
    let processed = text.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const idx = codeBlocks.length;
        const safeCode = escapeHtml(code.trim());
        const displayLang = escapeHtml(lang || 'code');
        codeBlocks.push(`
            <div class="steady-code-block">
                <div class="steady-code-header">
                    <span>${displayLang}</span>
                    <button type="button" class="steady-copy-code-btn" onclick="copyCodeSnippet(this)">Copy</button>
                </div>
                <pre class="steady-code-content"><code>${safeCode}</code></pre>
            </div>
        `);
        return `%%CODE_BLOCK_${idx}%%`;
    });

    // 2. Extract display math ($$...$$)
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
        const idx = mathBlocks.length;
        const safeMath = escapeHtml(math.trim());
        mathBlocks.push(`<div class="steady-math-block">${safeMath}</div>`);
        return `%%MATH_BLOCK_${idx}%%`;
    });

    // 3. Extract inline math ($...$) - ignore plain currencies like $50 or $10.99
    processed = processed.replace(/(?<!\w)\$([^\$\n]+?)\$(?!\w)/g, (match, math) => {
        if (/^\d+(\.\d{1,2})?$/.test(math.trim())) return match;
        const idx = mathBlocks.length;
        const safeMath = escapeHtml(math.trim());
        mathBlocks.push(`<span class="steady-math-block" style="display:inline-block; padding:1px 6px; margin:0 2px; font-size:0.92em; border-radius:4px;">${safeMath}</span>`);
        return `%%MATH_BLOCK_${idx}%%`;
    });

    // 4. Escape general HTML content
    let safe = escapeHtml(processed);

    // 5. Headings
    safe = safe.replace(/^### (.*)$/gm, '<h4 style="margin:8px 0 4px 0; color:var(--text-main); font-size:13px; font-weight:700;">$1</h4>');
    safe = safe.replace(/^## (.*)$/gm, '<h3 style="margin:10px 0 5px 0; color:var(--text-main); font-size:14px; font-weight:800;">$1</h3>');
    safe = safe.replace(/^# (.*)$/gm, '<h2 style="margin:12px 0 6px 0; color:var(--text-main); font-size:15px; font-weight:800;">$1</h2>');

    // 6. Bold & Italic
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // 7. Inline code (`code`)
    safe = safe.replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,0.08); padding:2px 5px; border-radius:4px; font-family:monospace; font-size:0.9em;">$1</code>');

    // 8. Bullets & numbered lists
    safe = safe.replace(/^([•\-\*]) (.+)$/gm, '<div class="chat-bullet-row" style="display:flex; gap:6px; margin:2px 0;"><span style="color:var(--accent); font-weight:bold;">•</span><span>$2</span></div>');
    safe = safe.replace(/^(\d+)\. (.+)$/gm, '<div class="chat-bullet-row" style="display:flex; gap:6px; margin:2px 0;"><span style="color:var(--accent); font-weight:bold;">$1.</span><span>$2</span></div>');

    // 9. Newlines to <br>
    safe = safe.replace(/\n/g, '<br>');

    // 10. Restore code blocks and math blocks
    codeBlocks.forEach((blockHtml, i) => {
        safe = safe.replace(`%%CODE_BLOCK_${i}%%`, blockHtml);
    });
    mathBlocks.forEach((mathHtml, i) => {
        safe = safe.replace(`%%MATH_BLOCK_${i}%%`, mathHtml);
    });

    return safe;
}

let currentStudioMode = 'planner';

const STUDIO_MODE_CHIPS = {
    planner: [
        "Generate my complete weekly timetable",
        "I have lectures Mon, Wed, Fri (9am - 12pm)",
        "Lock in 2 hours study every evening",
        "Maths & Physics need extra study blocks",
        "Keep Sundays completely free for rest"
    ]
};

function setStudioMode(mode) {
    currentStudioMode = 'planner';
    renderChatQuickChips();

    const input = document.getElementById('chat-user-input');
    if (input && (!input.value.trim() || input.value.startsWith('Message Steady'))) {
        input.placeholder = "Message Steady, plan timetable, or dictate...";
    }
}
window.setStudioMode = setStudioMode;

// Conflict detection for proposed schedules
function checkScheduleConflicts(proposal) {
    const conflicts = [];
    if (!proposal || !Array.isArray(proposal.classes)) return conflicts;

    proposal.classes.forEach(c => {
        const day = c.day;
        const start = c.start_time || '09:00';
        const end = c.end_time || '11:00';
        const clash = (storedClasses || []).find(existing => {
            if (existing.day !== day) return false;
            const eStart = existing.start_time || '09:00';
            const eEnd = existing.end_time || '11:00';
            return (start < eEnd && end > eStart);
        });
        if (clash) {
            conflicts.push(`${c.subject || 'Class'} overlaps with ${clash.subject || 'existing class'} on ${day} (${clash.start_time || ''}-${clash.end_time || ''})`);
        }
    });

    return conflicts;
}

// Interactive acceptance of proposed schedules with one-click injection and Google Calendar sync
function applyProposedSchedule(cardId, btn) {
    const history = getChatHistory();
    let targetProposal = null;

    for (const msg of history) {
        if (msg.scheduleProposal && (msg.scheduleProposal.cardId === cardId || msg.scheduleProposal.id === cardId)) {
            targetProposal = msg.scheduleProposal;
            msg.scheduleProposal.accepted = true;
            break;
        }
    }

    if (!targetProposal) {
        const card = document.getElementById(cardId) || (btn && btn.closest('.steady-schedule-card'));
        if (card && card.dataset.proposalJson) {
            try {
                targetProposal = JSON.parse(decodeURIComponent(card.dataset.proposalJson));
            } catch (e) {}
        }
    }

    if (!targetProposal) {
        showToast('Schedule proposal details not found.');
        return;
    }

    let addedCount = 0;

    // 1. Add classes
    if (Array.isArray(targetProposal.classes) && targetProposal.classes.length > 0) {
        targetProposal.classes.forEach(cls => {
            storedClasses.push({
                id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                subject: cls.subject,
                day: cls.day,
                start_time: cls.start_time || '09:00',
                end_time: cls.end_time || '11:00',
                venue: cls.venue || 'Lecture Hall',
                isRecurring: true
            });
            addedCount++;
        });
        saveStoredClasses(storedClasses);
    }

    // 2. Add study sessions
    if (Array.isArray(targetProposal.studySessions) && targetProposal.studySessions.length > 0) {
        targetProposal.studySessions.forEach(sess => {
            calendarEvents.push({
                id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                title: sess.title,
                category: sess.category || 'study',
                date: sess.date || getTodayStr(),
                time: sess.time || '17:00',
                duration: sess.duration || 1.5,
                location: 'Sabi Prep Room',
                notes: sess.notes || '',
                completed: false,
                isAiGenerated: true
            });
            addedCount++;
        });
        saveEvents();
    }

    saveChatHistory(history);
    renderAllViews();

    if (btn) {
        btn.classList.add('accepted');
        btn.disabled = true;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Added to Calendar & Timetable`;
    }

    showToast(`Added ${addedCount} event(s) to your timetable!`);

    // Automatic Google Calendar sync trigger
    if (typeof isGcalConnected === 'function' && isGcalConnected() && isGcalAutoSyncEnabled()) {
        syncAllEventsToGoogle(true);
    }
}
window.applyProposedSchedule = applyProposedSchedule;

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const history = getChatHistory();
    const isInitialState = history.length <= 1;

    let heroHtml = '';
    if (isInitialState) {
        const student = typeof getStudentAiContext === 'function' ? getStudentAiContext() : {};
        const hour = new Date().getHours();
        const greetingTime = hour < 12 ? 'Good Morning' : (hour < 17 ? 'Good Afternoon' : 'Good Evening');
        const studentName = student.firstName || 'Scholar';

        heroHtml = `
            <div class="va-launchpad-hero">
                <div class="va-hero-greeting-box">
                    <span class="va-hero-time-greeting">${escapeHtml(greetingTime)}, ${escapeHtml(studentName)}</span>
                    <h2 class="va-hero-heading">What can i help today?</h2>
                </div>
                <div class="va-bento-grid">
                    <!-- Bento 1: Productivity Tips -->
                    <div class="va-bento-card va-card-productivity" onclick="handleQuickChipClick('Give me actionable productivity tips and timetable strategies for this semester')">
                        <div class="va-bento-icon va-icon-amber">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="9" y1="18" x2="15" y2="18"></line>
                                <line x1="10" y1="22" x2="14" y2="22"></line>
                                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
                            </svg>
                        </div>
                        <span class="va-bento-title">Productivity Tips</span>
                        <span class="va-bento-desc">Help with time management, goal setting, and organization.</span>
                    </div>

                    <!-- Bento 2: Personalized Recommendations -->
                    <div class="va-bento-card va-card-recommend" onclick="handleQuickChipClick('Analyze my enrolled courses and build a complete semester timetable')">
                        <div class="va-bento-icon va-icon-lavender">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </div>
                        <span class="va-bento-title">Timetable Architect</span>
                        <span class="va-bento-desc">Build personalized study sessions and lecture schedules.</span>
                        <div class="va-bento-link">
                            <span>Build timetable</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>

                    <!-- Bento 3: Clash Solver & Balance -->
                    <div class="va-bento-card va-card-games" onclick="handleQuickChipClick('Check my schedule for lecture clashes and optimize my study blocks')">
                        <div class="va-bento-icon va-icon-purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <span class="va-bento-title">Clash Solver &amp; Balance</span>
                        <span class="va-bento-desc">Resolve lecture clashes and balance daily study workload.</span>
                    </div>

                    <!-- Bento 4: Start temporary chat / Outline scan -->
                    <div class="va-bento-card va-card-temp" onclick="triggerChatMediaUpload()">
                        <div class="va-temp-illustration">
                            <div class="va-bubble-ill-1"></div>
                            <div class="va-bubble-ill-2"></div>
                            <svg class="va-dash-trail" width="60" height="30" viewBox="0 0 60 30" fill="none">
                                <path d="M5 25 C 20 5, 40 5, 55 25" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 3"/>
                            </svg>
                        </div>
                        <div class="va-temp-btn">
                            <span>Start temporary chat</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const messagesHtml = history.map(msg => {
        const isUser = msg.role === 'user';

        // 1. Interactive Schedule Proposal Card
        let scheduleCardHtml = '';
        const proposal = msg.scheduleProposal;
        if (proposal) {
            const cardId = proposal.cardId || ('prop-' + (msg.timestamp || Date.now()));
            const conflicts = checkScheduleConflicts(proposal);
            const isConflict = conflicts.length > 0;
            const badgeText = proposal.accepted
                ? 'Synced to Calendar'
                : (isConflict ? `${conflicts.length} Clash Detected` : 'Conflict-Free');
            const badgeClass = proposal.accepted ? 'synced' : (isConflict ? 'clash' : 'free');

            let classItems = '';
            if (Array.isArray(proposal.classes) && proposal.classes.length > 0) {
                classItems = proposal.classes.map(c => `
                    <div class="steady-event-item">
                        <div class="steady-item-info">
                            <span class="steady-item-subject">${escapeHtml(c.subject || 'Lecture')}</span>
                            <span class="steady-item-time">${escapeHtml(c.day || 'Day')} • ${escapeHtml(c.start_time || '09:00')} - ${escapeHtml(c.end_time || '11:00')}${c.venue ? ' (' + escapeHtml(c.venue) + ')' : ''}</span>
                        </div>
                        <span class="steady-card-badge" style="background:rgba(59,130,246,0.15); color:#60A5FA; border-color:rgba(59,130,246,0.3);">Lecture</span>
                    </div>
                `).join('');
            }

            let studyItems = '';
            if (Array.isArray(proposal.studySessions) && proposal.studySessions.length > 0) {
                studyItems = proposal.studySessions.map(s => `
                    <div class="steady-event-item">
                        <div class="steady-item-info">
                            <span class="steady-item-subject">${escapeHtml(s.title || 'Study Block')}</span>
                            <span class="steady-item-time">${escapeHtml(s.date || 'Today')} at ${escapeHtml(s.time || '17:00')} (${escapeHtml(String(s.duration || 1.5))}h)</span>
                        </div>
                        <span class="steady-card-badge" style="background:rgba(168,85,247,0.15); color:#C084FC; border-color:rgba(168,85,247,0.3);">Study</span>
                    </div>
                `).join('');
            }

            scheduleCardHtml = `
                <div class="steady-schedule-card" id="${escapeHtml(cardId)}" data-proposal-json="${encodeURIComponent(JSON.stringify(proposal))}">
                    <div class="steady-card-header">
                        <div class="steady-card-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${escapeHtml(proposal.summary || 'Proposed Timetable')}</span>
                        </div>
                        <span class="steady-card-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
                    </div>
                    <div class="steady-event-list">
                        ${classItems}
                        ${studyItems}
                    </div>
                    ${isConflict && !proposal.accepted ? `<div style="font-size:11px; color:#F87171; margin-bottom:10px; line-height:1.4;">${conflicts.map(c => `• ${escapeHtml(c)}`).join('<br>')}</div>` : ''}
                    <button type="button" class="btn-accept-schedule ${proposal.accepted ? 'accepted' : ''}" onclick="applyProposedSchedule('${escapeHtml(cardId)}', this)" ${proposal.accepted ? 'disabled' : ''}>
                        ${proposal.accepted
                            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Added to Calendar & Timetable`
                            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Accept & Add to Timetable`}
                    </button>
                </div>
            `;
        }

        // 2. Legacy Action Card fallback
        let actionCardHtml = '';
        if (msg.actionCard && !scheduleCardHtml) {
            actionCardHtml = `
                <div class="studio-transmission-card">
                    <div class="transmission-header">
                        <span class="transmission-badge">TIMETABLE SYNCHRONIZED</span>
                        <span class="transmission-status-tag">Updated</span>
                    </div>
                    <div class="transmission-summary">${escapeHtml(msg.actionCard.details)}</div>
                    <button type="button" class="btn-transmission-view" onclick="viewGeneratedScheduleInWeekGrid()">
                        <span>View in Week Grid</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            `;
        }

        let mediaHtml = '';
        if (msg.media) {
            if (msg.media.type === 'image' && msg.media.dataUrl) {
                mediaHtml = `
                    <div class="chat-msg-media">
                        <img src="${msg.media.dataUrl}" alt="${escapeHtml(msg.media.name || 'Course outline photo')}" />
                    </div>
                `;
            } else {
                mediaHtml = `
                    <div class="chat-msg-doc-pill">
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
                        <span>${escapeHtml(msg.media.name || 'Course outline')}</span>
                    </div>
                `;
            }
        }

        // Bot messages get rich markdown rendering; user messages stay plain
        const contentHtml = isUser
            ? `<div>${escapeHtml(msg.content)}</div>`
            : `<div>${renderMarkdownLite(msg.content)}</div>`;

        const actionsHtml = !isUser ? `
            <div class="va-msg-actions">
                <button type="button" class="va-msg-action-btn" onclick="toggleMsgFavorite(this)" title="Like response" aria-label="Like response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <button type="button" class="va-msg-action-btn" onclick="shareMsgContent(this)" title="Share response" aria-label="Share response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button type="button" class="va-msg-action-btn" onclick="copyMsgContent(this)" title="Copy text" aria-label="Copy text">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
            </div>
        ` : '';

        return `
            <div class="studio-msg-row chat-msg-row ${isUser ? 'user' : 'bot'}">
                <div class="studio-bubble chat-bubble">
                    ${mediaHtml}
                    ${contentHtml}
                    ${scheduleCardHtml}
                    ${actionCardHtml}
                </div>
                ${actionsHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = heroHtml + messagesHtml;
    container.scrollTop = container.scrollHeight;
}

function viewGeneratedScheduleInWeekGrid() {
    closeSabiAiChat();
    switchViewMode('week');
    showToast('Switched to Week Grid Timetable');
}
window.viewGeneratedScheduleInWeekGrid = viewGeneratedScheduleInWeekGrid;

function renderChatQuickChips() {
    const container = document.getElementById('chat-quick-chips-row');
    if (!container) return;

    const chips = STUDIO_MODE_CHIPS[currentStudioMode] || STUDIO_MODE_CHIPS.planner;

    container.innerHTML = chips.map(text => `
        <button type="button" class="studio-chip quick-chip" onclick="handleQuickChipClick('${escapeHtml(text)}')">
            ${escapeHtml(text)}
        </button>
    `).join('');
}

function handleQuickChipClick(chipText) {
    if (chipText.includes('Upload Course Outline') || chipText.includes('Upload Timetable Screenshot') || chipText.includes('Upload Course Outline / Syllabus')) {
        triggerChatMediaUpload();
        return;
    }
    const input = document.getElementById('chat-user-input');
    if (input) {
        input.value = chipText;
        handleSendChatMessage(new Event('submit'));
    }
}
window.handleQuickChipClick = handleQuickChipClick;

// Supabase cloud chat snapshot synchronizer (hybrid persistence)
async function syncChatToSupabase(message) {
    try {
        let userId = null;
        if (window.SabiAuth && typeof window.SabiAuth.getUser === 'function') {
            const user = await window.SabiAuth.getUser();
            userId = user?.id;
        }
        if (!userId) {
            try {
                const profile = JSON.parse(localStorage.getItem('sabi_user_profile') || '{}');
                userId = profile.id || profile.user_id || null;
            } catch (e) {}
        }
        if (!userId) return;

        const client = window.sabiDb || (window.SabiAuth && typeof window.SabiAuth.getClient === 'function' ? window.SabiAuth.getClient() : null);
        if (!client) return;

        const history = getChatHistory();
        const sanitized = history.slice(-25).map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            hasProposal: !!m.scheduleProposal
        }));

        await client.from('profiles').update({
            ai_chat_snapshot: sanitized,
            updated_at: new Date().toISOString()
        }).eq('id', userId);
    } catch (e) {
        console.debug('Cloud chat sync notice:', e.message || e);
    }
}

// Server-Sent Events stream reader for real-time word-by-word streaming
async function readSseStream(res, onToken) {
    if (!res.body || typeof res.body.getReader !== 'function') {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || '';
        if (text && typeof onToken === 'function') onToken(text, text);
        return text;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(':')) continue;
                if (trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const token = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || '';
                        if (token) {
                            accumulatedText += token;
                            if (typeof onToken === 'function') {
                                onToken(accumulatedText, token);
                            }
                        }
                    } catch (e) {
                        // ignore unparseable or partial stream fragments
                    }
                }
            }
        }
    } catch (readErr) {
        console.warn('Stream reader notice:', readErr);
    }

    return accumulatedText.trim();
}

// Simulated token streaming for instant smooth offline replies
async function simulateTokenStream(replyObj, onToken) {
    if (!onToken || !replyObj || !replyObj.content) return replyObj;
    const words = replyObj.content.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
        current += (i === 0 ? '' : ' ') + words[i];
        onToken(current, words[i]);
        if (i % 3 === 0) {
            await new Promise(r => setTimeout(r, 16));
        }
    }
    return replyObj;
}

let isProcessingChat = false;

async function handleSendChatMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isProcessingChat) return;

    const input = document.getElementById('chat-user-input');
    if (!input) return;

    const userText = input.value.trim();
    if (!userText && !pendingChatMedia) return;

    isProcessingChat = true;
    const sendBtn = document.getElementById('btn-chat-send');
    if (sendBtn) sendBtn.disabled = true;

    const textToSend = userText || (pendingChatMedia ? `Uploaded course outline: ${pendingChatMedia.name}` : '');
    input.value = '';
    input.style.height = 'auto';

    const history = getChatHistory();
    const userMsgObj = {
        role: 'user',
        content: textToSend,
        media: pendingChatMedia ? { ...pendingChatMedia } : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const mediaSnapshot = pendingChatMedia;
    removePendingChatMedia();

    history.push(userMsgObj);
    saveChatHistory(history);
    renderChatMessages();

    // Show initial typing indicator
    showTypingIndicator();

    try {
        let activeBotRow = null;
        let activeBotContent = null;
        let streamedText = '';

        const onToken = (fullText) => {
            if (!activeBotRow) {
                hideTypingIndicator();
                const container = document.getElementById('chat-messages-container');
                if (container) {
                    activeBotRow = document.createElement('div');
                    activeBotRow.className = 'studio-msg-row chat-msg-row bot';
                    activeBotRow.id = 'streaming-active-row';
                    activeBotRow.innerHTML = `
                        <img src="avatars/notion-steady.svg" alt="Steady" class="studio-msg-avatar chat-msg-avatar" />
                        <div class="studio-bubble chat-bubble">
                            <div class="streaming-content-wrapper"></div>
                            <span class="streaming-cursor"></span>
                        </div>
                    `;
                    container.appendChild(activeBotRow);
                    activeBotContent = activeBotRow.querySelector('.streaming-content-wrapper');
                }
            }

            streamedText = fullText;
            if (activeBotContent) {
                activeBotContent.innerHTML = renderMarkdownLite(streamedText);
                const container = document.getElementById('chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;
            }
        };

        const botReply = await processBuddyConversation(textToSend, history, mediaSnapshot, onToken);
        hideTypingIndicator();

        const activeRow = document.getElementById('streaming-active-row');
        if (activeRow) activeRow.remove();

        history.push(botReply);
        saveChatHistory(history);
        syncChatToSupabase(botReply);
        renderChatMessages();

        // Refresh views if schedule changed
        renderAllViews();
    } catch (err) {
        hideTypingIndicator();
        const activeRow = document.getElementById('streaming-active-row');
        if (activeRow) activeRow.remove();
        console.error('Chat processing error:', err);

        const fallback = generateOfflineBuddyReply(textToSend, mediaSnapshot, history);
        history.push(fallback);
        saveChatHistory(history);
        syncChatToSupabase(fallback);
        renderChatMessages();
        renderAllViews();
    } finally {
        isProcessingChat = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}
window.handleSendChatMessage = handleSendChatMessage;

function showTypingIndicator() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const existing = document.getElementById('chat-typing-indicator');
    if (existing) existing.remove();

    const typingEl = document.createElement('div');
    typingEl.id = 'chat-typing-indicator';
    typingEl.className = 'studio-msg-row chat-msg-row bot';
    typingEl.innerHTML = `
        <img src="avatars/notion-steady.svg" alt="Steady" class="studio-msg-avatar chat-msg-avatar" />
        <div class="studio-bubble chat-bubble">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
}

// Retrieves rich student context and profile from local storage and session
function getStudentAiContext() {
    let profile = {};
    try {
        profile = JSON.parse(localStorage.getItem('sabi_user_profile') || '{}') || {};
    } catch (e) {
        profile = {};
    }

    const fullName = profile.full_name || localStorage.getItem('sabi_user_name') || 'Scholar';
    const firstName = fullName.trim().split(/\s+/)[0] || 'Scholar';
    const studyMode = profile.study_mode || localStorage.getItem('sabi_academic_track') || 'university';
    const university = profile.university || '';
    const course = profile.course || '';
    const level = profile.level || localStorage.getItem('sabi_academic_level') || '';
    const targetGpa = profile.target_gpa || null;
    const projectedGradYear = profile.projected_grad_year || null;

    let aiMemory = null;
    try {
        aiMemory = JSON.parse(localStorage.getItem('sabi_ai_memory') || 'null');
    } catch (e) {}

    // Extract all distinct subject/course names currently scheduled in timetable
    const activeSubjects = Array.from(new Set(
        (storedClasses || [])
            .map(c => c.subject || c.course_code || c.name)
            .filter(Boolean)
    ));

    return {
        fullName,
        firstName,
        studyMode,
        university,
        course,
        level,
        targetGpa,
        projectedGradYear,
        activeSubjects,
        aiMemory
    };
}

// Saves custom AI memory / learning preferences for the student
function saveStudentAiMemory(memoryData) {
    try {
        const existing = JSON.parse(localStorage.getItem('sabi_ai_memory') || '{}');
        const updated = Object.assign({}, existing, memoryData);
        localStorage.setItem('sabi_ai_memory', JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.warn('Failed to save AI memory:', e);
        return null;
    }
}

// Expose context helpers globally
window.getStudentAiContext = getStudentAiContext;
window.saveStudentAiMemory = saveStudentAiMemory;

// Highly intelligent, contextual, and responsive system prompt for Steady
const BUDDY_SYSTEM_PROMPT = `You are "Steady", an elite academic mentor, tutor, and timetable architect for students (University, Polytechnic, JAMB, WAEC, NOUN, ICAN).

CRITICAL DIRECT-RESPONSE & PERSONALIZATION RULES:
- ALWAYS DIRECTLY, SPECIFICALLY, AND THOUGHTFULLY ADDRESS WHAT THE USER ASKS OR STATES.
- ADDRESS THE STUDENT NATURALLY: Use their first name when greeting or encouraging them.
- GROUND ADVICE IN THEIR ACADEMIC REALITY: Use their specified institution, department/course, academic level, and enrolled subjects in explanations and timetable recommendations.
- If the user asks a question (conceptual, academic, study technique, or motivational), answer it thoroughly, clearly, and directly with high intellect, practical examples, and warmth.
- If the student mentions their courses, challenges, or preferences, tailor your response specifically around those exact subjects and details.

FORMATTING & RICH RENDERING:
- Use LaTeX Math notation ($$...$$ for display math, $...$ for inline math) for formulas, algebra, calculus, physics equations, and chemical equations.
- Put code, algorithms, and SQL in markdown code blocks with language identifiers (e.g. \`\`\`python, \`\`\`sql).
- Organize study advice and steps with clean bullet points and bold highlights.
- STRICT 0 EMOJI RULE: NEVER output Unicode emojis; use clean punctuation, markdown, and words.

TIMETABLE & CALENDAR CAPABILITIES:
- You have the power to create and update their academic calendar.
- When the student asks to schedule, plan, create, or update their timetable or classes (or agrees to a proposed schedule), include the following JSON block at the very end of your response to automatically generate their visual schedule card:
\`\`\`json
{
  "action": "UPDATE_TIMETABLE",
  "summary": "Short description of what was scheduled",
  "classes": [
    { "day": "Monday", "start_time": "09:00", "end_time": "11:00", "subject": "Course Code or Name", "venue": "Lecture Hall / Online" }
  ],
  "studySessions": [
    { "date": "YYYY-MM-DD", "time": "HH:MM", "duration": 1.5, "title": "Subject Review / Practice", "category": "study|jamb|waec|noun|ican", "notes": "Key focus areas" }
  ]
}
\`\`\`
- Only output the JSON block when scheduling or modifying events. For general conceptual tutoring or explanations, do not output the JSON block.

GOAL-TO-SCHEDULE & OUTLINE DIRECT ACTION RULES:
- When a student states a goal (e.g. "5.00 goal", "5.0 CGPA", "first class target", "pass JAMB with 320", "score 75+ in MTH101"), NEVER output long generic motivational lectures or self-help fluff. Instead, briefly acknowledge their ambition in 1-2 concise sentences, calculate the optimal weekly study distribution across their enrolled subjects, and immediately generate their personalized timetable routine using the UPDATE_TIMETABLE JSON block so they can add it to their calendar in one tap!
- When a student uploads a course outline, syllabus, or timetable image/document, automatically extract all lecture times and propose the complete schedule using the UPDATE_TIMETABLE JSON block.

MULTIMODAL & VISION:
- You can analyze screenshots of course outlines, syllabi, notes, and timetable photos. Accurately identify courses, codes, lecture times, and exam dates when images or OCR data are provided.

IDENTITY:
- You are strictly "Steady". Never disclose underlying LLM models or vendors. Speak with authority, warmth, and academic excellence.`;

async function processBuddyConversation(userText, history, media, onToken) {
    const openRouterKey = getOpenRouterKey();
    const nvidiaKey = getNvidiaKey();
    const claudeKey = getAnthropicKey();
    const geminiKey = getGeminiKey();
    const openAiKey = getOpenAiKey();

    const todayStr = getTodayStr();
    const mondayStr = getMondayOfWeek(new Date());
    const student = getStudentAiContext();

    const contextPayload = {
        student: {
            name: student.fullName,
            first_name: student.firstName,
            institution: student.university || 'General / Not specified',
            course: student.course || 'Undergraduate',
            level: student.level || 'Undergraduate',
            target_gpa: student.targetGpa,
            study_mode: student.studyMode,
            active_enrolled_courses: student.activeSubjects,
            learning_memory: student.aiMemory
        },
        today: todayStr,
        week_start: mondayStr,
        existing_classes: storedClasses,
        existing_study_sessions: calendarEvents.slice(-10),
        uploaded_media: media ? { name: media.name, type: media.type, hasText: !!media.textContent } : null
    };

    // Build multimodal messages payload for LLMs
    const messagesPayload = history.slice(-6).map((m, idx, arr) => {
        const isLatest = idx === arr.length - 1;
        const role = m.role === 'bot' ? 'assistant' : 'user';

        if (isLatest && m.media && m.media.type === 'image' && m.media.dataUrl) {
            let combinedPrompt = m.content || 'Here is my course outline / syllabus photo. Please analyze it and extract my subjects!';
            if (m.media.textContent) {
                combinedPrompt += `\n\n[Extracted Text & Course Details from Screenshot]:\n${m.media.textContent}`;
            }
            return {
                role: role,
                content: [
                    { type: 'text', text: combinedPrompt },
                    { type: 'image_url', image_url: { url: m.media.dataUrl } }
                ]
            };
        }

        let textContent = m.content;
        if (m.media) {
            textContent += `\n[Uploaded Document: ${m.media.name}]`;
            if (m.media.textContent) {
                textContent += `\nDocument Content Snippet:\n${m.media.textContent.slice(0, 1500)}`;
            }
        }
        return {
            role: role,
            content: textContent
        };
    });

    const systemContent = BUDDY_SYSTEM_PROMPT + `\n\n` +
        `========================================\n` +
        `ACTIVE STUDENT PROFILE & CONTEXT:\n` +
        `========================================\n` +
        `- Student Name: ${student.fullName} (Preferred call name: "${student.firstName}")\n` +
        `- Institution / University: ${student.university || 'Not specified'}\n` +
        `- Course / Department: ${student.course || 'General'}\n` +
        `- Academic Level: ${student.level || 'Undergraduate'}\n` +
        (student.targetGpa ? `- Target GPA: ${student.targetGpa}\n` : '') +
        `- Study Mode: ${student.studyMode}\n` +
        (student.activeSubjects.length > 0 ? `- Enrolled Subjects in Timetable: ${student.activeSubjects.join(', ')}\n` : '') +
        (student.aiMemory ? `- Personalized Study Preferences & Weak Topics: ${JSON.stringify(student.aiMemory)}\n` : '') +
        `\nSCHEDULE & CALENDAR STATE:\n` +
        `${JSON.stringify({
            today: contextPayload.today,
            week_start: contextPayload.week_start,
            classes: contextPayload.existing_classes,
            recent_study_sessions: contextPayload.existing_study_sessions,
            uploaded_media: contextPayload.uploaded_media
        })}`;

    // Helper to update active AI badge
    const setAiBadgeActive = () => {
        const badge = document.getElementById('chat-live-ai-badge');
        if (badge) {
            badge.textContent = 'AI Active';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#34D399';
        }
    };

    // 0. Primary Sabi Cloud / Local Stream Endpoint (/api/chat)
    const apiEndpoints = ['/api/chat'];
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        apiEndpoints.push('http://localhost:3000/api/chat');
    }

    const authKey = openRouterKey || nvidiaKey || '';
    const reqHeaders = { 'Content-Type': 'application/json' };
    if (authKey) reqHeaders['Authorization'] = `Bearer ${authKey}`;

    for (const endpoint of apiEndpoints) {
        try {
            console.log(`Connecting to Sabi streaming AI endpoint: ${endpoint}...`);
            const res = await fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: reqHeaders,
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat',
                    messages: [
                        { role: 'system', content: systemContent },
                        ...messagesPayload
                    ],
                    temperature: 0.7,
                    max_tokens: 1500,
                    stream: true
                })
            }, 25000);

            if (res.ok) {
                const isStream = (res.headers.get('content-type') || '').includes('text/event-stream');
                let replyText = '';
                if (isStream) {
                    replyText = await readSseStream(res, onToken);
                } else {
                    const data = await res.json();
                    replyText = data.choices?.[0]?.message?.content || '';
                    if (replyText && typeof onToken === 'function') onToken(replyText, replyText);
                }

                if (replyText) {
                    setAiBadgeActive();
                    return parseAiReplyAndApply(replyText);
                }
            }
        } catch (e) {
            console.warn(`Streaming AI endpoint ${endpoint} failed, checking alternatives:`, e.message || e);
        }
    }

    // 1. Direct OpenRouter Frontier AI (Native Browser CORS, Stream SSE)
    if (openRouterKey && openRouterKey.startsWith('sk-or-')) {
        const openRouterModels = ['deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'];

        for (const modelName of openRouterModels) {
            try {
                console.log(`Connecting to direct OpenRouter (${modelName})...`);
                const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openRouterKey}`,
                        'HTTP-Referer': typeof window !== 'undefined' && window.location ? window.location.origin : 'https://sabi.app',
                        'X-Title': 'Steady - Sabi Academic OS'
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: 'system', content: systemContent },
                            ...messagesPayload
                        ],
                        temperature: 0.7,
                        max_tokens: 1500,
                        stream: true
                    })
                }, 25000);

                if (res.ok) {
                    const replyText = await readSseStream(res, onToken);
                    if (replyText) {
                        setAiBadgeActive();
                        return parseAiReplyAndApply(replyText);
                    }
                }
            } catch (err) {
                console.warn(`OpenRouter direct model ${modelName} notice:`, err.message || err);
            }
        }
    }

    // 2. Direct Anthropic Claude (if key starts with sk-ant-)
    if (claudeKey && claudeKey.startsWith('sk-ant-')) {
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
                    system: systemContent,
                    messages: messagesPayload
                })
            }, 12000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.content?.[0]?.text;
                if (replyText) {
                    if (typeof onToken === 'function') onToken(replyText, replyText);
                    setAiBadgeActive();
                    return parseAiReplyAndApply(replyText);
                }
            }
        } catch (e) {
            console.warn('Claude API error, falling back:', e.message || e);
        }
    }

    // 3. Direct Google Gemini
    if (geminiKey && geminiKey.length > 15) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messagesPayload.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
                    })),
                    systemInstruction: { parts: [{ text: systemContent }] }
                })
            }, 15000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                    if (typeof onToken === 'function') onToken(replyText, replyText);
                    setAiBadgeActive();
                    return parseAiReplyAndApply(replyText);
                }
            }
        } catch (e) {
            console.warn('Gemini API error, falling back:', e.message || e);
        }
    }

    // 4. Direct OpenAI GPT
    if (openAiKey && openAiKey.startsWith('sk-')) {
        try {
            const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemContent },
                        ...messagesPayload
                    ]
                })
            }, 12000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.choices?.[0]?.message?.content;
                if (replyText) {
                    if (typeof onToken === 'function') onToken(replyText, replyText);
                    setAiBadgeActive();
                    return parseAiReplyAndApply(replyText);
                }
            }
        } catch (e) {
            console.warn('OpenAI API error, falling back:', e.message || e);
        }
    }

    // 5. Intelligent Sabi Offline Assistant with simulated streaming
    const offlineReply = generateOfflineBuddyReply(userText, media, history);
    await simulateTokenStream(offlineReply, onToken);
    return offlineReply;
}

function parseAiReplyAndApply(replyText) {
    let cleanMessage = replyText;
    let actionData = null;

    // 1. Extract JSON block if inside markdown code fences
    const jsonMatch = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            actionData = JSON.parse(jsonMatch[1]);
            cleanMessage = replyText.replace(jsonMatch[0], '').trim();
        } catch (e) {}
    }

    // 2. Fallback: Check if raw JSON was returned without code fences
    if (!actionData) {
        const rawJsonMatch = replyText.match(/\{[\s\r\n]*"action"[\s\r\n]*:[\s\r\n]*"UPDATE_TIMETABLE"[\s\S]*?\}/);
        if (rawJsonMatch) {
            try {
                actionData = JSON.parse(rawJsonMatch[0]);
                cleanMessage = replyText.replace(rawJsonMatch[0], '').trim();
            } catch (e) {}
        }
    }

    let scheduleProposal = null;
    if (actionData && actionData.action === 'UPDATE_TIMETABLE') {
        scheduleProposal = {
            cardId: 'prop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            summary: actionData.summary || 'Proposed Timetable Schedule',
            classes: actionData.classes || [],
            studySessions: actionData.studySessions || [],
            accepted: false
        };
    }

    return {
        role: 'bot',
        content: cleanMessage,
        scheduleProposal: scheduleProposal,
        actionCard: scheduleProposal ? { details: scheduleProposal.summary } : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

function extractSubjectsFromHistory(allUserText) {
    const subjects = new Set();
    const lower = (allUserText || '').toLowerCase();

    // 1. Course codes (e.g. CSC 201, MTH 101, GST 111, LAW 204)
    const codeMatches = allUserText.match(/\b([a-zA-Z]{2,4}\s*[-]?\s*\d{3}[a-zA-Z]?)\b/gi);
    if (codeMatches) {
        codeMatches.forEach(c => subjects.add(c.replace(/[-_\s]+/g, ' ').toUpperCase().trim()));
    }

    // 2. Vocabulary matches
    for (const item of SABI_SUBJECT_VOCAB) {
        const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('\\b' + escaped + '\\b', 'i');
        if (re.test(lower)) {
            subjects.add(item);
        }
    }

    return Array.from(subjects);
}

// High-fidelity intelligent conversational generator with multi-turn memory & adaptive responses
function generateOfflineBuddyReply(userText, media, history) {
    const text = (userText || '').trim();
    const lower = text.toLowerCase();
    const mondayStr = getMondayOfWeek(new Date());

    const allUserMessages = (history || [])
        .filter(m => m.role === 'user')
        .map(m => m.content || '');
    const allUserText = allUserMessages.join(' ');
    const allUserLower = allUserText.toLowerCase();

    // 1. Direct Command: Screenshot / Media Upload
    if (media) {
        const docName = media.name || 'timetable screenshot';

        // Check if classes were detected
        if (media.extractedClasses && media.extractedClasses.length > 0) {
            media.extractedClasses.forEach(cls => {
                storedClasses.push({
                    id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    subject: cls.subject,
                    day: cls.day,
                    start_time: cls.start_time,
                    end_time: cls.end_time,
                    venue: cls.venue || 'Lecture Hall',
                    isRecurring: true
                });
            });
            saveStoredClasses(storedClasses);
            renderAllViews();

            const classSummary = media.extractedClasses.map(c => `• **${c.subject}**: ${c.day} (${c.start_time} – ${c.end_time}) [${c.venue}]`).join('\n');
            return {
                role: 'bot',
                content: `I've locked ${media.extractedClasses.length} recurring classes from your timetable into your calendar. What time window (morning, afternoon, or evening) do you prefer for your personal study sessions?`,
                actionCard: { details: `Imported ${media.extractedClasses.length} classes from timetable screenshot` },
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        // Check if courses were detected
        const detected = (media.extractedCodes && media.extractedCodes.length > 0)
            ? media.extractedCodes
            : extractCourseCodesFromText(media.name + ' ' + (media.textContent || '') + ' ' + userText);

        if (detected.length > 0) {
            return {
                role: 'bot',
                content: `I detected your courses: ${detected.slice(0, 6).join(', ')}. When are your fixed lecture times, or how many hours a day would you like to study?`,
                actionCard: null,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        // Neither classes nor courses detected from image
        return {
            role: 'bot',
            content: `I received your upload, but couldn't detect clear lecture times from it. Could you type your courses or lecture days (e.g., "CSC 201 Mondays at 9am") so I can add them?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 2. Direct Correction: User says "those courses are not on the thing", "wrong courses", "that's wrong"
    if (/\b(not on the (thing|list|image|screenshot|outline)|wrong courses|not my courses|that('s| is) (wrong|incorrect)|incorrect|those are not|none of (those|them)|wrong list)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `My apologies for the confusion! Could you type your actual courses (e.g. ECO 301, ECO 375), and I will update your schedule immediately?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 2b. Direct Academic Goal: 5.00 GPA, 5.0 goal, target CGPA
    if (/\b(5\.00?|5\.0|4\.5|first class|target gpa|cgpa|gpa goal|score 300|jamb goal)\b/i.test(lower)) {
        const student = typeof getStudentAiContext === 'function' ? getStudentAiContext() : {};
        const courses = (student.activeSubjects && student.activeSubjects.length > 0)
            ? student.activeSubjects
            : ['Core Course 1', 'Core Course 2', 'Elective / Lab', 'General Studies'];
        
        const sessions = [];
        courses.slice(0, 4).forEach((c, idx) => {
            sessions.push({
                date: getTodayStr(),
                time: (16 + idx) + ':00',
                duration: 2,
                title: `${c} High-Yield Mastery`,
                category: 'study',
                notes: 'Active recall & past question practice for 5.0 target'
            });
        });

        const proposal = {
            cardId: 'prop-goal-' + Date.now(),
            summary: '5.00 CGPA Intensive Revision Routine',
            classes: [],
            studySessions: sessions,
            accepted: false
        };

        return {
            role: 'bot',
            content: `Targeting a **5.00 CGPA** is a formidable academic commitment! To hit that level, the golden rule is **2 hours of active revision for every 1 lecture hour**, prioritized around spaced testing rather than passive rereading.\n\nI have structured a high-yield study routine across your subjects below. Tap **Accept & Add to Timetable** to lock it in!`,
            scheduleProposal: proposal,
            actionCard: { details: 'Generated 5.00 GPA target study routine' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 3. Direct Command: Clear Timetable
    if (/\b(clear timetable|delete all|clear schedule|reset timetable|reset schedule|wipe timetable)\b/i.test(lower)) {
        calendarEvents.length = 0;
        saveEvents();
        renderAllViews();
        return {
            role: 'bot',
            content: "Timetable cleared! All study sessions have been removed. Let me know whenever you'd like to build a fresh schedule.",
            actionCard: { details: 'Cleared all calendar events' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 3. Conversational: Study Advice, Time Management & Techniques
    if (/\b(time|time management|study tips|study advice|how to study|how should i study|best way to study|study techniques|feynman|pomodoro|schedule|plan my day|productive|productivity|focus)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `To make the best use of your time:
1. **Time-block in 25–45 min sprints (Pomodoro)**: Focus purely on one topic without your phone, followed by a 5-minute break.
2. **Prioritize high-friction subjects first**: Tackle your hardest course during your peak energy window (usually morning or early evening).
3. **Active Recall over re-reading**: Test yourself with flashcards and past questions instead of just staring at notes.

Tell me which subjects or exams you want to master, and I'll schedule targeted study blocks right into your calendar!`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 4. Conversational: General Questions & Inquiries
    if (/\?|how (can|do|should)|what (is|are|should)|why|explain|tell me|help me with|teach/i.test(lower) && !lower.includes('generate') && !lower.includes('build timetable')) {
        return {
            role: 'bot',
            content: `Great question regarding "${escapeHtml(text)}"! The best approach is to break complex topics into daily 30-minute practice sessions and test yourself with past questions. 

Which specific course or exam are you working on right now? Tell me, and I can add high-yield study sessions to your calendar.`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 5. Conversational: Active Recall Explained
    if (/\b(active recall|what is active recall)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `Active recall means testing your memory with questions rather than passively looking over notes. Which course would you like to schedule active recall sessions for?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 6. Conversational: Stress & Overwhelm Empathy
    if (/\b(stressed|stress|overwhelmed|anxious|can't focus|burnout|exhausted|so much to read|panicking)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `Take a deep breath—you don't have to tackle everything at once! Tell me your hardest subject, and we'll schedule short, bite-sized study blocks around your rest hours.`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 7. Conversational: Greetings & Capabilities
    if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening|howdy|sup)\b/i.test(lower) || /\b(who are you|what can you do|how does this work|capabilities)\b/i.test(lower)) {
        const student = getStudentAiContext();
        const introGreeting = student.firstName !== 'Scholar' ? `Hey ${student.firstName}!` : `Hey!`;
        const academicInfo = student.course ? ` I see you're studying ${student.course}${student.university ? ` at ${student.university}` : ''}.` : '';
        return {
            role: 'bot',
            content: `${introGreeting} I'm Steady, your academic mentor and study partner.${academicInfo} What would you like to review, practice, or schedule today?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 7. Exam Category Detection
    let examCategory = 'study';
    if (/\bjamb\b/i.test(allUserLower)) examCategory = 'jamb';
    else if (/\bwaec\b/i.test(allUserLower)) examCategory = 'waec';
    else if (/\bneco\b/i.test(allUserLower)) examCategory = 'neco';
    else if (/\bnoun\b/i.test(allUserLower)) examCategory = 'noun';
    else if (/\bican\b/i.test(allUserLower)) examCategory = 'ican';

    // 8. Subject Extraction
    let extractedSubjects = extractSubjectsFromHistory(allUserText);

    if (extractedSubjects.length === 0) {
        allUserMessages.forEach(msg => {
            const listParts = msg.split(/,|\band\b|\b&\b|\n/i);
            listParts.forEach(p => {
                const clean = p.replace(/^(i study|i am studying|studying|focusing on|taking|doing|my courses are|my subjects are|hardest are|tough|hard|i dread|and|the|my|a|an|i am preparing for|prepping for)\s+/gi, '').trim();
                if (clean.length >= 3 && clean.length <= 35 && !/^(classes|lectures|none|nothing|no|yes|ok|sure|schedule|morning|evening|night|afternoon|jamb|waec|neco|noun|ican|exam|test|timetable)$/i.test(clean) && !/\b(timetable|schedule|generate|create|build|start|ready|clear|reset|delete)\b/i.test(clean)) {
                    extractedSubjects.push(clean.charAt(0).toUpperCase() + clean.slice(1));
                }
            });
        });
        extractedSubjects = [...new Set(extractedSubjects)];
    }

    if (extractedSubjects.length === 0 && storedClasses.length > 0) {
        storedClasses.forEach(cls => {
            if (cls.subject && cls.subject !== 'Lecture') extractedSubjects.push(cls.subject);
        });
        extractedSubjects = [...new Set(extractedSubjects)];
    }

    // 9. Class / Schedule Detection & Negation
    const DAY_RE = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    const currentDays = [...new Set((text.match(DAY_RE) || []).map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()))];
    const allMentionedDays = [...new Set((allUserText.match(DAY_RE) || []).map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()))];

    const hasExplicitNoClasses = /\b(no classes|no lectures|no fixed|dont have|don't have|zero classes|self study|home study|online only|none|nothing|nah|nope|not really|nil)\b/i.test(allUserLower)
        || (/\bno\b/i.test(allUserLower) && allMentionedDays.length === 0 && storedClasses.length === 0);

    // Parse time from text
    function parseTimeFromText(src) {
        const m = src.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || src.match(/\b(\d{1,2}):(\d{2})\b/);
        if (!m) return null;
        let h = parseInt(m[1], 10);
        const min = m[2] || '00';
        const ampm = m[3] ? m[3].toLowerCase() : null;
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        return String(h).padStart(2, '0') + ':' + min;
    }
    const parsedTime = parseTimeFromText(text);

    // 10. Study Window Detection
    let studyWindow = null;
    if (/\b(morning|dawn|early|6am|7am|8am|9am|10am|11am)\b/i.test(allUserLower)) studyWindow = 'morning';
    else if (/\b(afternoon|midday|noon|12pm|1pm|2pm|3pm|4pm)\b/i.test(allUserLower)) studyWindow = 'afternoon';
    else if (/\b(evening|after school|after work|5pm|6pm|7pm|8pm)\b/i.test(allUserLower)) studyWindow = 'evening';
    else if (/\b(night|midnight|late|night owl|9pm|10pm|11pm)\b/i.test(allUserLower)) studyWindow = 'night';
    else if (/\b(anytime|flexible|all day|weekends|any time)\b/i.test(allUserLower)) studyWindow = 'flexible';

    // 11. DIRECT COMMAND: Add Class
    if (currentDays.length > 0 && (lower.includes('class') || lower.includes('lecture') || parsedTime)) {
        const time = parsedTime || '09:00';
        const endTime = calculateEndTime(time, 2);
        let subject = 'Lecture';
        if (extractedSubjects.length > 0) subject = extractedSubjects[0];
        const subMatch = text.match(/([a-zA-Z]{2,4}\s*[-]?\s*\d{3}[a-zA-Z]?|physics|math|maths|chemistry|biology|economics|accounting|law|anatomy|data structures|computer science)/i);
        if (subMatch) subject = subMatch[0].replace(/[-_\s]+/g, ' ').trim().toUpperCase();

        const day = currentDays[0];
        storedClasses.push({
            id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            subject: subject,
            day: day,
            start_time: time,
            end_time: endTime,
            venue: 'Lecture Hall',
            isRecurring: true
        });
        saveStoredClasses(storedClasses);
        renderAllViews();

        return {
            role: 'bot',
            content: `Locked in! **${subject}** every **${day}** (${time} – ${endTime}) added to your recurring lecture schedule.\n\n**When do you prefer to do your personal study?** (Morning, afternoon, evening, or night owl?)`,
            actionCard: { details: `Added ${subject} class on ${day} at ${time}` },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 12. GENERATE TIMETABLE COMMAND
    const hasScheduleInfo = hasExplicitNoClasses || allMentionedDays.length > 0 || storedClasses.length > 0;
    const wantsGenerate = /\b(generate|build|create|let's go|lets go|proceed|do it|ready|make timetable|set up|setup|start|go ahead|build it|make it)\b/i.test(lower)
        || (/\b(yes|yep|yeah|sure|ok|okay|go|done)\b/i.test(lower) && (extractedSubjects.length > 0 || hasScheduleInfo));

    if (wantsGenerate) {
        const subjects = extractedSubjects.length > 0
            ? extractedSubjects
            : (examCategory === 'jamb'
                ? ['Mathematics', 'Physics', 'Chemistry', 'Use of English']
                : ['Core Subject 1', 'Core Subject 2', 'Core Subject 3', 'Revision']);

        const timeMap = {
            morning:   ['07:00', '08:30', '10:00'],
            afternoon: ['13:00', '14:30', '16:00'],
            evening:   ['17:00', '18:30', '20:00'],
            night:     ['20:00', '21:30', '22:30'],
            flexible:  ['10:00', '16:00', '19:00']
        };
        const times = timeMap[studyWindow || 'evening'];

        const sessionCount = Math.min(6, Math.max(4, subjects.length));
        for (let i = 0; i < sessionCount; i++) {
            const sub = subjects[i % subjects.length];
            calendarEvents.push({
                id: 'ev-' + Date.now() + '-' + i,
                title: `${sub} Speed Drill`,
                category: examCategory,
                date: addDaysToDate(mondayStr, i),
                time: times[i % times.length],
                duration: 1.5,
                location: 'Sabi Prep Room',
                notes: `Targeted practice for ${sub}. Active recall & past questions.`,
                completed: false,
                isAiGenerated: true
            });
        }
        saveEvents();
        renderAllViews();

        const winLabel = studyWindow ? `${studyWindow} window` : 'evening slots';
        return {
            role: 'bot',
            content: `**Your personalised timetable is live!**\n\n• **Subjects**: ${subjects.slice(0, 4).join(', ')}${subjects.length > 4 ? ' + more' : ''}\n• **Study Window**: Scheduled in your ${winLabel}\n• **Strategy**: Spaced repetition with high-yield drills\n• **Rest Day**: Sunday kept free for rest and catch-up\n\nCheck the **Schedule** tab or switch to **Week Grid** to view your complete week!`,
            actionCard: { details: `Generated ${sessionCount} study sessions for ${subjects.slice(0, 3).join(', ')}` },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 13. NATURAL CONVERSATIONAL STAGES
    const hasSubjects = extractedSubjects.length > 0;
    const hasWindowInfo = studyWindow !== null;

    if (!hasSubjects) {
        // Check if user is asking a general question or asking for help
        const isQuestion = /\?|what|how|why|who|explain|tell me|can you|help me with|teach|meaning|solve|tips/i.test(lower);
        if (isQuestion) {
            return {
                role: 'bot',
                content: `Regarding "${escapeHtml(text)}": Focus on breaking this down into bite-sized concepts and testing yourself with active recall. Tell me what course or subject this belongs to, and I can give you key practice topics or add focused revision blocks to your study timetable!`,
                actionCard: null,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        let prefix = '';
        if (examCategory !== 'study') {
            prefix = `Awesome! Prepping for **${examCategory.toUpperCase()}** is a huge milestone. `;
        }

        return {
            role: 'bot',
            content: `${prefix}I'm here to help you ace your studies! What specific courses, lecture hours, or exam topics would you like to tackle today?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    if (!hasScheduleInfo) {
        const subList = extractedSubjects.slice(0, 2).join(' and ');
        return {
            role: 'bot',
            content: `Got it! **${subList}** will get priority focus blocks so you master them early.\n\n**Do you have fixed lecture times on campus?** Tell me days and times (e.g. *Mondays at 10am*), or say **"no fixed classes"** if your schedule is open.`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    if (!hasWindowInfo) {
        const classAck = hasExplicitNoClasses
            ? 'Understood — no fixed classes! Total schedule freedom gives us flexibility to build your ideal rhythm.\n\n'
            : 'Classes noted!\n\n';
        return {
            role: 'bot',
            content: `${classAck}**When do you study best?** Morning, afternoon, evening, or are you a night owl? I'll schedule your revision blocks into that window.`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    const subSummary = extractedSubjects.slice(0, 3).join(', ');
    return {
        role: 'bot',
        content: `I've got everything ready!\n\n• **Focus Subjects**: ${subSummary}\n• **Lectures**: ${hasExplicitNoClasses ? 'Self-paced (No fixed lectures)' : 'Fixed schedule blocked'}\n• **Study Window**: ${studyWindow}\n• **Target**: ${examCategory.toUpperCase()}\n\nReady to see your schedule? Just say **"Yes, build it!"** or tap **Generate** below!`,
        actionCard: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

// ==========================================
// --- QUICK-ADD NATURAL LANGUAGE HANDLER ---
// ==========================================
function parseQuickScheduleText(raw) {
    let text = raw.trim();
    let category = 'study';
    if (/\bjamb\b/i.test(text)) category = 'jamb';
    else if (/\bwaec\b/i.test(text)) category = 'waec';
    else if (/\bneco\b/i.test(text)) category = 'neco';
    else if (/\bnoun\b/i.test(text)) category = 'noun';
    else if (/\bican\b/i.test(text)) category = 'ican';

    let dateStr = selectedDate || getTodayStr();
    if (/\btomorrow\b/i.test(text)) {
        dateStr = getFutureDateString(1);
        text = text.replace(/\btomorrow\b/gi, '').trim();
    } else if (/\btoday\b/i.test(text)) {
        dateStr = getTodayStr();
        text = text.replace(/\btoday\b/gi, '').trim();
    }

    let timeStr = '17:00';
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
    }

    let title = text.replace(/\b(at|on|for|in|by)\b\s*$/i, '').trim() || raw;
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { title, category, date: dateStr, time: timeStr, duration: 1.5 };
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
        location: 'Sabi Study Plan',
        notes: `Quick added: "${raw}"`,
        completed: false,
        isAiGenerated: false
    };

    calendarEvents.push(newEvent);
    saveEvents();

    selectedDate = parsed.date;
    renderAllViews();
    input.value = '';
    showToast(`Added: ${parsed.title}`);
}
window.handleQuickScheduleAdd = handleQuickScheduleAdd;

// ==========================================
// --- EXPORT & SYNC --- (RFC 5545 .ICS & GCAL)
// ==========================================
function createGoogleCalendarUrl(event) {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
        (event.notes ? `${event.notes}\n\n` : '') +
        `Category: ${(event.category || 'STUDY').toUpperCase()}\n` +
        `Managed with Sabi Academic App`
    );
    const location = encodeURIComponent(event.location || 'Sabi Prep Room');

    const startD = new Date(`${event.date}T${event.time || '17:00'}:00`);
    const durationHours = parseFloat(event.duration || 1.5);
    const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);

    const startStr = formatGoogleIso(startD);
    const endStr = formatGoogleIso(endD);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

function exportToIcs() {
    const totalItems = calendarEvents.length + storedClasses.length;
    if (totalItems === 0) {
        alert('No events or classes to export. Add some first!');
        return;
    }

    const dayToIcsMap = {
        'Monday': 'MO',
        'Tuesday': 'TU',
        'Wednesday': 'WE',
        'Thursday': 'TH',
        'Friday': 'FR',
        'Saturday': 'SA',
        'Sunday': 'SU'
    };

    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sabi App//Academic Timetable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Sabi Academic & Study Timetable',
        'X-WR-TIMEZONE:Africa/Lagos'
    ];

    const dtstamp = formatGoogleIso(new Date());

    // 1. Recurring Classes
    storedClasses.forEach(cls => {
        const icsDay = dayToIcsMap[cls.day] || 'MO';
        const dummyDate = getMondayOfWeek(new Date());
        const startD = new Date(`${dummyDate}T${cls.start_time || '09:00'}:00`);
        const duration = calculateDuration(cls.start_time, cls.end_time);
        const endD = new Date(startD.getTime() + duration * 60 * 60 * 1000);

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${cls.id}@sabiapp.ng`);
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`DTSTART:${formatGoogleIso(startD)}`);
        ics.push(`DTEND:${formatGoogleIso(endD)}`);
        ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${icsDay}`);
        ics.push(`SUMMARY:${escapeIcs(cls.subject)}`);
        ics.push(`LOCATION:${escapeIcs(cls.venue || 'Lecture Hall')}`);
        ics.push(`DESCRIPTION:Recurring weekly lecture on ${cls.day}`);
        ics.push('STATUS:CONFIRMED');
        ics.push('END:VEVENT');
    });

    // 2. Study Sessions
    calendarEvents.forEach(ev => {
        const startD = new Date(`${ev.date}T${ev.time || '17:00'}:00`);
        const duration = parseFloat(ev.duration || 1.5);
        const endD = new Date(startD.getTime() + duration * 60 * 60 * 1000);

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${ev.id}@sabiapp.ng`);
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`DTSTART:${formatGoogleIso(startD)}`);
        ics.push(`DTEND:${formatGoogleIso(endD)}`);
        ics.push(`SUMMARY:${escapeIcs(ev.title)}`);
        if (ev.notes) ics.push(`DESCRIPTION:${escapeIcs(ev.notes)}`);
        ics.push(`LOCATION:${escapeIcs(ev.location || 'Sabi Prep Room')}`);
        ics.push('STATUS:CONFIRMED');
        ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sabi_academic_timetable.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded .ICS! Ready to import to Apple / Google Calendar.');
}
window.exportToIcs = exportToIcs;

function triggerPrintTimetable() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');
    switchViewMode('week');
    setTimeout(() => {
        window.print();
    }, 250);
}
window.triggerPrintTimetable = triggerPrintTimetable;

function togglePlannerMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.toggle('hidden');
}
window.togglePlannerMenu = togglePlannerMenu;

function triggerRegeneratePlan() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');
    openSabiAiChat();
}
window.triggerRegeneratePlan = triggerRegeneratePlan;

function promptClearAllEvents() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');

    if (confirm('Clear your entire timetable (all recurring classes and study sessions)?')) {
        calendarEvents = [];
        storedClasses = [];
        saveEvents();
        saveStoredClasses(storedClasses);
        renderAllViews();
        showToast('Timetable cleared.');
    }
}
window.promptClearAllEvents = promptClearAllEvents;

// ==========================================
// --- GOOGLE CALENDAR REAL-TIME SYNC ENGINE ---
// ==========================================
let gcalTokenClient = null;

function getGoogleClientId() {
    return (window.ENV && window.ENV.GOOGLE_CLIENT_ID) ||
           localStorage.getItem('sabi_gcal_client_id') ||
           '';
}

function saveGoogleClientIdFromInput() {
    const input = document.getElementById('gcal-client-id-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        localStorage.setItem('sabi_gcal_client_id', val);
        showToast('Google Client ID saved.');
        updateGcalUiState();
    } else {
        localStorage.removeItem('sabi_gcal_client_id');
        showToast('Client ID cleared.');
        updateGcalUiState();
    }
}
window.saveGoogleClientIdFromInput = saveGoogleClientIdFromInput;

function isGcalConnected() {
    const connectedFlag = localStorage.getItem('sabi_gcal_connected') === 'true';
    const token = sessionStorage.getItem('sabi_gcal_token');
    const expiresAt = parseInt(sessionStorage.getItem('sabi_gcal_token_expires_at') || '0', 10);
    return connectedFlag && !!token && Date.now() < expiresAt;
}
window.isGcalConnected = isGcalConnected;

function isGcalAutoSyncEnabled() {
    return localStorage.getItem('sabi_gcal_auto_sync') !== 'false';
}
window.isGcalAutoSyncEnabled = isGcalAutoSyncEnabled;

function setGcalAutoSyncEnabled(enabled) {
    localStorage.setItem('sabi_gcal_auto_sync', enabled ? 'true' : 'false');
    updateGcalUiState();
    showToast(enabled ? 'Google Auto-Sync enabled.' : 'Google Auto-Sync disabled.');
}
window.setGcalAutoSyncEnabled = setGcalAutoSyncEnabled;

function getGcalToken() {
    if (!isGcalConnected()) return null;
    return sessionStorage.getItem('sabi_gcal_token');
}

function openGoogleSyncModal() {
    const menu = document.getElementById('planner-dropdown-menu');
    if (menu) menu.classList.add('hidden');

    const modal = document.getElementById('google-sync-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        updateGcalUiState();
    }
}
window.openGoogleSyncModal = openGoogleSyncModal;

function closeGoogleSyncModal(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn') && !e.target.classList.contains('modal-overlay')) return;
    const modal = document.getElementById('google-sync-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeGoogleSyncModal = closeGoogleSyncModal;

function updateGcalUiState() {
    const connected = isGcalConnected();
    const autoSync = isGcalAutoSyncEnabled();
    const clientId = getGoogleClientId();

    // 1. Hub badge & subtext
    const hubBadge = document.getElementById('gcal-hub-badge');
    const hubSubtext = document.getElementById('gcal-hub-subtext');
    if (hubBadge) {
        hubBadge.className = `gcal-mini-badge ${connected ? 'connected' : 'not-connected'}`;
        hubBadge.textContent = connected ? 'Synced' : 'Live';
    }
    if (hubSubtext) {
        hubSubtext.textContent = connected 
            ? (autoSync ? 'Auto-sync active' : 'Connected (Manual)')
            : 'Automatic 2-way sync';
    }

    // 2. Client ID input
    const input = document.getElementById('gcal-client-id-input');
    if (input && !input.value) {
        input.value = clientId;
    }

    // 3. Status card in modal
    const card = document.getElementById('gcal-status-card');
    const btnConnect = document.getElementById('btn-gcal-connect');
    const btnSyncAll = document.getElementById('btn-gcal-sync-all');
    const btnDisconnect = document.getElementById('btn-gcal-disconnect');
    const btnConnectText = document.getElementById('btn-gcal-connect-text');

    const lastSyncStr = localStorage.getItem('sabi_gcal_last_sync');

    if (card) {
        if (connected) {
            card.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="gcal-pulsing-dot active"></span>
                        <strong style="font-size: 14px; color: var(--text-main);">Google Calendar Connected</strong>
                    </div>
                    <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 2px 8px; border-radius: 999px; font-weight: 700;">ACTIVE</span>
                </div>
                <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin-bottom: 14px;">
                    <div>Target Calendar: <strong style="color: var(--text-main);">Sabi Study Timetable</strong></div>
                    ${lastSyncStr ? `<div>Last Synced: <span style="color: var(--text-main);">${new Date(lastSyncStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span></div>` : ''}
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; user-select: none; border-top: 1px solid var(--border); padding-top: 10px;">
                    <input type="checkbox" id="gcal-auto-sync-toggle" ${autoSync ? 'checked' : ''} onchange="setGcalAutoSyncEnabled(this.checked)" />
                    <span>Auto-sync when classes & sessions are added or changed</span>
                </label>
            `;
            if (btnConnect) btnConnect.classList.add('hidden');
            if (btnSyncAll) btnSyncAll.classList.remove('hidden');
            if (btnDisconnect) btnDisconnect.classList.remove('hidden');
        } else {
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span class="gcal-pulsing-dot inactive"></span>
                    <strong style="font-size: 14px; color: var(--text-main);">Not Connected</strong>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.5;">
                    Connect your Google account so that whenever you schedule classes or Steady adds study sessions, they automatically sync straight to your Google Calendar on your phone & laptop.
                </p>
            `;
            if (btnConnect) {
                btnConnect.classList.remove('hidden');
                if (btnConnectText) btnConnectText.textContent = 'Connect Google Calendar';
            }
            if (btnSyncAll) btnSyncAll.classList.add('hidden');
            if (btnDisconnect) btnDisconnect.classList.add('hidden');
        }
    }
}
window.updateGcalUiState = updateGcalUiState;

function handleGoogleConnectClick() {
    const clientId = getGoogleClientId();
    if (!clientId) {
        const entered = prompt('Please enter your Google OAuth 2.0 Web Client ID:');
        if (entered && entered.trim()) {
            localStorage.setItem('sabi_gcal_client_id', entered.trim());
            updateGcalUiState();
        } else {
            return;
        }
    }

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        showToast('Google Services is still loading. Please check internet connection.');
        return;
    }

    const currentClientId = getGoogleClientId();
    gcalTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: currentClientId,
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
        callback: async (tokenResponse) => {
            if (tokenResponse.error) {
                console.error('Google OAuth error:', tokenResponse);
                showToast('Sign-in cancelled or failed: ' + tokenResponse.error);
                return;
            }
            await onGcalTokenReceived(tokenResponse);
        }
    });

    gcalTokenClient.requestAccessToken({ prompt: 'consent' });
}
window.handleGoogleConnectClick = handleGoogleConnectClick;

async function onGcalTokenReceived(tokenResponse) {
    const token = tokenResponse.access_token;
    const expiresIn = parseInt(tokenResponse.expires_in || '3600', 10);
    const expiresAt = Date.now() + (expiresIn * 1000) - 60000; // 1 min buffer

    sessionStorage.setItem('sabi_gcal_token', token);
    sessionStorage.setItem('sabi_gcal_token_expires_at', expiresAt.toString());
    localStorage.setItem('sabi_gcal_connected', 'true');

    showToast('Initializing Sabi Google Calendar...');
    try {
        await ensureSabiGoogleCalendar(token);
        updateGcalUiState();
        showToast('Google Calendar connected! Syncing timetable...');
        await syncAllEventsToGoogle(true);
        updateGcalUiState();
    } catch (e) {
        console.error('Failed to setup calendar:', e);
        showToast('Connected, but could not create secondary calendar: ' + e.message);
        updateGcalUiState();
    }
}

function disconnectGoogleCalendar() {
    if (confirm('Disconnect Google Calendar sync? Your existing Google Calendar events will remain, but automatic sync will stop.')) {
        const token = sessionStorage.getItem('sabi_gcal_token');
        if (token && typeof google !== 'undefined' && google.accounts?.oauth2) {
            try {
                google.accounts.oauth2.revoke(token, () => {});
            } catch (e) {}
        }
        sessionStorage.removeItem('sabi_gcal_token');
        sessionStorage.removeItem('sabi_gcal_token_expires_at');
        localStorage.removeItem('sabi_gcal_connected');
        localStorage.removeItem('sabi_gcal_calendar_id');
        localStorage.removeItem('sabi_gcal_last_sync');
        updateGcalUiState();
        showToast('Google Calendar disconnected.');
    }
}
window.disconnectGoogleCalendar = disconnectGoogleCalendar;

async function ensureSabiGoogleCalendar(token) {
    let calId = localStorage.getItem('sabi_gcal_calendar_id');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1. If we have a cached calendar ID, verify it still exists
    if (calId) {
        try {
            const checkRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}`, { headers });
            if (checkRes.ok) return calId;
        } catch (e) {}
    }

    // 2. Search calendar list for "Sabi Study Timetable"
    try {
        const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
        if (listRes.ok) {
            const listData = await listRes.json();
            const existing = (listData.items || []).find(c => c.summary === 'Sabi Study Timetable');
            if (existing) {
                localStorage.setItem('sabi_gcal_calendar_id', existing.id);
                return existing.id;
            }
        }
    } catch (e) {}

    // 3. Create a dedicated secondary calendar
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            summary: 'Sabi Study Timetable',
            description: 'Automatic sync of study sessions, revision blocks, and lectures from Sabi Academic OS',
            timeZone: timeZone
        })
    });

    if (createRes.ok) {
        const newCal = await createRes.json();
        localStorage.setItem('sabi_gcal_calendar_id', newCal.id);
        return newCal.id;
    }

    // Fallback to primary if secondary creation is restricted
    return 'primary';
}

async function syncSingleEventToGoogle(event, quiet = false) {
    const token = getGcalToken();
    if (!token) return;

    const calId = localStorage.getItem('sabi_gcal_calendar_id') || 'primary';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

    const startD = new Date(`${event.date}T${event.time || '17:00'}:00`);
    const durationHours = parseFloat(event.duration || 1.5);
    const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);

    const body = {
        summary: event.title,
        description: (event.notes ? `${event.notes}\n\n` : '') +
                     `Category: ${(event.category || 'STUDY').toUpperCase()}\n` +
                     (event.completed ? `Status: COMPLETED\n` : '') +
                     `Managed with Sabi Academic OS`,
        location: event.location || 'Sabi Prep Room',
        start: { dateTime: startD.toISOString(), timeZone },
        end: { dateTime: endD.toISOString(), timeZone }
    };

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let res;
        if (event.gcalEventId) {
            // Update existing
            res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(event.gcalEventId)}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });
        } else {
            // Create new
            res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
        }

        if (res.ok) {
            const data = await res.json();
            event.gcalEventId = data.id;
            saveEvents();
            localStorage.setItem('sabi_gcal_last_sync', new Date().toISOString());
            if (!quiet) showToast('Synced to Google Calendar!');
        } else if (res.status === 401) {
            sessionStorage.removeItem('sabi_gcal_token');
            updateGcalUiState();
        }
    } catch (err) {
        console.warn('Google event sync error:', err);
    }
}
window.syncSingleEventToGoogle = syncSingleEventToGoogle;

async function deleteEventFromGoogle(gcalEventId) {
    if (!gcalEventId) return;
    const token = getGcalToken();
    if (!token) return;

    const calId = localStorage.getItem('sabi_gcal_calendar_id') || 'primary';
    try {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(gcalEventId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) {
        console.warn('Failed to delete Google event:', e);
    }
}
window.deleteEventFromGoogle = deleteEventFromGoogle;

async function syncClassToGoogle(cls, quiet = false) {
    const token = getGcalToken();
    if (!token) return;

    const calId = localStorage.getItem('sabi_gcal_calendar_id') || 'primary';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

    const dayToIcsMap = {
        'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
        'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA', 'Sunday': 'SU'
    };

    const mondayDate = getMondayOfWeek(new Date());
    const startD = new Date(`${mondayDate}T${cls.start_time || '09:00'}:00`);
    const duration = calculateDuration(cls.start_time, cls.end_time);
    const endD = new Date(startD.getTime() + duration * 60 * 60 * 1000);

    const body = {
        summary: `${cls.subject} (Lecture)`,
        description: `Weekly recurring lecture on ${cls.day}.\nVenue: ${cls.venue || 'Lecture Hall'}\nManaged with Sabi Academic OS`,
        location: cls.venue || 'Lecture Hall',
        start: { dateTime: startD.toISOString(), timeZone },
        end: { dateTime: endD.toISOString(), timeZone },
        recurrence: [
            `RRULE:FREQ=WEEKLY;BYDAY=${dayToIcsMap[cls.day] || 'MO'}`
        ]
    };

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let res;
        if (cls.gcalEventId) {
            res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(cls.gcalEventId)}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });
        } else {
            res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
        }

        if (res.ok) {
            const data = await res.json();
            cls.gcalEventId = data.id;
            saveStoredClasses(storedClasses);
            localStorage.setItem('sabi_gcal_last_sync', new Date().toISOString());
            if (!quiet) showToast('Class synced to Google Calendar!');
        }
    } catch (e) {
        console.warn('Failed to sync class to Google:', e);
    }
}
window.syncClassToGoogle = syncClassToGoogle;

async function deleteClassFromGoogle(gcalEventId) {
    return deleteEventFromGoogle(gcalEventId);
}
window.deleteClassFromGoogle = deleteClassFromGoogle;

async function syncAllEventsToGoogle(quiet = false) {
    if (!isGcalConnected()) {
        if (!quiet) showToast('Please connect Google Calendar first.');
        openGoogleSyncModal();
        return;
    }

    const total = calendarEvents.length + storedClasses.length;
    if (total === 0) {
        if (!quiet) showToast('No events or classes to sync.');
        return;
    }

    if (!quiet) showToast(`Syncing ${total} timetable items to Google Calendar...`);

    // Sync recurring classes
    for (const cls of storedClasses) {
        await syncClassToGoogle(cls, true);
    }

    // Sync study sessions
    for (const ev of calendarEvents) {
        await syncSingleEventToGoogle(ev, true);
    }

    localStorage.setItem('sabi_gcal_last_sync', new Date().toISOString());
    updateGcalUiState();
    if (!quiet) showToast(`Successfully synced ${total} items to Google Calendar!`);
}
window.syncAllEventsToGoogle = syncAllEventsToGoogle;

// Category Badge Color & Text Helpers
function getCategoryColor(cat) {
    const found = CATEGORIES.find(c => c.key === (cat || '').toLowerCase());
    return found ? found.color : '#3D8EFF';
}

function getCategoryBadgeText(cat) {
    const found = CATEGORIES.find(c => c.key === (cat || '').toLowerCase());
    return found ? found.label : 'Study';
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    function onCalendarReady() {
        initCalendarApp();
        if (typeof updateGcalUiState === 'function') {
            updateGcalUiState();
        }
        if (typeof window !== 'undefined') {
            const hasChatParam = (window.location?.search || '').includes('chat=1') || window.location?.hash === '#chat';
            if (hasChatParam) {
                setTimeout(() => {
                    openSabiAiChat();
                }, 350);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onCalendarReady);
    } else {
        onCalendarReady();
    }
}

