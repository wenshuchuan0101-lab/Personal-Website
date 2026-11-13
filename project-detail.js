(() => {
  const parameters = new URLSearchParams(location.search);
  const id = parameters.get("work");
  let language = parameters.get("lang") === "en" ? "en" : "zh";
  const group = PORTFOLIO_CONTENT.groups.find((group) => group.projects.some((project) => project.id === id));
  const project = group?.projects.find((project) => project.id === id);
  const text = (value) => typeof value === "string" ? value : value?.[language] || value?.zh || "";
  const body = document.querySelector(".work-detail-body");
  const back = document.querySelector(".work-detail-back");
  const languageButton = document.querySelector(".detail-language");
  const imageViewer = document.querySelector(".detail-image-viewer");
  const originalImage = imageViewer.querySelector("img");
  let previousOverflow = "";
  let galleryObserver;
  let resizeGallery;
  let detailPage = parameters.get("page") === "2" ? 1 : 0;
  window.addEventListener("resize", () => resizeGallery?.());
  const labels = {
    zh: { back: "返回", title: "作品详情", empty: "作品展示预留区域", play: "游玩", showcase: "作品展示", promo: "宣传动画", introduction: "作品介绍", kind: "类型", tools: "工具", pages: "展示分页", concept: "概念设计", conceptGallery: "概念设计展示", whitebox: "白盒搭建", openImage: "查看原图", closeImage: "关闭图片" },
    en: { back: "Back", title: "Project details", empty: "Reserved project presentation area", play: "Play", showcase: "Showcase", promo: "Promotional Animation", introduction: "About the Project", kind: "Type", tools: "Tools", pages: "Showcase pages", concept: "Concept Design", conceptGallery: "Concept Design Showcase", whitebox: "Whitebox Build", openImage: "View original image", closeImage: "Close image" },
  };
  function imageFigure(source, title, index, eager = false) {
    const figure = document.createElement("figure");
    figure.className = "case-image";
    const button = document.createElement("button");
    button.className = "case-image-open";
    button.type = "button";
    button.dataset.imageSource = source;
    button.setAttribute("aria-label", `${labels[language].openImage} · ${title} · ${index + 1}`);
    const image = document.createElement("img");
    image.src = source;
    image.alt = `${title} · ${index + 1}`;
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    button.append(image);
    const number = document.createElement("figcaption");
    number.className = "case-image-number";
    number.textContent = String(index + 1).padStart(2, "0");
    figure.append(button, number);
    return figure;
  }
  function caseSection(kind, index, total) {
    const section = document.createElement("section");
    section.className = `case-section case-${kind}`;
    section.id = `case-${kind}`;
    section.dataset.caseSection = kind;
    const heading = document.createElement("header");
    heading.className = "case-section-heading";
    const number = document.createElement("span");
    number.className = "case-section-index";
    number.textContent = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    const title = document.createElement("h2");
    title.id = `case-${kind}-title`;
    title.textContent = labels[language][kind];
    section.setAttribute("aria-labelledby", title.id);
    heading.append(number, title);
    if (language === "zh") {
      const english = document.createElement("p");
      english.lang = "en";
      english.className = "case-section-english";
      english.textContent = labels.en[kind];
      heading.append(english);
    }
    section.append(heading);
    return section;
  }
  function renderCaseStudy(detail) {
    const total = [detail.promo?.src, detail.showcase?.length, detail.conceptGallery?.length, detail.conceptImages?.length, detail.whiteboxImages?.length].filter(Boolean).length;
    let index = 0;
    if (detail.promo?.src) {
      const section = caseSection("promo", ++index, total);
      const video = document.createElement("video");
      video.className = "case-promo-video";
      video.src = detail.promo.src;
      video.poster = detail.promo.poster || project.poster || "";
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", labels[language].promo);
      section.append(video);
      const introduction = detail.promo.introduction;
      if (introduction) {
        const article = document.createElement("article");
        article.className = "case-project-introduction";
        const label = document.createElement("p");
        label.className = "case-introduction-label";
        label.textContent = labels[language].introduction;
        const title = document.createElement("h3");
        title.textContent = text(introduction.title) || text(project.title);
        const metadata = document.createElement("dl");
        for (const [key, value] of [["kind", text(introduction.kind)], ["tools", project.tools]]) {
          const term = document.createElement("dt");
          term.textContent = `${labels[language][key]}：`;
          const definition = document.createElement("dd");
          definition.textContent = value;
          metadata.append(term, definition);
        }
        const paragraph = document.createElement("p");
        paragraph.className = "case-introduction-text";
        paragraph.textContent = text(introduction.text);
        article.append(label, title, metadata, paragraph);
        section.append(article);
      }
      body.append(section);
    }
    if (detail.showcase?.length) {
      const section = caseSection("showcase", ++index, total);
      const spreads = document.createElement("div");
      spreads.className = "case-spreads";
      detail.showcase.forEach((item, index) => {
        const spread = document.createElement("div");
        spread.className = "case-spread";
        spread.dataset.emphasis = String(Boolean(item.emphasis));
        spread.dataset.sourceName = item.sourceName || "";
        const copy = document.createElement("div");
        copy.className = "case-copy";
        const itemTitle = text(item.title);
        if (itemTitle) {
          const heading = document.createElement("h3");
          heading.className = "case-copy-title";
          heading.textContent = itemTitle;
          copy.append(heading);
        }
        if (text(item.text)) {
          const paragraph = document.createElement("p");
          paragraph.textContent = text(item.text);
          copy.append(paragraph);
        }
        spread.append(imageFigure(item.src, itemTitle || text(project.title), index, index === 0), copy);
        spreads.append(spread);
      });
      section.append(spreads);
      body.append(section);
    }
    if (detail.conceptGallery?.length) {
      const section = caseSection("conceptGallery", ++index, total);
      const gallery = document.createElement("div");
      gallery.className = "concept-accordion";
      gallery.setAttribute("role", "group");
      gallery.setAttribute("aria-label", labels[language].conceptGallery);
      const caption = document.createElement("p");
      caption.className = "concept-accordion-count";
      caption.setAttribute("aria-live", "polite");
      let active = 0;
      const buttons = [];
      const resize = () => {
        const item = detail.conceptGallery[active];
        const image = buttons[active].querySelector("img");
        const ratio = image.naturalWidth ? image.naturalWidth / image.naturalHeight : item.width / item.height;
        const width = Math.min(gallery.clientWidth * .72, innerHeight * .68 * ratio);
        gallery.style.setProperty("--concept-active-width", `${width}px`);
        gallery.style.setProperty("--concept-height", `${width / ratio}px`);
      };
      const select = (index) => {
        active = index;
        buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === active)));
        caption.textContent = `${String(active + 1).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")}`;
        resize();
      };
      detail.conceptGallery.forEach((item, index) => {
        const button = document.createElement("button");
        button.className = "concept-panel";
        button.type = "button";
        button.dataset.imageSource = item.src;
        button.setAttribute("aria-label", `${labels[language].conceptGallery} · ${index + 1} / ${detail.conceptGallery.length}`);
        const image = document.createElement("img");
        image.src = item.src;
        image.alt = `${labels[language].conceptGallery} · ${index + 1}`;
        image.width = item.width;
        image.height = item.height;
        image.decoding = "async";
        image.draggable = false;
        image.style.objectPosition = item.position || "center";
        image.addEventListener("load", () => { if (index === active) resize(); });
        button.append(image);
        button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") select(index); });
        button.addEventListener("focus", () => { if (!button.matches(":active")) select(index); });
        // 触屏首次点按展开，再次点按查看原图。
        let wasSelected = true;
        button.addEventListener("pointerdown", () => { wasSelected = active === index; });
        button.addEventListener("click", (event) => {
          if (event.detail > 0 && !wasSelected) {
            event.stopPropagation();
            select(index);
          }
        });
        button.addEventListener("keydown", (event) => {
          const next = event.key === "ArrowRight" ? (index + 1) % buttons.length
            : event.key === "ArrowLeft" ? (index - 1 + buttons.length) % buttons.length
            : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
          if (next === null) return;
          event.preventDefault();
          select(next);
          buttons[next].focus({ preventScroll: true });
        });
        buttons.push(button);
        gallery.append(button);
      });
      section.append(gallery, caption);
      body.append(section);
      select(0);
      resizeGallery = resize;
      galleryObserver = new ResizeObserver(resize);
      galleryObserver.observe(gallery);
    }
    if (detail.conceptImages?.length) {
      const section = caseSection("concept", ++index, total);
      const grid = document.createElement("div");
      grid.className = "case-concept-grid";
      detail.conceptImages.forEach((source, index) => grid.append(imageFigure(source, labels[language].concept, index)));
      section.append(grid);
      body.append(section);
    }
    if (detail.whiteboxImages?.length) {
      const section = caseSection("whitebox", ++index, total);
      const images = document.createElement("div");
      images.className = "case-whitebox-images";
      detail.whiteboxImages.forEach((source, index) => images.append(imageFigure(source, labels[language].whitebox, index)));
      section.append(images);
      body.append(section);
    }
    if (detail.paginated) renderPagination();
  }
  function renderPagination() {
    const sections = [...body.querySelectorAll(":scope > .case-section")];
    const navigation = document.createElement("nav");
    navigation.className = "case-pagination";
    navigation.setAttribute("aria-label", labels[language].pages);
    detailPage = Math.min(detailPage, sections.length - 1);
    const showPage = (index, updateHistory = false) => {
      body.querySelectorAll("video").forEach((video) => video.pause());
      detailPage = index;
      sections.forEach((section, i) => { section.hidden = i !== index; });
      [...navigation.children].forEach((button, i) => {
        if (i === index) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
      if (updateHistory) {
        const url = new URL(location.href);
        url.searchParams.set("page", String(index + 1));
        history.pushState(null, "", url);
        navigation.scrollIntoView({ block: "start" });
      }
      requestAnimationFrame(() => resizeGallery?.());
    };
    sections.forEach((section, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-controls", section.id);
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("span");
      title.textContent = labels[language][section.dataset.caseSection];
      button.append(number, title);
      button.addEventListener("click", () => showPage(index, true));
      navigation.append(button);
    });
    body.prepend(navigation);
    showPage(detailPage);
  }
  function render() {
    galleryObserver?.disconnect();
    resizeGallery = undefined;
    const words = labels[language];
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = project ? `${text(project.title)} · ${words.title}` : words.title;
    document.querySelector("#work-detail-title").textContent = project ? text(project.title) : words.title;
    document.querySelector(".work-detail-category").textContent = group ? text(group.title) : "";
    back.querySelector("span:last-child").textContent = words.back;
    back.href = project ? `./index.html?view=work&work=${encodeURIComponent(id)}&lang=${language}` : "./index.html";
    languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
    body.replaceChildren();
    const detail = project?.detail;
    const hasCaseStudy = Boolean(detail?.promo?.src || detail?.showcase?.length || detail?.conceptGallery?.length || detail?.conceptImages?.length || detail?.whiteboxImages?.length);
    document.body.dataset.detailLayout = hasCaseStudy ? "case-study" : "plain";
    document.body.dataset.detailPaginated = String(Boolean(detail?.paginated));
    imageViewer.setAttribute("aria-label", words.openImage);
    imageViewer.querySelector("button").setAttribute("aria-label", words.closeImage);
    const hasContent = detail && (hasCaseStudy || text(detail.description) || detail.images.length || detail.video || detail.posterImages.length || detail.playUrl);
    if (!hasContent) {
      const empty = document.createElement("div");
      empty.className = "detail-reserved";
      empty.setAttribute("role", "img");
      empty.setAttribute("aria-label", words.empty);
      body.append(empty);
      return;
    }
    if (text(detail.description)) {
      const description = document.createElement("p");
      description.className = "work-detail-description";
      description.textContent = text(detail.description);
      body.append(description);
    }
    if (hasCaseStudy) renderCaseStudy(detail);
    [...detail.images, ...detail.posterImages].forEach((source) => {
      const image = document.createElement("img");
      image.src = source;
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
      link.className = "work-detail-play";
      link.href = detail.playUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${words.play} ↗`;
      body.append(link);
    }
  }
  body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-image-source]");
    if (!button) return;
    originalImage.src = button.dataset.imageSource;
    originalImage.alt = button.querySelector("img").alt;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    imageViewer.showModal();
  });
  imageViewer.querySelector("button").addEventListener("click", () => imageViewer.close());
  imageViewer.addEventListener("close", () => {
    document.documentElement.style.overflow = previousOverflow;
    originalImage.removeAttribute("src");
  });
  imageViewer.addEventListener("click", (event) => {
    const rect = imageViewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageViewer.close();
  });
  languageButton.addEventListener("click", () => {
    body.querySelectorAll("video").forEach((video) => video.pause());
    language = language === "zh" ? "en" : "zh";
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    history.replaceState(null, "", url);
    render();
  });
  window.addEventListener("popstate", () => {
    body.querySelectorAll("video").forEach((video) => video.pause());
    detailPage = new URLSearchParams(location.search).get("page") === "2" ? 1 : 0;
    language = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "zh";
    render();
  });
  render();
})();
