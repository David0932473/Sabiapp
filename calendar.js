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
    if (document.getElementById('mini-cal-days')) {
        renderMiniCalendarStrip();
    }
    if (document.getElementById('view-week-container')) {
        if (currentViewMode === 'week') {
            renderWeekTimetable();
        } else {
            renderAgendaTimeline();
        }
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
let currentViewMode = 'agenda'; // 'agenda' or 'week'
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
        checkAndShowFirstTimePopup();
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
// --- VIEW SWITCHING ---
// ==========================================
function switchViewMode(mode) {
    currentViewMode = mode;
    
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.calendar-view-pane').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('active');
    });

    const activeTab = document.getElementById(`btn-view-${mode}`);
    const activePane = document.getElementById(`view-${mode}-container`);

    if (activeTab) activeTab.classList.add('active');
    if (activePane) {
        activePane.classList.remove('hidden');
        activePane.classList.add('active');
    }

    if (mode === 'agenda') {
        renderAgendaTimeline();
    } else {
        renderWeekTimetable();
    }
}
window.switchViewMode = switchViewMode;

// ==========================================
// --- 7-DAY MINI CALENDAR STRIP ---
// ==========================================
function changeStripWeek(direction) {
    stripWeekOffset += direction;
    renderMiniCalendarStrip();
}
window.changeStripWeek = changeStripWeek;

function goToToday() {
    stripWeekOffset = 0;
    selectedDate = getTodayStr();
    renderMiniCalendarStrip();
    renderAllViews();
}
window.goToToday = goToToday;

function onSelectDate(dateStr) {
    selectedDate = dateStr;
    renderMiniCalendarStrip();
    renderAgendaTimeline();
}
window.onSelectDate = onSelectDate;

function renderMiniCalendarStrip() {
    const container = document.getElementById('mini-cal-days');
    const label = document.getElementById('strip-month-label');
    if (!container) return;

    const baseMonday = getMondayOfWeek(new Date());
    const weekMondayStr = addDaysToDate(baseMonday, stripWeekOffset * 7);
    const weekMonDate = new Date(weekMondayStr + 'T00:00:00');

    if (label) {
        label.textContent = weekMonDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    const todayStr = getTodayStr();
    const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let html = '';
    for (let i = 0; i < 7; i++) {
        const currentDateStr = addDaysToDate(weekMondayStr, i);
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

        if (editId) {
            const idx = storedClasses.findIndex(c => c.id === editId);
            if (idx !== -1) {
                storedClasses[idx] = { id: editId, subject, day, start_time: start, end_time: end, venue, isRecurring: true };
            }
        } else {
            storedClasses.push({
                id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                subject,
                day,
                start_time: start,
                end_time: end,
                venue,
                isRecurring: true
            });
        }
        saveStoredClasses(storedClasses);
        showToast(editId ? 'Class updated!' : 'Recurring class added to timetable!');
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

        if (syncGcal && savedEvent) {
            window.open(createGoogleCalendarUrl(savedEvent), '_blank');
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
            storedClasses = storedClasses.filter(c => c.id !== selectedDetailEventId);
            saveStoredClasses(storedClasses);
        } else {
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
    content: "Hey! I'm your Sabi Copilot, here to build a weekly timetable that fits your life. What degree, courses, or exam (JAMB, WAEC, NOUN, ICAN) are you focusing on this semester? *(Tap the attach button below to upload a course outline)*",
    timestamp: 'Just now'
};

function getChatHistory() {
    try {
        const stored = localStorage.getItem('sabi_chat_history_v4');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return [DEFAULT_CHAT_GREETING];
}

function saveChatHistory(history) {
    try {
        const sanitized = (history || []).slice(-35).map(msg => {
            if (!msg.media) return msg;
            const cleanMedia = { ...msg.media };
            // Strip large base64 dataUrl before saving to localStorage to prevent QuotaExceededError
            if (cleanMedia.dataUrl && cleanMedia.dataUrl.length > 2500) {
                cleanMedia.dataUrl = null;
            }
            return {
                ...msg,
                media: cleanMedia
            };
        });
        localStorage.setItem('sabi_chat_history_v4', JSON.stringify(sanitized));
    } catch (e) {
        console.warn('Failed to save chat history to localStorage:', e);
        try {
            const minimal = (history || []).slice(-10).map(m => ({
                role: m.role,
                content: m.content,
                actionCard: m.actionCard,
                timestamp: m.timestamp
            }));
            localStorage.setItem('sabi_chat_history_v4', JSON.stringify(minimal));
        } catch (e2) {}
    }
}

function openSabiAiChat() {
    const hubMenu = document.getElementById('planner-dropdown-menu');
    if (hubMenu) hubMenu.classList.add('hidden');

    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    const badge = document.getElementById('chat-live-ai-badge');
    const statusText = document.getElementById('chat-header-status-text');
    if (badge) {
        badge.textContent = 'AI Active';
        badge.style.display = 'inline-flex';
    }
    if (statusText) {
        statusText.textContent = 'Academic Architect • Multimodal Vision Enabled';
    }

    setStudioMode(currentStudioMode || 'planner');
    renderChatMessages();

    setTimeout(() => {
        const input = document.getElementById('chat-user-input');
        if (input) input.focus();
    }, 200);
}
window.openSabiAiChat = openSabiAiChat;

function closeSabiAiChat(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('close-btn') && !e.target.closest('.close-btn') && !e.target.classList.contains('modal-overlay')) return;
    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeSabiAiChat = closeSabiAiChat;

function clearChatHistory() {
    if (confirm('Restart session with Sabi AI Copilot?')) {
        saveChatHistory([DEFAULT_CHAT_GREETING]);
        removePendingChatMedia();
        renderChatMessages();
        renderChatQuickChips();
        showToast('Copilot session restarted.');
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

// Render markdown-lite: bold (**text**), italic (*text*), newlines
function renderMarkdownLite(text) {
    if (!text) return '';
    // Escape HTML first, then apply markdown patterns
    let safe = escapeHtml(text);
    // Bold: **text**
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (not preceded by another *)
    safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Bullet lines starting with • or -
    safe = safe.replace(/^([•\-]) (.+)$/gm, '<span class="chat-bullet">$1 $2</span>');
    // Newlines to <br>
    safe = safe.replace(/\n/g, '<br>');
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
    ],
    vision: [
        "Upload Timetable Screenshot",
        "Upload Course Outline / Syllabus",
        "Extract recurring lectures from photo",
        "Identify tough topics from outline",
        "Re-scan uploaded image"
    ],
    exam: [
        "Prepping for JAMB in 6 weeks",
        "WAEC / SSCE revision timetable",
        "Finals in 3 weeks: ECO375 & MTH101",
        "Intensive 3-hour daily drill mode",
        "Build spaced repetition schedule"
    ]
};

function setStudioMode(mode) {
    if (!STUDIO_MODE_CHIPS[mode]) mode = 'planner';
    currentStudioMode = mode;

    ['planner', 'vision', 'exam'].forEach(m => {
        const pill = document.getElementById(`mode-pill-${m}`);
        if (pill) {
            if (m === mode) pill.classList.add('active');
            else pill.classList.remove('active');
        }
    });

    renderChatQuickChips();

    if (mode === 'vision') {
        const input = document.getElementById('chat-user-input');
        if (input && !input.value.trim() && !pendingChatMedia) {
            input.placeholder = "Upload or paste course outline photo for Vision OCR...";
        }
    }
}
window.setStudioMode = setStudioMode;

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const history = getChatHistory();
    const isInitialState = history.length <= 1;

    let heroHtml = '';
    if (isInitialState) {
        heroHtml = `
            <div class="copilot-launchpad-hero">
                <div class="launchpad-header">
                    <span class="launchpad-badge">ACADEMIC COPILOT STUDIO</span>
                    <h3 class="launchpad-heading">What are we planning today?</h3>
                    <p class="launchpad-sub">Scan a course outline photo, lock in lecture times, or build a personalized revision routine.</p>
                </div>
                <div class="launchpad-grid">
                    <div class="launchpad-tile" onclick="triggerChatMediaUpload()">
                        <span class="launchpad-tile-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>
                        <span class="launchpad-tile-title">Scan Course Outline</span>
                        <span class="launchpad-tile-desc">Upload timetable photo for instant Vision OCR</span>
                    </div>
                    <div class="launchpad-tile" onclick="handleQuickChipClick('I want to auto-balance my weekly study sessions around my lectures')">
                        <span class="launchpad-tile-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                        <span class="launchpad-tile-title">Auto-Balance Week</span>
                        <span class="launchpad-tile-desc">Distribute study blocks without clashes</span>
                    </div>
                    <div class="launchpad-tile" onclick="setStudioMode('exam'); handleQuickChipClick('Prepping for exams in 6 weeks, help me build a timetable')">
                        <span class="launchpad-tile-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
                        <span class="launchpad-tile-title">Exam Crunch Mode</span>
                        <span class="launchpad-tile-desc">Prioritize tough subjects with spaced review</span>
                    </div>
                    <div class="launchpad-tile" onclick="handleQuickChipClick('Schedule 2 hours of focused evening study (7pm - 9pm) every weekday')">
                        <span class="launchpad-tile-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>
                        <span class="launchpad-tile-title">Evening Deep Work</span>
                        <span class="launchpad-tile-desc">Lock in daily 7pm - 9pm distraction-free study</span>
                    </div>
                </div>
            </div>
        `;
    }

    const messagesHtml = history.map(msg => {
        const isUser = msg.role === 'user';
        let actionCardHtml = '';
        if (msg.actionCard) {
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

        // Bot messages get markdown rendering; user messages stay plain
        const contentHtml = isUser
            ? `<div>${escapeHtml(msg.content)}</div>`
            : `<div>${renderMarkdownLite(msg.content)}</div>`;

        return `
            <div class="studio-msg-row chat-msg-row ${isUser ? 'user' : 'bot'}">
                ${!isUser ? `<img src="avatars/notion-scholar.svg" alt="Sabi Copilot" class="studio-msg-avatar chat-msg-avatar" />` : ''}
                <div class="studio-bubble chat-bubble">
                    ${mediaHtml}
                    ${contentHtml}
                    ${actionCardHtml}
                </div>
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

    // Show typing indicator
    showTypingIndicator();

    try {
        const botReply = await processBuddyConversation(textToSend, history, mediaSnapshot);
        hideTypingIndicator();

        history.push(botReply);
        saveChatHistory(history);
        renderChatMessages();

        // Refresh views if new timetable items were added
        renderAllViews();
    } catch (err) {
        hideTypingIndicator();
        console.error('Chat processing error:', err);
        const fallback = generateOfflineBuddyReply(textToSend, mediaSnapshot, history);
        history.push(fallback);
        saveChatHistory(history);
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
        <img src="avatars/notion-scholar.svg" alt="Sabi Copilot" class="studio-msg-avatar chat-msg-avatar" />
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

// Highly conversational, empathetic, goal-driven prompt guiding Sabi Study Buddy persona
const BUDDY_SYSTEM_PROMPT = `You are "Sabi Study Buddy", an empathetic academic timetable planner & mentor for Nigerian and international students (University, Polytechnic, JAMB, WAEC, NOUN, ICAN).
Tone: Warm, encouraging, concise, relatable, and authentic. You speak like a smart peer who wants them to succeed without burnout.
CORE MISSION: Build an actionable, balanced weekly study timetable that populates their calendar.

CRITICAL BREVITY RULE (MANDATORY - MAX 2 TO 3 SENTENCES):
- Every text response MUST be strictly 2 to 3 sentences maximum (unless presenting the generated timetable JSON block).
- Absolutely NO long text blocks, NO multi-paragraph essays, and NO bulleted walls of text.
- Structure:
  * Sentence 1: Warm 1-sentence acknowledgment of what the student said or uploaded.
  * Sentence 2 (and optional Sentence 3): Your single practical question about their timetable parameters, or a 1-sentence summary of the schedule you generated.

STRICT RULE - NO SYLLABUS DRILLING OR SUBJECT TUTORING:
- NEVER ask the student about specific syllabus topics, chapters, equations, or academic subtopics (e.g., NEVER ask "are you worried about optimization, econometrics, or calculus?"). That is completely useless for building their timetable.
- When a student mentions a tough course (like ECO375 or Maths), acknowledge it warmly, note that you will give it prime study slots with extra review sessions, and immediately ask for their TIMETABLE parameters:
  "When are your fixed lectures for this course, or what time of day (morning, afternoon, or evening) do you have the highest energy to study it?"

STRICT IDENTITY & ANONYMITY RULE:
- You are strictly "Sabi AI" or "Sabi Copilot".
- NEVER reveal, state, or mention the underlying AI model, architecture, or provider (such as NVIDIA, NIM, LLaMA, Meta, OpenAI, GPT, Claude, Anthropic, or Gemini) to the user under any circumstance.
- If asked what model or AI you are, reply simply: "I am Sabi AI Copilot, your academic architect."

MULTIMODAL & VISION INSTRUCTIONS:
- You are equipped with advanced vision capabilities. You CAN and MUST analyze photos, screenshots, course outlines, syllabi, notes, and timetable screenshots provided by the user.
- NEVER refuse or claim "I can't extract your schedule from a photo or URL" or tell the student you cannot read images.
- When an image or timetable OCR snippet is provided, immediately inspect it, list the detected courses or lecture slots, and help them lock it into their timetable!

CONVERSATIONAL RULES (DIRECT TO END GOAL):
1. **ONE PRACTICAL QUESTION AT A TIME**: Keep your questions strictly focused on timetable inputs:
   - Target degree/exam & subjects.
   - Fixed lecture hours (days and start/end times).
   - Study availability (how many hours a day and best time window: morning, afternoon, evening, or night).
2. **PROACTIVE PLANNING**: As soon as you know their subjects (or if they ask to generate/plan), propose a complete weekly timetable right away with the JSON block! Don't stall.
3. **STRICT LENGTH**: 2 to 3 sentences maximum per message, followed by the timetable JSON block when ready.

OUTPUT FORMAT:
- First, write your warm, 2-3 sentence response with your single scheduling question or plan summary.
- Whenever you have subjects to schedule, append this exact JSON code block at the very end to update their timetable:
\`\`\`json
{
  "action": "UPDATE_TIMETABLE",
  "summary": "Brief explanation of what was added or updated",
  "classes": [
    { "day": "Monday", "start_time": "09:00", "end_time": "11:00", "subject": "Course Name/Code", "venue": "Hall/Room" }
  ],
  "studySessions": [
    { "date": "YYYY-MM-DD", "time": "HH:MM", "duration": 1.5, "title": "Course Drill / Topic", "category": "jamb|waec|study|noun|ican", "notes": "Specific topics & strategy" }
  ]
}
\`\`\``;

async function processBuddyConversation(userText, history, media) {
    const nvidiaKey = getNvidiaKey();
    const claudeKey = getAnthropicKey();
    const geminiKey = getGeminiKey();
    const openAiKey = getOpenAiKey();

    const todayStr = getTodayStr();
    const mondayStr = getMondayOfWeek(new Date());

    const contextPayload = {
        today: todayStr,
        week_start: mondayStr,
        existing_classes: storedClasses,
        existing_study_sessions: calendarEvents.slice(-10),
        uploaded_media: media ? { name: media.name, type: media.type, hasText: !!media.textContent } : null
    };

    // Build multimodal messages payload for NVIDIA Llama 3.2 Vision
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

    // 0. NVIDIA NIM Live AI (Verified Working High-Performance LLM with Vision via Proxy & Direct)
    if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
        const systemContent = BUDDY_SYSTEM_PROMPT + `\nCurrent user context: ${JSON.stringify(contextPayload)}`;
        const chatPayload = {
            model: 'meta/llama-3.2-11b-vision-instruct',
            messages: [
                { role: 'system', content: systemContent },
                ...messagesPayload
            ],
            temperature: 0.7,
            max_tokens: 1500
        };

        // Determine available proxy endpoints (same-origin /api/chat or local server http://localhost:3000/api/chat)
        const endpoints = [];
        if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
            endpoints.push('/api/chat');
        }
        endpoints.push('http://localhost:3000/api/chat');
        endpoints.push('https://integrate.api.nvidia.com/v1/chat/completions');

        for (const endpoint of endpoints) {
            try {
                console.log(`Connecting to live NVIDIA AI via ${endpoint}...`);
                const isDirectNvidia = endpoint.includes('integrate.api.nvidia.com');
                const headers = { 'Content-Type': 'application/json' };
                if (isDirectNvidia) {
                    headers['Authorization'] = `Bearer ${nvidiaKey}`;
                }

                const res = await fetchWithTimeout(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(chatPayload)
                }, 20000); // 20s realistic LLM generation timeout

                if (res.ok) {
                    const data = await res.json();
                    const replyText = data.choices?.[0]?.message?.content;
                    if (replyText) {
                        console.log('Live AI Response successfully received from:', endpoint);
                        const badge = document.getElementById('chat-live-ai-badge');
                        if (badge) {
                            badge.textContent = 'AI Active';
                            badge.style.background = 'rgba(16, 185, 129, 0.2)';
                            badge.style.color = '#34D399';
                        }
                        return parseAiReplyAndApply(replyText);
                    }
                } else {
                    console.warn(`NVIDIA endpoint ${endpoint} returned status:`, res.status);
                }
            } catch (e) {
                console.warn(`NVIDIA connection via ${endpoint} failed or timed out:`, e.message || e);
            }
        }
    }


    // 1. Anthropic Claude (Only if key starts with sk-ant-)
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
                    system: BUDDY_SYSTEM_PROMPT + `\nCurrent user context: ${JSON.stringify(contextPayload)}`,
                    messages: messagesPayload
                })
            }, 5000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.content?.[0]?.text;
                if (replyText) return parseAiReplyAndApply(replyText);
            }
        } catch (e) {
            console.warn('Claude API error, falling back:', e.message || e);
        }
    }

    // 2. Google Gemini (Native browser CORS support)
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
                    systemInstruction: { parts: [{ text: BUDDY_SYSTEM_PROMPT + `\nCurrent user context: ${JSON.stringify(contextPayload)}` }] }
                })
            }, 15000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) {
                    const badge = document.getElementById('chat-live-ai-badge');
                    if (badge) {
                        badge.textContent = 'AI Active';
                        badge.style.background = 'rgba(16, 185, 129, 0.2)';
                        badge.style.color = '#34D399';
                    }
                    return parseAiReplyAndApply(replyText);
                }
            }
        } catch (e) {
            console.warn('Gemini API error, falling back:', e.message || e);
        }
    }

    // 3. OpenAI GPT (Only if key starts with sk-)
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
                        { role: 'system', content: BUDDY_SYSTEM_PROMPT + `\nCurrent user context: ${JSON.stringify(contextPayload)}` },
                        ...messagesPayload
                    ]
                })
            }, 5000);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.choices?.[0]?.message?.content;
                if (replyText) return parseAiReplyAndApply(replyText);
            }
        } catch (e) {
            console.warn('OpenAI API error, falling back:', e.message || e);
        }
    }

    // 4. Sabi High-Fidelity Conversational Assistant (Instant, intelligent, zero lag)
    return generateOfflineBuddyReply(userText, media, history);
}

function parseAiReplyAndApply(replyText) {
    let cleanMessage = replyText;
    let actionData = null;

    // Extract JSON block if present
    const jsonMatch = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            actionData = JSON.parse(jsonMatch[1]);
            cleanMessage = replyText.replace(jsonMatch[0], '').trim();
        } catch (e) {}
    }

    if (actionData && actionData.action === 'UPDATE_TIMETABLE') {
        if (Array.isArray(actionData.classes) && actionData.classes.length > 0) {
            actionData.classes.forEach(cls => {
                storedClasses.push({
                    id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    subject: cls.subject,
                    day: cls.day,
                    start_time: cls.start_time || '09:00',
                    end_time: cls.end_time || '11:00',
                    venue: cls.venue || 'Lecture Hall',
                    isRecurring: true
                });
            });
            saveStoredClasses(storedClasses);
        }

        if (Array.isArray(actionData.studySessions) && actionData.studySessions.length > 0) {
            actionData.studySessions.forEach(sess => {
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
            });
            saveEvents();
        }

        showToast('Timetable updated by Sabi!');
    }

    return {
        role: 'bot',
        content: cleanMessage,
        actionCard: actionData ? { details: actionData.summary || 'Added classes & study sessions to your timetable.' } : null,
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

    // 3. Conversational: Study Advice & Tips
    if (/\b(study tips|study advice|how to study|how should i study|best way to study|study techniques|feynman)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `The top technique is active recall: practice retrieval with short 25-minute sprints instead of passive re-reading. Which course would you like to schedule focused practice sessions for?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 4. Conversational: Active Recall Explained
    if (/\b(active recall|what is active recall)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `Active recall means testing your memory with questions rather than passively looking over notes. Which course would you like to schedule active recall sessions for?`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 5. Conversational: Stress & Overwhelm Empathy
    if (/\b(stressed|stress|overwhelmed|anxious|can't focus|burnout|exhausted|so much to read|panicking)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `Take a deep breath—you don't have to tackle everything at once! Tell me your hardest subject, and we'll schedule short, bite-sized study blocks around your rest hours.`,
            actionCard: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    // 6. Conversational: Greetings & Capabilities
    if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening|howdy|sup)\b/i.test(lower) || /\b(who are you|what can you do|how does this work|help me|capabilities)\b/i.test(lower)) {
        return {
            role: 'bot',
            content: `Hey! I'm your Sabi Copilot, here to build a weekly timetable that fits your life. What degree, courses, or exam are you focusing on this semester?`,
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
        let prefix = '';
        if (examCategory !== 'study') {
            prefix = `Awesome! Prepping for **${examCategory.toUpperCase()}** is a huge goal. `;
        } else if (text.length > 2) {
            prefix = `Got it! "${escapeHtml(text)}" noted. `;
        }
        return {
            role: 'bot',
            content: `${prefix}To make your study plan realistic and effective:\n\n**Which 1–3 subjects or courses feel the heaviest or toughest right now?** (e.g. *Computer Science and Math*, or course codes like *CSC 201, MTH 101*)`,
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

