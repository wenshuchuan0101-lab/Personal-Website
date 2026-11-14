# Transition design reference

The portfolio transition is an independent implementation of a multi-cursor page-building effect, inspired by [Swarm Rebuild](https://github.com/DhvanilPatel/swarm-cursors) and the [Swarm site by Joel Califa](https://github.com/califa/swarm-site).

The downloaded extension does not provide a reuse license. None of its source code, cursor assets, DOM snapshotting engine, browser-extension logic or audio system is included in this website.

`swarm-transition.js` independently draws clustered cursor circulation around the central mark, crosshair box dragging with guides and anchor handles, per-character text placement with an I-beam, and a shoaling finale towards the pointer or lower-right corner. It progressively reveals the actual live portfolio rather than a screenshot. `settings.js` → `transition` controls duration (7.6 seconds by default), colors and cursor counts (32 desktop, 22 mobile). Escape, viewport changes and hiding the tab finish the animation immediately; reduced-motion preferences skip it. No extension installation or remote library is needed.

Cursor motion uses persistent velocity, smooth steering and braking, curved currents, neighbor separation/alignment and pointer avoidance. The arrows turn into their direction of travel and settle when drawing or typing. `transition.swimStrength` controls the free-swimming motion (default `1`).

The opening and finale were visually reviewed against the two user-supplied notes, with the second as the motion reference: https://xhslink.cn/o/3dqrgIQQrra and https://xhslink.cn/o/7viCLcS9qjt. Reference videos and extracted analysis frames are not included in the published website.
