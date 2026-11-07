// 成长折线是时间叙事。山脊的高度用于造型，不代表能力分数。
(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const ui = {
    zh: { study: "学习", work: "作品", now: "现在", previous: "上一阶段", next: "下一阶段", scroll: "向下滚动", chart: "成长轨迹" },
    en: { study: "Learning", work: "Work", now: "Now", previous: "Previous milestone", next: "Next milestone", scroll: "Scroll to explore", chart: "Growth journey" },
  };
  let controller;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (value) => value * value * (3 - 2 * value);
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const text = (value, language) => typeof value === "string" ? value : value?.[language] ?? value?.zh ?? "";
  const number = (value) => value.toFixed(2);

  // 单调三次插值使节点之间的山丘连续圆润，避免折角和过冲。
  function makeCurve(points) {
    const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
    const tangents = points.map((point, index) => {
      if (index === 0) return slopes[0];
      if (index === points.length - 1) return slopes.at(-1);
      const before = slopes[index - 1], after = slopes[index];
      return before * after <= 0 ? 0 : 2 * before * after / (before + after);
    });
    return points.slice(1).map((point, index) => {
      const start = points[index];
      const third = (point.x - start.x) / 3;
      return { start, c1: { x: start.x + third, y: start.y + tangents[index] * third }, c2: { x: point.x - third, y: point.y - tangents[index + 1] * third }, end: point };
    });
  }

  function curvePath(segments) {
    const start = segments[0].start;
    return `M${number(start.x)} ${number(start.y)} ` + segments.map((segment) => `C${number(segment.c1.x)} ${number(segment.c1.y)} ${number(segment.c2.x)} ${number(segment.c2.y)} ${number(segment.end.x)} ${number(segment.end.y)}`).join(" ");
  }

  function curvePoint(segment, amount) {
    const inverse = 1 - amount;
    const coordinate = (axis) => inverse ** 3 * segment.start[axis] + 3 * inverse ** 2 * amount * segment.c1[axis] + 3 * inverse * amount ** 2 * segment.c2[axis] + amount ** 3 * segment.end[axis];
    return { x: coordinate("x"), y: coordinate("y") };
  }

  function hillArea(upper, lower) {
    const end = lower.at(-1).end;
    const returning = [...lower].reverse().map((segment) => `C${number(segment.c2.x)} ${number(segment.c2.y)} ${number(segment.c1.x)} ${number(segment.c1.y)} ${number(segment.start.x)} ${number(segment.start.y)}`).join(" ");
    return `${curvePath(upper)} L${number(end.x)} ${number(end.y)} ${returning} Z`;
  }

  function makeModel(items, settings = {}) {
    const elevations = settings.elevations || [];
    const points = items.map((item, index) => {
      const fallback = .12 + .78 * index / Math.max(1, items.length - 1) + Math.sin(index * 1.9) * .055;
      return { x: 100 + index * 250, y: 690 - clamp(elevations[index] ?? fallback, .04, .96) * 100 };
    });
    const last = points.at(-1);
    const historyShare = clamp(Number(settings.historyShare) || 1 / 3, .2, .5);
    const width = last.x / historyShare;
    const remaining = width - last.x - 80;
    const hills = [[.09, 18], [.21, 4], [.4, 215], [.52, 140], [.72, 370], [.86, 445], [.95, 540], [1, 540]];
    const future = [last, ...hills.map(([position, rise]) => ({ x: last.x + remaining * position, y: Math.max(42, last.y - rise) }))];
    future.push({ x: width + 1200, y: future.at(-1).y });
    const ridge = [...points, ...future.slice(1)];
    const segments = makeCurve(ridge);
    const lowerPoints = ridge.map((point, index) => {
      if (index === 0) return { ...point };
      const position = (point.x - points[0].x) / (width - points[0].x);
      const base = points[0].y + 9 * Math.sin(position * Math.PI * 2) - 20 * Math.sin(position * Math.PI) + 8 * Math.sin(position * Math.PI * 5);
      return { x: point.x, y: Math.max(point.y + 8, base) };
    });
    const lower = makeCurve(lowerPoints);
    const outline = curvePath(segments);
    return { points, future, segments, width, outline, lowerOutline: curvePath(lower), area: hillArea(segments, lower) };
  }

  function words(item, language) {
    return `<span class="${item.kind === "work" ? "growth-work" : "growth-study"}">${escape(text(item.label, language))}</span>${item.works.length ? `<span class="growth-work">${item.works.map((work) => escape(text(work, language))).join(" / ")}</span>` : ""}`;
  }

  function render(items, language, heading, settings = {}) {
    const labels = ui[language];
    const model = makeModel(items, settings);
    return `<div class="growth-stage" style="--growth-distance:${Number(settings.scrollDistance) || 1800}px">
      ${heading}
      <div class="growth-chart" role="group" aria-label="${labels.chart}">
        <svg class="growth-svg" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="growth-soft-slope" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="690"><stop offset="0" stop-color="#bab3de"/><stop offset=".26" stop-color="#8c85bd"/><stop offset=".58" stop-color="#484773"/><stop offset=".82" stop-color="#1c1c39"/><stop offset=".9" stop-color="#080820"/><stop offset="1" stop-color="#080820"/></linearGradient>
            <filter id="growth-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
          </defs>
          <g class="growth-grid"></g>
          <g class="growth-world">
            <path class="mountain-main" d="${model.area}"/>
            <path class="mountain-base" d="${model.lowerOutline}"/>
            <path class="growth-ridge" d="${curvePath(model.segments.slice(0, items.length - 1))}"/>
            <path class="growth-future" d="${curvePath(model.segments.slice(items.length - 1))}"/>
            <path class="growth-now-line" d="${curvePath(model.segments.slice(items.length - 2, items.length - 1))}"/>
          </g>
          <g class="growth-leaders"></g>
          <g class="growth-vertices">${items.map((item, index) => `<g class="growth-vertex" data-vertex="${index}" data-kind="${item.kind || "study"}"><circle class="vertex-halo" r="10" filter="url(#growth-glow)"/><circle class="vertex-ring" r="7"/><circle class="vertex-core" r="3.3"/></g>`).join("")}</g>
          <g class="growth-head" aria-hidden="true"><circle class="head-halo" r="15" filter="url(#growth-glow)"/><circle class="head-ring" r="8"/><circle class="head-core" r="4.5"/></g>
        </svg>
        <ol class="growth-list" aria-hidden="true">${items.map((item, index) => `<li class="growth-item" data-milestone="${index}"><span class="growth-date">${escape(item.date)}</span><span class="growth-label">${words(item, language)}</span></li>`).join("")}</ol>
        <span class="growth-now-label">${labels.now}</span>
      </div>
      <footer class="growth-footer">
        <div class="growth-meta"><div class="growth-legend"><span class="legend-study">${labels.study}</span><span class="legend-work">${labels.work}</span></div><span class="growth-scroll">${labels.scroll}<span aria-hidden="true"> ↓</span></span></div>
        <div class="growth-controls" role="group" aria-label="${labels.chart}"><button class="growth-previous" type="button" aria-label="${labels.previous}">←</button><div class="growth-readout"><span class="growth-readout-date"></span><p class="growth-readout-label"></p></div><button class="growth-next" type="button" aria-label="${labels.next}">→</button></div>
        <p class="growth-announcement sr-only" aria-live="polite"></p>
      </footer>
    </div>`;
  }

  function mount(root, items, language, settings = {}) {
    const preserved = controller?.progress ?? 1;
    controller?.dispose();
    const section = root.querySelector("#growth");
    const stage = section.querySelector(".growth-stage");
    const chart = stage.querySelector(".growth-chart");
    const svg = stage.querySelector(".growth-svg");
    const world = svg.querySelector(".growth-world");
    const head = svg.querySelector(".growth-head");
    const leaders = svg.querySelector(".growth-leaders");
    const labels = [...stage.querySelectorAll(".growth-item")];
    const vertices = [...svg.querySelectorAll(".growth-vertex")];
    const now = stage.querySelector(".growth-now-label");
    const readoutDate = stage.querySelector(".growth-readout-date");
    const readoutLabel = stage.querySelector(".growth-readout-label");
    const previous = stage.querySelector(".growth-previous");
    const next = stage.querySelector(".growth-next");
    const model = makeModel(items, settings);
    section.style.setProperty("--growth-distance", `${Number(settings.scrollDistance) || 1800}px`);
    let manualProgress = preserved;
    let lastIndex = -1;
    let lastSize = "";
    let progress = 0;

    function update() {
      if (root.hidden || section.hidden) return;
      const width = chart.clientWidth;
      const height = chart.clientHeight;
      if (width < 1 || height < 1) return;
      const distance = Math.max(0, section.offsetHeight - stage.offsetHeight);
      progress = reducedMotion.matches || distance < 1 ? manualProgress : clamp((root.scrollTop - section.offsetTop) / distance);
      const travel = clamp(progress / .72) * (items.length - 1);
      const index = Math.min(items.length - 1, Math.round(travel));
      const low = Math.floor(travel);
      const fraction = travel - low;
      const moving = low >= items.length - 1 ? model.points.at(-1) : curvePoint(model.segments[low], fraction);
      const overview = smooth(clamp((progress - .72) / .28));
      const focusScale = width < 600 ? .72 : Math.min(1.05, width / 1000);
      const overviewScale = (width - 32) / model.width;
      const sx = focusScale + (overviewScale - focusScale) * overview;
      const sy = height / 820;
      const focusX = Math.min(32 - model.points[0].x * focusScale, width * .5 - moving.x * focusScale);
      const tx = focusX * (1 - overview) + 16 * overview;
      const ty = height * .04;
      const project = (point) => ({ x: point.x * sx + tx, y: point.y * sy + ty });
      if (lastSize !== `${width}:${height}`) {
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.querySelector(".growth-grid").innerHTML = [.3, .55, .8].map((level) => `<path d="M0 ${height * level}H${width}"/>`).join("");
        lastSize = `${width}:${height}`;
      }
      world.setAttribute("transform", `matrix(${sx} 0 0 ${sy} ${tx} ${ty})`);
      section.dataset.now = String(progress >= .72);
      section.dataset.growthProgress = progress.toFixed(4);
      const currentPoint = project(moving);
      head.setAttribute("transform", `translate(${currentPoint.x} ${currentPoint.y})`);
      head.dataset.kind = progress >= .72 || items[index].kind === "work" ? "work" : "study";
      const lineSegments = [];
      labels.forEach((label, itemIndex) => {
        const point = project(model.points[itemIndex]);
        const active = itemIndex === index;
        const age = Math.max(0, index - itemIndex);
        const scale = active ? 1 : Math.max(.58, 1 - age * .055 - overview * .22);
        const visible = point.x > -30 && point.x < width + 30 && (overview < .35 || active || (width >= 600 && itemIndex === 0));
        const labelWidth = Math.min(width < 600 ? 158 : 204, width - 24);
        label.style.width = `${labelWidth}px`;
        label.style.setProperty("--label-scale", scale);
        label.dataset.active = String(active);
        const labelX = clamp(point.x - labelWidth * .25, 8, width - labelWidth - 8);
        const below = itemIndex % 2 === 1 && !(active && overview > .35);
        const labelHeight = label.offsetHeight;
        const labelY = clamp(point.y + (below ? 28 : -labelHeight - 30), 5, height - labelHeight - 5);
        label.style.transform = `translate(${labelX}px, ${labelY}px) scale(${scale})`;
        label.style.opacity = visible ? String(active ? 1 : Math.max(.25, .78 - age * .06)) : "0";
        const vertexScale = active ? 1 : Math.max(.38, 1 - age * .045 - overview * .3);
        vertices[itemIndex].setAttribute("transform", `translate(${point.x} ${point.y}) scale(${vertexScale})`);
        vertices[itemIndex].dataset.active = String(active);
        if (visible) {
          const endX = clamp(point.x, labelX + 10, labelX + labelWidth * scale - 10);
          const endY = below ? labelY - 6 : labelY + labelHeight * scale + 6;
          lineSegments.push(`<path d="M${point.x} ${point.y}L${endX} ${endY}" class="${active ? "leader-active" : ""}"/>`);
        }
      });
      leaders.innerHTML = lineSegments.join("");
      const present = project(model.points.at(-1));
      now.style.transform = `translate(${clamp(present.x + 13, 8, width - 46)}px, ${clamp(present.y - 10, 5, height - 25)}px)`;
      now.style.opacity = progress >= .72 ? "1" : "0";
      if (lastIndex !== index) {
        readoutDate.textContent = items[index].date;
        readoutLabel.innerHTML = words(items[index], language);
        previous.disabled = index === 0;
        next.disabled = index === items.length - 1;
        stage.dataset.activeIndex = String(index);
        lastIndex = index;
      }
    }

    function goTo(index) {
      const nextIndex = clamp(index, 0, items.length - 1);
      const target = nextIndex === items.length - 1 ? 1 : nextIndex / Math.max(1, items.length - 1) * .72;
      manualProgress = target;
      const distance = Math.max(0, section.offsetHeight - stage.offsetHeight);
      if (!reducedMotion.matches && distance > 0) root.scrollTo({ top: section.offsetTop + target * distance, behavior: "smooth" });
      else update();
      stage.querySelector(".growth-announcement").textContent = `${items[nextIndex].date} · ${text(items[nextIndex].label, language)} ${items[nextIndex].works.map((work) => text(work, language)).join(" / ")}`;
    }
    previous.addEventListener("click", () => goTo(lastIndex - 1));
    next.addEventListener("click", () => goTo(lastIndex + 1));
    stage.querySelector(".growth-controls").addEventListener("keydown", (event) => {
      const destinations = { ArrowLeft: lastIndex - 1, ArrowRight: lastIndex + 1, Home: 0, End: items.length - 1 };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      goTo(destinations[event.key]);
    });
    const observer = new ResizeObserver(update);
    observer.observe(chart);
    controller = { update, dispose: () => observer.disconnect(), get progress() { return progress || manualProgress; } };
    update();
  }
  reducedMotion.addEventListener("change", () => controller?.update());
  window.GrowthMountain = { render, mount, update: () => controller?.update() };
})();
