---
name: responsive-design
description: "Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior."
---

# Responsive Design

Master modern responsive design techniques to create interfaces that adapt seamlessly across all screen sizes and device contexts.

## When to Use This Skill

- Implementing mobile-first responsive layouts
- Using container queries for component-based responsiveness
- Creating fluid typography and spacing scales with `clamp()`
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for design systems
- Implementing responsive images and media
- Creating adaptive navigation patterns and collapsible drawers
- Building responsive tables and financial data displays

## Best Practices

1. **Mobile-First**: Start with mobile base styles (< 640px), progressively enhance for larger screens
2. **Content Breakpoints**: Set breakpoints based on content needs, not specific device models
3. **Fluid Over Fixed**: Use fluid values (`clamp()`, `rem`, `%`) for typography and spacing
4. **Container Queries**: Use `@container` for component-level adaptability independent of viewport width
5. **Dynamic Viewports**: Use `100dvh` instead of `100vh` to avoid mobile browser navigation bar layout shifts
6. **Touch Targets**: Maintain minimum 44×44px interactive bounding boxes on touch devices
7. **No Horizontal Overflow**: Prevent unwanted page-level horizontal scrolling with `overflow-x: clip` and responsive table wrappers
8. **Performance**: Optimize images, lazy load off-screen content, and isolate heavy repaints

## Breakpoint Progression

```css
/* Base: Mobile (< 640px) */
/* Small tablets / Large phones */
@media (min-width: 640px) { ... }

/* Tablets / Small laptops */
@media (min-width: 768px) { ... }

/* Desktops */
@media (min-width: 1024px) { ... }

/* Large desktops / Workstations */
@media (min-width: 1280px) { ... }

/* Ultra-wide monitors */
@media (min-width: 1536px) { ... }
```

## Fluid Typography Pattern

```css
/* Fluid scale between 375px mobile and 1440px desktop */
h1 {
  font-size: clamp(1.85rem, 4vw + 0.5rem, 2.75rem);
  line-height: 1.15;
}

h2 {
  font-size: clamp(1.25rem, 2.5vw + 0.25rem, 1.75rem);
  line-height: 1.25;
}
```

## Responsive Tables Pattern

```css
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px; /* Ensures readable columns inside scrollable container */
}
```

## Common Traps to Avoid

- **Horizontal Overflow**: Unconstrained element widths causing horizontal scrollbars on mobile
- **Fixed Widths**: Using rigid pixel widths instead of max-width or percentage widths
- **Tiny Buttons**: Links or buttons with under 44px hit areas on touchscreens
- **Clipped Content**: Text truncation without accessible title tooltips
