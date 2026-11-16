// 所有空间尺寸、颜色、步行速度、可替换画面和八个入口都集中在这里。
export const CONFIG = {
  title: '梅子雨的梦',
  corridor: { width:8.4, steps:64, stepDepth:.78, stepRise:.18, stepGap:.22, treadThickness:.10, bayLength:7.1, archHeight:7.6 },
  hall: { radius:32, stretch:1.12, depthStretch:1.7, entryVestibule:12, height:60, doorRadius:26, gateScale:1.55, arcadeBays:32, arcadeLevels:1, clerestoryBays:16, museClearance:5.4, museHeight:14.5 },
  player: { eyeHeight:1.67, radius:.3, walkSpeed:3.6, cameraEaseDistance:2.34, mouseSensitivity:.0022, touchSensitivity:.0035 },
  gateInteraction: { halfWidth:2.8, frontDepth:3.2, backDepth:3.2, rearmPadding:.8 },
  materials: { structureOpacity:.22, treadOpacity:.34, doorOpacity:.28, transmission:.45, structureOpacityBoost:.16, reliefOpacity:.76, museOpacity:.92, workGateOpacity:.76, workGateGold:0xf1ead8 },
  construction: { initialSteps:8, aheadSteps:14, frameAhead:15, treadSeconds:1.4, frameSeconds:1.8, linkSeconds:1.3 },
  // 仅用于起点后方的无限下行视觉，不加入可行走区域。
  descent: { steps:8192, frames:960, startZ:0 },
  colors: { stone:0xe5e6e7, stoneShadow:0x8794b6, trim:0xd7c8a5, glow:0xe8dfca, night:0x050b20, blue:0x174d9a },
  // 留空使用接近真实夜空的暗色星点；可换成本地全景星空图片。
  artwork: { skyTexture:null },
  bloom: { strength:.36, radius:.68, threshold:1.08 },
  works: [
    // Leave broad gaps at +/-90 degrees for the two great side-chapel doors.
    { id:'yulong-dance', projectId:'yulong-dance', titleEn:'Yulong Dance', posterFocus:0.64, poster:'./assets/posters/yulong-dance.png', title:'鱼龙舞', roman:'I', angle:-148, tint:0xf4e8cb },
    { id:'hidden-edge', projectId:'cangfeng', titleEn:'Cangfeng', posterFocus:0.57, poster:'./assets/posters/hidden-edge.png', title:'藏锋', roman:'II', angle:-122, tint:0xf4e8cb },
    { id:'greenhouse', projectId:'flower-room', titleEn:'The Flower Room', posterFocus:0.52, poster:'./assets/posters/greenhouse.png', title:'花房', roman:'III', angle:-58, tint:0xf4e8cb },
    { id:'classroom', projectId:'classroom-rhapsody', titleEn:'Classroom Rhapsody', posterFocus:0.5, poster:'./assets/posters/classroom.png', title:'课堂狂想', roman:'IV', angle:-20, tint:0xf4e8cb },
    { id:'fantastical-garden', projectId:'grotesque-garden', titleEn:'Grotesque Garden', posterFocus:0.7, poster:'./assets/posters/fantastical-garden.png', title:'怪诞花园', roman:'V', angle:20, tint:0xf4e8cb },
    { id:'zephyrus', projectId:'zephyrus', titleEn:'Zephyrus', posterFocus:0.62, poster:'./assets/posters/zephyrus.png', title:'Zephyrus', roman:'VI', angle:58, tint:0xf4e8cb },
    { id:'eighth-day', projectId:'fourth-color-temperature', titleEn:'The Eighth Day', posterFocus:0.5, poster:'./assets/posters/eighth-day.png', title:'星期八', roman:'VII', angle:122, tint:0xf4e8cb },
    { id:'dreams', title:'dreams', roman:'VIII', angle:148, tint:0xf4e8cb },
  ],
};
