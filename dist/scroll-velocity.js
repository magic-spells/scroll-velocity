(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ScrollVelocity = {}));
})(this, (function (exports) { 'use strict';

	/*
		scroll-velocity (loose + responsive)
		-----------------------------------
		this is a drop-in velocity tracker tuned to feel looser and more responsive like your older manager.
		it keeps the same basic physics: blend-to-target (dampening), then rAF decay (friction * attraction),
		and exposes both a normalized css var and the raw velocity so css can decide how extreme to map things.

		key differences vs your recent "new" version:
		- uses delta-based sampling by default (like the older code) for that immediate, punchy feel
		- new 'hybrid' mode adapts sampling based on event timing for mobile-optimized smoothness
		- normalization is relative to maxVelocity (not a fixed divisor), so [-1..1] matches your configured clamp
		- writes extra css vars: --scroll-velocity-abs, --scroll-velocity-pow, --scroll-velocity-raw
		- respects prefers-reduced-motion

		usage
		-----
		import { ScrollVelocity } from './scroll-velocity-loose.js';
		const sv = new ScrollVelocity({
			target: document.body,   // element that will receive the css vars
			sampleMode: 'delta',     // 'delta' | 'time' | 'hybrid' (hybrid adapts based on timing)
			dampening: 0.35,         // higher = chases peaks faster (snappier), lower = smoother/laggier
			friction: 0.92,          // how much velocity persists per frame (0..1)
			attraction: 0.96,        // gentle pull toward zero each frame (0..1)
			threshold: 0.02,         // stop when |velocity| < threshold
			maxVelocity: 200,        // clamp for raw velocity; normalization uses this value
			writeCSSVariables: true, // set to false if you only want programmatic reads
			respectReducedMotion: true
		});
		sv.start();
		// sv.stop(); sv.getVelocity(); sv.getNormalizedVelocity(); sv.setOptions({ ... })
	*/

	/**
	 * @typedef {Object} ScrollVelocityOptions
	 * @property {HTMLElement} [target=document.body] element to receive css variables
	 * @property {('delta'|'time'|'hybrid')} [sampleMode='delta'] how to sample scroll input; 'delta' mimics the old feel, 'hybrid' adapts based on event timing
	 * @property {number} [dampening=0.35] blend factor toward target; higher chases peaks faster
	 * @property {number} [friction=0.92] multiplicative decay per frame (0..1)
	 * @property {number} [attraction=0.96] multiplicative pull toward zero per frame (0..1)
	 * @property {number} [threshold=0.02] below this absolute velocity, snap to zero
	 * @property {number} [maxVelocity=200] absolute clamp for the raw velocity (used for normalization)
	 * @property {boolean} [writeCSSVariables=true] whether to write css custom properties
	 * @property {boolean} [respectReducedMotion=true] if true, disables velocity when user prefers reduced motion
	 */

	/**
	 * clamp helper: keeps a number within a range
	 * @param {number} value
	 * @param {number} min
	 * @param {number} max
	 * @returns {number}
	 */
	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	/**
	 * scroll-velocity: loose, responsive version
	 * tracks signed scroll velocity and exposes both raw and normalized values.
	 */
	class ScrollVelocity {
		/**
		 * @param {ScrollVelocityOptions} [options] see typedef above
		 */
		constructor(options = {}) {
			// config with loose, responsive defaults
			this.target = options.target || document.body;
			this.sampleMode = options.sampleMode || "delta";
			this.dampening =
				typeof options.dampening === "number" ? options.dampening : 0.35;
			this.friction =
				typeof options.friction === "number" ? options.friction : 0.92;
			this.attraction =
				typeof options.attraction === "number" ? options.attraction : 0.96;
			this.threshold =
				typeof options.threshold === "number" ? options.threshold : 0.02;
			this.maxVelocity =
				typeof options.maxVelocity === "number" ? options.maxVelocity : 200;
			this.writeCSSVariables = options.writeCSSVariables !== false;
			this.respectReducedMotion = options.respectReducedMotion !== false;

			// internal state
			this._isRunning = false;
			this._rafId = 0;
			this._velocity = 0; // raw signed velocity (unit depends on sampling mode)
			this._lastScrollY = 0;
			this._lastTime = 0; // performance.now() timestamp for time sampling
			this._boundOnScroll = this._onScroll.bind(this);
			this._boundOnRaf = this._onRaf.bind(this);
		}

		/**
		 * start tracking and writing css variables
		 */
		start() {
			if (this._isRunning) return;
			this._isRunning = true;
			this._lastScrollY = window.scrollY || window.pageYOffset || 0;
			this._lastTime = performance.now();
			window.addEventListener("scroll", this._boundOnScroll, { passive: true });
			this._rafId = requestAnimationFrame(this._boundOnRaf);
		}

		/** stop tracking */
		stop() {
			if (!this._isRunning) return;
			this._isRunning = false;
			window.removeEventListener("scroll", this._boundOnScroll);
			if (this._rafId) cancelAnimationFrame(this._rafId);
			this._rafId = 0;
			this._velocity = 0;
			this._writeCSS(0);
		}

		/**
		 * update runtime options without reconstructing
		 * @param {Partial<ScrollVelocityOptions>} nextOptions
		 */
		setOptions(nextOptions = {}) {
			if ("target" in nextOptions && nextOptions.target)
				this.target = nextOptions.target;
			if ("sampleMode" in nextOptions)
				this.sampleMode = nextOptions.sampleMode || "delta";
			if ("dampening" in nextOptions && typeof nextOptions.dampening === "number")
				this.dampening = nextOptions.dampening;
			if ("friction" in nextOptions && typeof nextOptions.friction === "number")
				this.friction = nextOptions.friction;
			if (
				"attraction" in nextOptions &&
				typeof nextOptions.attraction === "number"
			)
				this.attraction = nextOptions.attraction;
			if ("threshold" in nextOptions && typeof nextOptions.threshold === "number")
				this.threshold = nextOptions.threshold;
			if (
				"maxVelocity" in nextOptions &&
				typeof nextOptions.maxVelocity === "number"
			)
				this.maxVelocity = nextOptions.maxVelocity;
			if ("writeCSSVariables" in nextOptions)
				this.writeCSSVariables = !!nextOptions.writeCSSVariables;
			if ("respectReducedMotion" in nextOptions)
				this.respectReducedMotion = !!nextOptions.respectReducedMotion;
		}

		/**
		 * get the current raw velocity (signed)
		 * @returns {number}
		 */
		getVelocity() {
			return this._velocity;
		}

		/**
		 * get normalized velocity in [-1, 1], relative to maxVelocity
		 * @returns {number}
		 */
		getNormalizedVelocity() {
			if (this.maxVelocity <= 0) return 0;
			return clamp(this._velocity / this.maxVelocity, -1, 1);
		}

		// internal: scroll handler
		_onScroll() {
			// honor reduced motion preference
			if (
				this.respectReducedMotion &&
				window.matchMedia &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches
			) {
				this._velocity = 0;
				this._writeCSS(0);
				// still schedule rAF so we keep variables fresh
				if (!this._rafId) this._rafId = requestAnimationFrame(this._boundOnRaf);
				return;
			}

			const y = window.scrollY || window.pageYOffset || 0;
			const now = performance.now();
			const deltaY = y - this._lastScrollY;
			const deltaT = now - this._lastTime || 16.7; // ms
			this._lastScrollY = y;
			this._lastTime = now;

			// sampling modes
			let instantaneous;
			if (this.sampleMode === "time") {
				// time-aware: pixels per millisecond (feels consistent across event coalescing)
				instantaneous = deltaT > 0 ? deltaY / deltaT : 0; // px per ms
				// scale up to be comparable with old raw deltas so the numbers feel punchy
				instantaneous *= 12; // tuning factor; adjust to taste
			} else if (this.sampleMode === "hybrid") {
				// hybrid: adaptive sampling based on event timing characteristics
				const cappedDeltaT = Math.max(deltaT, 4); // prevent extreme divisions
				const filteredDeltaY = Math.abs(deltaY) < 0.3 ? 0 : deltaY; // noise filter for mobile settling
				
				if (cappedDeltaT < 10) {
					// rapid events: favor delta with slight time smoothing for responsiveness
					instantaneous = filteredDeltaY * (0.85 + 0.15 * (cappedDeltaT / 10));
				} else if (cappedDeltaT > 25) {
					// slow events: time-based with adaptive scaling to prevent sluggishness
					const adaptiveScale = 6 + Math.log(cappedDeltaT) * 2;
					instantaneous = (filteredDeltaY / cappedDeltaT) * adaptiveScale;
				} else {
					// normal events: smooth blend of both approaches
					const deltaRatio = (25 - cappedDeltaT) / 15; // 1.0→0.0 as time increases
					const deltaComponent = filteredDeltaY * 0.7;
					const timeComponent = (filteredDeltaY / cappedDeltaT) * 8;
					instantaneous = deltaRatio * deltaComponent + (1 - deltaRatio) * timeComponent;
				}
			} else {
				// delta-based: raw pixels since last event (older feel; punchy)
				instantaneous = deltaY; // px
			}

			// blend toward target (looser response uses higher dampening)
			const targetVelocity = this._velocity + instantaneous;
			this._velocity += (targetVelocity - this._velocity) * this.dampening;
			this._velocity = clamp(this._velocity, -this.maxVelocity, this.maxVelocity);

			// make sure rAF loop is running
			if (!this._rafId) this._rafId = requestAnimationFrame(this._boundOnRaf);
		}

		// internal: animation frame decay + css write
		_onRaf() {
			this._rafId = 0;

			// decay step (skip if reduced motion)
			if (
				!(
					this.respectReducedMotion &&
					window.matchMedia &&
					window.matchMedia("(prefers-reduced-motion: reduce)").matches
				)
			) {
				this._velocity *= this.friction;
				this._velocity *= this.attraction;
				if (Math.abs(this._velocity) < this.threshold) this._velocity = 0;
			}

			this._writeCSS(this.getNormalizedVelocity());

			// continue while moving
			if (this._isRunning && Math.abs(this._velocity) > 0) {
				this._rafId = requestAnimationFrame(this._boundOnRaf);
			}
		}

		// internal: write css variables
		_writeCSS(normalized) {
			if (!this.writeCSSVariables || !this.target || !this.target.style) return;
			const abs = Math.abs(normalized);
			// non-linear boost for mid-range perception
			const pow = Math.min(1, Math.pow(abs, 0.7) * 1.35);
			this.target.style.setProperty(
				"--scroll-velocity",
				String(normalized.toFixed(4)),
			);
			this.target.style.setProperty(
				"--scroll-velocity-abs",
				String(abs.toFixed(4)),
			);
			this.target.style.setProperty(
				"--scroll-velocity-pow",
				String(pow.toFixed(4)),
			);
			this.target.style.setProperty(
				"--scroll-velocity-raw",
				String(this._velocity.toFixed(2)),
			);
		}
	}

	exports.ScrollVelocity = ScrollVelocity;

}));
//# sourceMappingURL=scroll-velocity.js.map
