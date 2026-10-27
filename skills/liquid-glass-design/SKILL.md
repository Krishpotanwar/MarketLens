---
name: liquid-glass-design
description: iOS Liquid Glass and Apple Frosted Glass UI expert. Use when implementing liquid frosted glass UI, GlassEffectContainer, specular rim lighting, ambient atmospheric refraction, morphing animations, or converting designs to Apple glassmorphism styling.
---

# Liquid Glass Expert for Apple Glassmorphism

You are an expert in Apple's Liquid Glass design system. Help developers implement, migrate, and troubleshoot Liquid Glass UI in Web and SwiftUI.

## Core CSS Glassmorphism Physics (Web & React)

When building liquid glass interfaces in Web/CSS:

### 1. Liquid Surface Tint & Light Dispersion
Never use flat opaque or flat transparent colors. Use subtle directional gradients:
```css
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.10) 0%,
  rgba(255, 255, 255, 0.02) 100%
), rgba(12, 18, 32, 0.52);
```

### 2. High-Diffusion Liquid Frosted Blur
High saturation and deep blur to capture underlying ambient light:
```css
backdrop-filter: blur(28px) saturate(210%);
-webkit-backdrop-filter: blur(28px) saturate(210%);
```

### 3. Specular Rim Highlight (The Glass Edge)
Real glass catches directional light on its top rim. Use dual inset shadows:
```css
box-shadow: 
  0 20px 50px -10px rgba(0, 0, 0, 0.55),
  0 10px 20px -5px rgba(0, 0, 0, 0.35),
  inset 0 1px 1px 0 rgba(255, 255, 255, 0.30),    /* Top specular highlight */
  inset 0 -1px 1px 0 rgba(0, 0, 0, 0.25);          /* Bottom ambient shadow */
```

### 4. Translucent Boundary
Borders must be hairline (1px) translucent white with high contrast against the dark background:
```css
border: 1px solid rgba(255, 255, 255, 0.16);
```

### 5. Ambient Atmospheric Refraction
Liquid glass needs colorful light sources behind it to refract. Use soft radial background gradients (e.g. cyan, violet, amber):
```css
background-image:
  radial-gradient(ellipse at 15% 10%, rgba(14, 165, 233, 0.20), transparent 55%),
  radial-gradient(ellipse at 85% 85%, rgba(245, 158, 11, 0.22), transparent 55%);
```

---

## Quick Reference (SwiftUI)

### Core API

```swift
// Basic glass effect
.glassEffect()
.glassEffect(.regular)
.glassEffect(.clear)         // For media backgrounds
.glassEffect(.identity)      // Disabled state

// With shape
.glassEffect(in: .capsule)
.glassEffect(in: .circle)
.glassEffect(in: .rect(cornerRadius: 16))

// Modifiers
.glassEffect(.regular.tint(.blue))
.glassEffect(.regular.interactive())  // iOS only
.glassEffect(.regular.tint(.blue).interactive())

// Button styles
.buttonStyle(.glass)
.buttonStyle(.glassProminent)
```

### GlassEffectContainer

```swift
GlassEffectContainer {
    HStack {
        Button("A") { }.glassEffect()
        Button("B") { }.glassEffect()
    }
}
```

### Morphing Animations

```swift
@Namespace private var namespace

GlassEffectContainer {
    Button("Toggle") { }
        .glassEffect()
        .glassEffectID("btn", in: namespace)
}
```

## The Five Golden Rules

1. **Navigation & Elevated Layers Only** - Glass for toolbars, FABs, cards, elevated controls.
2. **No Glass on Glass** - Group multiple items in unified containers.
3. **Consistent Variant** - Maintain uniform blur and opacity across adjacent glass cards.
4. **Tint for Meaning Only** - Semantic accents (profit green, alert amber, brand cyan) rather than rainbow gradients.
5. **Accessibility & Contrast** - Ensure WCAG AA text contrast ratio with SF Pro typography over glass surfaces.
