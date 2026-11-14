# Transition design reference

The portfolio transition is an independent implementation of a multi-cursor page-building effect, inspired by [Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors) and the [Swarm site by Joel Califa](https://github.com/califa/swarm-site).

The downloaded extension does not provide a reuse license. None of its source code, cursor assets, DOM snapshotting engine, browser-extension logic or audio system is included in this website.

`swarm-transition.js` constructs the actual live DOM and SVG elements through assigned jobs. The profile sequence types each text field character by character; traces rings, 72 individual dial ticks, orbits, the star and button edges; and demonstrates the real two-way name page turn. On desktop it schedules 143 jobs, with fewer jobs where mobile layouts hide decorative elements. The growth sequence separately builds grid lines, the time axis, curve sections, mountain shading, date connectors, learning/work markers, labels and controls. It then demonstrates all 14 milestones with the real chart controller and returns to the complete mountain overview. No page screenshots or remote animation engine are used.

Every cursor belongs to a scheduled job. Its curved arrival and departure paths have smooth acceleration and braking; while working, its tip follows the actual text or SVG path. A cursor with no active task stays outside the viewport. There is no central orbit, pointer chasing, waiting swarm or unrelated finale. Crowded task labels are suppressed to keep the work legible.

`settings.js` → `transition` controls `profileMilliseconds` (28 seconds), `growthMilliseconds` (40 seconds), colors and cursor limits (32 desktop, 22 mobile). Escape, viewport changes and hiding the tab finish the animation and restore all temporary styles and controls; reduced-motion preferences skip it. `PortfolioTransition.inspect()` provides the current task counts, completion and demonstrated milestones for local verification. No extension installation is required.

The opening and finale were visually reviewed against the two user-supplied notes, with the second as the motion reference: https://xhslink.cn/o/3dqrgIQQrra and https://xhslink.cn/o/7viCLcS9qjt. Reference videos and extracted analysis frames are not included in the published website.
