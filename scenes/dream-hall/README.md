# 梅子雨的梦 · 网站观赏模式

本站观赏模式的完整运行场景，可直接在静态网站中使用。主站通过 embedded=1 与同源消息连接；单独打开本目录仍可独立漫游。按键、材质、结构与八门映射在 scene.config.js，作品资料由主站 portfolio-data.js 维护。图片、扫描与生成纹理的来源见 assets/CREDITS.md。

每扇门的前后区域均先弹出是否进入的确认面板：✓ 进入，✕／Esc 取消。面板期间冻结移动；取消或返回后须离开区域才重新触发。区域尺寸与缓冲距离在 scene.config.js 的 gateInteraction 调整。
