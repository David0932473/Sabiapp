# Preferred Tech Stack & Implementation Rules

When generating code or UI components for Sabi, strictly adhere to the following.

## Core Stack
- **Languages:** HTML5, Vanilla JavaScript (ES6+), Vanilla CSS
- **Fonts:** Poppins (Google Fonts) — use for ALL text elements, no exceptions
- **Icons:** Inline SVGs only (Lucide-style, viewBox 0 0 24 24, stroke-based). NO emoji, NO icon fonts
- **No frameworks:** No React, Vue, Bootstrap, Tailwind unless explicitly requested
- **No CDN icon libraries:** No FontAwesome, no Lucide CDN

## Implementation Guidelines

### Themes
- Default theme: **light** (white background, dark text)
- Dark theme: opt-in via `data-theme="dark"` on `<html>` element
- Theme stored in `localStorage` under key `sabi_theme`
- Default fallback: `localStorage.getItem("sabi_theme") || "light"`

### Typography
- Always import Poppins: `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">`
- Apply globally: `font-family: "Poppins", sans-serif;` on `*` or `body`

### Colors
- Primary blue: `#3D8EFF` (light), `#2563EB` (dark mode)
- Always use CSS variables from `:root` and `[data-theme="light"]`

### Icons
- viewBox: `0 0 24 24`
- fill: `none`
- stroke: `currentColor`
- stroke-width: `2` (2.5 for small icons)
- stroke-linecap/linejoin: `round`
- Size via `width`/`height` attributes (12px–32px range)

## Forbidden Patterns
- NO Unicode emojis anywhere in user-facing UI
- NO jQuery
- NO Bootstrap
- NO inline `style` for font-family overrides — use CSS classes
