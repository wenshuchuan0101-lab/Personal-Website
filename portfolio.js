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
  const dialog = document.querySelector(".project-detail");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const data = PORTFOLIO_CONTENT;
  const projects = data.groups.flatMap((group) => group.projects);
  const labels = {
    zh: { about: "个人介绍", growth: "成长过程", visual: "图片影像", games: "交互 / 游戏", nav: "内容分区", close: "关闭作品详情", detail: "作品详情", play: "游玩", empty: "作品展示预留区域", chooseWork: "选择作品", closeWheel: "收起作品轮盘" },
    en: { about: "About", growth: "Growth", visual: "Images & Film", games: "Interaction & Games", nav: "Sections", close: "Close project details", detail: "Project details", play: "Play", empty: "Reserved project presentation area", chooseWork: "Choose a work", closeWheel: "Close work selector" },
  };
  let language = "zh";
  let view = "profile";
  let panel = "growth";
  let workGroup = "visual";
  let selectedProjectId = null;
  let wheelOpen = false;
  let growthScroll = 0;
  let activeSection = "about";
  let openedProject = null;
  let nameFlipped = false;
  let revealObserver;
  let scrollPending = false;
  const text = (value) => typeof value === "string" ? value : value?.[language] ?? value?.zh ?? "";
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const count = (number) => String(number).padStart(2, "0");

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
    const cover = project.cover
      ? `<img src="${escape(project.cover)}" alt="${escape(text(project.title))}" loading="lazy" style="object-position:${escape(project.coverPosition)}">`
      : `<span class="cover-number" aria-hidden="true">${count(globalIndex + 1)}</span><span class="cover-caption">${escape(text(project.kind))}</span>`;
    return `<article id="project-${escape(project.id)}" class="project-card project-page" data-project-card="${escape(project.id)}" aria-labelledby="title-${escape(project.id)}">
      <header class="project-page-header"><h2>${escape(text(group.title))}</h2><span class="project-page-count">${count(globalIndex + 1)} / ${count(projects.length)}</span></header>
      <a class="project-open project-page-main reveal" href="#project-${escape(project.id)}" data-project="${escape(project.id)}" aria-label="${escape(text(project.title))} · ${labels[language].detail}">
        <div class="project-cover${project.cover ? " has-image" : ""}">${cover}<span class="cover-corners" aria-hidden="true"></span><span class="project-arrow" aria-hidden="true">↗</span></div>
        <div class="project-info"><div class="project-heading"><h3 id="title-${escape(project.id)}">${escape(text(project.title))}</h3></div>
          <div class="project-meta"><p>${project.role ? `${escape(text(project.role))}<span> / </span>` : ""}${escape(text(project.kind))}</p><p>${escape(project.tools)}<span> · </span>${escape(text(project.duration))}</p></div>
          ${project.award ? `<p class="project-award"><span aria-hidden="true">✦</span>${escape(text(project.award))}</p>` : ""}
        </div>
      </a>
    </article>`;
  }

  function renderWheel() {
    wheelOptions.innerHTML = projects.map((project, index) => {
      const angle = -60 + index * 120 / Math.max(1, projects.length - 1);
      const radians = angle * Math.PI / 180;
      const group = data.groups.find((item) => item.projects.includes(project));
      return `<button class="wheel-work" type="button" data-wheel-project="${escape(project.id)}" data-work-group="${group.id}" style="--wheel-x:${(Math.cos(radians) * .72).toFixed(5)};--wheel-y:${(Math.sin(radians) * .72).toFixed(5)}" title="${escape(text(project.title))}" aria-label="${escape(text(project.title))}"><span class="wheel-number" aria-hidden="true">${count(index + 1)}</span><span class="wheel-title">${escape(text(project.title))}</span></button>`;
    }).join("");
    wheel.setAttribute("aria-label", labels[language].chooseWork);
    wheelStar.setAttribute("aria-label", labels[language].chooseWork);
    wheelStar.title = labels[language].chooseWork;
    wheel.querySelector(".work-wheel-close").setAttribute("aria-label", labels[language].closeWheel);
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
    wheelOptions.querySelectorAll("[data-wheel-project]").forEach((button) => {
      if (button.dataset.wheelProject === selectedProjectId) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    activeSection = !quick ? "about" : works ? displayedGroup : "growth";
    navigation.querySelectorAll(".section-link").forEach((button) => {
      if (button.dataset.section === activeSection) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.body.dataset.quickSection = activeSection;
    document.body.dataset.quickBackdrop = activeSection;
    root.setAttribute("aria-label", quick ? labels[language][activeSection] : labels[language].about);
    if (works) root.scrollTop = 0;
  }

  function openWheel(group = workGroup) {
    if (panel === "growth") growthScroll = root.scrollTop;
    panel = "works";
    workGroup = group;
    wheelOpen = true;
    syncPanels();
    const current = wheelOptions.querySelector(`[data-wheel-project="${selectedProjectId}"]`);
    const firstInGroup = wheelOptions.querySelector(`[data-work-group="${group}"]`);
    (current?.dataset.workGroup === group ? current : firstInGroup)?.focus({ preventScroll: true });
  }

  function closeWheel() {
    wheelOpen = false;
    syncPanels();
    wheelStar.focus({ preventScroll: true });
  }

  function chooseProject(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    selectedProjectId = id;
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
        <div class="profile-composition"><div class="profile-copy"><h1 id="profile-name" class="profile-name"><button class="profile-name-flip" type="button" data-flipped="${nameFlipped}" aria-pressed="${nameFlipped}" aria-label="${escape(text(profile.name))} / ${escape(text(profile.alias))}">${namePage(profile.name, "name-primary", nameFlipped)}${namePage(profile.alias, "name-alias", !nameFlipped)}</button></h1><p class="profile-education">${escape(text(profile.education))}</p></div>${modeConsole()}</div>
        <div class="profile-bottom"><p class="profile-roles">${profile.roles.map((role) => `<span>${escape(text(role))}</span>`).join('<span class="role-slash" aria-hidden="true">/</span>')}</p></div>
      </section>
      <section id="growth" class="portfolio-section growth-section" aria-labelledby="growth-heading">
        ${window.GrowthMountain.render(data.timeline, language, sectionHeading({ zh: labels.zh.growth, en: labels.en.growth }, "Growth", 2), data.growthChart)}
      </section>
      ${data.groups.map((group) => `<section id="${escape(group.id)}" class="portfolio-section projects-section ${escape(group.id)}-section" aria-labelledby="${escape(group.id)}-heading"><div class="project-grid">${group.projects.map((project) => projectCard(project, group)).join("")}</div></section>`).join("")}
      <section class="work-empty" aria-labelledby="work-empty-title" hidden><p class="work-empty-category"></p><h2 id="work-empty-title">${labels[language].chooseWork}</h2></section>`;
    // 标题 ID 与分区的可访问名称保持对应。
    for (const section of content.querySelectorAll(".portfolio-section:not(.profile-section)")) {
      section.querySelector("h2").id = `${section.id}-heading`;
    }
    renderWheel();
    syncPanels();
    content.querySelectorAll(".project-cover img").forEach((image) => {
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
    if (openedProject) renderDetail(openedProject);
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

  function renderDetail(project) {
    const group = data.groups.find((item) => item.projects.includes(project));
    dialog.querySelector(".detail-category").textContent = text(group.title);
    dialog.querySelector(".detail-close").setAttribute("aria-label", labels[language].close);
    dialog.querySelector("#detail-title").textContent = text(project.title);
    const detail = project.detail;
    const hasContent = Boolean(text(detail.description) || detail.images.length || detail.video || detail.posterImages.length || detail.playUrl);
    const body = dialog.querySelector(".detail-body");
    body.replaceChildren();
    // 本轮素材全为空；以下是以后替换素材时的渲染入口。
    if (!hasContent) {
      const empty = document.createElement("div");
      empty.className = "detail-reserved";
      empty.setAttribute("role", "img");
      empty.setAttribute("aria-label", labels[language].empty);
      body.append(empty);
      return;
    }
    if (text(detail.description)) {
      const description = document.createElement("p");
      description.className = "detail-description";
      description.textContent = text(detail.description);
      body.append(description);
    }
    [...detail.images, ...detail.posterImages].forEach((path) => {
      const image = document.createElement("img");
      image.src = path;
      image.alt = text(project.title);
      image.loading = "lazy";
      body.append(image);
    });
    if (detail.video) {
      const video = document.createElement("video");
      video.src = detail.video;
      video.controls = true;
      video.preload = "metadata";
      body.append(video);
    }
    if (detail.playUrl) {
      const link = document.createElement("a");
      link.href = detail.playUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = labels[language].play + " ↗";
      body.append(link);
    }
  }

  root.addEventListener("click", (event) => {
    const workButton = event.target.closest("[data-wheel-project]");
    if (workButton) {
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
    const projectLink = event.target.closest("[data-project]");
    if (!projectLink) return;
    event.preventDefault();
    openedProject = projects.find((item) => item.id === projectLink.dataset.project);
    renderDetail(openedProject);
    dialog.showModal();
  });
  root.addEventListener("keydown", (event) => {
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
    buttons[destinations[event.key]].focus({ preventScroll: true });
  });
  root.addEventListener("scroll", () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => { updateScrollState(); scrollPending = false; });
  }, { passive: true });
  addEventListener("resize", updateScrollState);
  dialog.querySelector(".detail-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    dialog.querySelectorAll("video").forEach((video) => video.pause());
    openedProject = null;
  });
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  motion.addEventListener("change", observeReveals);
  function getPosition() {
    return { id: activeSection, offset: view === "quick" && panel === "growth" ? root.scrollTop : 0 };
  }
  window.PortfolioQuick = {
    getPosition,
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
