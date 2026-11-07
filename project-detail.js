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
  const labels = { zh: { back: "返回", title: "作品详情", empty: "作品展示预留区域", play: "游玩" }, en: { back: "Back", title: "Project details", empty: "Reserved project presentation area", play: "Play" } };
  function render() {
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
    const hasContent = detail && (text(detail.description) || detail.images.length || detail.video || detail.posterImages.length || detail.playUrl);
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
  languageButton.addEventListener("click", () => {
    body.querySelectorAll("video").forEach((video) => video.pause());
    language = language === "zh" ? "en" : "zh";
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    history.replaceState(null, "", url);
    render();
  });
  render();
})();
