- **Goal (incl. success criteria)**: Implement STAGE 5: Plan generator (one AI call, no chat) and use Poppins font everywhere on the website.
- **Constraints/Assumptions**:
  - Onboarding is ONE tap-only screen with 3 questions:
    1. Which subjects do you find hard? (chips from their subjects, any number)
    2. Realistic study hours on a normal day (1-2 / 3-4 / 5+) and best time (morning / afternoon / evening / night)
    3. Exam dates: "I know them" (date picker per subject, optional), "In about X weeks", or "I don't know yet"
  - Plan ONE week at a time: generate on onboarding completion, auto-regenerate first time opened each Monday, "Regenerate plan" in ⋯ menu, and re-plan remaining days when exam date is entered or changed.
  - One AI call, no chat, returning one JSON output strictly matching system prompt and schema.
  - Strict validation in code: schema, subject names match input, dates in week, no overlap with classes/fixed sessions, times in 05:30-23:30, min 2 sessions per subject with 2+ days apart (unless notes explains reduction), max 3 subjects per day. Retry once with violations if invalid.
  - Poppins font applied everywhere across the website.
- **Key decisions**:
  - Streamlined `#planner-onboarding-modal` to remove text inputs, photo uploads, off-days, goals, and follow-up bubbles, making onboarding a clean, fast tap-only modal.
  - Wired exam date inputs and mode changes to debounce and trigger `generateWeeklyPlan(monday, false, true)` to automatically re-plan remaining days.
  - Added strict minimum 2 sessions per subject check to `validatePlannerOutput()` with automatic fallback explanation for Rule 5 reductions.
  - Replaced Google Font `Outfit` with `Poppins` across all 11 HTML pages and all CSS/JS stylesheets.
- **State**:
  - Done:
    - [calendar.html](file:///c:/Users/dave/.gemini/sabi/calendar.html): Streamlined onboarding modal to ONE tap-only screen with 3 questions.
    - [calendar.js](file:///c:/Users/dave/.gemini/sabi/calendar.js): Strict validation engine with min 2 sessions check, exam date change auto-replan of remaining days, Monday auto-regeneration, and clean one AI call pipeline.
    - Poppins font integrated across [global.css](file:///c:/Users/dave/.gemini/sabi/global.css), [calendar.css](file:///c:/Users/dave/.gemini/sabi/calendar.css), [calendar.html](file:///c:/Users/dave/.gemini/sabi/calendar.html), [index.html](file:///c:/Users/dave/.gemini/sabi/index.html), [library.html](file:///c:/Users/dave/.gemini/sabi/library.html), [pq.html](file:///c:/Users/dave/.gemini/sabi/pq.html), [pq-setup.html](file:///c:/Users/dave/.gemini/sabi/pq-setup.html), [jamb-setup.html](file:///c:/Users/dave/.gemini/sabi/jamb-setup.html), [jamb-setup.css](file:///c:/Users/dave/.gemini/sabi/jamb-setup.css), [ican.html](file:///c:/Users/dave/.gemini/sabi/ican.html), [reader.html](file:///c:/Users/dave/.gemini/sabi/reader.html), [results.html](file:///c:/Users/dave/.gemini/sabi/results.html), [results.css](file:///c:/Users/dave/.gemini/sabi/results.css), [review.html](file:///c:/Users/dave/.gemini/sabi/review.html), [review.css](file:///c:/Users/dave/.gemini/sabi/review.css), [test-room.html](file:///c:/Users/dave/.gemini/sabi/test-room.html), [test-room.css](file:///c:/Users/dave/.gemini/sabi/test-room.css), [pq.js](file:///c:/Users/dave/.gemini/sabi/pq.js).
  - Now: All tests passing, 0 validation collisions, ready to commit and push.
  - Next: User verification in browser.
- **Open questions**: None.
- **Working set (files/ids/commands)**:
  - [calendar.html](file:///c:/Users/dave/.gemini/sabi/calendar.html)
  - [calendar.js](file:///c:/Users/dave/.gemini/sabi/calendar.js)
  - [calendar.css](file:///c:/Users/dave/.gemini/sabi/calendar.css)
  - [global.css](file:///c:/Users/dave/.gemini/sabi/global.css)


