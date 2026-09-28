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
      display.innerHTML = `⏳ ${days} Days to JAMB`;
      if (badge) badge.style.display = 'inline-flex';
    } else if (days === 0) {
      display.innerHTML = `🔥 EXAM IS TODAY!`;
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
