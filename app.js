const settings = SCENE_SETTINGS;
const image = document.querySelector(".moon-image");
const scene = document.querySelector(".scene");
const canvas = document.querySelector(".meteors");
const context = canvas.getContext("2d");
const chinese = document.querySelector(".chinese");
const english = document.querySelector(".english");

image.src = settings.image;
chinese.textContent = settings.chinese;
document.title = settings.chinese;
english.replaceChildren();
settings.englishLines.forEach((line, index) => {
  if (index > 0) english.append(document.createElement("br"));
  english.append(document.createTextNode(line));
});

// 首图的原始坐标。轮廓沿月亮边缘略向天空内收，避免特效覆盖月面。
const imageSize = { width: 1671, height: 941 };
const moonEdge = [
  [0, 448], [50, 447], [100, 449], [150, 451], [200, 456],
  [250, 461], [300, 468], [350, 476], [400, 485], [450, 495],
  [500, 506], [550, 519], [600, 533], [650, 548], [700, 565],
  [750, 582], [800, 602], [850, 623], [900, 645], [950, 669],
  [1000, 696], [1050, 724], [1100, 755], [1150, 788], [1200, 823],
  [1250, 861], [1300, 902], [1345, 941],
];
const skyOutline = [
  "M 0 0",
  "H " + imageSize.width,
  "V " + imageSize.height,
  ...moonEdge.toReversed().map(([x, y]) => "L " + x + " " + y),
  "Z",
].join(" ");
const skyPath = new Path2D(skyOutline);
document.getElementById("dawn-sky").setAttribute("d", skyOutline);

let geometry;
let meteors = [];
let meteorFrame = null;

function resize() {
  const bounds = scene.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.max(bounds.width / imageSize.width, bounds.height / imageSize.height);
  geometry = {
    scale,
    offsetX: (bounds.width - imageSize.width * scale) / 2,
    offsetY: (bounds.height - imageSize.height * scale) / 2,
    pixelRatio,
  };
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  // 尺寸变化后清理旧轨迹，后续点击采用新的图片坐标。
  meteors = [];
}

function drawMeteors(now) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  const { scale, offsetX, offsetY, pixelRatio } = geometry;
  context.save();
  context.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, offsetX * pixelRatio, offsetY * pixelRatio);
  context.clip(skyPath);
  meteors = meteors.filter((meteor) => now - meteor.started < meteor.duration);
  meteors.forEach((meteor) => {
    const progress = (now - meteor.started) / meteor.duration;
    const x = meteor.x + (150 - progress * 400) / scale;
    const y = meteor.y + (-150 + progress * 400) / scale;
    const tail = 105 / scale;
    const glow = context.createLinearGradient(x, y, x + tail, y - tail);
    glow.addColorStop(0, "#fff9e9");
    glow.addColorStop(0.15, "#d5e9ffc0");
    glow.addColorStop(1, "#c8e3ff00");
    context.globalAlpha = Math.sin(Math.PI * progress);
    context.strokeStyle = glow;
    context.lineWidth = 1.6 / scale;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + tail, y - tail);
    context.stroke();
    context.fillStyle = "#fffdf0";
    context.beginPath();
    context.arc(x, y, 1.4 / scale, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
  meteorFrame = meteors.length ? requestAnimationFrame(drawMeteors) : null;
}

scene.addEventListener("click", (event) => {
  if (event.target.closest(".words")) return;
  const bounds = scene.getBoundingClientRect();
  const { scale, offsetX, offsetY } = geometry;
  const x = (event.clientX - bounds.left - offsetX) / scale;
  const y = (event.clientY - bounds.top - offsetY) / scale;
  // 恢复单位坐标后检测同一片天空，月面点击不会触发流星。
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (!context.isPointInPath(skyPath, x, y)) return;
  meteors.push({ x, y, started: performance.now(), duration: 1100 });
  meteors = meteors.slice(-12);
  if (meteorFrame === null) meteorFrame = requestAnimationFrame(drawMeteors);
});
window.addEventListener("resize", resize);
resize();

const dawnStarted = performance.now();
const dawnDuration = Math.max(1, settings.dawnSeconds) * 1000;
function updateDawn(now) {
  const progress = Math.min(1, (now - dawnStarted) / dawnDuration);
  document.documentElement.style.setProperty("--dawn-progress", progress);
  // 黎明时同步加深文字，保持淡色天空上的可读性。
  const night = [222, 231, 241];
  const dawn = [48, 55, 74];
  const ink = night.map((channel, index) => Math.round(channel + (dawn[index] - channel) * progress));
  document.documentElement.style.setProperty("--ink", ink.join(", "));
  if (progress < 1) requestAnimationFrame(updateDawn);
}
requestAnimationFrame(updateDawn);
