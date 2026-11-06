const selection = SCENE_SETTINGS.selection;
const intro = document.querySelector(".scene");
const entry = document.querySelector(".enter-scene");
const chooser = document.querySelector(".choice-scene");
const options = [...document.querySelectorAll(".mode-option")];
const languageStar = document.querySelector(".language-star");
const fade = document.querySelector(".screen-fade");
const status = document.querySelector(".journey-status");
const quickView = document.querySelector(".quick-view");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let language = selection.language;
let phase = "intro";

document.querySelector(".phase-arc").src = selection.phases;
document.body.dataset.scene = phase;

function applyLanguage() {
  const labels = selection.labels[language];
  const quickPosition = window.PortfolioQuick.getPosition();
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.getElementById("choice-title").textContent = labels.title;
  entry.setAttribute("aria-label", labels.enter);
  options.forEach((option) => {
    const label = labels[option.dataset.mode];
    option.querySelector(".choice-label").textContent = label;
    option.setAttribute("aria-label", label);
  });
  languageStar.setAttribute("aria-label", labels.language);
  languageStar.setAttribute("title", labels.language);
  languageStar.setAttribute("aria-pressed", String(language === "en"));
  quickView.setAttribute("aria-label", labels.quick);
  window.PortfolioQuick.setLanguage(language, quickPosition);
}

function setPhase(next) {
  phase = next;
  document.body.dataset.scene = next;
}

function duration(milliseconds) {
  return reduceMotion.matches ? Math.min(120, milliseconds) : milliseconds;
}

function animate(node, frames, milliseconds, options = {}) {
  return node.animate(frames, {
    duration: duration(milliseconds),
    easing: "ease-in-out",
    fill: "forwards",
    ...options,
  }).finished;
}

entry.addEventListener("click", async () => {
  if (phase !== "intro") return;
  setPhase("entering");
  entry.disabled = true;
  await animate(intro, [{ opacity: 1 }, { opacity: 0 }], 850, {
    delay: reduceMotion.matches ? 0 : 350,
  });
  intro.hidden = true;
  chooser.hidden = false;
  await animate(chooser, [{ opacity: 0 }, { opacity: 1 }], 750);
  options.forEach((option) => { option.disabled = false; });
  setPhase("choice");
  // 键盘进入时移动焦点，鼠标及触屏进入时保持画面无焦点框。
  if (document.activeElement === entry) options[0].focus({ preventScroll: true });
});

languageStar.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  applyLanguage();
});

async function choose(option) {
  if (phase !== "choice") return;
  setPhase("selecting");
  options.forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-pressed", String(button === option));
  });
  option.blur();
  await animate(option, [
    { backgroundColor: "rgba(255, 215, 168, 0)", borderColor: "#d6b99d" },
    { backgroundColor: "rgba(255, 215, 168, .1)", borderColor: "#ffddb4" },
  ], selection.revealMilliseconds);
  const mode = option.dataset.mode;
  document.body.dataset.destination = mode;
  status.textContent = selection.labels[language].selected + " · " + selection.labels[language][mode];
  fade.style.backgroundColor = mode === "quick" ? "#faf8f2" : "#000";
  fade.hidden = false;
  setPhase("fading");
  await animate(fade, [{ opacity: 0 }, { opacity: 1 }], selection.fadeMilliseconds, {
    delay: reduceMotion.matches ? 0 : 500,
  });
  chooser.hidden = true;
  if (mode === "quick") {
    quickView.hidden = false;
    fade.hidden = true;
    window.PortfolioQuick.enter();
  }
  setPhase(mode);
}
options.forEach((option) => option.addEventListener("click", () => choose(option)));

applyLanguage();
