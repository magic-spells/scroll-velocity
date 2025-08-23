# Scroll Velocity Tracker

High-performance scroll velocity tracker with physics-based friction and CSS variable output for velocity-driven animations.

[**Live Demo**](https://magic-spells.github.io/scroll-velocity/demo/)

## Features

- ⚡ **High-performance tracking** using `requestAnimationFrame` (no scroll event performance issues)
- 🎯 **Physics-based simulation** with configurable dampening, friction, and attraction to zero
- 🕵️‍♂️ **Smart sampling modes** - delta-based for punchy feel or time-based for consistent velocity
- 🌊 **Multiple CSS variables** exposed: normalized, absolute, power-curve, and raw velocity values
- 🌐 **Framework agnostic** — works with any frontend framework or vanilla JS
- 📦 **Lightweight & zero dependencies** - Optimized for performance
- 🔧 **Simple API** with start/stop controls and runtime option updates
- ♿ **Accessibility-aware** - respects `prefers-reduced-motion` preference

## Installation

```bash
npm install @magic-spells/scroll-velocity
```

```javascript
// Import the class in your JS entry point
import { ScrollVelocity } from '@magic-spells/scroll-velocity';
```

Or include directly via CDN:

```html
<script src="https://unpkg.com/@magic-spells/scroll-velocity"></script>
```

## Usage

Create and start the velocity tracker:

```javascript
import { ScrollVelocity } from '@magic-spells/scroll-velocity';

const tracker = new ScrollVelocity({
  target: document.body,       // element that receives CSS variables
  sampleMode: 'hybrid',        // 'hybrid' (adaptive), 'delta' (punchy), 'time' (consistent)
  responsiveness: 0.35,        // higher = more responsive to scroll input
  friction: 0.95,              // velocity persistence per frame (0-1)
  attraction: 0.04,            // pull toward zero strength (higher = stronger pull)
  threshold: 0.02,             // stop when velocity drops below this
  maxVelocity: 200,            // clamp raw velocity, used for normalization
  writeCSSVariables: true,     // set to false for programmatic-only usage
  respectReducedMotion: true   // disable when user prefers reduced motion
});

tracker.start();
```

---

## API

### Constructor Options

All options are optional with sensible defaults:

- `target` _(HTMLElement)_ - Element to receive CSS variables (default: `document.body`)
- `sampleMode` _('hybrid'|'delta'|'time')_ - Sampling method; 'hybrid' adapts based on timing (default), 'delta' for punchy feel, 'time' for consistent px/ms
- `responsiveness` _(number)_ - How quickly it responds to scroll input; higher = more responsive (default: 0.35)
- `friction` _(number)_ - Velocity decay per frame, 0-1 (default: 0.92)
- `attraction` _(number)_ - Pull toward zero strength; higher = stronger pull (default: 0.04)
- `threshold` _(number)_ - Stop threshold for absolute velocity (default: 0.02)
- `maxVelocity` _(number)_ - Clamp for raw velocity, used for normalization (default: 200)
- `writeCSSVariables` _(boolean)_ - Whether to write CSS custom properties (default: true)
- `respectReducedMotion` _(boolean)_ - Disable when user prefers reduced motion (default: true)

### Public Methods

- `start()` - Begin tracking scroll velocity
- `stop()` - Stop tracking and reset velocity to zero
- `getVelocity()` - Returns current raw velocity (signed number)
- `getNormalizedVelocity()` - Returns velocity normalized to [-1, 1] range
- `setOptions(options)` - Update configuration without recreating instance

---

## CSS Variables

The tracker exposes these CSS custom properties on the target element:

- `--scroll-velocity` — Normalized velocity between -1 and 1
- `--scroll-velocity-abs` — Absolute value of normalized velocity (0 to 1)
- `--scroll-velocity-pow` — Power-curve transformed absolute velocity for enhanced mid-range perception
- `--scroll-velocity-raw` — Raw velocity value in pixels (clamped by maxVelocity)

Use these properties to drive CSS animations:

```css
.velocity-element {
  transform: translateX(calc(var(--scroll-velocity) * 100px));
  filter: blur(calc(var(--scroll-velocity-abs) * 5px));
  background-color: hsl(0 100% calc(50% + var(--scroll-velocity-pow) * 30%));
}

.skew-on-scroll {
  transform: skewX(calc(var(--scroll-velocity) * 15deg));
}

.scale-with-speed {
  transform: scale(calc(1 + var(--scroll-velocity-abs) * 0.5));
}
```

---

## How It Works

- **Adaptive Hybrid Sampling**: Default 'hybrid' mode adapts based on scroll event timing for mobile-optimized smoothness, with fallback to 'delta' (punchy) or 'time' (consistent) modes
- **Intuitive Physics**: Higher responsiveness = more responsive, higher attraction = stronger pull to zero - no more counterintuitive parameters!  
- **Performance Optimized**: Uses `requestAnimationFrame` for smooth updates only when velocity is non-zero
- **Accessibility**: Automatically disables velocity when user has `prefers-reduced-motion: reduce` set
- **CSS-Driven Animations**: Exposes multiple velocity representations as CSS variables for GPU-accelerated animations

The physics simulation creates natural-feeling velocity curves that start responsive and decay smoothly to zero.

---

## Integration Example

```javascript
const tracker = new ScrollVelocity({
  maxVelocity: 150,
  responsiveness: 0.4
});

tracker.start();

// Read velocity programmatically
function onAnimationFrame() {
  const velocity = tracker.getVelocity();
  const normalized = tracker.getNormalizedVelocity();
  
  console.log('Raw velocity:', velocity);
  console.log('Normalized velocity:', normalized);
  
  requestAnimationFrame(onAnimationFrame);
}
requestAnimationFrame(onAnimationFrame);

// Update settings at runtime
tracker.setOptions({
  responsiveness: 0.5,
  friction: 0.95
});
```

---

## Breaking Changes (v0.2.0)

**🚀 More Intuitive API!** We've made the parameter names much clearer:

### Parameter Changes
- ✅ `dampening` → `responsiveness` (same values, clearer meaning)
- ✅ `attraction` behavior inverted (higher = stronger pull to zero)
- ✅ `sampleMode: 'hybrid'` is now the default (was 'delta')

### Migration Guide
```javascript
// OLD (v0.1.0)
new ScrollVelocity({
  sampleMode: 'delta',    // was default
  dampening: 0.6,         // confusing name
  attraction: 0.2,        // low = strong pull (backwards!)
});

// NEW (v0.2.0) 
new ScrollVelocity({
  sampleMode: 'hybrid',   // new default - adaptive!
  responsiveness: 0.6,    // same value, clearer name
  attraction: 0.8,        // high = strong pull (intuitive!)
});
```

**Backwards Compatibility**: The old `dampening` parameter still works but is deprecated. Update your code to use `responsiveness` instead.

---

## Browser Support

Supports all modern browsers with `requestAnimationFrame` and `matchMedia`:

- Chrome 10+
- Firefox 4+
- Safari 6+
- Edge 12+

---

## License

MIT

---

## Repository & Issues

[https://github.com/magic-spells/scroll-velocity](https://github.com/magic-spells/scroll-velocity)

Report bugs and request features via GitHub issues.
