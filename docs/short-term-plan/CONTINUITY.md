# Continuity Ledger

- **Goal (incl. success criteria)**: Position Library second above PQ Engine on dashboard bento grid and app bottom dock, and rename user-facing "vault" references to "library".
- **Constraints/Assumptions**: Pure client-side HTML/CSS/JS architecture; responsive grid layouts.
- **Key decisions**:
  - Reordered dashboard bento cards in `index.html`: Hero widget -> Library (`span-2`, second, above PQ Engine) -> PQ Engine (`span-2`) -> Wiki-Roulette (`span-2`).
  - Updated floating dock navigation across all pages (`index.html`, `pq.html`, `library.html`, `wiki.html`) to: Home -> Library -> PQ Engine -> Wiki.
  - Renamed "Vault" references to "Library" in `index.html`, `library.html`, `pq.html`, `wiki.html`, `ican.html`, and `pq-setup.html`.
- **State**:
  - Done: Reordered layout (Library second above PQ Engine), renamed user-facing "Vault" references to "Library", committed (`00942f5`), and pushed to GitHub `origin/main`.
  - Now: Working tree is clean; GitHub repository is fully up to date.
  - Next: Awaiting user instructions for subsequent features or adjustments.
- **Open questions**: None.
- **Working set (files/ids/commands)**:
  - Dashboard: [index.html](file:///c:/Users/dave/.gemini/sabi/index.html)
  - PQ Engine: [pq.html](file:///c:/Users/dave/.gemini/sabi/pq.html)
  - Library: [library.html](file:///c:/Users/dave/.gemini/sabi/library.html)
  - Wiki: [wiki.html](file:///c:/Users/dave/.gemini/sabi/wiki.html)
  - ICAN Library: [ican.html](file:///c:/Users/dave/.gemini/sabi/ican.html), [pq-setup.html](file:///c:/Users/dave/.gemini/sabi/pq-setup.html)
