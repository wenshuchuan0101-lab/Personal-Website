# 关于想象力的一切

单屏首页。中英文同屏显示，使用原始月亮图片。点击天空空白处会出现从右上向左下的流星，月面和文字区域不触发。停留三分钟后，天空逐渐变浅变暖，月面保留原样。刷新页面后重新从夜色开始。

文案、图片路径及三分钟时长集中在 `settings.js`。字体、字号、文字位置在 `style.css`。黎明颜色在 `index.html` 的 `dawn-colors` 中。

首图位于 `assets/moon.png`。天空轮廓按照该图片在 `app.js` 的 `moonEdge` 中设置。如果换用构图不同的图片，需要同步更新图片尺寸和月亮轮廓。

英文字体 Barlow Condensed ExtraLight，中文标题使用 Noto Sans SC ExtraLight 字体子集。字体均随站点提供，许可见 `assets/Barlow-OFL.txt` 和 `assets/Noto-OFL.txt`。
