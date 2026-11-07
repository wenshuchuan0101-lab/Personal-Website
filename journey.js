const selection = SCENE_SETTINGS.selection;
const intro = document.querySelector(".scene");
const entry = document.querySelector(".enter-scene");
const languageStar = document.querySelector(".language-star");
const fade = document.querySelector(".screen-fade");
const status = document.querySelector(".journey-status");
const quickView = document.querySelector(".quick-view");
const showcaseView = document.querySelector(".showcase-view");
const returnProfileButton = document.querySelector(".return-profile");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let language = selection.language;
let phase = "intro";

document.body.dataset.scene = phase;

function applyLanguage() {
  const labels = selection.labels[language];
  const position = window.PortfolioQuick.getPosition();
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  entry.setAttribute("aria-label", labels.enter);
  languageStar.setAttribute("aria-label", labels.language);
  languageStar.setAttribute("title", labels.language);
  languageStar.setAttribute("aria-pressed", String(language === "en"));
  returnProfileButton.textContent = labels.back;
  showcaseView.setAttribute("aria-label", labels.showcase);
  window.PortfolioQuick.setLanguage(language, position);
}

function setPhase(next) {
  phase = next;
  document.body.dataset.scene = next;
}

function animate(node, frames, milliseconds, options = {}) {
  return node.animate(frames, {
    duration: reduceMotion.matches ? Math.min(120, milliseconds) : milliseconds,
    easing: "ease-in-out",
    fill: "forwards",
    ...options,
  }).finished;
}

function showProfile() {
  showcaseView.hidden = true;
  quickView.hidden = false;
  window.PortfolioQuick.setView("profile");
  document.body.dataset.destination = "profile";
  setPhase("profile");
}

entry.addEventListener("click", async () => {
  if (phase !== "intro") return;
  setPhase("entering");
  entry.disabled = true;
  await animate(intro, [{ opacity: 1 }, { opacity: 0 }], 850, {
    delay: reduceMotion.matches ? 0 : 200,
  });
  intro.hidden = true;
  showProfile();
  await animate(quickView, [{ opacity: 0 }, { opacity: 1 }], 650);
});

languageStar.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  applyLanguage();
});

async function choose(option) {
  if (phase !== "profile") return;
  const mode = option.dataset.mode;
  if (mode !== "quick" && mode !== "showcase") return;
  setPhase("selecting");
  languageStar.disabled = true;
  quickView.querySelectorAll(".mode-option").forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-pressed", String(button === option));
  });
  option.blur();
  await animate(option, [
    { backgroundColor: "#123fce", borderColor: "#ff9b4580" },
    { backgroundColor: "#254dc9", borderColor: "#ffe3bd" },
  ], selection.revealMilliseconds);
  status.textContent = selection.labels[language].selected + " · " + selection.labels[language][mode];
  document.body.dataset.destination = mode;
  fade.style.backgroundColor = mode === "quick" ? "#f5efe4" : "#000";
  fade.hidden = false;
  setPhase("fading");
  await animate(fade, [{ opacity: 0 }, { opacity: 1 }], selection.fadeMilliseconds);
  if (mode === "quick") {
    window.PortfolioQuick.setView("quick");
  } else {
    quickView.hidden = true;
    showcaseView.hidden = false;
    returnProfileButton.focus({ preventScroll: true });
  }
  fade.hidden = true;
  languageStar.disabled = false;
  setPhase(mode);
}

quickView.addEventListener("click", (event) => {
  const option = event.target.closest(".mode-option");
  if (option) choose(option);
});
quickView.addEventListener("portfolio:profile", () => {
  if (phase === "quick") showProfile();
});
returnProfileButton.addEventListener("click", showProfile);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && phase === "showcase") showProfile();
});

applyLanguage();
