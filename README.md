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
  target: document.body,     // element that receives CSS variables
  sampleMode: 'delta',       // 'delta' for punchy feel, 'time' for consistent velocity
  dampening: 0.35,           // higher = snappier response to velocity changes
  friction: 0.92,            // velocity persistence per frame (0-1)
  attraction: 0.96,          // pull toward zero each frame (0-1) 
  threshold: 0.02,           // stop when velocity drops below this
  maxVelocity: 200,          // clamp raw velocity, used for normalization
  writeCSSVariables: true,   // set to false for programmatic-only usage
  respectReducedMotion: true // disable when user prefers reduced motion
});

tracker.start();
```

---

## API

### Constructor Options

All options are optional with sensible defaults:

- `target` *(HTMLElement)* - Element to receive CSS variables (default: `document.body`)
- `sampleMode` *('delta'|'time')* - Sampling method; 'delta' for punchy old-school feel, 'time' for consistent px/ms
- `dampening` *(number)* - Blend factor toward target velocity; higher = snappier (default: 0.35)
- `friction` *(number)* - Velocity decay per frame, 0-1 (default: 0.92)
- `attraction` *(number)* - Pull toward zero per frame, 0-1 (default: 0.96)
- `threshold` *(number)* - Stop threshold for absolute velocity (default: 0.02)
- `maxVelocity` *(number)* - Clamp for raw velocity, used for normalization (default: 200)
- `writeCSSVariables` *(boolean)* - Whether to write CSS custom properties (default: true)
- `respectReducedMotion` *(boolean)* - Disable when user prefers reduced motion (default: true)

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

- **Smart Sampling**: Choose between delta-based sampling (punchy, immediate) or time-based sampling (consistent velocity regardless of scroll event frequency)
- **Physics Simulation**: Applies dampening to chase velocity peaks, then friction and attraction-to-zero for natural decay
- **Performance Optimized**: Uses `requestAnimationFrame` for smooth updates only when velocity is non-zero
- **Accessibility**: Automatically disables velocity when user has `prefers-reduced-motion: reduce` set
- **CSS-Driven Animations**: Exposes multiple velocity representations as CSS variables for GPU-accelerated animations

The physics simulation creates natural-feeling velocity curves that start responsive and decay smoothly to zero.

---

## Integration Example

```javascript
const tracker = new ScrollVelocity({
  maxVelocity: 150,
  dampening: 0.4
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
  dampening: 0.5,
  friction: 0.95
});
```

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