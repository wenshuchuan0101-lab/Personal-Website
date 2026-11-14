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
      const duration = Math.max(900, Number(config.milliseconds) || 2300);
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
        return { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6),
          w: Math.min(width, r.right + 6) - Math.max(0, r.left - 6),
          h: Math.min(height, r.bottom + 6) - Math.max(0, r.top - 6) };
      }).filter((r) => r && r.w > 4 && r.h > 4).sort((a, b) => a.y - b.y || a.x - b.x);
      if (!tasks.length) tasks.push({ x: 0, y: 0, w: width, h: height });
      const colors = config.colors || ["#ffab4d", "#f4eee3", "#b7c9ff"];
      const count = width < 600 ? 6 : 10;
      const start = { x: origin?.x ?? width / 2, y: origin?.y ?? height / 2 };
      const drawCursor = (x, y, color, alpha) => {
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 19); ctx.lineTo(5, 14);
        ctx.lineTo(9, 23); ctx.lineTo(13, 21); ctx.lineTo(9, 12); ctx.lineTo(17, 12); ctx.closePath();
        ctx.fillStyle = color; ctx.strokeStyle = "#071631"; ctx.lineWidth = 1.4;
        ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.fill(); ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
      };
      await new Promise((resolve) => {
        finish = resolve;
        window.addEventListener("resize", settle, { once: true });
        document.addEventListener("keydown", key, true);
        document.addEventListener("visibilitychange", hidden);
        timer = setTimeout(resolve, duration + 900);
        const began = performance.now();
        function paint(now) {
          const t = clamp((now - began) / duration);
          ctx.clearRect(0, 0, width, height);
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
          tasks.forEach((task, i) => {
            const delay = .14 + i / tasks.length * .36;
            const progress = smooth((t - delay) / .31);
            task.progress = progress;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000";
            ctx.fillRect(task.x, task.y, task.w * progress, task.h);
          });
          ctx.globalCompositeOperation = "source-over";
          tasks.forEach((task, i) => {
            if (task.progress <= 0 || task.progress >= 1) return;
            const x = task.x + task.w * task.progress;
            ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = .8;
            ctx.globalAlpha = Math.sin(task.progress * Math.PI) * .7;
            ctx.strokeRect(task.x, task.y, task.w * task.progress, task.h);
            for (const y of [task.y, task.y + task.h]) {
              ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
              ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
            }
          });
          ctx.globalAlpha = 1;
          for (let i = 0; i < count; i++) {
            const task = tasks[i % tasks.length];
            const angle = i / count * Math.PI * 2 + t * 3;
            const spread = smooth(t / .27);
            const orbit = 22 + Math.sin(t * Math.PI) * 22;
            const targetX = task.x + task.w * task.progress;
            const targetY = task.y + task.h * ((i % 3) / 2);
            let x = start.x + (targetX - start.x) * spread + Math.cos(angle) * orbit * (1 - spread);
            let y = start.y + (targetY - start.y) * spread + Math.sin(angle) * orbit * (1 - spread);
            const exit = smooth((t - .82) / .18);
            x += Math.cos(angle) * exit * 70; y -= exit * 55;
            drawCursor(Math.max(4, Math.min(width - 20, x)), Math.max(4, Math.min(height - 25, y)), colors[i % colors.length], 1 - exit);
          }
          canvas.style.opacity = String(1 - smooth((t - .87) / .13));
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
