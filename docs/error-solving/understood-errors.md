# Understood Errors & Failure Modes

## Error Patterns

### Stretched Circular Day Badges in CSS Grids
- **Cause**: Applying `border-radius: 50%` directly onto a grid cell (`.mini-day-cell`) whose width is dynamic (`1fr` ~ 50px on mobile) while its height is fixed (`38px` or `42px`), resulting in an ellipse/oval shape rather than a circle.
- **Solution**: Set the circular background and border-radius on the inner number element (`.mini-day-num`) with explicit equal dimensions and aspect ratio: `width: 32px; height: 32px; aspect-ratio: 1 / 1; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;`.
- **Prevention**: Never apply circular geometry (`border-radius: 50%`) directly to grid or flex items that don't have fixed 1:1 aspect ratios.

## Known Failure Modes

### Redundant Feature Advertising Badges (e.g. "Google Sync", "AI Powered")
- **What looks correct**: Adding persistent badges like `Google Sync ● Live` or advertising pills in headers and cards to inform the user that a feature is integrated.
- **Why it's wrong**: The user explicitly stated: *"we don't have to tell them that it's there and remember this for other features"*. Excessive badges clutter the UI, feel like promotional clutter, and disrupt clean app aesthetics. The integration should work smoothly in the background without needing marketing labels.
- **Correct approach**: Omit unsolicited "Sync" / integration badges. Keep actions intuitive (e.g., standard action buttons or direct links) without persistent status pills shouting what third-party service is being used.
