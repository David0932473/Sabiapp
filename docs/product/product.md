# Sabi Study Calendar & Planner Product State

## Overview
Sabi's academic calendar and weekly study planner provides Nigerian university and exam candidates (JAMB, WAEC, NECO, NOUN, ICAN) with personalized schedule management, timetable printing, and Google Calendar sync.

## Key Features
- **Tap-Only Onboarding**: Quick 3-step preference setup (tough subjects chips, hours & best focus time, exam dates).
- **Single AI Call Weekly Planner**: Generates personalized weekly study sessions balancing spaced repetition (learn, recall, practice, review) and exam deadlines.
- **Strict Validation & Failure Handling**: Validates time windows (05:30 - 23:30), 2-day subject spacing, no class/fixed session overlaps, and max 3 subjects/day. On retry failure, conflicting sessions are dropped and the valid rest is saved with a friendly message without building a separate rule-based scheduler.
- **Friendly AI Summary & Notes Card**: Positioned above the agenda timeline displaying the weekly strategy and actionable timetable adjustments.
- **Week Tab Timetable Grid**: 7-day canvas (Monday through Sunday) displaying university/secondary lecture classes and study sessions side-by-side using the same synchronized data.
- **Minimalist Mobile-First Interface**: 600px unified layout matching Sabi Library & Dashboard, with an interactive 7-day horizontal pill strip, clean session cards, and zero sensory bloat.
- **Print Optimization (`@media print`)**: Landscape print stylesheet that hides all navigation, sidebars, headers, and buttons, fitting the entire weekly timetable cleanly onto a single physical page without server-side PDF services.
- **Google Calendar 1-Click Sync**: Direct URL links and .ics file export for seamless calendar integration.
