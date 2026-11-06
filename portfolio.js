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
    zh: { about: "个人介绍", growth: "成长过程", visual: "图片影像", games: "交互 / 游戏", nav: "内容分区", close: "关闭作品详情", detail: "作品详情", play: "游玩", empty: "作品展示预留区域" },
    en: { about: "About", growth: "Growth", visual: "Images & Film", games: "Interaction & Games", nav: "Sections", close: "Close project details", detail: "Project details", play: "Play", empty: "Reserved project presentation area" },
  };
  let language = "zh";
  let activeSection = "about";
  let openedProject = null;
  let revealObserver;
  let scrollPending = false;
  const text = (value) => typeof value === "string" ? value : value?.[language] ?? value?.zh ?? "";
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const count = (number) => String(number).padStart(2, "0");
  const star = '<svg viewBox="0 0 100 140" aria-hidden="true"><path d="M50 2 55 53Q56 63 65 65L98 70 65 75Q56 77 55 87L50 138 45 87Q44 77 35 75L2 70 35 65Q44 63 45 53Z" fill="currentColor"/></svg>';

  function sectionHeading(title, english, index, total) {
    return `<header class="portfolio-heading reveal"><div class="section-index"><span>${count(index)} / 04</span>${total ? `<span>${count(total)}</span>` : ""}</div><h2>${escape(text(title))}</h2>${language === "zh" ? `<p class="heading-english" lang="en">${escape(english)}</p>` : ""}</header>`;
  }

  function projectCard(project, index) {
    const cover = project.cover
      ? `<img src="${escape(project.cover)}" alt="${escape(text(project.title))}" loading="lazy" style="object-position:${escape(project.coverPosition)}">`
      : `<span class="cover-number" aria-hidden="true">${count(index + 1)}</span><span class="cover-caption">${escape(text(project.kind))}</span>`;
    return `<article class="project-card reveal" data-project-card="${escape(project.id)}">
      <a class="project-open" href="#project-${escape(project.id)}" data-project="${escape(project.id)}" aria-label="${escape(text(project.title))} · ${labels[language].detail}">
        <div class="project-cover${project.cover ? " has-image" : ""}">${cover}<span class="cover-corners" aria-hidden="true"></span><span class="project-arrow" aria-hidden="true">↗</span></div>
        <div class="project-heading"><h3>${escape(text(project.title))}</h3><span class="project-number">${count(index + 1)}</span></div>
      </a>
      <div class="project-meta"><p>${project.role ? `${escape(text(project.role))}<span> / </span>` : ""}${escape(text(project.kind))}</p><p>${escape(project.tools)}<span> · </span>${escape(text(project.duration))}</p></div>
      ${project.award ? `<p class="project-award"><span aria-hidden="true">✦</span>${escape(text(project.award))}</p>` : ""}
    </article>`;
  }

  function render() {
    const profile = data.profile;
    navigation.setAttribute("aria-label", labels[language].nav);
    navigation.innerHTML = ["about", "growth", "visual", "games"].map((id, index) => `<a class="rail-link" href="#${id}" data-scroll="${id}"><span class="rail-number">${count(index + 1)}</span><span>${labels[language][id]}</span></a>`).join("");
    root.querySelector(".rail-monogram").setAttribute("aria-label", labels[language].about);
    content.innerHTML = `
      <section id="about" class="portfolio-section profile-section" aria-labelledby="profile-name">
        <div class="profile-topline"><span>${labels[language].about}</span><span lang="en">2024 — 2026</span></div>
        <div class="profile-composition"><div class="profile-copy"><p class="profile-alias">${escape(text(profile.alias))}</p><h1 id="profile-name" class="profile-name">${escape(text(profile.name))}</h1>${language === "zh" ? `<p class="profile-roman" lang="en">${escape(profile.name.en)}</p>` : `<p class="profile-roman" lang="zh-CN">${escape(profile.name.zh)}</p>`}<p class="profile-education">${escape(text(profile.education))}</p></div><div class="profile-orbit" aria-hidden="true"><span class="orbit-outline"></span>${star}<span class="orbit-coordinate">01 / 04</span></div></div>
        <div class="profile-bottom"><p class="profile-roles">${profile.roles.map((role) => `<span>${escape(text(role))}</span>`).join('<span class="role-slash" aria-hidden="true">/</span>')}</p><a href="#growth" class="scroll-cue" data-scroll="growth" aria-label="${labels[language].growth}">↓</a></div>
      </section>
      <section id="growth" class="portfolio-section growth-section" aria-labelledby="growth-heading">
        ${sectionHeading({ zh: labels.zh.growth, en: labels.en.growth }, "Growth", 2)}
        <ol class="growth-list">${data.timeline.map((item) => `<li class="growth-item reveal"><span class="growth-date">${escape(item.date)}</span><h3>${escape(text(item.label))}</h3>${item.works.length ? `<p class="growth-works">${item.works.map((work) => escape(text(work))).join(" / ")}</p>` : ""}</li>`).join("")}</ol>
      </section>
      ${data.groups.map((group, index) => `<section id="${escape(group.id)}" class="portfolio-section projects-section ${escape(group.id)}-section" aria-labelledby="${escape(group.id)}-heading">${sectionHeading(group.title, group.english, index + 3, group.projects.length)}<div class="project-grid">${group.projects.map(projectCard).join("")}</div></section>`).join("")}`;
    // 标题 ID 与分区的可访问名称保持对应。
    for (const section of content.querySelectorAll(".portfolio-section:not(.profile-section)")) {
      section.querySelector("h2").id = `${section.id}-heading`;
    }
    content.querySelectorAll(".project-cover img").forEach((image) => {
      image.addEventListener("error", () => {
        const cover = image.parentElement;
        cover.classList.remove("has-image");
        image.remove();
      }, { once: true });
    });
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
    const sections = [...content.querySelectorAll(".portfolio-section")];
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
  }

  function navigate(id) {
    const target = document.getElementById(id);
    if (!target || !root.contains(target)) return;
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
    enter() {
      root.scrollTop = 0;
      updateScrollState();
      document.getElementById("profile-name").tabIndex = -1;
      document.getElementById("profile-name").focus({ preventScroll: true });
    },
  };
})();
