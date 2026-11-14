// 修改文案、首图路径及流星的速度、间隔和轨道高度。
// 换用构图不同的首图时，需要在 app.js 中重新设置圆弧的位置和半径。
const SCENE_SETTINGS = {
  image: "./assets/hero-orbit.png",
  chinese: "关于想象力的一切",
  englishLines: ["Tread softly because you tread", "on my dreams."],
  transition: {
    milliseconds: 6200,
    swimStrength: 1,
    colors: ["#ffab4d", "#f4eee3", "#b7c9ff"],
  },
  meteor: {
    intervalMilliseconds: 420,
    flightMilliseconds: 1900,
    altitudePixels: 70,
    altitudeSpreadPixels: 140,
    sizeRange: [0.45, 1.8],
  },
  selection: {
    language: "zh",
    revealMilliseconds: 700,
    fadeMilliseconds: 2000,
    labels: {
      zh: {
        title: "选择浏览方式",
        quick: "快速浏览",
        showcase: "观赏模式",
        enter: "进入个人介绍",
        back: "返回个人介绍",
        language: "Switch to English",
        selected: "已选择",
        sections: "内容分区",
        intro: "个人介绍",
        visual: "图像影视",
        games: "游戏",
      },
      en: {
        title: "Choose your experience",
        quick: "Quick View",
        showcase: "Showcase",
        enter: "About me",
        back: "Back to About",
        language: "切换为中文",
        selected: "Selected",
        sections: "Sections",
        intro: "About",
        visual: "Images & Film",
        games: "Games",
      },
    },
  },
};
