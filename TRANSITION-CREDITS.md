# Transition design reference

The portfolio transition is an independent implementation of a multi-cursor page-building effect, inspired by [Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors) and the [Swarm site by Joel Califa](https://github.com/califa/swarm-site).

The downloaded extension does not provide a reuse license. None of its source code, cursor assets, DOM snapshotting engine, browser-extension logic or audio system is included in this website.

`swarm-transition.js` independently draws cursor arrivals around a four-point star, crosshair box dragging with guides and anchor handles, per-character text placement with an I-beam, and a gathering/star-collapse exit. It progressively reveals the actual live portfolio rather than a screenshot. `settings.js` → `transition` controls duration (6.2 seconds by default) and colors. Escape, viewport changes and hiding the tab finish the animation immediately; reduced-motion preferences skip it. No extension installation or remote library is needed.
