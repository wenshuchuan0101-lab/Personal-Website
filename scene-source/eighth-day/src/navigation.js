// Circle-versus-AABB collision, with a spatial grid and short sliding steps.
// The camera can look around but cannot orbit, zoom, fly, or cross the room boundary.
export function createNavigator(boxes, {bounds, radius, speed}, start) {
  const cellSize = 2;
  const grid = new Map();
  const cell = value => Math.floor(value / cellSize);
  for (const box of boxes) {
    for (let x = cell(box.minX - radius); x <= cell(box.maxX + radius); x++) {
      for (let z = cell(box.minZ - radius); z <= cell(box.maxZ + radius); z++) {
        const key = `${x},${z}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(box);
      }
    }
  }
  const canStand = (x, z) => {
    if (x < bounds.minX + radius || x > bounds.maxX - radius || z < bounds.minZ + radius || z > bounds.maxZ - radius) return false;
    return !(grid.get(`${cell(x)},${cell(z)}`) || []).some(box => {
      const dx = x - Math.max(box.minX, Math.min(x, box.maxX));
      const dz = z - Math.max(box.minZ, Math.min(z, box.maxZ));
      return dx * dx + dz * dz < radius * radius;
    });
  };
  let x = start.x, z = start.z;
  if (!canStand(x,z)) throw new Error('办公室初始位置与家具重叠，请调整相机位置。');
  return {
    canStand,
    get position() { return {x,z}; },
    step(dx, dz, seconds) {
      const length = Math.hypot(dx, dz);
      if (!length || seconds <= 0) return this.position;
      const distance = speed * Math.min(seconds, .1);
      dx = dx / length * distance;
      dz = dz / length * distance;
      const steps = Math.max(1, Math.ceil(distance / (radius * .35)));
      for (let i = 0; i < steps; i++) {
        if (canStand(x + dx / steps, z)) x += dx / steps;
        if (canStand(x, z + dz / steps)) z += dz / steps;
      }
      return this.position;
    },
  };
}
