# Transition design reference

The portfolio transition is an independent implementation of a multi-cursor page-building effect, inspired by [Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors) and the [Swarm site by Joel Califa](https://github.com/califa/swarm-site).

The downloaded extension does not provide a reuse license. None of its source code, cursor assets, DOM snapshotting engine, browser-extension logic or audio system is included in this website.

`swarm-transition.js` constructs the actual live DOM and SVG elements through assigned jobs. The profile sequence types each text field character by character; traces rings, 72 individual dial ticks, orbits, the star and button edges; and demonstrates the real two-way name page turn. It schedules over 140 jobs on desktop, with fewer jobs where mobile layouts hide decorative elements. The growth sequence separately builds grid lines, the time axis, curve sections, mountain shading, date connectors, learning/work markers, labels and controls, then checks all 14 nodes in parallel and leaves the complete mountain overview. No page screenshots or remote animation engine are used.

The restored opening brings the cursor school together briefly at the entry point, then sends each cursor toward its assigned job. The ending regroups the school in the lower-right corner and sweeps it off screen. Curved paths have smooth acceleration and braking. During the build, cursors have explicit jobs and inactive cursors stay off screen. Only arrow cursors are overlaid: no task labels, status text, crosshairs, I-beams, click rings or glyph boxes are drawn.

`settings.js` → `transition` controls `profileMilliseconds` and `growthMilliseconds` (both 7.6 seconds), colors and cursor limits (32 desktop, 22 mobile). Entry and exit are included in those durations. A 10-second watchdog includes initialization and always restores the page, even if fonts are slow. Escape, viewport changes and hiding the tab also finish the animation; reduced-motion preferences skip it. `PortfolioTransition.inspect()` provides task counts, completion and checked milestones for local verification. No extension installation is required.

The opening and finale were visually reviewed against the two user-supplied notes, with the second as the motion reference: https://xhslink.cn/o/3dqrgIQQrra and https://xhslink.cn/o/7viCLcS9qjt. Reference videos and extracted analysis frames are not included in the published website.
