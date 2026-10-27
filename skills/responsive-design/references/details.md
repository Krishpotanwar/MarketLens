# Responsive Design — Patterns and Worked Examples

## 1. Container Queries

Container queries enable components to respond to their parent container's width, making cards, widgets, and charts truly modular and embeddable in 1-column, 2-column, or sidebar layouts.

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 420px) {
  .card-inner {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
```

## 2. Fluid Layouts & Grid

Use CSS Grid with `repeat(auto-fit, minmax(..., 1fr))` for fluid auto-wrapping card matrices:

```css
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1.25rem;
}
```

## 3. Dynamic Viewport & Safe Area Insets

Account for modern mobile devices with notches and bottom navigation bars:

```css
.modal-bottom-sheet {
  min-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
  padding-top: env(safe-area-inset-top, 1rem);
}
```
