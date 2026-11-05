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

// 首图的原始尺寸和天体边缘。流星轨道与该圆弧同心。
const imageSize = { width: 1698, height: 926 };
const horizon = { x: -349.2, y: 4869.1, radius: 4504.7 };

function angleAtX(x, radius) {
  const ratio = Math.max(-1, Math.min(1, (x - horizon.x) / radius));
  return Math.asin(ratio) - Math.PI / 2;
}

// 略向天空内收，确保流星不会覆盖月面。
const skyRadius = horizon.radius + 4;
const skyPath = new Path2D();
skyPath.moveTo(0, 0);
skyPath.lineTo(imageSize.width, 0);
skyPath.arc(horizon.x, horizon.y, skyRadius, angleAtX(imageSize.width, skyRadius), angleAtX(0, skyRadius), true);
skyPath.closePath();

let geometry;
let meteors = [];
let meteorFrame = null;

function resize() {
  if (scene.hidden) return;
  const bounds = scene.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.max(bounds.width / imageSize.width, bounds.height / imageSize.height);
  geometry = {
    scale,
    offsetX: (bounds.width - imageSize.width * scale) / 2,
    offsetY: (bounds.height - imageSize.height * scale) / 2,
    pixelRatio,
    width: bounds.width,
  };
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  meteors = [];
}

function drawMeteors(now) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (scene.hidden) {
    meteors = [];
    meteorFrame = null;
    return;
  }
  const { scale, offsetX, offsetY, pixelRatio } = geometry;
  context.save();
  context.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, offsetX * pixelRatio, offsetY * pixelRatio);
  context.clip(skyPath);
  meteors = meteors.filter((meteor) => now - meteor.started < meteor.duration);
  meteors.forEach((meteor) => {
    const progress = (now - meteor.started) / meteor.duration;
    const headX = meteor.startX + (meteor.endX - meteor.startX) * progress;
    const tailX = headX - meteor.tailPixels / scale;
    const headAngle = angleAtX(headX, meteor.radius);
    const tailAngle = angleAtX(tailX, meteor.radius);
    const headY = horizon.y + Math.sin(headAngle) * meteor.radius;
    const tailY = horizon.y + Math.sin(tailAngle) * meteor.radius;
    const glow = context.createLinearGradient(tailX, tailY, headX, headY);
    glow.addColorStop(0, "#b9d6ff00");
    glow.addColorStop(.8, "#dceaffad");
    glow.addColorStop(1, "#fff9ec");
    context.globalAlpha = meteor.brightness * Math.min(1, progress * 8, (1 - progress) * 8);
    context.shadowColor = "#a6caffb0";
    context.shadowBlur = 7 * meteor.size * pixelRatio;
    context.strokeStyle = glow;
    context.lineWidth = 1.6 * meteor.size / scale;
    context.lineCap = "round";
    context.beginPath();
    context.arc(horizon.x, horizon.y, meteor.radius, tailAngle, headAngle);
    context.stroke();
    context.fillStyle = "#fffdf2";
    context.beginPath();
    context.arc(headX, headY, 1.4 * meteor.size / scale, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
  meteorFrame = meteors.length ? requestAnimationFrame(drawMeteors) : null;
}

function emitMeteor() {
  if (scene.hidden || document.hidden) return;
  const { scale, offsetX, width } = geometry;
  const [minimumSize, maximumSize] = settings.meteor.sizeRange;
  const size = minimumSize + Math.random() * (maximumSize - minimumSize);
  const altitude = settings.meteor.altitudePixels + Math.random() * settings.meteor.altitudeSpreadPixels;
  meteors.push({
    startX: -offsetX / scale - 80 / scale,
    endX: (width - offsetX) / scale + 180 / scale,
    radius: horizon.radius + altitude / scale,
    started: performance.now(),
    duration: settings.meteor.flightMilliseconds * (.8 + Math.random() * .55),
    size,
    tailPixels: 160 * size * (.7 + Math.random() * .6),
    brightness: .5 + Math.random() * .5,
  });
  meteors = meteors.slice(-16);
  if (meteorFrame === null) meteorFrame = requestAnimationFrame(drawMeteors);
}

scene.addEventListener("click", (event) => {
  const overText = [chinese, english].some((node) => {
    const bounds = node.getBoundingClientRect();
    return event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  });
  if (overText) return;
  const bounds = scene.getBoundingClientRect();
  const { scale, offsetX, offsetY } = geometry;
  const x = (event.clientX - bounds.left - offsetX) / scale;
  const y = (event.clientY - bounds.top - offsetY) / scale;
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (context.isPointInPath(skyPath, x, y)) emitMeteor();
});
window.addEventListener("resize", resize);
resize();
function scheduleMeteor() {
  if (scene.hidden) return;
  emitMeteor();
  const delay = settings.meteor.intervalMilliseconds * (.45 + Math.random() * 1.2);
  setTimeout(scheduleMeteor, delay);
}
setTimeout(scheduleMeteor, 250);
