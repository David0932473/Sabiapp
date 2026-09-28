/**
 * SABI OS v3.0: STUDY & EXAM CALENDAR
 * Full Google Calendar Direct Integration & Study Scheduler
 */

// Default Official Academic Milestones (Nigeria Examinations & University Deadlines)
const DEFAULT_EVENTS = [
    {
        id: 'ev-jamb-2026',
        title: 'JAMB UTME 2026 Examination',
        category: 'jamb',
        date: '2026-04-18',
        time: '08:00',
        duration: 3,
        allDay: false,
        location: 'Designated CBT Exam Center',
        notes: 'National Unified Tertiary Matriculation Examination (UTME). Review 4 registered subjects & past questions.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-waec-2026',
        title: 'WAEC WASSCE 2026 Exam Kickoff',
        category: 'waec',
        date: '2026-05-04',
        time: '09:00',
        duration: 4,
        allDay: false,
        location: 'Official Secondary Examination Hall',
        notes: 'West African Senior School Certificate Examination. Practical papers and core theory commence.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-neco-2026',
        title: 'NECO SSCE Senior Secondary Exam',
        category: 'neco',
        date: '2026-06-15',
        time: '09:00',
        duration: 4,
        allDay: false,
        location: 'Accredited Exam Hall',
        notes: 'National Examinations Council (NECO) Senior School Certificate Examination commences.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-noun-tma',
        title: 'NOUN TMA 1 & 2 Submission Window',
        category: 'noun',
        date: '2026-04-10',
        time: '23:59',
        duration: 1,
        allDay: false,
        location: 'NOUN Student Portal',
        notes: 'Final deadline for Tutor Marked Assignments 1 and 2 across all registered faculty courses.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-ican-2026',
        title: 'ICAN Skills & Professional Diet Exam',
        category: 'ican',
        date: '2026-05-12',
        time: '09:00',
        duration: 4,
        allDay: false,
        location: 'ICAN Examination Center',
        notes: 'Institute of Chartered Accountants of Nigeria diet examinations. Review Corporate Reporting & Tax.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-drill-daily',
        title: 'Sabi 50-Question Speed Drill',
        category: 'study',
        date: getFutureDateString(0), // Today
        time: '18:00',
        duration: 1.5,
        allDay: false,
        location: 'Sabi App PQ Room',
        notes: 'Daily intensive speed test: 50 past questions in 45 minutes with in-depth Sabi explanations.',
        isDefault: true,
        completed: false
    },
    {
        id: 'ev-drill-tomorrow',
        title: 'Calculations & Science Formulas Mastery',
        category: 'study',
        date: getFutureDateString(1), // Tomorrow
        time: '16:00',
        duration: 2,
        allDay: false,
        location: 'Sabi Digital Library & Notes',
        notes: 'Deep revision on high-yield formulas for Physics and Chemistry exam components.',
        isDefault: true,
        completed: false
    }
];

// Helper to get formatted YYYY-MM-DD
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
let activeCategory = 'all';
let selectedDate = null; // null means all dates
let activeView = 'planner'; // 'planner' or 'gcal'

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    renderDayStrip();
    renderEvents();
    updateNextCountdown();
    setupEmbedCalendar();
    
    // Set default date input in modal to today
    const dateInput = document.getElementById('modal-session-date');
    if (dateInput) {
        dateInput.value = getFutureDateString(0);
    }
    
    // Set today text in top bar
    const todayEl = document.getElementById('today-display');
    if (todayEl) {
        const today = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        todayEl.textContent = today.toLocaleDateString('en-US', options);
    }
    
    // Interval for dynamic countdown
    setInterval(updateNextCountdown, 60000);
});

// Load events from LocalStorage
function loadEvents() {
    const stored = localStorage.getItem('sabi_calendar_events');
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

// Save events to LocalStorage
function saveEvents() {
    localStorage.setItem('sabi_calendar_events', JSON.stringify(calendarEvents));
}

// Render dynamic day selector strip (7 days starting from today - 1)
function renderDayStrip() {
    const strip = document.getElementById('day-strip');
    if (!strip) return;
    
    strip.innerHTML = '';
    
    // Add "All Days" pill
    const allChip = document.createElement('div');
    allChip.className = `day-chip ${selectedDate === null ? 'active' : ''}`;
    allChip.onclick = () => selectDay(null);
    allChip.innerHTML = `
        <div class="day-name">ALL</div>
        <div class="day-num">🗓️</div>
        <div class="day-dot"></div>
    `;
    strip.appendChild(allChip);
    
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const dayName = i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();
        
        const hasEvents = calendarEvents.some(ev => ev.date === dateStr);
        const isSelected = selectedDate === dateStr;
        
        const chip = document.createElement('div');
        chip.className = `day-chip ${isSelected ? 'active' : ''} ${hasEvents ? 'has-events' : ''}`;
        chip.onclick = () => selectDay(dateStr);
        chip.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-num">${dayNum}</div>
            <div class="day-dot"></div>
        `;
        strip.appendChild(chip);
    }
}

function selectDay(dateStr) {
    selectedDate = dateStr;
    renderDayStrip();
    renderEvents();
}

// Category filter
function filterCategory(category, el) {
    activeCategory = category;
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.remove('active');
    });
    if (el) {
        el.classList.add('active');
    }
    
    renderEvents();
}

// Switch between Sabi Planner and Live Google Calendar embed
function switchCalendarView(view) {
    activeView = view;
    
    const tabPlanner = document.getElementById('tab-planner');
    const tabGcal = document.getElementById('tab-gcal');
    const plannerSection = document.getElementById('planner-section');
    const gcalSection = document.getElementById('gcal-section');
    
    if (view === 'planner') {
        tabPlanner?.classList.add('active');
        tabGcal?.classList.remove('active');
        plannerSection?.classList.remove('hidden');
        gcalSection?.classList.add('hidden');
    } else {
        tabPlanner?.classList.remove('active');
        tabGcal?.classList.add('active');
        plannerSection?.classList.add('hidden');
        gcalSection?.classList.remove('hidden');
    }
}

// Render event cards list
function renderEvents() {
    const list = document.getElementById('events-list');
    const countBadge = document.getElementById('event-count');
    if (!list) return;
    
    // Filter by category and date
    let filtered = calendarEvents.filter(ev => {
        const matchesCategory = activeCategory === 'all' || ev.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesDate = !selectedDate || ev.date === selectedDate;
        return matchesCategory && matchesDate;
    });
    
    // Sort chronologically
    filtered.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`);
        return dateA - dateB;
    });
    
    if (countBadge) {
        countBadge.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    }
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-events">
                <span class="empty-events-icon">📅</span>
                <h3>No Sessions Scheduled</h3>
                <p>No study sessions or exams found for this selection. Create one and sync it straight to Google Calendar!</p>
                <button type="button" class="btn-gcal-action primary" onclick="openAddSessionModal()">
                    ➕ Schedule Study Session
                </button>
            </div>
        `;
        return;
    }
    
    list.innerHTML = filtered.map(ev => {
        const gcalUrl = createGoogleCalendarUrl(ev);
        const tagClass = `tag-${ev.category.toLowerCase()}`;
        const categoryLabel = getCategoryLabel(ev.category);
        const formattedDate = formatHumanDate(ev.date, ev.time);
        
        return `
            <div class="event-card ${ev.completed ? 'completed' : ''}" id="card-${ev.id}">
                <div class="event-header">
                    <span class="event-tag ${tagClass}">
                        ${categoryLabel}
                    </span>
                    <span class="event-time-badge">
                        🕒 ${formattedDate}
                    </span>
                </div>
                
                <h3 class="event-title">${escapeHtml(ev.title)}</h3>
                ${ev.notes ? `<p class="event-notes">${escapeHtml(ev.notes)}</p>` : ''}
                
                <div class="event-actions">
                    <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn-sync-gcal" title="Directly sync to Google Calendar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Google Calendar
                    </a>
                    
                    <div class="event-btn-group">
                        <button type="button" class="btn-event-icon check ${ev.completed ? 'active' : ''}" onclick="toggleEventComplete('${ev.id}')" title="${ev.completed ? 'Mark pending' : 'Mark completed'}">
                            ${ev.completed ? '✓' : '○'}
                        </button>
                        ${!ev.isDefault ? `
                            <button type="button" class="btn-event-icon delete" onclick="deleteEvent('${ev.id}')" title="Delete event">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Convert category to badge text
function getCategoryLabel(cat) {
    switch (cat.toLowerCase()) {
        case 'jamb': return '⚡ JAMB UTME';
        case 'waec': return '📘 WAEC SSCE';
        case 'neco': return '🟣 NECO';
        case 'noun': return '🎓 NOUN TMA';
        case 'ican': return '💼 ICAN DIET';
        case 'study': return '⏱️ STUDY DRILL';
        default: return '📚 EXAM';
    }
}

// Format human friendly date string
function formatHumanDate(dateStr, timeStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        
        if (!timeStr) return `${month} ${day}`;
        
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${month} ${day}, ${formattedHour}:${m} ${ampm}`;
    } catch (e) {
        return dateStr;
    }
}

// Generate Direct Google Calendar Template URL
function createGoogleCalendarUrl(event) {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
        (event.notes ? `${event.notes}\n\n` : '') +
        `Category: ${event.category.toUpperCase()}\n` +
        `Managed via Sabi Study & Exam Prep (Sabiapp)`
    );
    const location = encodeURIComponent(event.location || 'Sabi Prep Room');
    
    let startStr, endStr;
    if (event.allDay) {
        startStr = event.date.replace(/-/g, '');
        const endD = new Date(event.date);
        endD.setDate(endD.getDate() + 1);
        endStr = endD.toISOString().slice(0, 10).replace(/-/g, '');
    } else {
        const startD = new Date(`${event.date}T${event.time || '09:00'}:00`);
        const durationHours = parseFloat(event.duration || 1);
        const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);
        
        startStr = formatGoogleIso(startD);
        endStr = formatGoogleIso(endD);
    }
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

function formatGoogleIso(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

// Calculate dynamic countdown to nearest upcoming milestone
function updateNextCountdown() {
    const labelEl = document.getElementById('countdown-hero-title');
    const timerEl = document.getElementById('countdown-timer-value');
    if (!labelEl || !timerEl) return;
    
    const now = new Date();
    
    // Find upcoming events sorted by time
    const upcoming = calendarEvents
        .filter(ev => !ev.completed)
        .map(ev => ({
            ...ev,
            dateTime: new Date(`${ev.date}T${ev.time || '09:00'}:00`)
        }))
        .filter(ev => ev.dateTime > now)
        .sort((a, b) => a.dateTime - b.dateTime);
        
    if (upcoming.length === 0) {
        labelEl.textContent = 'All Milestones Completed';
        timerEl.textContent = 'Ready!';
        return;
    }
    
    const next = upcoming[0];
    labelEl.textContent = next.title;
    
    const diffMs = next.dateTime - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 1) {
        timerEl.textContent = `${days} Days Left`;
    } else if (days === 1) {
        timerEl.textContent = `1 Day, ${hours}h`;
    } else if (hours > 0) {
        timerEl.textContent = `${hours}h ${minutes}m`;
    } else {
        timerEl.textContent = `${minutes} mins!`;
    }
}

// Toggle Complete
function toggleEventComplete(id) {
    const ev = calendarEvents.find(e => e.id === id);
    if (!ev) return;
    
    ev.completed = !ev.completed;
    saveEvents();
    renderEvents();
    renderDayStrip();
    updateNextCountdown();
    
    if (ev.completed) {
        showToast('Study Milestone Completed! 🎯');
    }
}

// Delete Custom Event
function deleteEvent(id) {
    if (confirm('Delete this study session from Sabi Calendar?')) {
        calendarEvents = calendarEvents.filter(e => e.id !== id);
        saveEvents();
        renderEvents();
        renderDayStrip();
        updateNextCountdown();
        showToast('Session removed from timetable.');
    }
}

// Modal Handlers
function openAddSessionModal() {
    const overlay = document.getElementById('add-session-modal');
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

// Save New Session
function handleSaveSession(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('modal-session-title');
    const categoryInput = document.getElementById('modal-session-category');
    const dateInput = document.getElementById('modal-session-date');
    const timeInput = document.getElementById('modal-session-time');
    const durationInput = document.getElementById('modal-session-duration');
    const notesInput = document.getElementById('modal-session-notes');
    const syncGcalCheck = document.getElementById('modal-session-gcal-sync');
    
    if (!titleInput.value.trim()) {
        alert('Please enter a session title or subject.');
        titleInput.focus();
        return;
    }
    
    const newEvent = {
        id: 'ev-custom-' + Date.now(),
        title: titleInput.value.trim(),
        category: categoryInput.value || 'study',
        date: dateInput.value || getFutureDateString(0),
        time: timeInput.value || '17:00',
        duration: parseFloat(durationInput.value || 1.5),
        allDay: false,
        location: 'Sabi App / Online Study',
        notes: notesInput.value.trim(),
        isDefault: false,
        completed: false
    };
    
    calendarEvents.push(newEvent);
    saveEvents();
    renderDayStrip();
    renderEvents();
    updateNextCountdown();
    closeAddSessionModal();
    
    showToast('Study session scheduled!');
    
    // Instantly launch Google Calendar if checked
    if (syncGcalCheck && syncGcalCheck.checked) {
        const url = createGoogleCalendarUrl(newEvent);
        window.open(url, '_blank');
    }
    
    // Reset inputs
    titleInput.value = '';
    notesInput.value = '';
}

// Export All Events as standard iCalendar (.ics) file
function exportToIcs() {
    if (calendarEvents.length === 0) {
        alert('No events to export.');
        return;
    }
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sabi App//Study and Exam Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Sabi Study & Exam Schedule',
        'X-WR-TIMEZONE:Africa/Lagos'
    ];
    
    calendarEvents.forEach(ev => {
        const startD = new Date(`${ev.date}T${ev.time || '09:00'}:00`);
        const durationHours = parseFloat(ev.duration || 1);
        const endD = new Date(startD.getTime() + durationHours * 60 * 60 * 1000);
        
        const dtstamp = formatGoogleIso(new Date());
        const dtstart = formatGoogleIso(startD);
        const dtend = formatGoogleIso(endD);
        
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${ev.id}@sabiapp.ng`);
        icsContent.push(`DTSTAMP:${dtstamp}`);
        icsContent.push(`DTSTART:${dtstart}`);
        icsContent.push(`DTEND:${dtend}`);
        icsContent.push(`SUMMARY:${escapeIcs(ev.title)}`);
        if (ev.notes) icsContent.push(`DESCRIPTION:${escapeIcs(ev.notes)}`);
        icsContent.push(`LOCATION:${escapeIcs(ev.location || 'Sabi Study Room')}`);
        icsContent.push('STATUS:CONFIRMED');
        icsContent.push('END:VEVENT');
    });
    
    icsContent.push('END:VCALENDAR');
    
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
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

// Embed Calendar Setup
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
        alert('Please enter your Google Calendar email/ID (e.g., student@gmail.com)');
        return;
    }
    
    localStorage.setItem('sabi_gcal_embed_id', val);
    iframe.src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(val)}&ctz=Africa%2FLagos&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0`;
    showToast('Google Calendar Linked! 📅');
}

// Toast helper
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

// Utility: escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
