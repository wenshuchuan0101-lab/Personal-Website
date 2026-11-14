# Transition design reference

The portfolio transition is an independent implementation of a multi-cursor page-building effect, inspired by [Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors) and the [Swarm site by Joel Califa](https://github.com/califa/swarm-site).

The downloaded extension does not provide a reuse license. None of its source code, cursor assets, DOM snapshotting engine, browser-extension logic or audio system is included in this website.

`swarm-transition.js` draws original cursor shapes and progressively reveals the live portfolio. `settings.js` → `transition` controls duration and colors. Escape, viewport changes and hiding the tab finish the animation immediately; reduced-motion preferences skip it. No extension installation or remote library is needed.
