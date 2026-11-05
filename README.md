# 关于想象力的一切

单屏首页。中英文同屏显示，使用原始月亮图片。点击天空空白处会出现从右上向左下的流星，月面和文字区域不触发。停留三分钟后，天空逐渐变浅变暖，月面保留原样。刷新页面后重新从夜色开始。

点击首页进入日月选择幕。左侧太阳对应快速浏览，右侧月亮对应观赏。选中后显现图腾与细线，日月沿圆轨道旋转，选中的天体填入顶部空环，随后快速浏览渐白、观赏渐黑。快速浏览在渐白后进入内容界面，上方高饱和深蓝导航提供「个人介绍、图像影视、游戏」三个分区，点击直接切换，内容区目前预留标题位置。右上角四芒星可切换界面中英文。

选择幕使用深蓝背景，圆环和极简日月统一为银白色。外侧完整一圈的月相链位于 `assets/phase-arc.svg`，顶部正中的空环是选中日月最终转入的位置。

圆环素材以提供的第一张图为基础，用内置图像编辑工具补齐底部缺口，位于 `assets/eclipse-ring.png`。日月图形和图腾分别位于 `assets/sun.svg`、`assets/moon-option.svg` 和 `assets/totem.svg`，均可编辑。选项文案、素材路径及动画时长集中在 `settings.js` 的 `selection` 中。旋转轨迹与场景样式在 `journey.css`，交互在 `journey.js`。

圆环修补使用的提示词如下。

> Use case: precise-object-edit. This is an edit target, not merely a style reference. Repair only the missing short arc around the lower-left/bottom section of this glowing lunar-texture ring, at about 6 to 7 o'clock. Complete the ring into a continuous closed circle. Seamlessly continue the exact silver-white cratered lunar texture, variable rim thickness, grain and soft white bloom of the neighboring rim. Keep the original composition, exact center, original size and square framing, original black background and empty black center. Preserve the rest of the ring. No extra circles, no symbols, no text, no stars, no other objects. The resulting ring must have no gap at the bottom.

文案、图片路径及三分钟时长集中在 `settings.js`。字体、字号、文字位置在 `style.css`。黎明颜色在 `index.html` 的 `dawn-colors` 中。

首图位于 `assets/moon.png`。天空轮廓按照该图片在 `app.js` 的 `moonEdge` 中设置。如果换用构图不同的图片，需要同步更新图片尺寸和月亮轮廓。

英文字体使用接近参考图衬线风格的 Cormorant Garamond，并压低字形高度。中文标题使用 Noto Sans SC ExtraLight 字体子集。字体均随站点提供，许可见 `assets/Cormorant-OFL.txt` 和 `assets/Noto-OFL.txt`。
