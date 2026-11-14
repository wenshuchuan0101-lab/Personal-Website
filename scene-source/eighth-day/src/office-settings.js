// 展示版配置。修改这里后运行 npm run build；原办公室工程保持独立。
export const OFFICE_SETTINGS = {
  speed: 2.6, // 米 / 秒；斜向移动不会加速。
  eyeHeight: 1.68,
  radius: .28,
  bodyBottom: .18,
  bodyTop: 1.9,
  // 主办公室内侧边界，给窗框和相机近裁面留出距离。
  bounds: { minX: -119.55, maxX: 6.55, minZ: -51.55, maxZ: 4.55 },
  lookSensitivity: .0025,
  maxPitch: Math.PI * .36,
  cameraName: 'VIEW_Endless_Aisle',
};
