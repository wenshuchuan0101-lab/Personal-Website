# 个人作品集 · Personal Portfolio

这是静态网站框架，包含三个游戏舱位和三个视频位置。双语文案和封面均为可替换的占位内容。

## 编辑内容

打开 `content.js`。在 GitHub 上也可以点开文件，再点铅笔图标编辑。

| 要替换的内容 | 编辑位置 |
| --- | --- |
| 姓名、标语、界面文字 | `name`、`tagline`、`labels`，分别填写 `zh` 和 `en` |
| 白天和夜晚的背景 | 把图片上传到 `assets/`，再修改 `themes.day` 或 `themes.night` |
| 游戏和视频的标题、简介、封面 | 修改 `works.games` 或 `works.videos` 对应的 `title`、`description` 和 `cover` |
| 封面替代文字 | 用 `coverAlt` 填写画面中重要的内容，纯装饰封面可留空 |
| 游戏试玩 | 在对应游戏的 `link` 填试玩网页地址，站内试玩可以填 `./games/你的游戏/index.html` |
| 视频 | 在 `video` 填浏览器可播放的视频文件地址，例如 `./assets/reel.mp4`。如果是视频平台的观看页，把地址填到 `link` |
| 默认语言和模式 | 修改 `defaultLanguage`（`zh` 或 `en`）及 `defaultMode`（`day` 或 `night`） |

示例图片都位于 `assets/`，可以直接覆盖同名文件，也可以上传 JPG、PNG、WebP 或 SVG 后修改路径。作品按数组中的顺序展示，调整条目的位置即可改顺序。试玩和视频地址留空时显示「素材待更新」。颜色和字体可以在 `style.css` 顶部修改。

## 预览与发布

- 本地打开 `index.html` 即可预览，完整的游戏试玩包建议通过网页服务器或 GitHub Pages 测试。
- 在 GitHub 仓库打开 **Settings → Pages**，将来源设为 **Deploy from a branch**，选择 **main** 和 **/(root)**，然后保存。以后提交到这个分支的更新会由 GitHub Pages 发布。
- 站内素材使用以 `./` 开头的相对路径，并保持文件名大小写一致。
