---
name: image-to-code
description: Converts visual mockups, reference designs, screenshots, or background concept images into faithful, responsive, pixel-accurate frontend code matching project conventions and design systems.
---

# Image-to-Code Skill

## When to Apply
Use this skill whenever reference images, screenshots, UI mockups, or conceptual background designs are provided and need to be translated into faithful, high-fidelity frontend code (HTML/CSS, React, Vue, Tailwind, etc.).

## Visual Decomposition Workflow

### 1. Visual Inspection & Layering
1. **Backdrop & Atmosphere:**
   - Identify base background colors, imagery, gradients, and vignette/darkening overlays.
   - For image backdrops, preserve high resolution, use `background-size: cover; background-position: center top; background-attachment: fixed;` or fixed background shells with subtle gradient overlays so text remains strictly legible (WCAG AA/AAA).
2. **Surface & Elevation (Glassmorphism / Cards):**
   - Identify card fills (e.g. `rgba(10, 16, 26, 0.78)` to `rgba(16, 22, 34, 0.85)`).
   - Identify blur filters (`backdrop-filter: blur(12px)` and `-webkit-backdrop-filter: blur(12px)`).
   - Identify borders (e.g. `1px solid rgba(48, 54, 61, 0.6)` or accent highlights `border-top: 2px solid <color>`).
   - Identify border-radii (4px, 6px, 8px, 12px) and shadows (`box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37)`).
3. **Typography & Hierarchy:**
   - Identify heading levels, font weights (400, 500, 600, 700), font families (system sans-serif, Inter, SF Pro, tabular monospaced numbers).
   - Look for accent spans (e.g., green / emerald keywords, neon highlights, live telemetry indicators).
4. **Data Display & Indicators:**
   - Identify metric pills, status badges, price change tags (green for gains, crimson for drops, blue for activity).
   - Identify custom visualization widgets such as 52-week min-max range progress tracks, mini sparks, volume meters.
5. **Interactive Controls:**
   - Identify buttons (`Analyze`, `Trade`, `Refresh`), dropdowns, search inputs with subtle borders and clear focus states.

### 2. Design System Matching
- Extract hex/rgba colors from the visual assets and map them to CSS custom properties (`--bg-...`, `--text-...`, `--accent-...`, `--border-...`).
- Preserve existing responsive breakpoints (`sm`, `md`, `lg`, `xl`).
- Maintain accessibility: high contrast ratios for text over transparent glass backgrounds.

### 3. Step-by-Step Implementation
1. **Asset Preparation:** Copy raw images to `public/` or `src/assets/` and ensure proper static serving.
2. **CSS Foundations:** Add glassmorphism utility classes and theme tokens.
3. **Component Layout:** Construct the flexbox/grid containers following the exact visual layout.
4. **Component Details:** Implement titles, badges, cards, tables, and sliders with exact colors and spacing.
5. **Real-User Verification:** Verify in a headless browser at standard viewports (1280px desktop, 768px tablet, 375px mobile).
