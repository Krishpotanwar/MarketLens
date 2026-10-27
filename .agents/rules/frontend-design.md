# Frontend Design & Craft Invariants

When writing, designing, refactoring, or reviewing frontend code (React components, HTML templates, CSS styles, tables, cards, dialogs) in MarketLens:

## 1. Apple Human Interface Guidelines (HIG) Aesthetics
- **Clarity & Deference**: Content is the priority. UI frames data cleanly with generous whitespace; never crowd components.
- **System Typography**: Use the SF Pro Display font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif`). Always maintain clear typographic hierarchy with appropriate font weights and line heights.
- **Frosted Glass Materials**: Employ translucent dark glass cards (`rgba(14, 20, 32, 0.65)` with `backdrop-filter: blur(16px)` and subtle `rgba(48, 64, 88, 0.45)` borders) to create depth.
- **Pill Badges & Buttons**: Use rounded pill radiuses (`border-radius: 9999px`) for chips, status pills, and primary CTAs.
- **Micro-Interactions**: Use smooth cubic-bezier transitions (`transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)`) and tactile press states (`transform: scale(0.98)`).

## 2. Mobile-First Responsive Standards
- **Progressive Enhancement**: Author base styles for mobile (< 640px) first, then layer breakpoint enhancements for tablets (768px), desktops (1024px), and workstations (1280px+).
- **Touch Targets**: All interactive elements (buttons, links, select menus, toggle chips) must maintain at least 44×44px hit bounds on touch devices.
- **Zero Horizontal Overflow**: The page body must never trigger horizontal scrollbars. Tables must be wrapped in scrollable `.table-wrapper` elements.
- **Fluid Sizing**: Use `clamp()` for headings and spacing, and dynamic viewport units (`100dvh`) where full height is required.
- **Validation**: After modifying frontend layouts, always verify cross-viewport integrity using `node web/real_user_audit.mjs`.
