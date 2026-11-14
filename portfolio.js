// 快速浏览：内容从 portfolio-data.js 读取，样式与颜色在 portfolio.css。
(() => {
  const root = document.querySelector(".quick-view");
  const content = root.querySelector(".portfolio-content");
  const navigation = root.querySelector(".quick-navigation");
  const header = root.querySelector(".quick-header");
  const wheel = root.querySelector(".work-wheel");
  const wheelOptions = root.querySelector(".work-wheel-options");
  const wheelStar = root.querySelector(".work-wheel-star");
  const wheelScrim = root.querySelector(".work-wheel-scrim");
  const clockRotor = root.querySelector(".clock-rotor");
  const clockHand = root.querySelector(".clock-hand");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const data = PORTFOLIO_CONTENT;
  const projects = data.groups.flatMap((group) => group.projects);
  const labels = {
    zh: { about: "个人介绍", growth: "成长过程", visual: "图片影像", games: "交互 / 游戏", nav: "内容分区", enter: "进入", detail: "作品详情", chooseWork: "选择作品", closeWheel: "收起作品轮盘" },
    en: { about: "About", growth: "Growth", visual: "Images & Film", games: "Interaction & Games", nav: "Sections", enter: "Enter", detail: "Project details", chooseWork: "Choose a work", closeWheel: "Close work selector" },
  };
  let language = "zh";
  let view = "profile";
  let panel = "growth";
  let workGroup = "visual";
  let selectedProjectId = null;
  let confirmedProjectId = null;
  let wheelOpen = false;
  let growthScroll = 0;
  let activeSection = "about";
  let nameFlipped = false;
  let revealObserver;
  let scrollPending = false;
  let wheelFrame = 0;
  let pendingWheelFocus = null;
  let activeWheelButton = null;
  const posterPanelIndices = new Map();
  const expandedPosterWeight = 4;
  let dragging = null;
  let suppressClickUntil = 0;
  const text = (value) => typeof value === "string" ? value : value?.[language] ?? value?.zh ?? "";
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const count = (number) => String(number).padStart(2, "0");
  const clockStep = 360 / Math.max(1, projects.length);
  const cardStep = Number(data.workClock?.cardAngleStep) || 30;
  const cardScaleFalloff = Number(data.workClock?.cardScaleFalloff) || .35;
  const clockLift = Number(data.workClock?.activeLift) || 22;
  const roman = (number) => {
    let result = "";
    for (const [value, symbol] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) {
      while (number >= value) { result += symbol; number -= value; }
    }
    return result;
  };

  function modeConsole() {
    const modeLabels = SCENE_SETTINGS.selection.labels[language];
    const ticks = Array.from({ length: 72 }, (_, index) => {
      const angle = index * Math.PI / 36;
      const inner = index % 6 === 0 ? 221 : 229;
      return `<line x1="${250 + Math.cos(angle) * inner}" y1="${250 + Math.sin(angle) * inner}" x2="${250 + Math.cos(angle) * 237}" y2="${250 + Math.sin(angle) * 237}"/>`;
    }).join("");
    return `<div class="mode-console" role="group" aria-label="${escape(modeLabels.title)}">
      <svg class="console-diagram" viewBox="0 0 500 500" aria-hidden="true">
        <g class="console-ticks">${ticks}</g>
        <circle class="console-line" cx="250" cy="250" r="246"/>
        <circle class="console-line" cx="250" cy="250" r="207"/>
        <circle class="console-inner" cx="250" cy="250" r="174"/>
        <g class="console-orbits"><ellipse cx="250" cy="250" rx="217" ry="155" transform="rotate(-35 250 250)"/><ellipse cx="250" cy="250" rx="217" ry="155" transform="rotate(35 250 250)"/><circle cx="95" cy="105" r="4"/><circle cx="405" cy="395" r="4"/></g>
        <path class="console-star" d="M250 58 269 203Q273 226 296 231L431 250 296 269Q273 274 269 297L250 442 231 297Q227 274 204 269L69 250 204 231Q227 226 231 203Z"/>
        <path class="console-points" d="m250 20 4 8-4 8-4-8Zm0 444 4 8-4 8-4-8ZM20 250l8-4 8 4-8 4Zm444 0 8-4 8 4-8 4Z"/>
      </svg>
      <div class="console-options">${["quick", "showcase"].map((mode, index) => `<button class="mode-option" data-mode="${mode}" type="button"><span class="mode-number" aria-hidden="true">${count(index + 1)}</span><span class="choice-label">${escape(modeLabels[mode])}</span><span class="mode-arrow" aria-hidden="true">↗</span></button>`).join("")}</div>
    </div>`;
  }

  function sectionHeading(title, english, index, total) {
    return `<header class="portfolio-heading reveal"><div class="section-index"><span>${count(index)} / 04</span>${total ? `<span>${count(total)}</span>` : ""}</div><h2>${escape(text(title))}</h2>${language === "zh" ? `<p class="heading-english" lang="en">${escape(english)}</p>` : ""}</header>`;
  }

  function projectCard(project, group) {
    const globalIndex = projects.indexOf(project);
    const poster = project.poster || project.cover;
    const image = poster ? `<img src="${escape(poster)}" alt="" style="object-position:${escape(project.posterPosition || project.coverPosition || "center")}">` : "";
    const panels = project.posterPanels?.filter((panel) => panel.src) || [];
    const activePanel = Math.min(posterPanelIndices.get(project.id) || 0, Math.max(0, panels.length - 1));
    const background = panels.length ? `<div class="project-poster poster-panels" role="group" aria-label="${escape(text(project.title))}" data-poster-project="${escape(project.id)}">${panels.map((panel, index) => `<button class="poster-panel" type="button" data-poster-index="${index}" aria-label="${escape(text(project.title))} · ${count(index + 1)} / ${count(panels.length)}" aria-pressed="${index === activePanel}" style="--poster-weight:${index === activePanel ? expandedPosterWeight : 1}"><img src="${escape(panel.src)}" alt="" loading="lazy" decoding="async" draggable="false" style="object-position:${escape(panel.position || "center")}"></button>`).join("")}</div>` : `<div class="project-poster" aria-hidden="true">${image}</div>`;
    return `<article id="project-${escape(project.id)}" class="project-card project-page" data-project-card="${escape(project.id)}" data-poster-layout="${project.liveScene ? "live" : panels.length ? "panels" : "single"}" data-intro-side="${project.introSide === "right" ? "right" : "left"}" aria-labelledby="title-${escape(project.id)}">
      ${background}
      <div class="project-brief">
        <div class="project-kicker"><span>${escape(text(group.title))}</span><span>${count(globalIndex + 1)} / ${count(projects.length)}</span></div>
        <div class="project-introduction"><h2 id="title-${escape(project.id)}">${escape(text(project.title))}</h2>
          ${text(project.introduction) ? `<p class="project-summary">${escape(text(project.introduction))}</p>` : ""}
          <div class="project-meta"><p>${project.role ? `${escape(text(project.role))}<span> / </span>` : ""}${escape(text(project.kind))}</p><p>${escape(project.tools)}<span> · </span>${escape(text(project.duration))}</p></div>
          ${project.award ? `<p class="project-award"><span aria-hidden="true">✦</span>${escape(text(project.award))}</p>` : ""}
        </div>
        <a class="project-enter" href="./project.html?work=${encodeURIComponent(project.id)}&amp;lang=${language}" aria-label="${escape(labels[language].enter + " · " + text(project.title))}"><span>${labels[language].enter}</span><span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
  }

  function selectPosterPanel(button) {
    const gallery = button.closest(".poster-panels");
    if (!gallery || button.getAttribute("aria-pressed") === "true") return;
    posterPanelIndices.set(gallery.dataset.posterProject, Number(button.dataset.posterIndex));
    gallery.querySelectorAll(".poster-panel").forEach((panel) => {
      const active = panel === button;
      panel.setAttribute("aria-pressed", String(active));
      panel.style.setProperty("--poster-weight", active ? expandedPosterWeight : 1);
    });
  }

  function renderWheel() {
    activeWheelButton = null;
    // 三圈轨道给原生滚轮和触摸惯性留出首尾空间，越界时无缝回到中间一圈。
    wheelOptions.innerHTML = Array.from({ length: 3 }, (_, cycle) => projects.map((project, index) => {
      const group = data.groups.find((item) => item.projects.includes(project));
      const thumbnail = project.cover || project.poster;
      return `<button class="wheel-work" type="button" tabindex="-1" data-wheel-project="${escape(project.id)}" data-work-group="${group.id}" data-wheel-cycle="${cycle}" title="${escape(text(project.title))}" aria-label="${escape(text(project.title))}">${thumbnail ? `<img class="wheel-thumbnail" src="${escape(thumbnail)}" alt="" draggable="false">` : ""}<span class="wheel-number" aria-hidden="true">${roman(index + 1)}</span><span class="wheel-title">${escape(text(project.title))}</span></button>`;
    }).join("")).join("");
    const polar = (radius, angle) => [Math.cos(angle * Math.PI / 180) * radius, Math.sin(angle * Math.PI / 180) * radius];
    const arc = (radius, halfAngle) => {
      const start = polar(radius, -halfAngle);
      const end = polar(radius, halfAngle);
      return `M${start.join(" ")}A${radius} ${radius} 0 0 1 ${end.join(" ")}`;
    };
    const ticks = Array.from({ length: 60 }, (_, index) => `<path transform="rotate(${index * 6})" d="M${index % 5 === 0 ? 88 : 92} 0H96"/>`).join("");
    clockRotor.innerHTML = `<g class="clock-ticks">${ticks}</g><circle class="clock-inner-ring" r="78"/><circle class="clock-inner-ring" r="82"/>${projects.map((project, index) => `<g class="clock-number" data-clock-project="${escape(project.id)}" data-clock-index="${index}" transform="rotate(${index * clockStep})"><path class="clock-segment-outer" d="${arc(146, clockStep * .46)}"/><path class="clock-segment-inner" d="${arc(101, clockStep * .46)}"/><text x="124" y="1" text-anchor="middle" dominant-baseline="central" transform="rotate(90 124 1)">${roman(index + 1)}</text></g>`).join("")}`;
    clockHand.innerHTML = `<path class="clock-hand-blade" d="M-24 0-10-3 36-2 47-6 60-2 100-1 119 0 100 1 60 2 47 6 36 2-10 3Z"/><path class="clock-hand-detail" d="M10 0H102"/><circle class="clock-hub" r="7"/><circle class="clock-hub-core" r="2"/>`;
    wheel.setAttribute("aria-label", labels[language].chooseWork);
    wheelStar.setAttribute("aria-label", labels[language].chooseWork);
    wheelStar.title = labels[language].chooseWork;
    wheel.querySelector(".work-wheel-close").setAttribute("aria-label", labels[language].closeWheel);
  }

  function centerWheel(id, behavior = "instant") {
    const cursor = wheelOptions.scrollTop + wheelOptions.clientHeight / 2;
    const button = [...wheelOptions.querySelectorAll(`[data-wheel-project="${id}"]`)].sort((a, b) => Math.abs(a.offsetTop + a.offsetHeight / 2 - cursor) - Math.abs(b.offsetTop + b.offsetHeight / 2 - cursor))[0];
    if (!button || !wheelOpen) return;
    const top = button.offsetTop + button.offsetHeight / 2 - wheelOptions.clientHeight / 2;
    wheelOptions.scrollTo({ top, behavior: motion.matches ? "instant" : behavior });
    if (behavior === "instant" || motion.matches) updateWheel();
  }

  function previewProject(id) {
    if (!projects.some((project) => project.id === id) || id === selectedProjectId) return;
    selectedProjectId = id;
    workGroup = data.groups.find((group) => group.projects.some((project) => project.id === id)).id;
    syncPanels();
  }

  function updateWheel() {
    if (!wheelOpen || panel !== "works" || view !== "quick") return;
    const radius = wheelOptions.clientHeight / 2;
    let nearest = null;
    let distance = Infinity;
    const buttons = [...wheelOptions.querySelectorAll(".wheel-work")];
    const centers = buttons.map((button) => button.offsetTop + button.offsetHeight / 2);
    const cursor = wheelOptions.scrollTop + radius;
    const lower = Math.max(0, centers.findLastIndex((center) => center <= cursor));
    const upper = Math.min(buttons.length - 1, lower + 1);
    const position = upper === lower ? lower : Math.max(0, lower + (cursor - centers[lower]) / (centers[upper] - centers[lower]));
    const length = projects.length;
    if (position < length - 1 || position > length * 2) {
      const equivalent = position < length - 1 ? position + length : position - length;
      const base = Math.floor(equivalent);
      const next = Math.min(buttons.length - 1, base + 1);
      const targetCursor = centers[base] + (equivalent - base) * (centers[next] - centers[base]);
      const shift = targetCursor - cursor;
      wheelOptions.scrollTop += shift;
      if (dragging) dragging.top += shift;
      updateWheel();
      return;
    }
    const styles = getComputedStyle(root);
    const faceScale = Number(styles.getPropertyValue("--clock-scale")) || 1;
    const width = buttons[0].offsetWidth;
    const hub = 0;
    const clockRadius = radius * 146 / 320 * faceScale;
    const orbit = clockRadius + radius * .13 + width / 2;
    buttons.forEach((button, index) => {
      const offset = button.offsetTop + button.offsetHeight / 2 - wheelOptions.scrollTop - radius;
      const angle = (index - position) * cardStep;
      const radians = angle * Math.PI / 180;
      const normalized = Math.min(1, Math.abs(angle) / 78);
      button.style.setProperty("--card-x", `${hub + Math.cos(radians) * orbit}px`);
      button.style.setProperty("--card-y", `${Math.sin(radians) * radius * .82 - offset}px`);
      button.style.setProperty("--card-scale", String(1 / (1 + Math.abs(index - position) * cardScaleFalloff)));
      button.style.setProperty("--card-opacity", String(1 - normalized * .5));
      button.style.visibility = Math.abs(angle) < 78 ? "visible" : "hidden";
      if (Math.abs(offset) < distance) { nearest = button; distance = Math.abs(offset); }
    });
    activeWheelButton = nearest;
    markWheelSelection();
    const rotation = -position * clockStep;
    clockRotor.setAttribute("transform", `translate(320 320) scale(${faceScale}) rotate(${rotation})`);
    for (const number of clockRotor.querySelectorAll(".clock-number")) {
      const active = number.dataset.clockProject === nearest?.dataset.wheelProject;
      number.setAttribute("data-active", String(active));
      number.setAttribute("transform", `rotate(${Number(number.dataset.clockIndex) * clockStep}) translate(${active ? clockLift : 0} 0)`);
    }
    const confirmedIndex = Math.max(0, projects.findIndex((project) => project.id === confirmedProjectId));
    const handAngle = (confirmedIndex - position) * clockStep;
    clockHand.setAttribute("transform", `translate(320 320) scale(${faceScale}) rotate(${handAngle})`);
    clockHand.dataset.project = projects[confirmedIndex]?.id || "";
    clockHand.dataset.angle = String(handAngle);
    if (nearest) previewProject(nearest.dataset.wheelProject);
    if (nearest?.dataset.wheelProject === pendingWheelFocus && distance < 1) {
      pendingWheelFocus = null;
      nearest.focus({ preventScroll: true });
    }
  }

  function syncPanels() {
    const quick = view === "quick";
    const works = quick && panel === "works";
    const selectedGroup = data.groups.find((group) => group.projects.some((project) => project.id === selectedProjectId));
    const displayedGroup = selectedGroup?.id || workGroup;
    root.dataset.view = view;
    root.dataset.panel = panel;
    root.dataset.workGroup = displayedGroup;
    root.dataset.wheelOpen = String(works && wheelOpen);
    header.hidden = !quick;
    content.querySelector("#about").hidden = quick;
    content.querySelector("#growth").hidden = !quick || panel !== "growth";
    data.groups.forEach((group) => {
      const section = document.getElementById(group.id);
      section.hidden = !works || selectedGroup?.id !== group.id;
      group.projects.forEach((project) => {
        document.getElementById(`project-${project.id}`).hidden = !works || project.id !== selectedProjectId;
      });
    });
    content.querySelector(".work-empty").hidden = !works || Boolean(selectedProjectId);
    content.querySelector(".work-empty-category").textContent = labels[language][workGroup];
    content.inert = works && wheelOpen;
    wheel.hidden = !works;
    wheel.inert = !wheelOpen;
    wheel.setAttribute("aria-hidden", String(!works || !wheelOpen));
    wheelStar.hidden = !works || wheelOpen;
    wheelStar.setAttribute("aria-expanded", String(wheelOpen));
    wheelScrim.hidden = !works || !wheelOpen;
    markWheelSelection();
    activeSection = !quick ? "about" : works ? displayedGroup : "growth";
    navigation.querySelectorAll(".section-link").forEach((button) => {
      if (button.dataset.section === activeSection) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.body.dataset.quickSection = activeSection;
    document.body.dataset.quickBackdrop = activeSection;
    root.setAttribute("aria-label", quick ? labels[language][activeSection] : labels[language].about);
    if (works) root.scrollTop = 0;
    syncLiveScenes(works);
  }

  function syncLiveScenes(works) {
    for (const project of projects.filter(item => item.liveScene)) {
      const article = document.getElementById(`project-${project.id}`);
      const selected = works && project.id === selectedProjectId;
      let frame = article.querySelector('.project-live-scene');
      if (!selected) {
        frame?.remove();
        delete article.dataset.sceneReady;
        delete article.dataset.sceneFailed;
        continue;
      }
      // Preview the still poster while turning the wheel; start WebGL after confirming.
      if (!frame && !wheelOpen && !article.dataset.sceneFailed) {
        frame = document.createElement('iframe');
        frame.className = 'project-live-scene';
        frame.title = `${text(project.title)} · ${language === 'zh' ? '可交互办公室' : 'Interactive office'}`;
        const url = new URL(project.liveScene, location.href);
        url.searchParams.set('lang', language);
        frame.src = url.href;
        frame.addEventListener('load', () => frame.contentWindow?.postMessage({type:'office:state', paused:wheelOpen || root.hidden}, location.origin));
        article.querySelector('.project-poster').append(frame);
      }
      frame?.contentWindow?.postMessage({type:'office:state', paused:wheelOpen || root.hidden}, location.origin);
    }
  }

  addEventListener('message', event => {
    if (event.origin !== location.origin) return;
    const frame = [...content.querySelectorAll('.project-live-scene')].find(item => item.contentWindow === event.source);
    if (!frame) return;
    const article = frame.closest('[data-project-card]');
    if (event.data?.type === 'office:ready') {
      article.dataset.sceneReady = 'true';
      frame.contentWindow.postMessage({type:'office:state', paused:wheelOpen || root.hidden}, location.origin);
    } else if (event.data?.type === 'office:error') {
      article.dataset.sceneFailed = 'true';
      delete article.dataset.sceneReady;
      frame.remove();
    } else if (event.data?.type === 'office:escape') {
      window.focus();
      wheelStar.focus({preventScroll:true});
    }
  });

  function markWheelSelection() {
    wheelOptions.querySelectorAll("[data-wheel-project]").forEach((button) => {
      button.tabIndex = button === activeWheelButton ? 0 : -1;
      if (button === activeWheelButton) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function openWheel(group = workGroup) {
    pendingWheelFocus = null;
    if (panel === "growth") growthScroll = root.scrollTop;
    panel = "works";
    workGroup = group;
    wheelOpen = true;
    syncPanels();
    const current = wheelOptions.querySelector(`[data-wheel-project="${selectedProjectId}"]`);
    const firstInGroup = wheelOptions.querySelector(`[data-work-group="${group}"]`);
    const target = current?.dataset.workGroup === group ? current : firstInGroup;
    if (target) {
      previewProject(target.dataset.wheelProject);
      centerWheel(target.dataset.wheelProject);
      activeWheelButton?.focus({ preventScroll: true });
    }
  }

  function closeWheel() {
    pendingWheelFocus = null;
    wheelOpen = false;
    syncPanels();
    wheelStar.focus({ preventScroll: true });
  }

  function chooseProject(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    pendingWheelFocus = null;
    selectedProjectId = id;
    confirmedProjectId = id;
    workGroup = data.groups.find((group) => group.projects.includes(project)).id;
    panel = "works";
    wheelOpen = false;
    syncPanels();
    observeReveals();
    const heading = document.getElementById(`title-${id}`);
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }

  function namePage(value, className, hidden) {
    const alternateLanguage = language === "zh" ? "en" : "zh";
    return `<span class="name-page ${className}" aria-hidden="${hidden}"><span class="name-main">${escape(text(value))}</span><span class="profile-roman" lang="${alternateLanguage === "zh" ? "zh-CN" : "en"}">${escape(value[alternateLanguage])}</span></span>`;
  }

  function setNameFlipped(flipped) {
    nameFlipped = flipped;
    const button = root.querySelector(".profile-name-flip");
    button.dataset.flipped = String(flipped);
    button.setAttribute("aria-pressed", String(flipped));
    button.querySelector(".name-primary").setAttribute("aria-hidden", String(flipped));
    button.querySelector(".name-alias").setAttribute("aria-hidden", String(!flipped));
  }

  function render() {
    const profile = data.profile;
    root.dataset.view = view;
    root.setAttribute("aria-label", view === "profile" ? labels[language].about : SCENE_SETTINGS.selection.labels[language].quick);
    navigation.setAttribute("aria-label", labels[language].nav);
    navigation.innerHTML = ["about", "growth", "visual", "games"].map((id) => `<button class="section-link" type="button" data-section="${id}">${labels[language][id]}</button>`).join("");
    root.querySelector(".nav-home").setAttribute("aria-label", labels[language].about);
    content.innerHTML = `
      <section id="about" class="portfolio-section profile-section" aria-labelledby="profile-name">
        <div class="profile-topline"><span>${labels[language].about}</span><span lang="en">2024 — 2026</span></div>
        <div class="profile-composition"><div class="profile-copy"><h1 id="profile-name" class="profile-name"><button class="profile-name-flip" type="button" data-flipped="${nameFlipped}" aria-pressed="${nameFlipped}" aria-label="${escape(text(profile.name))} / ${escape(text(profile.alias))}">${namePage(profile.name, "name-primary", nameFlipped)}${namePage(profile.alias, "name-alias", !nameFlipped)}</button></h1><p class="profile-education">${escape(text(profile.education))}</p><dl class="profile-facts">${(profile.facts || []).map((fact) => `<div><dt>${escape(text(fact.label))}</dt><dd>${escape(text(fact.value))}</dd></div>`).join("")}</dl></div>${modeConsole()}</div>
        <div class="profile-bottom"><p class="profile-roles">${profile.roles.map((role) => `<span>${escape(text(role))}</span>`).join('<span class="role-slash" aria-hidden="true">/</span>')}</p></div>
      </section>
      <section id="growth" class="portfolio-section growth-section" aria-labelledby="growth-heading">
        ${window.GrowthMountain.render(data.timeline, language, sectionHeading({ zh: labels.zh.growth, en: labels.en.growth }, "Growth", 2), data.growthChart)}
      </section>
      ${data.groups.map((group) => `<section id="${escape(group.id)}" class="portfolio-section projects-section ${escape(group.id)}-section" aria-label="${escape(text(group.title))}"><div class="project-grid">${group.projects.map((project) => projectCard(project, group)).join("")}</div></section>`).join("")}
      <section class="work-empty" aria-labelledby="work-empty-title" hidden><p class="work-empty-category"></p><h2 id="work-empty-title">${labels[language].chooseWork}</h2></section>`;
    // 标题 ID 与分区的可访问名称保持对应。
    for (const section of content.querySelectorAll(".portfolio-section:not(.profile-section)")) {
      if (section.id === "growth") section.querySelector("h2").id = "growth-heading";
    }
    renderWheel();
    syncPanels();
    content.querySelectorAll(".project-poster img").forEach((image) => {
      image.addEventListener("error", () => {
        const cover = image.parentElement;
        cover.classList.remove("has-image");
        image.remove();
      }, { once: true });
    });
    const nameButton = content.querySelector(".profile-name-flip");
    nameButton.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") setNameFlipped(true);
    });
    nameButton.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") setNameFlipped(false);
    });
    nameButton.addEventListener("click", () => setNameFlipped(!nameFlipped));
    window.GrowthMountain.mount(root, data.timeline, language, data.growthChart);
    observeReveals();
    updateScrollState();
    if (wheelOpen) centerWheel(selectedProjectId);
  }

  function observeReveals() {
    revealObserver?.disconnect();
    const items = content.querySelectorAll(".reveal");
    if (motion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("revealed"));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { root, threshold: 0.06 });
    items.forEach((item) => revealObserver.observe(item));
  }

  function updateScrollState() {
    if (root.hidden) return;
    if (view === "quick" && panel === "growth") {
      growthScroll = root.scrollTop;
      window.GrowthMountain.update();
    } else if (root.scrollTop !== 0) root.scrollTop = 0;
  }

  function navigate(id) {
    if (id === "about" && view === "quick") {
      root.dispatchEvent(new CustomEvent("portfolio:profile"));
      return;
    }
    if (id === "visual" || id === "games") {
      openWheel(id);
    } else if (id === "growth") {
      panel = "growth";
      wheelOpen = false;
      syncPanels();
      root.scrollTop = growthScroll;
      updateScrollState();
      const heading = document.getElementById("growth-heading");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  root.addEventListener("click", (event) => {
    const posterPanel = event.target.closest(".poster-panel");
    if (posterPanel) {
      selectPosterPanel(posterPanel);
      return;
    }
    const workButton = event.target.closest("[data-wheel-project]");
    if (workButton) {
      if (event.detail > 0 && performance.now() < suppressClickUntil) return;
      chooseProject(workButton.dataset.wheelProject);
      return;
    }
    if (event.target.closest("[data-wheel-close]")) {
      closeWheel();
      return;
    }
    if (event.target.closest(".work-wheel-star")) {
      openWheel();
      return;
    }
    const sectionButton = event.target.closest("[data-section]");
    if (sectionButton) {
      navigate(sectionButton.dataset.section);
      return;
    }
    // 浏览器后退即使未保留页面内存，也能恢复进入详情前的作品。
    if (event.target.closest(".project-enter")) {
      const address = new URL(location.href);
      address.searchParams.set("view", "work");
      address.searchParams.set("work", selectedProjectId);
      address.searchParams.set("lang", language);
      history.replaceState(null, "", address);
    }
  });
  root.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const button = event.target.closest(".poster-panel");
    if (button) selectPosterPanel(button);
  });
  root.addEventListener("focusin", (event) => {
    const button = event.target.closest(".poster-panel");
    if (button) selectPosterPanel(button);
  });
  root.addEventListener("keydown", (event) => {
    const posterPanel = event.target.closest(".poster-panel");
    if (posterPanel) {
      const buttons = [...posterPanel.parentElement.querySelectorAll(".poster-panel")];
      const index = buttons.indexOf(posterPanel);
      const destinations = { ArrowLeft: (index + buttons.length - 1) % buttons.length, ArrowRight: (index + 1) % buttons.length, Home: 0, End: buttons.length - 1 };
      if (event.key in destinations) {
        event.preventDefault();
        buttons[destinations[event.key]].focus({ preventScroll: true });
      }
      return;
    }
    if (!wheelOpen || panel !== "works" || view !== "quick") return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeWheel();
      return;
    }
    if (!event.target.closest(".work-wheel")) return;
    const buttons = [...wheelOptions.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    const destinations = { ArrowDown: (index + 1) % buttons.length, ArrowUp: (index + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    const target = buttons[destinations[event.key]];
    pendingWheelFocus = target.dataset.wheelProject;
    centerWheel(target.dataset.wheelProject, "smooth");
  });
  wheelOptions.addEventListener("scroll", () => {
    if (wheelFrame) return;
    wheelFrame = requestAnimationFrame(() => { wheelFrame = 0; updateWheel(); });
  }, { passive: true });
  wheelOptions.addEventListener("scrollend", () => {
    if (!wheelOpen || dragging?.moved) return;
    updateWheel();
    const button = activeWheelButton;
    if (!button) return;
    const target = button.offsetTop + button.offsetHeight / 2 - wheelOptions.clientHeight / 2;
    if (Math.abs(target - wheelOptions.scrollTop) > 1) centerWheel(selectedProjectId, "smooth");
  });
  wheelOptions.addEventListener("focusin", (event) => {
    const button = event.target.closest(".wheel-work");
    if (button && wheelOpen) centerWheel(button.dataset.wheelProject, "smooth");
  });
  wheel.addEventListener("wheel", (event) => {
    if (event.target.closest(".work-wheel-options")) return;
    event.preventDefault();
    wheelOptions.scrollBy({ top: event.deltaY * (event.deltaMode === 1 ? 16 : 1), behavior: "instant" });
  }, { passive: false });
  wheelOptions.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = { id: event.pointerId, y: event.clientY, top: wheelOptions.scrollTop, moved: false };
  });
  wheelOptions.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragging.id) return;
    if (!(event.buttons & 1)) { endDrag(); return; }
    const distance = event.clientY - dragging.y;
    if (!dragging.moved && Math.abs(distance) < 6) return;
    if (!dragging.moved) {
      dragging.moved = true;
      wheelOptions.setPointerCapture(event.pointerId);
      wheelOptions.style.scrollSnapType = "none";
    }
    event.preventDefault();
    wheelOptions.scrollTop = dragging.top - distance;
  });
  function endDrag() {
    if (!dragging) return;
    const moved = dragging.moved;
    dragging = null;
    if (moved) {
      suppressClickUntil = performance.now() + 250;
      wheelOptions.style.scrollSnapType = "";
      updateWheel();
      centerWheel(selectedProjectId, "smooth");
    }
  }
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);
  root.addEventListener("scroll", () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => { updateScrollState(); scrollPending = false; });
  }, { passive: true });
  addEventListener("resize", () => { updateScrollState(); if (wheelOpen) centerWheel(selectedProjectId); });
  motion.addEventListener("change", observeReveals);
  function getPosition() {
    return { id: activeSection, offset: view === "quick" && panel === "growth" ? root.scrollTop : 0 };
  }
  window.PortfolioQuick = {
    getPosition,
    showProject(id) {
      if (!projects.some((project) => project.id === id)) return false;
      view = "quick";
      panel = "works";
      selectedProjectId = id;
      confirmedProjectId = id;
      workGroup = data.groups.find((group) => group.projects.some((project) => project.id === id)).id;
      wheelOpen = false;
      render();
      root.scrollTop = 0;
      return true;
    },
    setLanguage(next, position = getPosition()) {
      language = next;
      render();
      if (!root.hidden) {
        root.scrollTop = panel === "growth" && view === "quick" ? position.offset : 0;
        updateScrollState();
      }
    },
    setView(next) {
      view = next === "quick" ? "quick" : "profile";
      panel = "growth";
      wheelOpen = false;
      growthScroll = 0;
      activeSection = view === "profile" ? "about" : "growth";
      nameFlipped = false;
      render();
      root.scrollTop = 0;
      updateScrollState();
      const heading = document.getElementById(activeSection).querySelector("h1, h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    },
  };
})();
