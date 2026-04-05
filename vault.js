// ==========================================
// SABI VAULT: SUPABASE MASTER DATABASE (v9.0)
// ==========================================

// 1. Connection Config
const supabaseUrl = 'https://axmnhhazrjluviedaity.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bW5oaGF6cmpsdXZpZWRhaXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDc3MDUsImV4cCI6MjA5MDQ4MzcwNX0.qx1GdrgpEuqx37-ytGD2ZrG-NfpxXAvQIXPpnTwwqUg';

// Use 'sabiDb' to avoid the "already declared" error with the global 'supabase' script
const sabiDb = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Global State
let sabiVault = {}; 
let isVaultLoaded = false; 

// 3. The Fetch Engine (With Auto-Pagination)
async function loadSabiVault() {
  try {
    console.log("Connecting to Sabi Cloud...");
    
    let allData = [];
    let from = 0;
    let to = 999;
    let finished = false;

    // LOOP: Fetch in chunks of 1000 until everything is downloaded
    while (!finished) {
      const { data, error } = await sabiDb
        .from('courseware')
        .select('course_code, course_title, pdf_url')
        .range(from, to);

      if (error) {
        console.error("Fetch Error:", error.message);
        break; 
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        console.log(`Fetched ${allData.length} rows so far...`);
      }

      // If we got fewer than 1000, we've reached the end of the table
      if (!data || data.length < 1000) {
        finished = true;
      } else {
        from += 1000;
        to += 1000;
      }
    }

    // 4. Processing the Data
    allData.forEach((item) => {
      // We only NEED a course_code to make it searchable
      if (item.course_code) {
        const cleanCode = item.course_code.trim().toUpperCase();
        
        // Use the title if it exists, otherwise use a fallback name
        const displayTitle = item.course_title && item.course_title.trim() !== "" 
          ? item.course_title 
          : "Untitled Course Material";

        // Add to our global library object
        sabiVault[cleanCode] = [displayTitle, item.pdf_url];
      }
    });

    isVaultLoaded = true;
    console.log(`✅ LOAD COMPLETE: ${Object.keys(sabiVault).length} items in library.`);

  } catch (err) {
    console.error("Critical System Error:", err);
  }
}

// Start the process
loadSabiVault();
