// 快速浏览：内容从 portfolio-data.js 读取，样式与颜色在 portfolio.css。
(() => {
  const root = document.querySelector(".quick-view");
  const content = root.querySelector(".portfolio-content");
  const navigation = root.querySelector(".quick-navigation");
  const dialog = document.querySelector(".project-detail");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const data = PORTFOLIO_CONTENT;
  const projects = data.groups.flatMap((group) => group.projects);
  const labels = {
    zh: { about: "个人介绍", growth: "成长过程", visual: "图片影像", games: "交互 / 游戏", nav: "内容分区", close: "关闭作品详情", detail: "作品详情", play: "游玩", empty: "作品展示预留区域", previousWork: "上一个作品", nextWork: "下一个作品" },
    en: { about: "About", growth: "Growth", visual: "Images & Film", games: "Interaction & Games", nav: "Sections", close: "Close project details", detail: "Project details", play: "Play", empty: "Reserved project presentation area", previousWork: "Previous work", nextWork: "Next work" },
  };
  let language = "zh";
  let view = "profile";
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
    const previous = projects[globalIndex - 1];
    const next = projects[globalIndex + 1];
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
      <nav class="project-pagination" aria-label="${escape(text(project.title))}">
        <button type="button" data-project-scroll="${previous ? escape(previous.id) : ""}" aria-label="${escape(labels[language].previousWork + (previous ? " · " + text(previous.title) : ""))}"${previous ? "" : " disabled"}>↑</button>
        <button type="button" data-project-scroll="${next ? escape(next.id) : ""}" aria-label="${escape(labels[language].nextWork + (next ? " · " + text(next.title) : ""))}"${next ? "" : " disabled"}>↓</button>
      </nav>
    </article>`;
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
    root.querySelector(".quick-rail").hidden = view === "profile";
    root.setAttribute("aria-label", view === "profile" ? labels[language].about : SCENE_SETTINGS.selection.labels[language].quick);
    navigation.setAttribute("aria-label", labels[language].nav);
    navigation.innerHTML = ["about", "growth", "visual", "games"].map((id, index) => `<a class="rail-link" href="#${id}" data-scroll="${id}"${view === "profile" && id !== "about" ? " hidden" : ""}><span class="rail-number">${count(index + 1)}</span><span>${labels[language][id]}</span></a>`).join("");
    root.querySelector(".rail-progress").hidden = view === "profile";
    root.querySelector(".rail-monogram").setAttribute("aria-label", labels[language].about);
    content.innerHTML = `
      <section id="about" class="portfolio-section profile-section" aria-labelledby="profile-name">
        <div class="profile-topline"><span>${labels[language].about}</span><span lang="en">2024 — 2026</span></div>
        <div class="profile-composition"><div class="profile-copy"><h1 id="profile-name" class="profile-name"><button class="profile-name-flip" type="button" data-flipped="${nameFlipped}" aria-pressed="${nameFlipped}" aria-label="${escape(text(profile.name))} / ${escape(text(profile.alias))}">${namePage(profile.name, "name-primary", nameFlipped)}${namePage(profile.alias, "name-alias", !nameFlipped)}</button></h1><p class="profile-education">${escape(text(profile.education))}</p></div>${modeConsole()}</div>
        <div class="profile-bottom"><p class="profile-roles">${profile.roles.map((role) => `<span>${escape(text(role))}</span>`).join('<span class="role-slash" aria-hidden="true">/</span>')}</p></div>
      </section>
      <section id="growth" class="portfolio-section growth-section" aria-labelledby="growth-heading">
        ${window.GrowthMountain.render(data.timeline, language, sectionHeading({ zh: labels.zh.growth, en: labels.en.growth }, "Growth", 2), data.growthChart)}
      </section>
      ${data.groups.map((group) => `<section id="${escape(group.id)}" class="portfolio-section projects-section ${escape(group.id)}-section" aria-labelledby="${escape(group.id)}-heading"><div class="project-grid">${group.projects.map((project) => projectCard(project, group)).join("")}</div></section>`).join("")}`;
    // 标题 ID 与分区的可访问名称保持对应。
    for (const section of content.querySelectorAll(".portfolio-section:not(.profile-section)")) {
      section.querySelector("h2").id = `${section.id}-heading`;
    }
    content.querySelectorAll(".portfolio-section").forEach((section) => {
      section.hidden = section.id === "about" ? view !== "profile" : view !== "quick";
    });
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
    const sections = [...content.querySelectorAll(".portfolio-section:not([hidden])")];
    const offset = root.scrollTop + root.clientHeight * .3;
    const current = sections.filter((section) => section.offsetTop <= offset).at(-1) || sections[0];
    activeSection = current.id;
    navigation.querySelectorAll(".rail-link").forEach((link) => {
      if (link.dataset.scroll === activeSection) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const progress = root.scrollTop / Math.max(1, root.scrollHeight - root.clientHeight);
    root.querySelector(".rail-progress > span").style.transform = `scaleY(${Math.max(.03, progress)})`;
    document.body.dataset.quickSection = activeSection;
    const starY = document.querySelector(".language-star").getBoundingClientRect().y + 25;
    const starSection = sections.filter((section) => section.offsetTop <= root.scrollTop + starY).at(-1) || sections[0];
    document.body.dataset.quickBackdrop = starSection.id;
    window.GrowthMountain.update();
  }

  function navigate(id) {
    if (id === "about" && view === "quick") {
      root.dispatchEvent(new CustomEvent("portfolio:profile"));
      return;
    }
    const target = document.getElementById(id);
    if (!target || target.hidden || !root.contains(target)) return;
    root.scrollTo({ top: target.offsetTop, behavior: motion.matches ? "instant" : "smooth" });
    // 焦点跟随页内导航，阅读顺序与视觉位置一致。
    const heading = target.querySelector("h1, h2");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
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
    const pageButton = event.target.closest("[data-project-scroll]");
    if (pageButton && !pageButton.disabled) {
      const target = document.getElementById(`project-${pageButton.dataset.projectScroll}`);
      const top = root.scrollTop + target.getBoundingClientRect().top - root.getBoundingClientRect().top;
      root.scrollTo({ top, behavior: motion.matches ? "instant" : "smooth" });
      const heading = target.querySelector("h3");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      return;
    }
    const scrollLink = event.target.closest("[data-scroll], .rail-monogram");
    if (scrollLink) {
      event.preventDefault();
      navigate(scrollLink.dataset.scroll || "about");
      return;
    }
    const projectLink = event.target.closest("[data-project]");
    if (!projectLink) return;
    event.preventDefault();
    openedProject = projects.find((item) => item.id === projectLink.dataset.project);
    renderDetail(openedProject);
    dialog.showModal();
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
    const section = document.getElementById(activeSection);
    return { id: activeSection, offset: section ? root.scrollTop - section.offsetTop : 0 };
  }
  window.PortfolioQuick = {
    getPosition,
    setLanguage(next, position = getPosition()) {
      language = next;
      render();
      if (!root.hidden) {
        const current = document.getElementById(position.id);
        root.scrollTop = current.offsetTop + position.offset;
        updateScrollState();
      }
    },
    setView(next) {
      view = next === "quick" ? "quick" : "profile";
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
