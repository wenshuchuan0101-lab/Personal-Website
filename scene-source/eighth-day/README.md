# 星期八：办公室展示版

由用户提供的「办公室 ThreeJS 阴天版」独立复制制作。原工程未修改；`public/data/office.json` 与原始导出数据逐字节一致，保留原家具、建筑、光照和材质。移除了多镜头跳转、地图、拍照、特效调节、轨道缩放和飞行操作。

- 点击场景后，WASD 行走，右键拖动转头；触屏拖动可转头。Esc 将键盘焦点交回作品选择页。
- 相机固定在人眼高度，通过身体圆柱与原场景物体的包围盒碰撞。窄步进、墙边滑动、房间边界共同防止穿越；只允许主办公区内行走。
- `src/office-settings.js`：速度、碰撞半径、视点高度、边界、转头范围和初始相机。
- `src/navigation.js`：独立碰撞和移动逻辑。
- `src/main.js`：Three.js 场景、原始实例、光照及输入。
- `src/style.css`、`index.html`：控制提示和加载状态。
- 场景静止时停止重复渲染；作品轮盘打开时暂停输入，离开作品时卸载 WebGL。无法运行 WebGL 时，作品选择页继续使用静态海报。

安装与构建（在本目录执行）：

```sh
npm install
npm run build
```

生成目录为仓库的 `scenes/eighth-day/`，仅清理并重建该目录。该目录与主网站一起由 GitHub Pages 静态托管，资源全部使用相对路径，无需本机 5190 服务。

主网站 `portfolio-data.js` 的 `liveScene` 控制嵌入地址，`poster` 控制加载前及不支持 WebGL 时的静态海报。保留旧作品 ID `fourth-color-temperature` 以兼容已有链接；显示名称已统一为「星期八 / The Eighth Day」。

Three.js 使用 MIT 许可，见 `Three.js-LICENSE.txt`，构建时同样复制到发布目录。
