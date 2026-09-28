/**
 * SABI OS v3.0: GOOGLE CALENDAR LANDSCAPE SYSTEM
 * Full Mini-Calendar with Event Counts, No Side-by-Side Months, & Focused Day Agenda
 */

// Academic Milestones (Nigerian Exams & Study Sessions)
const DEFAULT_EVENTS = [
    {
        id: 'ev-drill-today-1',
        title: 'JAMB Physics Mechanics Speed Drill',
        category: 'study',
        date: getFutureDateString(0), // Today (Sept 28, 2026)
        time: '17:30',
        duration: 1.5,
        location: 'Sabi App PQ Room',
        notes: 'Intensive speed drill: 50 questions in 45 minutes on Kinematics, Dynamics & Optics.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-scholar.svg', 'avatars/notion-felix.svg', 'avatars/notion-sadie.svg']
    },
    {
        id: 'ev-drill-today-2',
        title: 'Chemistry Organic Reactions Mastery',
        category: 'study',
        date: getFutureDateString(0), // Today (Sept 28, 2026)
        time: '19:30',
        duration: 1,
        location: 'Sabi Digital Library & Notes',
        notes: 'Hydrocarbons, Alkanols & Reaction Mechanisms revision with Sabi PQ explanations.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-willow.svg', 'avatars/notion-scholar.svg']
    },
    {
        id: 'ev-drill-tomorrow',
        title: 'English Comprehension & Oral Speed Test',
        category: 'study',
        date: getFutureDateString(1), // Tomorrow
        time: '16:00',
        duration: 1,
        location: 'Sabi App PQ Room',
        notes: 'Timed comprehension passages, stress patterns, and vowel sound contrasts.',
        isDefault: true,
        completed: false,
        avatars: ['avatars/notion-alex.svg', 'avatars/notion-felix.svg']
    },
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
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
});

// Load events from LocalStorage
function loadEvents() {
    const stored = localStorage.getItem('sabi_calendar_events_v2');
    if (stored) {
        try {
            calendarEvents = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse calendar events', e);
            calendarEvents = [...DEFAULT_EVENTS];
        }
    } else {
        calendarEvents = [...DEFAULT_EVENTS];
        saveEvents();
    }
}

function saveEvents() {
    localStorage.setItem('sabi_calendar_events_v2', JSON.stringify(calendarEvents));
}

// Master Render Function
function renderAllViews() {
    renderMiniCalendar();
    renderMainMonthGrid();
    renderAgendaTimeline();
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

// --- MINI MONTH NAVIGATOR WITH EVENT COUNTS BESIDE DOTS ---
function renderMiniCalendar() {
    const container = document.getElementById('mini-cal-days');
    if (!container) return;
    
    container.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Day of week for 1st of month: Mon = 0 to Sun = 6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const cell = document.createElement('div');
        cell.className = 'mini-day-cell other-month';
        cell.innerHTML = `<span class="mini-day-num">${dayNum}</span>`;
        container.appendChild(cell);
    }
    
    const todayStr = getFutureDateString(0);
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
        
        // Find matching events for this day
        const dayEvents = calendarEvents.filter(ev => {
            return ev.date === dateStr && activeCategories.has(ev.category);
        });
        
        const isSelected = selectedDate === dateStr;
        const isToday = todayStr === dateStr;
        
        const cell = document.createElement('div');
        cell.className = `mini-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`;
        cell.onclick = () => onSelectDate(dateStr);
        
        // Dot + small number indicating amount of events for that day
        let badgeHtml = '';
        if (dayEvents.length > 0) {
            const dots = dayEvents.slice(0, 2).map(ev => {
                const color = getCategoryColor(ev.category);
                return `<span class="mini-event-dot" style="background-color: ${color}"></span>`;
            }).join('');
            
            badgeHtml = `
                <div class="mini-day-badge">
                    ${dots}
                    <span class="mini-event-count">${dayEvents.length}</span>
                </div>
            `;
        }
        
        cell.innerHTML = `
            <span class="mini-day-num">${day}</span>
            ${badgeHtml}
        `;
        container.appendChild(cell);
    }
    
    // Next month filler days
    const filledCells = startDayOfWeek + totalDays;
    const remaining = (7 - (filledCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
        const cell = document.createElement('div');
        cell.className = 'mini-day-cell other-month';
        cell.innerHTML = `<span class="mini-day-num">${day}</span>`;
        container.appendChild(cell);
    }
}

function onSelectDate(dateStr) {
    selectedDate = dateStr;
    const [y, m] = dateStr.split('-').map(Number);
    currentYear = y;
    currentMonth = m - 1;
    
    renderAllViews();
    
    // Switch to agenda view and scroll to focused day
    if (currentViewMode !== 'agenda') {
        switchViewMode('agenda');
    }
    
    const el = document.getElementById('selected-day-focus-box');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function changeMiniMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderAllViews();
}

function changeMainMonth(offset) {
    changeMiniMonth(offset);
}

function goToToday() {
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

// --- VIEW 2: AGENDA / TIMELINE & FOCUSED DAY SCHEDULE ---
function renderAgendaTimeline() {
    const container = document.getElementById('agenda-timeline-list');
    const focusedContainer = document.getElementById('selected-day-focus-box');
    if (!container) return;
    
    // 1. Render Focused Day Section (Screen 1 & Screen 2)
    if (focusedContainer) {
        renderFocusedDay(focusedContainer);
    }
    
    // 2. Render Upcoming Agenda Timeline (Screen 3)
    let filtered = calendarEvents.filter(ev => {
        const matchesCat = activeCategories.has(ev.category);
        const matchesSearch = !searchQuery || 
            ev.title.toLowerCase().includes(searchQuery) || 
            (ev.notes && ev.notes.toLowerCase().includes(searchQuery));
        return matchesCat && matchesSearch;
    });
    
    // Sort chronologically
    filtered.sort((a, b) => {
        return new Date(`${a.date}T${a.time || '00:00'}:00`) - new Date(`${b.date}T${b.time || '00:00'}:00`);
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-agenda-state">
                <div class="empty-icon">📅</div>
                <h3>No Events Scheduled</h3>
                <p>No study sessions or exams match your current filters. Add a study session or reset category filters.</p>
                <button type="button" class="btn-create-event" onclick="openAddSessionModal()" style="margin: 14px auto 0;">
                    + Schedule Study Session
                </button>
            </div>
        `;
        return;
    }
    
    // Group events by date
    const groups = {};
    filtered.forEach(ev => {
        if (!groups[ev.date]) groups[ev.date] = [];
        groups[ev.date].push(ev);
    });
    
    container.innerHTML = Object.keys(groups).map(dateKey => {
        const dateEvents = groups[dateKey];
        const isSelected = selectedDate === dateKey;
        const dateObj = new Date(dateKey + 'T00:00:00');
        const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        const eventsCardsHtml = dateEvents.map(ev => renderEventCardHtml(ev)).join('');
        
        return `
            <div class="agenda-date-group" id="agenda-group-${dateKey}">
                <div class="agenda-date-badge ${isSelected ? 'active-date' : ''}" onclick="onSelectDate('${dateKey}')">
                    <span class="agenda-date-month">${monthShort}</span>
                    <span class="agenda-date-weekday">${weekdayStr}</span>
                </div>
                
                <div class="agenda-events-col">
                    ${eventsCardsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Render Focused Day (Screen 1 & Screen 2)
function renderFocusedDay(container) {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayHuman = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    // Events for selected day
    const dayEvents = calendarEvents.filter(ev => {
        return ev.date === selectedDate && activeCategories.has(ev.category);
    });
    
    if (dayEvents.length === 0) {
        // Screen 2 empty state
        container.innerHTML = `
            <div class="focus-day-card empty">
                <div class="focus-day-header">
                    <div class="focus-day-title-group">
                        <span class="focus-badge-dot"></span>
                        <h3 class="focus-day-title">Events for ${dayHuman}</h3>
                    </div>
                    <button type="button" class="btn-focus-add" onclick="openAddSessionModal()">+ Add Event</button>
                </div>
                <div class="focus-empty-body">
                    <span class="focus-empty-icon">🗓️</span>
                    <p class="focus-empty-text">No Events for ${dayHuman}</p>
                    <button type="button" class="btn-create-event" onclick="openAddSessionModal()">
                        + Schedule Session for this Day
                    </button>
                </div>
            </div>
        `;
    } else {
        // Screen 1 events state
        const cardsHtml = dayEvents.map(ev => renderEventCardHtml(ev)).join('');
        container.innerHTML = `
            <div class="focus-day-card">
                <div class="focus-day-header">
                    <div class="focus-day-title-group">
                        <span class="focus-badge-dot active"></span>
                        <h3 class="focus-day-title">Events for ${dayHuman}</h3>
                        <span class="focus-count-pill">${dayEvents.length} session${dayEvents.length === 1 ? '' : 's'}</span>
                    </div>
                    <button type="button" class="btn-focus-add" onclick="openAddSessionModal()">+ Add Event</button>
                </div>
                <div class="focus-cards-list">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }
}

// Reusable Event Card HTML (Vertical color bar, tags, Notion avatars, Google Calendar sync)
function renderEventCardHtml(ev) {
    const accentClass = `card-accent-${ev.category}`;
    const tagColorClass = `tag-color-${ev.category}`;
    const gcalUrl = createGoogleCalendarUrl(ev);
    const avatars = ev.avatars || ['avatars/notion-scholar.svg'];
    
    const avatarStackHtml = `
        <div class="agenda-avatar-stack">
            ${avatars.map(av => `<img src="${av}" alt="Scholar" class="avatar-stack-img" />`).join('')}
        </div>
    `;
    
    return `
        <div class="agenda-event-card ${accentClass} ${ev.completed ? 'completed' : ''}" id="agenda-card-${ev.id}">
            <div class="agenda-event-info" onclick="openEventDetailModal('${ev.id}')">
                <span class="agenda-cat-tag ${tagColorClass}">
                    ${getCategoryBadgeText(ev.category)}
                </span>
                <h4 class="agenda-event-title">${escapeHtml(ev.title)}</h4>
                <div class="agenda-event-meta">
                    <span>🕒 ${ev.time || 'All Day'} (${ev.duration || 1}h)</span>
                    <span>📍 ${escapeHtml(ev.location || 'Sabi Prep Room')}</span>
                </div>
                ${avatarStackHtml}
            </div>
            
            <div class="agenda-actions-right">
                <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn-gcal-direct-link" title="Directly sync to Google Calendar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Sync
                </a>
                <button type="button" class="btn-check-toggle ${ev.completed ? 'active' : ''}" onclick="toggleEventComplete('${ev.id}')" title="Mark Done">
                    ${ev.completed ? '✓' : '○'}
                </button>
            </div>
        </div>
    `;
}

// View Switching: Month Mode hides sidebar so months are NOT side-by-side!
function switchViewMode(mode) {
    currentViewMode = mode;
    
    document.querySelectorAll('.view-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.calendar-view-pane').forEach(p => p.classList.add('hidden'));
    
    const activeBtn = document.getElementById(`btn-view-${mode}`);
    const activePane = document.getElementById(`view-${mode}-container`);
    const workspace = document.querySelector('.calendar-workspace');
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) activePane.classList.remove('hidden');
    
    // In Month Mode: hide sidebar so duplicate months are NEVER side-by-side!
    if (workspace) {
        if (mode === 'month') {
            workspace.classList.add('month-mode');
        } else {
            workspace.classList.remove('month-mode');
        }
    }
    
    if (mode === 'agenda') {
        renderAgendaTimeline();
    } else if (mode === 'month') {
        renderMainMonthGrid();
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
        document.body.style.overflow = 'hidden';
    }
}

function closeAddSessionModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
    const overlay = document.getElementById('add-session-modal');
    if (overlay) {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
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
