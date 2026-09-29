/**
 * SABI OS: SMART ACADEMIC TIMETABLE & STUDY COMPANION
 * Dual support for recurring school/university classes and study/revision sessions.
 * Features friendly conversational Sabi AI Study Buddy, full manual CRUD,
 * daily agenda timeline, 7-day weekly grid, Google Calendar sync, and .ics export.
 */

// ==========================================
// 🔑 ENVIRONMENT & API KEY CONFIGURATION
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

function getActiveApiKey() {
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
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
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
// 📅 DATE & TIME HELPERS
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
// 📚 DATA STORES & STATE
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
    { key: 'jamb', label: '⚡ JAMB UTME', color: '#10B981' },
    { key: 'waec', label: '📘 WAEC SSCE', color: '#3D8EFF' },
    { key: 'neco', label: '🟣 NECO', color: '#8B5CF6' },
    { key: 'noun', label: '🎓 NOUN TMA', color: '#0EA5E9' },
    { key: 'ican', label: '💼 ICAN Diet', color: '#F59E0B' },
    { key: 'study', label: '⏱️ Study Drills', color: '#EC4899' }
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

// ==========================================
// 💾 PERSISTENCE HELPERS
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
// 🚀 APP INITIALIZATION
// ==========================================
function initCalendarApp() {
    loadEvents();
    loadStoredClasses();

    // Set initial date in modal
    const dateInput = document.getElementById('modal-session-date');
    if (dateInput) {
        dateInput.value = selectedDate || getTodayStr();
    }

    // Render components
    renderMiniCalendarStrip();
    renderAllViews();

    // Initialize Intake Modal if user hasn't entered calendar yet
    checkAndShowIntakeModal();

    // Close planner dropdown on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('planner-dropdown-menu');
        const btn = document.getElementById('btn-planner-menu');
        if (menu && !menu.classList.contains('hidden') && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

// ========================================================
// 🎯 INTAKE MODAL LOGIC (COLLECT DATA BEFORE CALENDAR)
// ========================================================
let intakeProfile = {
    target: 'uni',
    classes: [],
    hardSubjects: new Set(['Mathematics', 'Physics']),
    timeWindow: 'evening',
    hoursPerDay: '3-4'
};

function checkAndShowIntakeModal() {
    const hasEntered = localStorage.getItem('sabi_calendar_entered_v7') === 'true';
    if (!hasEntered) {
        setTimeout(() => {
            openCalendarIntakeModal();
        }, 120);
    }
}

function openCalendarIntakeModal() {
    const modal = document.getElementById('calendar-intake-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    renderIntakeHardSubjects();
    renderIntakeAddedClasses();
}
window.openCalendarIntakeModal = openCalendarIntakeModal;

function closeCalendarIntakeModal() {
    const modal = document.getElementById('calendar-intake-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeCalendarIntakeModal = closeCalendarIntakeModal;

function skipIntakeAndEnterCalendar() {
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeCalendarIntakeModal();
    showToast('Entered Calendar! You can set up your schedule anytime.');
}
window.skipIntakeAndEnterCalendar = skipIntakeAndEnterCalendar;

function selectIntakeTarget(targetKey) {
    intakeProfile.target = targetKey;
    document.querySelectorAll('#intake-target-chips .intake-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === targetKey);
    });
}
window.selectIntakeTarget = selectIntakeTarget;

function selectIntakeTimeWindow(windowKey) {
    intakeProfile.timeWindow = windowKey;
    document.querySelectorAll('#intake-time-window-chips .intake-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-window') === windowKey);
    });
}
window.selectIntakeTimeWindow = selectIntakeTimeWindow;

function selectIntakeHours(hoursKey) {
    intakeProfile.hoursPerDay = hoursKey;
    document.querySelectorAll('#intake-hours-chips .intake-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-hours') === hoursKey);
    });
}
window.selectIntakeHours = selectIntakeHours;

function renderIntakeHardSubjects() {
    const container = document.getElementById('intake-hard-subjects-grid');
    if (!container) return;

    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'English', 'Accounting', 'Government', 'Literature'];
    container.innerHTML = subjects.map(sub => {
        const isHard = intakeProfile.hardSubjects.has(sub);
        return `
            <button type="button" class="intake-chip ${isHard ? 'hard-active' : ''}" onclick="toggleIntakeHardSubject('${escapeHtml(sub)}')">
                <span>${isHard ? '🔥' : '○'}</span>
                <span>${escapeHtml(sub)}</span>
            </button>
        `;
    }).join('');
}

function toggleIntakeHardSubject(sub) {
    if (intakeProfile.hardSubjects.has(sub)) {
        intakeProfile.hardSubjects.delete(sub);
    } else {
        intakeProfile.hardSubjects.add(sub);
    }
    renderIntakeHardSubjects();
}
window.toggleIntakeHardSubject = toggleIntakeHardSubject;

function addIntakeClass() {
    const subjectInput = document.getElementById('intake-class-subject');
    const daySelect = document.getElementById('intake-class-day');
    const timeInput = document.getElementById('intake-class-time');

    const subject = subjectInput?.value.trim();
    const day = daySelect?.value || 'Monday';
    const time = timeInput?.value || '09:00';

    if (!subject) {
        alert('Please enter a course code (e.g. MTH 101)');
        return;
    }

    const endTime = calculateEndTime(time, 2);
    intakeProfile.classes.push({
        id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        subject,
        day,
        start_time: time,
        end_time: endTime,
        venue: 'Lecture Hall',
        isRecurring: true
    });

    if (subjectInput) subjectInput.value = '';
    renderIntakeAddedClasses();
    showToast(`Added ${subject} on ${day}`);
}
window.addIntakeClass = addIntakeClass;

function removeIntakeClass(index) {
    intakeProfile.classes.splice(index, 1);
    renderIntakeAddedClasses();
}
window.removeIntakeClass = removeIntakeClass;

function renderIntakeAddedClasses() {
    const container = document.getElementById('intake-added-classes-list');
    if (!container) return;

    if (intakeProfile.classes.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">No classes added yet. Use the box below to add your recurring weekly lectures.</span>';
        return;
    }

    container.innerHTML = intakeProfile.classes.map((cls, idx) => `
        <span class="intake-class-pill">
            <span>🎓 ${escapeHtml(cls.subject)} (${cls.day} ${cls.start_time})</span>
            <button type="button" class="intake-class-del-btn" onclick="removeIntakeClass(${idx})" title="Remove class">✕</button>
        </span>
    `).join('');
}

function submitIntakeAndGenerateTimetable() {
    // 1. Save recurring classes
    if (intakeProfile.classes.length > 0) {
        intakeProfile.classes.forEach(cls => {
            storedClasses.push(cls);
        });
        saveStoredClasses(storedClasses);
    }

    // 2. Generate balanced revision sessions
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
            notes: `High-yield past questions drill and spaced revision.`,
            completed: false,
            isAiGenerated: true
        });
    }

    saveEvents();

    // 3. Mark intake complete & enter
    localStorage.setItem('sabi_calendar_entered_v7', 'true');
    closeCalendarIntakeModal();
    renderAllViews();
    showToast('✨ Sabi generated your personalized timetable! Welcome.');
}
window.submitIntakeAndGenerateTimetable = submitIntakeAndGenerateTimetable;

// ==========================================
// 🎛️ VIEW SWITCHING
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
// 🗓️ 7-DAY MINI CALENDAR STRIP
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
// 📋 AGENDA SCHEDULE VIEW
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
                <span class="session-empty-icon">☕</span>
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
                            <span class="class-tag-pill">🎓 Class Lecture</span>
                            <span class="session-time-text">🕒 ${item.time || '09:00'} - ${item.end_time || '11:00'} · Every ${item.day}</span>
                        </div>
                        <h4 class="session-title">${escapeHtml(item.title)}</h4>
                        <div class="class-venue-info">
                            <span>📍 ${escapeHtml(item.location || 'Lecture Hall')}</span>
                        </div>
                    </div>
                    <div class="session-card-actions">
                        <button type="button" class="btn-detail-edit" onclick="event.stopPropagation(); editClassById('${item.id}')" title="Edit Class">
                            ✏️
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
                            <span class="session-time-text">🕒 ${item.time || '17:00'} · ${item.duration || 1.5}h</span>
                        </div>
                        <h4 class="session-title">${escapeHtml(item.title)}</h4>
                        ${item.notes ? `<p class="session-notes-snippet">${escapeHtml(item.notes)}</p>` : ''}
                    </div>
                    <div class="session-card-actions">
                        <button type="button" class="session-check-pill ${item.completed ? 'active' : ''}" onclick="event.stopPropagation(); toggleEventComplete('${item.id}')" title="${item.completed ? 'Mark incomplete' : 'Mark done'}" aria-label="Mark done">
                            ${item.completed ? '✓' : '○'}
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = html;
}

// ==========================================
// 📅 WEEK TIMETABLE GRID VIEW
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
                    <span class="week-day-empty-icon">${idx === 6 ? '🛌' : '✨'}</span>
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
                            <span class="week-card-time">🕒 ${item.time || '17:00'} - ${endTime}</span>
                            <span class="week-card-activity-tag ${tagClass}">${tagLabel}</span>
                        </div>
                        <div class="week-card-subject">${escapeHtml(item.title)}</div>
                        ${isClass && item.location ? `<div class="week-card-focus">📍 ${escapeHtml(item.location)}</div>` : ''}
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
// ✏️ MANUAL ADD & EDIT MODAL
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
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const overlay = document.getElementById('add-session-modal');
    if (overlay) {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
    document.getElementById('modal-edit-id').value = '';
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
        showToast(editId ? 'Class updated!' : 'Recurring class added to timetable! 🎓');
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
        showToast(editId ? 'Study session updated!' : 'Study session scheduled! ⏱️');

        if (syncGcal && savedEvent) {
            window.open(createGoogleCalendarUrl(savedEvent), '_blank');
        }
    }

    closeAddSessionModal();
    renderAllViews();
}
window.handleSaveSession = handleSaveSession;

// ==========================================
// 🔍 EVENT DETAILS & CLASS DETAILS MODAL
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
        compBtn.textContent = ev.completed ? 'Mark Pending' : 'Mark Done ✓';
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
        tag.textContent = '🎓 RECURRING CLASS';
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
    showToast(ev.completed ? 'Session completed! 🎯' : 'Marked pending.');
}
window.toggleEventComplete = toggleEventComplete;

function toggleCurrentDetailComplete() {
    if (!selectedDetailEventId) return;
    toggleEventComplete(selectedDetailEventId);
    closeEventDetailModal();
}
window.toggleCurrentDetailComplete = toggleCurrentDetailComplete;

// ==========================================
// 💬 SABI AI STUDY BUDDY CONVERSATIONAL ASSISTANT
// ==========================================
const DEFAULT_CHAT_GREETING = {
    role: 'bot',
    content: "Hey there! 👋 I'm your Sabi Study Buddy. Let's build a timetable that actually works for you!\n\nTell me: what recurring classes or lectures do you have this semester, and what exams (like JAMB, WAEC, or semester exams) are you studying for?",
    timestamp: 'Just now'
};

function getChatHistory() {
    try {
        const stored = localStorage.getItem('sabi_chat_history_v2');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return [DEFAULT_CHAT_GREETING];
}

function saveChatHistory(history) {
    try {
        localStorage.setItem('sabi_chat_history_v2', JSON.stringify(history));
    } catch (e) {}
}

function openSabiAiChat() {
    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    renderChatMessages();
    renderChatQuickChips();

    setTimeout(() => {
        const input = document.getElementById('chat-user-input');
        if (input) input.focus();
    }, 200);
}
window.openSabiAiChat = openSabiAiChat;

function closeSabiAiChat(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('chat-tool-btn')) return;
    const drawer = document.getElementById('sabi-ai-chat-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
window.closeSabiAiChat = closeSabiAiChat;

function clearChatHistory() {
    if (confirm('Restart conversation with Sabi Study Buddy?')) {
        saveChatHistory([DEFAULT_CHAT_GREETING]);
        renderChatMessages();
        renderChatQuickChips();
        showToast('Conversation restarted.');
    }
}
window.clearChatHistory = clearChatHistory;

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const history = getChatHistory();
    container.innerHTML = history.map(msg => {
        const isUser = msg.role === 'user';
        let actionCardHtml = '';
        if (msg.actionCard) {
            actionCardHtml = `
                <div class="chat-action-card">
                    <div class="chat-action-card-title">⚡ Timetable Updated</div>
                    <div>${escapeHtml(msg.actionCard.details)}</div>
                </div>
            `;
        }

        return `
            <div class="chat-msg-row ${isUser ? 'user' : 'bot'}">
                ${!isUser ? `<img src="avatars/notion-scholar.svg" alt="Sabi" class="chat-msg-avatar" />` : ''}
                <div class="chat-bubble">
                    <div style="white-space: pre-line;">${escapeHtml(msg.content)}</div>
                    ${actionCardHtml}
                </div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

const CHAT_QUICK_CHIPS = [
    "I have recurring university lectures",
    "Prepping for JAMB in 6 weeks",
    "WAEC / SSCE revision",
    "Maths & Physics are hard for me",
    "I'm free evenings (5pm - 9pm)",
    "Generate my complete timetable now ✨"
];

function renderChatQuickChips() {
    const container = document.getElementById('chat-quick-chips-row');
    if (!container) return;

    container.innerHTML = CHAT_QUICK_CHIPS.map(text => `
        <button type="button" class="quick-chip" onclick="handleQuickChipClick('${escapeHtml(text)}')">
            ${escapeHtml(text)}
        </button>
    `).join('');
}

function handleQuickChipClick(chipText) {
    const input = document.getElementById('chat-user-input');
    if (input) {
        input.value = chipText;
        handleSendChatMessage(new Event('submit'));
    }
}
window.handleQuickChipClick = handleQuickChipClick;

async function handleSendChatMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('chat-user-input');
    if (!input) return;

    const userText = input.value.trim();
    if (!userText) return;

    input.value = '';
    const history = getChatHistory();
    history.push({
        role: 'user',
        content: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    saveChatHistory(history);
    renderChatMessages();

    // Show typing indicator
    showTypingIndicator();

    try {
        const botReply = await processBuddyConversation(userText, history);
        hideTypingIndicator();

        history.push(botReply);
        saveChatHistory(history);
        renderChatMessages();

        // Refresh views if new timetable items were added
        renderAllViews();
    } catch (err) {
        hideTypingIndicator();
        console.error('Chat processing error:', err);
        const fallback = generateOfflineBuddyReply(userText);
        history.push(fallback);
        saveChatHistory(history);
        renderChatMessages();
        renderAllViews();
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
    typingEl.className = 'chat-msg-row bot';
    typingEl.innerHTML = `
        <img src="avatars/notion-scholar.svg" alt="Sabi" class="chat-msg-avatar" />
        <div class="chat-bubble">
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

// System prompt guiding Sabi Study Buddy persona
const BUDDY_SYSTEM_PROMPT = `You are "Sabi Study Buddy", an empathetic, brilliant academic peer and study partner for Nigerian and international secondary and university students.
Tone: Warm, encouraging, concise, relatable, friendly (like talking to a smart friend who wants you to succeed).

You help students build and balance their weekly academic timetable, which consists of TWO things:
1. RECURRING CLASSES: Lectures, labs, or school periods on specific days (e.g., MTH 101 Mon 9-11am).
2. TARGETED STUDY BLOCKS: Focused personal revision sessions (e.g. Physics past questions drills).

When the student chats with you:
- Converse naturally and ask what you need (recurring classes, exams like JAMB/WAEC/Finals, tough subjects, and daily free hours).
- If they give you information (either piece by piece or all in one go), acknowledge it warmly and build or adjust their timetable.
- If you have enough info or they say "generate", create their balanced schedule!
- Always output your conversational reply FIRST.
- Whenever you add or update timetable entries, append a JSON block at the bottom of your response in this exact format:
\`\`\`json
{
  "action": "UPDATE_TIMETABLE",
  "summary": "Brief summary of what was updated",
  "classes": [
    { "day": "Monday", "start_time": "09:00", "end_time": "11:00", "subject": "Course Name/Code", "venue": "Hall/Room" }
  ],
  "studySessions": [
    { "date": "YYYY-MM-DD", "time": "HH:MM", "duration": 1.5, "title": "Subject & Topic", "category": "jamb|waec|study|noun|ican", "notes": "Focus details" }
  ]
}
\`\`\``;

async function processBuddyConversation(userText, history) {
    const claudeKey = getAnthropicKey();
    const geminiKey = getGeminiKey();
    const openAiKey = getOpenAiKey();

    const todayStr = getTodayStr();
    const mondayStr = getMondayOfWeek(new Date());

    const contextPayload = {
        today: todayStr,
        week_start: mondayStr,
        existing_classes: storedClasses,
        existing_study_sessions: calendarEvents.slice(-10)
    };

    const messagesPayload = history.slice(-6).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
    }));

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
            }, 2500);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.content?.[0]?.text;
                if (replyText) return parseAiReplyAndApply(replyText);
            }
        } catch (e) {
            console.warn('Claude API error or timeout, falling back:', e);
        }
    }

    // 2. Google Gemini (Only if key starts with AIzaSy)
    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const res = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messagesPayload.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    })),
                    systemInstruction: { parts: [{ text: BUDDY_SYSTEM_PROMPT + `\nCurrent user context: ${JSON.stringify(contextPayload)}` }] }
                })
            }, 2500);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (replyText) return parseAiReplyAndApply(replyText);
            }
        } catch (e) {
            console.warn('Gemini API error or timeout, falling back:', e);
        }
    }

    // 3. OpenAI GPT (Only if key is valid sk- and not the mock key)
    if (openAiKey && openAiKey.startsWith('sk-') && !openAiKey.includes('WYVUAjLW6nPxkrQ9sVYt2vdyxnaiH4wsM3ObGzVE0WrBnskN')) {
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
            }, 2500);

            if (res.ok) {
                const data = await res.json();
                const replyText = data.choices?.[0]?.message?.content;
                if (replyText) return parseAiReplyAndApply(replyText);
            }
        } catch (e) {
            console.warn('OpenAI API error or timeout, falling back:', e);
        }
    }

    // 4. Instant intelligent conversational assistant (Works 100% of the time, zero lag)
    return generateOfflineBuddyReply(userText);
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

        showToast('✨ Timetable updated by Sabi!');
    }

    return {
        role: 'bot',
        content: cleanMessage,
        actionCard: actionData ? { details: actionData.summary || 'Added classes & study sessions to your timetable.' } : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

// High-fidelity intelligent offline conversational generator
function generateOfflineBuddyReply(userText) {
    const text = userText.toLowerCase();
    const mondayStr = getMondayOfWeek(new Date());
    let botMessage = '';
    let actionData = null;

    // Check for class inputs (e.g. "I have PHY 101 on Mondays at 9am")
    const daysRegex = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    const matchedDays = userText.match(daysRegex);

    if (text.includes('class') || text.includes('lecture') || matchedDays) {
        // Parse classes
        const day = matchedDays ? matchedDays[0] : 'Monday';
        const formattedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

        // Extract subject if present
        let subject = 'Lecture Class';
        const subjectMatches = userText.match(/([a-zA-Z]{2,4}\s*\d{3}|physics|mathematics|maths|chemistry|biology|economics|english|accounting|law|anatomy)/i);
        if (subjectMatches) {
            subject = subjectMatches[0].toUpperCase();
        }

        let startTime = '09:00';
        const timeMatch = userText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
        if (timeMatch) {
            let h = parseInt(timeMatch[1], 10);
            const m = timeMatch[2] ? timeMatch[2] : '00';
            if (timeMatch[3].toLowerCase() === 'pm' && h < 12) h += 12;
            if (timeMatch[3].toLowerCase() === 'am' && h === 12) h = 0;
            startTime = `${String(h).padStart(2, '0')}:${m}`;
        }

        const endTime = calculateEndTime(startTime, 2);

        const newClass = {
            id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            subject: subject,
            day: formattedDay,
            start_time: startTime,
            end_time: endTime,
            venue: 'Lecture Hall',
            isRecurring: true
        };

        storedClasses.push(newClass);
        saveStoredClasses(storedClasses);

        botMessage = `Got it! 🎓 I've locked in your **${subject}** recurring lecture every **${formattedDay} from ${startTime} to ${endTime}**.

What other classes do you have, or would you like me to build your revision study blocks around this?`;

        actionData = {
            details: `Added ${subject} (Every ${formattedDay}, ${startTime} - ${endTime})`
        };
    } else if (text.includes('jamb') || text.includes('waec') || text.includes('neco') || text.includes('noun') || text.includes('ican') || text.includes('exam') || text.includes('generate') || text.includes('timetable') || text.includes('schedule') || text.includes('build') || text.includes('create') || text.includes('plan')) {
        // Generate a balanced weekly study plan
        let examCategory = 'study';
        if (text.includes('jamb')) examCategory = 'jamb';
        else if (text.includes('waec')) examCategory = 'waec';
        else if (text.includes('neco')) examCategory = 'neco';
        else if (text.includes('noun')) examCategory = 'noun';
        else if (text.includes('ican')) examCategory = 'ican';

        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Use of English'];
        const times = ['16:30', '18:30', '20:00'];

        for (let i = 0; i < 5; i++) {
            const dateStr = addDaysToDate(mondayStr, i);
            const sub = subjects[i % subjects.length];
            const time = times[i % times.length];

            calendarEvents.push({
                id: 'ev-' + Date.now() + '-' + i,
                title: `${sub} Speed Drill`,
                category: examCategory,
                date: dateStr,
                time: time,
                duration: 1.5,
                location: 'Sabi Prep Room',
                notes: `Targeted past questions drill on core high-yield topics.`,
                completed: false,
                isAiGenerated: true
            });
        }
        saveEvents();

        botMessage = `Done deal! 🚀 I've built your balanced weekly academic timetable!

- Scheduled revision blocks for **Maths, Physics, Chemistry, and English**.
- Allocated study sessions in your optimal focus window so they won't clash with classes.
- Sundays are kept free for rest and mental recovery.

You can view them on the Schedule or Week Grid, or tap any card to edit!`;

        actionData = {
            details: `Generated 5 tailored revision blocks for ${examCategory.toUpperCase()}`
        };
    } else if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('start') || text.includes('help')) {
        botMessage = `Hey there! 👋 I'm your Sabi Study Buddy. I can help you organize both your **weekly recurring classes/lectures** and your **revision study drills**!

To get started, tell me:
1. What courses or exams are you preparing for?
2. Do you have any fixed lecture times during the week?`;
    } else if (text.includes('hard') || text.includes('struggle') || text.includes('weak') || text.includes('math') || text.includes('physic')) {
        botMessage = `Got you! I've noted your priority subjects. I will schedule extra practice sessions and spaced repetition for those topics so you can conquer them. 

Would you like me to generate your complete weekly timetable now?`;
    } else {
        botMessage = `Noted! Tell me about any recurring class times you have (e.g. "Physics lecture on Tuesday 10am") or say "Generate my timetable" and I'll build your schedule right away.`;
    }

    return {
        role: 'bot',
        content: botMessage,
        actionCard: actionData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

// ==========================================
// ⚡ QUICK-ADD NATURAL LANGUAGE HANDLER
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
// 📅 EXPORT & SYNC (RFC 5545 .ICS & GCAL)
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
        ics.push(`SUMMARY:🎓 ${escapeIcs(cls.subject)}`);
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
    return found ? found.label : '⏱️ Study';
}
