const config = PORTFOLIO;
const modes = ["day", "night"];
const categories = Object.keys(config.works);
const state = {
  mode: config.defaultMode,
  lang: config.defaultLanguage,
  category: categories[0],
  chapter: 0,
};
const get = (id) => document.getElementById(id);
const local = (value) => value?.[state.lang] ?? value?.[config.defaultLanguage] ?? "";
const labels = () => config.labels[state.lang];

function element(tag, className, content) {
  const node = document.createElement(tag);
  node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function button(label, action) {
  const node = element("button", "", label);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function setPressed(node, active) {
  node.setAttribute("aria-pressed", String(active));
}

function switchMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  renderMode();
  syncChapter();
}

const modeButtons = modes.map((mode) => button("", () => switchMode(mode)));
const categoryButtons = categories.map((category) => button("", () => {
  if (category === state.category) return;
  state.category = category;
  state.chapter = 0;
  renderWorks();
}));
get("modes").append(...modeButtons);
get("categories").append(...categoryButtons);

function renderMode() {
  document.documentElement.dataset.mode = state.mode;
  const next = state.mode === "day" ? "night" : "day";
  get("dial").setAttribute("aria-label", labels().switchTo + labels()[next]);
  get("dial-caption").textContent = labels()[state.mode];
  modeButtons.forEach((node, index) => {
    node.textContent = labels()[modes[index]];
    setPressed(node, state.mode === modes[index]);
  });
}

function makeCard(work, index) {
  const card = element("article", "card");
  card.id = work.id;
  const visual = element("div", "visual");
  if (work.video) {
    const video = element("video", "cover");
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    if (work.cover) video.poster = work.cover;
    video.src = work.video;
    video.setAttribute("aria-label", local(work.title));
    visual.append(video);
  } else if (work.cover) {
    const image = element("img", "cover");
    image.loading = "lazy";
    image.src = work.cover;
    image.alt = local(work.coverAlt);
    visual.append(image);
  }
  const copy = element("div", "card-copy");
  copy.append(
    element("p", "card-index", String(index + 1).padStart(2, "0") + " / " + labels()[state.category]),
    element("h3", "", local(work.title)),
    element("p", "description", local(work.description)),
  );
  if (work.link) {
    const link = element("a", "action", (state.category === "games" ? labels().play : labels().watch) + " ↗");
    link.href = work.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    copy.append(link);
  } else if (!work.video) {
    copy.append(element("p", "status", labels().soon));
  }
  card.append(visual, copy);
  return card;
}

function syncChapter() {
  [...get("chapters").children].forEach((node, index) => {
    setPressed(node, index === state.chapter);
  });
  [...get("cards").children].forEach((card, index) => {
    card.hidden = state.mode === "night" && index !== state.chapter;
    if (card.hidden) card.querySelector("video")?.pause();
  });
}

function renderWorks() {
  const works = config.works[state.category];
  categoryButtons.forEach((node, index) => {
    const category = categories[index];
    node.textContent = labels()[category] + " " + String(config.works[category].length).padStart(2, "0");
    setPressed(node, category === state.category);
  });
  get("chapters").replaceChildren(...works.map((work, index) => button(
    String(index + 1).padStart(2, "0") + "  ·  " + local(work.title),
    () => {
      state.chapter = index;
      syncChapter();
    },
  )));
  get("cards").replaceChildren(...works.map(makeCard));
  syncChapter();
}

function renderLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = local(config.name) + " · " + labels().portfolio;
  const copy = {
    brand: labels().portfolio, label: labels().portfolio, name: local(config.name),
    tagline: local(config.tagline), enter: labels().enter, "works-title": labels().works,
    "index-label": labels().index, "footer-name": local(config.name), back: labels().back,
  };
  Object.entries(copy).forEach(([id, value]) => { get(id).textContent = value; });
  ["modes", "categories", "chapters"].forEach((id) => {
    get(id).setAttribute("aria-label", labels()[id]);
  });
  document.querySelectorAll("[data-lang]").forEach((node) => setPressed(node, node.dataset.lang === state.lang));
  renderMode();
  renderWorks();
}

Object.entries(config.themes).forEach(([mode, path]) => {
  document.documentElement.style.setProperty("--sky-" + mode, "url(" + JSON.stringify(path) + ")");
});
get("dial").addEventListener("click", () => switchMode(state.mode === "day" ? "night" : "day"));
document.querySelectorAll("[data-lang]").forEach((node) => {
  node.addEventListener("click", () => {
    if (state.lang === node.dataset.lang) return;
    state.lang = node.dataset.lang;
    renderLanguage();
  });
});
renderLanguage();
