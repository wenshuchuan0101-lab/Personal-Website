// Independent page-transition implementation inspired by the Swarm Rebuild demo.
// No extension code, DOM snapshotter or third-party animation engine is included.
(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
  let busy = false;
  async function run({ prepare, root, origin, background = "#123fce" }) {
    if (busy) return;
    busy = true;
    let canvas, frame, timer, finish;
    const previousInert = root.inert;
    const settle = () => finish?.();
    const key = (event) => { if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); settle(); } };
    const hidden = () => { if (document.hidden) settle(); };
    try {
      if (motion.matches) { prepare(); return; }
      const config = SCENE_SETTINGS.transition || {};
      const duration = Math.max(3500, Number(config.milliseconds) || 7600);
      const width = innerWidth, height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas = document.createElement("canvas");
      canvas.className = "swarm-transition";
      canvas.setAttribute("aria-hidden", "true");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", zIndex: "100", touchAction: "none" });
      const ctx = canvas.getContext("2d");
      if (!ctx) { prepare(); return; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      document.body.append(canvas);
      document.body.dataset.swarmTransition = "running";
      prepare();
      root.inert = true;
      await new Promise(requestAnimationFrame);
      const selectors = ".quick-header,.profile-topline,.profile-name,.profile-education,.mode-console,.profile-bottom,.growth-chart,.growth-footer,.growth-stage > .portfolio-heading";
      const tasks = [...root.querySelectorAll(selectors)].map((node) => {
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return null;
        const letters = [];
        if (node.matches(".profile-topline,.profile-name,.profile-education,.profile-bottom,.portfolio-heading")) {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let text;
          while ((text = walker.nextNode())) {
            for (let offset = 0; offset < text.length;) {
              const size = text.data.codePointAt(offset) > 0xffff ? 2 : 1;
              const range = document.createRange(); range.setStart(text, offset); range.setEnd(text, offset + size);
              const bounds = range.getBoundingClientRect();
              if (bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < height) letters.push({ x: bounds.left - 1, y: bounds.top - 1, w: bounds.width + 2, h: bounds.height + 2 });
              offset += size;
            }
          }
        }
        return { letters, x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6),
          w: Math.min(width, r.right + 6) - Math.max(0, r.left - 6),
          h: Math.min(height, r.bottom + 6) - Math.max(0, r.top - 6) };
      }).filter((r) => r && r.w > 4 && r.h > 4).sort((a, b) => a.y - b.y || a.x - b.x);
      if (!tasks.length) tasks.push({ x: 0, y: 0, w: width, h: height });
      const colors = config.colors || ["#ffab4d", "#f4eee3", "#b7c9ff"];
      const count = Math.max(tasks.length, Math.min(48, Number(width < 600 ? config.mobileCursorCount : config.cursorCount) || (width < 600 ? 22 : 32)));
      const start = { x: Math.max(65, Math.min(width - 65, origin?.x ?? width / 2)), y: Math.max(80, Math.min(height - 80, origin?.y ?? height / 2)) };
      const fish = Array.from({ length: count }, (_, i) => {
        const angle = i * 2.39996;
        return { x: start.x + (i % 2 ? 1 : -1) * (80 + (i * 17 % 75)),
          y: start.y + Math.sin(angle) * 80,
          vx: -Math.sin(angle) * 90, vy: Math.cos(angle) * 90,
          heading: angle + Math.PI / 2, pace: .82 + (i * .173 % .39), trail: [] };
      });
      const pointer = { x: 0, y: 0, active: false };
      canvas.addEventListener("pointermove", (event) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; }, { passive: true });
      canvas.addEventListener("pointerleave", () => { pointer.active = false; });
      const swim = Math.max(.2, Math.min(2, Number(config.swimStrength) || 1));
      const drawCursor = (x, y, color, alpha, scale = 1, type = "arrow", rotation = 0) => {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
        if (type === "arrow") ctx.rotate(rotation);
        if (type !== "arrow") {
          ctx.strokeStyle = color; ctx.lineWidth = 1.6;
          ctx.shadowColor = color; ctx.shadowBlur = 6;
          ctx.beginPath();
          if (type === "crosshair") { ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); }
          else { ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-4, -12); ctx.lineTo(4, -12); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); }
          ctx.stroke(); ctx.restore(); return;
        }
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 19); ctx.lineTo(5, 14);
        ctx.lineTo(9, 23); ctx.lineTo(13, 21); ctx.lineTo(9, 12); ctx.lineTo(17, 12); ctx.closePath();
        ctx.fillStyle = color; ctx.strokeStyle = "#071631"; ctx.lineWidth = 1.4;
        ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
      };
      const drawStar = (x, y, size, alpha) => {
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
        ctx.shadowColor = colors[0]; ctx.shadowBlur = 24;
        ctx.fillStyle = colors[0]; ctx.beginPath();
        ctx.moveTo(0, -size); ctx.quadraticCurveTo(size * .09, -size * .1, size * .7, 0);
        ctx.quadraticCurveTo(size * .09, size * .1, 0, size);
        ctx.quadraticCurveTo(-size * .09, size * .1, -size * .7, 0);
        ctx.quadraticCurveTo(-size * .09, -size * .1, 0, -size); ctx.fill(); ctx.restore();
      };
      await new Promise((resolve) => {
        finish = resolve;
        window.addEventListener("resize", settle, { once: true });
        document.addEventListener("keydown", key, true);
        document.addEventListener("visibilitychange", hidden);
        timer = setTimeout(resolve, duration + 900);
        const began = performance.now();
        let previous = began;
        function paint(now) {
          const dt = Math.min(.034, Math.max(.001, (now - previous) / 1000));
          previous = now;
          const t = clamp((now - began) / duration);
          canvas.dataset.stage = t < .20 ? "arriving" : t < .73 ? "building" : "departing";
          ctx.clearRect(0, 0, width, height);
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
          tasks.forEach((task, i) => {
            task.begin = .21 + i / tasks.length * .29;
            task.drag = smooth((t - task.begin) / .07);
            task.progress = clamp((t - task.begin - .07) / .14);
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000";
            if (task.letters?.length && task.progress < 1) {
              task.letters.slice(0, Math.floor(task.letters.length * task.progress)).forEach((letter) => ctx.fillRect(letter.x, letter.y, letter.w, letter.h));
            } else ctx.fillRect(task.x, task.y, task.w, task.h * smooth(task.progress));
          });
          // The finished page is uncovered before the cursors gather for their exit.
          if (t > .70) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = smooth((t - .70) / .08); ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1;
          }
          ctx.globalCompositeOperation = "source-over";
          tasks.forEach((task, i) => {
            if (t < task.begin || task.progress >= 1) return;
            const w = task.w * task.drag, h = task.h * task.drag;
            ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 1;
            ctx.globalAlpha = .65 * (1 - task.progress);
            ctx.fillStyle = "#b7c9ff12"; ctx.fillRect(task.x, task.y, w, h);
            ctx.strokeRect(task.x, task.y, w, h);
            ctx.setLineDash([3, 5]); ctx.globalAlpha *= .35;
            ctx.beginPath(); ctx.moveTo(0, task.y); ctx.lineTo(width, task.y);
            ctx.moveTo(task.x, 0); ctx.lineTo(task.x, height); ctx.stroke(); ctx.setLineDash([]);
            ctx.globalAlpha = .7 * (1 - task.progress);
            for (const [x, y] of [[task.x, task.y], [task.x + w, task.y], [task.x + w, task.y + h], [task.x, task.y + h]]) {
              ctx.fillStyle = background; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.strokeRect(x - 3, y - 3, 6, 6);
            }
            ctx.font = "11px monospace"; ctx.fillStyle = colors[i % colors.length];
            ctx.fillText(`${Math.round(w)} × ${Math.round(h)}`, Math.min(width - 75, task.x + w + 10), Math.max(14, task.y + h - 8));
          });
          ctx.globalAlpha = 1;
          if (t < .22) drawStar(start.x, start.y, 13 + Math.sin(t * 25) * 2, (1 - smooth((t - .16) / .06)));
          for (let i = 0; i < count; i++) {
            const agent = fish[i];
            const task = tasks[i % tasks.length];
            const seconds = (now - began) / 1000;
            const angle = (i % 2 ? Math.PI : 0) + (i / count) * 1.6 + seconds * agent.pace * 2.0;
            const radius = Math.min(width * .18, 75);
            const pulse = .8 + .22 * Math.sin(seconds * 2.1 + i * 1.7);
            const orbitX = start.x + Math.cos(angle) * radius * pulse;
            const orbitY = start.y + Math.sin(angle) * radius * .73 * pulse;
            let x = orbitX, y = orbitY;
            const spread = smooth((t - .15) / Math.max(.04, task.begin - .15));
            const idle = task.progress >= 1 || t < task.begin;
            let targetX = task.x + task.w * task.drag, targetY = task.y + task.h * task.drag;
            let cursorType = "arrow";
            if (task.drag > 0 && task.drag < 1) cursorType = "crosshair";
            if (task.progress > 0 && task.progress < 1 && task.letters?.length) {
              const letter = task.letters[Math.min(task.letters.length - 1, Math.floor(task.letters.length * task.progress))];
              targetX = letter.x + letter.w; targetY = letter.y + letter.h / 2; cursorType = "text";
            }
            if (i >= tasks.length) {
              // Small teams swim around their working area, each on a separate arc.
              const lane = Math.floor(i / tasks.length);
              targetX = task.x + task.w * (.2 + .6 * task.drag) + Math.cos(angle + lane) * Math.min(task.w * .35, 90 + lane * 10);
              targetY = task.y + task.h * .5 + Math.sin(angle + lane) * Math.min(task.h * .4, 60 + lane * 8);
              cursorType = "arrow";
            }
            if (idle) {
              targetX += Math.cos(angle + .8) * 25 * swim;
              targetY += Math.sin(angle * 1.13) * 19 * swim;
            }
            x += (targetX - x) * spread; y += (targetY - y) * spread;
            const gather = smooth((t - .73 - (i % 4) * .008) / .12);
            const exitX = pointer.active ? Math.max(35, Math.min(width - 35, pointer.x)) : width - Math.min(85, width * .16);
            const exitY = pointer.active ? Math.max(35, Math.min(height - 35, pointer.y)) : height - 85;
            const loop = seconds * 2.8 - i * .30;
            const shoalRadius = Math.min(width * .14, 80) * (.55 + (i % 5) * .11);
            x += (exitX + Math.cos(loop) * shoalRadius - x) * gather;
            y += (exitY + Math.sin(loop) * shoalRadius * .65 - y) * gather;
            // The shoal curls towards the corner; it never collapses into a star.
            const collapse = smooth((t - .965) / .035);
            x += (width + 50 + i * 3 - x) * collapse;
            y += (height + 35 + Math.sin(loop) * 25 - y) * collapse;
            const working = t >= task.begin && task.progress < 1 && gather < .1 && i < tasks.length;
            const free = working ? .12 : 1;
            const dx = x - agent.x, dy = y - agent.y, distance = Math.hypot(dx, dy);
            const speedLimit = (width < 600 ? 780 : 1350) * agent.pace;
            const desiredSpeed = Math.min(speedLimit, distance * (working ? 18 : 5.5 + gather * 6));
            let desiredX = dx / Math.max(1, distance) * desiredSpeed;
            let desiredY = dy / Math.max(1, distance) * desiredSpeed;
            // A lateral current bends each approach; it subsides near a working tip.
            const current = Math.min(120, distance * .7) * Math.sin(seconds * 2.6 + i * 1.8) * free * swim;
            desiredX += -dy / Math.max(1, distance) * current;
            desiredY += dx / Math.max(1, distance) * current;
            let alignX = 0, alignY = 0, neighbors = 0;
            for (let j = 0; j < fish.length; j++) {
              if (j === i) continue;
              const other = fish[j], sx = agent.x - other.x, sy = agent.y - other.y;
              const separation = Math.hypot(sx, sy);
              if (separation < 24 && separation > .01) {
                const repel = (1 - separation / 24) * 180 * free * (1 - collapse) * swim;
                desiredX += sx / separation * repel; desiredY += sy / separation * repel;
              }
              if (separation < 125) { alignX += other.vx; alignY += other.vy; neighbors++; }
            }
            if (neighbors) {
              desiredX += (alignX / neighbors - agent.vx) * .18 * free;
              desiredY += (alignY / neighbors - agent.vy) * .18 * free;
            }
            if (pointer.active && free > .5 && collapse < .1) {
              const px = agent.x - pointer.x, py = agent.y - pointer.y, d = Math.hypot(px, py);
              if (d < 90 && d > .01) { const push = (1 - d / 90) * 270; desiredX += px / d * push; desiredY += py / d * push; }
            }
            // Persistent velocity provides acceleration and braking, never a position snap.
            const response = 1 - Math.exp(-(working ? 18 : 5.8 + gather * 5) * dt);
            agent.vx += (desiredX - agent.vx) * response;
            agent.vy += (desiredY - agent.vy) * response;
            const speed = Math.hypot(agent.vx, agent.vy);
            if (speed > speedLimit) { agent.vx *= speedLimit / speed; agent.vy *= speedLimit / speed; }
            agent.x += agent.vx * dt; agent.y += agent.vy * dt;
            const heading = working ? 0 : Math.atan2(agent.vy, agent.vx) + Math.PI * .66;
            const turn = Math.atan2(Math.sin(heading - agent.heading), Math.cos(heading - agent.heading));
            agent.heading += Math.max(-6 * dt, Math.min(6 * dt, turn * (1 - Math.exp(-8 * dt))));
            agent.trail.push({ x: agent.x, y: agent.y });
            if (agent.trail.length > 7) agent.trail.shift();
            if (!working && speed > 70) {
              ctx.save(); ctx.globalAlpha = .07 * (1 - collapse); ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = .7;
              ctx.beginPath(); agent.trail.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke(); ctx.restore();
            }
            const rotation = agent.heading + Math.sin(seconds * 7 + i) * .055 * swim * free;
            drawCursor(agent.x, agent.y, colors[i % colors.length], (1 - collapse), .65 + (i % 3) * .06, gather > .1 ? "arrow" : cursorType, rotation);
          }
          if (t < 1) frame = requestAnimationFrame(paint); else resolve();
        }
        frame = requestAnimationFrame(paint);
      });
    } finally {
      cancelAnimationFrame(frame); clearTimeout(timer);
      window.removeEventListener("resize", settle);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("visibilitychange", hidden);
      canvas?.remove(); root.inert = previousInert;
      delete document.body.dataset.swarmTransition;
      busy = false;
    }
  }
  window.PortfolioTransition = { run };
})();
