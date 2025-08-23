# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` - Build all distribution files (ESM, CJS, UMD, minified) using Rollup
- `npm run dev` or `npm run serve` - Start development server with watch mode on port 3002, opens browser automatically
- `npm run lint` - Run ESLint on source files and rollup config  
- `npm run format` - Format code with Prettier

## Architecture

This is a JavaScript library that provides scroll velocity tracking with physics-based animations:

### Core Module Structure
- **src/scroll-velocity.js** - Main ScrollVelocity class that tracks scroll events and applies physics simulation
- **rollup.config.mjs** - Multi-format build configuration (ESM, CJS, UMD, minified UMD)
- **demo/** - Live demonstration with animated examples

### Key Architecture Concepts

**ScrollVelocity Class**: The main export that provides velocity tracking with configurable physics parameters:
- Delta-based or time-based sampling modes for different responsiveness feels
- Physics simulation with dampening, friction, and attraction-to-zero
- CSS variable output (`--scroll-velocity`, `--scroll-velocity-abs`, `--scroll-velocity-pow`, `--scroll-velocity-raw`)
- Respects `prefers-reduced-motion` accessibility preference

**Build System**: Uses Rollup to generate multiple distribution formats:
- ESM build for modern bundlers  
- CJS build for Node.js compatibility
- UMD build for direct browser usage
- Minified UMD for production CDN usage
- Development mode with live server and file copying to demo folder

**Demo Architecture**: Interactive HTML demonstration showcasing different velocity-driven animations (bubbles, rotating sticks, height bars, skewed grids) using CSS custom properties updated by the library.

## Development Notes

- The library is designed to feel "loose and responsive" with delta-based sampling by default
- Physics parameters are tunable for different animation feels
- CSS variables are the primary interface for animations (no direct DOM manipulation)
- Uses requestAnimationFrame for smooth updates, only runs when necessary
- Development server automatically copies built files to demo folder for testing