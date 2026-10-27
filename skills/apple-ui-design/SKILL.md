---
name: apple-ui-design
description: "Apple-inspired clean, minimal, premium UI design. Use when building modern interfaces requiring exceptional UX, clean aesthetics, or Apple-like polish. Triggers on: clean UI, modern design, Apple style, minimal, premium, user-friendly, UX."
---

# Apple UI Design

Apple-inspired clean, minimal, premium UI design system grounded in Apple's Human Interface Guidelines (HIG).

## When to Use

- Building modern interfaces requiring exceptional UX and visual craft
- Creating clean, minimal aesthetics with clear spatial hierarchy
- Implementing Apple-like polish, frosted glassmorphism, and smooth transitions
- Designing premium trading, financial, and analytical user experiences
- Reviewing UI/UX for typography, contrast, spacing, and interaction quality

## Workflow

### Step 1: Apply Typography System
Use SF Pro Display font stack with strict hierarchical scale (hero, title, body, caption).

### Step 2: Apply Color & Materials Philosophy
Use light/dark mode variables with proper contrast and frosted glass translucency.

### Step 3: Apply Spacing System
Follow the 4/8/16/24/48/96px geometric spacing rhythm.

### Step 4: Verify Checklist
Ensure touch targets (≥44px), contrast (≥4.5:1), and 60fps animations meet standards.

---

## Core Principles

1. **Clarity** - Content is king, UI disappears into the background
2. **Deference** - UI serves content, never competes for user attention
3. **Depth** - Translucent layering and soft shadows establish clear visual hierarchy

## Typography

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;

/* Hierarchy */
--text-hero: 600 clamp(2rem, 4vw, 3rem)/1.15;      /* Bold statements */
--text-title: 600 clamp(1.25rem, 2.5vw, 1.75rem)/1.25; /* Section headers */
--text-body: 400 0.95rem/1.55;                      /* Readable content */
--text-caption: 400 0.78rem/1.4;                    /* Secondary info / labels */
```

## Color Philosophy

```css
/* Light mode */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f7;
--text-primary: #1d1d1f;
--text-secondary: #86868b;
--accent: #0071e3;

/* Dark mode */
--bg-ground: #0d1117;
--bg-surface: #161b22;
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--text-faint: #6e7681;
--accent-blue: #388bfd;
--accent-emerald: #10b981;
```

## Spacing System

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 48px;
--space-2xl: 96px;   /* Section gaps */
```

## Key Patterns

### Frosted Glass Cards
```css
.card {
  background: rgba(14, 20, 32, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  border: 1px solid rgba(48, 64, 88, 0.45);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}
```

### Pill Buttons & Badges
```css
.btn-primary {
  background: var(--accent-blue, #388bfd);
  color: white;
  padding: 8px 18px;
  border-radius: 9999px;  /* Pill shape */
  font-weight: 600;
  font-size: 0.82rem;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.btn-primary:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### Subtle Animations
```css
/* Micro-interactions */
transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);

/* Element entrance */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## UX Rules

| Do | Don't |
|---|---|
| Generous whitespace | Cramped layouts |
| One primary action per visual group | Multiple competing primary CTAs |
| Progressive disclosure (drilldowns/tabs) | Everything visible at once |
| Subtle, physical feedback | Jarring, linear animations |
| Native system font stack | Heavy or gimmicky decorative fonts |

## Checklist

- [ ] Touch targets ≥ 44px
- [ ] Contrast ratio ≥ 4.5:1
- [ ] Consistent 4/8/16/24/48px spacing rhythm
- [ ] Dark and light mode support
- [ ] Smooth 60fps animations
