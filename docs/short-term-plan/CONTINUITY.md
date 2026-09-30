- **Goal (incl. success criteria)**: Execute a complete redesign of both the calendar menu/navigation and the Chat AI interface using the `/frontend-design` skill — creating a bespoke, high-craft Cyber-Academic Command Deck & Bento Matrix Hub, paired with the Sabi AI Academic Copilot Studio.
- **Constraints/Assumptions**:
  - Full operational backward-compatibility: all functions (`openSabiAiChat`, `openAddSessionModal`, `togglePlannerMenu`, `handleSendChatMessage`, etc.) preserved.
  - Zero generic components or "AI slop" aesthetics. Architectural obsidian glass, electric sapphire gradients, luminous status indicators, and tactical micro-interactions.
  - Strict brevity standard: Maximum 2-3 sentences per AI conversational response, strictly preventing syllabus/topic tutoring and directing 100% of questions toward timetable inputs.
- **Key decisions**:
  - **Calendar Navigation & Menu Redesign**:
    - Replaced the basic top bar with the **Sabi Academic Command Deck** (`.cal-command-deck`), featuring a branded navigation capsule (`[← Sabi OS • Timetable Cockpit]`), an active AI Copilot Beacon with pulsating double-ring energy aura, and a tactile `+ New` pill.
    - Replaced the simple vertical dropdown with an **Architectural Bento Matrix Hub** (`.planner-dropdown-menu` -> `.command-hub-bento-grid`):
      1. Full-width Hero Bento card: `Sabi AI Copilot Studio` with live avatar, sparkle indicator, and 1-tap launcher.
      2. 2-column interactive tiles: `Academic Setup Wizard`, `Auto-Rebalance Engine`, `Recurring Lecture Slot`, `Deep Work Study Block`, `ICS Calendar Export`, and `Vector Print Timetable PDF`.
      3. Clean bottom danger strip for resetting data with confirmation guard.
  - **Chat AI Interface Complete Redesign**:
    - Transformed the slide-up drawer into the **Sabi AI Academic Copilot Studio** (`.copilot-studio-window`), an immersive floating glass cockpit with top ambient aurora glow.
    - Added **Studio Tactical Mode Bar** with 3 distinct operational modes:
      1. `🗓️ Timetable Architect` (weekly study & lecture balancing)
      2. `📷 Outline Vision` (course outline OCR & syllabus intake)
      3. `🎯 Exam Crunch` (JAMB/WAEC/Finals spaced repetition)
    - Added **Copilot Launchpad Hero**: A visually striking greeting card rendered when chat begins, featuring 4 interactive launch tiles (Scan Course Outline, Auto-Balance Week, Exam Crunch, Evening Deep Work).
    - Designed **Holographic Timetable Transmission Cards** (`.studio-transmission-card`) embedded directly in conversation with 1-tap "View on Week Grid" navigation.
    - Engineered **Advanced Multimodal Studio Dock**: Floating capsule preview for uploaded outline photos, in-field camera scan shortcut icon, and active physics on the send button.
- **State**:
  - Done:
    - [calendar.html](file:///c:/Users/dave/.gemini/sabi/calendar.html): Redesigned top navigation to Command Deck and Bento Hub; transformed chat drawer into Copilot Studio with mode switcher, launchpad hero, and multimodal dock.
    - [calendar.css](file:///c:/Users/dave/.gemini/sabi/calendar.css): Implemented all Cyber-Academic glassmorphic styles, Bento grid layout, holographic transmission cards, avatar aura pulse, and ambient aurora effects.
    - [calendar.js](file:///c:/Users/dave/.gemini/sabi/calendar.js): Added `setStudioMode()`, dynamic mode-based quick chips, launchpad hero generator, and `viewGeneratedScheduleInWeekGrid()`.
  - Now: Complete redesign implemented and verified with Node syntax checks and server response validation.
  - Next: User browser inspection and feedback.
- **Open questions**: None.
- **Working set (files/ids/commands)**:
  - [calendar.html](file:///c:/Users/dave/.gemini/sabi/calendar.html)
  - [calendar.css](file:///c:/Users/dave/.gemini/sabi/calendar.css)
  - [calendar.js](file:///c:/Users/dave/.gemini/sabi/calendar.js)
  - [server.js](file:///c:/Users/dave/.gemini/sabi/server.js)
