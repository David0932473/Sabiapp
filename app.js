// app.js - Sabi Core Application Logic

// Initialize Telegram WebApp if running in Telegram
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

// JAMB Countdown Logic
function updateJAMBCountdown() {
  // Set the JAMB 2026 Start Date (Adjust if official dates change)
  const examDate = new Date("April 18, 2026 08:00:00").getTime();
  const now = new Date().getTime();

  // Calculate the distance
  const distance = examDate - now;

  // Convert to Days
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));

  const display = document.getElementById('jamb-countdown');

  if (display) {
    const badge = display.closest('.streak-badge') || display.parentElement;
    if (days > 0) {
      display.innerHTML = `<svg style="display:inline-block;vertical-align:-2px;margin-right:5px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${days} DAYS TO JAMB`;
      if (badge) badge.style.display = 'inline-flex';
    } else if (days === 0) {
      display.innerHTML = `<svg style="display:inline-block;vertical-align:-2px;margin-right:5px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>EXAM IS TODAY!`;
      if (badge) {
        badge.style.display = 'inline-flex';
        badge.style.background = 'rgba(239, 68, 68, 0.2)'; // Turns red for urgency
      }
    } else {
      // Remove / hide badge completely if there is no upcoming exam
      if (badge) {
        badge.style.display = 'none';
      }
    }
  }
}

// Run immediately on DOM ready
document.addEventListener('DOMContentLoaded', updateJAMBCountdown);
