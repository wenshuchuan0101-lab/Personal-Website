// 在这里修改网站的文案、媒体路径和作品顺序。
const PORTFOLIO = {
  defaultMode: "night",
  defaultLanguage: "zh",
  name: { zh: "你的名字", en: "Your Name" },
  tagline: { zh: "昼长而梦远，和远方有关的一切", en: "Long days, distant dreams, and everything far away." },
  themes: {
    day: "./assets/day.svg",
    night: "./assets/night.svg",
  },
  labels: {
    zh: {
      portfolio: "个人作品集", enter: "探索作品", works: "作品档案",
      index: "作品索引", day: "快速预览", night: "观赏模式",
      games: "游戏", videos: "视频", play: "开始试玩",
      watch: "打开视频", soon: "素材待更新", back: "返回顶部 ↑",
      switchTo: "切换至", categories: "作品分类", modes: "浏览模式", chapters: "作品导航",
    },
    en: {
      portfolio: "Personal Portfolio", enter: "Explore the work", works: "Selected Work",
      index: "Project Index", day: "Quick View", night: "Showcase",
      games: "Games", videos: "Videos", play: "Play demo",
      watch: "Open video", soon: "Media pending", back: "Back to top ↑",
      switchTo: "Switch to ", categories: "Project categories", modes: "View mode", chapters: "Project navigation",
    },
  },
  works: {
    games: [
      {
        id: "game-01",
        title: { zh: "游戏舱 01", en: "Game Bay 01" },
        description: { zh: "在这里填写第一款游戏的简介、玩法和你的职责。", en: "Add the first game's premise, gameplay, and your role here." },
        cover: "./assets/game-01.svg",
        coverAlt: { zh: "", en: "" },
        link: "",
      },
      {
        id: "game-02",
        title: { zh: "游戏舱 02", en: "Game Bay 02" },
        description: { zh: "在这里填写第二款游戏的简介、玩法和你的职责。", en: "Add the second game's premise, gameplay, and your role here." },
        cover: "./assets/game-02.svg",
        coverAlt: { zh: "", en: "" },
        link: "",
      },
      {
        id: "game-03",
        title: { zh: "游戏舱 03", en: "Game Bay 03" },
        description: { zh: "在这里填写第三款游戏的简介、玩法和你的职责。", en: "Add the third game's premise, gameplay, and your role here." },
        cover: "./assets/game-03.svg",
        coverAlt: { zh: "", en: "" },
        link: "",
      },
    ],
    videos: [
      {
        id: "video-01",
        title: { zh: "视频作品 01", en: "Video Project 01" },
        description: { zh: "在这里填写第一支视频的简介和制作分工。", en: "Add the first video's description and production credits here." },
        cover: "./assets/video-01.svg",
        coverAlt: { zh: "", en: "" },
        video: "",
        link: "",
      },
      {
        id: "video-02",
        title: { zh: "视频作品 02", en: "Video Project 02" },
        description: { zh: "在这里填写第二支视频的简介和制作分工。", en: "Add the second video's description and production credits here." },
        cover: "./assets/video-02.svg",
        coverAlt: { zh: "", en: "" },
        video: "",
        link: "",
      },
      {
        id: "video-03",
        title: { zh: "视频作品 03", en: "Video Project 03" },
        description: { zh: "在这里填写第三支视频的简介和制作分工。", en: "Add the third video's description and production credits here." },
        cover: "./assets/video-03.svg",
        coverAlt: { zh: "", en: "" },
        video: "",
        link: "",
      },
    ],
  },
};
