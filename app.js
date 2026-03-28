// app.js

// Initialize Telegram
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

// Function to load external HTML files
async function loadPage(pageName) {
  const contentDiv = document.getElementById('content');
  
  try {
    // Show a loading state (optional but good for UX)
    contentDiv.innerHTML = '<p style="color: var(--text3); text-align: center;">Loading...</p>';

    // Fetch the file
    const response = await fetch(`${pageName}.html`);
    
    // Check if the file exists
    if (!response.ok) {
      throw new Error('Page not found');
    }

    // Get the HTML text from the file
    const html = await response.text();
    
    // Inject it into our container
    contentDiv.innerHTML = html;

  } catch (error) {
    console.error("Error loading page:", error);
    contentDiv.innerHTML = `<p style="color: #F87171; text-align: center;">⚠️ Failed to load ${pageName}</p>`;
  }
}

// Load the home page immediately when the app starts
document.addEventListener('DOMContentLoaded', () => {
  loadPage('home');
});
    // ==========================================
    // MAIN SEARCH BAR LOGIC
    // ==========================================
    const searchInput = document.getElementById('mainSearchInput');
    const searchBtn = document.getElementById('mainSearchBtn');

    function executeSearch() {
      // Get the text the user typed
      let query = searchInput.value.trim();
      
      // If they actually typed something...
      if (query !== "" && !query.startsWith("⏳")) {
        
        // VISUAL CONFIRMATION: Change the text in the bar to show it's working!
        searchInput.value = "⏳ Searching: " + query;
        searchBtn.style.background = "#4ADE80"; // Turn button green
        
        // Change it back to normal after 1.5 seconds
        setTimeout(() => {
          searchInput.value = query;
          searchBtn.style.background = "var(--accent)"; // Back to blue
        }, 1500);
        
      } else if (query === "") {
        searchInput.focus();
      }
    }

    // 1. Listen for the blue button click
    if (searchBtn) {
      searchBtn.addEventListener('click', executeSearch);
    }

    // 2. Listen for the "Enter" key
    if (searchInput) {
      searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault(); 
          executeSearch();
        }
      });
    }

function updateJAMBCountdown() {
    // 1. Set the JAMB 2026 Start Date (Adjust if official dates change)
    const examDate = new Date("April 18, 2026 08:00:00").getTime();
    const now = new Date().getTime();
    
    // 2. Calculate the distance
    const distance = examDate - now;
    
    // 3. Convert to Days
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    
    const display = document.getElementById('jamb-countdown');
    
    if (display) {
        if (days > 0) {
            display.innerHTML = `⏳ ${days} Days to JAMB`;
        } else if (days === 0) {
            display.innerHTML = `🔥 EXAM IS TODAY!`;
            display.parentElement.style.background = "rgba(239, 68, 68, 0.2)"; // Turns red for urgency
        } else {
            display.innerHTML = `✅ Exam Period Over`;
        }
    }
}

// Run it immediately on load
document.addEventListener('DOMContentLoaded', updateJAMBCountdown);
